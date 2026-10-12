import { Pool, type PoolClient, type QueryResultRow } from "@neondatabase/serverless";

type BoundQuery = { text: string; values: unknown[] };
type RunResult = { meta: { changes: number } };
type AllResult<T> = { results: T[] };

class PreparedQuery {
  constructor(private readonly query: BoundQuery) {}

  bind(...values: unknown[]) {
    return new PreparedQuery({ ...this.query, values });
  }

  first<T = Record<string, unknown>>() {
    return executeFirst<T>(this.query);
  }

  all<T = Record<string, unknown>>() {
    return executeAll<T>(this.query);
  }

  run() {
    return executeRun(this.query);
  }

  get boundQuery() {
    return this.query;
  }
}

function pool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  if (!globalThis.__safedealNeonPool) {
    globalThis.__safedealNeonPool = new Pool({ connectionString, max: 3, idleTimeoutMillis: 5_000 });
  }
  return globalThis.__safedealNeonPool;
}

declare global {
  // Reuse the pool across warm Vercel Function invocations.
  var __safedealNeonPool: Pool | undefined;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY, case_number TEXT NOT NULL UNIQUE, client_name TEXT NOT NULL,
    client_email TEXT NOT NULL, client_phone TEXT NOT NULL, asset_type TEXT NOT NULL,
    city TEXT NOT NULL, street TEXT NOT NULL, house TEXT NOT NULL, block TEXT, parcel TEXT,
    sub_parcel TEXT, condition TEXT, price TEXT, area TEXT, rooms TEXT, floor TEXT,
    monthly_rent TEXT, seller_name TEXT, seller_id TEXT, amenities TEXT NOT NULL DEFAULT '[]',
    intake_payload TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'חדש',
    analyst_user_id TEXT, analyst_email TEXT, due_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS staff_members (
    user_id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
    role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    file_key TEXT NOT NULL UNIQUE, filename TEXT NOT NULL, content_type TEXT NOT NULL,
    size INTEGER NOT NULL, uploaded_at TEXT NOT NULL, document_type TEXT, source TEXT, collected_at TEXT
  )`,
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT`,
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS source TEXT`,
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS collected_at TEXT`,
  `CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    category TEXT NOT NULL, title TEXT NOT NULL, note TEXT NOT NULL, severity TEXT NOT NULL,
    source TEXT, confidence INTEGER, state TEXT NOT NULL DEFAULT 'לבדיקה', review_note TEXT,
    reviewed_by TEXT, reviewed_at TEXT, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    version INTEGER NOT NULL, snapshot TEXT NOT NULL, generated_by TEXT NOT NULL, created_at TEXT NOT NULL,
    CONSTRAINT reports_case_version_unique UNIQUE(case_id, version)
  )`,
  `CREATE TABLE IF NOT EXISTS case_checklist (
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE, item_key TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0, completed_by TEXT, completed_at TEXT,
    PRIMARY KEY (case_id, item_key)
  )`,
  `CREATE TABLE IF NOT EXISTS activity (
    id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    actor_user_id TEXT, actor_name TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS intake_attempts (
    id BIGSERIAL PRIMARY KEY, ip_hash TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_activity_case_created ON activity(case_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_intake_attempts_ip_created ON intake_attempts(ip_hash, created_at)`,
];

let schemaReady: Promise<void> | undefined;

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = await pool().connect();
      try {
        for (const statement of schemaStatements) await client.query(statement);
      } finally {
        client.release();
      }
    })().catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}

function toPostgres(sql: string) {
  let index = 0;
  let quote: "'" | '"' | null = null;
  let result = "";
  for (let position = 0; position < sql.length; position += 1) {
    const character = sql[position];
    if (quote) {
      result += character;
      if (character === quote && sql[position - 1] !== "\\") quote = null;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      result += character;
    } else if (character === "?") {
      index += 1;
      result += `$${index}`;
    } else {
      result += character;
    }
  }
  return result.replace(/\bAS\s+([A-Za-z_][A-Za-z0-9_]*)/g, (match, alias: string) =>
    /[A-Z]/.test(alias) ? `AS "${alias}"` : match
  );
}

function prepare(sql: string) {
  return new PreparedQuery({ text: toPostgres(sql), values: [] });
}

async function query<T extends QueryResultRow>(client: Pool | PoolClient, statement: BoundQuery) {
  await ensureSchema();
  return client.query<T>(statement.text, statement.values);
}

async function executeFirst<T>(statement: BoundQuery): Promise<T | null> {
  const result = await query(pool(), statement);
  return (result.rows[0] as T | undefined) ?? null;
}

async function executeAll<T>(statement: BoundQuery): Promise<AllResult<T>> {
  const result = await query(pool(), statement);
  const rows = result.rows.map((row) => {
    const normalized = { ...row } as Record<string, unknown>;
    if (typeof normalized.count === "string" && /^\d+$/.test(normalized.count)) normalized.count = Number(normalized.count);
    return normalized as T;
  });
  return { results: rows };
}

async function executeRun(statement: BoundQuery): Promise<RunResult> {
  const result = await query(pool(), statement);
  return { meta: { changes: result.rowCount ?? 0 } };
}

async function executeBatch(statements: PreparedQuery[]) {
  await ensureSchema();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    for (const statement of statements) {
      const bound = statement.boundQuery;
      await client.query(bound.text, bound.values);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export function getDb() {
  return { $client: { prepare, batch: executeBatch } };
}
