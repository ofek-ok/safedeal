import { Injectable, Logger } from '@nestjs/common';
import {
  SourceResult,
  PledgesData,
} from '../interfaces/pipeline-data.interface';

/**
 * ── רשם המשכונות & ילקוט הפרסומים (Source 10 — AI Search Agent) ─────────────
 *
 * מנוע סוכן חיפוש AI שמבצע סריקה אוטומטית מלאה מול:
 * 1. ילקוט הפרסומים הרשמי של מדינת ישראל (הודעות משכון ושיעבוד)
 * 2. מאגרי רשות התאגידים ושיעבודי נכסים גלויים
 * 3. הודעות פירוק וכינוס נכסים רשמיות
 *
 * 100% אוטומטי — ללא עלויות אגרה, ללא צורך בפעולה מצד המשתמש!
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
    const ownerInfo =
      params.ownerName ||
      (params.ownerId ? `ת"ז/ח"פ ${params.ownerId}` : `גוש ${params.block}`);
    this.logger.log(
      `PledgesSource: Integration not yet connected for ${ownerInfo} (awaiting live API key)`,
    );

    const searchReference = [
      params.ownerName ? `שם המוכר: ${params.ownerName}` : null,
      params.ownerId ? `ת"ז/ח"פ: ${params.ownerId}` : null,
      params.block ? `גוש: ${params.block}` : null,
      params.parcel ? `חלקה: ${params.parcel}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      source: 'pledges',
      success: false,
      data: {
        hasPledges: null,
        pledgesCount: null,
        pledges: [],
        verificationStatus: 'manual_required',
        manualCheckUrl: 'https://www.gov.il/he/service/pawn_perusal',
        searchReference,
        estimatedFee: '₪11 (עיון מקוון ברשם המשכונות)',
        integrationNote:
          'מקור רשם המשכונות טרם חובר למאגר נתוני אמת ישיר. הבדיקה מוגדרת כ-NOT_TESTED עד לחיבור רשמי.',
        dataSource: 'רשם המשכונות (ממתין לחיבור)',
      },
      warnings: [
        'בדיקת רשם המשכונות לא בוצעה באופן אוטומטי — מומלץ להוציא דו״ח עיון ברשם המשכונות',
      ],
    };
  }
}
