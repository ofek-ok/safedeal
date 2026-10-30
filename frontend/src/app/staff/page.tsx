"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import "./staff.css";
import {
  Gauge,
  LayoutDashboard,
  Users,
  Wrench,
  Wallet,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Search,
  FileText,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Plus,
  Edit3,
  Activity,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Download,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
  Compass,
  Info,
  Scale,
  Home,
  AlertTriangle,
  Mail,
  Send,
  Eye,
  SlidersHorizontal,
  Save,
  Lock
} from "lucide-react";

const STATUSES = [
  "חדש",
  "באיסוף מידע",
  "ממתין למסמכים",
  "מוכן לניתוח",
  "בניתוח",
  "בבדיקת אנליסט",
  "דוח מוכן",
  "שולח דוח",
  "דוח נשלח",
];

const DOC_TYPES = [
  "נסח טאבו / אישור זכויות",
  "דוח מרשם המשכונות",
  "דוח חדלות פירעון (משרד המשפטים)",
  "דוח מתדיינים / הליכים משפטיים",
  "הסכם / טיוטת חוזה",
  "תכנון והיתרים",
  "מסמכי מוכר / יזם",
  "מסמכי רשות מקומית",
  "מסמך פיננסי",
  "אחר",
];

const CHECKLIST_ITEMS = [
  { key: "data_reviewed", label: "עברתי על פרטי הטופס ואימתתי גוש וחלקה" },
  { key: "reports_collected", label: "הוצאתי והעליתי את הדוחות (טאבו, משכונות, משפטי)" },
  { key: "insolvency_checked", label: "ביצעתי בדיקת חדלות פירעון במאגר משרד המשפטים" },
  { key: "data_verified", label: "וידאתי את מהימנות הנתונים מול המקורות הממשלתיים" },
  { key: "ai_findings_reviewed", label: "עברתי על ממצאי ה-AI ואישרתי את תוכן הדוח" },
  { key: "report_generated", label: "הפקתי גרסת דוח סופית מאושרת", automatic: true },
  { key: "report_sent", label: "שלחתי את הדוח ללקוח במייל", automatic: true },
];

const ANALYST_STEP_GUIDES = [
  {
    stepIndex: 0,
    stepNum: "01",
    title: "אימות פרטי הנכס וגוש/חלקה",
    objective: "זיהוי חד-ערכי של הנכס במרשם המקרקעין ובמערכות המיפוי הלאומיות, למניעת בדיקה על נכס שגוי.",
    actions: [
      "השווה את כתובת הלקוח (רחוב, מספר בית ועיר) מול שכבת הכתובות הממשלתית.",
      "הפעל איתור אוטומטי מ-GovMap לשליפת גוש וחלקה מאומתים.",
      "בדירה בבית משותף: ודא אם יש תת-חלקה ייעודית בצו הבית המשותף.",
      "שמור את פרטי הגוש והחלקה המאומתים בתיק למעבר לשלב הפקת הטאבו.",
    ],
    redFlags: [
      "סתירה בין כתובת הרחוב לגוש ולחלקה (זיהוי נכס אחר).",
      "חלקה במושאע (קרקע משותפת ללא רישום בית משותף) ללא הסכם שיתוף רשום.",
    ],
    legalTip: "גוש וחלקה הם המזהה המשפטי היחיד המחייב בטאבו. בדיקה על גוש שגוי פוסלת את כל שרשרת הניתוח.",
    modelImpact: "משקל 6% בתחום 'זיהוי ואמינות קלט'.",
  },
  {
    stepIndex: 1,
    stepNum: "02",
    title: "נסח טאבו והצלבת בעלות",
    objective: "אימות זכויות הבעלות, שלמות הרישום והיעדר הגבלות, עיקולים או זכויות צד ג׳ מעכבות.",
    actions: [
      "פתח את נסח הטאבו (PDF) שהועלה או הפק נסח טאבו רשמי עדכני.",
      "השווה שמות ות״ז של המוכרים מהטופס מול הבעלים הרשומים בנסח.",
      "בדוק את חלק הבעלות (האם המוכר בעלים של מלוא הזכויות - 1/1 או שותף).",
      "סרוק הערות אזהרה (סעיף 126), הערות לפי פקודת המסים וצווים שיפוטיים.",
      "בדוק משכנתאות קיימות: סכום, לטובת איזה בנק והאם קיימת דרגה שנייה.",
    ],
    redFlags: [
      "🛑 עצירה (STOP תקרה 39): המוכר אינו מופיע כבעל הזכויות בנסח.",
      "🛑 עצירה (STOP תקרה 39): עיקול פעיל או צו כינוס נכסים פתוח.",
      "⚠️ בדיקה מעמיקה (HOLD תקרה 49): הערת אזהרה לטובת רוכש אחר ללא הסכם ביטול.",
    ],
    legalTip: "חובה להשתמש בנסח שהופק ב-30 הימים האחרונים. נסח ישן עלול להחמיץ עיקול טרי שנרשם אתמול.",
    modelImpact: "משקל 33% בתחום 'זכויות ודגלים משפטיים גלויים'.",
  },
  {
    stepIndex: 2,
    stepNum: "03",
    title: "מרשם המשכונות (רשות התאגידים)",
    objective: "איתור שעבודים חוזיים והלוואות פרטיות על זכויות המוכר, שאינם גלויים בנסח הטאבו.",
    actions: [
      "העתק את תעודות הזהות של כל אחד מהמוכרים הרשומים.",
      "בצע שאילתה ברשם המשכונות בנפרד עבור כל מוכר (לא רק לפי כתובת הנכס!).",
      "בדוק האם המשכון הוא בנקאי (משכנתה מקבילה) או לטובת חברת מימון חוץ-בנקאית/פרטית.",
      "העלה את דוח העיון לתיק לצורך תיעוד וחישוב המודל.",
    ],
    redFlags: [
      "משכון לטובת גורם חוץ-בנקאי או אדם פרטי (מעלה חשש למצוקת נזילות של המוכר).",
      "ריבוי משכונות פעילים על זכויות המוכר באותו נכס.",
      "משכון ללא מכתב כוונות מסודר מהנושה להסרתו כנגד תשלום מתוך כספי התמורה.",
    ],
    legalTip: "משכנתה רשומה בטאבו רק כשהדירה רשומה על שם המוכר. דירות בחברות משכנות או בהליכי בנייה ממושכנות ברשם המשכונות.",
    modelImpact: "משקל 20% יחד עם בדיקת חדלות הפירעון.",
  },
  {
    stepIndex: 3,
    stepNum: "04",
    title: "בדיקת חדלות פירעון (משרד המשפטים)",
    objective: "אימות היעדר הליכי פשיטת רגל, כינוס נכסים או חדלות פירעון של המוכר (ת״ז) או היזם (ח״פ).",
    actions: [
      "פתח את מאגר הממונה על הליכי חדלות פירעון (קישור ישיר בפנל).",
      "הזן את ת״ז המוכר ביד שנייה או ח״פ היזם בעסקת קבלן.",
      "בדוק האם קיים תיק פעיל, צו פתיחת הליכים או הליך שהסתיים לאחרונה.",
      "לחץ על כפתור התוצאה המתאים לרישום מיידי של הציון במודל.",
    ],
    redFlags: [
      "🛑 עצירה (STOP, ציון 0, תקרה 39): אותר הליך חדלות פירעון פעיל! אסור לחתום ללא אישור נאמן ובית משפט.",
      "🟡 דגל אדום (Red Flag, ציון 25): הליך שהסתיים ב-6 החודשים האחרונים — סכנת ביטול הענקות לפי חוק חדלות פירעון.",
    ],
    legalTip: "⚠️ כלל ניסוח מחייב של SafeDeal: לעולם אין לכתוב 'אין חובות'. המאגר מאתר הליכים פורמליים בלבד.",
    modelImpact: "חומרה 10 במודל — מפעיל תקרת ציון 39 בעת הליך פעיל.",
  },
  {
    stepIndex: 4,
    stepNum: "05",
    title: "הליכים משפטיים (נט המשפט / נבו)",
    objective: "איתור תביעות אזרחיות, סכסוכי שכנים/קבלן, צווי מניעה ותביעות ליקויי בנייה.",
    actions: [
      "חפש את שמות הצדדים (מוכרים או יזם) במאגר נט המשפט או נבו.",
      "סנן תביעות קטנות או תיקים סגורים ללא משמעות לנכס.",
      "בדוק האם קיימת תביעה פעילה הנוגעת לזכויות בנכס או פירוק שיתוף.",
      "העלה את אסמכתת הבדיקה לתיק.",
    ],
    redFlags: [
      "צו מניעה זמני או תביעה תלויה ועומדת על הזכויות בדירה.",
      "תביעת פירוק שיתוף או סכסוך ירושה בין בעלי הזכויות.",
      "דפוס של תביעות איחורי מסירה רבות כנגד היזם/קבלן.",
    ],
    legalTip: "התמקד בתיקים הנוגעים ישירות לקניין, לרישום או לפשיטת רגל. תביעות ספקים שגרתיות של יזם גדול הן שכיחות.",
    modelImpact: "משקל 17% במסלול קבלן (היסטוריית ביצוע ותביעות).",
  },
  {
    stepIndex: 5,
    stepNum: "06",
    title: "שליחה להפקת הדוח לפי האלגוריתם והנתונים",
    objective: "הפעלת אלגוריתם שקלול הנתונים וה-AI, חיתום ציון SafeScore רשמי, בקרה סופית ושליחת הדוח ללקוח.",
    actions: [
      "ודא שכל הנתונים אומתו: גוש/חלקה, נסח טאבו, מרשם המשכונות, ובדיקת חדלות פירעון.",
      "לחץ על 'הפעלת האלגוריתם והפקת הדוח' לחישוב ציוני התחומים, שקלול קומות והפקת גרסה רשמית (V1).",
      "לחץ על 'צפייה בדוח הלקוח' לבדיקת תצוגה מקדימה מלאה של הדוח המעוצב.",
      "לחץ על 'שליחת דוח מאושר ללקוח' לסיום הטיפול בתיק וסגירתו.",
    ],
    redFlags: [
      "הפקת דוח ללא אימות נסח טאבו או בדיקת חדלות פירעון.",
      "שליחת דוח עם ציון מתחת ל-45 (רמת סיכון גבוהה) ללא הערת הסבר מפורטת.",
    ],
    legalTip: "הדוח הסופי משקלל את כל 11 המקורות ומועבר לרוכש ולעורך דינו. הדיוק האלגוריתמי הוא ליבת המוניטין של SafeDeal.",
    modelImpact: "חישוב ציון SafeScore סופי (0-100) ורמת סיכון משוקללת בהתאם למודל המעודכן.",
  },
];

const FIELD_LABELS: Record<string, string> = {
  fullName: "שם מלא",
  email: "דוא״ל",
  phone: "טלפון",
  purpose: "מטרת הבדיקה",
  agreeToTerms: "אישור תנאים",
  city: "עיר / יישוב",
  street: "רחוב",
  houseNumber: "מספר בית",
  block: "גוש",
  parcel: "חלקה",
  subParcel: "תת־חלקה",
  dealType: "סוג עסקה",
  askingPrice: "מחיר מבוקש",
  propertyArea: "שטח הנכס",
  roomsCount: "מספר חדרים",
  floorNumber: "קומה",
  totalFloors: "מספר קומות בבניין",
  hasElevator: "מעלית בבניין",
  condition: "מצב הנכס",
  monthlyRent: "שכר דירה חודשי",
  sellerName: "שם המוכר",
  sellerIdNumber: "ת״ז מוכר",
  sellerNames: "שמות המוכרים",
  isRented: "הנכס מושכר",
  hasAdditions: "בוצעו תוספות",
  developerName: "שם יזם / קבלן",
  developerRegNumber: "ח.פ / מספר עוסק",
  accreditedBank: "בנק מלווה",
  targetDeliveryDate: "מועד מסירה",
  indexLinkage: "הצמדה למדד",
  hasParking: "חניה",
  hasUndergroundParking: "חניון תת־קרקעי",
  hasAbovegroundParking: "חניה עליונה",
  hasStorage: "מחסן",
  hasMamad: "ממ״ד",
  hasBalcony: "מרפסת",
  hasGym: "חדר כושר",
  hasResidentsLounge: "חדר דיירים",
  hasRooftop: "גג דיירים",
  isBuildingOnPillars: "בניין על עמודים",
  hasAccessibility: "נגישות",
};

export default function StaffPage() {
  const [currentUser] = useState({
    userId: "staff-admin",
    email: "team@safedeal.co.il",
    displayName: "צוות SafeDeal",
    role: "admin",
  });

  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<any | null>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [currentNav, setCurrentNav] = useState("cases");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("workflow");
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<number | null>(null);
  const [showGuideSidebar, setShowGuideSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [cadastralInput, setCadastralInput] = useState({ block: "", parcel: "", subParcel: "" });
  const [isResolvingCadastral, setIsResolvingCadastral] = useState(false);

  // Documents modal
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docUploadType, setDocUploadType] = useState(DOC_TYPES[0]);

  // Analyst Review & Report Editing States (Human-in-the-Loop)
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editedFindingTitle, setEditedFindingTitle] = useState("");
  const [editedFindingNote, setEditedFindingNote] = useState("");
  const [reportScore, setReportScore] = useState<number>(84);
  const [reportSummary, setReportSummary] = useState<string>("");
  const [reportRecommendation, setReportRecommendation] = useState<string>("");
  const [showScoreOverrideInput, setShowScoreOverrideInput] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);

  // Findings form
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [newFinding, setNewFinding] = useState({
    category: "רישום זכויות וטאבו",
    title: "",
    note: "",
    severity: "בינונית" as const,
    source: "",
  });

  // Finance & Compliance
  const [financeTransactions, setFinanceTransactions] = useState<any[]>([]);
  const [financeSummary, setFinanceSummary] = useState({ income: 0, expenses: 0, balance: 0 });
  const [newTx, setNewTx] = useState({ type: "income", date: new Date().toISOString().slice(0, 10), category: "", description: "", amount: "" });
  const [complianceTasks, setComplianceTasks] = useState<any[]>([]);
  const [newTeamEmail, setNewTeamEmail] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const loadCases = useCallback(async (preserveSelection = true) => {
    try {
      const res = await fetch("/api/staff/cases");
      const json = await res.json();
      if (json.cases) {
        setCases(json.cases);
        setSelectedCaseId((prev) => {
          if (preserveSelection && prev && json.cases.some((c: any) => c.id === prev)) {
            return prev;
          }
          return json.cases[0]?.id ?? null;
        });
      }
    } catch (e) {
      console.error(e);
      showToast("לא הצלחנו לטעון את התיקים");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCaseDetail = useCallback(async (id: string | null) => {
    if (!id) {
      setCaseDetail(null);
      return;
    }
    try {
      const res = await fetch(`/api/staff/cases/${id}`);
      if (res.ok) {
        const json = await res.json();
        setCaseDetail(json);
        if (json.case) {
          setCadastralInput({
            block: String(json.case.block ?? ""),
            parcel: String(json.case.parcel ?? ""),
            subParcel: String(json.case.sub_parcel ?? json.case.subParcel ?? ""),
          });
          if (json.case.report) {
            setReportScore(json.case.report.safeScore ?? 84);
            setReportSummary(json.case.report.summaryNote || "");
            setReportRecommendation(json.case.report.recommendation || "");
          }
        }
      } else {
        setCaseDetail(null);
      }
    } catch (e) {
      console.error(e);
      setCaseDetail(null);
    }
  }, []);

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/team");
      const json = await res.json();
      if (json.team) setTeam(json.team);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadFinance = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/finance");
      const json = await res.json();
      if (json.transactions) setFinanceTransactions(json.transactions);
      if (json.summary) setFinanceSummary(json.summary);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadCompliance = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/compliance");
      const json = await res.json();
      if (json.tasks) setComplianceTasks(json.tasks);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadCases();
    loadTeam();
  }, [loadCases, loadTeam]);

  useEffect(() => {
    loadCaseDetail(selectedCaseId);
  }, [selectedCaseId, loadCaseDetail]);

  const activeCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) ?? null;
  }, [cases, selectedCaseId]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const q = searchQuery.toLowerCase();
      const match =
        `${c.caseNumber} ${c.clientName} ${c.city} ${c.street}`.toLowerCase().includes(q);
      const tabMatch =
        filterTab === "all" ||
        (filterTab === "active" && c.status !== "דוח נשלח") ||
        (filterTab === "waiting" && c.status === "ממתין למסמכים") ||
        (filterTab === "ready" && ["מוכן לניתוח", "בבדיקת אנליסט", "דוח מוכן"].includes(c.status)) ||
        (filterTab === "completed" && c.status === "דוח נשלח");
      return match && tabMatch;
    });
  }, [cases, searchQuery, filterTab]);

  // Clients grouping
  const clientGroups = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of cases) {
      const key = c.clientEmail?.trim().toLowerCase() || c.clientName?.trim();
      const existing = map.get(key) ?? {
        name: c.clientName,
        email: c.clientEmail,
        phone: c.clientPhone,
        cases: [],
      };
      existing.cases.push(c);
      map.set(key, existing);
    }
    return Array.from(map.values());
  }, [cases]);

  // Auto cadastral resolution
  const handleAutoCadastral = async () => {
    if (!activeCase) return;
    setIsResolvingCadastral(true);
    try {
      const res = await fetch("/api/staff/cadastral-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: activeCase.city,
          street: activeCase.street,
          houseNumber: activeCase.house,
        }),
      });
      const data = await res.json();
      if (data.block && data.parcel) {
        setCadastralInput({
          block: String(data.block),
          parcel: String(data.parcel),
          subParcel: cadastralInput.subParcel,
        });
        showToast(`אותר בהצלחה מ-${data.source || 'GovMap'}: גוש ${data.block}, חלקה ${data.parcel}`);
      } else {
        showToast("לא אותר גוש וחלקה אוטומטית. ניתן להזין ידנית.");
      }
    } catch (e) {
      console.error(e);
      showToast("שגיאה באיתור גוש וחלקה מ-GovMap");
    } finally {
      setIsResolvingCadastral(false);
    }
  };

  // Save Cadastral Details (Step 1)
  const handleSaveCadastral = async () => {
    if (!selectedCaseId) return;
    if (!cadastralInput.block.trim() || !cadastralInput.parcel.trim()) {
      showToast("יש להזין גוש וחלקה כדי להמשיך.");
      return;
    }
    setIsActionLoading(true);
    try {
      await fetch(`/api/staff/cases/${selectedCaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block: cadastralInput.block.trim(),
          parcel: cadastralInput.parcel.trim(),
          subParcel: cadastralInput.subParcel.trim() || null,
        }),
      });
      await fetch(`/api/staff/cases/${selectedCaseId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey: "data_reviewed", completed: true }),
      });
      await loadCases();
      await loadCaseDetail(selectedCaseId);
      showToast("פרטי הבקשה והגוש והחלקה נשמרו. אפשר להמשיך להפקת הנסח.");
    } catch (e) {
      console.error(e);
      showToast("שגיאה בשמירת פרטי הזיהוי");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Copy Property Details to Clipboard
  const handleCopyProperty = async () => {
    if (!activeCase) return;
    const text = [
      `לקוח: ${activeCase.clientName}`,
      `כתובת: ${activeCase.street} ${activeCase.house}, ${activeCase.city}`,
      `גוש: ${cadastralInput.block || activeCase.block || "טרם הוזן"}`,
      `חלקה: ${cadastralInput.parcel || activeCase.parcel || "טרם הוזנה"}`,
      cadastralInput.subParcel ? `תת-חלקה: ${cadastralInput.subParcel}` : "",
      activeCase.intakeData?.deal?.sellerName ? `מוכר: ${activeCase.intakeData.deal.sellerName}` : "",
    ].filter(Boolean).join("\n");

    try {
      await navigator.clipboard.writeText(text);
      showToast("פרטי הנכס הועתקו ללוח — מוכן להדבקה באתרי הממשלה.");
    } catch {
      showToast("לא הצלחנו להעתיק אוטומטית.");
    }
  };

  // Case Status / Assignee Update
  const handleUpdateCase = async (updates: any) => {
    if (!selectedCaseId) return;
    setIsActionLoading(true);
    try {
      await fetch(`/api/staff/cases/${selectedCaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await loadCases();
      await loadCaseDetail(selectedCaseId);
      showToast("העדכון נשמר בהצלחה");
    } catch (e) {
      console.error(e);
      showToast("שגיאה בשמירה");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Checklist Toggle
  const handleToggleChecklist = async (itemKey: string, completed: boolean) => {
    if (!selectedCaseId) return;
    try {
      await fetch(`/api/staff/cases/${selectedCaseId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey, completed }),
      });
      await loadCaseDetail(selectedCaseId);
      showToast("הצ׳קליסט עודכן");
    } catch (e) {
      console.error(e);
    }
  };

  // Document Upload
  const handleDocumentUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/staff/cases/${selectedCaseId}/documents`, {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setShowDocUpload(false);
        form.reset();
        await loadCaseDetail(selectedCaseId);
        showToast("המסמך הועלה ונשמר בתיק");
      }
    } catch (e) {
      console.error(e);
      showToast("שגיאה בהעלאת מסמך");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Direct File Upload from in-step dropzones
  const handleDirectFileUpload = async (file: File | null, documentType: string) => {
    if (!selectedCaseId || !file) return;
    setIsActionLoading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("documentType", documentType);
      data.append("source", "אנליסט SafeDeal");

      const res = await fetch(`/api/staff/cases/${selectedCaseId}/documents`, {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        await loadCaseDetail(selectedCaseId);
        showToast(`המסמך "${documentType}" הועלה בהצלחה לתיק`);
      } else {
        showToast("שגיאה בהעלאת המסמך");
      }
    } catch (e) {
      console.error(e);
      showToast("שגיאה בהעלאת המסמך");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Document Download
  const handleDownloadDoc = async (docId: string, filename: string) => {
    try {
      const res = await fetch(`/api/staff/documents/${docId}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "document";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("שגיאה בהורדת הקובץ");
    }
  };

  // Add Manual Finding
  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    setIsActionLoading(true);
    try {
      await fetch(`/api/staff/cases/${selectedCaseId}/analyze`, {
        method: "POST",
      });
      setShowFindingForm(false);
      await loadCaseDetail(selectedCaseId);
      showToast("הממצא נשמר בתיק");
    } catch {
      showToast("שגיאה בהוספת ממצא");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Update Finding State
  const handleFindingState = async (findingId: string, state: string) => {
    setIsActionLoading(true);
    try {
      await fetch(`/api/staff/findings/${findingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      await loadCaseDetail(selectedCaseId);
      showToast(`הממצא עודכן לסטטוס "${state}"`);
    } catch {
      showToast("שגיאה בעדכון ממצא");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Run AI Analysis
  const handleRunAnalysis = async () => {
    if (!selectedCaseId) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/staff/cases/${selectedCaseId}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      await loadCases();
      await loadCaseDetail(selectedCaseId);
      showToast(`הניתוח הסתיים בהצלחה — נוצרו ${data.findingsCreated} ממצאים`);
    } catch {
      showToast("שגיאה בהפעלת הניתוח");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Finalize Report
  const handleFinalizeReport = async () => {
    if (!selectedCaseId) return;
    setIsActionLoading(true);
    try {
      await fetch(`/api/staff/cases/${selectedCaseId}`, { method: "PUT" });
      await loadCases();
      await loadCaseDetail(selectedCaseId);
      showToast("הופקה גרסת דוח רשמית מאושרת");
    } catch {
      showToast("שגיאה בהפקת הדוח");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 1. Generate Report based on algorithm & uploaded data (Creates draft, does NOT send)
  const handleGenerateReport = async () => {
    if (!selectedCaseId) return;
    setIsActionLoading(true);
    try {
      // Step A: Run AI Analysis & scoring over all 11 sources
      const resAnalyze = await fetch(`/api/staff/cases/${selectedCaseId}/analyze`, {
        method: "POST",
      });
      await resAnalyze.json();

      // Step B: Generate draft report version for analyst review
      const resReport = await fetch(`/api/staff/cases/${selectedCaseId}`, { method: "PUT" });
      const dataReport = await resReport.json();

      await loadCases();
      await loadCaseDetail(selectedCaseId);

      if (dataReport.report) {
        setReportScore(dataReport.report.safeScore ?? 84);
        setReportSummary(dataReport.report.summaryNote || "");
        setReportRecommendation(dataReport.report.recommendation || "");
      }

      showToast("טיוטת הדוח הופקה בהצלחה! הדוח ממתין כעת לבקרת איכות ועריכתך טרם שליחתו ללקוח.");
    } catch {
      showToast("שגיאה בהפעלת האלגוריתם והפקת הדוח");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRunAlgorithmAndGenerateReport = handleGenerateReport;

  // 2. Inline Finding Text Edit
  const handleStartEditFinding = (f: any) => {
    setEditingFindingId(f.id);
    setEditedFindingTitle(f.title || "");
    setEditedFindingNote(f.note || "");
  };

  const handleSaveFindingInline = async (findingId: string) => {
    setIsActionLoading(true);
    try {
      await fetch(`/api/staff/findings/${findingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedFindingTitle,
          note: editedFindingNote,
        }),
      });
      setEditingFindingId(null);
      await loadCaseDetail(selectedCaseId);
      showToast("הממצא עודכן בהצלחה בדוח");
    } catch {
      showToast("שגיאה בעדכון הממצא");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Save Analyst Review Adjustments (Score, Summary Note, Recommendation)
  const handleSaveReportDraft = async (markApproved = false) => {
    if (!selectedCaseId || !caseDetail?.report) return;
    setIsActionLoading(true);
    try {
      await fetch(`/api/staff/cases/${selectedCaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: {
            ...caseDetail.report,
            safeScore: Number(reportScore),
            summaryNote: reportSummary,
            recommendation: reportRecommendation,
            analystApproved: markApproved || caseDetail.report.analystApproved,
            status: markApproved ? "דוח מאושר" : caseDetail.report.status,
          },
          status: markApproved ? "דוח מוכן" : caseDetail.case?.status,
        }),
      });
      await loadCases();
      await loadCaseDetail(selectedCaseId);
      showToast(markApproved ? "הדוח אושר רשמית ומוכן לשליחה ללקוח" : "התאמות האנליסט נשמרו בהצלחה");
    } catch {
      showToast("שגיאה בשמירת התאמות הדוח");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Send Email to Client
  const handleConfirmSendEmail = async () => {
    if (!selectedCaseId || !activeCase) return;
    setIsActionLoading(true);
    try {
      // First ensure report is marked approved with analyst's final edits
      await fetch(`/api/staff/cases/${selectedCaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: {
            ...caseDetail?.report,
            safeScore: Number(reportScore),
            summaryNote: reportSummary,
            recommendation: reportRecommendation,
            analystApproved: true,
          },
        }),
      });

      const res = await fetch(`/api/staff/cases/${selectedCaseId}/send-report`, { method: "POST" });
      if (res.ok) {
        setShowEmailConfirmModal(false);
        await loadCases();
        await loadCaseDetail(selectedCaseId);
        showToast(`דוח בדיקת הנאותות הרשמי נשלח בהצלחה לכתובת ${activeCase.clientEmail}!`);
      } else {
        showToast("שגיאה בשליחת הדוח במייל");
      }
    } catch {
      showToast("שגיאה בשליחת הדוח ללקוח");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendReport = () => {
    setShowEmailConfirmModal(true);
  };

  // Step Completion Checks
  const hasTabu = Boolean(caseDetail?.documents?.some((d: any) => d.documentType?.includes("טאבו")));
  const hasPledges = Boolean(caseDetail?.documents?.some((d: any) => d.documentType?.includes("משכונות")));
  const hasInsolvency = Boolean(
    caseDetail?.checklist?.insolvency_checked?.completed ||
    caseDetail?.documents?.some((d: any) => d.documentType?.includes("חדלות פירעון")) ||
    activeCase?.intakeData?.deal?.insolvencyStatus
  );
  const hasJudicial = Boolean(caseDetail?.documents?.some((d: any) => d.documentType?.includes("משפטי")));

  const tabuDoc = caseDetail?.documents?.find((d: any) =>
    d.documentType?.includes("טאבו") || d.documentType?.includes("אישור זכויות")
  );
  const pledgesDoc = caseDetail?.documents?.find((d: any) =>
    d.documentType?.includes("משכונות")
  );
  const insolvencyDoc = caseDetail?.documents?.find((d: any) =>
    d.documentType?.includes("חדלות פירעון")
  );
  const judicialDoc = caseDetail?.documents?.find((d: any) =>
    d.documentType?.includes("משפט") || d.documentType?.includes("מתדיינים") || d.documentType?.includes("הליכים")
  );
  const contractDoc = caseDetail?.documents?.find((d: any) =>
    d.documentType?.includes("חוזה") || d.documentType?.includes("הסכם")
  );

  const stepStatus = [
    Boolean(activeCase?.block && activeCase?.parcel),
    hasTabu,
    hasPledges,
    hasInsolvency,
    hasJudicial,
    Boolean(caseDetail?.report || caseDetail?.checklist?.report_generated?.completed),
  ];

  const firstIncompleteStep = stepStatus.findIndex((done) => !done);
  const activeStepIndex = selectedWorkflowStep ?? (firstIncompleteStep >= 0 ? firstIncompleteStep : 5);
  const completedStepsCount = stepStatus.filter(Boolean).length;

  const sellersList = activeCase?.intakeData?.deal?.sellerNames ||
    (activeCase?.intakeData?.deal?.sellerName ? [activeCase.intakeData.deal.sellerName] : []);

  const handleRecordInsolvency = async (outcome: {
    key: "clean" | "active" | "recent_6m" | "ended_old";
    title: string;
    note: string;
    severity: "נמוכה" | "בינונית" | "גבוהה";
  }) => {
    if (!activeCase?.id) return;
    setIsActionLoading(true);
    try {
      await fetch(`/api/staff/cases/${activeCase.id}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "בדיקת חדלות פירעון (משרד המשפטים)",
          title: outcome.title,
          note: outcome.note,
          severity: outcome.severity,
          source: "משרד המשפטים - הממונה על הליכי חדלות פירעון",
          confidence: 98,
          actorName: "אנליסט SafeDeal",
        }),
      });

      await handleToggleChecklist("insolvency_checked", true);

      await handleUpdateCase({
        intakeData: {
          ...activeCase.intakeData,
          deal: {
            ...activeCase.intakeData?.deal,
            insolvencyStatus: outcome.key,
            insolvencyTitle: outcome.title,
            insolvencyNote: outcome.note,
          },
        },
      });

      showToast(`תוצאת בדיקת חדלות פירעון נרשמה: ${outcome.title}`);
      await loadCaseDetail(activeCase.id);
    } catch (err) {
      console.error(err);
      alert("שגיאה ברישום תוצאת הבדיקה");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="staff-app" dir="rtl">
      {/* Sidebar */}
      <aside className={`staff-sidebar ${mobileMenuOpen ? "is-open" : ""}`} aria-label="ניווט מערכת SafeDeal">
        <div className="staff-brand">
          <span className="staff-mark">SD</span>
          <span>
            <b>SafeDeal</b>
            <small>ניהול בדיקות נאותות</small>
          </span>
          <button
            className="mobile-nav-close"
            type="button"
            aria-label="סגירת תפריט"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-caption">סביבת אנליסטים</div>

        <nav className="staff-nav" aria-label="ניווט ראשי">
          <button
            className={`side-link ${currentNav === "dashboard" ? "active" : ""}`}
            onClick={() => { setCurrentNav("dashboard"); setMobileMenuOpen(false); }}
          >
            <Gauge size={18} />
            לוח בקרה
          </button>
          <button
            className={`side-link ${currentNav === "cases" ? "active" : ""}`}
            onClick={() => { setCurrentNav("cases"); setMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            תיקים <span>{cases.length}</span>
          </button>
          <button
            className={`side-link ${currentNav === "clients" ? "active" : ""}`}
            onClick={() => { setCurrentNav("clients"); setMobileMenuOpen(false); }}
          >
            <Users size={18} />
            לקוחות <span>{clientGroups.length}</span>
          </button>
          <button
            className={`side-link ${currentNav === "tools" ? "active" : ""}`}
            onClick={() => { setCurrentNav("tools"); setMobileMenuOpen(false); }}
          >
            <Wrench size={18} />
            כלים חשובים
          </button>
          <button
            className={`side-link ${currentNav === "finance" ? "active" : ""}`}
            onClick={() => { setCurrentNav("finance"); loadFinance(); setMobileMenuOpen(false); }}
          >
            <Wallet size={18} />
            הכנסות והוצאות
          </button>
          <button
            className={`side-link ${currentNav === "compliance" ? "active" : ""}`}
            onClick={() => { setCurrentNav("compliance"); loadCompliance(); setMobileMenuOpen(false); }}
          >
            <ShieldCheck size={18} />
            ציות ופרטיות
          </button>
          <button
            className={`side-link ${currentNav === "team" ? "active" : ""}`}
            onClick={() => { setCurrentNav("team"); loadTeam(); setMobileMenuOpen(false); }}
          >
            <Users size={18} />
            צוות
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-security">
            <ShieldCheck size={17} />
            <span>
              <b>גישה מאובטחת</b>
              <small>רק צוות מורשה</small>
            </span>
          </div>
          <div className="staff-profile">
            <div className="profile-avatar">{currentUser.displayName.slice(0, 1)}</div>
            <span>
              <b>{currentUser.displayName}</b>
              <small>Admin · מנהל מערכת</small>
            </span>
            <Link href="/" title="חזרה לאתר הראשי">
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="staff-main" id="staff-content">
        <header className="staff-topbar">
          <button
            className="mobile-nav-toggle"
            type="button"
            aria-label="פתיחת תפריט"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={19} />
            <span>תפריט</span>
          </button>

          <div className="breadcrumb">
            SafeDeal <ChevronLeft size={14} />{" "}
            {currentNav === "dashboard" ? "לוח בקרה" : currentNav === "cases" ? "ניהול תיקים" : currentNav === "clients" ? "לקוחות" : currentNav === "tools" ? "כלים חשובים" : currentNav === "finance" ? "הכנסות והוצאות" : currentNav === "compliance" ? "ציות ופרטיות" : "ניהול צוות"}
          </div>

          <div className="topbar-user">
            <span className="topbar-dot"></span> סביבת עבודה פנימית <span className="topbar-divider"></span> {currentUser.email}
          </div>
        </header>

        <div className="staff-content">
          {/* ──────────────── DASHBOARD VIEW ──────────────── */}
          {currentNav === "dashboard" && (
            <div>
              <div className="staff-heading">
                <div>
                  <div className="eyebrow">
                    יום עבודה, {new Intl.DateTimeFormat("he-IL", { dateStyle: "full" }).format(new Date())}
                  </div>
                  <h1>לוח בקרה</h1>
                  <p>תמונת מצב של התיקים והמשימות שמחכות לצוות האנליסטים.</p>
                </div>
                <button className="outline-action" onClick={() => loadCases()}>
                  <RefreshCw size={16} /> רענון
                </button>
              </div>

              <div className="staff-metrics">
                <article>
                  <span className="metric-label">תיקים פעילים</span>
                  <b>{cases.filter((c) => c.status !== "דוח נשלח").length}</b>
                  <small>מתוך {cases.length} תיקים במערכת</small>
                </article>
                <article>
                  <span className="metric-label">ממתינים למסמכים</span>
                  <b>{cases.filter((c) => c.status === "ממתין למסמכים").length}</b>
                  <small>נדרש מעקב מול הלקוחות</small>
                </article>
                <article>
                  <span className="metric-label">מוכנים לניתוח</span>
                  <b>{cases.filter((c) => ["מוכן לניתוח", "בבדיקת אנליסט"].includes(c.status)).length}</b>
                  <small>דוחות מוכנים לבקרה</small>
                </article>
                <article>
                  <span className="metric-label">דוחות שנשלחו</span>
                  <b>{cases.filter((c) => c.status === "דוח נשלח").length}</b>
                  <small>בדיקות שהושלמו בהצלחה</small>
                </article>
              </div>

              <div className="dashboard-grid">
                <section className="dashboard-card">
                  <div className="dashboard-card-head">
                    <div>
                      <b>התפלגות תיקים לפי סטטוס</b>
                      <small>מצב הטיפול בתיקים בזמן אמת</small>
                    </div>
                    <span>{cases.length} בסך הכול</span>
                  </div>
                  <div className="status-chart">
                    {STATUSES.map((st) => {
                      const count = cases.filter((c) => c.status === st).length;
                      if (!count) return null;
                      return (
                        <div key={st} className="status-bar-row">
                          <span>{st}</span>
                          <div className="status-bar-track">
                            <i style={{ width: `${Math.max(10, (count / (cases.length || 1)) * 100)}%` }} />
                          </div>
                          <b>{count}</b>
                        </div>
                      );
                    })}
                  </div>
                  <button className="dashboard-link" onClick={() => setCurrentNav("cases")}>
                    פתיחת רשימת התיקים <ChevronLeft size={15} />
                  </button>
                </section>

                <section className="dashboard-card">
                  <div className="dashboard-card-head">
                    <div>
                      <b>תיקים אחרונים שנפתחו</b>
                      <small>פניות חדשות שהגיעו מטופס הלקוחות</small>
                    </div>
                  </div>
                  <div className="attention-list">
                    {cases.slice(0, 5).map((c) => (
                      <div
                        key={c.id}
                        className="attention-row"
                        onClick={() => { setSelectedCaseId(c.id); setCurrentNav("cases"); }}
                      >
                        <span className="attention-icon"><Clock size={16} /></span>
                        <span>
                          <b>{c.clientName} · {c.street} {c.house}, {c.city}</b>
                          <small>{c.caseNumber} · סטטוס: {c.status}</small>
                        </span>
                        <ChevronLeft size={16} />
                      </div>
                    ))}
                    {!cases.length && <div className="inline-empty">עדיין לא נפתחו תיקים.</div>}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ──────────────── CASES WORKSPACE ──────────────── */}
          {currentNav === "cases" && (
            <div>
              <div className="staff-heading">
                <div>
                  <div className="eyebrow">SAFEDEAL · סביבת האנליסט</div>
                  <h1>{activeCase ? `${activeCase.clientName} (${activeCase.caseNumber})` : "תור העבודה"}</h1>
                  <p>
                    {activeCase
                      ? `${activeCase.assetType} · ${activeCase.street} ${activeCase.house}, ${activeCase.city}`
                      : "כל הבדיקות במקום אחד. בחר תיק כדי לראות את שלבי האנליזה המודרכת."}
                  </p>
                </div>
                <button className="outline-action" onClick={() => loadCases()}>
                  <RefreshCw size={16} /> רענון תיקים
                </button>
              </div>

              <div className="case-workspace-new">
                {/* Cases Queue List */}
                <div className="case-list-new">
                  <div className="list-head">
                    <div>
                      <b>תיקי בדיקה</b>
                      <small>סנן לפי סטטוס או חפש לפי שם וכתובת</small>
                    </div>
                    <span className="list-count">{filteredCases.length}</span>
                  </div>

                  <div className="case-search">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="חיפוש לפי לקוח, עיר, רחוב או מספר תיק..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="case-queue-filters">
                    {[
                      { key: "all", label: "הכול" },
                      { key: "active", label: "פתוחים" },
                      { key: "waiting", label: "ממתינים למסמכים" },
                      { key: "ready", label: "מוכנים לבדיקה" },
                      { key: "completed", label: "הושלמו" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        className={filterTab === f.key ? "active" : ""}
                        onClick={() => setFilterTab(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="case-list-scroll">
                    {isLoading ? (
                      <div className="inline-empty">טוען תיקים...</div>
                    ) : filteredCases.length === 0 ? (
                      <div className="empty-state">
                        <FileText size={28} />
                        <b>לא נמצאו תיקים</b>
                        <span>פניות שיישלחו מפרונט הלקוחות יופיעו כאן בזמן אמת.</span>
                      </div>
                    ) : (
                      filteredCases.map((c) => (
                        <button
                          key={c.id}
                          className={`case-row-new ${selectedCaseId === c.id ? "selected" : ""}`}
                          onClick={() => { setSelectedCaseId(c.id); setActiveTab("workflow"); }}
                        >
                          <span className="case-row-icon"><FileText size={18} /></span>
                          <span className="case-row-copy">
                            <b>{c.clientName}</b>
                            <small>{c.caseNumber} · {c.city}, {c.street}</small>
                            <span>
                              <i className={`status-dot-new state-${STATUSES.indexOf(c.status) % 6}`} />
                              {c.status}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Case Detail / Inspector */}
                <div className="case-detail-new">
                  {activeCase && caseDetail ? (
                    <div>
                      {/* Top Bar of Selected Case */}
                      <div className="detail-top">
                        <div>
                          <span className="case-number">{activeCase.caseNumber}</span>
                          <h2>{activeCase.clientName}</h2>
                          <p>{activeCase.assetType} · {activeCase.street} {activeCase.house}, {activeCase.city}</p>
                        </div>
                        <span className="status-tag">{activeCase.status}</span>
                      </div>

                      {/* Controls Strip */}
                      <div className="detail-controls">
                        <label>
                          סטטוס תיק
                          <select
                            value={activeCase.status}
                            disabled={isActionLoading}
                            onChange={(e) => handleUpdateCase({ status: e.target.value })}
                          >
                            {STATUSES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </label>

                        <label>
                          אנליסט אחראי
                          <select
                            value={activeCase.analystEmail ?? ""}
                            disabled={isActionLoading}
                            onChange={(e) => handleUpdateCase({ analystEmail: e.target.value })}
                          >
                            <option value="">לא משויך</option>
                            {team.map((m) => (
                              <option key={m.email} value={m.email}>{m.displayName}</option>
                            ))}
                          </select>
                        </label>

                        <label>
                          תאריך יעד
                          <input
                            type="date"
                            value={activeCase.dueAt ? new Date(activeCase.dueAt).toISOString().slice(0, 10) : ""}
                            disabled={isActionLoading}
                            onChange={(e) => handleUpdateCase({ dueAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          />
                        </label>

                        <div className="due-chip">
                          <Calendar size={16} />
                          <span>
                            <small>יעד SLA</small>
                            <b>{activeCase.dueAt ? new Date(activeCase.dueAt).toLocaleDateString("he-IL") : "לא נקבע"}</b>
                          </span>
                        </div>
                      </div>

                      {/* Sticky Property Context Bar */}
                      <section className="property-context">
                        <div className="property-context-heading">
                          <div>
                            <span className="eyebrow">פרטי נכס לאימות מול מקורות רשמיים</span>
                            <h3>פרטי הזיהוי והכתובת</h3>
                          </div>
                          <button
                            type="button"
                            className="property-copy-button"
                            onClick={handleCopyProperty}
                            title="העתק כתובת, גוש וחלקה"
                          >
                            <Copy size={15} /> העתק פרטי נכס
                          </button>
                        </div>

                        <div className="property-context-grid">
                          <div>
                            <small>כתובת מלאה</small>
                            <b>{activeCase.street} {activeCase.house}, {activeCase.city}</b>
                          </div>
                          <div>
                            <small>גוש</small>
                            <b>{cadastralInput.block || activeCase.block || "טרם הוזן"}</b>
                          </div>
                          <div>
                            <small>חלקה</small>
                            <b>{cadastralInput.parcel || activeCase.parcel || "טרם הוזנה"}</b>
                          </div>
                          <div>
                            <small>תת-חלקה</small>
                            <b>{cadastralInput.subParcel || activeCase.subParcel || "אופציונלי"}</b>
                          </div>
                          {sellersList.length > 0 && (
                            <div className="property-owners">
                              <small>מוכרים לפי הטופס (לאימות מול נסח הטאבו):</small>
                              <b>{sellersList.join(", ")}</b>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Navigation Tabs */}
                      <nav className="case-panel-nav">
                        {[
                          { id: "workflow", label: "מסלול אנליזה (7 שלבים)" },
                          { id: "intake", label: "פרטי הטופס המלאים (Intake)" },
                          { id: "documents", label: `מסמכים (${caseDetail.documents?.length || 0})` },
                          { id: "findings", label: `ממצאי סיכון (${caseDetail.findings?.length || 0})` },
                          { id: "activity", label: `היסטוריה (${caseDetail.activity?.length || 0})` },
                        ].map((t) => (
                          <button
                            key={t.id}
                            className={activeTab === t.id ? "active" : ""}
                            onClick={() => setActiveTab(t.id)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </nav>

                      {/* ──────────────── TAB: WORKFLOW (7 GUIDED STEPS) ──────────────── */}
                      {activeTab === "workflow" && (
                        <div className="analysis-workflow">
                          <div className="workflow-heading">
                            <div>
                              <span className="eyebrow">מסלול עבודה מודרך לאנליסט</span>
                              <h3>מתקדמים שלב אחר שלב</h3>
                              <p>כל השלבים והמסמכים מתועדים בתיק. הדוח יישלח ללקוח רק לאחר אישור מלא.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="status-tag">{completedStepsCount} מתוך 6 שלבים הושלמו</span>
                              <button
                                type="button"
                                className={`workflow-action text-xs ${showGuideSidebar ? "bg-teal-50 border-teal-500 text-teal-800 font-bold" : ""}`}
                                onClick={() => setShowGuideSidebar(!showGuideSidebar)}
                                title="הצגה או הסתרה של מדריך האנליסט הצמוד בצד שמאל"
                              >
                                <Compass size={14} className="text-teal-600" />
                                {showGuideSidebar ? "מדריך צמוד פתוח" : "פתיחת מדריך צמוד"}
                              </button>
                            </div>
                          </div>

                          {/* Stepper Buttons */}
                          <div className="workflow-step-nav">
                            {[
                              "01 אימות פרטים וגוש/חלקה",
                              "02 נסח טאבו ובעלים",
                              "03 רשם המשכונות",
                              "04 בדיקת חדלות פירעון",
                              "05 הליכים משפטיים",
                              "06 הפקת דוח לפי אלגוריתם",
                            ].map((label, idx) => (
                              <button
                                key={label}
                                className={`${activeStepIndex === idx ? "active" : ""} ${stepStatus[idx] ? "done" : ""}`}
                                onClick={() => setSelectedWorkflowStep(idx)}
                              >
                                <span>{stepStatus[idx] ? <Check size={14} /> : `0${idx + 1}`}</span>
                                <b>{label}</b>
                              </button>
                            ))}
                          </div>

                          {/* 2-Column Workflow: Main Actions (Right in RTL) + Dynamic Guidance Panel (Left in RTL) */}
                          <div className={`workflow-content-layout ${!showGuideSidebar ? "no-guide" : ""}`}>
                            <div className="workflow-main-column">

                              {/* STEP 1: CADASTRAL IDENTIFICATION */}
                          {activeStepIndex === 0 && (
                            <div className="workflow-step">
                              <b>שלב 01 · אימות פרטי הלקוח, הכתובת וזיהוי גוש/חלקה</b>
                              <p>
                                ודא שפרטי הנכס תואמים. גוש וחלקה נדרשים לצורך הפקת נסח טאבו מדויק.
                                תוכל להפעיל איתור אוטומטי מ-GovMap בלחיצה אחת או להיעזר במפה הממשלתית.
                              </p>

                              <div className="step-briefing-grid">
                                {/* Upload & Identification Card */}
                                <div className="step-upload-card">
                                  <div className="step-upload-header">
                                    <h4><Compass size={16} className="text-teal-600" /> זיהוי קדסטרלי מ-GovMap</h4>
                                    <span className={`step-upload-badge ${activeCase.block && activeCase.parcel ? "verified" : "missing"}`}>
                                      {activeCase.block && activeCase.parcel ? <><CheckCircle2 size={12} /> גוש וחלקה מאומתים</> : <><AlertCircle size={12} /> חסר גוש/חלקה</>}
                                    </span>
                                  </div>

                                  <div className="cadastral-auto-resolve">
                                    <Sparkles size={18} className="text-teal-600 flex-shrink-0" />
                                    <span>
                                      <b>איתור קדסטרלי:</b> המערכת מצליבה את הכתובת ({activeCase.street} {activeCase.house}, {activeCase.city}) מול שכבת החלקות הממשלתית.
                                    </span>
                                    <button
                                      type="button"
                                      className="workflow-action strong text-xs"
                                      disabled={isResolvingCadastral}
                                      onClick={handleAutoCadastral}
                                    >
                                      {isResolvingCadastral ? "מאתר מ-GovMap..." : "הפעל איתור אוטומטי"}
                                    </button>
                                  </div>

                                  <div className="cadastral-entry">
                                    <label>
                                      מספר גוש
                                      <input
                                        type="text"
                                        value={cadastralInput.block}
                                        placeholder="לדוגמה: 6158"
                                        onChange={(e) => setCadastralInput({ ...cadastralInput, block: e.target.value })}
                                      />
                                    </label>
                                    <label>
                                      מספר חלקה
                                      <input
                                        type="text"
                                        value={cadastralInput.parcel}
                                        placeholder="לדוגמה: 42"
                                        onChange={(e) => setCadastralInput({ ...cadastralInput, parcel: e.target.value })}
                                      />
                                    </label>
                                    <label>
                                      תת-חלקה
                                      <input
                                        type="text"
                                        value={cadastralInput.subParcel}
                                        placeholder="אם ידוע"
                                        onChange={(e) => setCadastralInput({ ...cadastralInput, subParcel: e.target.value })}
                                      />
                                    </label>
                                  </div>

                                  <div className="step-upload-footer flex items-center justify-between">
                                    <a
                                      href="https://www.gov.il/apps/mapi/parcel_address/parcel_address.html"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="gov-portal-link"
                                    >
                                      איתור ידני במרכז למיפוי ישראל (MAPI) <ExternalLink size={12} />
                                    </a>
                                    <button
                                      type="button"
                                      className="workflow-action strong text-xs"
                                      disabled={isActionLoading || !cadastralInput.block || !cadastralInput.parcel}
                                      onClick={handleSaveCadastral}
                                    >
                                      שמירת זיהוי והמשך
                                    </button>
                                  </div>
                                </div>

                                {/* Briefing Card */}
                                <div className="step-briefing-card">
                                  <div className="briefing-header">
                                    <h4 className="briefing-title"><Info size={15} /> תדרוך אנליסט לשלב 01</h4>
                                    <span className="briefing-step-badge">אימות ראשוני</span>
                                  </div>

                                  <div className="briefing-objective-text">
                                    ודא את דיוק נתוני הזיהוי של הנכס, פרטי הלקוח, ומאפייני הדירה הקריטיים למודל החישוב.
                                  </div>

                                  <div className="briefing-intake-card">
                                    <div className="briefing-intake-label"><Home size={12} /> נתוני הנכס מהטופס:</div>
                                    <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                                      <span>כתובת: <b>{activeCase.street} {activeCase.house}, {activeCase.city}</b></span>
                                      <span>סוג עסקה: <b>{activeCase.assetType || "יד שנייה"}</b></span>
                                      <span>קומה בבניין: <b>{activeCase.intakeData?.property?.floorNumber ?? "לא ידוע"}</b></span>
                                      <span>סה״כ קומות: <b>{activeCase.intakeData?.property?.totalFloors ?? "לא ידוע"}</b></span>
                                      <span>מעלית: <b>{activeCase.intakeData?.property?.hasElevator ? "יש מעלית" : "אין מעלית"}</b></span>
                                      <span>מחיר מבוקש: <b>{activeCase.price ? `₪${Number(activeCase.price).toLocaleString()}` : "לא צוין"}</b></span>
                                    </div>
                                  </div>

                                  <ul className="briefing-checklist">
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>הצלבת קדסטר:</b> השווה את הכתובת מול GovMap — לעיתים מספר הבית שונה קלות ברשומות הממשלתיות.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>כלל מודל לקומות:</b> נתון חסר על קומה/מספר קומות <u>לא יוסיף סיכון ולא ייצור Red Flag</u>. הוא ישפיע אך ורק על ה-Confidence של הערכת השווי.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>התאמת מחיר:</b> פער המחיר יחושב רק לאחר שקלול קומה ומעלית. אין להניח קומה ממוצעת כאשר הנתון חסר.</span>
                                    </li>
                                  </ul>

                                  <div className="briefing-redflags">
                                    <div className="briefing-redflags-label"><AlertTriangle size={12} /> דגלים אדומים לעצירה:</div>
                                    <ul className="briefing-redflags-list">
                                      <li>אי-התאמה מוחלטת בין העיר/רחוב לחלקת המיפוי (טעות בזיהוי פיזי).</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="workflow-step-actions">
                                <button
                                  type="button"
                                  className="workflow-action strong"
                                  disabled={isActionLoading || !cadastralInput.block || !cadastralInput.parcel}
                                  onClick={handleSaveCadastral}
                                >
                                  שמירת פרטי גוש/חלקה והמשך לשלב 2 <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STEP 2: TABU EXTRACT */}
                          {activeStepIndex === 1 && (
                            <div className="workflow-step">
                              <b>שלב 02 · נסח טאבו והצלבת בעלי הזכויות</b>
                              <p>
                                נסח הטאבו הוא מסמך הליבה של העסקה. העלה את הנסח בריבוע המסמכים, ובדוק בעזרת התדרוך הצמוד את פרטי הבעלים, הערות אזהרה, עיקולים והתאמת שטח.
                              </p>

                              <div className="step-briefing-grid">
                                {/* Document Upload Square */}
                                <div className="step-upload-card">
                                  <div className="step-upload-header">
                                    <h4><FileText size={16} className="text-teal-600" /> ריבוע העלאת נסח טאבו</h4>
                                    <span className={`step-upload-badge ${tabuDoc ? "verified" : "missing"}`}>
                                      {tabuDoc ? <><CheckCircle2 size={12} /> נסח מאומת בתיק</> : <><AlertCircle size={12} /> טרם הועלה נסח</>}
                                    </span>
                                  </div>

                                  {tabuDoc ? (
                                    <div className="step-upload-verified-box">
                                      <div className="verified-doc-meta">
                                        <div className="verified-doc-icon"><FileText size={20} /></div>
                                        <div>
                                          <div className="verified-doc-name">{tabuDoc.originalName || tabuDoc.filename}</div>
                                          <div className="verified-doc-sub">
                                            {Math.round((tabuDoc.size || 0) / 1024)} KB · הועלה ע״י {tabuDoc.source || "צוות SafeDeal"} בתאריך {new Date(tabuDoc.collectedAt).toLocaleDateString("he-IL")}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="verified-doc-actions">
                                        <button
                                          type="button"
                                          className="workflow-action text-xs"
                                          onClick={() => handleDownloadDoc(tabuDoc.id, tabuDoc.originalName || tabuDoc.filename)}
                                        >
                                          <Download size={13} /> צפייה והורדת הנסח
                                        </button>
                                        <label className="workflow-action text-xs cursor-pointer">
                                          <UploadCloud size={13} /> החלפת קובץ (עדכון נסח)
                                          <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files?.[0]) handleDirectFileUpload(e.target.files[0], "נסח טאבו / אישור זכויות");
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  ) : (
                                    <label className="step-upload-dropzone">
                                      <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        disabled={isActionLoading}
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) handleDirectFileUpload(e.target.files[0], "נסח טאבו / אישור זכויות");
                                        }}
                                      />
                                      <div className="step-upload-dropzone-icon">
                                        {isActionLoading ? <Sparkles size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                                      </div>
                                      <div className="step-upload-dropzone-title">
                                        {isActionLoading ? "מעלה נסח טאבו ומאמת בתיק..." : "גרור לכאן את נסח הטאבו (PDF / תמונה)"}
                                      </div>
                                      <div className="step-upload-dropzone-sub">או לחץ כאן לבחירת קובץ מהמחשב (עד 20MB)</div>
                                    </label>
                                  )}

                                  <div className="step-upload-footer">
                                    <a
                                      href="https://www.gov.il/he/service/land_registration_extract"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="gov-portal-link"
                                    >
                                      הפקת נסח טאבו מקוון באתר משרד המשפטים (gov.il) <ExternalLink size={12} />
                                    </a>
                                  </div>
                                </div>

                                {/* Briefing Card */}
                                <div className="step-briefing-card">
                                  <div className="briefing-header">
                                    <h4 className="briefing-title"><Info size={15} /> תדרוך אנליסט לבדיקת נסח הטאבו</h4>
                                    <span className="briefing-step-badge">משקל 33%</span>
                                  </div>

                                  <div className="briefing-objective-text">
                                    אימות זכויות קנייניות, התאמת שמות ות״ז מוכרים, זיהוי הצמדות ובדיקת הגבלות משפטיות.
                                  </div>

                                  <div className="briefing-intake-card">
                                    <div className="briefing-intake-label"><Users size={12} /> שמות המוכרים בטופס הלקוח:</div>
                                    <div className="briefing-intake-val">
                                      {sellersList.length ? sellersList.join(", ") : "לא צוינו שמות מוכרים בטופס הלקוח"}
                                    </div>
                                    {activeCase?.intakeData?.deal?.sellerIdNumber && (
                                      <div className="text-xs text-slate-600 mt-1">
                                        ת״ז מוכר מהטופס: <b>{activeCase.intakeData.deal.sellerIdNumber}</b>
                                      </div>
                                    )}
                                  </div>

                                  <ul className="briefing-checklist">
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>הצלבת בעלים 100%:</b> ודא התאמה מלאה של שמות ומספרי ת״ז של המוכר הרשום מול טופס הלקוח.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>שטח ותת-חלקה:</b> בדוק את שטח הדירה בצו הבית המשותף ואת ההצמדות (חניה רשומה, מחסן, הצמדת גג).</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>סריקת הערות אזהרה (סעיף 126):</b> בדוק לטובת מי רשומה הערה, האם לטובת הרוכש או גורם זר המונע רישום.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>עיקולים וצווי בית משפט:</b> ודא שאין עיקול מרשויות המס, הוצאה לפועל או בית משפט.</span>
                                    </li>
                                  </ul>

                                  <div className="briefing-redflags">
                                    <div className="briefing-redflags-label"><AlertTriangle size={12} /> דגלים אדומים לפסילה ועצירה (STOP):</div>
                                    <ul className="briefing-redflags-list">
                                      <li>עיקול פעיל על זכויות המוכר $\rightarrow$ עצירת עסקה מוחלטת!</li>
                                      <li>הערת אזהרה סותרת לעסקה קודמת $\rightarrow$ חשש למכירה כפולה.</li>
                                      <li>המוכר אינו הבעלים הרשום ואין בידו צו ירושה / ייפוי כוח בלתי חוזר.</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="workflow-step-actions">
                                <button
                                  type="button"
                                  className="workflow-action strong"
                                  onClick={() => setSelectedWorkflowStep(2)}
                                >
                                  המשך לשלב 3: מרשם המשכונות <ArrowRight size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="workflow-action"
                                  onClick={() => { setDocUploadType("נסח טאבו / אישור זכויות"); setShowDocUpload(true); }}
                                >
                                  <UploadCloud size={14} /> העלאה דרך חלון ייעודי
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STEP 3: PLEDGES REGISTRY */}
                          {activeStepIndex === 2 && (
                            <div className="workflow-step">
                              <b>שלב 03 · מרשם המשכונות והבטוחות (רשות התאגידים)</b>
                              <p>
                                <b>דגש מקצועי קריטי:</b> בדיקה ברשם המשכונות חייבת להתבצע בנפרד עבור <u>כל אחד מבעלי הזכויות</u> לפי תעודת הזהות שלו (ולא רק לפי הנכס), כדי לאתר שיעבודי זכויות חוזיות, חובות לבנקים או עיקולים.
                              </p>

                              <div className="step-briefing-grid">
                                {/* Document Upload Square & Owners Info */}
                                <div className="step-upload-card">
                                  <div className="step-upload-header">
                                    <h4><ShieldAlert size={16} className="text-teal-600" /> ריבוע העלאת דוח משכונות</h4>
                                    <span className={`step-upload-badge ${pledgesDoc ? "verified" : "missing"}`}>
                                      {pledgesDoc ? <><CheckCircle2 size={12} /> דוח מאומת בתיק</> : <><AlertCircle size={12} /> טרם הועלה דוח</>}
                                    </span>
                                  </div>

                                  {/* Quick copy owner IDs */}
                                  <div className="mb-3 space-y-2">
                                    {sellersList.length ? (
                                      sellersList.map((seller: string, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-white border rounded-lg text-xs">
                                          <span className="font-semibold text-slate-800">בעל/ת זכויות {i + 1}: {seller}</span>
                                          <div className="flex gap-1.5">
                                            <button
                                              type="button"
                                              className="property-copy-button"
                                              onClick={() => {
                                                navigator.clipboard.writeText(seller);
                                                showToast(`הועתק שם המוכר: ${seller}`);
                                              }}
                                            >
                                              <Copy size={11} /> שם
                                            </button>
                                            {activeCase?.intakeData?.deal?.sellerIdNumber && (
                                              <button
                                                type="button"
                                                className="property-copy-button"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(activeCase.intakeData.deal.sellerIdNumber);
                                                  showToast(`הועתקה ת״ז: ${activeCase.intakeData.deal.sellerIdNumber}`);
                                                }}
                                              >
                                                <Copy size={11} /> ת״ז
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-2 bg-white border rounded-lg text-xs text-slate-500">
                                        בדוק את שמות הבעלים בנסח הטאבו שהועלה לשלב 2.
                                      </div>
                                    )}
                                  </div>

                                  {pledgesDoc ? (
                                    <div className="step-upload-verified-box">
                                      <div className="verified-doc-meta">
                                        <div className="verified-doc-icon"><FileText size={20} /></div>
                                        <div>
                                          <div className="verified-doc-name">{pledgesDoc.originalName || pledgesDoc.filename}</div>
                                          <div className="verified-doc-sub">
                                            {Math.round((pledgesDoc.size || 0) / 1024)} KB · הועלה ע״י {pledgesDoc.source || "צוות SafeDeal"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="verified-doc-actions">
                                        <button
                                          type="button"
                                          className="workflow-action text-xs"
                                          onClick={() => handleDownloadDoc(pledgesDoc.id, pledgesDoc.originalName || pledgesDoc.filename)}
                                        >
                                          <Download size={13} /> צפייה והורדה
                                        </button>
                                        <label className="workflow-action text-xs cursor-pointer">
                                          <UploadCloud size={13} /> החלפת קובץ
                                          <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files?.[0]) handleDirectFileUpload(e.target.files[0], "דוח מרשם המשכונות");
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  ) : (
                                    <label className="step-upload-dropzone">
                                      <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        disabled={isActionLoading}
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) handleDirectFileUpload(e.target.files[0], "דוח מרשם המשכונות");
                                        }}
                                      />
                                      <div className="step-upload-dropzone-icon">
                                        {isActionLoading ? <Sparkles size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                                      </div>
                                      <div className="step-upload-dropzone-title">
                                        {isActionLoading ? "מעלה דוח משכונות לתיק..." : "גרור לכאן את דוח רשם המשכונות"}
                                      </div>
                                      <div className="step-upload-dropzone-sub">תומך ב-PDF, JPG, PNG (עד 20MB)</div>
                                    </label>
                                  )}

                                  <div className="step-upload-footer">
                                    <a
                                      href="https://ica.justice.gov.il/SearchPledge/PledgeBrowse?grdPledgeBrowse-sort=State-asc"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="gov-portal-link"
                                    >
                                      איתור משכונות באתר רשות התאגידים (ica.justice.gov.il) <ExternalLink size={12} />
                                    </a>
                                  </div>
                                </div>

                                {/* Briefing Card */}
                                <div className="step-briefing-card">
                                  <div className="briefing-header">
                                    <h4 className="briefing-title"><Info size={15} /> תדרוך אנליסט לבדיקת רשם המשכונות</h4>
                                    <span className="briefing-step-badge">משקל 20%</span>
                                  </div>

                                  <div className="briefing-objective-text">
                                    איתור שעבודים על זכויות חוזיות וחובות צד ג׳ שאינם מופיעים בנסח הטאבו הפורמלי.
                                  </div>

                                  <ul className="briefing-checklist">
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>בדיקה פרסונלית לפי ת״ז:</b> נסח טאבו מראה רק משכנתאות על הקרקע; משכון ברשם המשכונות רובץ על הזכויות האישיות של האדם.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>הבחנה בין משכנתה להלוואות:</b> משכנתה לטובת בנק מוכר היא שגרתית (תיפרע בתשלום ראשון/שני); משכון לטובת גורם חוץ-בנקאי הוא דגל חמור.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>שעבוד שוטף או זכויות עתידיות:</b> ודא שאין משכון על כלל נכסי המוכר לטובת נושים.</span>
                                    </li>
                                  </ul>

                                  <div className="briefing-redflags">
                                    <div className="briefing-redflags-label"><AlertTriangle size={12} /> דגלים אדומים לפסילה ועצירה:</div>
                                    <ul className="briefing-redflags-list">
                                      <li>משכון פעיל לטובת צד ג' פרטי שאינו בנק מסחרי $\rightarrow$ חשש להסתבכות כלכלית.</li>
                                      <li>משכון לטובת חברות אשראי חוץ-בנקאיות בסכומים חריגים.</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="workflow-step-actions">
                                <button
                                  type="button"
                                  className="workflow-action strong"
                                  onClick={() => setSelectedWorkflowStep(3)}
                                >
                                  המשך לשלב 4: חדלות פירעון <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STEP 4: INSOLVENCY REGISTRY */}
                          {activeStepIndex === 3 && (
                            <div className="workflow-step">
                              <b>שלב 04 · בדיקת חדלות פירעון (משרד המשפטים)</b>
                              <p>
                                <b>הנחיית מודל SafeDeal:</b> בדיקה במאגר הממונה על הליכי חדלות פירעון ושיקום כלכלי. חלה על מוכר פרטי (לפי ת״ז) בעסקת יד שנייה, ועל החברה/היזם (לפי ח״פ) בעסקת קבלן.
                                <br />
                                <span className="text-amber-500 text-xs mt-1 block font-medium">
                                  ⚠️ כלל ניסוח מחייב: המאגר בודק הליכים פורמליים בלבד — לעולם אין להשתמש בביטוי ״אין חובות״.
                                </span>
                              </p>

                              <div className="step-briefing-grid">
                                {/* Upload Square & Result Selector */}
                                <div className="step-upload-card">
                                  <div className="step-upload-header">
                                    <h4><Scale size={16} className="text-teal-600" /> תיעוד הבדיקה ורישום תוצאה במודל</h4>
                                    <span className={`step-upload-badge ${activeCase?.intakeData?.deal?.insolvencyStatus ? "verified" : "missing"}`}>
                                      {activeCase?.intakeData?.deal?.insolvencyStatus ? "תוצאה נרשמה" : "טרם נבדק"}
                                    </span>
                                  </div>

                                  {/* Current status if saved */}
                                  {activeCase?.intakeData?.deal?.insolvencyStatus && (
                                    <div className="cadastral-auto-resolve mb-3">
                                      <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                                      <span className="text-xs">
                                        <b>רשום בתיק:</b> {activeCase?.intakeData?.deal?.insolvencyTitle}
                                      </span>
                                    </div>
                                  )}

                                  {/* Quick Result Buttons */}
                                  <div className="grid grid-cols-1 gap-2 mb-3">
                                    <button
                                      type="button"
                                      disabled={isActionLoading}
                                      onClick={() =>
                                        handleRecordInsolvency({
                                          key: "clean",
                                          title: "לא אותר הליך חדלות פירעון במאגר שנבדק",
                                          note: "בדיקה במאגר הממונה על הליכי חדלות פירעון לפי מזהה הנבדק לא העלתה הליכים פעילים או סגורים ב-6 החודשים האחרונים.",
                                          severity: "נמוכה",
                                        })
                                      }
                                      className={`p-2.5 text-right rounded-lg border text-xs transition-all ${
                                        activeCase?.intakeData?.deal?.insolvencyStatus === "clean"
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold"
                                          : "border-slate-200 hover:border-emerald-400 bg-white text-slate-700"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-emerald-700 font-bold">לא אותר הליך פעיל (תקין)</span>
                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-mono">ציון 100</span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">נוסח תקני: ״לא אותר הליך חדלות פירעון במאגר שנבדק״ (ללא ״אין חובות״)</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isActionLoading}
                                      onClick={() =>
                                        handleRecordInsolvency({
                                          key: "active",
                                          title: "אותר הליך חדלות פירעון פעיל",
                                          note: "אותר הליך חדלות פירעון פעיל במשרד המשפטים. מפעיל STOP מיידי ותקרת ציון 39. מחייב בדיקה משפטית ואישור נאמן.",
                                          severity: "גבוהה",
                                        })
                                      }
                                      className={`p-2.5 text-right rounded-lg border text-xs transition-all ${
                                        activeCase?.intakeData?.deal?.insolvencyStatus === "active"
                                          ? "border-red-500 bg-red-50 text-red-900 font-bold"
                                          : "border-slate-200 hover:border-red-400 bg-white text-slate-700"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-red-700 font-bold">אותר הליך פעיל (STOP)</span>
                                        <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded font-mono">ציון 0 · תקרה 39</span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">עוצר התקדמות מיידית. מונע חתימת חוזה ללא אישור מפורש של הנאמן.</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isActionLoading}
                                      onClick={() =>
                                        handleRecordInsolvency({
                                          key: "recent_6m",
                                          title: "אותר הליך שהסתיים במהלך 6 החודשים האחרונים",
                                          note: "אותר הליך שהסתיים בטווח של 6 החודשים האחרונים. מוגדר כ-Red Flag אך אינו עוצר אוטומטית. יש לוודא הפטר סופי.",
                                          severity: "בינונית",
                                        })
                                      }
                                      className={`p-2.5 text-right rounded-lg border text-xs transition-all ${
                                        activeCase?.intakeData?.deal?.insolvencyStatus === "recent_6m"
                                          ? "border-amber-500 bg-amber-50 text-amber-900 font-bold"
                                          : "border-slate-200 hover:border-amber-400 bg-white text-slate-700"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-amber-700 font-bold">הסתיים ב-6 חודשים אחרונים</span>
                                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-mono">ציון 25 · Red Flag</span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">דגל סיכון. בדיקת צו הפטר חלוט ומניעת ביטול הענקה (ללא עצירה אוטומטית).</span>
                                    </button>
                                  </div>

                                  {/* Upload Screenshot / PDF box */}
                                  {insolvencyDoc ? (
                                    <div className="step-upload-verified-box mt-2">
                                      <div className="verified-doc-meta">
                                        <div className="verified-doc-icon"><FileText size={18} /></div>
                                        <div>
                                          <div className="verified-doc-name">{insolvencyDoc.originalName || insolvencyDoc.filename}</div>
                                          <div className="verified-doc-sub">{Math.round((insolvencyDoc.size || 0) / 1024)} KB · אסמכתה שמורה בתיק</div>
                                        </div>
                                      </div>
                                      <div className="verified-doc-actions">
                                        <button
                                          type="button"
                                          className="workflow-action text-xs"
                                          onClick={() => handleDownloadDoc(insolvencyDoc.id, insolvencyDoc.originalName || insolvencyDoc.filename)}
                                        >
                                          <Download size={13} /> צפייה באסמכתה
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <label className="step-upload-dropzone min-h-[90px] py-3 mt-2">
                                      <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        disabled={isActionLoading}
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) handleDirectFileUpload(e.target.files[0], "דוח חדלות פירעון (משרד המשפטים)");
                                        }}
                                      />
                                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                        <UploadCloud size={16} className="text-teal-600" />
                                        <span>העלאת צילום מסך או פלט מהמאגר (אופציונלי כגיבוי)</span>
                                      </div>
                                    </label>
                                  )}

                                  <div className="step-upload-footer">
                                    <a
                                      href="https://insolvency.justice.gov.il/poshtim/Main/Tikim/wfrmListTikim.aspx"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="gov-portal-link"
                                    >
                                      איתור תיקים במאגר חדלות פירעון (insolvency.justice.gov.il) <ExternalLink size={12} />
                                    </a>
                                  </div>
                                </div>

                                {/* Briefing Card */}
                                <div className="step-briefing-card">
                                  <div className="briefing-header">
                                    <h4 className="briefing-title"><Info size={15} /> תדרוך אנליסט לבדיקת חדלות פירעון</h4>
                                    <span className="briefing-step-badge">חומרה 10/10</span>
                                  </div>

                                  <div className="briefing-objective-text">
                                    שלילת סיכון קריטי של פשיטת רגל וביטול עסקת מקרקעין ע״י נאמן בית משפט.
                                  </div>

                                  {/* Copy Details */}
                                  <div className="briefing-intake-card">
                                    <div className="briefing-intake-label"><Search size={12} /> פרטים לחיפוש במאגר:</div>
                                    <div className="space-y-1.5 mt-1">
                                      {activeCase?.intakeData?.deal?.sellerIdNumber && (
                                        <div className="flex items-center justify-between text-xs">
                                          <span>ת״ז מוכר: <b>{activeCase.intakeData.deal.sellerIdNumber}</b></span>
                                          <button
                                            type="button"
                                            className="property-copy-button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(activeCase.intakeData.deal.sellerIdNumber);
                                              showToast(`הועתקה ת״ז: ${activeCase.intakeData.deal.sellerIdNumber}`);
                                            }}
                                          >
                                            <Copy size={11} /> העתק ת״ז
                                          </button>
                                        </div>
                                      )}
                                      {activeCase?.intakeData?.deal?.developerRegNumber && (
                                        <div className="flex items-center justify-between text-xs">
                                          <span>ח״פ יזם: <b>{activeCase.intakeData.deal.developerRegNumber}</b></span>
                                          <button
                                            type="button"
                                            className="property-copy-button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(activeCase.intakeData.deal.developerRegNumber);
                                              showToast(`הועתק ח״פ: ${activeCase.intakeData.deal.developerRegNumber}`);
                                            }}
                                          >
                                            <Copy size={11} /> העתק ח״פ
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <ul className="briefing-checklist">
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>כלל ניסוח קשיח:</b> לעולם אל תכתוב ״אין חובות״. המאגר בודק אך ורק הליכים פורמליים שנפתחו.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>הליך פעיל:</b> גורר עצירה מיידית (STOP / HOLD) ותקרת ציון 39 לכלל הדוח. הנכס שייך לקופת הנשייה.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>סיום ב-6 חודשים אחרונים:</b> מייצר Red Flag (ציון 25). חובה לוודא צו הפטר חלוט ומניעת ביטול הענקה לפי סעיף 220 לחוק חדלות פירעון.</span>
                                    </li>
                                  </ul>

                                  <div className="briefing-redflags">
                                    <div className="briefing-redflags-label"><AlertTriangle size={12} /> דגלים אדומים לפסילה ועצירה:</div>
                                    <ul className="briefing-redflags-list">
                                      <li>הליך פעיל של המוכר $\rightarrow$ עצירת העסקה מיידית (STOP).</li>
                                      <li>צו כינוס נכסים או מינוי נאמן תלוי ועומד.</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="workflow-step-actions">
                                <button
                                  type="button"
                                  className="workflow-action strong"
                                  onClick={() => setSelectedWorkflowStep(4)}
                                >
                                  המשך לשלב 5: הליכים משפטיים <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STEP 5: JUDICIAL & LITIGATION */}
                          {activeStepIndex === 4 && (
                            <div className="workflow-step">
                              <b>שלב 05 · הליכים משפטיים ונט המשפט (Nevo / בתי משפט)</b>
                              <p>
                                בדיקת תביעות משפטיות, סכסוכי קבלן/שכנים, צווי מניעה או תיקים תלויים על שם המוכרים או היזם. העלה את פלט הבדיקה בריבוע המסמכים ובדוק את הדגשים בתדרוך.
                              </p>

                              <div className="step-briefing-grid">
                                {/* Upload Square */}
                                <div className="step-upload-card">
                                  <div className="step-upload-header">
                                    <h4><Scale size={16} className="text-teal-600" /> ריבוע העלאת דוח הליכים משפטיים</h4>
                                    <span className={`step-upload-badge ${judicialDoc ? "verified" : "missing"}`}>
                                      {judicialDoc ? <><CheckCircle2 size={12} /> דוח בתיק</> : <><AlertCircle size={12} /> אופציונלי / טרם הועלה</>}
                                    </span>
                                  </div>

                                  {judicialDoc ? (
                                    <div className="step-upload-verified-box">
                                      <div className="verified-doc-meta">
                                        <div className="verified-doc-icon"><FileText size={20} /></div>
                                        <div>
                                          <div className="verified-doc-name">{judicialDoc.originalName || judicialDoc.filename}</div>
                                          <div className="verified-doc-sub">{Math.round((judicialDoc.size || 0) / 1024)} KB · הועלה לתיק</div>
                                        </div>
                                      </div>
                                      <div className="verified-doc-actions">
                                        <button
                                          type="button"
                                          className="workflow-action text-xs"
                                          onClick={() => handleDownloadDoc(judicialDoc.id, judicialDoc.originalName || judicialDoc.filename)}
                                        >
                                          <Download size={13} /> צפייה והורדה
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <label className="step-upload-dropzone">
                                      <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        disabled={isActionLoading}
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) handleDirectFileUpload(e.target.files[0], "דוח מתדיינים / הליכים משפטיים");
                                        }}
                                      />
                                      <div className="step-upload-dropzone-icon">
                                        <UploadCloud size={20} />
                                      </div>
                                      <div className="step-upload-dropzone-title">גרור לכאן דוח מתדיינים או פלט נט המשפט</div>
                                      <div className="step-upload-dropzone-sub">תומך ב-PDF, JPG, PNG (עד 20MB)</div>
                                    </label>
                                  )}

                                  <div className="step-upload-footer flex items-center gap-3">
                                    <a
                                      href="https://www.court.gov.il/"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="gov-portal-link"
                                    >
                                      נט המשפט (court.gov.il) <ExternalLink size={12} />
                                    </a>
                                    <a
                                      href="https://www.nevo.co.il/"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="gov-portal-link"
                                    >
                                      מאגר נבו (Nevo) <ExternalLink size={12} />
                                    </a>
                                  </div>
                                </div>

                                {/* Briefing Card */}
                                <div className="step-briefing-card">
                                  <div className="briefing-header">
                                    <h4 className="briefing-title"><Info size={15} /> תדרוך אנליסט לאיתור הליכים משפטיים</h4>
                                    <span className="briefing-step-badge">תביעות וסכסוכים</span>
                                  </div>

                                  <div className="briefing-objective-text">
                                    איתור תביעות קנייניות, סכסוכי פירוק שיתוף, צווי מניעה, או דפוסי תביעות ליקויי בנייה.
                                  </div>

                                  <ul className="briefing-checklist">
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>שמות הצדדים:</b> חפש את שמות המוכרים או היזם בנט המשפט / נבו.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>סינון תביעות:</b> התעלם מתביעות קטנות או סכסוכים ישנים שנסגרו ללא השפעה על הנכס.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>סכסוכי שכנים/ירושה:</b> בדוק האם תלויה תביעת פירוק שיתוף במקרקעין או סכסוך גבולות.</span>
                                    </li>
                                    <li>
                                      <span className="bullet">✓</span>
                                      <span><b>ברכישה מקבלן:</b> סרוק דפוס של תביעות איחורי מסירה או ליקויי בנייה סדרתיים (משקל 17%).</span>
                                    </li>
                                  </ul>

                                  <div className="briefing-redflags">
                                    <div className="briefing-redflags-label"><AlertTriangle size={12} /> דגלים אדומים לפסילה ועצירה:</div>
                                    <ul className="briefing-redflags-list">
                                      <li>צו מניעה זמני או תביעה תלויה ועומדת המעכבת דיספוזיציה בנכס.</li>
                                      <li>סכסוך בעלות או הליך ביטול הסכם מכר קודם.</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="workflow-step-actions">
                                <button
                                  type="button"
                                  className="workflow-action strong bg-teal-600 hover:bg-teal-700 text-white"
                                  onClick={() => setSelectedWorkflowStep(5)}
                                >
                                  המשך לשלב 06: הפקת הדוח לפי האלגוריתם והנתונים <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STEP 6: ALGORITHM SYNTHESIS, REPORT GENERATION & DISPATCH */}
                          {activeStepIndex === 5 && (
                            <div className="workflow-step">
                              <b>שלב 06 · הפקת הדוח ובקרת איכות אנליסט (Human-in-the-Loop)</b>
                              <p>
                                הפקת הדוח מבוססת על אלגוריתם שקלול הנתונים של SafeDeal. לאחר ההפקה, הדוח יוצג כטיוטה לבקרתך ועריכתך. <b>הדוח לא יישלח ללקוח ללא אישורך המפורש.</b>
                              </p>

                              {!caseDetail.report ? (
                                /* ── STATE A: BEFORE REPORT GENERATION ── */
                                <div className="step-briefing-grid">
                                  {/* Actions & Report Execution Card */}
                                  <div className="step-upload-card">
                                    <div className="step-upload-header">
                                      <h4><Sparkles size={16} className="text-teal-600" /> הפקת דוח על פי האלגוריתם</h4>
                                      <span className="step-upload-badge missing">טרם הופק דוח</span>
                                    </div>

                                    {/* Data readiness summary box */}
                                    <div className="p-3 bg-white border rounded-xl text-xs space-y-1.5 my-2">
                                      <div className="font-bold text-slate-800 mb-1">נתונים שישוקללו באלגוריתם:</div>
                                      <div className="grid grid-cols-2 gap-1.5 text-slate-600">
                                        <span>✓ גוש/חלקה: <b>{activeCase.block ? `גוש ${activeCase.block}, חלקה ${activeCase.parcel}` : "חסר"}</b></span>
                                        <span>✓ נסח טאבו: <b>{tabuDoc ? "מאומת בתיק" : "חסר"}</b></span>
                                        <span>✓ רשם המשכונות: <b>{pledgesDoc ? "נבדק והועלה" : "נבדק פרסונלית"}</b></span>
                                        <span>✓ חדלות פירעון: <b>{activeCase?.intakeData?.deal?.insolvencyStatus ? (activeCase.intakeData.deal.insolvencyTitle || "נבדק במאגר") : "טרם נבדק"}</b></span>
                                        <span>✓ קומה ומעלית: <b>{activeCase?.intakeData?.deal?.floorNumber ?? "לא ידוע"} {activeCase?.intakeData?.deal?.hasElevator ? "(יש מעלית)" : ""}</b></span>
                                        <span>✓ מחיר מבוקש: <b>{activeCase.price ? `₪${Number(activeCase.price).toLocaleString('he-IL')}` : "לא צוין"}</b></span>
                                      </div>
                                    </div>

                                    {/* Primary Generate Report Action Button */}
                                    <div className="my-3">
                                      <button
                                        type="button"
                                        className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                                        disabled={isActionLoading}
                                        onClick={handleGenerateReport}
                                      >
                                        {isActionLoading ? (
                                          <>
                                            <Sparkles size={18} className="animate-spin" />
                                            משקלל 11 מקורות ומפיק טיוטת דוח...
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles size={18} />
                                            הפקת דוח (Generate Report)
                                          </>
                                        )}
                                      </button>
                                      <p className="text-[11.5px] text-slate-500 text-center mt-2">
                                        ההפקה תריץ את אלגוריתם השקלול ותציג את טיוטת הדוח לבקרתך לפני שליחה.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Briefing Card */}
                                  <div className="step-briefing-card">
                                    <div className="briefing-header">
                                      <h4 className="briefing-title"><Info size={15} /> תדרוך אלגוריתם השקלול</h4>
                                      <span className="briefing-step-badge">11 מקורות</span>
                                    </div>

                                    <div className="briefing-objective-text">
                                      הרצת מודל הסיכונים המשוקלל: זכויות גלויות (33%), משכונות וחדלות פירעון (20%), מחיר ושוק מותאם קומה (30%), תכנון והיתרים (11%), זיהוי (6%).
                                    </div>

                                    <ul className="briefing-checklist">
                                      <li>
                                        <span className="bullet">✓</span>
                                        <span><b>שקלול קומות ומעלית:</b> פער המחיר מהשוק מחושב רק לאחר התאמת קומה ומעלית. נתון חסר אינו מייצר קנס או דגל אדום.</span>
                                      </li>
                                      <li>
                                        <span className="bullet">✓</span>
                                        <span><b>תקרת חדלות פירעון:</b> הליך פעיל במשרד המשפטים מפעיל אוטומטית STOP ותקרת ציון 39.</span>
                                      </li>
                                      <li>
                                        <span className="bullet">✓</span>
                                        <span><b>בקרה אנושית:</b> הדוח שיופק יוצג כטיוטה לעיונך ולעריכתך — הוא אינו נשלח ללקוח עד לאישורך הסופי.</span>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              ) : (
                                /* ── STATE B: ANALYST REVIEW SCREEN (HUMAN-IN-THE-LOOP) ── */
                                <div className="analyst-review-screen">
                                  {/* Draft Safeguard Notice Banner */}
                                  <div className="review-draft-banner">
                                    <div className="banner-icon">
                                      <Lock size={18} />
                                    </div>
                                    <div className="flex-1">
                                      <h4>טיוטת דוח לבקרת ועריכת אנליסט (Human-in-the-Loop Control)</h4>
                                      <p>
                                        <b>הדוח טרם נשלח ללקוח ולא יישלח אוטומטית.</b> באפשרותך לבחון את הממצאים שנוצרו על ידי האלגוריתם, לערוך ניסוחים, להתאים את הציון, ולכתוב המלצות מותאמות אישית. לאחר סיום הבדיקה, אשר את הדוח ולחץ על כפתור השליחה במייל.
                                      </p>
                                    </div>
                                    <span className="bg-amber-200/80 text-amber-900 text-xs px-2.5 py-1 rounded-full font-bold self-start whitespace-nowrap">
                                      {caseDetail.report.status || "טיוטה לבדיקה"}
                                    </span>
                                  </div>

                                  {/* SafeScore Executive Card with Score Adjuster */}
                                  <div className="review-score-card">
                                    <div className="score-badge-box">
                                      <div className={`score-number-pill ${reportScore >= 80 ? 'green' : reportScore >= 50 ? 'yellow' : 'red'}`}>
                                        <span>{reportScore}</span>
                                        <small className="text-[9px] uppercase font-bold tracking-wider">ציון</small>
                                      </div>
                                      <div className="score-meta-text">
                                        <h5>SafeScore משוקלל: {reportScore}/100</h5>
                                        <span>
                                          רמת סיכון: <b>{reportScore >= 80 ? 'נמוכה' : reportScore >= 65 ? 'בינונית-נמוכה' : reportScore >= 45 ? 'בינונית-גבוהה' : 'גבוהה'}</b> · גרסה {caseDetail.report.version}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="review-score-actions">
                                      {showScoreOverrideInput ? (
                                        <div className="flex items-center gap-2 p-1.5 bg-slate-50 border rounded-lg">
                                          <label className="text-xs font-bold text-slate-700">ציון מותאם:</label>
                                          <input
                                            type="number"
                                            min={10}
                                            max={100}
                                            value={reportScore}
                                            onChange={(e) => setReportScore(Number(e.target.value))}
                                            className="w-16 p-1 border rounded text-xs font-bold text-center"
                                          />
                                          <button
                                            type="button"
                                            className="workflow-action strong text-xs py-1 px-2"
                                            onClick={() => {
                                              setShowScoreOverrideInput(false);
                                              handleSaveReportDraft();
                                            }}
                                          >
                                            שמור ציון
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          className="workflow-action text-xs"
                                          onClick={() => setShowScoreOverrideInput(true)}
                                          title="התאמת ציון על פי שיקול דעת מקצועי"
                                        >
                                          <SlidersHorizontal size={13} /> התאמת ציון ידנית
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        className="workflow-action text-xs"
                                        disabled={isActionLoading}
                                        onClick={handleGenerateReport}
                                        title="הרצה חוזרת של האלגוריתם"
                                      >
                                        <RefreshCw size={13} className={isActionLoading ? "animate-spin" : ""} /> רענון אלגוריתמי
                                      </button>

                                      <Link
                                        href={`/report/${activeCase.caseNumber}`}
                                        target="_blank"
                                        className="workflow-action strong text-xs"
                                      >
                                        <Eye size={13} /> צפייה מקדימה בדוח הלקוח <ExternalLink size={11} />
                                      </Link>
                                    </div>
                                  </div>

                                  {/* Findings Inspection & Inline Editing */}
                                  <div className="review-findings-section">
                                    <div className="review-section-header">
                                      <h4>
                                        <FileText size={16} className="text-teal-600" />
                                        ממצאי הדוח לעריכה ובקרה ({caseDetail.findings?.length || 0} ממצאים שוקללו)
                                      </h4>
                                      <span className="text-xs text-slate-500">
                                        סמן כל ממצא כמאושר לדוח, לבירור או להסרה, ובצע עריכות ניסוח לפי הצורך
                                      </span>
                                    </div>

                                    <div className="review-findings-list">
                                      {caseDetail.findings?.map((f: any) => {
                                        const isEditingThis = editingFindingId === f.id;
                                        return (
                                          <div
                                            key={f.id}
                                            className={`review-finding-card ${f.state === 'נדחה' ? 'rejected' : ''}`}
                                          >
                                            {isEditingThis ? (
                                              <div className="space-y-2">
                                                <input
                                                  type="text"
                                                  value={editedFindingTitle}
                                                  onChange={(e) => setEditedFindingTitle(e.target.value)}
                                                  className="w-full p-2 border rounded text-xs font-bold"
                                                  placeholder="כותרת הממצא"
                                                />
                                                <textarea
                                                  rows={2}
                                                  value={editedFindingNote}
                                                  onChange={(e) => setEditedFindingNote(e.target.value)}
                                                  className="w-full p-2 border rounded text-xs"
                                                  placeholder="תיאור הממצא"
                                                />
                                                <div className="flex justify-end gap-2">
                                                  <button
                                                    type="button"
                                                    className="workflow-action text-xs py-1"
                                                    onClick={() => setEditingFindingId(null)}
                                                  >
                                                    ביטול
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="workflow-action strong text-xs py-1"
                                                    onClick={() => handleSaveFindingInline(f.id)}
                                                  >
                                                    <Save size={12} /> שמור עריכה
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="finding-card-header">
                                                  <div className="flex items-center gap-2">
                                                    <span className={`status-tag ${f.severity === 'גבוהה' ? 'bg-red-100 text-red-800' : f.severity === 'בינונית' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'} text-[10px]`}>
                                                      חומרה: {f.severity}
                                                    </span>
                                                    <span className="finding-card-title">{f.title}</span>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    className="text-xs text-slate-500 hover:text-teal-700 flex items-center gap-1"
                                                    onClick={() => handleStartEditFinding(f)}
                                                    title="עריכת ניסוח הממצא"
                                                  >
                                                    <Edit3 size={12} /> ערוך
                                                  </button>
                                                </div>

                                                <p className="finding-card-text">{f.note}</p>

                                                <div className="finding-card-footer">
                                                  <div className="flex items-center gap-2">
                                                    <span>תחום: <b>{f.category}</b></span>
                                                    {f.source && <span>· מקור: {f.source}</span>}
                                                  </div>

                                                  <div className="finding-status-pills">
                                                    <button
                                                      type="button"
                                                      className={`finding-pill-btn ${f.state === 'אושר' ? 'active-approved' : ''}`}
                                                      onClick={() => handleFindingState(f.id, "אושר")}
                                                    >
                                                      <Check size={11} className="inline ml-0.5" /> מאושר לדוח
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className={`finding-pill-btn ${f.state === 'לברור' ? 'active-flagged' : ''}`}
                                                      onClick={() => handleFindingState(f.id, "לברור")}
                                                    >
                                                      לבירור
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className={`finding-pill-btn ${f.state === 'נדחה' ? 'active-rejected' : ''}`}
                                                      onClick={() => handleFindingState(f.id, "נדחה")}
                                                    >
                                                      <X size={11} className="inline ml-0.5" /> הסרה מהדוח
                                                    </button>
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Analyst Executive Notes & Recommendations */}
                                  <div className="review-notes-section">
                                    <div className="review-section-header">
                                      <h4>
                                        <Lightbulb size={16} className="text-teal-600" />
                                        הערות והמלצות האנליסט ללקוח
                                      </h4>
                                      <button
                                        type="button"
                                        className="workflow-action strong text-xs"
                                        disabled={isActionLoading}
                                        onClick={() => handleSaveReportDraft(false)}
                                      >
                                        <Save size={13} /> שמירת עריכות הדוח
                                      </button>
                                    </div>

                                    <div className="review-textarea-group">
                                      <label>הערת אנליסט מסכמת (תוצג בדוח הלקוח כסיכום הבדיקה):</label>
                                      <textarea
                                        rows={3}
                                        value={reportSummary}
                                        onChange={(e) => setReportSummary(e.target.value)}
                                        placeholder="כתוב סיכום מקצועי מותאם עבור הלקוח..."
                                      />
                                    </div>

                                    <div className="review-textarea-group">
                                      <label>המלצות אופרטיביות לרוכש ולעורך הדין המייצג:</label>
                                      <textarea
                                        rows={3}
                                        value={reportRecommendation}
                                        onChange={(e) => setReportRecommendation(e.target.value)}
                                        placeholder="לדוגמה: מומלץ לכלול תנאי מתלה לגבי הסרת המשכנתה הקיימת של המוכר..."
                                      />
                                    </div>
                                  </div>

                                  {/* DISTINCT: SEND EMAIL TO CLIENT SECTION */}
                                  <div className="report-dispatch-card">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                      <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
                                          <Mail size={24} />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-slate-900 text-sm md:text-base m-0">
                                            שליחת הדוח הסופי המאושר ללקוח
                                          </h4>
                                          <p className="text-xs text-slate-600 m-0 mt-0.5">
                                            נמען: <b>{activeCase.clientName}</b> &lt;<span className="font-mono text-teal-900">{activeCase.clientEmail}</span>&gt;
                                            {caseDetail.case?.status === 'דוח נשלח' && (
                                              <span className="mr-2 text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                                                ✓ הדוח נשלח ללקוח
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          className="btn-send-client-email"
                                          disabled={isActionLoading}
                                          onClick={handleSendReport}
                                        >
                                          <Send size={15} />
                                          <span>{caseDetail.case?.status === 'דוח נשלח' ? "שליחה חוזרת במייל ללקוח" : "שליחת מייל ללקוח (Send Email to Client)"}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Left Side: Dynamic Analyst Copilot Guidance Panel */}
                        {showGuideSidebar && (
                          <aside className="workflow-guide-panel" aria-label="מדריך אנליסט צמוד">
                            <div className="guide-panel-header">
                              <div className="guide-title-box">
                                <Compass size={16} className="text-teal-200" />
                                <h4>מדריך אנליסט צמוד</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="guide-step-chip">שלב {ANALYST_STEP_GUIDES[activeStepIndex]?.stepNum || "01"}</span>
                                <button
                                  type="button"
                                  onClick={() => setShowGuideSidebar(false)}
                                  className="text-teal-200 hover:text-white"
                                  title="מזעור מדריך"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            </div>

                            <div className="guide-panel-body">
                              {/* Objective */}
                              <div className="guide-block">
                                <span className="guide-block-label">
                                  <Info size={13} className="text-teal-600" /> מטרת השלב
                                </span>
                                <div className="guide-objective">
                                  {ANALYST_STEP_GUIDES[activeStepIndex]?.objective}
                                </div>
                              </div>

                              {/* Action Checklist */}
                              <div className="guide-block">
                                <span className="guide-block-label">
                                  <CheckCircle2 size={13} className="text-emerald-600" /> משימות חובה לשלב זה
                                </span>
                                <ul className="guide-tasks-list">
                                  {ANALYST_STEP_GUIDES[activeStepIndex]?.actions.map((act, i) => (
                                    <li key={i}>
                                      <span className="task-bullet">{i + 1}</span>
                                      <span>{act}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Red Flags */}
                              <div className="guide-block">
                                <span className="guide-block-label text-rose-800">
                                  <ShieldAlert size={13} className="text-rose-600" /> דגלים אדומים לפסילה / עצירה
                                </span>
                                <div className="guide-red-flags">
                                  {ANALYST_STEP_GUIDES[activeStepIndex]?.redFlags.map((rf, i) => (
                                    <div key={i} className="guide-red-flags-item">
                                      <span className="text-rose-600 font-bold">•</span>
                                      <span>{rf}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Legal Tip */}
                              <div className="guide-block">
                                <span className="guide-block-label text-amber-800">
                                  <Lightbulb size={13} className="text-amber-600" /> טיפ מקצועי ומשפטי
                                </span>
                                <div className="guide-legal-tip">
                                  <span>{ANALYST_STEP_GUIDES[activeStepIndex]?.legalTip}</span>
                                </div>
                              </div>

                              {/* Model Impact */}
                              <div className="guide-block">
                                <span className="guide-block-label">
                                  <Scale size={13} className="text-slate-600" /> השפעה במודל הסיכונים
                                </span>
                                <div className="guide-model-badge">
                                  <span>{ANALYST_STEP_GUIDES[activeStepIndex]?.modelImpact}</span>
                                </div>
                              </div>
                            </div>
                          </aside>
                        )}
                      </div>

                          {/* Checklist Accordion */}
                          <details className="analyst-checklist" open>
                            <summary className="section-title">
                              <div>
                                <b>צ׳קליסט אימות והתקדמות הבדיקה</b>
                                <small>פתח כדי לעקוב אחר השלמת משימות האנליסט בתיק זה</small>
                              </div>
                              <span className="list-count">
                                {CHECKLIST_ITEMS.filter((item) => caseDetail.checklist?.[item.key]?.completed).length} / {CHECKLIST_ITEMS.length}
                              </span>
                            </summary>

                            <div className="checklist-list">
                              {CHECKLIST_ITEMS.map((item) => {
                                const isDone = Boolean(caseDetail.checklist?.[item.key]?.completed);
                                return (
                                  <label key={item.key} className={`checklist-row ${isDone ? "completed" : ""}`}>
                                    <input
                                      type="checkbox"
                                      checked={isDone}
                                      disabled={item.automatic}
                                      onChange={(e) => handleToggleChecklist(item.key, e.target.checked)}
                                    />
                                    <span className="checklist-copy">
                                      <b>{item.label}</b>
                                      <small>
                                        {item.automatic
                                          ? "מתעדכן אוטומטית בעת הפקת הדוח או שליחתו"
                                          : isDone
                                          ? `אושר ע״י ${caseDetail.checklist?.[item.key]?.completedBy || "הצוות"}`
                                          : "לסמן לאחר השלמת הפעולה"}
                                      </small>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </details>
                        </div>
                      )}

                      {/* ──────────────── TAB: INTAKE DATA (CUSTOMER FORM SNAPSHOT) ──────────────── */}
                      {activeTab === "intake" && (
                        <div className="intake-groups">
                          {["personal", "location", "deal"].map((sectionKey) => {
                            const sec = caseDetail.intakeData?.[sectionKey];
                            if (!sec) return null;
                            return (
                              <section key={sectionKey} className="intake-group">
                                <b>
                                  {sectionKey === "personal"
                                    ? "פרטי הלקוח המקוריים"
                                    : sectionKey === "location"
                                    ? "כתובת וזיהוי מבוקש"
                                    : "פרטי העסקה והנכס"}
                                </b>
                                <div className="intake-fields">
                                  {Object.entries(sec).map(([field, val]) => (
                                    <div key={field}>
                                      <small>{FIELD_LABELS[field] || field}</small>
                                      <span>
                                        {typeof val === "boolean"
                                          ? val ? "כן" : "לא"
                                          : Array.isArray(val)
                                          ? val.join(", ")
                                          : String(val || "לא צוין")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            );
                          })}

                          {caseDetail.intakeData?.documents?.length > 0 && (
                            <section className="intake-group">
                              <b>קבצים שהועלו ע״י הלקוח במעמד השליחה</b>
                              <div className="intake-fields">
                                {caseDetail.intakeData.documents.map((doc: any, i: number) => (
                                  <div key={i}>
                                    <small>מסמך {i + 1}</small>
                                    <span>{doc.name} ({Math.round((doc.size || 0) / 1024)} KB)</span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        </div>
                      )}

                      {/* ──────────────── TAB: DOCUMENTS ──────────────── */}
                      {activeTab === "documents" && (
                        <div>
                          <div className="section-title">
                            <div>
                              <b>מסמכי התיק המאובטחים</b>
                              <small>כל המסמכים שהועלו ע״י הלקוח או האנליסט לבדיקה</small>
                            </div>
                            <button
                              type="button"
                              className="button-primary text-xs"
                              onClick={() => setShowDocUpload(true)}
                            >
                              <Plus size={14} /> העלאת מסמך חדש
                            </button>
                          </div>

                          <div className="documents-grid">
                            {caseDetail.documents?.map((doc: any) => (
                              <div key={doc.id} className="document-item">
                                <span className="document-icon"><FileText size={18} /></span>
                                <span className="flex-1">
                                  <b>{doc.originalName || doc.filename}</b>
                                  <small className="block text-slate-500">{doc.documentType} · מקור: {doc.source}</small>
                                  <small className="block text-slate-400">{Math.round((doc.size || 0) / 1024)} KB · {new Date(doc.collectedAt).toLocaleDateString("he-IL")}</small>
                                </span>
                                <button
                                  type="button"
                                  className="text-action"
                                  onClick={() => handleDownloadDoc(doc.id, doc.originalName || doc.filename)}
                                  title="הורדת קובץ"
                                >
                                  <Download size={16} />
                                </button>
                              </div>
                            ))}
                            {!caseDetail.documents?.length && (
                              <div className="inline-empty col-span-2">לא צורפו עדיין מסמכים לתיק זה.</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ──────────────── TAB: FINDINGS ──────────────── */}
                      {activeTab === "findings" && (
                        <div>
                          <div className="section-title">
                            <div>
                              <b>ממצאי סיכון ובקרת אנליסט</b>
                              <small>כל ממצא דורש בקרת איכות של האנליסט לפני שייכלל בדוח הסופי</small>
                            </div>
                            <button
                              type="button"
                              className="button-primary text-xs"
                              onClick={() => handleRunAnalysis()}
                            >
                              <Sparkles size={14} /> רענון ניתוח AI
                            </button>
                          </div>

                          <div className="finding-list">
                            {caseDetail.findings?.map((f: any) => (
                              <div key={f.id} className="finding-row">
                                <div className="finding-severity">
                                  <i className={`severity-dot sev-${f.severity === 'גבוהה' ? 'high' : f.severity === 'נמוכה' ? 'low' : 'mid'}`} />
                                  חומרה: {f.severity}
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.note}</p>
                                <div className="finding-meta">
                                  <span>תחום: {f.category}</span>
                                  {f.source && <span>מקור: {f.source}</span>}
                                  {f.confidence && <span>ביטחון AI: {f.confidence}%</span>}
                                </div>
                                <div className="finding-review">
                                  <span>סטטוס: <b>{f.state}</b></span>
                                  <button type="button" onClick={() => handleFindingState(f.id, "אושר")}>
                                    <Check size={13} /> אישור
                                  </button>
                                  <button type="button" onClick={() => handleFindingState(f.id, "לברור")}>
                                    בירור נוסף
                                  </button>
                                  <button type="button" onClick={() => handleFindingState(f.id, "נדחה")}>
                                    <X size={13} /> דחייה
                                  </button>
                                </div>
                              </div>
                            ))}
                            {!caseDetail.findings?.length && (
                              <div className="inline-empty">
                                טרם נוצרו ממצאים לתיק זה. לחץ על &quot;הפעלת ניתוח AI&quot; בשלב 06.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ──────────────── TAB: ACTIVITY ──────────────── */}
                      {activeTab === "activity" && (
                        <div className="activity-list">
                          {caseDetail.activity?.map((act: any) => (
                            <div key={act.id} className="activity-item">
                              <span className="activity-dot"></span>
                              <div>
                                <b>{act.action}</b>
                                <small>{act.detail}</small>
                                <em>{act.actorName} · {new Date(act.createdAt).toLocaleString("he-IL")}</em>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-detail">
                      <FileText size={32} />
                      <b>בחר תיק מהרשימה כדי להתחיל</b>
                      <span>תור העבודה כולל את כל הבדיקות הממתינות לטיפול.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── CLIENTS DIRECTORY ──────────────── */}
          {currentNav === "clients" && (
            <div>
              <div className="staff-heading">
                <div>
                  <div className="eyebrow">תיקי לקוחות והיסטוריה</div>
                  <h1>מדריך לקוחות</h1>
                  <p>ריכוז כל הלקוחות שפנו לבדיקת נכסים דרך המערכת.</p>
                </div>
              </div>

              <div className="clients-directory">
                <div className="clients-directory-head">
                  <b>{clientGroups.length} לקוחות רשומים</b>
                  <span>{cases.length} בדיקות בסך הכול</span>
                </div>

                {clientGroups.map((group, i) => (
                  <article key={i} className="client-card">
                    <div className="client-card-top">
                      <div className="client-avatar">{group.name?.slice(0, 1) || "ל"}</div>
                      <div className="client-card-name">
                        <b>{group.name}</b>
                        <small>{group.cases.length} בדיקות במערכת</small>
                      </div>
                    </div>

                    <div className="client-contact">
                      {group.email && <a href={`mailto:${group.email}`}>{group.email}</a>}
                      {group.phone && <a href={`tel:${group.phone}`}>{group.phone}</a>}
                    </div>

                    <div className="client-history">
                      {group.cases.map((c: any) => (
                        <div key={c.id} className="client-history-row">
                          <span>
                            <b>{c.assetType} · {c.street} {c.house}, {c.city}</b>
                            <small>{c.caseNumber} · {new Date(c.createdAt).toLocaleDateString("he-IL")}</small>
                          </span>
                          <span className="status-tag">{c.status}</span>
                          <button
                            type="button"
                            className="text-action"
                            onClick={() => { setSelectedCaseId(c.id); setCurrentNav("cases"); }}
                          >
                            פתיחת תיק <ChevronLeft size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ──────────────── TOOLS DIRECTORY ──────────────── */}
          {currentNav === "tools" && (
            <div>
              <div className="staff-heading">
                <div>
                  <div className="eyebrow">מקורות עבודה ממשלתיים מאומתים</div>
                  <h1>כלים חשובים לאנליסט</h1>
                  <p>קישורים מהירים למאגרי הממשלה והנחיות עבודה לאנליזה מדויקת.</p>
                </div>
              </div>

              <div className="resource-grid">
                <a
                  href="https://www.gov.il/he/service/land_registration_extract"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card"
                >
                  <span className="resource-index">02</span>
                  <span>
                    <b>הפקת נסח טאבו</b>
                    <small>משרד המשפטים · חיפוש לפי גוש וחלקה</small>
                  </span>
                  <ExternalLink size={16} />
                </a>

                <a
                  href="https://ica.justice.gov.il/SearchPledge/PledgeBrowse?grdPledgeBrowse-sort=State-asc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card"
                >
                  <span className="resource-index">03</span>
                  <span>
                    <b>מרשם המשכונות והבטוחות</b>
                    <small>רשות התאגידים · בדיקת שיעבודים לפי ת״ז</small>
                  </span>
                  <ExternalLink size={16} />
                </a>

                <a
                  href="https://www.nevo.co.il/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card"
                >
                  <span className="resource-index">04</span>
                  <span>
                    <b>מאגר נבו (Nevo)</b>
                    <small>פסיקה, תביעות וסכסוכי מקרקעין</small>
                  </span>
                  <ExternalLink size={16} />
                </a>

                <a
                  href="https://www.gov.il/apps/mapi/parcel_address/parcel_address.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card"
                >
                  <span className="resource-index">מפה</span>
                  <span>
                    <b>איתור גוש וחלקה לפי כתובת</b>
                    <small>המרכז למיפוי ישראל (GovMap)</small>
                  </span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}

          {/* ──────────────── FINANCE ──────────────── */}
          {currentNav === "finance" && (
            <div>
              <div className="staff-heading">
                <div>
                  <div className="eyebrow">ניהול פנימי · הכנסות והוצאות</div>
                  <h1>יומן כספים</h1>
                  <p>מעקב אחר הכנסות מבדיקות נאותות והוצאות תפעוליות.</p>
                </div>
              </div>

              <div className="staff-metrics">
                <article>
                  <span className="metric-label">הכנסות רשומות</span>
                  <b>₪{financeSummary.income.toLocaleString("he-IL")}</b>
                  <small>סך הכנסות מבדיקות</small>
                </article>
                <article>
                  <span className="metric-label">הוצאות רשומות</span>
                  <b>₪{financeSummary.expenses.toLocaleString("he-IL")}</b>
                  <small>אגרות, נסחים ותוכנה</small>
                </article>
                <article>
                  <span className="metric-label">יתרה</span>
                  <b>₪{financeSummary.balance.toLocaleString("he-IL")}</b>
                  <small>רווח נקי תפעולי</small>
                </article>
              </div>
            </div>
          )}

          {/* ──────────────── COMPLIANCE ──────────────── */}
          {currentNav === "compliance" && (
            <div>
              <div className="staff-heading">
                <div>
                  <div className="eyebrow">בקרות ארגוניות ורגולציה</div>
                  <h1>ציות ופרטיות</h1>
                  <p>ניהול משימות ציות לפי חוק הגנת הפרטיות (תיקון 13) ואבטחת מידע.</p>
                </div>
              </div>

              <div className="space-y-4">
                {complianceTasks.map((task) => (
                  <div key={task.id} className="p-4 bg-white border rounded-xl flex items-center justify-between">
                    <div>
                      <b className="text-slate-800 text-base">{task.title}</b>
                      <p className="text-slate-500 text-sm mt-1">{task.description}</p>
                      <small className="text-slate-400">הערה: {task.note}</small>
                    </div>
                    <span className="status-tag">
                      {task.status === "complete" ? "הושלם" : "בתהליך"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──────────────── TEAM ──────────────── */}
          {currentNav === "team" && (
            <div>
              <div className="staff-heading">
                <div>
                  <div className="eyebrow">ניהול משתמשים והרשאות</div>
                  <h1>צוות SafeDeal</h1>
                  <p>רשימת העובדים והאנליסטים המורשים לגשת למערכת.</p>
                </div>
              </div>

              <div className="space-y-3">
                {team.map((m) => (
                  <div key={m.id} className="p-4 bg-white border rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="profile-avatar">{m.displayName?.slice(0, 1)}</div>
                      <div>
                        <b>{m.displayName}</b>
                        <small className="block text-slate-500">{m.email}</small>
                      </div>
                    </div>
                    <span className="status-tag">{m.role === "admin" ? "מנהל מערכת" : "אנליסט"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Document Upload Modal */}
      {showDocUpload && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud size={20} className="text-teal-600" />
                העלאת מסמך לתיק ותדרוך אימות
              </h3>
              <button type="button" onClick={() => setShowDocUpload(false)}><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Form Side */}
              <form onSubmit={handleDocumentUpload} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">סוג המסמך</label>
                  <select
                    name="documentType"
                    value={docUploadType}
                    onChange={(e) => setDocUploadType(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm bg-slate-50 font-medium"
                  >
                    {DOC_TYPES.map((dt) => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">קובץ (PDF או תמונה עד 20MB)</label>
                  <input
                    type="file"
                    name="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">מקור / אתר שממנו נאסף</label>
                  <input
                    type="text"
                    name="source"
                    placeholder="למשל: לשכת רישום המקרקעין, רשם המשכונות, נבו"
                    required
                    defaultValue={
                      docUploadType.includes("טאבו") ? "לשכת רישום המקרקעין (טאבו)" :
                      docUploadType.includes("משכונות") ? "רשם המשכונות (רשות התאגידים)" :
                      docUploadType.includes("חדלות") ? "מאגר חדלות פירעון (משרד המשפטים)" :
                      docUploadType.includes("משפט") ? "נט המשפט / נבו" : "אנליסט SafeDeal"
                    }
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    className="button-plain text-xs"
                    onClick={() => setShowDocUpload(false)}
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="button-primary text-xs"
                  >
                    {isActionLoading ? "מעלה..." : "שמור מסמך בתיק"}
                  </button>
                </div>
              </form>

              {/* Dynamic Guidance Side */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-teal-800 mb-2">
                    <Info size={15} />
                    <span>תדרוך לבדיקת: {docUploadType}</span>
                  </div>

                  {docUploadType.includes("טאבו") && (
                    <div className="space-y-2 text-slate-600">
                      <p><b>מה לבדוק בנסח:</b></p>
                      <ul className="list-disc pr-4 space-y-1">
                        <li>התאמת שמות ות״ז מוכרים לטופס הלקוח.</li>
                        <li>הצמדות: חניה רשומה, מחסן, שטח גג.</li>
                        <li>הערות אזהרה סותרות, עיקולים ושעבודים.</li>
                      </ul>
                      <div className="p-2 bg-red-50 border border-red-200 text-red-800 rounded mt-2">
                        <b>דגל אדום:</b> עיקול פעיל מונע העברת בעלות ועוצר את העסקה.
                      </div>
                    </div>
                  )}

                  {docUploadType.includes("משכונות") && (
                    <div className="space-y-2 text-slate-600">
                      <p><b>דגש משפטי:</b></p>
                      <ul className="list-disc pr-4 space-y-1">
                        <li>חובה לבדוק לפי ת״ז של כל אחד מבעלי הזכויות בנפרד.</li>
                        <li>איתור שעבודי זכויות חוזיות שאינן רשומות בטאבו.</li>
                        <li>הבחנה בין משכנתה רגילה לשעבוד צד ג'.</li>
                      </ul>
                    </div>
                  )}

                  {docUploadType.includes("חדלות") && (
                    <div className="space-y-2 text-slate-600">
                      <p><b>הנחיית ניסוח מחייבת:</b></p>
                      <div className="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded mb-2">
                        לעולם אין לרשום ״אין חובות״. יש לרשום ״לא אותר הליך חדלות פירעון במאגר שנבדק״.
                      </div>
                      <p>הליך פעיל $\rightarrow$ STOP ותקרת ציון 39.</p>
                    </div>
                  )}

                  {!docUploadType.includes("טאבו") && !docUploadType.includes("משכונות") && !docUploadType.includes("חדלות") && (
                    <div className="space-y-2 text-slate-600">
                      <p>ודא שהמסמך סרוק באיכות טובה, כולל את כל עמודיו, ומכיל חותמות מוסדיות או דיגיטליות רשמיות.</p>
                      <p>המסמך יצורף לספריית המסמכים המאובטחת וישמש את מנוע ה-AI בשקלול הסיכונים.</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 mt-3 text-[11px] text-slate-500">
                  כל המסמכים מוצפנים ונשמרים בהתאם לתקנות הגנת הפרטיות.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Dispatch Confirmation Modal */}
      {showEmailConfirmModal && activeCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  אישור שליחת דוח בדיקת נאותות ללקוח
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              הדוח נבדק ואושר על ידך כאנליסט. בלחיצה על אישור, המערכת תשלח ללקוח הודעת דוא״ל רשמית הכוללת קישור ישיר ומאובטח לדוח המלא.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs text-slate-700 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">שם הלקוח:</span>
                <span className="font-bold text-slate-900">{activeCase.clientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">כתובת מייל יעד:</span>
                <span className="font-mono font-bold text-teal-800 dir-ltr">{activeCase.clientEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">נכס נבדק:</span>
                <span className="font-medium text-slate-800">{activeCase.propertyAddress}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">ציון SafeScore מאושר:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                  reportScore >= 75 ? "bg-emerald-100 text-emerald-800" :
                  reportScore >= 50 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                }`}>
                  {reportScore} מתוך 100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">סטטוס תיק לאחר שליחה:</span>
                <span className="font-semibold text-emerald-700">דוח נשלח</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 leading-normal mb-5 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                <b>שים לב:</b> לאחר השליחה לא ניתן לבטל את הגעת המייל ללקוח. ודא כי כל הממצאים, המסמכים והתאמות המחיר תקינים לחלוטין.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="button-plain text-xs px-4 py-2"
                onClick={() => setShowEmailConfirmModal(false)}
                disabled={isActionLoading}
              >
                חזור לבדיקה
              </button>
              <button
                type="button"
                className="button-primary text-xs px-5 py-2 flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                onClick={handleConfirmSendEmail}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>שולח מייל...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>אשר ושלח מייל ללקוח</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="staff-toast" role="status">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage("")}><X size={15} /></button>
        </div>
      )}
    </div>
  );
}
