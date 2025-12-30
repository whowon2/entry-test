import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { messagesController } from "./controller";
import { socket } from "./socket";

const app = new Hono();

app.use("/api/*", cors());
app.use(logger());

app.route("/api/messages", messagesController);

app.route("/api/ws", socket);

export default {
  port: 3001,
  fetch: app.fetch,
};
