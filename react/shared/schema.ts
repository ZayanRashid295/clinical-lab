import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Updated for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Cases table
export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  specialty: varchar("specialty").notNull(),
  difficulty: varchar("difficulty").notNull(),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;
