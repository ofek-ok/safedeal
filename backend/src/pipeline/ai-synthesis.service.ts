import { Injectable, Logger } from '@nestjs/common';
import { AggregatedPipelineData } from './interfaces/pipeline-data.interface';
import {
  SynthesizedReport,
  PillarData,
  RiskLevel,
  PropertyValuation,
} from './interfaces/synthesized-report.interface';

@Injectable()
export class AiSynthesisService {
  private readonly logger = new Logger(AiSynthesisService.name);

  synthesizeReport(
    aggregatedData: AggregatedPipelineData,
    payload?: any,
  ): SynthesizedReport {
    this.logger.log(
      `🤖 Synthesizing 11-source report — Job: ${aggregatedData.jobId}`,
    );

    const { sources, location, warnings } = aggregatedData;

    // ── SafeScore Calculation (0–100) ────────────────────────────────────────
    let score = 84; // base: assume clean property

    // Deductions for detected risk signals
    if (sources.tabu.data?.redFlags?.length) {
      score -= sources.tabu.data.redFlags.length * 6;
    }
    if (sources.tabu.data?.hasMortgage) {
      score -= 3; // minor — will be resolved at transfer
    }
    if (sources.municipal.data?.hasViolations) {
      score -= 8;
    }
    if (sources.municipal.data?.violationsCount > 1) {
      score -= 4;
    }
    if (sources.judicial.data?.hasActiveLawsuits === true) {
      score -= 25;
    }
    if (sources.xplan.data?.hasSignificantDevelopment) {
      score -= 4;
    }
    if (sources.registrarCompanies.data?.companies?.some((c) => !c.isActive)) {
      score -= 8;
    }

    // Bonus points for data richness
    if (sources.tabu.data?.extractionConfidence === 'high') {
      score += 3;
    }
    if (sources.cbs.data?.socioEconomicCluster >= 7) {
      score += 2;
    }

    score = Math.max(0, Math.min(100, score));

    // ── Risk Level ────────────────────────────────────────────────────────────
    let riskLevel: RiskLevel = 'low';
    let riskText = 'רמת תקינות גבוהה — נכס נקי משפטית';

    if (score < 60) {
      riskLevel = 'high';
      riskText = 'רמת סיכון גבוהה — נדרשת בדיקת עורך דין מעמיקה לפני כל פעולה';
    } else if (score < 74) {
      riskLevel = 'medium-high';
      riskText = 'רמת סיכון בינונית — מומלץ לברר דגשים תכנוניים ומשפטיים';
    } else if (score < 88) {
      riskLevel = 'low-medium';
      riskText = 'רמת תקינות גבוהה — נמצאו מספר דגשים לבירור עורך דין';
    }

    const fullAddress = `${location.street} ${location.houseNumber}, ${location.city}`;
    const cadastralStr = [
      `גוש ${location.block || '—'}`,
      `חלקה ${location.parcel || '—'}`,
      location.subParcel ? `תת-חלקה ${location.subParcel}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    // ── Property Valuation & Deal Fairness Engine (Yadata Style) ──────────────
    const area = parseFloat(payload?.details?.propertyArea || '85') || 85;
    const askingPriceNum =
      parseFloat((payload?.details?.askingPrice || '').replace(/,/g, '')) || 0;

    // Base price per sqm from Tax Authority or RealEstateGov or Default
    const basePsm =
      sources.taxAuthority.data?.avgPricePerSqm ||
      sources.realEstateGov.data?.avgPricePerSqmCity ||
      28500;

    // Feature Multiplier
    let featureMultiplier = 1.0;

    const condition = payload?.details?.condition || 'good';
    if (condition === 'new-contractor') featureMultiplier += 0.08;
    else if (condition === 'renovated') featureMultiplier += 0.06;
    else if (condition === 'needs-renovation') featureMultiplier -= 0.1;

    if (payload?.details?.hasMamad) featureMultiplier += 0.05;
    if (payload?.details?.hasParking) featureMultiplier += 0.05;
    if (payload?.details?.hasStorage) featureMultiplier += 0.03;
    if (payload?.details?.hasBalcony) featureMultiplier += 0.04;

    const floor = parseInt(payload?.details?.floorNumber || '1', 10) || 1;
    const hasElevator = payload?.details?.hasElevator;
    if (floor > 2 && !hasElevator) featureMultiplier -= 0.08;
    if (floor > 3 && hasElevator) featureMultiplier += 0.03;

    const estimatedPsm = Math.round(basePsm * featureMultiplier);
    const estimatedValue = Math.round(estimatedPsm * area);
    const minValue = Math.round(estimatedValue * 0.94);
    const maxValue = Math.round(estimatedValue * 1.06);

    let priceDiffPercent = 0;
    let dealFairness: 'fair' | 'underpriced' | 'overpriced' = 'fair';
    let fairnessLabel = 'תמחור הוגן בהתאם לשווי השוק המשוער בסביבה';

    if (askingPriceNum > 0) {
      priceDiffPercent = Math.round(
        ((askingPriceNum - estimatedValue) / estimatedValue) * 100,
      );
      if (priceDiffPercent > 5) {
        dealFairness = 'overpriced';
        fairnessLabel = `תמחור יתר: מחיר המוכר גבוה ב-${priceDiffPercent}% משווי השוק המשוער`;
      } else if (priceDiffPercent < -5) {
        dealFairness = 'underpriced';
        fairnessLabel = `הזדמנות: מחיר המוכר נמוך ב-${Math.abs(priceDiffPercent)}% משווי השוק המשוער`;
      }
    }

    const totalDeals = sources.taxAuthority.data?.totalDeals || 0;
    const confidenceLevel: 'high' | 'medium' | 'low' =
      totalDeals >= 5 ? 'high' : totalDeals >= 1 ? 'medium' : 'low';

    const confidenceReason =
      totalDeals > 0
        ? `מבוסס על ${totalDeals} עסקאות נדל"ן אמת מרשות המסים ברחוב/בשכונה`
        : 'מבוסס על מדדים כלליים של נדל"ן ממשלתי ונתוני למ"ס עירוניים';

    const comparableDeals = (
      sources.taxAuthority.data?.transactionHistory || []
    )
      .slice(0, 5)
      .map((d: any) => ({
        dealDate: d.date,
        address: fullAddress,
        rooms: d.rooms ? `${d.rooms} חדרים` : 'לא צוין',
        sqm: d.area || area,
        price: d.price,
        pricePerSqm: d.pricePerSqm || Math.round(d.price / (d.area || area)),
      }));

    const valuation: PropertyValuation = {
      estimatedValue,
      minValue,
      maxValue,
      askingPrice: askingPriceNum,
      priceDiffPercent,
      dealFairness,
      fairnessLabel,
      confidenceLevel,
      confidenceReason,
      comparableDeals,
    };

    // ── Build Pillar: Cadastral & Legal ──────────────────────────────────────
    const tabuOwners =
      sources.tabu.data?.owners?.map((o) => o.name).join(', ') ||
      'לא זוהה (מסמך לא הועלה)';
    const hasMortgage = sources.tabu.data?.hasMortgage ?? false;
    const hasLawsuits = sources.judicial.data?.hasActiveLawsuits;
    const tabuConfidence = sources.tabu.data?.extractionConfidence;

    const cadastralPillar: PillarData = {
      id: 'cadastral',
      title: '1. ציר קדסטרלי ומשפטי',
      subtitle: 'פנקסי מקרקעין, זכויות ושיעבודים',
      metrics: [
        {
          label: 'רישום בעלות',
          value:
            tabuOwners !== 'לא זוהה (מסמך לא הועלה)'
              ? `בעלות רשומה: ${tabuOwners}`
              : 'לא זוהה — נסח טאבו לא הועלה',
          status: (tabuConfidence && tabuConfidence !== 'none'
            ? 'green'
            : 'yellow') as 'green' | 'yellow' | 'red',
          details:
            tabuConfidence === 'high'
              ? `ניתוח Gemini בדיוק גבוה — ${tabuOwners}`
              : 'נדרש אימות ידני של נסח הטאבו',
        },
        {
          label: 'משכנתאות ועיקולים',
          value: hasMortgage
            ? `משכנתה פעילה: ${sources.tabu.data?.mortgages?.[0]?.creditorName || 'לא ידוע'}`
            : 'לא נמצאו משכנתאות פעילות',
          status: hasMortgage ? ('yellow' as const) : ('green' as const),
          details: hasMortgage
            ? 'יש לוודא מנגנון סילוק מלא של המשכנתה בחוזה המכר.'
            : 'הנכס נקי משיעבודים — תוצאה חיובית לעסקה.',
        },
        {
          label: 'הליכים משפטיים',
          value:
            hasLawsuits === true
              ? `נמצאו הליכים פתוחים`
              : hasLawsuits === false
                ? 'לא נמצאו תיקים משפטיים פתוחים'
                : 'נדרשת בדיקה ידנית ב-court.gov.il',
          status:
            hasLawsuits === true
              ? 'red'
              : hasLawsuits === false
                ? 'green'
                : 'yellow',
          details:
            hasLawsuits === null
              ? `לבדיקה: ${sources.judicial.data?.manualCheckUrl || 'court.gov.il'}`
              : '',
        },
      ],
    };

    // ── Build Pillar: Market & Economic ──────────────────────────────────────
    const avgPricePerSqm = sources.taxAuthority.data?.avgPricePerSqm;
    const cbsCluster = sources.cbs.data?.socioEconomicCluster;
    const cbsDesc = sources.cbs.data?.clusterDescription;
    const cityAvgPsm = sources.realEstateGov.data?.avgPricePerSqmCity;
    const yoyChange = sources.realEstateGov.data?.annualPriceChangePercent;

    const economicPillar: PillarData = {
      id: 'economic',
      title: '2. ציר שוק וכלכלי',
      subtitle: 'נתוני רשות המסים והשוואת שווי',
      metrics: [
        {
          label: 'מחיר ממוצע למ"ר (עסקאות דומות)',
          value: avgPricePerSqm
            ? `₪${avgPricePerSqm.toLocaleString('he-IL')} למ"ר (${sources.taxAuthority.data?.totalDeals || 0} עסקאות)`
            : 'נתון לא זמין — בדוק ב-nadlan.gov.il',
          status: avgPricePerSqm ? 'green' : 'yellow',
          details: avgPricePerSqm
            ? `מבוסס על ${sources.taxAuthority.data?.totalDeals} עסקאות נדל"ן מרשות המסים`
            : 'נדרשת בדיקה ידנית ב-nadlan.gov.il',
        },
        {
          label: 'מגמת מחירים עירונית',
          value:
            yoyChange !== null && yoyChange !== undefined
              ? `${yoyChange > 0 ? '+' : ''}${yoyChange}% שינוי שנתי ב${location.city}`
              : cityAvgPsm
                ? `ממוצע עירוני: ₪${cityAvgPsm.toLocaleString('he-IL')} למ"ר`
                : 'נתון לא זמין',
          status: yoyChange && yoyChange > 5 ? 'green' : 'yellow',
          details: 'נתוני מחירים מאגר הנדל"ן הממשלתי — nadlan.gov.il',
        },
        {
          label: 'מדד חברתי-כלכלי (הלמ"ס)',
          value: cbsCluster
            ? `אשכול ${cbsCluster} מתוך 10 — ${cbsDesc}`
            : 'נתון לא זמין',
          status:
            cbsCluster && cbsCluster >= 7
              ? 'green'
              : cbsCluster && cbsCluster >= 4
                ? 'yellow'
                : 'red',
          details: sources.cbs.data?.medianIncomeVsNational || '',
        },
      ],
    };

    // ── Build Pillar: Planning ────────────────────────────────────────────────
    const hasUrbanRenewal = sources.urbanRenewal.data?.hasActiveProject;
    const xplanCount = sources.xplan.data?.activePlansCount || 0;
    const xplanHasDevelopment = sources.xplan.data?.hasSignificantDevelopment;

    const planningPillar: PillarData = {
      id: 'planning',
      title: '3. ציר תכנוני',
      subtitle: 'ועדות תכנון, תב"ע והתחדשות עירונית',
      metrics: [
        {
          label: 'פינוי-בינוי / תמ"א 38',
          value: hasUrbanRenewal
            ? `✓ ${sources.urbanRenewal.data?.projectName || 'פרויקט התחדשות עירונית פעיל'}`
            : hasUrbanRenewal === false
              ? 'לא נמצאו פרויקטים פינוי-בינוי בגוש זה'
              : 'לא נבדק',
          status: hasUrbanRenewal ? 'green' : 'yellow',
          details: hasUrbanRenewal
            ? `סטטוס: ${sources.urbanRenewal.data?.status || 'בתהליך'}`
            : 'בדיקה מול data.gov.il — הרשות להתחדשות עירונית',
        },
        {
          label: 'תוכניות בניין עיר (XPLAN)',
          value:
            xplanCount > 0
              ? `נמצאו ${xplanCount} תוכניות פעילות ב-iplan.gov.il`
              : 'לא נמצאו תוכניות פעילות',
          status: xplanHasDevelopment ? 'yellow' : 'green',
          details: sources.xplan.data?.mainPlanName
            ? `תוכנית עיקרית: ${sources.xplan.data.mainPlanName}`
            : 'נתוני מינהל התכנון — mavat.iplan.gov.il',
        },
        {
          label: 'תוכניות עתידיות משמעותיות',
          value: xplanHasDevelopment
            ? 'נמצאו תוכניות עתידיות משמעותיות (פינוי/תשתית/תמ"א)'
            : 'לא נמצאו תוכניות בעלות השפעה מהותית',
          status: xplanHasDevelopment ? 'yellow' : 'green',
          details: 'מקור: ArcGIS REST API של מינהל התכנון',
        },
      ],
    };

    // ── Build Pillar: Engineering ─────────────────────────────────────────────
    const hasViolations = sources.municipal.data?.hasViolations;
    const openPermits = sources.municipal.data?.openPermitsCount || 0;
    const totalPermits = sources.municipal.data?.totalPermitsFound || 0;

    const engineeringPillar: PillarData = {
      id: 'engineering',
      title: '4. ציר הנדסי',
      subtitle: 'היתרי בנייה, ארכיב עירוני וטופס 4',
      metrics: [
        {
          label: 'היתרי בנייה שאותרו',
          value:
            totalPermits > 0
              ? `נמצאו ${totalPermits} רשומות היתרים (${openPermits} פתוחים)`
              : 'לא נמצאו רשומות בדאטה-ספט הלאומי',
          status: totalPermits > 0 ? 'green' : 'yellow',
          details: `מקור: data.gov.il — היתרי בנייה | ${sources.municipal.data?.cityPortalUrl || ''}`,
        },
        {
          label: 'חריגות בנייה',
          value: hasViolations
            ? `⚠️ נמצאו ${sources.municipal.data?.violationsCount || 1} חריגות בנייה`
            : 'לא נמצאו חריגות בנייה בדאטה-ספט',
          status: hasViolations ? 'red' : 'green',
          details: hasViolations
            ? 'נדרש אימות ידני מול הנדסת העירייה'
            : 'יש לאמת ידנית מול ארכיב ההנדסה העירוני',
        },
        {
          label: 'היתרים פתוחים / בתהליך',
          value:
            openPermits > 0
              ? `${openPermits} היתרים פתוחים — נדרשת בדיקה`
              : 'לא נמצאו היתרים פתוחים',
          status: openPermits > 0 ? 'yellow' : 'green',
          details: `לבדיקה מלאה: ${sources.municipal.data?.cityPortalUrl || 'data.gov.il'}`,
        },
      ],
    };

    // ── Operative Next Steps (dynamic based on findings) ──────────────────────
    const nextSteps: SynthesizedReport['operativeNextSteps'] = [];

    if (hasMortgage) {
      nextSteps.push({
        id: 'step-mortgage',
        target: 'עורך דין',
        title: 'וידוא מנגנון סילוק המשכנתה',
        description:
          'יש לוודא כי בחוזה המכר מוגדר מנגנון ברור לפירעון המשכנתה הקיימת ומכתב כוונות מהבנק.',
      });
    }
    if (hasViolations) {
      nextSteps.push({
        id: 'step-violations',
        target: 'שמאי',
        title: 'בדיקת חריגות הבנייה שאותרו',
        description:
          'פנה לעיריה לקבלת תיק הבניין המלא ולוודא שאין עסקינן בחריגות שאינן ניתנות להכשרה.',
      });
    }
    if (hasLawsuits === null) {
      nextSteps.push({
        id: 'step-judicial',
        target: 'עורך דין',
        title: 'בדיקת הליכים משפטיים פתוחים',
        description: `בדוק ב-court.gov.il ובנט המשפט את כל צדדי העסקה. ${sources.judicial.data?.subjects?.map((s) => s.name).join(', ') || ''}`,
      });
    }
    if (sources.pledges.data?.verificationStatus === 'manual_required') {
      nextSteps.push({
        id: 'step-pledges',
        target: 'עורך דין',
        title: 'בדיקת רשם המשכונות',
        description: `${sources.pledges.data.integrationNote} | ${sources.pledges.data.manualCheckUrl}`,
      });
    }
    if (xplanHasDevelopment) {
      nextSteps.push({
        id: 'step-xplan',
        target: 'שמאי',
        title: 'הערכת השפעת תוכניות עתידיות על ערך הנכס',
        description:
          'בדוק את תוכניות XPLAN שנמצאו ב-mavat.iplan.gov.il — ייתכנו תוכניות שישפיעו על ערך הנכס לטובה או לרעה.',
      });
    }

    // Always add: lawyer review
    nextSteps.push({
      id: 'step-lawyer',
      target: 'עורך דין',
      title: 'בדיקת הסכם המכר על ידי עורך דין מקרקעין',
      description:
        'לפני חתימה על כל מסמך, הסכם מכר צריך לעבור בדיקה של עורך דין מתמחה במקרקעין.',
    });

    // ── Final Report ──────────────────────────────────────────────────────────
    return {
      jobId: aggregatedData.jobId,
      generatedAt: new Date().toISOString(),
      safeScore: score,
      riskLevel,
      riskText,
      property: {
        address: fullAddress,
        cadastral: cadastralStr,
        askingPrice: payload?.details?.askingPrice ? `₪${payload.details.askingPrice}` : 'לא צוין',
        areaSqm: payload?.details?.propertyArea ? `${payload.details.propertyArea} מ"ר` : 'לא צוין',
        rooms: payload?.details?.roomsCount ? `${payload.details.roomsCount} חדרים` : 'לא צוין',
      },
      valuation,
      executiveSummary: {
        title: 'תמצית בדיקת נאותות — דוח SafeDeal',
        badgeText:
          score >= 80
            ? 'נכס תקין — בכפוף לבירורים'
            : score >= 60
              ? 'נמצאו ממצאים — נדרשת עדיפות'
              : 'סיכון גבוה — בדיקה מעמיקה נדרשת',
        overview: `נכס המגורים ברחוב ${location.street} ${location.houseNumber} ב${location.city} נבדק מול 11 מקורות מידע ממשלתיים ומוסדיים. ציון SafeScore: ${score}/100 — ${riskText}. להלן הממצאים העיקריים הדורשים תשומת לב.`,
        strengths: [
          sources.cbs.data?.socioEconomicCluster >= 7
            ? `אזור בעל מדד חברתי-כלכלי גבוה (אשכול ${sources.cbs.data.socioEconomicCluster} — ${sources.cbs.data.clusterDescription})`
            : `אזור עם פוטנציאל גידול ערך (אשכול ${sources.cbs.data?.socioEconomicCluster || '—'})`,
          !hasMortgage
            ? 'נכס נקי ממשכנתאות ושיעבודים — מפשט את העסקה'
            : 'ניתן לסלק את המשכנתה הקיימת במסגרת העסקה',
          !hasViolations
            ? 'לא אותרו חריגות בנייה בנתוני data.gov.il'
            : 'חריגות הבנייה שאותרו ניתנות לבחינה והכשרה',
        ].filter(Boolean),
        riskPoints: [
          sources.pledges.data?.verificationStatus === 'manual_required'
            ? 'בדיקת רשם המשכונות טרם בוצעה — נדרש אימות ידני'
            : null,
          sources.judicial.data?.hasActiveLawsuits === null
            ? 'בדיקת הליכים משפטיים טרם אומתה — נדרש אימות ב-court.gov.il'
            : null,
          hasViolations
            ? `נמצאו ${sources.municipal.data?.violationsCount} חריגות בנייה בדאטה-ספט — נדרשת בדיקה עירונית`
            : null,
          xplanHasDevelopment
            ? 'נמצאו תוכניות עתידיות משמעותיות באזור — ייתכן השפעה על ערך הנכס'
            : null,
        ].filter(Boolean) as string[],
      },
      pillars: {
        cadastral: cadastralPillar,
        economic: economicPillar,
        planning: planningPillar,
        engineering: engineeringPillar,
      },
      operativeNextSteps: nextSteps,
      missingDataWarnings: warnings,
      sourceStatuses: [
        {
          sourceId: 'govmap',
          sourceName: 'GovMap (זיהוי קדסטרלי)',
          status: sources.govmap.success ? 'success' : 'warning',
        },
        {
          sourceId: 'taxAuthority',
          sourceName: 'רשות המסים (עסקאות השוואה)',
          status: sources.taxAuthority.success ? 'success' : 'warning',
        },
        {
          sourceId: 'realEstateGov',
          sourceName: 'נדל"ן ממשלתי (סטטיסטיקות)',
          status: sources.realEstateGov.success ? 'success' : 'warning',
        },
        {
          sourceId: 'xplan',
          sourceName: 'XPLAN — מינהל התכנון',
          status: sources.xplan.success ? 'success' : 'warning',
        },
        {
          sourceId: 'cbs',
          sourceName: 'הלמ"ס (מדד חברתי-כלכלי)',
          status: sources.cbs.success ? 'success' : 'warning',
        },
        {
          sourceId: 'urbanRenewal',
          sourceName: 'הרשות להתחדשות עירונית',
          status: sources.urbanRenewal.success ? 'success' : 'warning',
        },
        {
          sourceId: 'tabu',
          sourceName: 'נסח טאבו + Gemini OCR',
          status:
            sources.tabu.success &&
            sources.tabu.data?.extractionConfidence !== 'none'
              ? 'success'
              : 'warning',
        },
        {
          sourceId: 'municipal',
          sourceName: 'היתרי בנייה (כל ישראל)',
          status: sources.municipal.success ? 'success' : 'warning',
        },
        {
          sourceId: 'registrarCompanies',
          sourceName: 'רשם החברות',
          status: sources.registrarCompanies.success ? 'success' : 'warning',
        },
        { sourceId: 'pledges', sourceName: 'רשם המשכונות', status: 'warning' }, // always manual
        {
          sourceId: 'judicial',
          sourceName: 'נט המשפט / נבו',
          status: 'warning',
        }, // always manual
      ],
    };
  }
}
