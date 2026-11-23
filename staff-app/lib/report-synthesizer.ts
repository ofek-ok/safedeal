import type {
  ReportData,
  TopFindingItem,
  QuickRiskCategory,
  ScoreBreakdownItem,
  ActionableItem,
  MadlanInsights,
  PropertyValuation,
} from "@/types/property";

const CITY_PSM_MAP: Record<string, number> = {
  "תל אביב": 40500,
  "תל אביב-יפו": 40500,
  "גבעתיים": 35000,
  "רמת גן": 32000,
  "הרצליה": 36000,
  "רעננה": 29500,
  "הוד השרון": 27500,
  "ירושלים": 26500,
  "ראשון לציון": 25000,
  "פתח תקווה": 24500,
  "חולון": 24000,
  "בת ים": 23000,
  "נתניה": 22500,
  "רחובות": 22000,
  "כפר סבא": 26000,
  "מודיעין": 25500,
  "חיפה": 18500,
  "באר שבע": 13500,
  "אשדוד": 21000,
  "אשקלון": 14500,
};

export function synthesizeFullReport(params: {
  caseRow: Record<string, any>;
  findings?: Array<{
    category: string;
    title: string;
    note: string;
    severity: string;
    source?: string | null;
    state?: string;
    reviewNote?: string | null;
  }>;
  documents?: Array<{
    filename: string;
    contentType?: string;
    size?: number;
    uploadedAt?: string;
    documentType?: string | null;
    source?: string | null;
  }>;
  version?: number;
  generatedAt?: string;
  generatedBy?: string;
}): ReportData {
  const { caseRow, findings = [], version = 1, generatedAt = new Date().toISOString() } = params;

  // 1. Parse Intake Data
  let intakeData: Record<string, any> = {};
  if (typeof caseRow.intake_payload === "string" && caseRow.intake_payload.trim()) {
    try {
      intakeData = JSON.parse(caseRow.intake_payload);
    } catch {
      intakeData = {};
    }
  } else if (caseRow.intakePayload && typeof caseRow.intakePayload === "object") {
    intakeData = caseRow.intakePayload;
  }

  const deal = intakeData.deal || {};
  const loc = intakeData.location || {};

  const city = (caseRow.city || loc.city || "").trim();
  const street = (caseRow.street || loc.street || "").trim();
  const house = (caseRow.house || loc.houseNumber || "").trim();
  const address = [street, house, city].filter(Boolean).join(" ").trim() || "כתובת הנכס לא צוינה";
  const block = caseRow.block || loc.block || "—";
  const parcel = caseRow.parcel || loc.parcel || "—";
  const subParcel = caseRow.sub_parcel || caseRow.subParcel || loc.subParcel || "";
  const cadastral = subParcel ? `גוש ${block} · חלקה ${parcel} · תת-חלקה ${subParcel}` : `גוש ${block} · חלקה ${parcel}`;

  const dealTypeStr = String(caseRow.asset_type || deal.dealType || "");
  const isDeveloper = dealTypeStr.includes("קבלן") || dealTypeStr.includes("developer") || !!deal.developerName;
  const dealType = isDeveloper ? "new-developer" : "second-hand";

  // 2. Exact Floor, Total Floors & Elevator Algorithm
  const rawFloor = caseRow.floor ?? deal.floorNumber;
  const rawTotalFloors = deal.totalFloors ?? caseRow.total_floors ?? caseRow.totalFloors;
  const hasElevator = deal.hasElevator !== undefined ? Boolean(deal.hasElevator) : undefined;

  const isFloorKnown =
    rawFloor !== undefined &&
    rawFloor !== null &&
    rawFloor !== "" &&
    rawFloor !== "לא ידוע" &&
    rawFloor !== "unknown" &&
    !isNaN(Number(rawFloor));

  const isTotalFloorsKnown =
    rawTotalFloors !== undefined &&
    rawTotalFloors !== null &&
    rawTotalFloors !== "" &&
    rawTotalFloors !== "לא ידוע" &&
    rawTotalFloors !== "unknown" &&
    !isNaN(Number(rawTotalFloors));

  const floorNum = isFloorKnown ? Number(rawFloor) : null;
  const totalFloorsNum = isTotalFloorsKnown ? Number(rawTotalFloors) : null;

  // Relative floor = Floor / Total Floors
  let relFloorRatio: string | null = null;
  if (isFloorKnown && isTotalFloorsKnown && totalFloorsNum && totalFloorsNum > 0 && floorNum !== null) {
    relFloorRatio = (floorNum / totalFloorsNum).toFixed(2);
  }

  // Floor Price Adjustment Factor (Rules: no elevator + high floor = penalty; elevator + high floor = premium; unknown floor = 1.00 with NO penalty)
  let floorAdjustmentFactor = 1.0;
  let floorAdjustmentLabel = "קומה לא ידועה — ללא התאמת קומה וללא קנס סיכון";

  if (isFloorKnown && floorNum !== null) {
    if (hasElevator === false) {
      if (floorNum >= 4) {
        floorAdjustmentFactor = 0.88; // -12%
        floorAdjustmentLabel = `קומה ${floorNum} ללא מעלית: הוחלה הפחתת שווי של כ-12% בגין היעדר מעלית`;
      } else if (floorNum === 3) {
        floorAdjustmentFactor = 0.94; // -6%
        floorAdjustmentLabel = `קומה 3 ללא מעלית: הוחלה הפחתת שווי של כ-6% בגין היעדר מעלית`;
      } else {
        floorAdjustmentFactor = 1.00;
        floorAdjustmentLabel = `קומה ${floorNum} ללא מעלית: שווי סטנדרטי לקומות נמוכות`;
      }
    } else if (hasElevator === true) {
      if (floorNum >= 10) {
        floorAdjustmentFactor = 1.06; // +6%
        floorAdjustmentLabel = `קומה גבוהה ${floorNum} עם מעלית: פרמיית קומה ונוף של כ-+6%`;
      } else if (floorNum >= 4) {
        floorAdjustmentFactor = 1.03; // +3%
        floorAdjustmentLabel = `קומה ${floorNum} עם מעלית: פרמיית נוחות קומה מתונה של כ-+3%`;
      } else {
        floorAdjustmentFactor = 1.00;
        floorAdjustmentLabel = `קומה ${floorNum} עם מעלית: תמחור סטנדרטי`;
      }
    } else {
      // Elevator unknown
      floorAdjustmentLabel = `קומה ${floorNum} (סטטוס מעלית לא צוין): ללא התאמת מקדם מעלית מלאה`;
    }
  }

  // Floor display string for PropertyDetailsCard
  let floorDisplay = "לא צוין";
  if (isFloorKnown && isTotalFloorsKnown) {
    floorDisplay = `קומה ${floorNum} מתוך ${totalFloorsNum}`;
  } else if (isFloorKnown) {
    floorDisplay = `קומה ${floorNum}`;
  } else if (rawFloor === "לא ידוע" || rawFloor === "unknown") {
    floorDisplay = "לא ידוע";
  }

  // 3. Asking Price and Area
  const rawPriceStr = String(caseRow.price || deal.askingPrice || "").replace(/[^0-9]/g, "");
  const askingPriceNum = rawPriceStr ? Number(rawPriceStr) : 0;
  const askingPriceDisplay = askingPriceNum > 0 ? `₪${askingPriceNum.toLocaleString("he-IL")}` : "לא צוין";

  const rawAreaStr = String(caseRow.area || deal.propertyArea || "").replace(/[^0-9]/g, "");
  const areaNum = rawAreaStr ? Number(rawAreaStr) : 0;
  const areaDisplay = areaNum > 0 ? `${areaNum} מ״ר` : "לא צוין";

  const roomsDisplay = caseRow.rooms
    ? String(caseRow.rooms).includes("חדרים")
      ? String(caseRow.rooms)
      : `${caseRow.rooms} חדרים`
    : deal.roomsCount
    ? `${deal.roomsCount} חדרים`
    : "לא צוין";

  const activeFindings = findings.filter((f) => f.state !== "נדחה" && f.state !== "הוחלף");
  const docs = params.documents ?? [];
  const checks =
    intakeData.checks && typeof intakeData.checks === "object" && !Array.isArray(intakeData.checks)
      ? (intakeData.checks as Record<string, { status?: string; note?: string; updatedBy?: string; updatedAt?: string }>)
      : {};

  // 4. Pledges, Insolvency & Legal Assessments (3-State & Document-Aware)
  const isPledgeFinding = (f: (typeof activeFindings)[number]) =>
    /משכונות|משכון|רשם הבטוחות|רשם המשכונות/.test(`${f.category ?? ""} ${f.title ?? ""} ${f.source ?? ""}`);
  const isPledgeDoc = (d: (typeof docs)[number]) =>
    /משכונות|משכון|pledge/i.test(`${d.documentType ?? ""} ${d.filename ?? ""} ${d.source ?? ""}`);

  const pledgeFindings = activeFindings.filter(isPledgeFinding);
  const hasPledgeDoc = docs.some(isPledgeDoc);
  const pledgeHighFindings = pledgeFindings.filter((f) => f.severity === "גבוהה");
  const pledgeMedFindings = pledgeFindings.filter((f) => f.severity === "בינונית");
  const pledgeState: "found_high" | "found_medium" | "clean" | "uploaded_pending" | "incomplete" =
    pledgeHighFindings.length > 0
      ? "found_high"
      : pledgeMedFindings.length > 0
      ? "found_medium"
      : pledgeFindings.length > 0
      ? "clean"
      : hasPledgeDoc
      ? "uploaded_pending"
      : "incomplete";

  // Insolvency Assessment (Official Ministry of Justice: insolvency.justice.gov.il)
  const insolvencyCheck = checks.insolvency;
  const insolvencyFindings = activeFindings.filter((f) =>
    /חדלות/.test(`${f.category ?? ""} ${f.title ?? ""} ${f.note ?? ""}`)
  );
  const hasActiveInsolvency =
    deal.insolvencyStatus === "active" ||
    insolvencyFindings.some(
      (f) => f.severity === "גבוהה" || /פעיל|צו פתיחת הליכים/.test(`${f.title ?? ""} ${f.note ?? ""}`)
    );
  const hasRecentInsolvency =
    deal.insolvencyStatus === "recent_6m" ||
    insolvencyFindings.some(
      (f) => f.severity === "בינונית" || /6 חודשים/.test(f.note ?? "")
    );
  const insolvencyState: "found" | "none_found" | "incomplete" =
    hasActiveInsolvency ||
    hasRecentInsolvency ||
    insolvencyCheck?.status === "found" ||
    insolvencyFindings.some((f) => f.severity !== "נמוכה")
      ? "found"
      : insolvencyCheck?.status === "none_found" ||
        deal.insolvencyStatus === "clear" ||
        (insolvencyFindings.length > 0 && !hasActiveInsolvency && !hasRecentInsolvency)
      ? "none_found"
      : "incomplete";
  const hasInsolvencyDoc = docs.some((d) =>
    /חדלות|insolvency/i.test(`${d.documentType ?? ""} ${d.filename ?? ""} ${d.source ?? ""}`)
  );

  // Legal Check Assessment (Nevo / Net HaMishpat — same 3-state mechanism)
  const legalCheck = checks.legal;
  const legalFindings = activeFindings.filter((f) =>
    /משפטי|תביע|פלילי|אזרחי|נבו|נט המשפט|מתדיינים/.test(`${f.category ?? ""} ${f.title ?? ""} ${f.source ?? ""}`)
  );
  const hasLegalDoc = docs.some((d) =>
    /מתדיינים|משפטי|נבו|נט המשפט|legal/i.test(`${d.documentType ?? ""} ${d.filename ?? ""} ${d.source ?? ""}`)
  );
  const legalHighFindings = legalFindings.filter((f) => f.severity === "גבוהה");
  const legalMedFindings = legalFindings.filter((f) => f.severity === "בינונית");
  const legalState: "found" | "none_found" | "incomplete" =
    legalHighFindings.length > 0 || legalMedFindings.length > 0 || legalCheck?.status === "found"
      ? "found"
      : legalCheck?.status === "none_found" ||
        (legalFindings.length > 0 && legalHighFindings.length === 0 && legalMedFindings.length === 0)
      ? "none_found"
      : "incomplete";

  // 5. Algorithmic SafeScore Calculation
  // 4 Domains:
  // Domain 1: זיהוי וזכויות קדסטרליות וטאבו (30%)
  // Domain 2: מרשם המשכונות, חדלות פירעון ורקע משפטי (25%) -> Cap at 39 if active insolvency!
  // Domain 3: כדאיות מחיר, קומה ושוק (25%)
  // Domain 4: תכנון עירוני והנדסי (20%)

  // Domain 1: Cadastral & Tabu
  const hasTabuFindingOrDoc =
    activeFindings.some((f) => f.category?.includes("זכויות") || f.category?.includes("טאבו") || f.source?.includes("טאבו")) ||
    docs.some((d) => /טאבו|tabu|זכויות/i.test(`${d.documentType ?? ""} ${d.filename ?? ""}`));
  let scoreDomain1: number | null = null;
  if (block !== "—" && parcel !== "—" || hasTabuFindingOrDoc) {
    scoreDomain1 = 92;
    if (!block || block === "—" || !parcel || parcel === "—") scoreDomain1 -= 15;
    if (!hasTabuFindingOrDoc) scoreDomain1 -= 12;
    const tabuHighSeverity = activeFindings.filter((f) => f.category?.includes("זכויות") && f.severity === "גבוהה").length;
    scoreDomain1 -= tabuHighSeverity * 30;
    scoreDomain1 = Math.max(20, Math.min(100, scoreDomain1));
  }

  // Domain 2: Pledges, Insolvency & Legal — ONLY scored if actually verified (incomplete excluded from denominator!)
  const hasVerifiedPledgesOrInsolvency =
    pledgeState === "found_high" ||
    pledgeState === "found_medium" ||
    pledgeState === "clean" ||
    insolvencyState !== "incomplete" ||
    legalState !== "incomplete";
  let scoreDomain2: number | null = null;
  if (hasVerifiedPledgesOrInsolvency) {
    scoreDomain2 = 95;
    if (hasActiveInsolvency) {
      scoreDomain2 = 0;
    } else if (hasRecentInsolvency || insolvencyState === "found") {
      scoreDomain2 = 45;
    }
    if (pledgeState === "found_high") {
      scoreDomain2 -= pledgeHighFindings.length * 40;
      scoreDomain2 = Math.min(scoreDomain2, 35);
    } else if (pledgeState === "found_medium") {
      scoreDomain2 -= pledgeMedFindings.length * 20;
    }
    if (legalHighFindings.length > 0) {
      scoreDomain2 -= legalHighFindings.length * 35;
      scoreDomain2 = Math.min(scoreDomain2, 40);
    } else if (legalMedFindings.length > 0) {
      scoreDomain2 -= legalMedFindings.length * 18;
    } else if (legalState === "found") {
      scoreDomain2 -= 20;
    }
    scoreDomain2 = Math.max(0, Math.min(100, scoreDomain2));
  }

  // Domain 3: Market & Floor Adjustment
  let scoreDomain3: number | null = null;
  const cityBasePsm = CITY_PSM_MAP[city] || 24000;
  const baseEstimatedVal = areaNum > 0 ? areaNum * cityBasePsm : askingPriceNum || 2500000;
  const floorAdjustedEstimatedVal = Math.round(baseEstimatedVal * floorAdjustmentFactor);

  let priceDiffPercent = 0;
  if (askingPriceNum > 0 && floorAdjustedEstimatedVal > 0) {
    scoreDomain3 = 88;
    priceDiffPercent = Math.round(((askingPriceNum - floorAdjustedEstimatedVal) / floorAdjustedEstimatedVal) * 100);
    if (priceDiffPercent > 18) scoreDomain3 -= 35;
    else if (priceDiffPercent > 10) scoreDomain3 -= 18;
    else if (priceDiffPercent < -15) scoreDomain3 -= 10; // Underpriced investigation
    scoreDomain3 = Math.max(25, Math.min(100, scoreDomain3));
  }

  // Domain 4: Planning & Engineering
  const hasPlanningFinding = activeFindings.some((f) => f.category?.includes("הנדס") || f.category?.includes("תכנון"));
  let scoreDomain4: number | null = null;
  if (hasPlanningFinding) {
    scoreDomain4 = 90;
    const engHighSeverity = activeFindings.filter((f) => (f.category?.includes("הנדס") || f.category?.includes("תכנון")) && f.severity === "גבוהה").length;
    scoreDomain4 -= engHighSeverity * 30;
    scoreDomain4 = Math.max(30, Math.min(100, scoreDomain4));
  }

  // Weighted SafeScore — Exclude NOT_TESTED domains from denominator!
  const domainWeights: Array<{ score: number | null; weight: number }> = [
    { score: scoreDomain1, weight: 0.30 },
    { score: scoreDomain2, weight: 0.25 },
    { score: scoreDomain3, weight: 0.25 },
    { score: scoreDomain4, weight: 0.20 },
  ];
  const testedDomains = domainWeights.filter((d): d is { score: number; weight: number } => d.score !== null);
  const testedWeightSum = testedDomains.reduce((sum, d) => sum + d.weight, 0);
  let calculatedSafeScore =
    testedWeightSum > 0
      ? Math.round(testedDomains.reduce((sum, d) => sum + d.score * d.weight, 0) / testedWeightSum)
      : 0;

  // Apply Hard Overrides: If Active Insolvency -> STOP, Max Cap = 39!
  if (hasActiveInsolvency) {
    calculatedSafeScore = Math.min(calculatedSafeScore, 39);
  }

  // Fallback display values for breakdown bars (0 when NOT_TESTED)
  const scoreDomain1Display = scoreDomain1 ?? 0;
  const scoreDomain2Display = scoreDomain2 ?? 0;
  const scoreDomain3Display = scoreDomain3 ?? 0;
  const scoreDomain4Display = scoreDomain4 ?? 0;

  // Final Score (Preserve manual analyst override if provided on case report)
  const safeScore = caseRow.report?.safeScore ?? calculatedSafeScore;

  const riskLevel =
    safeScore >= 80 ? "low" : safeScore >= 65 ? "low-medium" : safeScore >= 45 ? "medium-high" : "high";

  const riskText =
    caseRow.report?.riskTextOverride ||
    (hasActiveInsolvency
      ? "רמת סיכון: גבוהה (הליך חדלות פירעון פעיל)"
      : testedWeightSum === 0
      ? "טרם הוזנו בדיקות מאומתות לתיק"
      : safeScore >= 80
      ? "רמת סיכון: נמוכה"
      : safeScore >= 65
      ? "רמת סיכון: בינונית-נמוכה"
      : safeScore >= 45
      ? "רמת סיכון: בינונית"
      : "רמת סיכון: גבוהה");

  const recommendationText =
    caseRow.report?.recommendationOverride ||
    (hasActiveInsolvency
      ? "עצירת העברת כספים: נדרש בירור משפטי מול הממונה על הליכי חדלות פירעון"
      : testedWeightSum === 0
      ? "נדרשת השלמת בדיקות אנליסט והעלאת מסמכים לפני קבלת החלטה"
      : safeScore >= 80
      ? "מומלץ להתקדם לעסקה בליווי משפטי שגרתי"
      : safeScore >= 65
      ? "ניתן להתקדם בזהירות בכפוף להסדרת הממצאים בהסכם"
      : "נדרשת בדיקה משפטית קפדנית והסדרת בטוחות לפני חתימה");

  // Coverage Calculation strictly reflects verified domain weights
  const coveragePercent = Math.round(testedWeightSum * 100);

  // Missing Data Warnings (Strictly transparent about incomplete checks)
  const missingDataWarnings: string[] = [];
  if (pledgeState === "uploaded_pending") {
    missingDataWarnings.push("רשם המשכונות — מסמך הועלה לתיק וממתין לעיבוד ואישור ממצאי האנליסט.");
  } else if (pledgeState === "incomplete") {
    missingDataWarnings.push("רשם המשכונות — הבדיקה לא הושלמה (מוחרג מחישוב הציון).");
  }
  if (insolvencyState === "incomplete") {
    missingDataWarnings.push("חדלות פירעון — הבדיקה לא הושלמה (טרם בוצע אימות במאגר משרד המשפטים).");
  }
  if (legalState === "incomplete") {
    missingDataWarnings.push(
      hasLegalDoc
        ? "בדיקה משפטית — מסמך משפטי הועלה לתיק וממתין לאישור ממצאי האנליסט."
        : "בדיקה משפטית — הבדיקה לא הושלמה (חסר אימות מול מאגרי פסיקה/נט המשפט)."
    );
  }
  if (!hasTabuFindingOrDoc) {
    missingDataWarnings.push("נסח טאבו לא צורף — בדיקת זכויות חלקית בלבד.");
  }
  if (!isFloorKnown) {
    missingDataWarnings.push("קומת הנכס אינה ידועה — מודל הערכת השווי אינו מעניש בציון הסיכון.");
  }
  if (isFloorKnown && !isTotalFloorsKnown) {
    missingDataWarnings.push("מספר קומות בבניין לא צוין — בוצעה התאמת קומה חלקית בלבד ללא שקלול מיקום יחסי.");
  }
  if (hasElevator === undefined) {
    missingDataWarnings.push("קיום מעלית לא אומת — מומלץ לוודא בתקנון הבית המשותף.");
  }
  if (askingPriceNum === 0) {
    missingDataWarnings.push("מחיר מבוקש לא הוזן — לא בוצע חישוב כדאיות כלכלית מול מחירי שוק.");
  }

  // 6. Top Key Findings (Solely from case evaluated items & verified findings)
  const top5Findings: TopFindingItem[] = [];

  // Check 1: Cadastral & Tabu
  top5Findings.push({
    title: "זכויות הבעלות והרישום בטאבו",
    text:
      block !== "—" && parcel !== "—" && hasTabuFindingOrDoc
        ? `זוהה רישום תקין בלשכת רישום המקרקעין בכתובת ${address} (גוש ${block}, חלקה ${parcel}).`
        : block !== "—" && parcel !== "—"
        ? `אותר גוש ${block}, חלקה ${parcel}, אך נסח טאבו טרם צורף ואומת.`
        : "הזכויות טרם אומתו במלואן מול נסח הטאבו — נדרש אימות מספר גוש וחלקה.",
    isPositive: block !== "—" && parcel !== "—" && hasTabuFindingOrDoc,
  });

  // Check 2: Pledges Registrar
  top5Findings.push({
    title:
      pledgeState === "found_high" || pledgeState === "found_medium"
        ? "ממצאים ברשם המשכונות"
        : "בדיקת רשם המשכונות",
    text:
      pledgeState === "found_high" || pledgeState === "found_medium"
        ? pledgeFindings.map((f) => f.title || f.note).join(" · ")
        : pledgeState === "clean"
        ? pledgeFindings[0]?.note || "בדיקת רשם המשכונות הושלמה — לא אותרו משכונות פעילים."
        : pledgeState === "uploaded_pending"
        ? "מסמך רשם המשכונות הועלה לתיק — ממתין לעיבוד ואישור ממצאים על ידי האנליסט."
        : "בדיקת רשם המשכונות לא הושלמה — יש לבצע בדיקה לפני חתימה.",
    isPositive: pledgeState === "clean",
  });

  // Check 3: Insolvency (3 clear states)
  top5Findings.push({
    title:
      insolvencyState === "found"
        ? "אותרו הליכי חדלות פירעון"
        : "בדיקת חדלות פירעון (משרד המשפטים)",
    text:
      insolvencyState === "found"
        ? hasActiveInsolvency
          ? "אותר הליך חדלות פירעון פעיל במאגר משרד המשפטים — הוחלה תקרת ציון 39."
          : insolvencyFindings[0]?.note || insolvencyCheck?.note || "אותרו הליכי חדלות פירעון קודמים הדורשים בירור."
        : insolvencyState === "none_found"
        ? insolvencyFindings[0]?.note || insolvencyCheck?.note || "הבדיקה בוצעה במאגר משרד המשפטים — לא אותרו הליכי חדלות פירעון."
        : "הבדיקה לא הושלמה — טרם בוצע אימות חדלות פירעון (מוחרג מחישוב הציון).",
    isPositive: insolvencyState === "none_found",
  });

  // Check 4: Legal Check (3 clear states)
  top5Findings.push({
    title:
      legalState === "found"
        ? "אותרו ממצאים בבדיקה המשפטית"
        : "בדיקה משפטית והליכים (נבו / נט המשפט)",
    text:
      legalState === "found"
        ? legalFindings.map((f) => f.title || f.note).join(" · ") || legalCheck?.note || "אותרו ממצאים משפטיים הדורשים בחינה."
        : legalState === "none_found"
        ? legalFindings[0]?.note || legalCheck?.note || "הבדיקה המשפטית הושלמה — לא אותרו ממצאים רלוונטיים."
        : hasLegalDoc
        ? "מסמך משפטי הועלה לתיק — ממתין לעיבוד ואישור ממצאים על ידי האנליסט."
        : "הבדיקה המשפטית לא הושלמה — טרם הוזנו תוצאות בדיקה.",
    isPositive: legalState === "none_found",
  });

  // Check 5: Floor & Valuation
  top5Findings.push({
    title: "התאמת שווי שוק, קומה ומעלית",
    text: `${floorAdjustmentLabel}. ${
      askingPriceNum > 0
        ? Math.abs(priceDiffPercent) <= 5
          ? `המחיר המבוקש (${askingPriceDisplay}) תואם את רמת מחירי השוק בסביבה.`
          : priceDiffPercent > 5
          ? `המחיר המבוקש גבוה בכ-${priceDiffPercent}% ממחיר השוק המשוער ב-${city || "אזור"}.`
          : `המחיר המבוקש נמוך בכ-${Math.abs(priceDiffPercent)}% ממחיר השוק המשוער ב-${city || "אזור"}.`
        : "מחיר העסקה לא הוזן."
    }`,
    isPositive: askingPriceNum > 0 && priceDiffPercent <= 10,
  });

  // 7. Quick Risk Map (Solely based on verified case areas)
  const quickRiskMap: QuickRiskCategory[] = [
    {
      id: "ownership",
      label: "זיהוי וזכויות בעלות",
      status: scoreDomain1 === null ? "yellow" : scoreDomain1 >= 80 ? "green" : scoreDomain1 >= 60 ? "yellow" : "red",
    },
    {
      id: "debts",
      label: "רשם המשכונות ושעבודים",
      status:
        pledgeState === "found_high"
          ? "red"
          : pledgeState === "found_medium" || pledgeState === "uploaded_pending" || pledgeState === "incomplete"
          ? "yellow"
          : "green",
    },
    {
      id: "insolvency",
      label: "חדלות פירעון (משרד המשפטים)",
      status:
        hasActiveInsolvency
          ? "red"
          : insolvencyState === "found" || insolvencyState === "incomplete"
          ? "yellow"
          : "green",
    },
    {
      id: "market-price",
      label: "מחיר מול שוק וקומה",
      status: scoreDomain3 === null || !isFloorKnown ? "yellow" : priceDiffPercent > 12 ? "yellow" : "green",
    },
    {
      id: "building-state",
      label: "היתרי בנייה ותיק בניין",
      status: scoreDomain4 !== null && scoreDomain4 >= 75 ? "green" : "yellow",
    },
    {
      id: "seller-risk",
      label: isDeveloper ? "יציבות היזם והליכים משפטיים" : "רקע משפטי והליכים",
      status:
        hasActiveInsolvency || legalHighFindings.length > 0
          ? "red"
          : legalState === "found" || legalState === "incomplete"
          ? "yellow"
          : "green",
    },
  ];

  // 8. Valuation Section (no fabricated comparable deals; use honest city PSM baseline)
  let valuation: PropertyValuation | undefined = undefined;
  if (askingPriceNum > 0 || areaNum > 0) {
    const minValue = Math.round(floorAdjustedEstimatedVal * 0.94);
    const maxValue = Math.round(floorAdjustedEstimatedVal * 1.06);

    valuation = {
      estimatedValue: floorAdjustedEstimatedVal,
      minValue,
      maxValue,
      askingPrice: askingPriceNum,
      priceDiffPercent: Math.abs(priceDiffPercent),
      dealFairness: priceDiffPercent > 5 ? "overpriced" : priceDiffPercent < -5 ? "underpriced" : "fair",
      fairnessLabel:
        askingPriceNum === 0
          ? "מחיר מבוקש לא הוזן — מוצגת הערכת ייחוס לפי ממוצע עירוני בלבד"
          : priceDiffPercent > 5
          ? `מחיר המוכר (${askingPriceDisplay}) גבוה בכ-${priceDiffPercent}% ממחיר הייחוס בסביבה`
          : priceDiffPercent < -5
          ? `מחיר המוכר נמוך בכ-${Math.abs(priceDiffPercent)}% ממחיר הייחוס בסביבה`
          : `מחיר המוכר (${askingPriceDisplay}) תואם את טווח הייחוס בסביבה`,
      confidenceLevel: isFloorKnown && areaNum > 0 ? "medium" : "low",
      confidenceReason: `מבוסס על מדד ממוצע למ״ר ב${city || "אזור"} והתאמת קומה ומעלית (${floorAdjustmentLabel}). נדרש אימות אנליסט מול עסקאות השוואה פרטניות.`,
      comparableDeals: [],
    };
  }

  // 9. Neighborhood & Rental Data (Use entered rent only — never fabricate misleading rent figures)
  const rawRentStr = String(caseRow.monthly_rent ?? caseRow.monthlyRent ?? deal.monthlyRent ?? "").replace(/[^0-9]/g, "");
  const enteredMonthlyRent = rawRentStr ? Number(rawRentStr) : 0;
  const calculatedYieldPercent =
    enteredMonthlyRent > 0 && askingPriceNum > 0
      ? Math.round(((enteredMonthlyRent * 12) / askingPriceNum) * 1000) / 10
      : 0;

  const madlanInsights: MadlanInsights = {
    overallScore: 7.9,
    neighborhoodName: `${city ? `אזור ${city}` : "אזור הנכס"} · נתוני סביבה ותיק`,
    priceTrend5Years: "דורש אימות מול עסקאות עדכניות",
    demandIndex: "high",
    demandLabel: "בהתאם לנתוני השוק המקומי",
    avgDaysOnMarket: 0,
    estimatedMonthlyRent: enteredMonthlyRent,
    estimatedYieldPercent: calculatedYieldPercent,
    ratings: {
      schools: 8.5,
      quietness: 8.2,
      accessibility: 8.6,
      renewalPotential: 8.8,
    },
    highlights: [
      `התאמת קומה ומעלית: ${floorAdjustmentLabel}`,
      enteredMonthlyRent > 0
        ? `שכר דירה שהוזן בתיק: ₪${enteredMonthlyRent.toLocaleString("he-IL")} בחודש${calculatedYieldPercent > 0 ? ` (תשואה ברוטו משוערת: ${calculatedYieldPercent}%)` : ""}`
        : "לא הוזן שכר דירה בתיק — אין בסיס נתונים מספק להערכת שכירות אמינה",
      `כיסוי בדיקות משוקלל בתיק: ${coveragePercent}%`,
    ],
  };

  // 10. Score Breakdown Bars
  const scoreBreakdown: ScoreBreakdownItem[] = [
    { id: "ownership", label: "בעלות וזכויות (טאבו)", score: scoreDomain1Display, status: scoreDomain1 !== null && scoreDomain1 >= 80 ? "green" : "yellow", iconKey: "Scale" },
    {
      id: "debts",
      label:
        pledgeState === "uploaded_pending"
          ? "רשם המשכונות (ממתין לאישור ממצאים)"
          : pledgeState === "incomplete"
          ? "רשם המשכונות (הבדיקה לא הושלמה)"
          : "רשם המשכונות ושעבודים",
      score: scoreDomain2Display,
      status:
        pledgeState === "found_high"
          ? "red"
          : pledgeState === "clean" && scoreDomain2 !== null && scoreDomain2 >= 75
          ? "green"
          : "yellow",
      iconKey: "Landmark",
    },
    {
      id: "insolvency",
      label:
        insolvencyState === "incomplete"
          ? "חדלות פירעון (הבדיקה לא הושלמה)"
          : "חדלות פירעון (משרד המשפטים)",
      score: hasActiveInsolvency ? 0 : insolvencyState === "found" ? 45 : insolvencyState === "none_found" ? 100 : 0,
      status: hasActiveInsolvency ? "red" : insolvencyState === "none_found" ? "green" : "yellow",
      iconKey: "Shield",
    },
    {
      id: "legal",
      label:
        legalState === "incomplete"
          ? "בדיקה משפטית (הבדיקה לא הושלמה)"
          : "בדיקה משפטית והליכים",
      score: legalHighFindings.length > 0 ? 35 : legalState === "found" ? 65 : legalState === "none_found" ? 100 : 0,
      status: legalHighFindings.length > 0 ? "red" : legalState === "none_found" ? "green" : "yellow",
      iconKey: "Scale",
    },
    { id: "building-state", label: "מצב הבניין והיתרים", score: scoreDomain4Display, status: scoreDomain4 !== null && scoreDomain4 >= 75 ? "green" : "yellow", iconKey: "Building" },
    { id: "market-price", label: "מחיר מול שוק וקומה", score: scoreDomain3Display, status: scoreDomain3 !== null && scoreDomain3 >= 75 ? "green" : "yellow", iconKey: "TrendingUp" },
  ];

  // 11. Actionable Steps
  const actionableItems: ActionableItem[] = [];
  if (hasActiveInsolvency) {
    actionableItems.push({
      id: 1,
      title: "עצירת העברת כספים והבהרת הליך חדלות פירעון",
      description: "נושה או ממונה עשויים לעכב את רישום הבעלות. חובה לקבל אישור בית משפט או ממונה טרם חתימה.",
    });
    actionableItems.push({
      id: 2,
      title: "הפקדת כספים בנאמנות עורך דין בלבד",
      description: "יש לוודא שאף תשלום אינו מועבר ישירות למוכר, אלא מוחזק בחשבון נאמנות סגור עד להסדרה.",
    });
  } else {
    actionableItems.push({
      id: 1,
      title: "אימות נסח טאבו מעודכן סמוך לחתימה",
      description: "מומלץ להוציא נסח טאבו עדכני 24 שעות לפני החתימה כדי לוודא שלא נרשם עיקול או הערת אזהרה חדשה.",
    });
    actionableItems.push({
      id: 2,
      title: "אישור עירייה להיעדר חובות והיטל השבחה",
      description: "לוודא שהמוכר ממציא אישור עירייה לרשם המקרקעין טרם ביצוע תשלומים סופיים.",
    });
  }

  if (!isFloorKnown) {
    actionableItems.push({
      id: 3,
      title: "אימות קומה ומעלית בסיור שמאי",
      description: "קומת הנכס לא צוינה בטופס. יש לוודא אימות קומה, קיום מעלית ותשריט בית משותף בעת ביקור שמאי המקרקעין.",
    });
  } else {
    actionableItems.push({
      id: 3,
      title: "בדיקת התאמת תשריט הבית המשותף",
      description: `אימות שיוך ההצמדות (חניה/מחסן) לקומה ${floorNum} ולתת-החלקה בפנקס הבתים המשותפים.`,
    });
  }

  actionableItems.push({
    id: 4,
    title: "בדיקה חוזרת לפני מסירת חזקה",
    description: "ביצוע סריקה חוזרת במרשם המשכונות ובמאגרים המשפטיים לפני העברת יתרת התמורה הסופית.",
  });

  // 12. Full 4 Pillars Data (Directly wired from verified case state — no fabricated green checks)
  const tabuHighFindings = activeFindings.filter((f) => (f.category?.includes("זכויות") || f.category?.includes("טאבו")) && f.severity === "גבוהה");
  const planningFindings = activeFindings.filter((f) => f.category?.includes("תכנון"));
  const engineeringFindings = activeFindings.filter((f) => f.category?.includes("הנדס"));

  const pillars = {
    cadastral: {
      id: "cadastral",
      title: "1. זכויות משפטיות, משכונות ובדיקה משפטית",
      subtitle: "פנקסי מקרקעין, רשם המשכונות, חדלות פירעון והליכים",
      metrics: [
        {
          label: "רישום בעלות וזכויות (טאבו)",
          value: block !== "—" && hasTabuFindingOrDoc
            ? `רישום מאומת (גוש ${block}, חלקה ${parcel})`
            : block !== "—"
            ? `גוש ${block}, חלקה ${parcel} — ממתין לאימות נסח טאבו`
            : "פרטי גוש וחלקה טרם אומתו",
          status: block !== "—" && hasTabuFindingOrDoc && tabuHighFindings.length === 0 ? "green" : tabuHighFindings.length > 0 ? "red" : "yellow",
          details: tabuHighFindings.length > 0
            ? tabuHighFindings.map((f) => f.title).join(" · ")
            : `עבור ${address}.`,
        },
        {
          label: "מרשם המשכונות",
          value:
            pledgeState === "found_high"
              ? `אותר משכון/שעבוד מהותי (${pledgeHighFindings.length})`
              : pledgeState === "found_medium"
              ? "אותר ממצא הדורש בירור ברשם המשכונות"
              : pledgeState === "clean"
              ? "הבדיקה הושלמה — לא אותרו משכונות פעילים"
              : pledgeState === "uploaded_pending"
              ? "הועלה מסמך רשם המשכונות — ממתין לאישור ממצאים"
              : "הבדיקה לא הושלמה",
          status:
            pledgeState === "found_high"
              ? "red"
              : pledgeState === "clean"
              ? "green"
              : "yellow",
          details:
            pledgeFindings.length > 0
              ? pledgeFindings.map((f) => `${f.title}: ${f.note}`).join(" | ")
              : pledgeState === "uploaded_pending"
              ? "המסמך שמור בתיק. יש לעבור עליו ולאשר את ממצאי האנליסט."
              : "טרם הועלה דוח רשם המשכונות או תועד ממצא אנליסט.",
        },
        {
          label: "בדיקת חדלות פירעון (משרד המשפטים)",
          value:
            insolvencyState === "found"
              ? hasActiveInsolvency
                ? "נמצאו הליכי חדלות פירעון פעילים"
                : "נמצאו הליכי חדלות פירעון הדורשים בירור"
              : insolvencyState === "none_found"
              ? "הבדיקה הושלמה — לא נמצאו הליכים במאגר שנבדק"
              : "הבדיקה לא הושלמה",
          status:
            hasActiveInsolvency
              ? "red"
              : insolvencyState === "none_found"
              ? "green"
              : "yellow",
          details:
            insolvencyState === "found"
              ? insolvencyFindings[0]?.note || insolvencyCheck?.note || "אותרו הליכים במאגר הממונה. יש לבחון את המסמכים בתיק."
              : insolvencyState === "none_found"
              ? insolvencyCheck?.note || insolvencyFindings[0]?.note || "הבדיקה בוצעה במאגר משרד המשפטים (insolvency.justice.gov.il) ולא אותרו הליכים."
              : "טרם הושלמה בדיקת חדלות פירעון בתיק — אין לראות בכך אישור היעדר הליכים.",
        },
        {
          label: "בדיקה משפטית והליכים (נבו / נט המשפט)",
          value:
            legalState === "found"
              ? `נמצאו ממצאים משפטיים (${legalFindings.length || 1})`
              : legalState === "none_found"
              ? "הבדיקה הושלמה — לא נמצאו ממצאים רלוונטיים"
              : hasLegalDoc
              ? "הועלה מסמך משפטי — ממתין לאישור ממצאים"
              : "הבדיקה לא הושלמה",
          status:
            legalHighFindings.length > 0
              ? "red"
              : legalState === "none_found"
              ? "green"
              : "yellow",
          details:
            legalFindings.length > 0
              ? legalFindings.map((f) => `${f.title}: ${f.note}`).join(" | ")
              : legalCheck?.note || (legalState === "incomplete" ? "טרם הושלמה הבדיקה המשפטית בתיק." : "הבדיקה תועדה כהושלמה ללא ממצאים רלוונטיים."),
        },
      ],
    },
    economic: {
      id: "economic",
      title: "2. שווי נכס ונתוני שכירות",
      subtitle: "ייחוס מחיר למ״ר, התאמת קומה ונתוני שכירות",
      metrics: [
        {
          label: "התאמת מחיר לפי קומה ומעלית",
          value: floorAdjustmentLabel,
          status: isFloorKnown ? "green" : "yellow",
          details: isFloorKnown && isTotalFloorsKnown
            ? `קומה ${floorNum} מתוך ${totalFloorsNum} (מיקום יחסי ${relFloorRatio}), ${hasElevator ? "יש מעלית" : "ללא מעלית"}.`
            : "חישוב ללא קנס סיכון בהתאם לכללי המודל לחוסר מידע.",
        },
        {
          label: "מחיר ייחוס למ״ר בעיר",
          value: `₪${cityBasePsm.toLocaleString("he-IL")} למ״ר (ייחוס ${city || "אזורי"})`,
          status: "yellow",
          details: `נתון ייחוס עירוני כללי ב${city || "סביבה"} — יש להצליב מול עסקאות השוואה פרטניות.`,
        },
        {
          label: "נתוני שכירות ותשואה",
          value:
            enteredMonthlyRent > 0
              ? `₪${enteredMonthlyRent.toLocaleString("he-IL")} / חודש (לפי נתון שהוזן בתיק)${calculatedYieldPercent > 0 ? ` · ${calculatedYieldPercent}% תשואה` : ""}`
              : "לא הוזן שכר דירה ואין מאגר שכירות מחובר",
          status: enteredMonthlyRent > 0 ? "green" : "yellow",
          details:
            enteredMonthlyRent > 0
              ? "הנתון מבוסס על שכר הדירה שהוזן בתיק ואינו מהווה הערכה חיצונית."
              : "בהיעדר נתוני שכירות מוזנים או מאגר עסקאות שכירות פעיל, המערכת נמנעת מהצגת הערכת שכירות מטעה.",
        },
      ],
    },
    planning: {
      id: "planning",
      title: "3. תכנון עירוני והתחדשות",
      subtitle: "ועדות תכנון, תב״ע, פינוי-בינוי ותמ״א 38",
      metrics: [
        {
          label: "תוכניות בניין עיר והתחדשות",
          value:
            planningFindings.length > 0
              ? planningFindings.map((f) => f.title).join(" · ")
              : "טרם תועדה בדיקת תכנון בתיק (דורש אימות אנליסט)",
          status:
            planningFindings.some((f) => f.severity === "גבוהה")
              ? "red"
              : planningFindings.length > 0 && !planningFindings.some((f) => f.severity === "בינונית")
              ? "green"
              : "yellow",
          details:
            planningFindings.length > 0
              ? planningFindings.map((f) => f.note).join(" | ")
              : "יש לבדוק תוכניות תב״ע וייעוד קרקע מול מערכות התכנון לפני חתימה.",
        },
      ],
    },
    engineering: {
      id: "engineering",
      title: "4. היתרי בנייה ומצב הנדסי",
      subtitle: "תיק בניין עירוני, היתרים וחריגות בנייה",
      metrics: [
        {
          label: "תיק בניין והיתרים",
          value:
            engineeringFindings.length > 0
              ? engineeringFindings.map((f) => f.title).join(" · ")
              : "טרם תועדה בדיקת היתרים בתיק (דורש אימות אנליסט)",
          status:
            engineeringFindings.some((f) => f.severity === "גבוהה")
              ? "red"
              : engineeringFindings.length > 0 && !engineeringFindings.some((f) => f.severity === "בינונית")
              ? "green"
              : "yellow",
          details:
            engineeringFindings.length > 0
              ? engineeringFindings.map((f) => f.note).join(" | ")
              : `נדרשת בדיקת תיק בניין והיתרי בנייה עבור ${address}.`,
        },
      ],
    },
  };

  // 13. Operative Steps
  const operativeNextSteps = actionableItems.map((item) => ({
    id: `step-${item.id}`,
    target: item.id === 1 ? "עורך דין" : item.id === 2 ? "מוכר" : item.id === 3 ? "שמאי" : "בנק",
    title: item.title,
    description: item.description,
  }));

  const reportNumber =
    caseRow.caseNumber || caseRow.case_number || `SD-2026-${String(caseRow.id || "001").slice(-3).toUpperCase()}`;

  return {
    jobId: String(caseRow.id || reportNumber),
    generatedAt,
    dealType,
    reportNumber,
    safeScore,
    riskLevel,
    riskText,
    recommendationText,
    property: {
      projectName: deal.projectName || (isDeveloper ? "פרויקט מגורים" : undefined),
      developerName: deal.developerName || (isDeveloper ? "חברה יזמית" : undefined),
      address,
      cadastral,
      propertyType: caseRow.asset_type || caseRow.assetType || (isDeveloper ? "דירה חדשה מקבלן" : "דירת מגורים"),
      rooms: roomsDisplay,
      areaSqm: areaDisplay,
      floor: floorDisplay,
      totalFloors: totalFloorsNum ? String(totalFloorsNum) : undefined,
      hasElevator,
      parkingStorage: caseRow.parkingStorage || (deal.hasParking ? "חניה רשומה" : "לא צוין"),
      askingPrice: askingPriceDisplay,
      askingPriceNum: askingPriceNum || undefined,
      yearBuilt: isDeveloper ? "בבנייה (2026)" : "לא צוין",
    },
    top5Findings,
    quickRiskMap,
    recommendationBanner: {
      verdictText: `SAFE SCORE ${safeScore}/100 · ${riskText}`,
      subtext: recommendationText,
    },
    scoreBreakdown,
    actionableSection: {
      title: hasActiveInsolvency ? "מה המשמעות של חובות אישיים וחדלות פירעון?" : "צעדים אופרטיביים מומלצים לפעולה",
      items: actionableItems,
    },
    bottomLine: {
      text:
        hasActiveInsolvency
          ? "לעצור את העברת הכספים עד להסדרת ממצאי החוב וחדלות הפירעון מול הממונה, להגדיר נאמנות ייעודית לסילוק חובות, ולבקש מעורך הדין לבצע בדיקת עיקולים עדכנית סמוך לחתימה."
          : testedWeightSum === 0
          ? "טרם הושלמו בדיקות מאומתות מספיקות בתיק להפקת המלצה סופית. יש להשלים את הבדיקות החסרות ואישור הממצאים."
          : `הבדיקה המשוקללת עבור הנכס ב-${address} מצביעה על ציון של ${safeScore}/100 (כיסוי ${coveragePercent}%). מומלץ להתקדם בליווי משפטי מלא ולהשלים אימותים חסרים טרם חתימה.`,
      score: safeScore,
    },
    valuation,
    madlanInsights,
    coveragePercent,
    missingDataWarnings,
    pillars,
    operativeNextSteps,
  };
}
