import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { messagesController } from "./controller";
import { socket } from "./socket";
import { auth } from "./lib/auth";

const app = new Hono();

app.use(logger());

app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/api/messages", messagesController);

app.route("/api/ws", socket);

export default {
  port: 3001,
  fetch: app.fetch,
};
