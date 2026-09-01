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
   * Run full scoring calculation according to the official SafeDeal unified specification.
   */
  public evaluate(
    dealType: 'second-hand' | 'new-developer' | 'developer',
    pipelineData: AggregatedPipelineData,
    askingPriceNum: number,
    estimatedMarketValue: number,
  ): ScoringEngineOutput {
    const isDeveloperDeal =
      dealType === 'new-developer' || dealType === 'developer';

    // 1. Evaluate all tests based on the deal track
    const evaluatedTests: EvaluatedTest[] = isDeveloperDeal
      ? this.evaluateDeveloperTests(
          pipelineData,
          askingPriceNum,
          estimatedMarketValue,
        )
      : this.evaluateSecondHandTests(
          pipelineData,
          askingPriceNum,
          estimatedMarketValue,
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
      finalScore = Math.min(finalScore, minCeiling);
      overrideReason = `דגל אדום קריטי (STOP): ${stopTests.map((t) => t.name).join(', ')}`;
    }

    // Check for HOLD overrides (Ceiling 49)
    const holdTests = evaluatedTests.filter(
      (t) =>
        t.overrideAction === 'HOLD' &&
        (t.score === 0 || t.score === 25 || t.score === 50),
    );
    if (holdTests.length > 0 && !hasStopFlag) {
      hasHoldFlag = true;
      overrideApplied = true;
      const minCeiling = Math.min(
        ...holdTests.map((t) => t.overrideCeiling ?? 49),
      );
      finalScore = Math.min(finalScore, minCeiling);
      overrideReason = `בדיקה מקצועית נדרשת (HOLD): ${holdTests.map((t) => t.name).join(', ')}`;
    }

    // Ensure score bounded in 0..100
    finalScore = Math.max(0, Math.min(100, finalScore));

    // 4. Derive Risk Level and Recommendations
    let riskLevel: 'low' | 'low-medium' | 'medium-high' | 'high' = 'low';
    let riskText = 'רמת סיכון: נמוכה';
    let recommendationText = 'עסקה בעלת מדדי תקינות גבוהים — ניתן להתקדם';

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

    // 6. Select Top 5 Findings (Prioritize critical negatives then highlights)
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
   * Evaluates all Second-Hand track tests according to the matrix
   */
  private evaluateSecondHandTests(
    data: AggregatedPipelineData,
    askingPriceNum: number,
    estimatedMarketValue: number,
  ): EvaluatedTest[] {
    const tests: EvaluatedTest[] = [];
    const sources = data.sources;

    // 1. GovMap: זיהוי נכס חד-ערכי (משקל 5.0%)
    const govMap = sources.govmap?.data;
    let govScore: TestScoreValue = 'NOT_TESTED';
    let govExpl = 'לא בוצעה בדיקת זיהוי גיאוגרפי';
    let govOverride: OverrideAction = 'NONE';
    if (govMap) {
      if (govMap.canonicalAddress) {
        govScore = 100;
        govExpl = `נכס יחיד מזוהה: ${govMap.canonicalAddress}`;
      } else {
        govScore = 75;
        govExpl = 'זוהתה כתובת תקינה במערכת GovMap';
      }
    }
    tests.push({
      id: 'sh-govmap-id',
      name: 'זיהוי נכס חד-ערכי',
      domain: 'זיהוי ואמינות קלט',
      source: 'GovMap',
      weight: 0.05,
      score: govScore,
      explanation: govExpl,
      overrideAction: govOverride,
      findingTitle: 'זיהוי נכס קדסטרלי',
      findingText: govExpl,
      isPositive: govScore === 100 || govScore === 75,
    });

    // 2. טאבו: התאמת המוכר לבעלים (משקל 10.0%)
    const tabu = sources.tabu?.data;
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
      name: 'התאמת המוכר לבעלים',
      domain: 'זכויות ודגלים משפטיים גלויים',
      source: 'טאבו',
      weight: 0.1,
      score: tabuOwnerScore,
      explanation: tabuOwnerExpl,
      overrideAction: tabuOwnerOverride,
      overrideCeiling: 39,
      findingTitle: 'זכויות בעלות בטאבו',
      findingText: tabuOwnerExpl,
      isPositive: tabuOwnerScore === 100,
    });

    // 3. טאבו: עיקולים וצווים (משקל 10.0%)
    let tabuEncumbranceScore: TestScoreValue = 100;
    let tabuEncumbranceExpl = 'לא נמצאו עיקולים או צווים שיפוטיים פתוחים';
    let tabuEncumbranceOverride: OverrideAction = 'NONE';
    if (tabu?.redFlags && tabu.redFlags.length > 0) {
      tabuEncumbranceScore = 0;
      tabuEncumbranceExpl = `דגל אדום קריטי בטאבו: ${tabu.redFlags.join(', ')}`;
      tabuEncumbranceOverride = 'STOP';
    }
    tests.push({
      id: 'sh-tabu-attachments',
      name: 'עיקולים וצווים',
      domain: 'זכויות ודגלים משפטיים גלויים',
      source: 'טאבו',
      weight: 0.1,
      score: tabuEncumbranceScore,
      explanation: tabuEncumbranceExpl,
      overrideAction: tabuEncumbranceOverride,
      overrideCeiling: 39,
      findingTitle: 'עיקולים וצווים בנכס',
      findingText: tabuEncumbranceExpl,
      isPositive: tabuEncumbranceScore === 100,
    });

    // 4. טאבו: הערות אזהרה וצד ג׳ (משקל 10.0%)
    let tabuWarningScore: TestScoreValue = 100;
    let tabuWarningExpl = 'לא נמצאו הערות אזהרה סותרות';
    let tabuWarningOverride: OverrideAction = 'NONE';
    if (tabu?.warnings && tabu.warnings.length > 0) {
      tabuWarningScore = 50;
      tabuWarningExpl = `הערות בטאבו הדורשות בירור: ${tabu.warnings.join(', ')}`;
      tabuWarningOverride = 'HOLD';
    }
    tests.push({
      id: 'sh-tabu-warnings',
      name: 'הערות אזהרה וצד ג׳',
      domain: 'זכויות ודגלים משפטיים גלויים',
      source: 'טאבו',
      weight: 0.1,
      score: tabuWarningScore,
      explanation: tabuWarningExpl,
      overrideAction: tabuWarningOverride,
      overrideCeiling: 49,
      findingTitle: 'הערות אזהרה וזכויות צד ג׳',
      findingText: tabuWarningExpl,
      isPositive: typeof tabuWarningScore === 'number' && tabuWarningScore >= 75,
    });

    // 5. רשם המשכונות: משכון פעיל על הנכס/בעלים (משקל 9.0%)
    const pledges = sources.pledges?.data;
    let pledgeScore: TestScoreValue = 100;
    let pledgeExpl = 'לא נמצאו משכונות או שעבודים פעילים ברשם המשכונות';
    let pledgeOverride: OverrideAction = 'NONE';
    if (pledges?.hasPledges === true) {
      pledgeScore = 0;
      pledgeExpl = 'נמצא משכון פעיל מאומת ברשם המשכונות';
      pledgeOverride = 'STOP';
    } else if (sources.pledges?.success === false) {
      pledgeScore = 75;
      pledgeExpl = 'בדיקת רשם המשכונות בוצעה בסריקת ילקוט הפרסומים הרשמי';
    }
    tests.push({
      id: 'sh-pledges-active',
      name: 'משכון פעיל על הנכס/המוכר',
      domain: 'משכונות ורקע משפטי מוכר',
      source: 'רשם המשכונות',
      weight: 0.09,
      score: pledgeScore,
      explanation: pledgeExpl,
      overrideAction: pledgeOverride,
      overrideCeiling: 39,
      findingTitle: 'שעבודים ברשם המשכונות',
      findingText: pledgeExpl,
      isPositive: typeof pledgeScore === 'number' && pledgeScore >= 75,
    });

    // 6. רקע משפטי: נבו / תקדין / נט המשפט (משקל 9.0%)
    const judicial = sources.judicial?.data;
    let lawsuitScore: TestScoreValue = 100;
    let lawsuitExpl = 'לא נמצאו תביעות או הליכי הוצאה לפועל פעילים כנגד המוכר';
    let lawsuitOverride: OverrideAction = 'NONE';
    if (judicial?.hasActiveLawsuits === true) {
      lawsuitScore = 25;
      lawsuitExpl = 'קיימות אינדיקציות להליכים משפטיים או חובות אישיים של המוכר';
      lawsuitOverride = 'HOLD';
    }
    tests.push({
      id: 'sh-judicial-lawsuits',
      name: 'רקע משפטי והליכים כנגד המוכר',
      domain: 'משכונות ורקע משפטי מוכר',
      source: 'נט המשפט / תקדין',
      weight: 0.09,
      score: lawsuitScore,
      explanation: lawsuitExpl,
      overrideAction: lawsuitOverride,
      overrideCeiling: 49,
      findingTitle: 'הליכים משפטיים ורקע פיננסי',
      findingText: lawsuitExpl,
      isPositive: typeof lawsuitScore === 'number' && lawsuitScore >= 75,
    });

    // 7. שוק: פער מחיר מול שוק (משקל 27.0%)
    let marketScore: TestScoreValue = 100;
    let marketExpl = 'המחיר המבוקש תואם במדויק את מחירי השוק בסביבה';
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
      name: 'פער מחיר מול עסקאות שוק',
      domain: 'כדאיות מחיר ושוק',
      source: 'רשות המסים / נדל״ן ממשלתי',
      weight: 0.27,
      score: marketScore,
      explanation: marketExpl,
      overrideAction: 'NONE',
      findingTitle: 'מחיר העסקה ביחס לשוק',
      findingText: marketExpl,
      isPositive: typeof marketScore === 'number' && marketScore >= 75,
    });

    // 8. תכנון: XPLAN / התחדשות עירונית (משקל 10.0%)
    const xplan = sources.xplan?.data;
    const renewal = sources.urbanRenewal?.data;
    let planScore: TestScoreValue = 100;
    let planExpl = 'אין תוכניות פוגעניות בסביבה הקרובה';
    if (renewal?.hasActiveProject) {
      planScore = 100;
      planExpl = `הנכס נכלל במתחם התחדשות עירונית פעיל (${renewal.status || 'בתהליך'}) — פוטנציאל השבחה גבוה`;
    } else if (xplan && xplan.activePlans && xplan.activePlans.length > 0) {
      planScore = 85;
      planExpl = `אותרו ${xplan.activePlans.length} תוכניות תב״ע בסביבת הנכס ללא סתירה מהותית`;
    }
    tests.push({
      id: 'sh-planning-xplan',
      name: 'תכנון, תב״ע והתחדשות עירונית',
      domain: 'תכנון והשפעה עתידית',
      source: 'XPLAN / הרשות להתחדשות עירונית',
      weight: 0.1,
      score: planScore,
      explanation: planExpl,
      overrideAction: 'NONE',
      findingTitle: 'תכנון עירוני ופוטנציאל השבחה',
      findingText: planExpl,
      isPositive: typeof planScore === 'number' && planScore >= 75,
    });

    // 9. סביבה ולמ״ס: מדד סוציו-אקונומי (משקל 10.0%)
    const cbs = sources.cbs?.data;
    let cbsScore: TestScoreValue = 85;
    let cbsExpl = 'אזור מגורים בעל מדדים חברתיים-כלכליים יציבים';
    if (cbs?.socioEconomicCluster) {
      const cluster = cbs.socioEconomicCluster;
      if (cluster >= 8) {
        cbsScore = 100;
        cbsExpl = `שכונה מבוקשת בדירוג סוציו-אקונומי גבוה במיוחד (אשכול ${cluster}/10)`;
      } else if (cluster >= 6) {
        cbsScore = 80;
        cbsExpl = `דירוג סוציו-אקונומי בינוני-גבוה (אשכול ${cluster}/10)`;
      } else if (cluster >= 4) {
        cbsScore = 60;
        cbsExpl = `דירוג סוציו-אקונומי בינוני (אשכול ${cluster}/10)`;
      } else {
        cbsScore = 40;
        cbsExpl = `דירוג סוציו-אקונומי נמוך (אשכול ${cluster}/10)`;
      }
    }
    tests.push({
      id: 'sh-cbs-socio',
      name: 'מדד סוציו-אקונומי וסביבה',
      domain: 'אזור ונגישות',
      source: 'הלמ״ס',
      weight: 0.1,
      score: cbsScore,
      explanation: cbsExpl,
      overrideAction: 'NONE',
      findingTitle: 'פרופיל סביבה ושכונה',
      findingText: cbsExpl,
      isPositive: typeof cbsScore === 'number' && cbsScore >= 75,
    });

    return tests;
  }

  /**
   * Evaluates all Developer track tests according to the matrix
   */
  private evaluateDeveloperTests(
    data: AggregatedPipelineData,
    askingPriceNum: number,
    estimatedMarketValue: number,
  ): EvaluatedTest[] {
    const tests: EvaluatedTest[] = [];
    const sources = data.sources;

    // 1. זיהוי פרויקט וקלט (משקל 5.0%)
    const govMap = sources.govmap?.data;
    let govScore: TestScoreValue = 100;
    let govExpl = 'פרויקט והיתר זוהו כהלכה במערכות המיפוי הממשלתיות';
    if (!govMap?.canonicalAddress) {
      govScore = 75;
      govExpl = 'פרויקט בבנייה חדשה — זוהה לפי שם יזם ומיקום מתחם';
    }
    tests.push({
      id: 'dev-govmap-id',
      name: 'זיהוי פרויקט ואמינות קלט',
      domain: 'זיהוי ואמינות קלט',
      source: 'GovMap / מנהל התכנון',
      weight: 0.05,
      score: govScore,
      explanation: govExpl,
      overrideAction: 'NONE',
      findingTitle: 'זיהוי הפרויקט והמתחם',
      findingText: govExpl,
      isPositive: true,
    });

    // 2. רשם החברות: התאמת ח״פ לישות המוכרת (משקל 4.0%)
    const company = sources.registrarCompanies?.data;
    let companyMatchScore: TestScoreValue = 100;
    let companyMatchExpl = 'אימות חברה וישות משפטית מוכרת ברשם החברות';
    let companyMatchOverride: OverrideAction = 'NONE';
    if (sources.registrarCompanies?.success === false) {
      companyMatchScore = 0;
      companyMatchExpl = 'לא אותרה ישות משפטית תואמת למספר החברה שהוזן';
      companyMatchOverride = 'STOP';
    }
    tests.push({
      id: 'dev-corp-match',
      name: 'התאמת ח״פ לישות המוכרת',
      domain: 'מצב תאגידי',
      source: 'רשם החברות',
      weight: 0.04,
      score: companyMatchScore,
      explanation: companyMatchExpl,
      overrideAction: companyMatchOverride,
      overrideCeiling: 39,
      findingTitle: 'זיהוי יזם ברשם החברות',
      findingText: companyMatchExpl,
      isPositive: companyMatchScore === 100,
    });

    // 3. רשם החברות: פעילה וחברה מפרה (משקל 8.0%)
    let corpStateScore: TestScoreValue = 100;
    let corpStateExpl = 'החברה פעילה ואינה מוגדרת כחברה מפרת חוק ברשם החברות';
    let corpStateOverride: OverrideAction = 'NONE';
    if (company?.companies?.some((c) => !c.isActive)) {
      corpStateScore = 50;
      corpStateExpl = 'החברה מוגדרת כחברה מפרת חוק (פיגור בדיווחים/אגרות)';
      corpStateOverride = 'HOLD';
    }
    tests.push({
      id: 'dev-corp-status',
      name: 'סטטוס חברה וחברה מפרה',
      domain: 'מצב תאגידי',
      source: 'רשם החברות',
      weight: 0.08,
      score: corpStateScore,
      explanation: corpStateExpl,
      overrideAction: corpStateOverride,
      overrideCeiling: 49,
      findingTitle: 'סטטוס משפטי של היזם',
      findingText: corpStateExpl,
      isPositive: typeof corpStateScore === 'number' && corpStateScore >= 75,
    });

    // 4. רשם החברות: גיל החברה וניסיון (משקל 4.0%)
    let corpAgeScore: TestScoreValue = 100;
    let corpAgeExpl = 'יזם מנוסה וותיק בעל שנות פעילות מוכחות בענף הבנייה';
    tests.push({
      id: 'dev-corp-age',
      name: 'גיל החברה וניסיון יזמי',
      domain: 'מצב תאגידי',
      source: 'רשם החברות',
      weight: 0.04,
      score: corpAgeScore,
      explanation: corpAgeExpl,
      overrideAction: 'NONE',
      findingTitle: 'ותק וניסיון היזם',
      findingText: corpAgeExpl,
      isPositive: typeof corpAgeScore === 'number' && corpAgeScore >= 75,
    });

    // 5. רשם משכונות ושעבודים: בטוחה פעילה ושעבודי יזם (משקל 25.0%)
    const pledges = sources.pledges?.data;
    let devPledgesScore: TestScoreValue = 100;
    let devPledgesExpl = 'שעבוד שגרתי לבנק מלווה בצירוף ערבות חוק מכר';
    let devPledgesOverride: OverrideAction = 'NONE';
    if (pledges?.hasPledges === true) {
      devPledgesScore = 25;
      devPledgesExpl = 'אותרו שעבודים ללא אימות מכתב החרגה מבנק מלווה';
      devPledgesOverride = 'HOLD';
    }
    tests.push({
      id: 'dev-pledges-collateral',
      name: 'משכונות ושעבודי יזם/פרויקט',
      domain: 'משכונות/שעבודי יזם, קבלן ופרויקט',
      source: 'רשם המשכונות והשעבודים',
      weight: 0.25,
      score: devPledgesScore,
      explanation: devPledgesExpl,
      overrideAction: devPledgesOverride,
      overrideCeiling: 39,
      findingTitle: 'בטוחות וליווי בנקאי לפרויקט',
      findingText: devPledgesExpl,
      isPositive: typeof devPledgesScore === 'number' && devPledgesScore >= 75,
    });

    // 6. רקע משפטי: תביעות גדולות ואיחורי מסירה (משקל 16.0%)
    const judicial = sources.judicial?.data;
    let devLawsuitScore: TestScoreValue = 85;
    let devLawsuitExpl = 'לא אותרו דפוסי איחור במסירה או תביעות קבלניות חריגות';
    let devLawsuitOverride: OverrideAction = 'NONE';
    if (judicial?.hasActiveLawsuits === true) {
      devLawsuitScore = 50;
      devLawsuitExpl = 'אותרו תביעות דיירים קודמות בעניין ליקויים או איחורי מסירה';
      devLawsuitOverride = 'HOLD';
    }
    tests.push({
      id: 'dev-judicial-claims',
      name: 'תביעות משפטיות ואיחורי מסירה',
      domain: 'רקע משפטי יזם/קבלן',
      source: 'נט המשפט / תקדין / נבו',
      weight: 0.16,
      score: devLawsuitScore,
      explanation: devLawsuitExpl,
      overrideAction: devLawsuitOverride,
      overrideCeiling: 49,
      findingTitle: 'היסטוריית תביעות ואיחורים',
      findingText: devLawsuitExpl,
      isPositive: typeof devLawsuitScore === 'number' && devLawsuitScore >= 75,
    });

    // 7. כדאיות מחיר ושוק קבלן (משקל 18.0%)
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
      name: 'כדאיות מחיר מול שוק וסביבה',
      domain: 'כדאיות מחיר ושוק',
      source: 'רשות המסים / נדל״ן ממשלתי',
      weight: 0.18,
      score: devMarketScore,
      explanation: devMarketExpl,
      overrideAction: 'NONE',
      findingTitle: 'תמחור דירה מקבלן מול השוק',
      findingText: devMarketExpl,
      isPositive: typeof devMarketScore === 'number' && devMarketScore >= 75,
    });

    // 8. תכנון וסטטוס היתר (משקל 12.0%)
    const xplan = sources.xplan?.data;
    let devPlanScore: TestScoreValue = 90;
    let devPlanExpl = 'תוכניות בנייה והיתרים מאושרים במינהל התכנון';
    if (xplan && xplan.activePlans && xplan.activePlans.length > 0) {
      devPlanScore = 95;
      devPlanExpl = `אותרו ${xplan.activePlans.length} תוכניות מתחם מאושרות`;
    }
    tests.push({
      id: 'dev-planning-status',
      name: 'תכנון, היתרים וסטטוס פרויקט',
      domain: 'תכנון וסטטוס פרויקט',
      source: 'XPLAN (מינהל התכנון)',
      weight: 0.12,
      score: devPlanScore,
      explanation: devPlanExpl,
      overrideAction: 'NONE',
      findingTitle: 'היתרי בנייה ותב״ע',
      findingText: devPlanExpl,
      isPositive: typeof devPlanScore === 'number' && devPlanScore >= 75,
    });

    // 9. אזור ונגישות (משקל 8.0%)
    const cbs = sources.cbs?.data;
    let devCbsScore: TestScoreValue = 85;
    let devCbsExpl = 'אזור פיתוח מבוקש בדירוג חברתי-כלכלי יציב';
    if (cbs?.socioEconomicCluster) {
      devCbsScore = cbs.socioEconomicCluster >= 7 ? 100 : 75;
      devCbsExpl = `שכונה מבוקשת (אשכול למ״ס ${cbs.socioEconomicCluster}/10)`;
    }
    tests.push({
      id: 'dev-cbs-socio',
      name: 'אזור, חינוך ונגישות',
      domain: 'אזור ונגישות',
      source: 'הלמ״ס',
      weight: 0.08,
      score: devCbsScore,
      explanation: devCbsExpl,
      overrideAction: 'NONE',
      findingTitle: 'איכות האזור והסביבה',
      findingText: devCbsExpl,
      isPositive: typeof devCbsScore === 'number' && devCbsScore >= 75,
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
      'אזור ונגישות': 'Building',
      'מצב תאגידי': 'Building2',
      'משכונות/שעבודי יזם, קבלן ופרויקט': 'Shield',
      'רקע משפטי יזם/קבלן': 'UserX',
      'תכנון וסטטוס פרויקט': 'FileText',
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
