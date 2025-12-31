import { Hono } from "hono";
import { ChatService } from "./services/chat-service";
import { auth } from "./lib/auth";

export const messagesController = new Hono();

const chatService = new ChatService();

messagesController.post("/", async (c) => {
  const body = await c.req.json();

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = session.user.id;

  const response = await chatService.sendMessage(
    userId,
    body.message,
    body.ticketId,
  );

  return c.json(response);
});

messagesController.get("/:ticketId", async (c) => {
  const ticketId = c.req.param("ticketId");

  const history = await chatService.getHistory(ticketId);

  return c.json(history);
});
