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
import { user } from "./session";
import { messages } from "./message";

export const tickets = mysqlTable(
  "tickets",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["OPEN", "TRANSFERRED", "CLOSED"])
      .default("OPEN")
      .notNull(),
    department: mysqlEnum("department", [
      "SALES",
      "SUPPORT",
      "FINANCIAL",
      "GENERAL",
    ]),
    summary: text("summary"),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ticket_user_idx").on(table.userId),
    index("ticket_status_idx").on(table.status),
  ],
);

export const ticketRelations = relations(tickets, ({ one, many }) => ({
  user: one(user, {
    fields: [tickets.userId],
    references: [user.id],
  }),
  messages: many(messages),
}));
