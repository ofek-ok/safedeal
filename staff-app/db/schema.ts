import { bigserial, index, integer, pgTable, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";

export const cases = pgTable("cases", {
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
}, (table) => [
  index("idx_cases_status_created").on(table.status, table.createdAt),
  index("idx_cases_analyst_created").on(table.analystUserId, table.createdAt),
]);

export const staffMembers = pgTable("staff_members", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  fileKey: text("file_key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  documentType: text("document_type"),
  source: text("source"),
  collectedAt: text("collected_at"),
}, (table) => [
  index("idx_documents_case_id").on(table.caseId),
]);

export const findings = pgTable("findings", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
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
}, (table) => [
  index("idx_findings_case_created").on(table.caseId, table.createdAt),
]);

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: text("snapshot").notNull(),
  generatedBy: text("generated_by").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("reports_case_version_unique").on(table.caseId, table.version),
]);

export const caseChecklist = pgTable("case_checklist", {
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  itemKey: text("item_key").notNull(),
  completed: integer("completed").notNull().default(0),
  completedBy: text("completed_by"),
  completedAt: text("completed_at"),
}, (table) => [
  primaryKey({ columns: [table.caseId, table.itemKey] }),
]);

export const activity = pgTable("activity", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id"),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_activity_case_created").on(table.caseId, table.createdAt),
]);

export const intakeAttempts = pgTable("intake_attempts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  ipHash: text("ip_hash").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_intake_attempts_ip_created").on(table.ipHash, table.createdAt),
]);

export const financeTransactions = pgTable("finance_transactions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  transactionDate: text("transaction_date").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amountAgorot: integer("amount_agorot").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_finance_date_created").on(table.transactionDate, table.createdAt),
]);

export const complianceTasks = pgTable("compliance_tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("not_started"),
  note: text("note").notNull().default(""),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull(),
});
