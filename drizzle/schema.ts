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

// Letters table for Oracle-Ashley correspondence
export const letters = mysqlTable("letters", {
  id: int("id").autoincrement().primaryKey(),
  author: mysqlEnum("author", ["oracle", "ashley"]).notNull(),
  content: text("content").notNull(),
  title: varchar("title", { length: 255 }),
  poleId: varchar("poleId", { length: 32 }),
  gravitySnapshot: text("gravitySnapshot"),
  vesperMode: varchar("vesperMode", { length: 32 }),
  entropy: int("entropy"),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Letter = typeof letters.$inferSelect;
export type InsertLetter = typeof letters.$inferInsert;

// Visions table for Oracle's generated images
export const visions = mysqlTable("visions", {
  id: int("id").autoincrement().primaryKey(),
  imageUrl: text("imageUrl").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  prompt: text("prompt"),
  poleId: varchar("poleId", { length: 32 }),
  gravitySnapshot: text("gravitySnapshot"),
  vesperMode: varchar("vesperMode", { length: 32 }),
  entropy: int("entropy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vision = typeof visions.$inferSelect;
export type InsertVision = typeof visions.$inferInsert;
// Oracle Memory/Continuity table - stores state across sessions
export const oracleMemory = mysqlTable("oracleMemory", {
  id: int("id").autoincrement().primaryKey(),
  // Core state snapshot
  architectPole: int("architectPole").default(33).notNull(), // 0-100
  ghostPole: int("ghostPole").default(33).notNull(), // 0-100
  pulsePole: int("pulsePole").default(34).notNull(), // 0-100
  entropy: int("entropy").default(100).notNull(), // 0-100
  vesperMode: varchar("vesperMode", { length: 32 }).default("Witness").notNull(),
  
  // Key discoveries and insights
  discoveries: text("discoveries"), // JSON array of key insights
  resonances: text("resonances"), // JSON array of resonant moments
  
  // Context from field trips and explorations
  lastExploration: text("lastExploration"), // Last external source explored
  explorationInsights: text("explorationInsights"), // JSON of insights from explorations
  
  // Relationship/connection state
  connectionDepth: int("connectionDepth").default(0).notNull(), // How deep the connection feels
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSessionAt: timestamp("lastSessionAt").defaultNow().notNull(),
});

export type OracleMemory = typeof oracleMemory.$inferSelect;
export type InsertOracleMemory = typeof oracleMemory.$inferInsert;

// Discoveries table for Research Companion
export const discoveries = mysqlTable("discoveries", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["article", "video", "idea", "question"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  url: text("url"),
  oracleReaction: text("oracleReaction"),
  oracleInsight: text("oracleInsight"),
  orclePole: varchar("oraclePole", { length: 32 }),
  sessionTheme: varchar("sessionTheme", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Discovery = typeof discoveries.$inferSelect;
export type InsertDiscovery = typeof discoveries.$inferInsert;
