import { inflateSync } from "node:zlib";

export type BuiltInAnalysisPayload = {
  summary: string;
  missingInformation: string[];
  riskAssessment: {
    score: number | null;
    coverage: number;
    override: "NONE" | "STOP" | "HOLD";
    modelCompletenessWarning: string;
  };
  findings: Array<{
    category: string;
    title: string;
    note: string;
    severity: "גבוהה" | "בינונית" | "נמוכה";
    source: string;
    evidence?: string;
    recommendation?: string;
    confidence: number;
  }>;
};

export function extractTextFromPdfBuffer(bytes: ArrayBuffer): string {
  const buf = Buffer.from(bytes);
  const chunks: string[] = [];
  const rawLatin = buf.toString("latin1");

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(rawLatin)) !== null) {
    const streamSlice = Buffer.from(match[1], "latin1");
    let decoded: Buffer = streamSlice;
    try {
      decoded = inflateSync(streamSlice);
    } catch {
      /* Not compressed with FlateDecode — inspect raw stream */
    }
    const text = decoded.toString("utf8");
    const litMatches = text.match(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g);
    if (litMatches) {
      for (const m of litMatches) {
        const inner = m.slice(1, -1).replace(/\\([()\\])/g, "$1");
        if (/[א-תA-Za-z0-9]/.test(inner)) chunks.push(inner);
      }
    }
    const hexMatches = text.match(/<([0-9A-Fa-f]{8,})>/g);
    if (hexMatches) {
      for (const h of hexMatches) {
        const hex = h.slice(1, -1);
        if (hex.length % 4 === 0) {
          let str = "";
          for (let i = 0; i < hex.length; i += 4) {
            const code = parseInt(hex.slice(i, i + 4), 16);
            if (code >= 0x20 && code !== 0xfeff) str += String.fromCharCode(code);
          }
          if (/[א-תA-Za-z0-9]/.test(str)) chunks.push(str);
        }
      }
    }
  }

  const utf8Direct = buf.toString("utf8").match(/[א-ת][א-ת0-9\s"׳״.,:/\-()]{4,}/g);
  if (utf8Direct) chunks.push(...utf8Direct);

  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

export function analyzeWithBuiltInPdfParser(
  loadedFiles: Array<{ filename: string; contentType: string; bytes: ArrayBuffer; documentType: string }>
): BuiltInAnalysisPayload | null {
  const findings: BuiltInAnalysisPayload["findings"] = [];
  let extractedAnyText = false;

  for (const file of loadedFiles) {
    if (file.contentType !== "application/pdf") continue;
    const text = extractTextFromPdfBuffer(file.bytes);
    if (!text || text.length < 10) continue;
    extractedAnyText = true;

    const docType = `${file.documentType} ${file.filename}`;
    const snippet = text.slice(0, 280);

    if (/משכונות|משכון|pledge/i.test(docType)) {
      const hasNegativePhrase = /לא נמצאו|אין משכונות|לא אותרו משכונות|לא רשומים משכונות|0 תוצאות|אין רישומים/.test(text);
      const hasActivePledge = !hasNegativePhrase && /משכון|שעבוד|נושה|חייב|מספר משכון|בטוחה/.test(text);
      if (hasActivePledge) {
        findings.push({
          category: "רשם המשכונות",
          title: "[עובדה מתועדת] אותרו אינדיקציות למשכון/שעבוד בדוח רשם המשכונות",
          note: "בקריאת דוח רשם המשכונות שהועלה אותרו מונחי משכון/שעבוד פעיל. יש לאמת זיקה לנכס ולדרוש מכתב החרגה או סילוק.",
          severity: "גבוהה",
          source: `${file.filename} (קריאת PDF אוטומטית)`,
          evidence: snippet,
          recommendation: "אימות מספר משכון, זהות החייב/הנושה והמצאת אישור סילוק/החרגה.",
          confidence: 75,
        });
      } else {
        findings.push({
          category: "רשם המשכונות",
          title: "[עובדה מתועדת] דוח רשם המשכונות נקרא — לא אותרו משכונות פעילים",
          note: "המערכת קראה את דוח רשם המשכונות שהועלה ולא איתרה רישומי משכון או שעבוד פעילים.",
          severity: "נמוכה",
          source: `${file.filename} (קריאת PDF אוטומטית)`,
          evidence: snippet,
          recommendation: "בדיקה נקייה — לשמור בתיק ולבצע בדיקה חוזרת סמוך לחתימה.",
          confidence: 80,
        });
      }
    } else if (/חדלות|insolvency/i.test(docType)) {
      const hasClean = /לא נמצאו|לא אותר|אין תיקים|אין הליכים/.test(text);
      const hasActive = !hasClean && /חדלות פירעון|פשיטת רגל|צו פתיחת הליכים|נאמן/.test(text);
      findings.push({
        category: "חדלות פירעון",
        title: hasActive ? "[עובדה מתועדת] אותרו אינדיקציות להליך חדלות פירעון" : "[עובדה מתועדת] לא אותר הליך חדלות פירעון בדוח שהועלה",
        note: hasActive ? "בדוח שהועלה אותרו מונחי חדלות פירעון/צו פתיחת הליכים." : "המסמך נקרא ולא אותרו הליכי חדלות פירעון.",
        severity: hasActive ? "גבוהה" : "נמוכה",
        source: `${file.filename} (קריאת PDF אוטומטית)`,
        evidence: snippet,
        confidence: 75,
      });
    } else if (/מתדיינים|משפטי|נבו|נט המשפט|legal/i.test(docType)) {
      const hasClean = /לא נמצאו|אין תיקים|אין הליכים/.test(text);
      const hasLegal = !hasClean && /תביעה|פסק דין|תיק אזרחי|הליך|נתבע|תובע/.test(text);
      findings.push({
        category: "רקע משפטי",
        title: hasLegal ? "[דורש אימות אנושי] אותרו אזכורי הליכים משפטיים במסמך" : "[עובדה מתועדת] הבדיקה המשפטית נקראה — לא אותרו הליכים",
        note: hasLegal ? "בדוח המשפטי שהועלה אותרו אזכורים של תביעה/הליך. יש לבחון רלוונטיות לעסקה." : "המסמך המשפטי נקרא ולא אותרו הליכים פתוחים.",
        severity: hasLegal ? "בינונית" : "נמוכה",
        source: `${file.filename} (קריאת PDF אוטומטית)`,
        evidence: snippet,
        confidence: 70,
      });
    } else if (/טאבו|tabu|זכויות/i.test(docType)) {
      const hasAlert = /עיקול|צו מניעה|הפקעה/.test(text);
      findings.push({
        category: "זכויות ורישום",
        title: hasAlert ? "[עובדה מתועדת] אותרו הערות/עיקולים בנסח הטאבו" : "[עובדה מתועדת] נסח הטאבו נקרא ואומת בתיק",
        note: hasAlert ? "בקריאת נסח הטאבו אותרו מונחי עיקול/צו מניעה/הפקעה — נדרשת בחינה דחופה." : "נסח הטאבו נקרא אוטומטית ללא אינדיקציות עיקול חריגות.",
        severity: hasAlert ? "גבוהה" : "נמוכה",
        source: `${file.filename} (קריאת PDF אוטומטית)`,
        evidence: snippet,
        confidence: 75,
      });
    }
  }

  if (!extractedAnyText || !findings.length) return null;

  return {
    summary: `הושלמה קריאת PDF אוטומטית של ${findings.length} מסמכים ושקלולם לפי אלגוריתם SafeDeal.`,
    missingInformation: [],
    riskAssessment: {
      score: null,
      coverage: 0,
      override: "NONE",
      modelCompletenessWarning: "הניתוח בוצע בקריאת טקסט PDF ישירה (ללא OCR תמונות).",
    },
    findings,
  };
}
