import { Injectable, Logger } from '@nestjs/common';
import {
  SourceResult,
  PledgesData,
} from '../interfaces/pipeline-data.interface';

/**
 * ── רשם המשכונות (Source 10) ────────────────────────────────────────────────
 *
 * מציאות: האתר gov.il/he/service/pawn_perusal דורש תשלום אגרה (₪23 לשאילתה)
 * דרך שער תשלומים ממשלתי. לא ניתן לאוטמט ישירות.
 *
 * אפשרויות אינטגרציה אמיתיות:
 *
 * 1. API ממשלתי (GaaS) — הממשלה פועלת להנגיש APIs לשירותים דיגיטליים.
 *    כדי לקבל גישה, יש לפנות ל: https://www.gov.il/he/departments/guides/api_access
 *    ולהגיש בקשה כגוף מורשה (עורך דין, סוכנות נדל"ן, FinTech מוסמך).
 *
 * 2. מרכז שירות ממשלתי מורשה — חברות כגון:
 *    - DigiSign (https://www.digisign.co.il) — מנגישות שירותי ממשל דיגיטלי
 *    - Clearbit Legal / Nevo Premium — נתוני שיעבודים עסקיים
 *    כדרך עוקף לגישה ל-API.
 *
 * 3. Webhook + Upload — המשתמש מבצע בדיקת שיעבוד בעצמו (משלם ₪23),
 *    מעלה את ה-PDF התוצאתי, והמערכת מנתחת אותו באמצעות Gemini.
 *
 * במצב הנוכחי: החזרת מידע שמסייע למשתמש לבצע בדיקה ידנית.
 */

@Injectable()
export class PledgesSource {
  private readonly logger = new Logger(PledgesSource.name);

  async fetch(params: {
    block: string;
    parcel: string;
    ownerName?: string;
    ownerId?: string;
  }): Promise<SourceResult<PledgesData>> {
    this.logger.log(
      `PledgesSource: Providing manual verification guidance for block=${params.block}`,
    );

    const manualCheckUrl = `https://www.gov.il/he/service/pawn_perusal`;
    const searchReference = [
      params.ownerName ? `שם: ${params.ownerName}` : null,
      params.ownerId ? `ת"ז/ח"פ: ${params.ownerId}` : null,
      `גוש: ${params.block}`,
      `חלקה: ${params.parcel}`,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      source: 'pledges',
      success: true,
      data: {
        // Cannot be determined automatically — requires paid gov.il lookup
        hasPledges: null,
        pledgesCount: null,
        pledges: [],
        verificationStatus: 'manual_required',
        manualCheckUrl,
        searchReference,
        estimatedFee: '₪23 לבדיקה',
        integrationNote: [
          'בדיקת שיעבודים דורשת תשלום אגרה ממשלתית ואינה ניתנת לאוטמציה ישירה.',
          'לצורך בדיקה ידנית, בקר ב: gov.il/he/service/pawn_perusal',
          'לאינטגרציה עסקית מלאה, ניתן לפנות ל-DigiSign או לבקש API ממשלתי מורשה.',
        ].join(' '),
        dataSource: 'רשם המשכונות — משרד המשפטים',
      },
      warnings: [
        'בדיקת רשם המשכונות דורשת תשלום אגרה ובדיקה ידנית.',
        `לביצוע בדיקה: ${manualCheckUrl} (${searchReference})`,
      ],
    };
  }
}
