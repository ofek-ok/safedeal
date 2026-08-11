import { Injectable, Logger } from '@nestjs/common';
import {
  SourceResult,
  JudicialData,
} from '../interfaces/pipeline-data.interface';

/**
 * ── נבו / נט המשפט (Source 11) ──────────────────────────────────────────────
 *
 * מציאות: court.gov.il דורש זיהוי אקטיבי של הגורם המחפש (כניסה עם שם משתמש
 * וסיסמה לפורטל עורכי הדין/הציבור). לא ניתן לאוטמט בלי אישור.
 *
 * אפשרויות אינטגרציה:
 *
 * 1. Nevo Premium API (https://www.nevo.co.il) — חברת Nevo מנגישה נתוני
 *    פסיקה ותיקים משפטיים לגופים מורשים. יש API מסחרי בתשלום חודשי.
 *    מתאים ביותר ל-SafeDeal כפתרון FinTech.
 *
 * 2. ממשק עורכי דין — court.gov.il מספקת ממשק ייעודי לעורכי דין רשומים.
 *    SafeDeal יכולה לפעול כשותף עם משרד עו"ד לשם ביצוע בדיקות.
 *
 * 3. פורטל ציבורי — ניתן לחפש תיקים פתוחים ב-court.gov.il
 *    אך עם הגבלות CAPTCHA שמונעות אוטומציה ישירה.
 *
 * 4. שיתוף פעולה עם LexisNexis / ועד לשכת עורכי הדין לגישה מאוחדת.
 *
 * במצב הנוכחי: החזרת מידע מסייע לבדיקה ידנית.
 */

@Injectable()
export class JudicialSource {
  private readonly logger = new Logger(JudicialSource.name);

  async fetch(params: {
    sellerName?: string;
    sellerId?: string;
    buyerName?: string;
    buyerId?: string;
  }): Promise<SourceResult<JudicialData>> {
    const subjects = [
      params.sellerName && {
        role: 'מוכר',
        name: params.sellerName,
        id: params.sellerId,
      },
      params.buyerName && {
        role: 'קונה',
        name: params.buyerName,
        id: params.buyerId,
      },
    ].filter(Boolean) as { role: string; name: string; id?: string }[];

    this.logger.log(
      `JudicialSource: Providing manual verification guidance for ${subjects.map((s) => s.name).join(', ')}`,
    );

    const manualCheckUrl =
      'https://www.court.gov.il/NGCS/main/CasesSearch.aspx';
    const nevojUrl = 'https://www.nevo.co.il';

    return {
      source: 'judicial',
      success: true,
      data: {
        hasActiveLawsuits: null, // Cannot be determined automatically
        lawsuitsCount: null,
        lawsuits: [],
        subjects,
        verificationStatus: 'manual_required',
        manualCheckUrl,
        premiumApiOption: nevojUrl,
        integrationNote: [
          'בדיקת נסח משפטי דורשת זיהוי ואינה ניתנת לאוטמציה ישירה.',
          `בדיקה ציבורית: ${manualCheckUrl}`,
          `לאינטגרציה מלאה — Nevo Premium API: ${nevojUrl}`,
        ].join(' | '),
        dataSource: 'בית המשפט — court.gov.il / נבו',
      },
      warnings:
        subjects.length > 0
          ? subjects.map(
              (s) =>
                `נא לבדוק ${s.role} (${s.name}${s.id ? ` / ת"ז: ${s.id}` : ''}) ב: ${manualCheckUrl}`,
            )
          : ['לא סופקו פרטי צדדים לבדיקה משפטית'],
    };
  }
}
