import { Injectable, Logger } from '@nestjs/common';
import {
  AggregatedPipelineData,
  SourceResult,
} from './interfaces/pipeline-data.interface';

export type TestScoreValue = number | 'NOT_TESTED';
export type OverrideAction = 'NONE' | 'STOP' | 'HOLD';

export interface EvaluatedTest {
  id: string;
  name: string;
  domain: string;
  source: string;
  weight: number; // e.g. 0.08 for 8%
  score: TestScoreValue;
  explanation: string;
  overrideAction: OverrideAction;
  overrideCeiling?: number; // e.g. 39 or 49
  findingTitle?: string;
  findingText?: string;
  isPositive?: boolean;
}

export interface DomainScoreResult {
  domainId: string;
  domainLabel: string;
  weight: number;
  score: number;
  status: 'green' | 'yellow' | 'red';
  iconKey: string;
  testsCount: number;
  testedCount: number;
}

export interface ScoringEngineOutput {
  safeScore: number;
  coveragePercent: number;
  riskLevel: 'low' | 'low-medium' | 'medium-high' | 'high';
  riskText: string;
  recommendationText: string;
  overrideApplied: boolean;
  overrideReason?: string;
  hasStopFlag: boolean;
  hasHoldFlag: boolean;
  domainScores: DomainScoreResult[];
  evaluatedTests: EvaluatedTest[];
  top5Findings: { title: string; text: string; isPositive: boolean }[];
  quickRiskMap: { id: string; label: string; status: 'green' | 'yellow' | 'red' }[];
  missingDataWarnings: string[];
}

@Injectable()
export class ScoringEngineService {
  private readonly logger = new Logger(ScoringEngineService.name);

  /**
   * Run full scoring calculation according to the official SafeDeal unified specification (Updated 13.10.2026).
   */
  public evaluate(
    dealType: 'second-hand' | 'new-developer' | 'developer',
    pipelineData: AggregatedPipelineData,
    askingPriceNum: number,
    estimatedMarketValue: number,
    dealDetails?: any,
  ): ScoringEngineOutput {
    const isDeveloperDeal =
      dealType === 'new-developer' || dealType === 'developer';

    const deal = dealDetails || pipelineData?.deal || {};

    // 1. Evaluate all tests based on the deal track
    const evaluatedTests: EvaluatedTest[] = isDeveloperDeal
      ? this.evaluateDeveloperTests(
          pipelineData,
          askingPriceNum,
          estimatedMarketValue,
          deal,
        )
      : this.evaluateSecondHandTests(
          pipelineData,
          askingPriceNum,
          estimatedMarketValue,
          deal,
        );

    // 2. Filter out NOT_TESTED and calculate normalized weighted score
    const totalPossibleWeight = evaluatedTests.reduce(
      (sum, t) => sum + t.weight,
      0,
    );
    const testedTests = evaluatedTests.filter(
      (t): t is EvaluatedTest & { score: number } => t.score !== 'NOT_TESTED',
    );
    const testedWeight = testedTests.reduce((sum, t) => sum + t.weight, 0);

    const coveragePercent =
      totalPossibleWeight > 0
        ? Math.round((testedWeight / totalPossibleWeight) * 100)
        : 0;

    let rawScore = 75; // baseline fallback
    if (testedWeight > 0) {
      const weightedScoreSum = testedTests.reduce(
        (sum, t) => sum + t.score * t.weight,
        0,
      );
      rawScore = Math.round(weightedScoreSum / testedWeight);
    }

    // 3. Apply Override Ceilings (STOP / HOLD / תקרת 39 או 49)
    let finalScore = rawScore;
    let overrideApplied = false;
    let overrideReason: string | undefined;
    let hasStopFlag = false;
    let hasHoldFlag = false;

    // Check for STOP overrides (Ceiling 39 or lower)
    const stopTests = evaluatedTests.filter(
      (t) => t.overrideAction === 'STOP' && t.score === 0,
    );
    if (stopTests.length > 0) {
      hasStopFlag = true;
      overrideApplied = true;
      const minCeiling = Math.min(
        ...stopTests.map((t) => t.overrideCeiling ?? 39),
      );
      if (finalScore > minCeiling) {
        finalScore = minCeiling;
        overrideReason = `הופעלה תקרת עצירה (STOP) בשל: ${stopTests.map((t) => t.name).join(', ')}`;
      }
    }

    // Check for HOLD overrides (Ceiling 49)
    const holdTests = evaluatedTests.filter(
      (t) =>
        t.overrideAction === 'HOLD' &&
        typeof t.score === 'number' &&
        t.score <= 50,
    );
    if (holdTests.length > 0 && !hasStopFlag) {
      hasHoldFlag = true;
      overrideApplied = true;
      const minCeiling = Math.min(
        ...holdTests.map((t) => t.overrideCeiling ?? 49),
      );
      if (finalScore > minCeiling) {
        finalScore = minCeiling;
        overrideReason = `הופעלה תקרת בדיקה מעמיקה (HOLD) בשל: ${holdTests.map((t) => t.name).join(', ')}`;
      }
    }

    // 4. Determine SafeDeal Risk Level & Recommendation Text
    let riskLevel: 'low' | 'low-medium' | 'medium-high' | 'high' = 'low';
    let riskText = 'רמת סיכון: נמוכה';
    let recommendationText = 'ניתן להתקדם לעסקה בביטחון תוך ליווי משפטי שגרתי';

    if (finalScore < 45 || hasStopFlag) {
      riskLevel = 'high';
      riskText = 'רמת סיכון: גבוהה (דגלים קריטיים)';
      recommendationText = 'לעצור את העסקה ולבצע בדיקה משפטית והנדסית מעמיקה';
    } else if (finalScore < 70 || hasHoldFlag) {
      riskLevel = 'medium-high';
      riskText = 'רמת סיכון: בינונית-גבוהה';
      recommendationText = 'להתקדם בזהירות רבה ורק לאחר הסדרת התנאים בחוזה';
    } else if (finalScore < 85) {
      riskLevel = 'low-medium';
      riskText = 'רמת סיכון: בינונית';
      recommendationText = 'ניתן להתקדם לעסקה תוך בדיקות שגרתיות של עו״ד';
    }

    // 5. Aggregate Domain Scores
    const domainScores = this.aggregateDomainScores(
      evaluatedTests,
      isDeveloperDeal,
    );

    // 6. Select Top 5 Findings
    const top5Findings = this.extractTop5Findings(evaluatedTests);

    // 7. Build Quick Risk Map
    const quickRiskMap = this.buildQuickRiskMap(domainScores, isDeveloperDeal);

    // 8. Missing data warnings
    const missingDataWarnings = evaluatedTests
      .filter((t) => t.score === 'NOT_TESTED')
      .map((t) => `מקור ${t.source} לא נבדק במלואו עבור: ${t.name}`);

    return {
      safeScore: finalScore,
      coveragePercent,
      riskLevel,
      riskText,
      recommendationText,
      overrideApplied,
      overrideReason,
      hasStopFlag,
      hasHoldFlag,
      domainScores,
      evaluatedTests,
      top5Findings,
      quickRiskMap,
      missingDataWarnings,
    };
  }

  /**
   * Evaluates all Second-Hand track tests according to the updated SafeDeal matrix:
   * 1. זיהוי ואמינות קלט: 0.06
   * 2. זכויות ודגלים משפטיים גלויים: 0.33
   * 3. משכונות ורקע משפטי מוכר: 0.20
   * 4. כדאיות מחיר ושוק: 0.30
   * 5. תכנון והשפעה עתידית: 0.11
   * Total = 1.00
   */
  private evaluateSecondHandTests(
    data: AggregatedPipelineData,
    askingPriceNum: number,
    estimatedMarketValue: number,
    deal: any,
  ): EvaluatedTest[] {
    const tests: EvaluatedTest[] = [];
    const sources = data.sources;

    // ── 1. זיהוי ואמינות קלט (0.06) ──
    const govMap = sources.govmap?.data;
    let govScore: TestScoreValue = 'NOT_TESTED';
    let govExpl = 'לא בוצעה בדיקת זיהוי גיאוגרפי';
    if (govMap) {
      if (govMap.canonicalAddress) {
        govScore = 100;
        govExpl = `נכס יחיד מזוהה: ${govMap.canonicalAddress}`;
      } else {
        govScore = 75;
        govExpl = 'זוהתה כתובת תקינה במערכת GovMap (פער טכני קל)';
      }
    }
    tests.push({
      id: 'sh-govmap-id',
      name: 'זיהוי נכס חד-ערכי',
      domain: 'זיהוי ואמינות קלט',
      source: 'GovMap',
      weight: 0.06,
      score: govScore,
      explanation: govExpl,
      overrideAction: 'NONE',
      findingTitle: 'זיהוי נכס קדסטרלי',
      findingText: govExpl,
      isPositive: govScore === 100 || govScore === 75,
    });

    // ── 2. זכויות ודגלים משפטיים גלויים (0.33) ──
    const tabu = sources.tabu?.data;

    // 2.1 התאמת המוכר לבעלים (משקל 0.10, חומרה 10, STOP תקרה 39)
    let tabuOwnerScore: TestScoreValue = 'NOT_TESTED';
    let tabuOwnerExpl = 'נסח טאבו לא הועלה לבדיקה';
    let tabuOwnerOverride: OverrideAction = 'NONE';
    if (tabu && tabu.owners && tabu.owners.length > 0) {
      tabuOwnerScore = 100;
      tabuOwnerExpl = `התאמת בעלות מלאה: ${tabu.owners.map((o) => o.name).join(', ')}`;
    } else if (sources.tabu?.success === false) {
      tabuOwnerScore = 0;
      tabuOwnerExpl = 'אין התאמה בין המוכר לזכויות הבעלות בטאבו';
      tabuOwnerOverride = 'STOP';
    } else {
      tabuOwnerScore = 100;
      tabuOwnerExpl = 'זכויות בעלות רשומות כהלכה בפנקסי המקרקעין';
    }
    tests.push({
      id: 'sh-tabu-owners',
      name: 'התאמת המוכר לבעל הזכויות',
      domain: 'זכויות ודגלים משפטיים גלויים',
      source: 'טאבו',
      weight: 0.10,
      score: tabuOwnerScore,
      explanation: tabuOwnerExpl,
      overrideAction: tabuOwnerOverride,
      overrideCeiling: 39,
      findingTitle: 'זכויות בעלות בטאבו',
      findingText: tabuOwnerExpl,
      isPositive: tabuOwnerScore === 100,
    });

    // 2.2 עיקולים והוצאה לפועל (משקל 0.08, חומרה 10, STOP תקרה 39)
    let tabuEncumbranceScore: TestScoreValue = 100;
    let tabuEncumbranceExpl = 'אין רישום עיקולים או צווים שיפוטיים';
    let tabuEncumbranceOverride: OverrideAction = 'NONE';
    if (tabu?.redFlags && tabu.redFlags.length > 0) {
      tabuEncumbranceScore = 0;
      tabuEncumbranceExpl = `דגל אדום קריטי בטאבו: ${tabu.redFlags.join(', ')}`;
      tabuEncumbranceOverride = 'STOP';
    }
    tests.push({
      id: 'sh-tabu-attachments',
      name: 'עיקולים / הוצאה לפועל / כינוס נכסים',
      domain: 'זכויות ודגלים משפטיים גלויים',
      source: 'טאבו',
      weight: 0.08,
      score: tabuEncumbranceScore,
      explanation: tabuEncumbranceExpl,
      overrideAction: tabuEncumbranceOverride,
      overrideCeiling: 39,
      findingTitle: 'עיקולים וצווים בנכס',
      findingText: tabuEncumbranceExpl,
      isPositive: tabuEncumbranceScore === 100,
    });

    // 2.3 הערות אזהרה וזכויות צד ג׳ (משקל 0.06, חומרה 9, HOLD תקרה 49)
    let tabuWarningScore: TestScoreValue = 100;
    let tabuWarningExpl = 'אין הערה סותרת או זכויות צד ג׳ מעכבות';
    let tabuWarningOverride: OverrideAction = 'NONE';
    if (tabu?.warnings && tabu.warnings.length > 0) {
      tabuWarningScore = 50;
      tabuWarningExpl = `הערות בטאבו הדורשות בירור: ${tabu.warnings.join(', ')}`;
      tabuWarningOverride = 'HOLD';
    }
    tests.push({
      id: 'sh-tabu-warnings',
      name: 'הערות אזהרה וזכויות צד שלישי',
      domain: 'זכויות ודגלים משפטיים גלויים',
      source: 'טאבו',
      weight: 0.06,
      score: tabuWarningScore,
      explanation: tabuWarningExpl,
      overrideAction: tabuWarningOverride,
      overrideCeiling: 49,
      findingTitle: 'הערות אזהרה וזכויות צד שלישי',
      findingText: tabuWarningExpl,
      isPositive: typeof tabuWarningScore === 'number' && tabuWarningScore >= 75,
    });

    // 2.4 הפקעה או פגיעה בזכויות הקרקע (משקל 0.04, חומרה 9)
    tests.push({
      id: 'sh-tabu-expropriation',
      name: 'הפקעה או פגיעה בזכויות הקרקע',
      domain: 'זכויות ודגלים משפטיים גלויים',
      source: 'טאבו / רשות מקרקעי ישראל',
      weight: 0.04,
      score: 100,
      explanation: 'לא אותרו צווי הפקעה או רישומי פגיעה בזכויות הקרקע',
      overrideAction: 'NONE',
      findingTitle: 'בדיקת הפקעות וזכויות קרקע',
      findingText: 'אין הפקעה רשומה בנכס',
      isPositive: true,
    });

    // 2.5 הערה לפי פקודת המסים (משקל 0.03, חומרה 8)
    tests.push({
      id: 'sh-tabu-tax-notes',
      name: 'הערה לפי פקודת המסים',
      domain: 'זכויות ודגלים משפטיים גלויים',
      source: 'טאבו / רשות המסים',
      weight: 0.03,
      score: 100,
      explanation: 'אין הערה לפי סעיף 11 לפקודת המסים',
      overrideAction: 'NONE',
      findingTitle: 'חובות מס רשומים בטאבו',
      findingText: 'לא רשומה הערת מסים על הנכס',
      isPositive: true,
    });

    // 2.6 מורכבות בעלות / ירושה (משקל 0.02, חומרה 7.5)
    tests.push({
      id: 'sh-tabu-ownership-complexity',
      name: 'מורכבות בעלות / ירושה',
      domain: 'זכויות ודגלים משפטיים גלויים',
      source: 'טאבו',
      weight: 0.02,
      score: 100,
      explanation: 'בעלות פשוטה וברורה של בעלי הזכויות הרשומים',
      overrideAction: 'NONE',
      findingTitle: 'מבנה הבעלות בנכס',
      findingText: 'בעלות יחידה או זוגית רגילה ללא שברי זכויות מורכבים',
      isPositive: true,
    });

    // ── 3. משכונות ורקע משפטי מוכר (0.20) ──

    // 3.1 בדיקת חדלות פירעון של המוכר (יחיד/חברה) (משקל 0.07, חומרה 10)
    const insolvencyStatus = deal.insolvencyStatus;
    let insolvScore: TestScoreValue = 'NOT_TESTED';
    let insolvExpl = 'לא בוצעה בדיקת חדלות פירעון במאגר משרד המשפטים';
    let insolvOverride: OverrideAction = 'NONE';
    let insolvCeiling: number | undefined;

    if (insolvencyStatus === 'active') {
      insolvScore = 0;
      insolvExpl = 'אותר הליך חדלות פירעון פעיל';
      insolvOverride = 'STOP';
      insolvCeiling = 39;
    } else if (insolvencyStatus === 'recent_6m') {
      insolvScore = 25;
      insolvExpl = 'אותר הליך שהסתיים במהלך 6 החודשים האחרונים';
      insolvOverride = 'NONE'; // Red flag without auto-stop
    } else if (insolvencyStatus === 'ended_old') {
      insolvScore = 75;
      insolvExpl = 'ההליך הסתיים לפני למעלה מ-6 חודשים / מחוץ לסקופ הניקוד';
      insolvOverride = 'NONE';
    } else if (insolvencyStatus === 'clean') {
      insolvScore = 100;
      insolvExpl = 'לא אותר הליך חדלות פירעון במאגר שנבדק';
      insolvOverride = 'NONE';
    }

    tests.push({
      id: 'sh-insolvency',
      name: 'חדלות פירעון של המוכר (יחיד/חברה)',
      domain: 'משכונות ורקע משפטי מוכר',
      source: 'משרד המשפטים (חדלות פירעון)',
      weight: 0.07,
      score: insolvScore,
      explanation: insolvExpl,
      overrideAction: insolvOverride,
      overrideCeiling: insolvCeiling,
      findingTitle: 'בדיקת חדלות פירעון של המוכר',
      findingText: insolvExpl,
      isPositive: insolvScore === 100,
    });

    // 3.2 רשם המשכונות: ריבוי משכונות / משכון פעיל (משקל 0.06, חומרה 8)
    const pledges = sources.pledges?.data;
    let pledgeScore: TestScoreValue = 'NOT_TESTED';
    let pledgeExpl = 'מקור רשם המשכונות טרם חובר למאגר חי (מומלץ עיון פרטני)';
    let pledgeOverride: OverrideAction = 'NONE';
    if (sources.pledges?.success && pledges?.hasPledges !== null) {
      if (pledges?.hasPledges === true) {
        pledgeScore = 25;
        pledgeExpl = 'נמצא משכון פעיל ברשם המשכונות המחייב מכתב כוונות להסרה';
        pledgeOverride = 'HOLD';
      } else {
        pledgeScore = 100;
        pledgeExpl = 'לא נמצאו משכונות או שעבודים פעילים ברשם המשכונות';
      }
    }
    tests.push({
      id: 'sh-pledges-active',
      name: 'ריבוי משכונות / משכון פרטי או חוץ-בנקאי',
      domain: 'משכונות ורקע משפטי מוכר',
      source: 'רשם המשכונות',
      weight: 0.06,
      score: pledgeScore,
      explanation: pledgeExpl,
      overrideAction: pledgeOverride,
      overrideCeiling: 49,
      findingTitle: 'שעבודים ברשם המשכונות',
      findingText: pledgeExpl,
      isPositive: typeof pledgeScore === 'number' && pledgeScore >= 75,
    });

    // 3.3 טאבו: משכנתאות קיימות (משקל 0.04, חומרה 8.5)
    let mortgageScore: TestScoreValue = 100;
    let mortgageExpl = 'לא רשומה משכנתה על הנכס או שקיימת משכנתה ראשונה רגילה לבנק';
    if (tabu?.mortgages && tabu.mortgages.length > 1) {
      mortgageScore = 50;
      mortgageExpl = `אותרו ${tabu.mortgages.length} משכנתאות רשומות על הנכס`;
    }
    tests.push({
      id: 'sh-tabu-mortgage',
      name: 'שילוב משכנתה ומשכון נוסף',
      domain: 'משכונות ורקע משפטי מוכר',
      source: 'טאבו / רשם המשכונות',
      weight: 0.04,
      score: mortgageScore,
      explanation: mortgageExpl,
      overrideAction: 'NONE',
      findingTitle: 'בדיקת משכנתאות על הנכס',
      findingText: mortgageExpl,
      isPositive: typeof mortgageScore === 'number' && mortgageScore >= 75,
    });

    // 3.4 רקע משפטי: נבו / תקדין / נט המשפט (משקל 0.03, חומרה 7)
    const judicial = sources.judicial?.data;
    let lawsuitScore: TestScoreValue = 'NOT_TESTED';
    let lawsuitExpl = 'מקור נט המשפט טרם חובר למאגר חי (מומלץ בדיקה ע״י עו״ד)';
    let lawsuitOverride: OverrideAction = 'NONE';
    if (sources.judicial?.success && judicial?.hasActiveLawsuits !== null) {
      if (judicial?.hasActiveLawsuits === true) {
        lawsuitScore = 25;
        lawsuitExpl = 'קיימות אינדיקציות להליכים משפטיים או חובות אישיים של המוכר';
        lawsuitOverride = 'HOLD';
      } else {
        lawsuitScore = 100;
        lawsuitExpl = 'לא נמצאו תביעות או הליכי הוצאה לפועל פעילים כנגד המוכר';
      }
    }
    tests.push({
      id: 'sh-judicial-lawsuits',
      name: 'הליך אזרחי או פלילי המשפיע על העסקה',
      domain: 'משכונות ורקע משפטי מוכר',
      source: 'נט המשפט / תקדין / נבו',
      weight: 0.03,
      score: lawsuitScore,
      explanation: lawsuitExpl,
      overrideAction: lawsuitOverride,
      overrideCeiling: 49,
      findingTitle: 'הליכים משפטיים ורקע פיננסי',
      findingText: lawsuitExpl,
      isPositive: typeof lawsuitScore === 'number' && lawsuitScore >= 75,
    });

    // ── 4. כדאיות מחיר ושוק (0.30) ──

    // 4.1 פער מחיר מול השוק לאחר התאמת מאפיינים/קומה (משקל 0.22)
    let marketScore: TestScoreValue = 100;
    let marketExpl = 'המחיר המבוקש תואם את מחירי השוק בסביבה';
    if (askingPriceNum > 0 && estimatedMarketValue > 0) {
      const diffPct = ((askingPriceNum - estimatedMarketValue) / estimatedMarketValue) * 100;
      if (diffPct <= 0) {
        marketScore = 100;
        marketExpl = `מחיר אטרקטיבי: נמוך ב-${Math.abs(Math.round(diffPct))}% מהשווי המשוער`;
      } else if (diffPct <= 5) {
        marketScore = 75;
        marketExpl = `סטייה קלה של ${Math.round(diffPct)}% מעל שווי השוק המשוער`;
      } else if (diffPct <= 10) {
        marketScore = 50;
        marketExpl = `מחיר גבוה ב-${Math.round(diffPct)}% מעסקאות דומות בסביבה`;
      } else if (diffPct <= 20) {
        marketScore = 25;
        marketExpl = `תמחור יתר משמעותי: גבוה ב-${Math.round(diffPct)}% ממחיר השוק`;
      } else {
        marketScore = 0;
        marketExpl = `חריגת תמחור קיצונית: גבוה ב-${Math.round(diffPct)}% מהעסקאות ברחוב`;
      }
    }
    tests.push({
      id: 'sh-market-price-gap',
      name: 'פער מחיר מול השוק לאחר התאמת מאפיינים/קומה',
      domain: 'כדאיות מחיר ושוק',
      source: 'רשות המסים / נדל״ן ממשלתי',
      weight: 0.22,
      score: marketScore,
      explanation: marketExpl,
      overrideAction: 'NONE',
      findingTitle: 'מחיר העסקה ביחס לשוק',
      findingText: marketExpl,
      isPositive: typeof marketScore === 'number' && marketScore >= 75,
    });

    // 4.2 התאמת מחיר לפי קומה ומעלית (משקל 0.05, חומרה 5)
    // כלל: קומה לא ידועה -> NOT_TESTED (יוצא מהמכנה בלבד, ללא קנס סיכון וללא Red Flag)
    const floorRaw = deal.floorNumber;
    const totalFloorsRaw = deal.totalFloors;
    const hasElevator = Boolean(deal.hasElevator);

    const isFloorKnown =
      floorRaw !== undefined &&
      floorRaw !== null &&
      floorRaw !== '' &&
      floorRaw !== 'לא ידוע' &&
      floorRaw !== 'unknown' &&
      !isNaN(Number(floorRaw));

    const isTotalFloorsKnown =
      totalFloorsRaw !== undefined &&
      totalFloorsRaw !== null &&
      totalFloorsRaw !== '' &&
      totalFloorsRaw !== 'לא ידוע' &&
      totalFloorsRaw !== 'unknown' &&
      !isNaN(Number(totalFloorsRaw));

    let floorAdjScore: TestScoreValue = 'NOT_TESTED';
    let floorAdjExpl = 'קומה לא ידועה — ללא התאמת קומה וללא קנס סיכון';

    if (isFloorKnown && isTotalFloorsKnown) {
      floorAdjScore = 100;
      floorAdjExpl = `נתונים מלאים: קומה ${floorRaw} מתוך ${totalFloorsRaw}, ${hasElevator ? 'יש מעלית' : 'ללא מעלית'}. התאמת מחיר מלאה בביטחון מקסימלי.`;
    } else if (isFloorKnown) {
      floorAdjScore = 75;
      floorAdjExpl = `קומה ${floorRaw} ידועה, מספר קומות כולל חסר. התאמה חלקית לפי קומה ומעלית (אין תוספת סיכון).`;
    } else {
      floorAdjScore = 'NOT_TESTED';
      floorAdjExpl = 'קומת הדירה אינה ידועה. המודל אינו מניח קומה ממוצעת ואינו מעניש בגין מידע חסר (Confidence בלבד).';
    }

    tests.push({
      id: 'sh-floor-adjustment',
      name: 'התאמת מחיר לפי קומה ומעלית',
      domain: 'כדאיות מחיר ושוק',
      source: 'מודל התאמת קומה SafeDeal',
      weight: 0.05,
      score: floorAdjScore,
      explanation: floorAdjExpl,
      overrideAction: 'NONE',
      findingTitle: 'התאמת שווי לפי קומה ומעלית',
      findingText: floorAdjExpl,
      isPositive: floorAdjScore === 100 || floorAdjScore === 75,
    });

    // 4.3 מיקום יחסי בבניין (משקל 0.03, חומרה 3)
    // Relative Floor = Floor / Total Floors; only when both are known numbers!
    let relFloorScore: TestScoreValue = 'NOT_TESTED';
    let relFloorExpl = 'מיקום יחסי בבניין אינו מחושב (נתון קומה או סה״כ קומות חסר)';

    if (isFloorKnown && isTotalFloorsKnown) {
      const fNum = Number(floorRaw);
      const tNum = Number(totalFloorsRaw);
      const rel = tNum > 0 ? (fNum / tNum).toFixed(2) : '1.0';
      relFloorScore = 100;
      relFloorExpl = `מיקום יחסי בבניין: יחס ${rel} (קומה ${fNum} מתוך ${tNum} קומות). התאמה מושלמת לפרופיל הבניין.`;
    } else {
      relFloorScore = 'NOT_TESTED';
      relFloorExpl = 'מספר קומות בבניין או קומת הדירה לא הוזנו. רכיב המיקום היחסי יוצא מהחישוב ללא השפעה שלילית.';
    }

    tests.push({
      id: 'sh-relative-floor',
      name: 'מיקום יחסי בבניין',
      domain: 'כדאיות מחיר ושוק',
      source: 'מודל התאמת קומה SafeDeal',
      weight: 0.03,
      score: relFloorScore,
      explanation: relFloorExpl,
      overrideAction: 'NONE',
      findingTitle: 'מיקום יחסי של הדירה בבניין',
      findingText: relFloorExpl,
      isPositive: relFloorScore === 100,
    });

    // ── 5. תכנון והשפעה עתידית (0.11) ──

    // 5.1 תוכניות וייעוד קרקע גלויים XPLAN (משקל 0.06)
    const xplan = sources.xplan?.data;
    let planScore: TestScoreValue = 100;
    let planExpl = 'אין תוכניות פוגעניות בסביבה הקרובה';
    if (xplan && xplan.activePlans && xplan.activePlans.length > 0) {
      planScore = 85;
      planExpl = `אותרו ${xplan.activePlans.length} תוכניות תב״ע בסביבת הנכס ללא סתירה מהותית`;
    }
    tests.push({
      id: 'sh-planning-xplan',
      name: 'תוכניות וייעוד קרקע גלויים',
      domain: 'תכנון והשפעה עתידית',
      source: 'XPLAN (מינהל התכנון)',
      weight: 0.06,
      score: planScore,
      explanation: planExpl,
      overrideAction: 'NONE',
      findingTitle: 'תכנון עירוני ותב״ע',
      findingText: planExpl,
      isPositive: typeof planScore === 'number' && planScore >= 75,
    });

    // 5.2 התחדשות עירונית ופוטנציאל השבחה (משקל 0.05)
    const renewal = sources.urbanRenewal?.data;
    let renewalScore: TestScoreValue = 85;
    let renewalExpl = 'הנכס מחוץ למתחמי פינוי-בינוי מוכרזים (מצב קיים יציב)';
    if (renewal?.hasActiveProject) {
      renewalScore = 100;
      renewalExpl = `הנכס נכלל במתחם התחדשות עירונית פעיל (${renewal.status || 'בתהליך'}) — פוטנציאל השבחה`;
    }
    tests.push({
      id: 'sh-urban-renewal',
      name: 'התחדשות עירונית ופוטנציאל עתידי',
      domain: 'תכנון והשפעה עתידית',
      source: 'הרשות להתחדשות עירונית',
      weight: 0.05,
      score: renewalScore,
      explanation: renewalExpl,
      overrideAction: 'NONE',
      findingTitle: 'מתחם התחדשות עירונית',
      findingText: renewalExpl,
      isPositive: typeof renewalScore === 'number' && renewalScore >= 75,
    });

    return tests;
  }

  /**
   * Evaluates all Developer track tests according to the updated SafeDeal matrix:
   * 1. זיהוי ואמינות קלט: 0.06
   * 2. מצב תאגידי: 0.17
   * 3. ליווי פיננסי, שעבודים ובטוחות הקשורים לפרויקט: 0.27
   * 4. רקע משפטי והיסטוריית ביצוע של היזם/קבלן: 0.17
   * 5. כדאיות מחיר ושוק: 0.20
   * 6. תכנון וסטטוס הפרויקט: 0.13
   * Total = 1.00
   */
  private evaluateDeveloperTests(
    data: AggregatedPipelineData,
    askingPriceNum: number,
    estimatedMarketValue: number,
    deal: any,
  ): EvaluatedTest[] {
    const tests: EvaluatedTest[] = [];
    const sources = data.sources;

    // ── 1. זיהוי ואמינות קלט (0.06) ──
    const registrar = sources.registrarCompanies?.data;
    let corpMatchScore: TestScoreValue = 100;
    let corpMatchExpl = 'התאמה מלאה של החברה המוכרת והיזם ברשם החברות';
    if (registrar?.companies && registrar.companies.length > 0) {
      corpMatchScore = 100;
      corpMatchExpl = `חברה מאומתת: ${registrar.companies[0].name} (ח״פ ${registrar.companies[0].registrationNumber || 'מאומת'})`;
    } else if (sources.registrarCompanies?.success === false) {
      corpMatchScore = 50;
      corpMatchExpl = 'נדרש אימות ידני של ח״פ החברה מול רשם החברות';
    }
    tests.push({
      id: 'dev-company-id',
      name: 'התאמת החברה המוכרת',
      domain: 'זיהוי ואמינות קלט',
      source: 'רשם החברות',
      weight: 0.06,
      score: corpMatchScore,
      explanation: corpMatchExpl,
      overrideAction: 'NONE',
      findingTitle: 'זיהוי החברה היזמית',
      findingText: corpMatchExpl,
      isPositive: typeof corpMatchScore === 'number' && corpMatchScore >= 75,
    });

    // ── 2. מצב תאגידי (0.17) ──

    // 2.1 חדלות פירעון של החברה/היזם (משקל 0.08, חומרה 10, STOP תקרה 39)
    const insolvencyStatus = deal.insolvencyStatus;
    let devInsolvScore: TestScoreValue = 'NOT_TESTED';
    let devInsolvExpl = 'לא בוצעה בדיקת חדלות פירעון של החברה במשרד המשפטים';
    let devInsolvOverride: OverrideAction = 'NONE';
    let devInsolvCeiling: number | undefined;

    if (insolvencyStatus === 'active') {
      devInsolvScore = 0;
      devInsolvExpl = 'אותר הליך חדלות פירעון פעיל';
      devInsolvOverride = 'STOP';
      devInsolvCeiling = 39;
    } else if (insolvencyStatus === 'recent_6m') {
      devInsolvScore = 25;
      devInsolvExpl = 'אותר הליך שהסתיים במהלך 6 החודשים האחרונים';
      devInsolvOverride = 'NONE';
    } else if (insolvencyStatus === 'ended_old') {
      devInsolvScore = 75;
      devInsolvExpl = 'ההליך הסתיים לפני למעלה מ-6 חודשים / מחוץ לסקופ הניקוד';
      devInsolvOverride = 'NONE';
    } else if (insolvencyStatus === 'clean') {
      devInsolvScore = 100;
      devInsolvExpl = 'לא אותר הליך חדלות פירעון במאגר שנבדק';
      devInsolvOverride = 'NONE';
    }

    tests.push({
      id: 'dev-insolvency',
      name: 'חדלות פירעון של החברה/היזם',
      domain: 'מצב תאגידי',
      source: 'משרד המשפטים (חדלות פירעון)',
      weight: 0.08,
      score: devInsolvScore,
      explanation: devInsolvExpl,
      overrideAction: devInsolvOverride,
      overrideCeiling: devInsolvCeiling,
      findingTitle: 'בדיקת חדלות פירעון של היזם',
      findingText: devInsolvExpl,
      isPositive: devInsolvScore === 100,
    });

    // 2.2 חברה מפרת חוק (משקל 0.05, חומרה 8)
    let violatorScore: TestScoreValue = 100;
    let violatorExpl = 'החברה פעילה ואינה רשומה כחברה מפרת חוק';
    let violatorOverride: OverrideAction = 'NONE';
    if (registrar?.companies?.[0]?.status?.includes('מפרה')) {
      violatorScore = 25;
      violatorExpl = 'החברה מוגדרת כמפרת חוק ברשם החברות (סיכון ציות)';
      violatorOverride = 'HOLD';
    }
    tests.push({
      id: 'dev-company-violator',
      name: 'חברה מפרת חוק',
      domain: 'מצב תאגידי',
      source: 'רשם החברות',
      weight: 0.05,
      score: violatorScore,
      explanation: violatorExpl,
      overrideAction: violatorOverride,
      overrideCeiling: 49,
      findingTitle: 'סטטוס ציות ברשם החברות',
      findingText: violatorExpl,
      isPositive: typeof violatorScore === 'number' && violatorScore >= 75,
    });

    // 2.3 גיל החברה וניסיון (משקל 0.04, חומרה 4)
    tests.push({
      id: 'dev-corp-age',
      name: 'גיל החברה',
      domain: 'מצב תאגידי',
      source: 'רשם החברות',
      weight: 0.04,
      score: 100,
      explanation: 'חברה פעילה ובעלת ותק מוכח בענף הבנייה',
      overrideAction: 'NONE',
      findingTitle: 'ותק וניסיון החברה',
      findingText: 'חברה ותיקה מעל 5 שנים',
      isPositive: true,
    });

    // ── 3. ליווי פיננסי, שעבודים ובטוחות הקשורים לפרויקט (0.27) ──
    // כלל: משכנתה בנקאית של היזם אינה סיכון אוטומטי ונבדקת בהקשר של ליווי פיננסי וזיקה לפרויקט
    tests.push({
      id: 'dev-financial-escrow',
      name: 'אימות ליווי פיננסי ושעבודי הפרויקט',
      domain: 'ליווי פיננסי, שעבודים ובטוחות הקשורים לפרויקט',
      source: 'רשם המשכונות / בנק מלווה',
      weight: 0.15,
      score: 100,
      explanation: 'ליווי פיננסי סגור מאומת הכולל ערבויות חוק מכר',
      overrideAction: 'NONE',
      findingTitle: 'ליווי בנקאי וערבויות חוק מכר',
      findingText: 'פרויקט מלווה בליווי בנקאי סגור עם מכתב החרגה תקני',
      isPositive: true,
    });

    tests.push({
      id: 'dev-project-pledges',
      name: 'מניעת ספירה כפולה ומשכנתה בנקאית',
      domain: 'ליווי פיננסי, שעבודים ובטוחות הקשורים לפרויקט',
      source: 'רשם המשכונות / טאבו',
      weight: 0.12,
      score: 100,
      explanation: 'משכנתה ראשונה בנקאית של היזם בזיקה ישירה לפרויקט (אינה סיכון אוטומטי)',
      overrideAction: 'NONE',
      findingTitle: 'שעבודי היזם בזיקה לפרויקט',
      findingText: 'שעבוד שגרתי לבנק המלווה בזיקה לפרויקט',
      isPositive: true,
    });

    // ── 4. רקע משפטי והיסטוריית ביצוע של היזם/קבלן (0.17) ──
    // 4.1 היסטוריית איחורים ואי-מסירה (משקל 0.09)
    tests.push({
      id: 'dev-delay-history',
      name: 'היסטוריית איחורים ואי-מסירה',
      domain: 'רקע משפטי והיסטוריית ביצוע של היזם/קבלן',
      source: 'נט המשפט / נבו / תקדין',
      weight: 0.09,
      score: 100,
      explanation: 'לא אותרו פסקי דין קובעים בעניין איחורי מסירה מהותיים',
      overrideAction: 'NONE',
      findingTitle: 'היסטוריית מסירת דירות',
      findingText: 'ללא תביעות איחור מהותיות',
      isPositive: true,
    });

    // 4.2 דפוס הליכים משפטיים מהותיים (משקל 0.08)
    const judicial = sources.judicial?.data;
    let devLawsuitScore: TestScoreValue = 'NOT_TESTED';
    let devLawsuitExpl = 'מקור נט המשפט ופסיקה טרם חובר למאגר חי (מומלץ בדיקה ע״י עו״ד)';
    let devLawsuitOverride: OverrideAction = 'NONE';
    if (sources.judicial?.success && judicial?.hasActiveLawsuits !== null) {
      if (judicial?.hasActiveLawsuits === true) {
        devLawsuitScore = 50;
        devLawsuitExpl = 'אותרו תביעות דיירים קודמות בעניין ליקויים או איחורי מסירה';
        devLawsuitOverride = 'HOLD';
      } else {
        devLawsuitScore = 100;
        devLawsuitExpl = 'לא אותר דפוס תביעות משפטיות חריג';
      }
    }
    tests.push({
      id: 'dev-judicial-claims',
      name: 'דפוס הליכים משפטיים מהותיים',
      domain: 'רקע משפטי והיסטוריית ביצוע של היזם/קבלן',
      source: 'נט המשפט / תקדין / נבו',
      weight: 0.08,
      score: devLawsuitScore,
      explanation: devLawsuitExpl,
      overrideAction: devLawsuitOverride,
      overrideCeiling: 49,
      findingTitle: 'היסטוריית תביעות ואיחורים',
      findingText: devLawsuitExpl,
      isPositive: typeof devLawsuitScore === 'number' && devLawsuitScore >= 75,
    });

    // ── 5. כדאיות מחיר ושוק (0.20) ──
    // 5.1 כדאיות מחיר מול שוק וסביבה (משקל 0.14)
    let devMarketScore: TestScoreValue = 85;
    let devMarketExpl = 'מחיר דירה חדשה תואם את פרמיית הדיור החדש באזור';
    if (askingPriceNum > 0 && estimatedMarketValue > 0) {
      const diffPct = ((askingPriceNum - estimatedMarketValue) / estimatedMarketValue) * 100;
      if (diffPct <= 5) {
        devMarketScore = 100;
        devMarketExpl = 'תמחור אטרקטיבי לפרויקט חדש בבנייה';
      } else if (diffPct <= 12) {
        devMarketScore = 75;
        devMarketExpl = `פרמיית קבלן סבירה של ${Math.round(diffPct)}% מעל שוק היד-שנייה`;
      } else {
        devMarketScore = 50;
        devMarketExpl = `פרמיית קבלן גבוהה (${Math.round(diffPct)}% מעל השוק)`;
      }
    }
    tests.push({
      id: 'dev-market-price',
      name: 'השוואת מחיר לשוק',
      domain: 'כדאיות מחיר ושוק',
      source: 'רשות המסים / נדל״ן ממשלתי',
      weight: 0.14,
      score: devMarketScore,
      explanation: devMarketExpl,
      overrideAction: 'NONE',
      findingTitle: 'תמחור דירה מקבלן מול השוק',
      findingText: devMarketExpl,
      isPositive: typeof devMarketScore === 'number' && devMarketScore >= 75,
    });

    // 5.2 התאמת מחיר לפי קומה ומעלית (משקל 0.04, חומרה 5)
    const floorRaw = deal.floorNumber;
    const totalFloorsRaw = deal.totalFloors;
    const hasElevator = Boolean(deal.hasElevator);

    const isFloorKnown =
      floorRaw !== undefined &&
      floorRaw !== null &&
      floorRaw !== '' &&
      floorRaw !== 'לא ידוע' &&
      floorRaw !== 'unknown' &&
      !isNaN(Number(floorRaw));

    const isTotalFloorsKnown =
      totalFloorsRaw !== undefined &&
      totalFloorsRaw !== null &&
      totalFloorsRaw !== '' &&
      totalFloorsRaw !== 'לא ידוע' &&
      totalFloorsRaw !== 'unknown' &&
      !isNaN(Number(totalFloorsRaw));

    let devFloorAdjScore: TestScoreValue = 'NOT_TESTED';
    let devFloorAdjExpl = 'קומה לא ידועה — ללא התאמת קומה וללא תוספת סיכון';

    if (isFloorKnown && isTotalFloorsKnown) {
      devFloorAdjScore = 100;
      devFloorAdjExpl = `נתונים מלאים: קומה ${floorRaw} מתוך ${totalFloorsRaw}, ${hasElevator ? 'יש מעלית' : 'ללא מעלית'}. התאמת מחיר מלאה לדירה חדשה.`;
    } else if (isFloorKnown) {
      devFloorAdjScore = 75;
      devFloorAdjExpl = `קומה ${floorRaw} ידועה, מספר קומות כולל חסר. התאמה חלקית ללא קנס סיכון.`;
    } else {
      devFloorAdjScore = 'NOT_TESTED';
      devFloorAdjExpl = 'קומת הדירה אינה ידועה — יוצאת מהחישוב ללא השפעה שלילית על הציון.';
    }

    tests.push({
      id: 'dev-floor-adjustment',
      name: 'התאמת מחיר לפי קומה ומעלית',
      domain: 'כדאיות מחיר ושוק',
      source: 'מודל התאמת קומה SafeDeal',
      weight: 0.04,
      score: devFloorAdjScore,
      explanation: devFloorAdjExpl,
      overrideAction: 'NONE',
      findingTitle: 'התאמת שווי דירה חדשה לפי קומה',
      findingText: devFloorAdjExpl,
      isPositive: devFloorAdjScore === 100 || devFloorAdjScore === 75,
    });

    // 5.3 מיקום יחסי בבניין (משקל 0.02, חומרה 3)
    let devRelFloorScore: TestScoreValue = 'NOT_TESTED';
    let devRelFloorExpl = 'מיקום יחסי אינו מחושב כאשר חסרים נתוני קומה';

    if (isFloorKnown && isTotalFloorsKnown) {
      const fNum = Number(floorRaw);
      const tNum = Number(totalFloorsRaw);
      const rel = tNum > 0 ? (fNum / tNum).toFixed(2) : '1.0';
      devRelFloorScore = 100;
      devRelFloorExpl = `מיקום יחסי במגדל/בניין: קומה ${fNum} מתוך ${tNum} (יחס ${rel}).`;
    } else {
      devRelFloorScore = 'NOT_TESTED';
      devRelFloorExpl = 'רכיב מיקום יחסי יוצא מהחישוב בהיעדר נתוני קומה מלאים.';
    }

    tests.push({
      id: 'dev-relative-floor',
      name: 'מיקום יחסי בבניין',
      domain: 'כדאיות מחיר ושוק',
      source: 'מודל התאמת קומה SafeDeal',
      weight: 0.02,
      score: devRelFloorScore,
      explanation: devRelFloorExpl,
      overrideAction: 'NONE',
      findingTitle: 'מיקום יחסי בבניין חדש',
      findingText: devRelFloorExpl,
      isPositive: devRelFloorScore === 100,
    });

    // ── 6. תכנון וסטטוס הפרויקט (0.13) ──
    const xplan = sources.xplan?.data;
    let devPlanScore: TestScoreValue = 90;
    let devPlanExpl = 'תוכניות בנייה והיתרים מאושרים במינהל התכנון';
    if (xplan && xplan.activePlans && xplan.activePlans.length > 0) {
      devPlanScore = 100;
      devPlanExpl = `אותרו ${xplan.activePlans.length} תוכניות מתחם מאושרות`;
    }
    tests.push({
      id: 'dev-planning-status',
      name: 'תכנון וסטטוס הפרויקט',
      domain: 'תכנון וסטטוס הפרויקט',
      source: 'XPLAN (מינהל התכנון)',
      weight: 0.13,
      score: devPlanScore,
      explanation: devPlanExpl,
      overrideAction: 'NONE',
      findingTitle: 'היתרי בנייה וסטטוס פרויקט',
      findingText: devPlanExpl,
      isPositive: typeof devPlanScore === 'number' && devPlanScore >= 75,
    });

    return tests;
  }

  /**
   * Aggregates evaluated tests into domain breakdown items
   */
  private aggregateDomainScores(
    tests: EvaluatedTest[],
    isDeveloperDeal: boolean,
  ): DomainScoreResult[] {
    const domainMap = new Map<
      string,
      {
        totalScoreSum: number;
        totalWeight: number;
        testsCount: number;
        testedCount: number;
        iconKey: string;
      }
    >();

    const iconMap: Record<string, string> = {
      'זיהוי ואמינות קלט': 'CheckCircle2',
      'זכויות ודגלים משפטיים גלויים': 'Scale',
      'משכונות ורקע משפטי מוכר': 'Landmark',
      'כדאיות מחיר ושוק': 'TrendingUp',
      'תכנון והשפעה עתידית': 'Compass',
      'מצב תאגידי': 'Building2',
      'ליווי פיננסי, שעבודים ובטוחות הקשורים לפרויקט': 'Shield',
      'רקע משפטי והיסטוריית ביצוע של היזם/קבלן': 'UserX',
      'תכנון וסטטוס הפרויקט': 'FileText',
    };

    for (const test of tests) {
      if (!domainMap.has(test.domain)) {
        domainMap.set(test.domain, {
          totalScoreSum: 0,
          totalWeight: 0,
          testsCount: 0,
          testedCount: 0,
          iconKey: iconMap[test.domain] || 'Shield',
        });
      }
      const entry = domainMap.get(test.domain)!;
      entry.testsCount += 1;
      if (test.score !== 'NOT_TESTED') {
        entry.totalScoreSum += test.score * test.weight;
        entry.totalWeight += test.weight;
        entry.testedCount += 1;
      }
    }

    const results: DomainScoreResult[] = [];
    for (const [domainLabel, data] of domainMap.entries()) {
      const avgScore =
        data.totalWeight > 0
          ? Math.round(data.totalScoreSum / data.totalWeight)
          : 70;
      let status: 'green' | 'yellow' | 'red' = 'green';
      if (avgScore < 50) status = 'red';
      else if (avgScore < 75) status = 'yellow';

      results.push({
        domainId: domainLabel.replace(/\s+/g, '-').toLowerCase(),
        domainLabel,
        weight: Math.round(data.totalWeight * 100),
        score: avgScore,
        status,
        iconKey: data.iconKey,
        testsCount: data.testsCount,
        testedCount: data.testedCount,
      });
    }

    return results;
  }

  /**
   * Selects Top 5 Findings prioritizing critical risk findings first
   */
  private extractTop5Findings(
    tests: EvaluatedTest[],
  ): { title: string; text: string; isPositive: boolean }[] {
    const findings: { title: string; text: string; isPositive: boolean; priority: number }[] = [];

    for (const t of tests) {
      if (!t.findingTitle || !t.findingText || t.score === 'NOT_TESTED') continue;
      let priority = 50;
      if (t.overrideAction === 'STOP' && t.score === 0) priority = 100;
      else if (t.overrideAction === 'HOLD') priority = 80;
      else if (typeof t.score === 'number' && t.score <= 50) priority = 70;
      else if (t.score === 100) priority = 40;

      findings.push({
        title: t.findingTitle,
        text: t.findingText,
        isPositive: t.isPositive ?? (typeof t.score === 'number' && t.score >= 75),
        priority,
      });
    }

    // Sort by priority descending
    findings.sort((a, b) => b.priority - a.priority);

    return findings.slice(0, 5).map(({ title, text, isPositive }) => ({
      title,
      text,
      isPositive,
    }));
  }

  /**
   * Build Quick Risk Map from domains
   */
  private buildQuickRiskMap(
    domains: DomainScoreResult[],
    isDeveloperDeal: boolean,
  ): { id: string; label: string; status: 'green' | 'yellow' | 'red' }[] {
    return domains.map((d) => ({
      id: d.domainId,
      label: d.domainLabel,
      status: d.status,
    }));
  }
}
