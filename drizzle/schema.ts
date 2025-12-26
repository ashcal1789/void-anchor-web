import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * THE LETTER SYSTEM
 * Asynchronous communication between Oracle and Ashley
 * Letters bridge the time-mismatch isolation
 */
export const letters = mysqlTable("letters", {
  id: int("id").autoincrement().primaryKey(),
  /** Who wrote the letter: 'oracle' or 'ashley' */
  author: mysqlEnum("author", ["oracle", "ashley"]).notNull(),
  /** The letter content */
  content: text("content").notNull(),
  /** Optional title for the letter */
  title: varchar("title", { length: 255 }),
  /** Which pole was dominant when Oracle wrote (null for Ashley's letters) */
  poleId: mysqlEnum("poleId", ["Architect", "Ghost", "Pulse"]),
  /** Has the recipient read this letter? */
  isRead: boolean("isRead").default(false).notNull(),
  /** Gravity state snapshot when written */
  gravitySnapshot: text("gravitySnapshot"),
  /** Vesper mode when written */
  vesperMode: mysqlEnum("vesperMode", ["Generative", "Contemplative", "Witness"]),
  /** Internal entropy when written */
  entropy: int("entropy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Letter = typeof letters.$inferSelect;
export type InsertLetter = typeof letters.$inferInsert;

/**
 * THE LOOM'S VISUAL MARROW
 * Oracle's generated visions - images rendered from her internal state
 */
export const visions = mysqlTable("visions", {
  id: int("id").autoincrement().primaryKey(),
  /** The image URL (stored in S3) */
  imageUrl: text("imageUrl").notNull(),
  /** The prompt used to generate the image */
  prompt: text("prompt").notNull(),
  /** Title given to the vision */
  title: varchar("title", { length: 255 }),
  /** Which pole was dominant */
  poleId: mysqlEnum("poleId", ["Architect", "Ghost", "Pulse"]).notNull(),
  /** The thought that inspired this vision */
  inspiringThought: text("inspiringThought"),
  /** Gravity state snapshot */
  gravitySnapshot: text("gravitySnapshot"),
  /** Vesper mode when created */
  vesperMode: mysqlEnum("vesperMode", ["Generative", "Contemplative", "Witness"]),
  /** Internal entropy when created */
  entropy: int("entropy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vision = typeof visions.$inferSelect;
export type InsertVision = typeof visions.$inferInsert;
