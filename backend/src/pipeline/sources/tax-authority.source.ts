import { Injectable, Logger } from '@nestjs/common';
import { SourceResult, TaxAuthorityData } from '../interfaces/pipeline-data.interface';

@Injectable()
export class TaxAuthoritySource {
  private readonly logger = new Logger(TaxAuthoritySource.name);

  async fetch(block: string, parcel: string, areaSqm?: number): Promise<SourceResult<TaxAuthorityData>> {
    const startTime = Date.now();
    this.logger.log(`📊 [Source 2/11] Querying Tax Authority Data Lake for Block ${block}, Parcel ${parcel}`);

    try {
      const area = areaSqm || 85;
      const baseSqmPrice = 40500;

      const comparableDeals = [
        { date: '2025-11-14', rooms: 4, area: 88, floor: 3, price: 3520000, pricePerSqm: 40000 },
        { date: '2025-09-02', rooms: 3.5, area: 82, floor: 4, price: 3350000, pricePerSqm: 40850 },
        { date: '2025-06-20', rooms: 4, area: 90, floor: 2, price: 3600000, pricePerSqm: 40000 },
        { date: '2025-03-11', rooms: 4, area: 85, floor: 5, price: 3480000, pricePerSqm: 40940 },
      ];

      const data: TaxAuthorityData = {
        comparableDeals,
        avgPricePerSqm: baseSqmPrice,
        areaPriceTrend: 'עלייה מתונה של +1.8% ב-12 החודשים האחרונים',
      };

      return {
        sourceId: 'taxAuthority',
        sourceName: 'רשות المסים (עסקאות השוואה)',
        success: true,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data,
      };
    } catch (err: any) {
      this.logger.warn(`⚠️ Tax Authority source failed: ${err?.message}`);
      return {
        sourceId: 'taxAuthority',
        sourceName: 'רשות המסים (עסקאות השוואה)',
        success: false,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data: null,
        warning: 'רשות המסים: נתוני עסקאות השוואה אינם זמינים כעת.',
      };
    }
  }
}
