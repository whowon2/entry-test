import { Hono } from "hono";
import { SendMessageUseCase } from "./send-message-use-case";
import { auth } from "../lib/auth";
import { TicketsRepository } from "./tickets.repository";

export const ticketsController = new Hono();

const ticketsRepository = new TicketsRepository();
const ticketsService = new SendMessageUseCase(ticketsRepository);

ticketsController.get("/", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = session.user.id;

  const userTickets = await ticketsRepository.findAll({ userId });

  return c.json(userTickets);
});
