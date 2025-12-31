import { asc, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { messages, tickets } from "../lib/db/schema";

export class TicketsRepository {
  async findById(input: { ticketId: string }) {
    return await db.query.tickets.findFirst({
      where: eq(tickets.id, input.ticketId),
    });
  }
  async insertMessage(input: {
    ticketId: string;
    content: string;
    role: "user" | "system" | "model";
  }) {
    return await db.insert(messages).values(input);
  }

  async getHistory(input: { ticketId: string; limit: number }) {
    return await db.query.messages.findMany({
      where: eq(messages.ticketId, input.ticketId),
      orderBy: [asc(messages.createdAt)],
      limit: 15,
    });
  }

  async findAll(input: { userId: string }) {
    return await db.query.tickets.findMany({
      where: eq(tickets.userId, input.userId),
    });
  }
}
