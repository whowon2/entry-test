import {
  FunctionDeclarationsTool,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import { eq, asc } from "drizzle-orm";
import { tickets } from "../lib/db/schemas/ticket";
import { db } from "../lib/db";
import { messages } from "../lib/db/schemas/message";
import { transferTool } from "../lib/transfer-tool";
import { SYSTEM_INSTRUCTION } from "../lib/prompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    // 4. Call Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [transferTool],
    });

    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(userContent);

    const response = result.response;
    const functionCall = response.functionCalls()?.[0];

    if (functionCall) {
      const { department, summary } = functionCall.args as any;

      // Update Ticket
      await db
        .update(tickets)
        .set({
          status: "TRANSFERRED",
          department: department,
          summary: summary,
        })
        .where(eq(tickets.id, currentTicketId));

      // Save System Message
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
      const aiText = response.text();

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
}
