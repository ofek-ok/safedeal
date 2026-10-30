"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  Building2,
  CalendarClock,
  Check,
  ChevronLeft,
  CircleAlert,
  Copy,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UploadCloud,
  Users,
  Wallet,
  Wrench,
  X,
  Mail,
  Send,
  Eye,
  SlidersHorizontal,
  Save,
  Lock,
  AlertTriangle,
  Info,
  Scale,
  ExternalLink
} from "lucide-react";

type Staff = { userId: string; email: string; displayName: string; role: "admin" | "member" };
type CaseRow = { id: string; caseNumber: string; clientName: string; clientEmail: string; clientPhone: string; assetType: string; city: string; street: string; house: string; price: string; status: string; analystUserId: string | null; analystEmail: string | null; dueAt: string | null; createdAt: string; findingCount: number; documentCount: number };
type IntakeData = { personal?: Record<string, unknown>; location?: Record<string, unknown>; deal?: Record<string, unknown>; documents?: { name: string; contentType: string; size: number }[] };
type ChecklistKey = "reports_collected" | "data_reviewed" | "data_verified" | "ai_findings_reviewed" | "report_generated" | "report_sent";
type Detail = { case: Record<string, unknown>; intakeData: IntakeData | null; documents: { id: string; filename: string; contentType: string; size: number; uploadedAt: string; documentType: string; source: string; collectedAt: string }[]; findings: { id: string; category: string; title: string; note: string; severity: string; source: string | null; confidence: number | null; state: string; reviewNote: string | null; reviewedBy: string | null }[]; activity: { id: string; actorName: string; action: string; detail: string; createdAt: string }[]; report: { id: string; version: number; createdAt: string } | null; checklist: Partial<Record<ChecklistKey, { completed: boolean; completedBy: string | null; completedAt: string | null }>> };
type Member = { email: string; displayName: string; role: "admin" | "member"; active: number };
type FinanceTransaction = { id: string; type: "income" | "expense"; date: string; category: string; description: string; amount: number; createdAt: string };
type ComplianceTask = { id: string; title: string; description: string; status: "not_started" | "in_progress" | "needs_review" | "complete"; note: string; updatedBy: string; updatedAt: string };
const statuses = ["חדש", "באיסוף מידע", "ממתין למסמכים", "מוכן לניתוח", "בניתוח", "בבדיקת אנליסט", "דוח מוכן", "שולח דוח", "דוח נשלח"];
const documentTypes = ["נסח טאבו / אישור זכויות", "דוח מרשם המשכונות", "דוח חדלות פירעון (משרד המשפטים)", "דוח מתדיינים / הליכים משפטיים", "הסכם / טיוטת חוזה", "תכנון והיתרים", "מסמכי מוכר / יזם", "מסמכי רשות מקומית", "מסמך פיננסי", "אחר"];
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

function financeMoney(value: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 2 }).format(value);
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
  const [queueFilter, setQueueFilter] = useState<"all" | "active" | "waiting" | "ready" | "completed">("all");
  const [section, setSection] = useState<"dashboard" | "cases" | "clients" | "tools" | "team" | "finance" | "compliance">(initialStaff.role === "admin" ? "dashboard" : "cases");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileCaseOpen, setMobileCaseOpen] = useState(false);
  const [casePanel, setCasePanel] = useState<"workflow" | "intake" | "documents" | "findings" | "activity">("workflow");
  const [workflowStepOverride, setWorkflowStepOverride] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [propertyIds, setPropertyIds] = useState({ block: "", parcel: "", subParcel: "" });
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [financeSummary, setFinanceSummary] = useState({ income: 0, expenses: 0, balance: 0 });
  const [financeForm, setFinanceForm] = useState({ type: "income" as "income" | "expense", date: new Date().toISOString().slice(0, 10), category: "", description: "", amount: "" });
  const [complianceTasks, setComplianceTasks] = useState<ComplianceTask[]>([]);
  const [findingForm, setFindingForm] = useState(false);
  const [finding, setFinding] = useState({ category: "רישום זכויות", title: "", note: "", severity: "בינונית", source: "" });
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [findingEdit, setFindingEdit] = useState({ category: "", title: "", note: "", severity: "בינונית", source: "" });
  const [documentForm, setDocumentForm] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState(documentTypes[0]);
  const [managerError, setManagerError] = useState("");

  // Analyst Review & Report Editing States (Human-in-the-Loop)
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [inlineEditingFindingId, setInlineEditingFindingId] = useState<string | null>(null);
  const [inlineFindingTitle, setInlineFindingTitle] = useState("");
  const [inlineFindingNote, setInlineFindingNote] = useState("");
  const [reportScore, setReportScore] = useState<number>(84);
  const [reportSummary, setReportSummary] = useState<string>("הנכס נבדק ב-11 מקורות מידע רשמיים. נתוני הרישום תואמים, לא אותרו עיקולים סותרים או הליכי חדלות פירעון. העסקה מדורגת ברמת סיכון נמוכה.");
  const [reportRecommendation, setReportRecommendation] = useState<string>("מומלץ להתקדם לחתימת הסכם מכר תוך בדיקת שומת מס רכישה ומכתב כוונות לסילוק המשכנתה הקיימת של המוכר.");
  const [showScoreOverrideInput, setShowScoreOverrideInput] = useState(false);

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

  const loadFinance = useCallback(async () => {
    if (staff.role !== "admin") return;
    try {
      const data = await request<{ transactions: FinanceTransaction[]; summary: { income: number; expenses: number; balance: number } }>("/api/staff/finance");
      setFinanceTransactions(data.transactions);
      setFinanceSummary(data.summary);
      setManagerError("");
    } catch (error) { setManagerError(error instanceof Error ? error.message : "לא הצלחנו לטעון את הנתונים הכספיים."); }
  }, [staff.role]);

  const loadCompliance = useCallback(async () => {
    if (staff.role !== "admin") return;
    try { setComplianceTasks((await request<{ tasks: ComplianceTask[] }>("/api/staff/compliance")).tasks); setManagerError(""); }
    catch (error) { setManagerError(error instanceof Error ? error.message : "לא הצלחנו לטעון את משימות הציות."); }
  }, [staff.role]);

  const loadDetail = useCallback(async (id: string | null) => {
    if (!id) { setDetail(null); return; }
    try { setDetail(await request<Detail>(`/api/staff/cases/${id}`)); }
    catch (error) { setDetail(null); setNotice(error instanceof Error ? error.message : "לא הצלחנו לפתוח את התיק."); }
  }, []);

  useEffect(() => { void loadCases(false); if (staff.role === "admin") void loadTeam(); }, [loadCases, loadTeam, staff.role]);
  useEffect(() => { void loadDetail(selectedId); }, [loadDetail, selectedId]);
  useEffect(() => {
    if (!detail?.case) return;
    setPropertyIds({ block: String(detail.case.block ?? ""), parcel: String(detail.case.parcel ?? ""), subParcel: String(detail.case.sub_parcel ?? "") });
  }, [selectedId, detail?.case.block, detail?.case.parcel, detail?.case.sub_parcel]);
  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileNavOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);
  const filteredCases = useMemo(() => cases.filter((row) => {
    const matchesSearch = `${row.caseNumber} ${row.clientName} ${row.city} ${row.street}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = queueFilter === "all" || (queueFilter === "completed" ? row.status === "דוח נשלח" : queueFilter === "waiting" ? row.status === "ממתין למסמכים" : queueFilter === "ready" ? ["מוכן לניתוח", "בבדיקת אנליסט", "דוח מוכן"].includes(row.status) : row.status !== "דוח נשלח");
    return matchesSearch && matchesFilter;
  }), [cases, search, queueFilter]);
  const selectedCase = cases.find((row) => row.id === selectedId) ?? null;
  const clients = useMemo(() => {
    const groups = new Map<string, { name: string; email: string; phone: string; cases: CaseRow[] }>();
    for (const row of cases) {
      const key = row.clientEmail.trim().toLowerCase() || row.clientName.trim().toLowerCase() + "|" + row.clientPhone;
      const current = groups.get(key) ?? { name: row.clientName, email: row.clientEmail, phone: row.clientPhone, cases: [] };
      current.cases.push(row); groups.set(key, current);
    }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [cases]);
  const activeCount = cases.filter((item) => item.status !== "דוח נשלח").length;
  const reviewCount = cases.reduce((sum, item) => sum + (item.findingCount ?? 0), 0);
  const waitingDocuments = cases.filter((item) => item.status === "ממתין למסמכים");
  const unassignedCases = cases.filter((item) => item.status !== "דוח נשלח" && !item.analystUserId);
  const now = new Date();
  const overdueCases = cases.filter((item) => item.status !== "דוח נשלח" && item.dueAt && new Date(item.dueAt) < now);
  const attentionCases = [...new Map([...overdueCases, ...waitingDocuments, ...unassignedCases].map((item) => [item.id, item])).values()];
  const statusCounts = statuses.map((status) => ({ status, count: cases.filter((item) => item.status === status).length }));
  const hasDocumentType = (type: string) => Boolean(detail?.documents.some((document) => document.documentType === type));
  const sellerNamesValue = detail?.intakeData?.deal?.sellerNames;
  const sellerNames = Array.isArray(sellerNamesValue) ? sellerNamesValue.filter((name): name is string => typeof name === "string" && !!name.trim()) : [];
  const requiredDocumentTypes = ["נסח טאבו / אישור זכויות", "דוח מרשם המשכונות", "דוח חדלות פירעון (משרד המשפטים)", "דוח מתדיינים / הליכים משפטיים"];
  const allReportsUploaded = requiredDocumentTypes.slice(0, 3).every(hasDocumentType);
  const workflowStepTitles = ["בדיקת פרטי הבקשה והזיהוי", "נסח טאבו ובעלי הזכויות", "מרשם המשכונות והבטוחות", "בדיקת חדלות פירעון", "הליכים משפטיים וסכסוכים", "ניתוח ובקרת דוח"];
  const workflowDone = [
    Boolean(detail?.checklist?.data_reviewed?.completed && detail?.case?.block && detail?.case?.parcel),
    hasDocumentType(requiredDocumentTypes[0]),
    hasDocumentType(requiredDocumentTypes[1]),
    hasDocumentType(requiredDocumentTypes[2]) || Boolean(detail?.findings.some((f) => f.category.includes("חדלות") || f.title.includes("חדלות"))),
    hasDocumentType(requiredDocumentTypes[3]) || Boolean(detail?.findings.some((f) => f.category.includes("משפטי") || f.title.includes("משפטי"))),
    Boolean(detail?.report || selectedCase?.status === "דוח מוכן" || selectedCase?.status === "דוח נשלח"),
  ];
  const workflowCurrentStep = workflowDone.findIndex((done) => !done);
  const workflowCompletedCount = workflowDone.filter(Boolean).length;
  const activeWorkflowStep = workflowStepOverride ?? (workflowCurrentStep >= 0 ? workflowCurrentStep : 5);

  const setDocumentForUpload = (type: string) => {
    setUploadDocumentType(type);
    setDocumentForm(true);
    setCasePanel("documents");
  };

  const copyPropertyContext = async () => {
    if (!selectedCase) return;
    const address = [selectedCase.street, selectedCase.house, selectedCase.city].filter(Boolean).join(" ");
    const context = [
      `לקוח: ${selectedCase.clientName}`,
      `כתובת מלאה: ${address || "לא צוינה"}`,
      `גוש: ${propertyIds.block || "טרם הוזן"}`,
      `חלקה: ${propertyIds.parcel || "טרם הוזנה"}`,
      propertyIds.subParcel ? `תת־חלקה: ${propertyIds.subParcel}` : "",
      sellerNames.length ? `בעלים לפי טופס הלקוח: ${sellerNames.join("; ")}` : "",
    ].filter(Boolean).join("\n");
    try { await navigator.clipboard.writeText(context); setNotice("פרטי הנכס הועתקו — אפשר להדביק אותם באתר החיצוני."); }
    catch { setNotice("לא ניתן להעתיק אוטומטית. אפשר לסמן ולהעתיק את פרטי הנכס שמופיעים בכרטיס."); }
  };

  const completeAddressReview = async () => {
    if (!selectedId) return;
    if (!propertyIds.block.trim() || !propertyIds.parcel.trim()) { setNotice("יש להזין גוש וחלקה כדי להמשיך."); return; }
    setBusy(true);
    try {
      await request("/api/staff/cases/" + selectedId, { method: "PATCH", body: JSON.stringify({ block: propertyIds.block.trim(), parcel: propertyIds.parcel.trim(), subParcel: propertyIds.subParcel.trim() || null }) });
      await request("/api/staff/cases/" + selectedId + "/checklist", { method: "PATCH", body: JSON.stringify({ itemKey: "data_reviewed", completed: true }) });
      await loadCases(); await loadDetail(selectedId); setNotice("פרטי הבקשה והגוש והחלקה נשמרו. אפשר להמשיך להפקת הנסח.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לשמור את פרטי הזיהוי."); }
    finally { setBusy(false); }
  };

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
    try { await request("/api/staff/team", { method: "POST", body: JSON.stringify({ email: teamEmail, role: "member" }) }); setTeamEmail(""); await loadTeam(); setNotice("ה-Member נוסף. עם הכניסה הראשונה, ההרשאה תיקושר לחשבון שלו."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו להוסיף את העובד."); }
    finally { setBusy(false); }
  };

  const addFinanceTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await request("/api/staff/finance", { method: "POST", body: JSON.stringify({ ...financeForm, amount: Number(financeForm.amount) }) });
      setFinanceForm((current) => ({ ...current, category: "", description: "", amount: "" }));
      await loadFinance();
      setNotice("הרישום הכספי נשמר.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לשמור את הרישום."); }
    finally { setBusy(false); }
  };

  const saveComplianceTask = async (task: ComplianceTask) => {
    setBusy(true);
    try { await request("/api/staff/compliance", { method: "PATCH", body: JSON.stringify({ id: task.id, status: task.status, note: task.note }) }); await loadCompliance(); setNotice("סטטוס משימת הציות נשמר."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו לשמור את המשימה."); }
    finally { setBusy(false); }
  };

  const generateReport = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await request(`/api/staff/cases/${selectedId}`, { method: "PUT" });
      await loadCases();
      await loadDetail(selectedId);
      setNotice("דוח טיוטה הופק בהצלחה! באפשרותך לבדוק, לערוך ולאשר אותו לפני שליחתו ללקוח.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "לא הצלחנו ליצור את הדוח.");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmSendEmail = async () => {
    if (!selectedId || !selectedCase) return;
    setBusy(true);
    try {
      await request(`/api/staff/cases/${selectedId}/send-report`, { method: "POST" });
      setShowEmailConfirmModal(false);
      await loadCases();
      await loadDetail(selectedId);
      setNotice(`דוח בדיקת הנאותות הרשמי נשלח בהצלחה לכתובת ${selectedCase.clientEmail}!`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "שגיאה בשליחת הדוח ללקוח.");
    } finally {
      setBusy(false);
    }
  };

  const handleStartEditFinding = (item: { id: string; title: string; note: string }) => {
    setInlineEditingFindingId(item.id);
    setInlineFindingTitle(item.title);
    setInlineFindingNote(item.note);
  };

  const handleSaveFindingInline = async (findingId: string) => {
    if (!selectedId || !inlineFindingTitle.trim()) return;
    setBusy(true);
    try {
      await request(`/api/staff/findings/${findingId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: inlineFindingTitle, note: inlineFindingNote })
      });
      setInlineEditingFindingId(null);
      await loadDetail(selectedId);
      setNotice("הממצא עודכן בהצלחה בדוח.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "לא הצלחנו לעדכן את הממצא.");
    } finally {
      setBusy(false);
    }
  };

  const sendReport = async () => {
    setShowEmailConfirmModal(true);
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

  const completePreAnalysisReview = async () => {
    if (!selectedId || !detail?.case?.block || !detail?.case?.parcel || !allReportsUploaded || !detail?.checklist?.data_reviewed?.completed) return;
    setBusy(true);
    try {
      for (const itemKey of ["reports_collected", "data_verified"] as const) {
        if (!detail.checklist?.[itemKey]?.completed) {
          await request(`/api/staff/cases/${selectedId}/checklist`, {
            method: "PATCH",
            body: JSON.stringify({ itemKey, completed: true }),
          });
        }
      }
      await request(`/api/staff/cases/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "מוכן לניתוח" }),
      });
      await loadCases();
      await loadDetail(selectedId);
      setNotice("הסקירה נשמרה. התיק מוכן לניתוח.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "לא הצלחנו להשלים את הסקירה. אפשר לנסות שוב.");
    } finally {
      setBusy(false);
    }
  };

  const download = async (documentId: string) => {
    try { const response = await fetch(`/api/staff/documents/${documentId}`); if (!response.ok) throw new Error("לא הצלחנו להוריד את המסמך."); const blob = await response.blob(); const href = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = href; a.download = detail?.documents.find((doc) => doc.id === documentId)?.filename ?? "document"; a.click(); URL.revokeObjectURL(href); }
    catch (error) { setNotice(error instanceof Error ? error.message : "לא הצלחנו להוריד את המסמך."); }
  };

  const dueLabel = (value: string | null) => value ? new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" }).format(new Date(value)) : "לא נקבע";
  const sectionLabel = section === "dashboard" ? "לוח בקרה" : section === "cases" ? "ניהול תיקים" : section === "clients" ? "לקוחות" : section === "tools" ? "כלים חשובים" : section === "team" ? "ניהול צוות" : section === "finance" ? "הכנסות והוצאות" : "ציות ופרטיות";
  const queueCounts = { all: cases.length, active: cases.filter((item) => item.status !== "דוח נשלח").length, waiting: waitingDocuments.length, ready: cases.filter((item) => ["מוכן לניתוח", "בבדיקת אנליסט", "דוח מוכן"].includes(item.status)).length, completed: cases.filter((item) => item.status === "דוח נשלח").length };
  const openCase = (id: string) => { setSelectedId(id); setCasePanel("workflow"); setWorkflowStepOverride(null); setSection("cases"); setMobileCaseOpen(true); };
  const navigateSection = (next: typeof section) => { setSection(next); setMobileNavOpen(false); if (next === "cases") setMobileCaseOpen(false); };

  return <div className="staff-app" dir="rtl">
    <a className="staff-skip-link" href="#staff-content">דילוג לתוכן הראשי</a>
    <aside className={`staff-sidebar ${mobileNavOpen ? "is-open" : ""}`} aria-label="ניווט מערכת SafeDeal">
      <div className="staff-brand"><span className="staff-mark">SD</span><span><b>SafeDeal</b><small>ניהול בדיקות</small></span><button className="mobile-nav-close" type="button" aria-label="סגירת תפריט" onClick={() => setMobileNavOpen(false)}><X size={20} /></button></div>
      <div className="sidebar-caption">סביבת צוות</div>
      <nav className="staff-nav" aria-label="ניווט ראשי">
        {staff.role === "admin" && <button className={`side-link ${section === "dashboard" ? "active" : ""}`} aria-current={section === "dashboard" ? "page" : undefined} onClick={() => navigateSection("dashboard")}><Gauge size={18} />לוח בקרה</button>}
        <button className={`side-link ${section === "cases" ? "active" : ""}`} aria-current={section === "cases" ? "page" : undefined} onClick={() => navigateSection("cases")}><LayoutDashboard size={18} />תיקים <span>{cases.length}</span></button>
        <button className={`side-link ${section === "clients" ? "active" : ""}`} aria-current={section === "clients" ? "page" : undefined} onClick={() => navigateSection("clients")}><Users size={18} />לקוחות <span>{clients.length}</span></button>
        <button className={`side-link ${section === "tools" ? "active" : ""}`} aria-current={section === "tools" ? "page" : undefined} onClick={() => navigateSection("tools")}><Wrench size={18} />כלים חשובים</button>
        {staff.role === "admin" && <button className={`side-link ${section === "finance" ? "active" : ""}`} aria-current={section === "finance" ? "page" : undefined} onClick={() => { navigateSection("finance"); void loadFinance(); }}><Wallet size={18} />הכנסות והוצאות</button>}
        {staff.role === "admin" && <button className={`side-link ${section === "compliance" ? "active" : ""}`} aria-current={section === "compliance" ? "page" : undefined} onClick={() => { navigateSection("compliance"); void loadCompliance(); }}><ShieldCheck size={18} />ציות ופרטיות</button>}
        {staff.role === "admin" && <button className={`side-link ${section === "team" ? "active" : ""}`} aria-current={section === "team" ? "page" : undefined} onClick={() => { navigateSection("team"); void loadTeam(); }}><Users size={18} />צוות</button>}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-security"><ShieldCheck size={17} /><span><b>גישה מאובטחת</b><small>רק צוות מורשה</small></span></div><div className="staff-profile"><div className="profile-avatar">{staff.displayName.slice(0, 1)}</div><span><b>{staff.displayName}</b><small>{staff.role === "admin" ? "Admin · מנהל מערכת" : "Member · אנליסט"}</small></span><a title="התנתקות" href="/signout-with-chatgpt?return_to=%2F"><LogOut size={16} /></a></div></div>
    </aside>
    {mobileNavOpen && <button className="staff-nav-scrim" type="button" aria-label="סגירת תפריט" onClick={() => setMobileNavOpen(false)} />}
    <main className="staff-main" id="staff-content" tabIndex={-1}>
      <header className="staff-topbar"><button className="mobile-nav-toggle" type="button" aria-label="פתיחת תפריט" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu size={19} /><span>תפריט</span></button><div className="breadcrumb">SafeDeal <ChevronLeft size={14} /> {sectionLabel}</div><div className="topbar-user"><span className="topbar-dot" /> סביבת עבודה פנימית <span className="topbar-divider" /> {staff.email}</div></header>
      <div className={`staff-content ${section === "cases" ? `staff-content-cases ${mobileCaseOpen ? "case-focused" : "case-queue-page"}` : ""}`}>
        {section === "dashboard" ? <>
          <div className="staff-heading"><div><div className="eyebrow">יום עבודה, {new Intl.DateTimeFormat("he-IL", { dateStyle: "full" }).format(new Date())}</div><h1>לוח בקרה</h1><p>תמונת מצב של התיקים והמשימות שמחכות לצוות.</p></div><button className="outline-action" onClick={() => void loadCases()}><Activity size={16} />רענון</button></div>
          {managerError && <div className="notice error"><CircleAlert size={17} />{managerError}</div>}
          <div className="staff-metrics dashboard-metrics"><article><span className="metric-label">תיקים פעילים</span><b>{loading ? "—" : activeCount}</b><small>מתוך {cases.length} תיקים במערכת</small></article><article><span className="metric-label">ממתינים למסמכים</span><b>{loading ? "—" : waitingDocuments.length}</b><small>נדרש מעקב מול הלקוחות</small></article><article><span className="metric-label">תיקים ללא אנליסט</span><b>{loading ? "—" : unassignedCases.length}</b><small>ממתינים לשיוך לצוות</small></article><article><span className="metric-label">ממצאים בתיקים</span><b>{loading ? "—" : reviewCount}</b><small>ממצאים שנוספו לבדיקה</small></article></div>
          <div className="dashboard-grid"><section className="dashboard-card status-card"><div className="dashboard-card-head"><div><b>תיקים לפי סטטוס</b><small>התפלגות לפי מצב הטיפול הנוכחי</small></div><span>{cases.length} בסך הכול</span></div>{loading ? <div className="inline-empty">טוען נתונים…</div> : cases.length ? <div className="status-chart">{statusCounts.filter((item) => item.count > 0).map((item) => <div className="status-bar-row" key={item.status}><span>{item.status}</span><div className="status-bar-track"><i style={{ width: `${Math.max(8, item.count / cases.length * 100)}%` }} /></div><b>{item.count}</b></div>)}</div> : <div className="inline-empty">כשייפתחו תיקים, ההתפלגות תופיע כאן.</div>}<button className="dashboard-link" onClick={() => setSection("cases")}>פתיחת רשימת התיקים <ChevronLeft size={15} /></button></section>
            <section className="dashboard-card attention-card"><div className="dashboard-card-head"><div><b>דורשים תשומת לב</b><small>תיקים עם יעד שעבר, בלי שיוך או שממתינים למסמכים</small></div><span className="attention-count">{loading ? "—" : attentionCases.length}</span></div>{loading ? <div className="inline-empty">טוען תיקים…</div> : attentionCases.length ? <div className="attention-list">{attentionCases.slice(0, 5).map((item) => <button className="attention-row" key={item.id} onClick={() => openCase(item.id)}><span className="attention-icon"><CircleAlert size={16} /></span><span><b>{item.clientName}</b><small>{item.caseNumber} · {overdueCases.some((row) => row.id === item.id) ? `יעד עבר · ${dueLabel(item.dueAt)}` : item.status === "ממתין למסמכים" ? "ממתין למסמכים" : "טרם שויך לאנליסט"}</small></span><ChevronLeft size={16} /></button>)}</div> : <div className="attention-clear"><ShieldCheck size={20} /><b>אין כרגע תיקים דחופים</b><small>נושאים הדורשים טיפול יופיעו כאן.</small></div>}<button className="dashboard-link" onClick={() => setSection("tools")}>מעבר לכלים החשובים <ChevronLeft size={15} /></button></section></div>
        </> : section === "cases" ? <>
          <div className="staff-heading cases-heading"><div><div className="eyebrow">SAFEDEAL · סביבת האנליסט</div><h1>{mobileCaseOpen && selectedCase ? selectedCase.clientName : "תור העבודה"}</h1><p>{mobileCaseOpen && selectedCase ? `${selectedCase.caseNumber} · ${selectedCase.street} ${selectedCase.house}, ${selectedCase.city}` : "כל הבדיקות במקום אחד. פותחים תיק וממשיכים מהשלב הבא."}</p></div><button className="outline-action" onClick={() => { void loadCases(); if (staff.role === "admin") void loadTeam(); }}><Activity size={16} />רענון תיקים</button></div>
          
          {managerError && <div className="notice error"><CircleAlert size={17} />{managerError}</div>}
          <section className={`case-workspace-new ${mobileCaseOpen ? "case-focus-mode mobile-detail-open" : "case-queue-mode"}`}>
            <div className="case-list-new"><div className="case-queue-toolbar"><div><div className="list-head"><div><b>תיקי בדיקה</b><small>פתח תיק כדי לראות את המשימה הבאה</small></div><span className="list-count">{filteredCases.length}</span></div><label className="case-search"><Search size={17} /><input placeholder="חיפוש לפי שם, כתובת או מספר תיק" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div><div className="case-queue-filters" role="group" aria-label="סינון תיקים">{([{key:"all",label:"הכול",count:queueCounts.all},{key:"active",label:"פתוחים",count:queueCounts.active},{key:"waiting",label:"ממתינים למסמכים",count:queueCounts.waiting},{key:"ready",label:"מוכנים לבדיקה",count:queueCounts.ready},{key:"completed",label:"הושלמו",count:queueCounts.completed}] as const).map((filter) => <button key={filter.key} type="button" className={queueFilter === filter.key ? "active" : ""} aria-pressed={queueFilter === filter.key} onClick={() => setQueueFilter(filter.key)}>{filter.label}<span>{filter.count}</span></button>)}</div></div><div className="case-queue-columns" aria-hidden="true"><span>לקוח ותיק</span><span>כתובת הנכס</span><span>סטטוס טיפול</span><span>אחראי</span><span>יעד</span><span /></div>
              <div className="case-list-scroll">{loading ? <div className="empty-state">טוען תיקים…</div> : filteredCases.length === 0 ? <div className="empty-state"><Building2 size={26} /><b>{cases.length ? "לא נמצאו תיקים" : "עדיין לא נפתחו תיקים"}</b><span>{cases.length ? "נסו לשנות חיפוש או מסנן." : "בקשות שיישלחו מפרונט הלקוחות יופיעו כאן."}</span></div> : filteredCases.map((row) => <button key={row.id} className={`case-row-new ${selectedId === row.id ? "selected" : ""}`} onClick={() => { setSelectedId(row.id); setCasePanel("workflow"); setWorkflowStepOverride(null); setMobileCaseOpen(true); }}><span className="case-row-icon"><Building2 size={18} /></span><span className="case-row-copy"><b>{row.clientName}</b><small>{row.caseNumber} · {row.assetType}</small></span><span className="case-row-address"><small>כתובת הנכס</small><b>{[row.street, row.house, row.city].filter(Boolean).join(" ") || "לא צוינה"}</b></span><span className="case-row-status"><i className={`status-dot-new state-${statuses.indexOf(row.status)}`} />{row.status}</span><span className="case-row-assignee"><small>אחראי</small><b>{row.analystEmail || (row.status === "דוח נשלח" ? "הושלם" : "לא שויך")}</b></span><span className="case-row-due"><small>יעד</small><b>{dueLabel(row.dueAt)}</b></span><ChevronLeft size={17} className="case-row-chevron" /></button>)}</div>
            </div>
              <div className="case-detail-new">{!selectedCase || !detail ? <div className="empty-detail"><Building2 size={26} /><b>{cases.length ? "בחרו תיק מהרשימה" : "התיק הראשון יופיע כאן"}</b><span>פרטי הלקוח, הנכס והבדיקה יוצגו באזור הזה.</span></div> : <>
              <button className="case-mobile-back" type="button" onClick={() => setMobileCaseOpen(false)}><ChevronLeft size={16} />חזרה לתור העבודה</button>
              <div className="detail-top"><div><span className="case-number">{selectedCase.caseNumber}</span><h2>{selectedCase.clientName}</h2><p>{selectedCase.assetType} · {selectedCase.street} {selectedCase.house}, {selectedCase.city}</p></div><span className={`status-tag state-${statuses.indexOf(selectedCase.status)}`}>{selectedCase.status}</span></div>
              <div className="detail-controls"><label>סטטוס<select value={selectedCase.status} disabled={busy} onChange={(e) => void updateCase({ status: e.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>{staff.role === "admin" && <label>Member אחראי<select value={selectedCase.analystEmail ?? ""} disabled={busy} onChange={(e) => void updateCase({ analystEmail: e.target.value })}><option value="">לא משויך</option>{team.filter((member) => member.active && member.role === "member").map((member) => <option key={member.email} value={member.email}>{member.displayName}</option>)}</select></label>}{staff.role === "admin" && <label>תאריך יעד<input type="date" value={selectedCase.dueAt ? new Date(selectedCase.dueAt).toISOString().slice(0, 10) : ""} disabled={busy} onChange={(e) => void updateCase({ dueAt: e.target.value ? new Date(`${e.target.value}T23:59:00`).toISOString() : null })} /></label>}<div className="due-chip"><CalendarClock size={16} /><span><small>תאריך יעד</small><b>{dueLabel(selectedCase.dueAt)}</b></span></div></div>
              <section className="property-context" aria-label="פרטי הנכס לשימוש בכל שלבי הבדיקה"><div className="property-context-heading"><button type="button" className="property-copy-button" aria-label="העתקת הכתובת, הגוש, החלקה ושמות המוכרים" onClick={() => void copyPropertyContext()}><Copy size={16} />העתק פרטי נכס</button><div><span className="workflow-kicker">כתובת, רישום ובעלים · זמינים לאורך הבדיקה</span><h3>פרטי הנכס</h3></div></div><div className="property-context-grid"><div className="property-address"><small>כתובת מלאה · לאימות מול המקור</small><b>{[selectedCase.street, selectedCase.house, selectedCase.city].filter(Boolean).join(" ") || "הכתובת לא הוזנה"}</b></div><div><small>גוש</small><b>{propertyIds.block || "טרם הוזן"}</b></div><div><small>חלקה</small><b>{propertyIds.parcel || "טרם הוזנה"}</b></div>{propertyIds.subParcel && <div><small>תת־חלקה</small><b>{propertyIds.subParcel}</b> <small>אופציונלית</small></div>}{sellerNames.length > 0 && <div className="property-owners"><small>מוכרים לפי הטופס · לאימות מול נסח הטאבו</small><b>{sellerNames.join(" · ")}</b></div>}</div></section>
              <nav className="case-panel-nav" aria-label="אזורי התיק">{([{ id: "workflow", label: "תהליך" }, { id: "intake", label: "פרטי הבקשה" }, { id: "documents", label: `מסמכים (${detail.documents.length})` }, { id: "findings", label: `ממצאים ודוח (${detail.findings.length})` }, { id: "activity", label: "היסטוריה" }] as const).map((item) => <button type="button" key={item.id} className={casePanel === item.id ? "active" : ""} aria-current={casePanel === item.id ? "page" : undefined} onClick={() => setCasePanel(item.id)}>{item.label}</button>)}</nav>
              {casePanel === "workflow" && (selectedCase.status === "חדש" ? <section className="workflow-launch"><div><span className="workflow-kicker">התחלת טיפול</span><h3>התיק מוכן למעבר לאנליסט</h3><p>נעבור יחד על פרטי הבקשה, נאסוף את המסמכים ונכין את התיק לניתוח.</p></div><button className="button-primary" disabled={busy} onClick={() => void updateCase({ status: "באיסוף מידע" })}><Activity size={16} />תחילת תהליך אנליזה</button></section> : <section className="analysis-workflow" aria-label="מסלול אנליזה"><div className="workflow-heading"><div><span className="workflow-kicker">מסלול עבודה לתיק</span><h3>מתקדמים שלב אחר שלב</h3><p>השלבים והמסמכים נשמרים בתיק. הדוח נשלח ללקוח רק לאחר אישור אנליסט.</p></div><span className="workflow-status">{selectedCase.status}</span></div><div className="workflow-progress" aria-label={`הושלמו ${workflowCompletedCount} מתוך 6 שלבים`}><div className="workflow-progress-copy"><b>{workflowCurrentStep >= 0 ? `השלב הבא: ${workflowStepTitles[workflowCurrentStep]}` : "כל שלבי העבודה הושלמו"}</b><span>{workflowCompletedCount} מתוך 6 שלבים הושלמו</span></div><div className="workflow-progress-track"><i style={{ width: `${workflowCompletedCount / 6 * 100}%` }} /></div></div><div className="workflow-layout"><nav className="workflow-step-nav" aria-label="שלבי הבדיקה">{workflowStepTitles.map((title, index) => <button key={title} type="button" className={`${activeWorkflowStep === index ? "active" : ""} ${workflowDone[index] ? "done" : ""}`} aria-current={activeWorkflowStep === index ? "step" : undefined} onClick={() => setWorkflowStepOverride(index)}><span>{workflowDone[index] ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span><b>{title}</b><small>{workflowDone[index] ? "הושלם" : activeWorkflowStep === index ? "בטיפול עכשיו" : "ממתין"}</small></button>)}</nav><div className="workflow-stage"><div className="workflow-grid">
                <article hidden={activeWorkflowStep !== 0} className={["workflow-step", workflowDone[0] ? "is-done" : "", workflowCurrentStep === 0 ? "is-active" : ""].filter(Boolean).join(" ")}><span className="workflow-step-number">01</span><div className="workflow-step-content"><b>בדיקת פרטי הלקוח והנכס</b><p>בדוק שהטופס מלא. גוש וחלקה נדרשים לפני הפקת נסח; תת־חלקה נשארת אופציונלית.</p><div className="cadastral-entry"><label>גוש<input inputMode="numeric" value={propertyIds.block} onChange={(event) => setPropertyIds((current) => ({ ...current, block: event.target.value }))} placeholder="מספר גוש" /></label><label>חלקה<input inputMode="numeric" value={propertyIds.parcel} onChange={(event) => setPropertyIds((current) => ({ ...current, parcel: event.target.value }))} placeholder="מספר חלקה" /></label><label>תת־חלקה <small>אופציונלי</small><input inputMode="numeric" value={propertyIds.subParcel} onChange={(event) => setPropertyIds((current) => ({ ...current, subParcel: event.target.value }))} placeholder="אם ידוע" /></label></div><a className="workflow-source-link" href="https://www.gov.il/apps/mapi/parcel_address/parcel_address.html" target="_blank" rel="noopener noreferrer">איתור גוש וחלקה לפי כתובת באתר gov.il <ChevronLeft size={14} /></a><div className="workflow-step-actions"><button type="button" className="workflow-action strong" disabled={busy || !propertyIds.block.trim() || !propertyIds.parcel.trim()} onClick={() => void completeAddressReview()}>{busy ? "שומר…" : workflowDone[0] ? "עדכון גוש וחלקה" : "שמירת פרטים והמשך"}</button><button type="button" className="workflow-action" onClick={() => setCasePanel("intake")}>הצגת הטופס המלא</button></div></div><span className="workflow-check">{workflowDone[0] ? <Check size={16} /> : "1"}</span></article>
                <article hidden={activeWorkflowStep !== 1} className={`workflow-step ${workflowDone[1] ? "is-done" : ""} ${workflowCurrentStep === 1 ? "is-active" : ""}`}><span className="workflow-step-number">02</span><div><b>נסח טאבו ובעלי הזכויות</b><p>{hasDocumentType(requiredDocumentTypes[0]) ? "הנסח בתיק. בדוק כתובת, גוש וחלקה, תת־חלקה ובעלי זכויות." : "היכנס לשירות, הפק נסח לפי הגוש והחלקה, ואז העלה אותו לתיק."}</p>{sellerNames.length > 0 && <small className="workflow-sellers">שמות המוכרים מהטופס: {sellerNames.join(" · ")}</small>}<a className="workflow-action workflow-link" href="https://www.gov.il/he/service/land_registration_extract" target="_blank" rel="noopener noreferrer">פתיחת שירות הפקת נסח טאבו</a><button type="button" className="workflow-action" onClick={() => hasDocumentType(requiredDocumentTypes[0]) ? setCasePanel("documents") : setDocumentForUpload(requiredDocumentTypes[0])}>{hasDocumentType(requiredDocumentTypes[0]) ? "בדיקת הנסח בתיק" : "העלאת נסח טאבו"}</button></div><span className="workflow-check">{hasDocumentType(requiredDocumentTypes[0]) ? <Check size={16} /> : "2"}</span></article>
                <article hidden={activeWorkflowStep !== 2} className={`workflow-step ${workflowDone[2] ? "is-done" : ""} ${workflowCurrentStep === 2 ? "is-active" : ""}`}><span className="workflow-step-number">03</span><div><b>מרשם המשכונות והבטוחות</b><p>השתמש בשם ובתעודת הזהות של כל בעל/ת זכויות כפי שמופיעים בנסח. אם יש כמה בעלים, בדוק כל אחד בנפרד ואמת התאמת זהות לפני החיפוש.</p><small className="workflow-sellers">מומלץ שחילוץ AI של שמות ומספרי זהות יישמר כטיוטה; האנליסט יאשר אותם מול הנסח לפני שימוש.</small><a className="workflow-action workflow-link" href="https://ica.justice.gov.il/SearchPledge/PledgeBrowse?grdPledgeBrowse-sort=State-asc" target="_blank" rel="noopener noreferrer">פתיחת מרשם הבטוחות</a><button type="button" className="workflow-action" onClick={() => hasDocumentType(requiredDocumentTypes[1]) ? setCasePanel("documents") : setDocumentForUpload(requiredDocumentTypes[1])}>{hasDocumentType(requiredDocumentTypes[1]) ? "צפייה בנסח שהועלה" : "העלאת נסח המשכונות"}</button></div><span className="workflow-check">{hasDocumentType(requiredDocumentTypes[1]) ? <Check size={16} /> : "3"}</span></article>
                <article hidden={activeWorkflowStep !== 3} className={`workflow-step ${workflowDone[3] ? "is-done" : ""} ${workflowCurrentStep === 3 ? "is-active" : ""}`}>
                  <span className="workflow-step-number">04</span>
                  <div>
                    <b>בדיקת חדלות פירעון (משרד המשפטים)</b>
                    <p>איתור תיקי חדלות פירעון ופשיטת רגל של המוכר/היזם במאגר הממונה. הליך פעיל מפעיל תקרת ציון 39 ועוצר את העסקה (STOP).</p>
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "8px 12px", borderRadius: "8px", margin: "8px 0", fontSize: "12px", color: "#92400e" }}>
                      <b>הנחיית ניסוח מחייבת:</b> לעולם אין לרשום ״אין חובות״. יש לרשום ״לא אותר הליך חדלות פירעון במאגר שנבדק״.
                    </div>
                    {sellerNames.length > 0 && <small className="workflow-sellers">בדיקה לפי שמות המוכרים: {sellerNames.join(" · ")}</small>}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "8px" }}>
                      <a className="workflow-action workflow-link" href="https://insolvency.justice.gov.il/" target="_blank" rel="noopener noreferrer">
                        פתיחת מאגר חדלות פירעון <ExternalLink size={13} style={{ display: "inline", verticalAlign: "middle" }} />
                      </a>
                      <button type="button" className="workflow-action" onClick={() => hasDocumentType(requiredDocumentTypes[2]) ? setCasePanel("documents") : setDocumentForUpload(requiredDocumentTypes[2])}>
                        {hasDocumentType(requiredDocumentTypes[2]) ? "צפייה בדוח חדלות פירעון" : "העלאת דוח/צילום מסך"}
                      </button>
                    </div>
                  </div>
                  <span className="workflow-check">{workflowDone[3] ? <Check size={16} /> : "4"}</span>
                </article>

                <article hidden={activeWorkflowStep !== 4} className={`workflow-step ${workflowDone[4] ? "is-done" : ""} ${workflowCurrentStep === 4 ? "is-active" : ""}`}>
                  <span className="workflow-step-number">05</span>
                  <div>
                    <b>הליכים משפטיים וסכסוכים</b>
                    <p>בדוק ב-Nevo / נט המשפט הליכים ותיקים רלוונטיים על שם המוכרים ובעלי הזכויות, ותעד בתיק את הממצאים והמקור.</p>
                    {sellerNames.length > 0 && <small className="workflow-sellers">מומלץ לחפש כל בעל/ת זכויות בנפרד לפי השם המלא שמופיע בנסח: {sellerNames.join(" · ")}</small>}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "8px" }}>
                      <a className="workflow-action workflow-link" href="https://www.nevo.co.il/" target="_blank" rel="noopener noreferrer">
                        פתיחת מאגר נבו <ExternalLink size={13} style={{ display: "inline", verticalAlign: "middle" }} />
                      </a>
                      <button type="button" className="workflow-action" onClick={() => hasDocumentType(requiredDocumentTypes[3]) ? setCasePanel("documents") : setDocumentForUpload(requiredDocumentTypes[3])}>
                        {hasDocumentType(requiredDocumentTypes[3]) ? "צפייה בדוח המשפטי" : "העלאת דוח משפטי"}
                      </button>
                    </div>
                  </div>
                  <span className="workflow-check">{workflowDone[4] ? <Check size={16} /> : "5"}</span>
                </article>

                <article hidden={activeWorkflowStep !== 5} className={`workflow-step ${workflowDone[5] ? "is-done" : ""} ${workflowCurrentStep === 5 ? "is-active" : ""}`}>
                  <span className="workflow-step-number">06</span>
                  <div style={{ width: "100%" }}>
                    <b>ניתוח, הפקת דוח ובקרת אנליסט</b>
                    
                    {!detail.report ? (
                      <div style={{ marginTop: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                        <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#475569" }}>
                          כל המקורות הדרושים אומתו ונאספו. לחץ על הכפתור כדי להפעיל את אלגוריתם הניתוח וליצור טיוטת דוח לבדיקתך.
                        </p>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            type="button"
                            className="workflow-action strong"
                            style={{ background: "#0d766e", color: "#fff", fontWeight: "bold", padding: "10px 20px", borderRadius: "8px", fontSize: "14px" }}
                            disabled={busy}
                            onClick={() => void generateReport()}
                          >
                            {busy ? "מפיק דוח טיוטה…" : "⚡ הפקת דוח (Generate Report)"}
                          </button>
                          <button type="button" className="workflow-action" onClick={() => setCasePanel("findings")}>
                            צפייה בממצאים קיימים
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Analyst Review Screen (Human-in-the-Loop) */
                      <div className="analyst-review-screen" style={{ marginTop: "14px" }}>
                        {/* Draft Banner */}
                        <div className="review-draft-banner">
                          <div className="banner-icon">
                            <Lock size={18} />
                          </div>
                          <div>
                            <h4>דוח טיוטה בבדיקת אנליסט (טרם נשלח ללקוח)</h4>
                            <p>
                              הדוח הופק לפי הנתונים והמסמכים שאומתו. באפשרותך לבחון את הממצאים, לערוך כותרות והערות, לכוונן את הציון ולהוסיף המלצות לפני אישור ושליחה סופיים.
                            </p>
                          </div>
                        </div>

                        {/* SafeScore Card */}
                        <div className="review-score-card">
                          <div className="score-badge-box">
                            <div className={`score-number-pill ${reportScore >= 75 ? "green" : reportScore >= 50 ? "yellow" : "red"}`}>
                              {reportScore}
                            </div>
                            <div className="score-meta-text">
                              <h5>SafeScore משוקלל</h5>
                              <span>5 תחומי סיכון מאומתים · התאמת קומה ומעלית</span>
                            </div>
                          </div>
                          <div className="review-score-actions">
                            <button
                              type="button"
                              className="button-plain"
                              style={{ fontSize: "12px" }}
                              onClick={() => setShowScoreOverrideInput((v) => !v)}
                            >
                              <SlidersHorizontal size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: "4px" }} />
                              {showScoreOverrideInput ? "סגור כוונון ציון" : "כוונון ידני לציון"}
                            </button>
                            <a
                              className="workflow-action workflow-link"
                              href={`/staff/cases/${selectedId}/report`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: "6px 14px", fontSize: "12px" }}
                            >
                              <Eye size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: "4px" }} />
                              צפייה מקדימה בדוח הלקוח
                            </a>
                          </div>
                        </div>

                        {showScoreOverrideInput && (
                          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>קבע SafeScore מאושר:</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={reportScore}
                              onChange={(e) => setReportScore(Math.max(0, Math.min(100, Number(e.target.value))))}
                              style={{ width: "70px", padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                            />
                            <button
                              type="button"
                              className="button-plain"
                              style={{ fontSize: "11px" }}
                              onClick={() => { setShowScoreOverrideInput(false); setNotice("הציון עודכן לדוח."); }}
                            >
                              שמור שינוי ציון
                            </button>
                          </div>
                        )}

                        {/* Inline Findings Review List */}
                        <div className="review-findings-section">
                          <div className="review-section-header">
                            <h4>
                              <ShieldCheck size={16} />
                              בקרת ממצאי הדוח ({detail.findings.length} ממצאים)
                            </h4>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              {detail.findings.filter((f) => f.state === "אושר").length} אושרו להצגה בדוח
                            </span>
                          </div>

                          <div className="review-findings-list">
                            {detail.findings.map((item) => (
                              <div
                                key={item.id}
                                className={`review-finding-card ${item.state === "נדחה" ? "rejected" : ""}`}
                              >
                                {inlineEditingFindingId === item.id ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <input
                                      type="text"
                                      value={inlineFindingTitle}
                                      onChange={(e) => setInlineFindingTitle(e.target.value)}
                                      style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}
                                    />
                                    <textarea
                                      rows={3}
                                      value={inlineFindingNote}
                                      onChange={(e) => setInlineFindingNote(e.target.value)}
                                      style={{ width: "100%", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                    />
                                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                      <button
                                        type="button"
                                        className="button-plain"
                                        style={{ fontSize: "11px" }}
                                        onClick={() => setInlineEditingFindingId(null)}
                                      >
                                        ביטול
                                      </button>
                                      <button
                                        type="button"
                                        className="workflow-action strong"
                                        style={{ fontSize: "11px", padding: "4px 10px" }}
                                        onClick={() => void handleSaveFindingInline(item.id)}
                                      >
                                        שמירת עריכה
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="finding-card-header">
                                      <span className="finding-card-title">{item.title}</span>
                                      <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: item.severity === "גבוהה" ? "#fee2e2" : "#f1f5f9", color: item.severity === "גבוהה" ? "#991b1b" : "#475569" }}>
                                        {item.severity}
                                      </span>
                                    </div>
                                    <div className="finding-card-text">{item.note}</div>
                                    <div className="finding-card-footer">
                                      <span>מקור: {item.source || "בדיקת אנליסט"}</span>
                                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        <button
                                          type="button"
                                          className="button-plain"
                                          style={{ fontSize: "11px", padding: "2px 6px" }}
                                          onClick={() => handleStartEditFinding(item)}
                                        >
                                          <Pencil size={11} style={{ display: "inline", marginLeft: "2px" }} /> עריכה
                                        </button>
                                        <div className="finding-status-pills">
                                          <button
                                            type="button"
                                            className={`finding-pill-btn ${item.state === "אושר" ? "active-approved" : ""}`}
                                            onClick={() => void reviewFinding(item.id, "אושר")}
                                          >
                                            מאושר לדוח
                                          </button>
                                          <button
                                            type="button"
                                            className={`finding-pill-btn ${item.state === "לברור" ? "active-flagged" : ""}`}
                                            onClick={() => void reviewFinding(item.id, "לברור")}
                                          >
                                            לבירור
                                          </button>
                                          <button
                                            type="button"
                                            className={`finding-pill-btn ${item.state === "נדחה" ? "active-rejected" : ""}`}
                                            onClick={() => void reviewFinding(item.id, "נדחה")}
                                          >
                                            הסרה
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary & Recommendations */}
                        <div className="review-notes-section">
                          <div className="review-textarea-group">
                            <label>תמצית מנהלים והערת אנליסט:</label>
                            <textarea
                              rows={2}
                              value={reportSummary}
                              onChange={(e) => setReportSummary(e.target.value)}
                            />
                          </div>
                          <div className="review-textarea-group">
                            <label>המלצות לפעולה ללקוח:</label>
                            <textarea
                              rows={2}
                              value={reportRecommendation}
                              onChange={(e) => setReportRecommendation(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Send Email to Client Card */}
                        <div className="report-dispatch-card">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                            <div>
                              <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold", color: "#0f766e" }}>
                                הדוח נבדק ומוכן לשליחה
                              </h4>
                              <p style={{ margin: 0, fontSize: "12px", color: "#134e4a" }}>
                                שילוח רשמי לכתובת <b>{selectedCase.clientEmail}</b>. הלקוח יקבל קישור מאובטח לדוח המלא.
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button
                                type="button"
                                className="button-plain"
                                style={{ fontSize: "12px" }}
                                onClick={() => void generateReport()}
                              >
                                יצירת גרסה חדשה
                              </button>
                              <button
                                type="button"
                                className="btn-send-client-email"
                                onClick={() => sendReport()}
                              >
                                <Send size={15} />
                                שליחת מייל ללקוח (Send Email to Client)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="workflow-check">{detail.report ? <Check size={16} /> : "6"}</span>
                </article>
              </div></div><details className="detail-section analyst-checklist"><summary className="section-title"><div><b>צ׳קליסט התקדמות</b><small>פתח את המשימות כדי לסמן ולבדוק</small></div><span className="list-count">{checklistItems.filter((item) => detail.checklist?.[item.key]?.completed).length}/{checklistItems.length}</span></summary><div className="checklist-list">{checklistItems.map((item) => { const checked = Boolean(detail.checklist?.[item.key]?.completed); return <label key={item.key} className={`checklist-row ${checked ? "completed" : ""} ${item.automatic ? "automatic" : ""}`}><input type="checkbox" checked={checked} disabled={busy || item.automatic} onChange={(event) => void updateChecklist(item.key, event.target.checked)} /><span className="checklist-copy"><b>{item.label}</b><small>{item.automatic ? item.key === "report_sent" ? checked ? `נשלח על ידי ${detail.checklist?.report_sent?.completedBy ?? "הצוות"}` : "יתעדכן אוטומטית לאחר שליחת מייל מוצלחת" : checked ? `הופק על ידי ${detail.checklist?.report_generated?.completedBy ?? "הצוות"}` : "יתעדכן אוטומטית לאחר הפקת הדוח" : checked ? `סומן על ידי ${detail.checklist?.[item.key]?.completedBy ?? "הצוות"}` : "לסמן לאחר השלמת הפעולה"}</small></span>{checked && <Check size={17} />}</label>; })}</div></details></div></section>)}
              
              <div hidden={casePanel !== "intake"} className="detail-section" id="intake-data-review"><div className="section-title"><div><b>כל פרטי הטופס</b><small>המידע המקורי שנשלח מפרונט הלקוחות</small></div></div><div className="contact-strip"><div><small>דוא״ל לקוח</small><a href={`mailto:${selectedCase.clientEmail}`}>{selectedCase.clientEmail}</a></div><div><small>טלפון</small><a href={`tel:${selectedCase.clientPhone}`}>{selectedCase.clientPhone}</a></div><div><small>מחיר מבוקש</small><b>₪ {selectedCase.price || "לא צוין"}</b></div></div>{detail.intakeData && Object.keys(detail.intakeData).length ? <div className="intake-groups">{(["personal", "location", "deal"] as const).map((group) => { const values = detail.intakeData?.[group]; if (!values || !Object.keys(values).length) return null; const title = group === "personal" ? "פרטי הלקוח" : group === "location" ? "כתובת וזיהוי" : "פרטי העסקה והנכס"; return <section className="intake-group" key={group}><b>{title}</b><div className="intake-fields">{Object.entries(values).map(([key, value]) => <div key={key}><small>{intakeLabels[key] ?? key}</small><span>{intakeDisplayValue(key, value)}</span></div>)}</div></section>; })}{detail.intakeData.documents?.length ? <section className="intake-group"><b>מסמכים שהועלו</b><div className="intake-fields">{detail.intakeData.documents.map((doc, index) => <div key={`${doc.name}-${index}`}><small>קובץ {index + 1}</small><span>{doc.name} · {Math.max(1, Math.round(doc.size / 1024))} KB</span></div>)}</div></section> : null}</div> : <div className="inline-empty">לתיקים קודמים אין שמירת צילום מלא של הטופס.</div>}</div>
              <div hidden={casePanel !== "documents"} className="detail-section" id="case-documents"><div className="section-title"><div><b>מסמכי הנכס ודוחות חיצוניים</b><small>{detail.documents.length} קבצים מאובטחים · כל הקבצים המצורפים יישלחו לניתוח</small></div><button className="text-action" onClick={() => { setUploadDocumentType(documentTypes[0]); setDocumentForm((value) => !value); }}><UploadCloud size={16} />העלאת מסמך</button></div>
                <div className="required-doc-actions">{(["נסח טאבו / אישור זכויות", "דוח מרשם המשכונות", "דוח מתדיינים / הליכים משפטיים"] as const).map((type) => { const matches = detail.documents.filter((doc) => doc.documentType === type); const title = type === "נסח טאבו / אישור זכויות" ? "נסח טאבו" : type; return <div className={`required-doc-card ${matches.length ? "has-document" : ""}`} key={type}><span className="required-doc-state">{matches.length ? <Check size={15} /> : <FileText size={15} />}</span><span><b>{title}</b><small>{matches.length ? `${matches.length} קובץ${matches.length > 1 ? "ים" : ""} בתיק${type === "נסח טאבו / אישור זכויות" && matches.some((doc) => doc.source === "הועלה על ידי הלקוח") ? " · הועלה על ידי הלקוח" : ""}` : type === "נסח טאבו / אישור זכויות" ? "אפשר להשתמש בקובץ שהלקוח העלה או להוסיף כאן" : "עדיין לא הועלה לתיק"}</small></span><button type="button" className="text-action" onClick={() => { setUploadDocumentType(type); setDocumentForm(true); }}><UploadCloud size={15} />{matches.length ? "הוספת קובץ" : "העלאה"}</button></div>; })}</div>
                {documentForm && <form className="finding-form" onSubmit={uploadDocument}><div className="form-grid"><label className="span-two">קובץ<input type="file" name="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" required /></label><label>סוג מסמך<select name="documentType" value={uploadDocumentType} onChange={(event) => setUploadDocumentType(event.target.value)}>{documentTypes.map((value) => <option key={value}>{value}</option>)}</select></label><label>תאריך איסוף<input type="date" name="collectedAt" defaultValue={new Date().toISOString().slice(0, 10)} /></label><label className="span-two">מקור / אתר שממנו נאסף<input name="source" placeholder="לדוגמה: אתר רשות התאגידים, נט המשפט, הלקוח" maxLength={240} required /></label></div><div className="form-actions"><button className="button-primary" disabled={busy}><UploadCloud size={15} />שמירת מסמך בתיק</button><button type="button" className="button-plain" onClick={() => setDocumentForm(false)}>ביטול</button><small>PDF או תמונה · עד 20MB לקובץ</small></div></form>}
                {detail.documents.length ? <div className="documents-grid">{detail.documents.map((doc) => <button key={doc.id} className="document-item" onClick={() => void download(doc.id)}><span className="document-icon"><FileText size={18} /></span><span><b>{doc.filename}</b><small>{doc.documentType} · {doc.source}</small><small>{Math.max(1, Math.round(doc.size / 1024))} KB · נאסף {new Date(doc.collectedAt).toLocaleDateString("he-IL")}</small></span><ArrowDownToLine size={16} /></button>)}</div> : <div className="inline-empty">לא צורפו מסמכים. העלו כאן את החומרים שנאספו במהלך הבדיקה.</div>}
              </div>
              <div hidden={casePanel !== "findings"} className="detail-section" id="case-findings"><div className="section-title"><div><b>ממצאים ובקרת אנליסט</b><small>{detail.findings.length} ממצאים · כל ממצא דורש החלטת צוות</small></div><button className="text-action" onClick={() => setFindingForm((v) => !v)}><Plus size={16} />הוספת ממצא</button></div>
                {findingForm && <form className="finding-form" onSubmit={addFinding}><div className="form-grid"><label>תחום<input value={finding.category} onChange={(e) => setFinding({ ...finding, category: e.target.value })} required /></label><label>חומרה<select value={finding.severity} onChange={(e) => setFinding({ ...finding, severity: e.target.value })}><option>נמוכה</option><option>בינונית</option><option>גבוהה</option></select></label><label className="span-two">כותרת<input value={finding.title} onChange={(e) => setFinding({ ...finding, title: e.target.value })} required /></label><label className="span-two">תיאור<textarea rows={3} value={finding.note} onChange={(e) => setFinding({ ...finding, note: e.target.value })} required /></label><label className="span-two">מקור / מסמך<input value={finding.source} onChange={(e) => setFinding({ ...finding, source: e.target.value })} /></label></div><div className="form-actions"><button className="button-primary" disabled={busy}>שמירת ממצא</button><button type="button" className="button-plain" onClick={() => setFindingForm(false)}>ביטול</button></div></form>}
                {detail.findings.length ? <div className="finding-list">{detail.findings.map((item) => <article className="finding-row" key={item.id}>{editingFindingId === item.id ? <form className="finding-form" onSubmit={saveFindingEdit}><div className="form-grid"><label>תחום<input value={findingEdit.category} onChange={(event) => setFindingEdit({ ...findingEdit, category: event.target.value })} required /></label><label>חומרה<select value={findingEdit.severity} onChange={(event) => setFindingEdit({ ...findingEdit, severity: event.target.value })}><option>נמוכה</option><option>בינונית</option><option>גבוהה</option></select></label><label className="span-two">כותרת<input value={findingEdit.title} onChange={(event) => setFindingEdit({ ...findingEdit, title: event.target.value })} required /></label><label className="span-two">תיאור<textarea rows={4} value={findingEdit.note} onChange={(event) => setFindingEdit({ ...findingEdit, note: event.target.value })} required /></label><label className="span-two">מקור / מסמך<input value={findingEdit.source} onChange={(event) => setFindingEdit({ ...findingEdit, source: event.target.value })} /></label></div><div className="form-actions"><button className="button-primary" disabled={busy}>שמירת תיקון</button><button type="button" className="button-plain" onClick={() => setEditingFindingId(null)}>ביטול</button></div></form> : <><div className="finding-severity"><i className={`severity-dot sev-${item.severity === "גבוהה" ? "high" : item.severity === "נמוכה" ? "low" : "mid"}`} />{item.severity}</div><h3>{item.title}</h3><p>{item.note}</p><div className="finding-meta"><span>{item.category}</span>{item.source && <span>מקור: {item.source}</span>}{item.confidence !== null && <span>ביטחון AI: {item.confidence}%</span>}</div>{item.state === "לבדיקה" ? <div className="finding-review"><span>ממתין לבקרה</span><button onClick={() => void editFinding(item)} disabled={busy}><Pencil size={14} />עריכה</button><button onClick={() => void reviewFinding(item.id, "אושר")} disabled={busy}><Check size={15} />אישור</button><button onClick={() => void reviewFinding(item.id, "לברור")} disabled={busy}>העברה לבירור</button><button onClick={() => void reviewFinding(item.id, "נדחה")} disabled={busy}><X size={15} />דחייה</button></div> : <div className="reviewed-tag"><Check size={14} />{item.state}{item.reviewedBy ? ` · ${item.reviewedBy}` : ""}{item.reviewNote ? ` · ${item.reviewNote}` : ""}<button className="button-plain" disabled={busy} onClick={() => void editFinding(item)}><Pencil size={13} />עריכה</button></div>}</>}</article>)}</div> : <div className="inline-empty">לא נוספו ממצאים לתיק. ניתן להוסיף ממצאים לאחר בדיקת המסמכים והמקורות.</div>}
              </div>
              <div hidden={casePanel !== "activity"} className="detail-section"><div className="section-title"><div><b>היסטוריית תיק</b><small>פעולות ועדכונים</small></div></div>{detail.activity.length ? <div className="activity-list">{detail.activity.map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><span><b>{event.action}</b><small>{event.detail}</small><em>{event.actorName} · {new Date(event.createdAt).toLocaleString("he-IL")}</em></span></div>)}</div> : <div className="inline-empty">אין עדיין עדכונים.</div>}</div>
              <div hidden={casePanel !== "findings"} className="report-gate"><ShieldCheck size={19} /><span><b>בקרת ממצאים לפני דוח</b><small>{detail.findings.some((item) => item.state === "לבדיקה" || item.state === "לברור") ? "יש להשלים בדיקה של כל ממצא לפני הכנת הדוח." : detail.report ? `דוח גרסה ${detail.report.version} הופק. אפשר לפתוח אותו לפני השליחה ללקוח.` : "כל הממצאים נבדקו. ניתן להפיק דוח לשמירה או להדפסה."}</small></span><span className="gate-count">{detail.findings.filter((item) => item.state === "לבדיקה" || item.state === "לברור").length} לבדיקה</span>{!detail.findings.some((item) => item.state === "לבדיקה" || item.state === "לברור") && <><button className="report-create" disabled={busy || checklistItems.filter((item) => !item.automatic).some((item) => !detail.checklist?.[item.key]?.completed)} onClick={() => void generateReport()}>{detail.report ? "גרסה חדשה" : "הפקת דוח"}</button>{detail.report && <a className="report-open" href={`/staff/cases/${selectedId}/report`} target="_blank">פתיחת דוח {detail.report.version}</a>}{detail.report && selectedCase.status === "דוח מוכן" && <button className="report-create" disabled={busy || checklistItems.filter((item) => !item.automatic).some((item) => !detail.checklist?.[item.key]?.completed)} onClick={() => void sendReport()}>שליחת דוח ללקוח</button>}</>}</div>
            </>}</div>
          </section>
        </> : section === "clients" ? <>
          <div className="staff-heading"><div><div className="eyebrow">תיקי לקוחות והיסטוריית בדיקות</div><h1>לקוחות</h1><p>כל לקוח מופיע פעם אחת, עם פרטי קשר ורשימת הבדיקות שנפתחו עבורו.</p></div><button className="outline-action" onClick={() => void loadCases()}><Activity size={16} />רענון</button></div>
          <section className="clients-directory">
            <div className="clients-directory-head"><b>{clients.length} לקוחות</b><span>{cases.length} בדיקות</span></div>
            {clients.length ? clients.map((client) => <article className="client-card" key={client.email || client.name}>
              <div className="client-card-top"><div className="client-avatar">{client.name.trim().slice(0,1) || "ל"}</div><div className="client-card-name"><b>{client.name}</b><small>{client.cases.length} {client.cases.length === 1 ? "בדיקה" : "בדיקות"} במערכת</small></div></div>
              <div className="client-contact"><a href={"mailto:" + client.email}>{client.email || "אין דוא״ל"}</a><a href={"tel:" + client.phone}>{client.phone || "אין טלפון"}</a></div>
              <div className="client-history">{client.cases.slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((item) => <div className="client-history-row" key={item.id}><span><b>{item.assetType} · {item.street} {item.house}, {item.city}</b><small>{item.caseNumber} · {new Date(item.createdAt).toLocaleDateString("he-IL")}</small></span><span className={["status-tag", "state-" + statuses.indexOf(item.status)].join(" ")}>{item.status}</span><button className="text-action" onClick={() => openCase(item.id)}>פתיחת תיק <ChevronLeft size={14} /></button></div>)}</div>
            </article>) : <div className="inline-empty">לקוחות יופיעו כאן לאחר שליחת טופס במערכת הלקוחות.</div>}
          </section>
        </> : section === "tools" ? <>
          <div className="staff-heading"><div><div className="eyebrow">מקורות עבודה מאומתים</div><h1>כלים חשובים</h1><p>קישורים למקורות הבדיקה ולמדריכים קצרים לעבודה אחידה בתיקים.</p></div></div>
          <section className="resource-section"><div className="section-title"><div><b>אתרים לפי שלב הבדיקה</b><small>פתח את המקור הרלוונטי בחלונית חדשה</small></div></div><div className="resource-grid">
            <a className="resource-card" href="https://www.gov.il/he/service/land_registration_extract" target="_blank" rel="noopener noreferrer"><span className="resource-index">02</span><span><b>הפקת נסח טאבו</b><small>משרד המשפטים · חיפוש לפי גוש וחלקה</small></span><ChevronLeft size={16} /></a>
            <a className="resource-card" href="https://ica.justice.gov.il/SearchPledge/PledgeBrowse?grdPledgeBrowse-sort=State-asc" target="_blank" rel="noopener noreferrer"><span className="resource-index">03</span><span><b>מרשם המשכונות והבטוחות</b><small>רשות התאגידים · חיפוש לפי פרטי בעלי הזכויות</small></span><ChevronLeft size={16} /></a>
            <a className="resource-card" href="https://insolvency.justice.gov.il/" target="_blank" rel="noopener noreferrer"><span className="resource-index">04</span><span><b>מאגר חדלות פירעון</b><small>משרד המשפטים · איתור הליכים ופשיטות רגל</small></span><ChevronLeft size={16} /></a>
            <a className="resource-card" href="https://www.nevo.co.il/" target="_blank" rel="noopener noreferrer"><span className="resource-index">05</span><span><b>מאגר נבו</b><small>איתור פסיקה והליכים משפטיים · לפי הרשאת הארגון</small></span><ChevronLeft size={16} /></a>
            <a className="resource-card" href="https://www.gov.il/apps/mapi/parcel_address/parcel_address.html" target="_blank" rel="noopener noreferrer"><span className="resource-index">מפה</span><span><b>איתור גוש וחלקה</b><small>המרכז למיפוי ישראל · לפי כתובת</small></span><ChevronLeft size={16} /></a>
          </div></section>
          <section className="resource-section"><div className="section-title"><div><b>מדריכים והמלצות לאנליסט</b><small>עקרונות עבודה לבדיקת מקור, תיעוד ובקרה</small></div></div><div className="analyst-guides">
            <article className="analyst-guide"><span className="guide-number">1</span><div><b>מתחילים בנסח הטאבו</b><p>הצלב את הגוש והחלקה, בעלי הזכויות ושמות המוכרים מול פרטי הבקשה. העתק את השם המלא ומספר הזהות בדיוק כפי שמופיעים בנסח.</p></div></article>
            <article className="analyst-guide"><span className="guide-number">2</span><div><b>מחפשים כל בעל זכויות בנפרד</b><p>במרשם המשכונות יש לבצע חיפוש לכל בעל/ת זכויות לפי הפרטים מהנסח. שמור את תוצאת החיפוש וצרף לתיק, גם כשלא נמצאה התאמה.</p></div></article>
            <article className="analyst-guide"><span className="guide-number">3</span><div><b>מתעדים מקור ותאריך</b><p>לכל דוח או ממצא רשום מאיזה אתר נאסף ומתי. חיפוש בשם דומה לבדו אינו הוכחה שמדובר באותו אדם; אמת את ההתאמה מול פרטי הנסח.</p></div></article>
          </div></section>
        </> : section === "compliance" && staff.role === "admin" ? <>
          <div className="staff-heading"><div><div className="eyebrow">בקרות ארגוניות · Admin בלבד</div><h1>ציות ופרטיות</h1><p>מרכז משימות למידע אישי, אבטחת מידע, ספקים ושימוש ב-AI. יש לבדוק תחולה ויישום מול יועץ משפטי או ממונה פרטיות.</p></div><button className="outline-action" onClick={() => void loadCompliance()}><Activity size={16} />רענון</button></div>
          <div className="compliance-callout"><ShieldCheck size={20} /><span><b>מפת מוכנות ראשונית</b><small>סימון משימה כהושלמה מתעד את עבודת החברה בלבד ואינו מהווה אישור משפטי או קביעה שהמערכת עומדת בכל דין.</small></span></div>
          {managerError && <div className="notice error"><CircleAlert size={17} />{managerError}</div>}
          <section className="compliance-layout"><div className="compliance-task-list">{complianceTasks.map((task) => <article className="compliance-task" key={task.id}><div className="compliance-task-heading"><span className={`compliance-status-dot ${task.status}`} /><div><b>{task.title}</b><p>{task.description}</p></div></div><div className="compliance-task-controls"><label>סטטוס<select value={task.status} onChange={(event) => setComplianceTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: event.target.value as ComplianceTask["status"] } : item))}><option value="not_started">טרם התחיל</option><option value="in_progress">בתהליך</option><option value="needs_review">ממתין לאימות מקצועי</option><option value="complete">הושלם</option></select></label><label className="compliance-note">הערת מעקב<textarea rows={2} maxLength={2000} value={task.note} onChange={(event) => setComplianceTasks((current) => current.map((item) => item.id === task.id ? { ...item, note: event.target.value } : item))} placeholder="אחראי, מסמך, תאריך בדיקה או נקודה לאימות" /></label><button className="outline-action" disabled={busy} onClick={() => void saveComplianceTask(task)}>שמירת עדכון</button></div>{task.updatedBy && task.updatedAt && <small className="compliance-updated">עודכן על ידי {task.updatedBy} · {new Date(task.updatedAt).toLocaleDateString("he-IL")}</small>}</article>)}</div>
            <aside className="compliance-resources"><b>מקורות רשמיים</b><small>לעיון ובדיקת תחולה</small><a href="https://www.gov.il/he/pages/13_amendment" target="_blank" rel="noopener noreferrer">תיקון 13 לחוק הגנת הפרטיות <ChevronLeft size={15} /></a><a href="https://www.gov.il/he/pages/data_security_guide" target="_blank" rel="noopener noreferrer">מדריך תקנות אבטחת מידע <ChevronLeft size={15} /></a><a href="https://www.gov.il/he/service/notice-obligation" target="_blank" rel="noopener noreferrer">חובת רישום או הודעה על מאגר <ChevronLeft size={15} /></a><a href="https://www.gov.il/he/service/report-of-data-breach" target="_blank" rel="noopener noreferrer">דיווח על אירוע אבטחה חמור <ChevronLeft size={15} /></a><a href="https://www.gov.il/he/pages/ai_privacy" target="_blank" rel="noopener noreferrer">פרטיות ובינה מלאכותית <ChevronLeft size={15} /></a></aside>
          </section>
        </> : section === "finance" && staff.role === "admin" ? <>
          <div className="staff-heading"><div><div className="eyebrow">ניהול פנימי · Admin בלבד</div><h1>הכנסות והוצאות</h1><p>יומן ידני למעקב אחר תנועות העסק. אין כאן חיוב לקוחות או חיבור בנקאי.</p></div><button className="outline-action" onClick={() => void loadFinance()}><Activity size={16} />רענון</button></div>
          {managerError && <div className="notice error"><CircleAlert size={17} />{managerError}</div>}
          <div className="staff-metrics finance-metrics"><article><span className="metric-label">הכנסות רשומות</span><b>{financeMoney(financeSummary.income)}</b><small>סך כל הרישומים במערכת</small></article><article><span className="metric-label">הוצאות רשומות</span><b>{financeMoney(financeSummary.expenses)}</b><small>סך כל הרישומים במערכת</small></article><article><span className="metric-label">יתרה חשבונאית</span><b>{financeMoney(financeSummary.balance)}</b><small>הכנסות פחות הוצאות</small></article></div>
          <section className="finance-layout"><form className="finding-form finance-form" onSubmit={addFinanceTransaction}><div className="section-title"><div><b>הוספת תנועה</b><small>הזינו הכנסה או הוצאה לצורך מעקב</small></div></div><div className="form-grid"><label>סוג תנועה<select value={financeForm.type} onChange={(event) => setFinanceForm({ ...financeForm, type: event.target.value as "income" | "expense" })}><option value="income">הכנסה</option><option value="expense">הוצאה</option></select></label><label>תאריך<input type="date" value={financeForm.date} onChange={(event) => setFinanceForm({ ...financeForm, date: event.target.value })} required /></label><label>קטגוריה<input value={financeForm.category} onChange={(event) => setFinanceForm({ ...financeForm, category: event.target.value })} placeholder="לדוגמה: בדיקה, תוכנה, שיווק" maxLength={80} required /></label><label>סכום בש״ח<input type="number" min="0.01" max="10000000" step="0.01" value={financeForm.amount} onChange={(event) => setFinanceForm({ ...financeForm, amount: event.target.value })} required /></label><label className="span-two">תיאור<input value={financeForm.description} onChange={(event) => setFinanceForm({ ...financeForm, description: event.target.value })} maxLength={300} required /></label></div><div className="form-actions"><button className="button-primary" disabled={busy}><Plus size={16} />שמירת תנועה</button></div></form>
          <section className="finance-transactions"><div className="section-title"><div><b>תנועות אחרונות</b><small>{financeTransactions.length} תנועות מוצגות</small></div></div>{financeTransactions.length ? <div className="finance-list">{financeTransactions.map((item) => <article className="finance-row" key={item.id}><span className={`finance-kind ${item.type}`}>{item.type === "income" ? "הכנסה" : "הוצאה"}</span><span className="finance-copy"><b>{item.description}</b><small>{item.category} · {new Date(`${item.date}T12:00:00`).toLocaleDateString("he-IL")}</small></span><b className={`finance-amount ${item.type}`}>{item.type === "income" ? "+" : "−"}{financeMoney(item.amount)}</b></article>)}</div> : <div className="inline-empty">עדיין לא נרשמו הכנסות או הוצאות.</div>}</section></section>
        </> : <section className="team-panel"><div className="staff-heading"><div><div className="eyebrow">הרשאות</div><h1>ניהול צוות</h1><p>רק עובדים שנוספו לכאן יוכלו להיכנס לתיקים.</p></div></div><form className="team-invite" onSubmit={addMember}><div><b>הוספת Member</b><small>העובד ייכנס באמצעות החשבון שלו ויוכל לבצע את שלבי האנליזה.</small></div><input type="email" placeholder="כתובת דוא״ל של העובד" value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} required /><button className="button-primary" disabled={busy}><Plus size={16} />הוספה לצוות</button></form><div className="team-list">{team.map((member) => <div className="team-row" key={member.email}><div className="profile-avatar">{member.displayName.slice(0, 1)}</div><span><b>{member.displayName}</b><small>{member.email}</small></span><span className="team-role">{member.role === "admin" ? "Admin · מנהל מערכת" : "Member · אנליסט"}</span><span className={member.active ? "member-active" : "member-inactive"}>{member.active ? "פעיל" : "לא פעיל"}</span></div>)}{!team.length && <div className="empty-state">רשימת הצוות ריקה.</div>}</div></section>}
      </div>
    </main>
    {/* Email Dispatch Confirmation Modal */}
    {showEmailConfirmModal && selectedCase && (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{ background: "#ffffff", borderRadius: "16px", maxWidth: "520px", width: "100%", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", border: "1px solid #e2e8f0", textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f0fdfa", color: "#0d766e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mail size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "bold", color: "#0f172a" }}>
                אישור שליחת דוח בדיקת נאותות ללקוח
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowEmailConfirmModal(false)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
            >
              <X size={20} />
            </button>
          </div>

          <p style={{ fontSize: "13px", color: "#475569", marginBottom: "16px", lineHeight: "1.6" }}>
            הדוח נבדק ואושר על ידך כאנליסט. בלחיצה על אישור, המערכת תשלח ללקוח הודעת דוא״ל רשמית הכוללת קישור ישיר ומאובטח לדוח המלא.
          </p>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", marginBottom: "16px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>שם הלקוח:</span>
              <b>{selectedCase.clientName}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>כתובת מייל יעד:</span>
              <b style={{ direction: "ltr", color: "#0d766e" }}>{selectedCase.clientEmail}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>נכס נבדק:</span>
              <span>{[selectedCase.street, selectedCase.house, selectedCase.city].filter(Boolean).join(" ")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
              <span style={{ color: "#64748b" }}>SafeScore מאושר:</span>
              <span style={{ fontWeight: "bold", padding: "2px 8px", borderRadius: "10px", background: reportScore >= 75 ? "#ecfdf5" : reportScore >= 50 ? "#fffbeb" : "#fef2f2", color: reportScore >= 75 ? "#065f46" : reportScore >= 50 ? "#92400e" : "#991b1b" }}>
                {reportScore} מתוך 100
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>סטטוס תיק לאחר שליחה:</span>
              <span style={{ fontWeight: "bold", color: "#059669" }}>דוח נשלח</span>
            </div>
          </div>

          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 12px", fontSize: "11px", color: "#92400e", marginBottom: "18px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>
              <b>שים לב:</b> לאחר השליחה לא ניתן לבטל את הגעת המייל ללקוח. ודא כי כל הממצאים, המסמכים והתאמות המחיר תקינים לחלוטין.
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
            <button
              type="button"
              className="button-plain"
              style={{ fontSize: "12px", padding: "8px 16px" }}
              onClick={() => setShowEmailConfirmModal(false)}
              disabled={busy}
            >
              חזור לבדיקה
            </button>
            <button
              type="button"
              className="btn-send-client-email"
              style={{ padding: "8px 20px", fontSize: "13px" }}
              onClick={() => void handleConfirmSendEmail()}
              disabled={busy}
            >
              {busy ? "שולח מייל…" : "אשר ושלח מייל ללקוח"}
            </button>
          </div>
        </div>
      </div>
    )}

    {notice && <div className="staff-toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="סגירה"><X size={15} /></button></div>}
  </div>;
}
