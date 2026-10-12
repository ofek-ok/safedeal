"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownToLine, Building2, CalendarClock, Check, ChevronLeft, CircleAlert, FileText, Gauge, LayoutDashboard, LogOut, Menu, Pencil, Plus, Search, ShieldCheck, UploadCloud, Users, Wrench, X } from "lucide-react";

type Staff = { userId: string; email: string; displayName: string; role: "admin" | "analyst" };
type CaseRow = { id: string; caseNumber: string; clientName: string; clientEmail: string; clientPhone: string; assetType: string; city: string; street: string; house: string; price: string; status: string; analystUserId: string | null; analystEmail: string | null; dueAt: string | null; createdAt: string; findingCount: number; documentCount: number };
type IntakeData = { personal?: Record<string, unknown>; location?: Record<string, unknown>; deal?: Record<string, unknown>; documents?: { name: string; contentType: string; size: number }[] };
type ChecklistKey = "reports_collected" | "data_reviewed" | "data_verified" | "ai_findings_reviewed" | "report_generated" | "report_sent";
type Detail = { case: Record<string, unknown>; intakeData: IntakeData | null; documents: { id: string; filename: string; contentType: string; size: number; uploadedAt: string; documentType: string; source: string; collectedAt: string }[]; findings: { id: string; category: string; title: string; note: string; severity: string; source: string | null; confidence: number | null; state: string; reviewNote: string | null; reviewedBy: string | null }[]; activity: { id: string; actorName: string; action: string; detail: string; createdAt: string }[]; report: { id: string; version: number; createdAt: string } | null; checklist: Partial<Record<ChecklistKey, { completed: boolean; completedBy: string | null; completedAt: string | null }>> };
type Member = { email: string; displayName: string; role: string; active: number };
const statuses = ["חדש", "באיסוף מידע", "ממתין למסמכים", "מוכן לניתוח", "בניתוח", "בבדיקת אנליסט", "דוח מוכן", "שולח דוח", "דוח נשלח"];
const documentTypes = ["נסח טאבו / אישור זכויות", "דוח מרשם המשכונות", "דוח מתדיינים / הליכים משפטיים", "הסכם / טיוטת חוזה", "תכנון והיתרים", "מסמכי מוכר / יזם", "מסמכי רשות מקומית", "מסמך פיננסי", "אחר"];
const checklistItems: { key: ChecklistKey; label: string; automatic?: boolean }[] = [
  { key: "reports_collected", label: "הוצאתי והעליתי את הדוחות הנדרשים או תיעדתי שאינם זמינים" },
  { key: "data_reviewed", label: "עברתי על הנתונים והמסמכים" },
  { key: "data_verified", label: "וידאתי את מהימנות הנתונים מול המקורות" },
  { key: "ai_findings_reviewed", label: "עברתי על ממצאי ה-AI והחלטתי מה ייכלל בדוח" },
  { key: "report_generated", label: "הפקתי את הדוח הסופי", automatic: true },
  { key: "report_sent", label: "שלחתי את הדוח ללקוח במייל", automatic: true },
];
const intakeLabels: Record<string, string> = {
  fullName: "שם מלא", email: "דוא״ל", phone: "טלפון", purpose: "מטרת הבדיקה", agreeToTerms: "אישור תנאים",
  city: "עיר / יישוב", street: "רחוב", houseNumber: "מספר בית", block: "גוש", parcel: "חלקה", subParcel: "תת־חלקה",
  dealType: "סוג עסקה", askingPrice: "מחיר מבוקש", propertyArea: "שטח הנכס", roomsCount: "מספר חדרים", floorNumber: "קומה", condition: "מצב הנכס", monthlyRent: "שכר דירה חודשי",
  sellerNames: "שם המוכר / בעלי הנכס", isRented: "הנכס מושכר", hasAdditions: "בוצעו תוספות", developerName: "שם יזם / קבלן", developerRegNumber: "ח.פ / מספר עוסק",
  accreditedBank: "בנק מלווה", targetDeliveryDate: "מועד מסירה", indexLinkage: "הצמדה למדד", hasParking: "חניה", hasUndergroundParking: "חניון תת־קרקעי", hasAbovegroundParking: "חניה עליונה",
  hasStorage: "מחסן", hasMamad: "ממ״ד", hasElevator: "מעלית", hasBalcony: "מרפסת", hasGym: "חדר כושר", hasResidentsLounge: "חדר דיירים", hasRooftop: "גג דיירים", isBuildingOnPillars: "בניין על עמודים", hasAccessibility: "נגישות",
};

function intakeDisplayValue(key: string, value: unknown) {
  if (typeof value === "boolean") return value ? "כן" : "לא";
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && !!item.trim()).join(" · ") || "לא צוין";
  if (typeof value !== "string" || !value.trim()) return "לא צוין";
  if (key === "purpose") return ({ buyer: "קונה", seller: "מוכר", investor: "משקיע" } as Record<string, string>)[value] ?? value;
  if (key === "dealType") return ({ "second-hand": "יד שנייה", developer: "דירה חדשה מקבלן", "new-developer": "דירה מקבלן" } as Record<string, string>)[value] ?? value;
  if (key === "condition") return ({ "new-contractor": "חדש מקבלן", "preserved-like-new": "שמור כחדש", preserved: "שמור", "needs-renovation": "דרוש שיפוץ" } as Record<string, string>)[value] ?? value;
  return value;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
  const data = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(data.error || "הפעולה לא הצליחה.");
  return data as T;
}

export default function StaffWorkspace({ initialStaff }: { initialStaff: Staff }) {
  const [staff] = useState(initialStaff);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [team, setTeam] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<"dashboard" | "cases" | "tools" | "team">("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileCaseOpen, setMobileCaseOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [findingForm, setFindingForm] = useState(false);
  const [finding, setFinding] = useState({ category: "רישום זכויות", title: "", note: "", severity: "בינונית", source: "" });
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [findingEdit, setFindingEdit] = useState({ category: "", title: "", note: "", severity: "בינונית", source: "" });
  const [documentForm, setDocumentForm] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState(documentTypes[0]);
  const [managerError, setManagerError] = useState("");
  const [toolPrice, setToolPrice] = useState("");
  const [toolArea, setToolArea] = useState("");
  const [toolRent, setToolRent] = useState("");

  const loadCases = useCallback(async (keepSelection = true) => {
    try {
      const data = await request<{ cases: CaseRow[] }>("/api/staff/cases");
      setCases(data.cases);
      setSelectedId((current) => keepSelection && current && data.cases.some((item) => item.id === current) ? current : data.cases[0]?.id ?? null);
      setManagerError("");
    } catch (error) { setManagerError(error instanceof Error ? error.message : "לא הצלחנו לטעון את התיקים."); }
    finally { setLoading(false); }
  }, []);

  const loadTeam = useCallback(async () => {
    if (staff.role !== "admin") return;
    try { setTeam((await request<{ team: Member[] }>("/api/staff/team")).team); } catch (error) { setManagerError(error instanceof Error ? error.message : "לא הצלחנו לטעון את הצוות."); }
  }, [staff.role]);

  const loadDetail = useCallback(async (id: string | null) => {
    if (!id) { setDetail(null); return; }
    try { setDetail(await request<Detail>(`/api/staff/cases/${id}`)); }
    catch (error) { setDetail(null); setNotice(error instanceof Error ? error.message : "לא הצלחנו לפתוח את התיק."); }
  }, []);

  useEffect(() => { void loadCases(false); if (staff.role === "admin") void loadTeam(); }, [loadCases, loadTeam, staff.role]);
  useEffect(() => { void loadDetail(selectedId); }, [loadDetail, selectedId]);
  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileNavOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);
  const filteredCases = useMemo(() => cases.filter((row) => `${row.caseNumber} ${row.clientName} ${row.city} ${row.street}`.toLowerCase().includes(search.toLowerCase())), [cases, search]);
  const selectedCase = cases.find((row) => row.id === selectedId) ?? null;
  const activeCount = cases.filter((item) => item.status !== "דוח נשלח").length;
  const reviewCount = cases.reduce((sum, item) => sum + (item.findingCount ?? 0), 0);
  const waitingDocuments = cases.filter((item) => item.status === "ממתין למסמכים");
  const unassignedCases = cases.filter((item) => item.status !== "דוח נשלח" && !item.analystUserId);
  const now = new Date();
  const overdueCases = cases.filter((item) => item.status !== "דוח נשלח" && item.dueAt && new Date(item.dueAt) < now);
  const attentionCases = [...new Map([...overdueCases, ...waitingDocuments, ...unassignedCases].map((item) => [item.id, item])).values()];
  const statusCounts = statuses.map((status) => ({ status, count: cases.filter((item) => item.status === status).length }));
  const pricePerMeter = Number(toolPrice) > 0 && Number(toolArea) > 0 ? Math.round(Number(toolPrice) / Number(toolArea)) : null;
  const grossYield = Number(toolPrice) > 0 && Number(toolRent) > 0 ? (Number(toolRent) * 12 / Number(toolPrice) * 100) : null;

  const updateCase = async (payload: Record<string, unknown>) => {
    if (!selectedId) return;
    setBusy(true);
    try { await request(`/api/staff/cases/${selectedId}`, { method: "PATCH", body: JSON.stringify(payload) }); await loadCases(); await loadDetail(selectedId); setNotice("השינויים נשמרו."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לשמור את השינויים."); }
    finally { setBusy(false); }
  };

  const reviewFinding = async (id: string, state: string) => {
    setBusy(true);
    try { await request(`/api/staff/findings/${id}`, { method: "PATCH", body: JSON.stringify({ state }) }); await loadDetail(selectedId); await loadCases(); setNotice("בדיקת הממצא נשמרה."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לשמור את הבדיקה."); }
    finally { setBusy(false); }
  };

  const editFinding = (item: Detail["findings"][number]) => {
    setEditingFindingId(item.id);
    setFindingEdit({ category: item.category, title: item.title, note: item.note, severity: item.severity, source: item.source ?? "" });
  };

  const saveFindingEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingFindingId) return;
    setBusy(true);
    try {
      await request(`/api/staff/findings/${editingFindingId}`, { method: "PATCH", body: JSON.stringify(findingEdit) });
      setEditingFindingId(null);
      await loadDetail(selectedId);
      await loadCases();
      setNotice("הממצא עודכן וחזר לבקרת אנליסט.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לעדכן את הממצא."); }
    finally { setBusy(false); }
  };

  const addFinding = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selectedId) return;
    setBusy(true);
    try { await request(`/api/staff/cases/${selectedId}`, { method: "POST", body: JSON.stringify(finding) }); setFinding({ category: "רישום זכויות", title: "", note: "", severity: "בינונית", source: "" }); setFindingForm(false); await loadDetail(selectedId); await loadCases(); setNotice("הממצא נוסף לתיק וממתין לבדיקה."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו להוסיף את הממצא."); }
    finally { setBusy(false); }
  };

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { await request("/api/staff/team", { method: "POST", body: JSON.stringify({ email: teamEmail, role: "analyst" }) }); setTeamEmail(""); await loadTeam(); setNotice("האנליסט נוסף. עם הכניסה הראשונה שלו, ההרשאה תיקושר לחשבון שלו."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו להוסיף את האנליסט."); }
    finally { setBusy(false); }
  };

  const generateReport = async () => {
    if (!selectedId) return;
    const reportWindow = window.open("about:blank", "_blank");
    setBusy(true);
    try { await request(`/api/staff/cases/${selectedId}`, { method: "PUT" }); await loadCases(); await loadDetail(selectedId); setNotice("נוצרה גרסת דוח מאושרת."); if (reportWindow) reportWindow.location.href = `/staff/cases/${selectedId}/report`; }
    catch (error) { reportWindow?.close(); setNotice(error instanceof Error ? error.message : "לא הצלחנו ליצור את הדוח."); }
    finally { setBusy(false); }
  };

  const sendReport = async () => {
    if (!selectedId || !selectedCase || !window.confirm(`לשלוח את דוח הבדיקה הסופי ל-${selectedCase.clientEmail}?`)) return;
    setBusy(true);
    try {
      await request(`/api/staff/cases/${selectedId}/send-report`, { method: "POST" });
      await loadCases();
      await loadDetail(selectedId);
      setNotice("הדוח הסופי נשלח ללקוח ונרשם בהיסטוריית התיק.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לשלוח את הדוח."); }
    finally { setBusy(false); }
  };

  const analyzeCase = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const result = await request<{ findingsCreated: number; summary: string; missingInformation: string[] }>(`/api/staff/cases/${selectedId}/analyze`, { method: "POST" });
      await loadCases();
      await loadDetail(selectedId);
      const missingText = result.missingInformation.length ? ` נדרש להשלים: ${result.missingInformation.slice(0, 3).join(", ")}.` : "";
      setNotice(`הניתוח הסתיים ונוצרו ${result.findingsCreated} ממצאים לבדיקה.${missingText}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לנתח את התיק."); }
    finally { setBusy(false); }
  };

  const uploadDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setBusy(true);
    try {
      const response = await fetch(`/api/staff/cases/${selectedId}/documents`, { method: "POST", body: formData });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "לא הצלחנו לשמור את המסמך.");
      form.reset();
      setDocumentForm(false);
      await loadDetail(selectedId);
      await loadCases();
      setNotice("המסמך נשמר בתיק עם פרטי המקור.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לשמור את המסמך."); }
    finally { setBusy(false); }
  };

  const updateChecklist = async (itemKey: ChecklistKey, completed: boolean) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await request(`/api/staff/cases/${selectedId}/checklist`, { method: "PATCH", body: JSON.stringify({ itemKey, completed }) });
      await loadDetail(selectedId);
      setNotice("צ׳ק־ליסט האנליסט נשמר.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לשמור את הצ׳ק־ליסט."); }
    finally { setBusy(false); }
  };

  const download = async (documentId: string) => {
    try { const response = await fetch(`/api/staff/documents/${documentId}`); if (!response.ok) throw new Error("לא הצלחנו להוריד את המסמך."); const blob = await response.blob(); const href = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = href; a.download = detail?.documents.find((doc) => doc.id === documentId)?.filename ?? "document"; a.click(); URL.revokeObjectURL(href); }
    catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו להוריד את המסמך."); }
  };

  const dueLabel = (value: string | null) => value ? new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" }).format(new Date(value)) : "לא נקבע";
  const sectionLabel = section === "dashboard" ? "לוח בקרה" : section === "cases" ? "ניהול תיקים" : section === "tools" ? "כלים חשובים" : "ניהול צוות";
  const openCase = (id: string) => { setSelectedId(id); setSection("cases"); setMobileCaseOpen(true); };
  const navigateSection = (next: typeof section) => { setSection(next); setMobileNavOpen(false); if (next === "cases") setMobileCaseOpen(false); };

  return <div className="staff-app" dir="rtl">
    <a className="staff-skip-link" href="#staff-content">דילוג לתוכן הראשי</a>
    <aside className={`staff-sidebar ${mobileNavOpen ? "is-open" : ""}`} aria-label="ניווט מערכת SafeDeal">
      <div className="staff-brand"><span className="staff-mark">SD</span><span><b>SafeDeal</b><small>ניהול בדיקות</small></span><button className="mobile-nav-close" type="button" aria-label="סגירת תפריט" onClick={() => setMobileNavOpen(false)}><X size={20} /></button></div>
      <div className="sidebar-caption">סביבת צוות</div>
      <nav className="staff-nav" aria-label="ניווט ראשי">
        <button className={`side-link ${section === "dashboard" ? "active" : ""}`} aria-current={section === "dashboard" ? "page" : undefined} onClick={() => navigateSection("dashboard")}><Gauge size={18} />לוח בקרה</button>
        <button className={`side-link ${section === "cases" ? "active" : ""}`} aria-current={section === "cases" ? "page" : undefined} onClick={() => navigateSection("cases")}><LayoutDashboard size={18} />תיקים <span>{cases.length}</span></button>
        <button className={`side-link ${section === "tools" ? "active" : ""}`} aria-current={section === "tools" ? "page" : undefined} onClick={() => navigateSection("tools")}><Wrench size={18} />כלים חשובים</button>
        {staff.role === "admin" && <button className={`side-link ${section === "team" ? "active" : ""}`} aria-current={section === "team" ? "page" : undefined} onClick={() => { navigateSection("team"); void loadTeam(); }}><Users size={18} />צוות</button>}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-security"><ShieldCheck size={17} /><span><b>גישה מאובטחת</b><small>רק צוות מורשה</small></span></div><div className="staff-profile"><div className="profile-avatar">{staff.displayName.slice(0, 1)}</div><span><b>{staff.displayName}</b><small>{staff.role === "admin" ? "מנהלת מערכת" : "אנליסט"}</small></span><a title="התנתקות" href="/signout-with-chatgpt?return_to=%2F"><LogOut size={16} /></a></div></div>
    </aside>
    {mobileNavOpen && <button className="staff-nav-scrim" type="button" aria-label="סגירת תפריט" onClick={() => setMobileNavOpen(false)} />}
    <main className="staff-main" id="staff-content" tabIndex={-1}>
      <header className="staff-topbar"><button className="mobile-nav-toggle" type="button" aria-label="פתיחת תפריט" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu size={19} /><span>תפריט</span></button><div className="breadcrumb">SafeDeal <ChevronLeft size={14} /> {sectionLabel}</div><div className="topbar-user"><span className="topbar-dot" /> סביבת עבודה פנימית <span className="topbar-divider" /> {staff.email}</div></header>
      <div className="staff-content">
        {section === "dashboard" ? <>
          <div className="staff-heading"><div><div className="eyebrow">יום עבודה, {new Intl.DateTimeFormat("he-IL", { dateStyle: "full" }).format(new Date())}</div><h1>לוח בקרה</h1><p>תמונת מצב של התיקים והמשימות שמחכות לצוות.</p></div><button className="outline-action" onClick={() => void loadCases()}><Activity size={16} />רענון</button></div>
          {managerError && <div className="notice error"><CircleAlert size={17} />{managerError}</div>}
          <div className="staff-metrics dashboard-metrics"><article><span className="metric-label">תיקים פעילים</span><b>{loading ? "—" : activeCount}</b><small>מתוך {cases.length} תיקים במערכת</small></article><article><span className="metric-label">ממתינים למסמכים</span><b>{loading ? "—" : waitingDocuments.length}</b><small>נדרש מעקב מול הלקוחות</small></article><article><span className="metric-label">תיקים ללא אנליסט</span><b>{loading ? "—" : unassignedCases.length}</b><small>ממתינים לשיוך לצוות</small></article><article><span className="metric-label">ממצאים בתיקים</span><b>{loading ? "—" : reviewCount}</b><small>ממצאים שנוספו לבדיקה</small></article></div>
          <div className="dashboard-grid"><section className="dashboard-card status-card"><div className="dashboard-card-head"><div><b>תיקים לפי סטטוס</b><small>התפלגות לפי מצב הטיפול הנוכחי</small></div><span>{cases.length} בסך הכול</span></div>{loading ? <div className="inline-empty">טוען נתונים…</div> : cases.length ? <div className="status-chart">{statusCounts.filter((item) => item.count > 0).map((item) => <div className="status-bar-row" key={item.status}><span>{item.status}</span><div className="status-bar-track"><i style={{ width: `${Math.max(8, item.count / cases.length * 100)}%` }} /></div><b>{item.count}</b></div>)}</div> : <div className="inline-empty">כשייפתחו תיקים, ההתפלגות תופיע כאן.</div>}<button className="dashboard-link" onClick={() => setSection("cases")}>פתיחת רשימת התיקים <ChevronLeft size={15} /></button></section>
            <section className="dashboard-card attention-card"><div className="dashboard-card-head"><div><b>דורשים תשומת לב</b><small>תיקים עם יעד שעבר, בלי שיוך או שממתינים למסמכים</small></div><span className="attention-count">{loading ? "—" : attentionCases.length}</span></div>{loading ? <div className="inline-empty">טוען תיקים…</div> : attentionCases.length ? <div className="attention-list">{attentionCases.slice(0, 5).map((item) => <button className="attention-row" key={item.id} onClick={() => openCase(item.id)}><span className="attention-icon"><CircleAlert size={16} /></span><span><b>{item.clientName}</b><small>{item.caseNumber} · {overdueCases.some((row) => row.id === item.id) ? `יעד עבר · ${dueLabel(item.dueAt)}` : item.status === "ממתין למסמכים" ? "ממתין למסמכים" : "טרם שויך לאנליסט"}</small></span><ChevronLeft size={16} /></button>)}</div> : <div className="attention-clear"><ShieldCheck size={20} /><b>אין כרגע תיקים דחופים</b><small>נושאים הדורשים טיפול יופיעו כאן.</small></div>}<button className="dashboard-link" onClick={() => setSection("tools")}>מעבר לכלים החשובים <ChevronLeft size={15} /></button></section></div>
        </> : section === "cases" ? <>
          <div className="staff-heading"><div><div className="eyebrow">יום עבודה, {new Intl.DateTimeFormat("he-IL", { dateStyle: "full" }).format(new Date())}</div><h1>ניהול בדיקות</h1><p>תיקים, מסמכים ובקרת ממצאים במקום אחד.</p></div><button className="outline-action" onClick={() => { void loadCases(); if (staff.role === "admin") void loadTeam(); }}><Activity size={16} />רענון</button></div>
          <div className="staff-metrics"><article><span className="metric-label">תיקים פעילים</span><b>{loading ? "—" : activeCount}</b><small>מתוך {cases.length} תיקים במערכת</small></article><article><span className="metric-label">ממצאים בתיקים</span><b>{reviewCount}</b><small>נוספו על ידי צוות הבדיקה</small></article><article><span className="metric-label">ממתינים למסמכים</span><b>{cases.filter((item) => item.status === "ממתין למסמכים").length}</b><small>דורשים מעקב מול הלקוח</small></article></div>
          {managerError && <div className="notice error"><CircleAlert size={17} />{managerError}</div>}
          <section className={`case-workspace-new ${mobileCaseOpen ? "mobile-detail-open" : ""}`}>
            <div className="case-list-new"><div className="list-head"><div><b>תיקי בדיקה</b><small>תיקים שנפתחו דרך טופס הלקוחות</small></div><span className="list-count">{filteredCases.length}</span></div><label className="case-search"><Search size={16} /><input placeholder="חיפוש לפי לקוח, עיר או מספר תיק" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
              <div className="case-list-scroll">{loading ? <div className="empty-state">טוען תיקים…</div> : filteredCases.length === 0 ? <div className="empty-state"><Building2 size={26} /><b>{cases.length ? "לא נמצאו תיקים" : "עדיין לא נפתחו תיקים"}</b><span>{cases.length ? "נסו לשנות את מילות החיפוש." : "בקשות שיישלחו מפרונט הלקוחות יופיעו כאן."}</span></div> : filteredCases.map((row) => <button key={row.id} className={`case-row-new ${selectedId === row.id ? "selected" : ""}`} onClick={() => { setSelectedId(row.id); setMobileCaseOpen(true); }}><span className="case-row-icon"><Building2 size={17} /></span><span className="case-row-copy"><b>{row.clientName}</b><small>{row.assetType} · {row.street} {row.house}, {row.city}</small><span><i className={`status-dot-new state-${statuses.indexOf(row.status)}`} />{row.status}<em>{row.caseNumber}</em></span></span><ChevronLeft size={16} className="case-row-chevron" /></button>)}</div>
            </div>
              <div className="case-detail-new">{!selectedCase || !detail ? <div className="empty-detail"><Building2 size={26} /><b>{cases.length ? "בחרו תיק מהרשימה" : "התיק הראשון יופיע כאן"}</b><span>פרטי הלקוח, הנכס והבדיקה יוצגו באזור הזה.</span></div> : <>
              <button className="case-mobile-back" type="button" onClick={() => setMobileCaseOpen(false)}><ChevronLeft size={16} />חזרה לרשימת התיקים</button>
              <div className="detail-top"><div><span className="case-number">{selectedCase.caseNumber}</span><h2>{selectedCase.clientName}</h2><p>{selectedCase.assetType} · {selectedCase.street} {selectedCase.house}, {selectedCase.city}</p></div><span className={`status-tag state-${statuses.indexOf(selectedCase.status)}`}>{selectedCase.status}</span></div>
              <div className="detail-controls"><label>סטטוס<select value={selectedCase.status} disabled={busy} onChange={(e) => void updateCase({ status: e.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>{staff.role === "admin" && <label>אנליסט אחראי<select value={selectedCase.analystEmail ?? ""} disabled={busy} onChange={(e) => void updateCase({ analystEmail: e.target.value })}><option value="">לא משויך</option>{team.filter((member) => member.active && member.role === "analyst").map((member) => <option key={member.email} value={member.email}>{member.displayName}</option>)}</select></label>}{staff.role === "admin" && <label>תאריך יעד<input type="date" value={selectedCase.dueAt ? new Date(selectedCase.dueAt).toISOString().slice(0, 10) : ""} disabled={busy} onChange={(e) => void updateCase({ dueAt: e.target.value ? new Date(`${e.target.value}T23:59:00`).toISOString() : null })} /></label>}<div className="due-chip"><CalendarClock size={16} /><span><small>תאריך יעד</small><b>{dueLabel(selectedCase.dueAt)}</b></span></div></div>
              <div className="contact-strip"><div><small>דוא״ל לקוח</small><a href={`mailto:${selectedCase.clientEmail}`}>{selectedCase.clientEmail}</a></div><div><small>טלפון</small><a href={`tel:${selectedCase.clientPhone}`}>{selectedCase.clientPhone}</a></div><div><small>מחיר מבוקש</small><b>₪ {selectedCase.price || "לא צוין"}</b></div></div>
              <div className="detail-section analyst-checklist"><div className="section-title"><div><b>צ׳ק־ליסט אנליסט</b><small>השלבים נשמרים בתיק ומתועדים בהיסטוריה</small></div><span className="list-count">{checklistItems.filter((item) => detail.checklist?.[item.key]?.completed).length}/{checklistItems.length}</span></div><div className="checklist-list">{checklistItems.map((item) => { const checked = Boolean(detail.checklist?.[item.key]?.completed); return <label key={item.key} className={`checklist-row ${checked ? "completed" : ""} ${item.automatic ? "automatic" : ""}`}><input type="checkbox" checked={checked} disabled={busy || item.automatic} onChange={(event) => void updateChecklist(item.key, event.target.checked)} /><span className="checklist-copy"><b>{item.label}</b><small>{item.automatic ? item.key === "report_sent" ? checked ? `נשלח על ידי ${detail.checklist?.report_sent?.completedBy ?? "הצוות"}` : "יתעדכן אוטומטית לאחר שליחת מייל מוצלחת" : checked ? `הופק על ידי ${detail.checklist?.report_generated?.completedBy ?? "הצוות"}` : "יתעדכן אוטומטית לאחר הפקת הדוח" : checked ? `סומן על ידי ${detail.checklist?.[item.key]?.completedBy ?? "הצוות"}` : "לסמן לאחר השלמת הפעולה"}</small></span>{checked && <Check size={17} />}</label>; })}</div></div>
              <div className="detail-section"><div className="section-title"><div><b>כל פרטי הטופס</b><small>המידע המקורי שנשלח מפרונט הלקוחות</small></div></div>{detail.intakeData && Object.keys(detail.intakeData).length ? <div className="intake-groups">{(["personal", "location", "deal"] as const).map((group) => { const values = detail.intakeData?.[group]; if (!values || !Object.keys(values).length) return null; const title = group === "personal" ? "פרטי הלקוח" : group === "location" ? "כתובת וזיהוי" : "פרטי העסקה והנכס"; return <section className="intake-group" key={group}><b>{title}</b><div className="intake-fields">{Object.entries(values).map(([key, value]) => <div key={key}><small>{intakeLabels[key] ?? key}</small><span>{intakeDisplayValue(key, value)}</span></div>)}</div></section>; })}{detail.intakeData.documents?.length ? <section className="intake-group"><b>מסמכים שהועלו</b><div className="intake-fields">{detail.intakeData.documents.map((doc, index) => <div key={`${doc.name}-${index}`}><small>קובץ {index + 1}</small><span>{doc.name} · {Math.max(1, Math.round(doc.size / 1024))} KB</span></div>)}</div></section> : null}</div> : <div className="inline-empty">לתיקים קודמים אין שמירת צילום מלא של הטופס.</div>}</div>
              <div className="detail-section"><div className="section-title"><div><b>מסמכי הנכס ודוחות חיצוניים</b><small>{detail.documents.length} קבצים מאובטחים · כל הקבצים המצורפים יישלחו לניתוח</small></div><button className="text-action" onClick={() => { setUploadDocumentType(documentTypes[0]); setDocumentForm((value) => !value); }}><UploadCloud size={16} />העלאת מסמך</button></div>
                <div className="required-doc-actions">{(["נסח טאבו / אישור זכויות", "דוח מרשם המשכונות", "דוח מתדיינים / הליכים משפטיים"] as const).map((type) => { const matches = detail.documents.filter((doc) => doc.documentType === type); const title = type === "נסח טאבו / אישור זכויות" ? "נסח טאבו" : type; return <div className={`required-doc-card ${matches.length ? "has-document" : ""}`} key={type}><span className="required-doc-state">{matches.length ? <Check size={15} /> : <FileText size={15} />}</span><span><b>{title}</b><small>{matches.length ? `${matches.length} קובץ${matches.length > 1 ? "ים" : ""} בתיק${type === "נסח טאבו / אישור זכויות" && matches.some((doc) => doc.source === "הועלה על ידי הלקוח") ? " · הועלה על ידי הלקוח" : ""}` : type === "נסח טאבו / אישור זכויות" ? "אפשר להשתמש בקובץ שהלקוח העלה או להוסיף כאן" : "עדיין לא הועלה לתיק"}</small></span><button type="button" className="text-action" onClick={() => { setUploadDocumentType(type); setDocumentForm(true); }}><UploadCloud size={15} />{matches.length ? "הוספת קובץ" : "העלאה"}</button></div>; })}</div>
                {documentForm && <form className="finding-form" onSubmit={uploadDocument}><div className="form-grid"><label className="span-two">קובץ<input type="file" name="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" required /></label><label>סוג מסמך<select name="documentType" value={uploadDocumentType} onChange={(event) => setUploadDocumentType(event.target.value)}>{documentTypes.map((value) => <option key={value}>{value}</option>)}</select></label><label>תאריך איסוף<input type="date" name="collectedAt" defaultValue={new Date().toISOString().slice(0, 10)} /></label><label className="span-two">מקור / אתר שממנו נאסף<input name="source" placeholder="לדוגמה: אתר רשות התאגידים, נט המשפט, הלקוח" maxLength={240} required /></label></div><div className="form-actions"><button className="button-primary" disabled={busy}><UploadCloud size={15} />שמירת מסמך בתיק</button><button type="button" className="button-plain" onClick={() => setDocumentForm(false)}>ביטול</button><small>PDF או תמונה · עד 20MB לקובץ</small></div></form>}
                {detail.documents.length ? <div className="documents-grid">{detail.documents.map((doc) => <button key={doc.id} className="document-item" onClick={() => void download(doc.id)}><span className="document-icon"><FileText size={18} /></span><span><b>{doc.filename}</b><small>{doc.documentType} · {doc.source}</small><small>{Math.max(1, Math.round(doc.size / 1024))} KB · נאסף {new Date(doc.collectedAt).toLocaleDateString("he-IL")}</small></span><ArrowDownToLine size={16} /></button>)}</div> : <div className="inline-empty">לא צורפו מסמכים. העלו כאן את החומרים שנאספו במהלך הבדיקה.</div>}
                <div className="report-gate"><ShieldCheck size={19} /><span><b>איסוף המסמכים</b><small>{detail.documents.length ? "בדקו שהחומרים הנדרשים לתיק הועלו, ואז סמנו בצ׳ק־ליסט שאיסוף הדוחות הושלם או שאינם זמינים." : "יש להעלות את המסמכים והמידע שנאספו לפני שמסמנים את התיק כמוכן לניתוח."}</small></span><button className="report-create" disabled={busy || !detail.documents.length || !detail.checklist?.reports_collected?.completed || selectedCase.status === "מוכן לניתוח"} onClick={() => void updateCase({ status: "מוכן לניתוח" })}>{selectedCase.status === "מוכן לניתוח" ? "מוכן לניתוח" : "סיום איסוף"}</button></div>
                {selectedCase.status === "מוכן לניתוח" && <div className="report-gate"><Activity size={19} /><span><b>ניתוח מסמכי התיק</b><small>הניתוח ייצור טיוטת ממצאים לבדיקה. שום ממצא לא נשלח ללקוח לפני אישור אנליסט.</small></span><button className="report-create" disabled={busy || !detail.documents.length} onClick={() => void analyzeCase()}>{busy ? "מנתח…" : "הפעלת ניתוח AI"}</button></div>}
              </div>
              <div className="detail-section"><div className="section-title"><div><b>ממצאים ובקרת אנליסט</b><small>{detail.findings.length} ממצאים · כל ממצא דורש החלטת צוות</small></div><button className="text-action" onClick={() => setFindingForm((v) => !v)}><Plus size={16} />הוספת ממצא</button></div>
                {findingForm && <form className="finding-form" onSubmit={addFinding}><div className="form-grid"><label>תחום<input value={finding.category} onChange={(e) => setFinding({ ...finding, category: e.target.value })} required /></label><label>חומרה<select value={finding.severity} onChange={(e) => setFinding({ ...finding, severity: e.target.value })}><option>נמוכה</option><option>בינונית</option><option>גבוהה</option></select></label><label className="span-two">כותרת<input value={finding.title} onChange={(e) => setFinding({ ...finding, title: e.target.value })} required /></label><label className="span-two">תיאור<textarea rows={3} value={finding.note} onChange={(e) => setFinding({ ...finding, note: e.target.value })} required /></label><label className="span-two">מקור / מסמך<input value={finding.source} onChange={(e) => setFinding({ ...finding, source: e.target.value })} /></label></div><div className="form-actions"><button className="button-primary" disabled={busy}>שמירת ממצא</button><button type="button" className="button-plain" onClick={() => setFindingForm(false)}>ביטול</button></div></form>}
                {detail.findings.length ? <div className="finding-list">{detail.findings.map((item) => <article className="finding-row" key={item.id}>{editingFindingId === item.id ? <form className="finding-form" onSubmit={saveFindingEdit}><div className="form-grid"><label>תחום<input value={findingEdit.category} onChange={(event) => setFindingEdit({ ...findingEdit, category: event.target.value })} required /></label><label>חומרה<select value={findingEdit.severity} onChange={(event) => setFindingEdit({ ...findingEdit, severity: event.target.value })}><option>נמוכה</option><option>בינונית</option><option>גבוהה</option></select></label><label className="span-two">כותרת<input value={findingEdit.title} onChange={(event) => setFindingEdit({ ...findingEdit, title: event.target.value })} required /></label><label className="span-two">תיאור<textarea rows={4} value={findingEdit.note} onChange={(event) => setFindingEdit({ ...findingEdit, note: event.target.value })} required /></label><label className="span-two">מקור / מסמך<input value={findingEdit.source} onChange={(event) => setFindingEdit({ ...findingEdit, source: event.target.value })} /></label></div><div className="form-actions"><button className="button-primary" disabled={busy}>שמירת תיקון</button><button type="button" className="button-plain" onClick={() => setEditingFindingId(null)}>ביטול</button></div></form> : <><div className="finding-severity"><i className={`severity-dot sev-${item.severity === "גבוהה" ? "high" : item.severity === "נמוכה" ? "low" : "mid"}`} />{item.severity}</div><h3>{item.title}</h3><p>{item.note}</p><div className="finding-meta"><span>{item.category}</span>{item.source && <span>מקור: {item.source}</span>}{item.confidence !== null && <span>ביטחון AI: {item.confidence}%</span>}</div>{item.state === "לבדיקה" ? <div className="finding-review"><span>ממתין לבקרה</span><button onClick={() => void editFinding(item)} disabled={busy}><Pencil size={14} />עריכה</button><button onClick={() => void reviewFinding(item.id, "אושר")} disabled={busy}><Check size={15} />אישור</button><button onClick={() => void reviewFinding(item.id, "לברור")} disabled={busy}>העברה לבירור</button><button onClick={() => void reviewFinding(item.id, "נדחה")} disabled={busy}><X size={15} />דחייה</button></div> : <div className="reviewed-tag"><Check size={14} />{item.state}{item.reviewedBy ? ` · ${item.reviewedBy}` : ""}{item.reviewNote ? ` · ${item.reviewNote}` : ""}<button className="button-plain" disabled={busy} onClick={() => void editFinding(item)}><Pencil size={13} />עריכה</button></div>}</>}</article>)}</div> : <div className="inline-empty">לא נוספו ממצאים לתיק. ניתן להוסיף ממצאים לאחר בדיקת המסמכים והמקורות.</div>}
              </div>
              <div className="detail-section"><div className="section-title"><div><b>היסטוריית תיק</b><small>פעולות ועדכונים</small></div></div>{detail.activity.length ? <div className="activity-list">{detail.activity.map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><span><b>{event.action}</b><small>{event.detail}</small><em>{event.actorName} · {new Date(event.createdAt).toLocaleString("he-IL")}</em></span></div>)}</div> : <div className="inline-empty">אין עדיין עדכונים.</div>}</div>
              <div className="report-gate"><ShieldCheck size={19} /><span><b>בקרת ממצאים לפני דוח</b><small>{detail.findings.some((item) => item.state === "לבדיקה" || item.state === "לברור") ? "יש להשלים בדיקה של כל ממצא לפני הכנת הדוח." : detail.report ? `דוח גרסה ${detail.report.version} הופק. אפשר לפתוח אותו לפני השליחה ללקוח.` : "כל הממצאים נבדקו. ניתן להפיק דוח לשמירה או להדפסה."}</small></span><span className="gate-count">{detail.findings.filter((item) => item.state === "לבדיקה" || item.state === "לברור").length} לבדיקה</span>{!detail.findings.some((item) => item.state === "לבדיקה" || item.state === "לברור") && <><button className="report-create" disabled={busy || checklistItems.filter((item) => !item.automatic).some((item) => !detail.checklist?.[item.key]?.completed)} onClick={() => void generateReport()}>{detail.report ? "גרסה חדשה" : "הפקת דוח"}</button>{detail.report && <a className="report-open" href={`/staff/cases/${selectedId}/report`} target="_blank">פתיחת דוח {detail.report.version}</a>}{detail.report && selectedCase.status === "דוח מוכן" && <button className="report-create" disabled={busy || checklistItems.filter((item) => !item.automatic).some((item) => !detail.checklist?.[item.key]?.completed)} onClick={() => void sendReport()}>שליחת דוח ללקוח</button>}</>}</div>
            </>}</div>
          </section>
        </> : section === "tools" ? <>
          <div className="staff-heading"><div><div className="eyebrow">עזרים לצוות הבדיקה</div><h1>כלים חשובים</h1><p>חישובים ראשוניים וכלי עזר לבדיקת נכסים. התוצאות אינן תחליף לבדיקה מקצועית.</p></div></div>
          <div className="tools-grid"><section className="tool-card"><div className="tool-card-head"><span className="tool-icon"><Building2 size={19} /></span><div><b>מחיר למ״ר</b><small>חישוב מהיר לפי מחיר ושטח</small></div></div><div className="tool-fields"><label>מחיר מבוקש (₪)<input inputMode="numeric" value={toolPrice} onChange={(event) => setToolPrice(event.target.value.replace(/[^\d.]/g, ""))} placeholder="לדוגמה: 2,400,000" /></label><label>שטח הנכס (מ״ר)<input inputMode="decimal" value={toolArea} onChange={(event) => setToolArea(event.target.value.replace(/[^\d.]/g, ""))} placeholder="לדוגמה: 100" /></label></div><div className="tool-result"><small>מחיר משוער למ״ר</small><b>{pricePerMeter ? `₪ ${pricePerMeter.toLocaleString("he-IL")}` : "—"}</b></div></section>
            <section className="tool-card"><div className="tool-card-head"><span className="tool-icon"><Activity size={19} /></span><div><b>תשואה ברוטו משוערת</b><small>שכירות חודשית ביחס למחיר הנכס</small></div></div><div className="tool-fields"><label>מחיר הנכס (₪)<input inputMode="numeric" value={toolPrice} onChange={(event) => setToolPrice(event.target.value.replace(/[^\d.]/g, ""))} placeholder="לדוגמה: 2,400,000" /></label><label>שכירות חודשית (₪)<input inputMode="numeric" value={toolRent} onChange={(event) => setToolRent(event.target.value.replace(/[^\d.]/g, ""))} placeholder="לדוגמה: 6,500" /></label></div><div className="tool-result"><small>תשואה שנתית ברוטו</small><b>{grossYield ? `${grossYield.toFixed(2)}%` : "—"}</b></div></section>
            <section className="tool-card readiness-card"><div className="tool-card-head"><span className="tool-icon"><ShieldCheck size={19} /></span><div><b>מוכנות התיק לדוח</b><small>{selectedCase ? `${selectedCase.caseNumber} · ${selectedCase.clientName}` : "בחרו תיק כדי לראות את מצב ההכנה"}</small></div></div>{selectedCase && detail ? <><div className="readiness-list"><div><span className={detail.documents.length ? "ready-check" : "ready-pending"}>{detail.documents.length ? <Check size={14} /> : "1"}</span><span><b>מסמכי הנכס</b><small>{detail.documents.length ? `${detail.documents.length} מסמכים צורפו` : "לא צורפו מסמכים"}</small></span></div><div><span className={detail.findings.some((item) => item.state === "לבדיקה" || item.state === "לברור") ? "ready-pending" : "ready-check"}>{detail.findings.some((item) => item.state === "לבדיקה" || item.state === "לברור") ? "2" : <Check size={14} />}</span><span><b>בקרת ממצאים</b><small>{detail.findings.filter((item) => item.state === "לבדיקה" || item.state === "לברור").length ? `${detail.findings.filter((item) => item.state === "לבדיקה" || item.state === "לברור").length} ממצאים ממתינים` : "כל הממצאים נבדקו"}</small></span></div><div><span className={selectedCase.analystUserId ? "ready-check" : "ready-pending"}>{selectedCase.analystUserId ? <Check size={14} /> : "3"}</span><span><b>שיוך לאנליסט</b><small>{selectedCase.analystEmail || "טרם שויך אנליסט"}</small></span></div><div><span className={detail.report ? "ready-check" : "ready-pending"}>{detail.report ? <Check size={14} /> : "4"}</span><span><b>הפקת דוח</b><small>{detail.report ? `דוח גרסה ${detail.report.version} הופק` : "טרם הופק דוח"}</small></span></div></div><button className="button-primary" onClick={() => setSection("cases")}>פתיחת התיק לטיפול</button></> : <div className="tool-empty"><span>הכלי מציג מסמכים, בקרת ממצאים, שיוך ודוח לפי נתוני התיק שנבחר.</span><button className="button-primary" onClick={() => setSection("cases")}>בחירת תיק</button></div>}</section></div>
        </> : <section className="team-panel"><div className="staff-heading"><div><div className="eyebrow">הרשאות</div><h1>ניהול צוות</h1><p>רק עובדים שנוספו לכאן יוכלו להיכנס לתיקים.</p></div></div><form className="team-invite" onSubmit={addMember}><div><b>הוספת אנליסט</b><small>לאחר הוספתו, העובד ייכנס באמצעות החשבון שלו.</small></div><input type="email" placeholder="כתובת דוא״ל של העובד" value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} required /><button className="button-primary" disabled={busy}><Plus size={16} />הוספה לצוות</button></form><div className="team-list">{team.map((member) => <div className="team-row" key={member.email}><div className="profile-avatar">{member.displayName.slice(0, 1)}</div><span><b>{member.displayName}</b><small>{member.email}</small></span><span className="team-role">{member.role === "admin" ? "מנהלת מערכת" : "אנליסט"}</span><span className={member.active ? "member-active" : "member-inactive"}>{member.active ? "פעיל" : "לא פעיל"}</span></div>)}{!team.length && <div className="empty-state">רשימת הצוות ריקה.</div>}</div></section>}
      </div>
    </main>
    {notice && <div className="staff-toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="סגירה"><X size={15} /></button></div>}
  </div>;
}
