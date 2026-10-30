import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface StaffCase {
  id: string;
  caseNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  assetType: string;
  street: string;
  house: string;
  city: string;
  block: string | null;
  parcel: string | null;
  subParcel: string | null;
  price: string | number;
  status:
    | 'חדש'
    | 'באיסוף מידע'
    | 'ממתין למסמכים'
    | 'מוכן לניתוח'
    | 'בניתוח'
    | 'בבדיקת אנליסט'
    | 'דוח מוכן'
    | 'שולח דוח'
    | 'דוח נשלח';
  analystUserId: string | null;
  analystEmail: string | null;
  dueAt: string | null;
  findingCount: number;
  createdAt: string;
  updatedAt: string;
  intakeData: {
    personal: Record<string, any>;
    location: Record<string, any>;
    deal: Record<string, any>;
    documents?: Array<{ name: string; size: number; type?: string }>;
  };
  checklist: Record<
    string,
    { completed: boolean; completedBy?: string; completedAt?: string }
  >;
  documents: Array<{
    id: string;
    caseId: string;
    filename: string;
    originalName: string;
    documentType: string;
    source: string;
    collectedAt: string;
    size: number;
    filePath?: string;
  }>;
  findings: Array<{
    id: string;
    caseId: string;
    category: string;
    title: string;
    note: string;
    severity: 'נמוכה' | 'בינונית' | 'גבוהה';
    source?: string;
    state: 'לבדיקה' | 'אושר' | 'לברור' | 'נדחה';
    confidence?: number;
    reviewedBy?: string;
    reviewNote?: string;
    createdAt: string;
  }>;
  activity: Array<{
    id: string;
    caseId: string;
    action: string;
    detail: string;
    actorName: string;
    createdAt: string;
  }>;
  report: {
    version: string;
    generatedAt: string;
    safeScore?: number;
    status?: string;
    summaryNote?: string;
    recommendation?: string;
    analystApproved?: boolean;
    approvedAt?: string;
  } | null;
}

export interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
  active: boolean;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface ComplianceTask {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'needs_review' | 'complete';
  note: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface StaffStoreData {
  cases: StaffCase[];
  team: TeamMember[];
  finance: FinanceTransaction[];
  compliance: ComplianceTask[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'staff-store.json');
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const INITIAL_COMPLIANCE: ComplianceTask[] = [
  {
    id: 'c-1',
    title: 'הגנת פרטיות ורישום מאגר מידע',
    description: 'בדיקת חובת הודעה על מאגר מידע לרשות להגנת הפרטיות לפי תיקון 13',
    status: 'in_progress',
    note: 'בבדיקה מול יועץ משפטי',
  },
  {
    id: 'c-2',
    title: 'אבטחת מידע וניהול הרשאות גישה',
    description: 'הפרדת הרשאות אנליסט/מנהל, הצפנת מסמכים והגנה על נתוני נדל״ן רגישים',
    status: 'complete',
    note: 'הוטמעו בקרות הרשאה וניהול גישה',
  },
  {
    id: 'c-3',
    title: 'מדיניות שימוש במודלי בינה מלאכותית (AI Governance)',
    description: 'וידוא כי מידע אישי מזהה אינו נשלח ללא סינון וכי כל ממצא עובר בקרת אנליסט אנושי',
    status: 'complete',
    note: 'כל ממצא מחייב אישור אנליסט לפני הפקת דוח',
  },
  {
    id: 'c-4',
    title: 'הסכמי ספקים ורמת שירות (SLA) מקורות ממשלתיים',
    description: 'הסדרת גישה ורישוי מול ממשל זמין, רשות התאגידים וספקי דאטה',
    status: 'in_progress',
    note: 'חיבור שוטף ל-API הפתוח',
  },
];

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'tm-1',
    email: 'team@safedeal.co.il',
    displayName: 'צוות SafeDeal',
    role: 'admin',
    active: true,
  },
  {
    id: 'tm-2',
    email: 'analyst@safedeal.co.il',
    displayName: 'אנליסט SafeDeal',
    role: 'member',
    active: true,
  },
];

function getInitialStore(): StaffStoreData {
  return {
    cases: [],
    team: INITIAL_TEAM,
    finance: [],
    compliance: INITIAL_COMPLIANCE,
  };
}

class StaffStore {
  private data: StaffStoreData;

  constructor() {
    this.data = this.load();
  }

  private load(): StaffStoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          cases: parsed.cases ?? [],
          team: parsed.team?.length ? parsed.team : INITIAL_TEAM,
          finance: parsed.finance ?? [],
          compliance: parsed.compliance?.length ? parsed.compliance : INITIAL_COMPLIANCE,
        };
      }
    } catch (e) {
      console.error('Failed reading staff store, using defaults', e);
    }
    const initial = getInitialStore();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: StaffStoreData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(dataToSave ?? this.data, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.error('Failed writing staff store', e);
    }
  }

  public getCases(): StaffCase[] {
    return this.data.cases;
  }

  public getCase(id: string): StaffCase | undefined {
    return this.data.cases.find((c) => c.id === id || c.caseNumber === id);
  }

  public createCase(input: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    assetType?: string;
    street?: string;
    house?: string;
    city?: string;
    block?: string;
    parcel?: string;
    subParcel?: string;
    price?: string | number;
    intakeData: Record<string, any>;
    documents?: Array<{
      filename: string;
      originalName: string;
      documentType: string;
      source: string;
      size: number;
    }>;
  }): StaffCase {
    const id = `SD-${randomUUID().slice(0, 4).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
    const now = new Date().toISOString();

    const initialDocs = (input.documents || []).map((d) => ({
      id: randomUUID(),
      caseId: id,
      filename: d.filename,
      originalName: d.originalName,
      documentType: d.documentType,
      source: d.source,
      collectedAt: now,
      size: d.size,
    }));

    const newCase: StaffCase = {
      id,
      caseNumber: id,
      clientName: input.clientName || 'לקוח ללא שם',
      clientEmail: input.clientEmail || '',
      clientPhone: input.clientPhone || '',
      assetType: input.assetType || 'דירת מגורים',
      street: input.street || '',
      house: input.house || '',
      city: input.city || '',
      block: input.block || null,
      parcel: input.parcel || null,
      subParcel: input.subParcel || null,
      price: input.price || '',
      status: 'חדש',
      analystUserId: null,
      analystEmail: null,
      dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), // 48h default SLA
      findingCount: 0,
      createdAt: now,
      updatedAt: now,
      intakeData: {
        personal: input.intakeData.personal || {},
        location: input.intakeData.location || {},
        deal: input.intakeData.deal || {},
        documents: input.intakeData.documents || [],
      },
      checklist: {
        reports_collected: { completed: false },
        data_reviewed: { completed: false },
        insolvency_checked: { completed: false },
        data_verified: { completed: false },
        ai_findings_reviewed: { completed: false },
        report_generated: { completed: false },
        report_sent: { completed: false },
      },
      documents: initialDocs,
      findings: [],
      activity: [
        {
          id: randomUUID(),
          caseId: id,
          action: 'פתיחת תיק',
          detail: 'הבקשה התקבלה בהצלחה מטופס הלקוחות',
          actorName: 'מערכת SafeDeal',
          createdAt: now,
        },
      ],
      report: null,
    };

    this.data.cases.unshift(newCase);
    this.save();
    return newCase;
  }

  public updateCase(id: string, updates: Partial<StaffCase>, actorName = 'הצוות'): StaffCase | undefined {
    const c = this.getCase(id);
    if (!c) return undefined;

    const oldStatus = c.status;
    Object.assign(c, updates);
    c.updatedAt = new Date().toISOString();

    if (updates.status && updates.status !== oldStatus) {
      c.activity.unshift({
        id: randomUUID(),
        caseId: id,
        action: 'עדכון סטטוס',
        detail: `סטטוס שונה מ-"${oldStatus}" ל-"${updates.status}"`,
        actorName,
        createdAt: c.updatedAt,
      });
    }

    if (updates.block || updates.parcel) {
      c.activity.unshift({
        id: randomUUID(),
        caseId: id,
        action: 'עדכון גוש/חלקה',
        detail: `גוש: ${c.block ?? '-'}, חלקה: ${c.parcel ?? '-'}`,
        actorName,
        createdAt: c.updatedAt,
      });
    }

    this.save();
    return c;
  }

  public updateChecklist(id: string, itemKey: string, completed: boolean, actorName = 'צוות SafeDeal'): StaffCase | undefined {
    const c = this.getCase(id);
    if (!c) return undefined;

    c.checklist[itemKey] = {
      completed,
      completedBy: actorName,
      completedAt: new Date().toISOString(),
    };
    c.updatedAt = new Date().toISOString();

    c.activity.unshift({
      id: randomUUID(),
      caseId: id,
      action: completed ? 'סימון צ׳קליסט' : 'ביטול סימון',
      detail: `משימה: ${itemKey}`,
      actorName,
      createdAt: c.updatedAt,
    });

    this.save();
    return c;
  }

  public addDocument(
    id: string,
    doc: {
      filename: string;
      originalName: string;
      documentType: string;
      source: string;
      size: number;
      filePath?: string;
    },
    actorName = 'צוות SafeDeal'
  ) {
    const c = this.getCase(id);
    if (!c) return undefined;

    const now = new Date().toISOString();
    const newDoc = {
      id: randomUUID(),
      caseId: id,
      ...doc,
      collectedAt: now,
    };
    c.documents.unshift(newDoc);
    c.updatedAt = now;

    c.activity.unshift({
      id: randomUUID(),
      caseId: id,
      action: 'הוספת מסמך',
      detail: `${doc.documentType} (${doc.originalName})`,
      actorName,
      createdAt: now,
    });

    this.save();
    return newDoc;
  }

  public addFinding(
    id: string,
    finding: {
      category: string;
      title: string;
      note: string;
      severity: 'נמוכה' | 'בינונית' | 'גבוהה';
      source?: string;
      confidence?: number;
    },
    actorName = 'צוות SafeDeal'
  ) {
    const c = this.getCase(id);
    if (!c) return undefined;

    const now = new Date().toISOString();
    const newFinding = {
      id: randomUUID(),
      caseId: id,
      ...finding,
      state: 'לבדיקה' as const,
      createdAt: now,
    };
    c.findings.unshift(newFinding);
    c.findingCount = c.findings.length;
    c.updatedAt = now;

    c.activity.unshift({
      id: randomUUID(),
      caseId: id,
      action: 'הוספת ממצא',
      detail: `${finding.category}: ${finding.title}`,
      actorName,
      createdAt: now,
    });

    this.save();
    return newFinding;
  }

  public updateFinding(
    findingId: string,
    updates: {
      state?: 'לבדיקה' | 'אושר' | 'לברור' | 'נדחה';
      category?: string;
      title?: string;
      note?: string;
      severity?: 'נמוכה' | 'בינונית' | 'גבוהה';
      source?: string;
      reviewNote?: string;
    },
    actorName = 'אנליסט SafeDeal'
  ) {
    for (const c of this.data.cases) {
      const f = c.findings.find((item) => item.id === findingId);
      if (f) {
        Object.assign(f, updates);
        if (updates.state) {
          f.reviewedBy = actorName;
        }
        c.updatedAt = new Date().toISOString();
        c.activity.unshift({
          id: randomUUID(),
          caseId: c.id,
          action: 'בקרת ממצא',
          detail: `ממצא "${f.title}" עודכן לסטטוס "${f.state}"`,
          actorName,
          createdAt: c.updatedAt,
        });
        this.save();
        return f;
      }
    }
    return undefined;
  }

  public createReportVersion(
    caseId: string,
    actorName = 'אנליסט SafeDeal',
    overrides?: { safeScore?: number; summaryNote?: string; recommendation?: string }
  ) {
    const c = this.getCase(caseId);
    if (!c) return undefined;

    const versionNum = c.report ? parseInt(c.report.version.replace('V', '')) + 1 : 1;
    const version = `V${versionNum}`;
    const now = new Date().toISOString();

    // Calculate dynamic SafeScore based on risk model algorithm rules
    let calculatedScore = 88;
    const insolvencyStatus = c.intakeData?.deal?.insolvencyStatus;
    const hasTabu = c.documents.some((d) => d.documentType.includes('טאבו'));
    const hasActiveInsolvency = insolvencyStatus === 'active';
    const hasRecentInsolvency = insolvencyStatus === 'recent_6m';

    if (hasActiveInsolvency) {
      // Hard cap rule from SafeDeal model: Active insolvency triggers STOP and caps score at max 39
      calculatedScore = 35;
    } else if (hasRecentInsolvency) {
      calculatedScore -= 20; // Red Flag penalty
    }

    if (!hasTabu) {
      calculatedScore -= 18;
    }

    if (!c.block || !c.parcel) {
      calculatedScore -= 10;
    }

    // High severity findings check
    const highSevCount = c.findings.filter((f) => f.severity === 'גבוהה').length;
    if (highSevCount > 0 && !hasActiveInsolvency) {
      calculatedScore = Math.min(calculatedScore, 44);
    }

    calculatedScore = Math.max(15, Math.min(98, calculatedScore));

    if (overrides?.safeScore !== undefined && overrides?.safeScore !== null) {
      calculatedScore = Number(overrides.safeScore);
    }

    const defaultSummary = calculatedScore >= 80
      ? 'הנכס נבדק בהצלחה מול כל 11 המאגרים הממשלתיים ונמצא בעל רמת סיכון נמוכה. הזכויות בטאבו מוסדרות, לא אותרו שעבודים חריגים או הליכי חדלות פירעון.'
      : calculatedScore >= 50
      ? 'הנכס נבדק מול המאגרים ואותרו מספר נקודות לתשומת לב משפטית. מומלץ להסדיר את הדגלים המסומנים מול עו״ד טרם חתימה.'
      : 'בבדיקת הנכס אותרו דגלי סיכון מהותיים המחייבים בדיקה משפטית מעמיקה ועצירת התקדמות ללא קבלת אישורים מוסמכים.';

    const defaultRecommendation = calculatedScore >= 80
      ? 'ניתן להתקדם לעסקה תוך ליווי משפטי שגרתי, בכפוף לבדיקת נסח טאבו עדכני סמוך לחתימה.'
      : calculatedScore >= 50
      ? 'יש להעביר את ממצאי הבדיקה לעו״ד המייצג ולכלול תנאים מתלים בחוזה המכר לגבי הסרת השעבודים/ההערות.'
      : 'עצירת העסקה (STOP): אין לחתום על זיכרון דברים או להעביר כספים עד לקבלת הבהרות ואישורים משפטיים.';

    c.report = {
      version,
      generatedAt: now,
      safeScore: calculatedScore,
      status: 'טיוטה לבדיקת אנליסט',
      summaryNote: overrides?.summaryNote ?? defaultSummary,
      recommendation: overrides?.recommendation ?? defaultRecommendation,
      analystApproved: false,
    };
    c.status = 'בבדיקת אנליסט';
    c.checklist.report_generated = {
      completed: true,
      completedBy: actorName,
      completedAt: now,
    };
    c.updatedAt = now;

    c.activity.unshift({
      id: randomUUID(),
      caseId,
      action: 'הפקת טיוטת דוח',
      detail: `הופקה טיוטת דוח גרסה ${version} (SafeScore: ${calculatedScore}) לבקרת אנליסט — ממתינה לאישור ושליחה`,
      actorName,
      createdAt: now,
    });

    this.save();
    return c.report;
  }

  public sendReport(caseId: string, actorName = 'צוות SafeDeal') {
    const c = this.getCase(caseId);
    if (!c) return undefined;

    const now = new Date().toISOString();
    c.status = 'דוח נשלח';
    if (c.report) {
      c.report.status = 'נשלח ללקוח';
      c.report.analystApproved = true;
      c.report.approvedAt = now;
    }
    c.checklist.report_sent = {
      completed: true,
      completedBy: actorName,
      completedAt: now,
    };
    c.updatedAt = now;

    c.activity.unshift({
      id: randomUUID(),
      caseId,
      action: 'שליחת מייל ללקוח',
      detail: `דוח בדיקת נאותות רשמי נשלח בהצלחה לכתובת ${c.clientEmail}`,
      actorName,
      createdAt: now,
    });

    this.save();
    return true;
  }

  // ── Team, Finance, Compliance ──
  public getTeam(): TeamMember[] {
    return this.data.team;
  }

  public addTeamMember(email: string, role: 'admin' | 'member'): TeamMember {
    const existing = this.data.team.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;

    const newMember: TeamMember = {
      id: `tm-${this.data.team.length + 1}`,
      email,
      displayName: email.split('@')[0],
      role,
      active: true,
    };
    this.data.team.push(newMember);
    this.save();
    return newMember;
  }

  public getFinance() {
    const income = this.data.finance
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = this.data.finance
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      transactions: this.data.finance,
      summary: {
        income,
        expenses,
        balance: income - expenses,
      },
    };
  }

  public addFinance(t: Omit<FinanceTransaction, 'id'>) {
    const newTx: FinanceTransaction = {
      id: `tx-${randomUUID().slice(0, 8)}`,
      ...t,
    };
    this.data.finance.unshift(newTx);
    this.save();
    return newTx;
  }

  public getCompliance(): ComplianceTask[] {
    return this.data.compliance;
  }

  public updateCompliance(
    id: string,
    updates: { status?: ComplianceTask['status']; note?: string },
    actorName = 'Admin'
  ) {
    const task = this.data.compliance.find((t) => t.id === id);
    if (!task) return undefined;
    if (updates.status) task.status = updates.status;
    if (updates.note !== undefined) task.note = updates.note;
    task.updatedBy = actorName;
    task.updatedAt = new Date().toISOString();
    this.save();
    return task;
  }
}

export const staffStore = new StaffStore();
