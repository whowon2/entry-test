import { Hono } from "hono";
import { ChatService } from "./services/chat-service";
import { auth } from "./lib/auth";
import { eq } from "drizzle-orm";

export const ticketsController = new Hono();

const chatService = new ChatService();

ticketsController.get("/", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = session.user.id;

  const userTickets = await chatService.getTickets(userId);

  return c.json(userTickets);
});
