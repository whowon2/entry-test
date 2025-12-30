import { Hono } from "hono";
import { upgradeWebSocket } from "hono/cloudflare-workers";

export const socket = new Hono();

socket.get(
  "/",
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        ws.send("Hello from server!");
      },
      onClose: () => {
        console.log("Connection closed");
      },
    };
  }),
);
