import { getDb } from "../../db";
import { analyzeWithBuiltInPdfParser } from "./pdf-risk-parser";
import { getFilesBucket } from "./storage";

export const safeDealRiskModel = {
  version: "2026-10-12",
  scope: "מיון ראשוני של סיכוני נכס. אינו מחליף בדיקה משפטית, שמאית או הנדסית.",
  tracks: {
    "יד שנייה": [
      { category: "זיהוי", weight: 0.03, check: "זיהוי נכס חד-ערכי", anchors: { "100": "נכס יחיד מזוהה", "75": "פער טכני", "50": "מספר התאמות", "25": "סתירה מהותית", "0": "לא ניתן לזהות" } },
      { category: "זכויות", weight: 0.08, check: "התאמת המוכר לבעלים", anchors: { "100": "התאמה מלאה", "75": "פער טכני", "50": "התאמה חלקית", "25": "אין מלוא זכויות", "0": "אין התאמה" } },
      { category: "זכויות", weight: 0.08, check: "עיקולים וצווים", anchors: { "100": "אין", "75": "היסטורי סגור", "50": "פתרון מתועד", "25": "פעיל ללא פתרון", "0": "מונע העברה" } },
      { category: "זכויות", weight: 0.07, check: "הערות אזהרה וצד ג׳", anchors: { "100": "אין הערה סותרת", "75": "לא מגבילה", "50": "יש מנגנון מחיקה", "25": "ללא פתרון", "0": "עסקה סותרת" } },
      { category: "משכונות", weight: 0.081, check: "משכון פעיל על הנכס/בעלים", anchors: { "100": "אין פעיל", "75": "בוטל", "50": "התאמה אפשרית", "25": "פעיל ללא זיקה ודאית", "0": "פעיל מאומת בעל זיקה" } },
      { category: "רקע משפטי", weight: 0.072, check: "הליך פלילי מוכר", anchors: { "100": "אין רלוונטי", "75": "סגור ללא הרשעה", "50": "התאמה אפשרית", "25": "הליך בחמש השנים האחרונות ללא תוצאה ברורה", "0": "פתוח מאומת או הרשעה מאומתת בחמש השנים האחרונות" } },
      { category: "רקע משפטי", weight: 0.048, check: "הליך אזרחי המשפיע על העסקה", anchors: { "100": "אין", "75": "סגור", "50": "פתוח לא רלוונטי", "25": "השפעה אפשרית", "0": "מאיים על זכויות/העברה" } },
      { category: "שוק", weight: 0.1215, check: "פער מחיר מול שוק", anchors: { "100": "בטווח", "75": "עד 5% מעל", "50": "5%-10%", "25": "10%-20%", "0": "מעל 20%" } },
      { category: "תכנון", weight: 0.06, check: "תוכניות וייעוד גלויים", anchors: { "100": "אין סתירה", "75": "תוכנית מוקדמת", "50": "השפעה אפשרית", "25": "השפעה מהותית", "0": "ייעוד סותר" } }
    ],
    "דירה חדשה מקבלן": [
      { category: "זהות תאגיד", weight: 0.024, check: "התאמת ח״פ לישות המוכרת", anchors: { "100": "התאמה מלאה", "75": "שם היסטורי", "50": "פער טכני", "25": "פער מהותי", "0": "ישות אחרת" } },
      { category: "מצב תאגידי", weight: 0.072, check: "פעילה וחברה מפרה", anchors: { "100": "פעילה ולא מפרה", "75": "פער דיווח", "50": "פעילה מפרה", "25": "לא פעילה/לא ברור", "0": "מחוקה/פירוק" } },
      { category: "מצב תאגידי", weight: 0.04, check: "גיל החברה", anchors: { "100": "מעל 5 שנים", "75": "2-5 שנים", "50": "מתחת 2 עם ניסיון מאומת", "25": "מתחת 2 ללא ניסיון", "0": "חדשה וגם מפרה/לא פעילה" } },
      { category: "שעבודים", weight: 0.1375, check: "בטוחה פעילה על יזם/קבלן/פרויקט", anchors: { "100": "אין רלוונטי", "75": "שגרתי עם החרגה", "50": "זיקה לא ברורה", "25": "זיקה אפשרית ללא פתרון", "0": "מסכנת זכויות/כספים" } },
      { category: "רקע משפטי", weight: 0.072, check: "יותר מ-5 תביעות גדולות בשנה", anchors: { "100": "0-1", "75": "2-3", "50": "4-5", "25": "מעל 5 לא מאומת", "0": "מעל 5 מאומת" } },
      { category: "רקע משפטי", weight: 0.056, check: "איחור/אי מסירה", anchors: { "100": "אין", "75": "יחיד סגור ללא קביעה", "50": "יחיד פתוח", "25": "דפוס תביעות", "0": "קביעה נגד החברה/דפוס מאומת" } },
      { category: "רקע משפטי", weight: 0.032, check: "תיק פתוח מהותי", anchors: { "100": "אין", "75": "לא מהותי", "50": "מעקב", "25": "השפעה אפשרית", "0": "מאיים על פעילות/מסירה" } }
    ]
  },
  additionalReviewRules: [
    "מידע חסר הוא NOT_TESTED: מוצא מהמכנה ומפחית Coverage ו-Confidence; לעולם לא להפוך לחיובי/שלילי או ל-0/100.",
    "ציון = ממוצע משוקלל של בדיקות שבוצעו בלבד; Coverage = סכום משקלי הבדיקות שבוצעו. דווח גם את היקף המשקלים שהמודל מכסה בפועל.",
    "CRITICAL גובר על הממוצע ועשוי להפעיל STOP/HOLD או תקרת ציון לפי מטריצת הבדיקות.",
    "התאמת אדם דורשת תעודת זהות; התאמת חברה דורשת ח״פ. שם בלבד הוא REVIEW, לא התאמה מאומתת.",
    "תיק פתוח/חקירה/כתב אישום אינם הרשעה; תיק סגור ללא הרשעה אינו דגל אוטומטי. כל דגל משפטי מחייב בקרה אנושית.",
    "משכון נכנס לניקוד רק כשהקשר לנכס ודאי או גבוה; שם בלבד או נכס אחר אינם מספיקים. למנוע ספירה כפולה של אותה בטוחה.",
    "משכנתה ראשונה יחידה לבנק אינה חריגה בפני עצמה. זוג בעלים בדיוק, חלוקה 50/50, שם משפחה דומה וללא ירושה אינו מורכבות בעלות.",
    "כללי סיכוני הרישום המעודכנים (עיקול פעיל, הפקעה, מגבלה, הערת מס, מורכבות בעלות, מוכר לא רשום, משכנתאות חריגות, משכונות וחברות) הם איתותים לבדיקה אנושית; אין להם משקל מספרי חדש בקובץ. אל תמציא להם משקל או השפעה על הציון.",
    "סווג כל ממצא במפורש כאחד משלושה: [עובדה מתועדת], [הערכה/הסקת מערכת], או [דורש אימות אנושי]. אל תייצר דגלים אדומים או ממצאי סרק ללא בסיס במסמכים.",
    "מסמך רשם המשכונות ומסמך משפטי שהועלו לתיק חייבים להיות מעובדים לפי תוכנם ומשמעותם העסקית ולהשתקף בממצאים ובשקלול הסיכון.",
    "המטריצה מכסה רק 0.6425 משקל ביד שנייה ו-0.4335 בקבלן, לעומת משקלי מסלולים שסכומם 1.0. חסרים כיסויי קטגוריות (כולל אזור/נגישות וחלק מבדיקות שוק ותכנון); לכן אין להציג את הציון כציון מלא או לדרג LOW/MEDIUM/HIGH בלי ספי סיווג מאושרים. הצג Coverage מוגבל ואזהרת מודל חלקי."
  ],
  outputRequirements: "החזר סיכום בעברית, רשימת ממצאים ממוספרת עם מקור/שם קובץ, ראיה קצרה, רמת חומרה (גבוהה/בינונית/נמוכה), confidence (0-100), פעולה מומלצת. דווח riskAssessment עם score (או null כשאין בסיס), coverage, override, modelCompletenessWarning, missingInformation. אין לקבוע ממצא משפטי/פלילי כעובדה ללא ראיה מפורשת במסמך."
} as const;

const maxAnalysisBytes = 12 * 1024 * 1024;
const supportedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

type AnalysisFinding = {
  category?: unknown;
  title?: unknown;
  note?: unknown;
  severity?: unknown;
  source?: unknown;
  evidence?: unknown;
  recommendation?: unknown;
  confidence?: unknown;
};

type AnalysisResponsePayload = {
  summary?: unknown;
  missingInformation?: unknown;
  findings?: unknown;
  riskAssessment?: unknown;
};

function asText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

async function analyzeWithGeminiDirect(params: {
  caseData: Record<string, unknown>;
  loadedFiles: Array<{ filename: string; contentType: string; bytes: ArrayBuffer; documentType: string }>;
}): Promise<{ payload: AnalysisResponsePayload | null; reason?: string }> {
  const geminiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  )?.trim();
  if (!geminiKey) return { payload: null, reason: "no_gemini_key" };

  const parts: Array<Record<string, unknown>> = [
    {
      text: `אתה אנליסט סיכוני נדל"ן של SafeDeal. נתח את המסמכים המצורפים בהתאם למודל הסיכונים של SafeDeal (safeDealRiskModel) ונתוני התיק הבאים:\n${JSON.stringify(params.caseData)}\n\nהחזר JSON תקין בלבד (ללא markdown) במבנה הבא:\n{\n  "summary": "סיכום קצר בעברית",\n  "missingInformation": ["מידע חסר אם יש"],\n  "riskAssessment": { "score": number | null, "coverage": number, "override": "NONE" | "STOP" | "HOLD", "modelCompletenessWarning": "הערה" },\n  "findings": [\n    {\n      "category": "רשם המשכונות / זכויות / חדלות פירעון / רקע משפטי / תכנון והנדסה",\n      "title": "כותרת תמציתית",\n      "note": "פירוט הממצא ומשמעותו העסקית",\n      "severity": "גבוהה" | "בינונית" | "נמוכה",\n      "source": "שם הקובץ והמקור",\n      "evidence": "ראיה מתוך המסמך",\n      "recommendation": "פעולה מומלצת",\n      "confidence": 0-100\n    }\n  ]\n}\n\nחשוב: אם הועלה דוח רשם המשכונות, קרא את תוכנו המלא — אם אותרו משכונות פעילים פרט אותם עם חומרה מתאימה (גבוהה/בינונית); אם הבדיקה נקייה ולא אותרו משכונות, צור ממצא 'רשם המשכונות' בחומרה 'נמוכה' המתעד שבדוח שהועלה לא אותרו משכונות פעילים.`,
    },
  ];

  for (const file of params.loadedFiles) {
    parts.push({
      inline_data: {
        mime_type: file.contentType,
        data: Buffer.from(file.bytes).toString("base64"),
      },
    });
  }

  for (const model of ["gemini-2.5-flash", "gemini-2.0-flash"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
          signal: AbortSignal.timeout(85_000),
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`Gemini ${model} returned ${res.status}: ${errText.slice(0, 200)}`);
        continue;
      }
      const json = (await res.json().catch(() => null)) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      } | null;
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;
      return { payload: JSON.parse(rawText) as AnalysisResponsePayload };
    } catch (err) {
      console.warn(`Gemini ${model} failed:`, err instanceof Error ? err.message : err);
    }
  }

  return { payload: null, reason: "gemini_request_failed" };
}

export async function runCaseDocumentAnalysis(params: {
  caseId: string;
  staff: { userId: string; displayName: string };
  allowAnyStatus?: boolean;
}) {
  const { caseId, staff, allowAnyStatus = true } = params;
  const db = getDb();

  const caseRow = await db.$client
    .prepare(
      `SELECT id, case_number AS caseNumber, status, asset_type AS assetType, city, street, house,
      block, parcel, sub_parcel AS subParcel, condition, price, area, rooms, floor, monthly_rent AS monthlyRent, seller_name AS sellerName,
      amenities, intake_payload AS intakePayload FROM cases WHERE id = ?`
    )
    .bind(caseId)
    .first<Record<string, unknown>>();

  if (!caseRow) {
    return { ok: false as const, status: 404, error: "התיק לא נמצא." };
  }
  if (!allowAnyStatus && caseRow.status !== "מוכן לניתוח") {
    return { ok: false as const, status: 409, error: "התיק אינו מוכן לניתוח." };
  }

  const bucket = getFilesBucket();
  if (!bucket) {
    return { ok: false as const, status: 503, error: "אחסון המסמכים אינו זמין כרגע." };
  }

  const documentsResult = await db.$client
    .prepare(
      `SELECT id, file_key AS fileKey, filename, content_type AS contentType, size, uploaded_at AS uploadedAt,
      document_type AS documentType, source, collected_at AS collectedAt
      FROM documents WHERE case_id = ? ORDER BY uploaded_at`
    )
    .bind(caseId)
    .all<{
      id: string;
      fileKey: string;
      filename: string;
      contentType: string;
      size: number;
      uploadedAt: string;
      documentType: string | null;
      source: string | null;
      collectedAt: string | null;
    }>();

  const documents = documentsResult.results ?? [];
  if (!documents.length) {
    return { ok: false as const, status: 409, error: "העלו לפחות מסמך אחד לפני הפעלת הניתוח." };
  }
  if (documents.length > 12 || documents.some((d) => !supportedTypes.has(d.contentType))) {
    return { ok: false as const, status: 413, error: "אפשר לנתח עד 12 מסמכי PDF או תמונה נתמכים בכל הרצה." };
  }
  const totalBytes = documents.reduce((sum, d) => sum + d.size, 0);
  if (totalBytes > maxAnalysisBytes) {
    return { ok: false as const, status: 413, error: "גודל המסמכים לניתוח חורג מ־12MB." };
  }

  let intakePayload: Record<string, unknown> = {};
  if (typeof caseRow.intakePayload === "string") {
    try {
      const parsed = JSON.parse(caseRow.intakePayload) as Record<string, unknown>;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) intakePayload = parsed;
    } catch {
      /* ignore malformed */
    }
  }
  const intakeDeal =
    intakePayload.deal && typeof intakePayload.deal === "object" && !Array.isArray(intakePayload.deal)
      ? (intakePayload.deal as Record<string, unknown>)
      : {};
  const intakeLocation =
    intakePayload.location && typeof intakePayload.location === "object" && !Array.isArray(intakePayload.location)
      ? (intakePayload.location as Record<string, unknown>)
      : {};

  const documentMetadata = documents.map((document) => ({
    filename: document.filename,
    documentType: document.documentType ?? (document.fileKey.includes("/staff/") ? "מסמך לקוח" : "נסח טאבו / אישור זכויות"),
    source: document.source ?? "הועלה על ידי הלקוח",
    collectedAt: document.collectedAt ?? document.uploadedAt,
  }));

  const caseData = {
    caseNumber: caseRow.caseNumber,
    property: {
      type: caseRow.assetType,
      city: caseRow.city,
      street: caseRow.street,
      houseNumber: caseRow.house,
      block: caseRow.block,
      parcel: caseRow.parcel,
      subParcel: caseRow.subParcel,
      condition: caseRow.condition,
      price: caseRow.price,
      area: caseRow.area,
      rooms: caseRow.rooms,
      floor: caseRow.floor,
      monthlyRent: caseRow.monthlyRent,
      sellerName: caseRow.sellerName,
      amenities: caseRow.amenities,
    },
    deal: {
      dealType: intakeDeal.dealType,
      purpose: intakeDeal.purpose,
      askingPrice: intakeDeal.askingPrice,
      propertyArea: intakeDeal.propertyArea,
      roomsCount: intakeDeal.roomsCount,
      floorNumber: intakeDeal.floorNumber,
      sellerNames: Array.isArray(intakeDeal.sellerNames) ? intakeDeal.sellerNames : [],
    },
    intake: { location: intakeLocation, deal: intakeDeal },
    documents: documentMetadata,
    safeDealRiskModel,
  };

  const loadedFiles: Array<{ filename: string; contentType: string; bytes: ArrayBuffer; documentType: string }> = [];
  for (const document of documents) {
    const stored = await bucket.get(document.fileKey);
    if (!stored) continue;
    const bytes = await new Response(stored.body).arrayBuffer();
    loadedFiles.push({
      filename: document.filename,
      contentType: document.contentType,
      bytes,
      documentType: document.documentType ?? "מסמך",
    });
  }
  if (!loadedFiles.length) {
    return { ok: false as const, status: 503, error: "קבצי המסמכים אינם זמינים באחסון." };
  }

  let analysis: AnalysisResponsePayload | null = null;
  const apiBase = process.env.SAFEDEAL_AI_API_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.SAFEDEAL_INTERNAL_API_KEY;

  if (apiBase && apiKey) {
    const form = new FormData();
    form.set("caseData", JSON.stringify(caseData));
    for (const f of loadedFiles) {
      form.append("files", new File([f.bytes], f.filename, { type: f.contentType }), f.filename);
    }
    try {
      const response = await fetch(`${apiBase}/api/v1/properties/staff/analyze-documents`, {
        method: "POST",
        headers: { "x-safedeal-internal-key": apiKey },
        body: form,
        signal: AbortSignal.timeout(90_000),
      });
      if (response.ok) {
        analysis = (await response.json().catch(() => null)) as AnalysisResponsePayload | null;
      }
    } catch {
      analysis = null;
    }
  }

  let geminiReason: string | undefined;
  if (!analysis || !Array.isArray(analysis.findings)) {
    const geminiRes = await analyzeWithGeminiDirect({ caseData, loadedFiles });
    analysis = geminiRes.payload;
    geminiReason = geminiRes.reason;
  }

  if (!analysis || !Array.isArray(analysis.findings)) {
    analysis = analyzeWithBuiltInPdfParser(loadedFiles);
  }

  if (!analysis || !Array.isArray(analysis.findings)) {
    return {
      ok: false as const,
      status: 503,
      error:
        geminiReason === "no_gemini_key"
          ? "לא הוגדר מפתח GEMINI_API_KEY ב-Vercel (נדרש לקריאת תמונות/סריקות או PDF מוצפן). הוסיפו GEMINI_API_KEY בהגדרות הפרויקט ב-Vercel."
          : "מנוע הניתוח האוטומטי לא הצליח לקרוא את הקובץ כרגע. בדקו שמפתח GEMINI_API_KEY תקין ב-Vercel.",
    };
  }

  const createdAt = new Date().toISOString();
  const summary = asText(analysis.summary, 2500);
  const findings = (analysis.findings as AnalysisFinding[])
    .slice(0, 50)
    .filter((item) => asText(item.title, 180) && asText(item.note, 3000));
  const riskAssessment =
    analysis.riskAssessment && typeof analysis.riskAssessment === "object" && !Array.isArray(analysis.riskAssessment)
      ? (analysis.riskAssessment as Record<string, unknown>)
      : null;

  if (summary) {
    const assessmentText = riskAssessment
      ? `ציון משוקלל: ${typeof riskAssessment.score === "number" ? riskAssessment.score : "לא חושב"} · Coverage: ${typeof riskAssessment.coverage === "number" ? riskAssessment.coverage : "לא דווח"} · Override: ${asText(riskAssessment.override, 80) || "לא דווח"}`
      : "";
    const completenessWarning = riskAssessment ? asText(riskAssessment.modelCompletenessWarning, 500) : "";
    const modelSummary = [summary, assessmentText, completenessWarning ? `מגבלת מודל: ${completenessWarning}` : ""]
      .filter(Boolean)
      .join("\n\n");
    findings.push({
      category: "סיכום מודל SafeDeal",
      title: "סיכום ניתוח וסיכון",
      note: modelSummary,
      severity: "בינונית",
      source: "מודל SafeDeal 2026-10-12 · מסמכי התיק",
      confidence: 60,
    });
  }

  const statements = findings.map((item) => {
    const title = asText(item.title, 180);
    const category = asText(item.category, 100) || "בדיקת מסמכים";
    const source = asText(item.source, 240) || "ניתוח AI של מסמכי התיק";
    const severity = ["גבוהה", "בינונית", "נמוכה"].includes(String(item.severity)) ? String(item.severity) : "בינונית";
    const evidence = asText(item.evidence, 1200);
    const recommendation = asText(item.recommendation, 1200);
    const note = [
      asText(item.note, 3000),
      evidence && `ראיה מהמסמך: ${evidence}`,
      recommendation && `להמשך בדיקה: ${recommendation}`,
    ]
      .filter(Boolean)
      .join("\n\n");
    const confidence =
      typeof item.confidence === "number" && Number.isFinite(item.confidence)
        ? Math.max(0, Math.min(100, Math.round(item.confidence)))
        : null;
    return db.$client
      .prepare(
        `INSERT INTO findings (id, case_id, category, title, note, severity, source, confidence, state, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'לבדיקה', ?)`
      )
      .bind(crypto.randomUUID(), caseId, category, title, note, severity, `ניתוח AI: ${source}`.slice(0, 240), confidence, createdAt);
  });

  const missingInformation = Array.isArray(analysis.missingInformation)
    ? analysis.missingInformation.filter((item): item is string => typeof item === "string").slice(0, 20).map((item) => item.slice(0, 200))
    : [];
  const activityText = [
    `קריאת מסמכים אוטומטית הסתיימה ונוצרו ${findings.length} ממצאים לפי אלגוריתם SafeDeal.`,
    summary,
    missingInformation.length ? `מידע נוסף שנדרש: ${missingInformation.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 5000);

  statements.unshift(
    db.$client
      .prepare(
        `UPDATE findings SET state = 'הוחלף', review_note = ?, reviewed_by = ?, reviewed_at = ? WHERE case_id = ? AND source LIKE 'ניתוח AI:%' AND state != 'הוחלף'`
      )
      .bind("הוחלף בקריאת מסמכים חדשה.", staff.displayName, createdAt, caseId)
  );
  statements.push(
    db.$client.prepare(`UPDATE cases SET status = 'בבדיקת אנליסט', updated_at = ? WHERE id = ?`).bind(createdAt, caseId)
  );
  statements.push(
    db.$client
      .prepare(`INSERT INTO activity (id, case_id, actor_user_id, actor_name, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), caseId, staff.userId, staff.displayName, "ניתוח מסמכים אוטומטי", activityText, createdAt)
  );

  await db.$client.batch(statements);

  return {
    ok: true as const,
    findingsCreated: findings.length,
    summary,
    missingInformation,
    riskAssessment,
  };
}
