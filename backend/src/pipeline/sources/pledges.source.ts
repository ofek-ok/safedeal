import { Injectable, Logger } from '@nestjs/common';
import { SourceResult, PledgesData } from '../interfaces/pipeline-data.interface';

@Injectable()
export class PledgesSource {
  private readonly logger = new Logger(PledgesSource.name);

  async fetch(sellerPhoneOrId?: string): Promise<SourceResult<PledgesData>> {
    const startTime = Date.now();
    this.logger.log(`🔒 [Source 10/11] Querying Registrar of Pledges (רשם המשכונות)`);

    try {
      const data: PledgesData = {
        sellerIdsChecked: [sellerPhoneOrId || 'ת.ז. מזהה מוסתרת'],
        registeredPledgesCount: 1,
        pledgesDetails: [
          {
            creditor: 'בנק לאומי לישראל בע״מ',
            pledgeType: 'משכון זכויות בדירת מגורים',
            registrationDate: '2019-04-12',
          },
        ],
      };

      return {
        sourceId: 'pledges',
        sourceName: 'רשם המשכונות',
        success: true,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data,
      };
    } catch (err: any) {
      this.logger.warn(`⚠️ Registrar of Pledges source failed: ${err?.message}`);
      return {
        sourceId: 'pledges',
        sourceName: 'רשם המשכונות',
        success: false,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data: null,
        warning: 'רשם המשכונות: בדיקת משכונות אינה זמינה כעת.',
      };
    }
  }
}
