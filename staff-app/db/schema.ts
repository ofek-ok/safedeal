import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(),
  caseNumber: text("case_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone").notNull(),
  assetType: text("asset_type").notNull(),
  city: text("city").notNull(),
  street: text("street").notNull(),
  house: text("house").notNull(),
  block: text("block"),
  parcel: text("parcel"),
  subParcel: text("sub_parcel"),
  condition: text("condition"),
  price: text("price"),
  area: text("area"),
  rooms: text("rooms"),
  floor: text("floor"),
  monthlyRent: text("monthly_rent"),
  sellerName: text("seller_name"),
  sellerId: text("seller_id"),
  amenities: text("amenities").notNull().default("[]"),
  intakePayload: text("intake_payload").notNull().default("{}"),
  status: text("status").notNull().default("חדש"),
  analystUserId: text("analyst_user_id"),
  analystEmail: text("analyst_email"),
  dueAt: text("due_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const staffMembers = sqliteTable("staff_members", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id),
  fileKey: text("file_key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
});

export const findings = sqliteTable("findings", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id),
  category: text("category").notNull(),
  title: text("title").notNull(),
  note: text("note").notNull(),
  severity: text("severity").notNull(),
  source: text("source"),
  confidence: integer("confidence"),
  state: text("state").notNull().default("לבדיקה"),
  reviewNote: text("review_note"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull(),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id),
  version: integer("version").notNull(),
  snapshot: text("snapshot").notNull(),
  generatedBy: text("generated_by").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("reports_case_version_unique").on(table.caseId, table.version)]);

export const caseChecklist = sqliteTable("case_checklist", {
  caseId: text("case_id").notNull().references(() => cases.id),
  itemKey: text("item_key").notNull(),
  completed: integer("completed").notNull().default(0),
  completedBy: text("completed_by"),
  completedAt: text("completed_at"),
}, (table) => [primaryKey({ columns: [table.caseId, table.itemKey] })]);

export const activity = sqliteTable("activity", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id),
  actorUserId: text("actor_user_id"),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_activity_case_created").on(table.caseId, table.createdAt)]);

export const intakeAttempts = sqliteTable("intake_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ipHash: text("ip_hash").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("idx_intake_attempts_ip_created").on(table.ipHash, table.createdAt)]);

export const financeTransactions = sqliteTable("finance_transactions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  transactionDate: text("transaction_date").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amountAgorot: integer("amount_agorot").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});
