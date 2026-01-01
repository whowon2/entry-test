import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { tickets } from "../lib/db/schemas/ticket";
import { SYSTEM_INSTRUCTION } from "../lib/prompt";
import { transferTool } from "../lib/transfer-tool";
import { TicketsRepository } from "./tickets.repository";

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export class SendMessageUseCase {
  constructor(private readonly ticketRepo: TicketsRepository) {}

  async execute(userId: string, userContent: string, ticketId?: string) {
    let currentTicketId = ticketId;

    if (!currentTicketId) {
      const [newTicket] = await db
        .insert(tickets)
        .values({ userId, status: "OPEN" })
        .$returningId();

      currentTicketId = newTicket.id;
    } else {
      const ticket = await this.ticketRepo.findById({
        ticketId: currentTicketId,
      });

      if (!ticket || ticket.status !== "OPEN") {
        return { status: "CLOSED", message: "This support session is closed." };
      }
    }

    await this.ticketRepo.insertMessage({
      ticketId: currentTicketId,
      content: userContent,
      role: "user",
    });

    const history = await this.ticketRepo.getHistory({
      ticketId: currentTicketId,
      limit: 15,
    });

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [transferTool] }], // Note the nesting
      },
      contents: [
        ...history.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        { role: "user", parts: [{ text: userContent }] },
      ],
    });

    const candidate = response.candidates?.[0];
    const functionCallPart = candidate?.content?.parts?.find(
      (part) => part.functionCall,
    );

    if (functionCallPart && functionCallPart.functionCall) {
      const { department, summary } = functionCallPart.functionCall.args as any;

      // Update Ticket
      await db
        .update(tickets)
        .set({
          status: "TRANSFERRED",
          department: department,
          summary: summary,
        })
        .where(eq(tickets.id, currentTicketId));

      const transferMsg = `Transferring to ${department}. Summary: ${summary}`;

      await this.ticketRepo.insertMessage({
        content: transferMsg,
        role: "system",
        ticketId: currentTicketId,
      });

      return {
        ticketId: currentTicketId,
        role: "system",
        content: transferMsg,
        action: "TRANSFER",
        meta: { department, summary },
      };
    } else {
      // Normal Text Response
      const aiText =
        candidate?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't generate a response.";

      await this.ticketRepo.insertMessage({
        ticketId: currentTicketId,
        role: "model",
        content: aiText,
      });

      return {
        ticketId: currentTicketId,
        role: "model",
        content: aiText,
        action: "REPLY",
      };
    }
  }
}
