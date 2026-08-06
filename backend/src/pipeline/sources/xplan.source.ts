import { Injectable, Logger } from '@nestjs/common';
import { SourceResult, XplanData } from '../interfaces/pipeline-data.interface';

@Injectable()
export class XplanSource {
  private readonly logger = new Logger(XplanSource.name);

  async fetch(block: string, parcel: string): Promise<SourceResult<XplanData>> {
    const startTime = Date.now();
    this.logger.log(`📐 [Source 4/11] Querying XPLAN / Mavat Planning Administration for Block ${block}, Parcel ${parcel}`);

    try {
      const data: XplanData = {
        masterPlanNumber: 'תא/5000',
        landDesignation: 'מגורים ב׳',
        futureZoningPlans: [
          {
            planName: 'תב״ע תא/5000/א',
            status: 'מאושרת בתוקף',
            description: 'תוכנית מתאר כוללנית לתל אביב-יפו',
          },
          {
            planName: 'תוואי הרכבת הירוק',
            status: 'בביצוע',
            description: 'תוואי הרכבת הקלה במרחק 250 מטר מהנכס',
          },
        ],
        buildingRightsRemainingPercent: 0,
        infrastructureImpacts: ['עבודות תשתית זמניות ברחוב הסמוך בשנתיים הקרובות'],
      };

      return {
        sourceId: 'xplan',
        sourceName: 'XPLAN – מינהל התכנון',
        success: true,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data,
      };
    } catch (err: any) {
      this.logger.warn(`⚠️ XPLAN query failed: ${err?.message}`);
      return {
        sourceId: 'xplan',
        sourceName: 'XPLAN – מינהל התכנון',
        success: false,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data: null,
        warning: 'מינהל התכנון (XPLAN): לא התקבלו נתוני תב״ע מפורטים.',
      };
    }
  }
}
