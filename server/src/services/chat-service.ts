import { eq, asc, desc } from "drizzle-orm";
import { tickets } from "../lib/db/schemas/ticket";
import { db } from "../lib/db";
import { messages } from "../lib/db/schemas/message";
import { transferTool } from "../lib/transfer-tool";
import { SYSTEM_INSTRUCTION } from "../lib/prompt";
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export class ChatService {
  async sendMessage(userId: string, userContent: string, ticketId?: string) {
    let currentTicketId = ticketId;

    if (!currentTicketId) {
      const [newTicket] = await db
        .insert(tickets)
        .values({ userId, status: "OPEN" })
        .$returningId();
      currentTicketId = newTicket.id;
    } else {
      const ticket = await db.query.tickets.findFirst({
        where: eq(tickets.id, currentTicketId),
      });
      if (!ticket || ticket.status !== "OPEN") {
        return { status: "CLOSED", message: "This support session is closed." };
      }
    }

    await db.insert(messages).values({
      ticketId: currentTicketId,
      role: "user",
      content: userContent,
    });

    const history = await db.query.messages.findMany({
      where: eq(messages.ticketId, currentTicketId),
      orderBy: [asc(messages.createdAt)],
      limit: 15,
    });

    console.log(userContent);

    // 4. Call Gemini
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-lite",
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

    // 5. Parse Response (New SDK Structure)
    // The new SDK often returns function calls in 'candidates[0].content.parts'
    const candidate = response.candidates?.[0];
    const functionCallPart = candidate?.content?.parts?.find(
      (part) => part.functionCall,
    );

    if (functionCallPart && functionCallPart.functionCall) {
      // Extract arguments
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

      await db.insert(messages).values({
        ticketId: currentTicketId,
        role: "system",
        content: transferMsg,
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

      await db.insert(messages).values({
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
  async getHistory(ticketId: string) {
    return await db.query.messages.findMany({
      where: eq(messages.ticketId, ticketId),
      orderBy: [asc(messages.createdAt)],
    });
  }

  async getTickets(userId: string) {
    return await db.query.tickets.findMany({
      where: eq(tickets.userId, userId),
      orderBy: [desc(tickets.createdAt)],
    });
  }
}
