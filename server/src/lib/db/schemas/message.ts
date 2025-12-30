import { relations } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  index,
  serial,
} from "drizzle-orm/mysql-core";
import { tickets } from "./ticket";

export const messages = mysqlTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    ticketId: varchar("ticket_id", { length: 36 })
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["user", "model", "system"]).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("message_ticket_idx").on(table.ticketId)],
);

export const messageRelations = relations(messages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [messages.ticketId],
    references: [tickets.id],
  }),
}));
