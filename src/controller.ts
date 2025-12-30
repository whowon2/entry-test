import { Hono } from "hono";

export const messages = new Hono();

messages.get("/", (c) => c.json("list messages"));
messages.post("/", (c) => c.json("receive and send message", 201));
