import { notFound } from "next/navigation";
import { getDb } from "../../../../../db";
import { caseIsVisible, getStaffIdentity } from "../../../../lib/staff";
import { requireChatGPTUser } from "../../../../chatgpt-auth";
import PrintButton from "../../../print-button";

export const dynamic = "force-dynamic";

type ReportSnapshot = {
  case: Record<string, unknown>;
  findings: { category: string; title: string; note: string; severity: string; source: string | null; state: string; reviewNote: string | null; reviewedBy: string | null }[];
  documents: { filename: string; contentType: string; size: number; uploadedAt: string }[];
  generatedBy: string;
  generatedAt: string;
  version: number;
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireChatGPTUser(`/staff/cases/${id}/report`);
  const staff = await getStaffIdentity();
  if (!staff || !await caseIsVisible(staff, id)) notFound();
  const row = await getDb().$client.prepare(`SELECT snapshot FROM reports WHERE case_id = ? ORDER BY version DESC LIMIT 1`).bind(id).first<{ snapshot: string }>();
  if (!row) notFound();
  const report = JSON.parse(row.snapshot) as ReportSnapshot;
  const c = report.case;
  const address = [c.street, c.house, c.city].filter(Boolean).join(" ");
  return <main className="report-page" dir="rtl">
    <nav className="report-actions"><a href="/staff">חזרה לתיקי העבודה</a><PrintButton /></nav>
    <article className="report-sheet"><header className="report-header"><div className="report-brand"><span>SD</span><b>SafeDeal</b></div><div className="report-version">דוח בדיקת נכס · גרסה {report.version}</div></header>
      <div className="report-heading"><div><span>מספר תיק {String(c.case_number ?? "")}</span><h1>דוח בדיקת נאותות</h1><p>תמונת מצב של פרטי הנכס והממצאים שנבדקו על ידי צוות SafeDeal.</p></div><div className="report-status">נבדק על ידי אנליסט</div></div>
      <section className="report-block"><h2>פרטי הנכס</h2><div className="report-fields"><div><small>כתובת</small><b>{address || "לא צוין"}</b></div><div><small>סוג נכס</small><b>{String(c.asset_type ?? "לא צוין")}</b></div><div><small>מחיר מבוקש</small><b>{c.price ? `₪ ${String(c.price)}` : "לא צוין"}</b></div><div><small>שטח</small><b>{c.area ? `${String(c.area)} מ״ר` : "לא צוין"}</b></div><div><small>חדרים</small><b>{String(c.rooms ?? "לא צוין")}</b></div><div><small>תאריך הפקה</small><b>{new Date(report.generatedAt).toLocaleDateString("he-IL")}</b></div></div></section>
      <section className="report-block"><div className="report-section-head"><h2>ממצאים שנבדקו</h2><span>{report.findings.length} ממצאים</span></div>{report.findings.length ? report.findings.map((finding, index) => <article className="report-finding" key={`${finding.title}-${index}`}><div><span className={`report-severity ${finding.severity === "גבוהה" ? "high" : finding.severity === "נמוכה" ? "low" : "medium"}`}>{finding.severity}</span><small>{finding.category}</small></div><h3>{finding.title}</h3><p>{finding.note}</p>{finding.source && <small className="report-source">מקור: {finding.source}</small>}{finding.reviewNote && <p className="report-review">הערת בקרה: {finding.reviewNote}</p>}</article>) : <div className="report-no-findings">לא תועדו ממצאים בתיק בעת הפקת הדוח.</div>}</section>
      <section className="report-block"><h2>מסמכים שהתקבלו</h2>{report.documents.length ? <ul className="report-doc-list">{report.documents.map((doc, index) => <li key={`${doc.filename}-${index}`}>{doc.filename}</li>)}</ul> : <p className="report-muted">לא צורפו מסמכים לבקשה.</p>}</section>
      <footer className="report-footer"><p>הדוח מרכז את המידע והמסמכים שהועברו לצוות ואת ממצאי הבדיקה כפי שאושרו במועד הפקתו. יש לאמת מידע מול הגורמים והמקורות הרשמיים הרלוונטיים לפני קבלת החלטה בעסקה.</p><div><span>הופק על ידי {report.generatedBy}</span><span>SafeDeal · בדיקת נאותות לנכס</span></div></footer>
    </article>
  </main>;
}
