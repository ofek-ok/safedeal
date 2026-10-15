import { getDb } from "../../../../db";
import { getStaffIdentity, jsonError } from "../../../lib/staff";

type FinanceRow = {
  id: string;
  type: "income" | "expense";
  date: string;
  category: string;
  description: string;
  amountAgorot: number | string;
  createdAt: string;
};

async function requireAdmin() {
  const staff = await getStaffIdentity();
  if (!staff) return { error: jsonError("אין לך הרשאה למערכת העובדים.", 403) } as const;
  if (staff.role !== "admin") return { error: jsonError("אזור ההכנסות וההוצאות זמין למנהל בלבד.", 403) } as const;
  return { staff } as const;
}

export async function GET() {
  try {
    const access = await requireAdmin();
    if ("error" in access) return access.error;
    const db = getDb();
    const [rows, totals] = await Promise.all([
      db.$client.prepare(`SELECT id, type, transaction_date AS date, category, description,
        amount_agorot AS amountAgorot, created_at AS createdAt
        FROM finance_transactions ORDER BY transaction_date DESC, created_at DESC LIMIT 250`).all<FinanceRow>(),
      db.$client.prepare(`SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount_agorot ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_agorot ELSE 0 END), 0) AS expenses
        FROM finance_transactions`).first<{ income: number | string; expenses: number | string }>(),
    ]);
    const income = Number(totals?.income ?? 0) / 100;
    const expenses = Number(totals?.expenses ?? 0) / 100;
    return Response.json({
      transactions: (rows.results ?? []).map((row) => ({ ...row, amount: Number(row.amountAgorot) / 100, amountAgorot: undefined })),
      summary: { income, expenses, balance: income - expenses },
    });
  } catch (error) {
    console.error("SafeDeal finance load failed", error);
    return jsonError("לא הצלחנו לטעון את הנתונים הכספיים.", 503);
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAdmin();
    if ("error" in access) return access.error;
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return jsonError("פרטי התנועה חסרים או לא תקינים.", 400);
    const type = body.type === "income" || body.type === "expense" ? body.type : null;
    const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : "";
    const category = typeof body.category === "string" ? body.category.trim().slice(0, 80) : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 300) : "";
    const amount = typeof body.amount === "number" ? body.amount : Number.NaN;
    const amountAgorot = Math.round(amount * 100);
    if (!type || !date || Number.isNaN(Date.parse(date + "T00:00:00Z")) || !category || !description
      || !Number.isFinite(amount) || amount <= 0 || amount > 10_000_000 || amountAgorot <= 0) {
      return jsonError("בדקו את סוג התנועה, התאריך, הקטגוריה, התיאור והסכום.", 400);
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await getDb().$client.prepare(`INSERT INTO finance_transactions
      (id, type, transaction_date, category, description, amount_agorot, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, type, date, category, description, amountAgorot, access.staff.displayName, now).run();
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("SafeDeal finance save failed", error);
    return jsonError("לא הצלחנו לשמור את הרישום הכספי.", 503);
  }
}
