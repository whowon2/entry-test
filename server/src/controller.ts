import { Hono } from "hono";
import { ChatService } from "./services/chat-service";

export const messagesController = new Hono();

const chatService = new ChatService();

messagesController.post("/", async (c) => {
  const body = await c.req.json();
  const userId = "some-user-id-from-auth-session"; // Replace with actual Auth ID

  // Expect { message: "Hello", ticketId: "optional-uuid" } from frontend
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
