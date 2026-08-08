import { Injectable, Logger } from '@nestjs/common';
import { SourceResult, CbsData } from '../interfaces/pipeline-data.interface';
import cbsClusters from '../data/cbs-clusters.json';

type CbsEntry = { cluster: number; percentile: number; medianIncome: string };
type CbsLookup = Record<string, CbsEntry>;

const CLUSTERS = cbsClusters as CbsLookup;

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
      const cityKey = params.city.trim();
      const entry: CbsEntry =
        CLUSTERS[cityKey] ||
        CLUSTERS[cityKey.replace('יפו', '').replace('-', '').trim()] ||
        (CLUSTERS as CbsLookup)['other'];

      const clusterLevel = CLUSTER_DESCRIPTIONS[entry.cluster] || 'לא ידוע';

      this.logger.log(`CBS: Lookup for city="${cityKey}" → cluster=${entry.cluster}`);

      return {
        source: 'cbs',
        success: true,
        data: {
          socioEconomicCluster: entry.cluster,
          socioEconomicPercentile: entry.percentile,
          clusterDescription: clusterLevel,
          medianIncomeVsNational: entry.medianIncome,
          dataSource: 'הלשכה המרכזית לסטטיסטיקה — מדד חברתי-כלכלי 2019',
          dataYear: 2019,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`CbsSource failed: ${msg}`);
      return {
        source: 'cbs',
        success: false,
        data: null as any,
        warnings: [`CBS lookup failed: ${msg}`],
      };
    }
  }
}
