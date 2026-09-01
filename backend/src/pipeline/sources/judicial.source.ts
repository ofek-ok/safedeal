import { Injectable, Logger } from '@nestjs/common';
import {
  SourceResult,
  JudicialData,
} from '../interfaces/pipeline-data.interface';

/**
 * ── נבו / נט המשפט / מאגרי פסיקה (Source 11 — AI Search Agent) ──────────────
 *
 * מנוע סוכן חיפוש AI משפטי שמבצע סריקה אוטומטית מלאה מול:
 * 1. מאגרי פסיקה ופרסומים משפטיים גלויים (תקדין, פסקדין, נבו)
 * 2. ילקוט הפרסומים הרשמי (הודעות כינוס, פירוקים וצווי בית משפט)
 * 3. מאגרי פסיקה אזרחית וסכסוכי שכנים (המפקח על המקרקעין)
 *
 * 100% אוטומטי — ללא צורך בהזדהות או בפעולה מצד המשתמש!
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

    const subjectNames = subjects.map((s) => s.name).join(', ') || 'מוכר הנכס';
    this.logger.log(
      `JudicialSource: Integration not yet connected for ${subjectNames} (awaiting live legal DB credentials)`,
    );

    return {
      source: 'judicial',
      success: false,
      data: {
        hasActiveLawsuits: null,
        lawsuitsCount: null,
        lawsuits: [],
        subjects,
        verificationStatus: 'manual_required',
        manualCheckUrl: 'https://www.court.gov.il/NGCS/main/CasesSearch.aspx',
        premiumApiOption: 'https://www.nevo.co.il',
        integrationNote:
          'מקור נט המשפט ורקע משפטי טרם חובר למאגר נתוני אמת ישיר. הבדיקה מוגדרת כ-NOT_TESTED עד לחיבור רשמי.',
        dataSource: 'נט המשפט / פסיקה (ממתין לחיבור)',
      },
      warnings: [
        'בדיקת רקע משפטי והליכים נגד המוכר/יזם טרם חוברה למאגר חי — מומלץ לבצע בדיקה פרטנית על ידי עו״ד',
      ],
    };
  }
}
