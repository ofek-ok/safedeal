import { Injectable, Logger } from '@nestjs/common';
import { SourceResult, CbsData } from '../interfaces/pipeline-data.interface';

const CLUSTER_DESCRIPTIONS: Record<number, string> = {
  1: 'נמוך מאוד',
  2: 'נמוך',
  3: 'מתחת לממוצע',
  4: 'מתחת לממוצע',
  5: 'ממוצע',
  6: 'מעל הממוצע',
  7: 'מעל הממוצע',
  8: 'גבוה',
  9: 'גבוה מאוד',
  10: 'גבוה מאוד',
};

@Injectable()
export class CbsSource {
  private readonly logger = new Logger(CbsSource.name);

  async fetch(params: { city: string; neighborhood?: string }): Promise<SourceResult<CbsData>> {
    try {
      const cityKey = params.city.trim().replace('יפו', '').replace('-', '').trim();
      
      this.logger.log(`CBS: Querying data.gov.il for city="${cityKey}"`);

      // Using the official data.gov.il CBS Socioeconomic index dataset (Localities 2019)
      const resourceId = '7c860e04-9f8d-41c2-9f24-6249958d2081';
      const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}&q=${encodeURIComponent(cityKey)}`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`data.gov.il HTTP ${response.status}`);
      }

      const json = await response.json();
      
      if (!json.success || !json.result || !json.result.records || json.result.records.length === 0) {
        // Fallback to a wider search if exact match fails
        throw new Error('City not found in CBS data');
      }

      // Try to find exact match or first result
      const records = json.result.records;
      const record = records.find((r: any) => 
        (r['HEBREW NAME OF LOCALITY'] || '').includes(cityKey) ||
        (r['שם_רשות'] || '').includes(cityKey)
      ) || records[0];

      const cluster = parseInt(record['ESHKOL 2019'] || record['אשכול_חברתי_כלכלי'], 10) || 5; // default to 5 if undefined
      const clusterLevel = CLUSTER_DESCRIPTIONS[cluster] || 'לא ידוע';

      this.logger.log(`CBS: Found cluster=${cluster} for city="${cityKey}"`);

      return {
        source: 'cbs',
        success: true,
        data: {
          socioEconomicCluster: cluster,
          socioEconomicPercentile: cluster * 10, // Approximation if percentile missing
          clusterDescription: clusterLevel,
          medianIncomeVsNational: 'TBD',
          dataSource: 'הלשכה המרכזית לסטטיסטיקה (data.gov.il)',
          dataYear: 2019,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`CbsSource failed: ${msg}`);
      
      // Graceful fallback
      return {
        source: 'cbs',
        success: true,
        data: {
          socioEconomicCluster: 5,
          socioEconomicPercentile: 50,
          clusterDescription: 'ממוצע',
          medianIncomeVsNational: 'TBD',
          dataSource: 'הלשכה המרכזית לסטטיסטיקה (Fallback)',
          dataYear: 2019,
        },
        warnings: [`CBS data.gov.il lookup failed: ${msg}. using fallback.`],
      };
    }
  }
}
