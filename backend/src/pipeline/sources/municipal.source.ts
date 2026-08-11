import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SourceResult,
  MunicipalData,
} from '../interfaces/pipeline-data.interface';

interface DataGovPermit {
  city_name?: string;
  street?: string;
  house_num?: string;
  parcel?: string;
  block?: string;
  permit_type?: string;
  permit_status?: string;
  permit_date?: string;
  work_type?: string;
  description?: string;
  _id?: number;
}

interface DataGovPermitResponse {
  success: boolean;
  result?: {
    records: DataGovPermit[];
    total: number;
  };
  error?: { message: string };
}

// Map of major city names to their open-data permit portals (fallback URLs for reference)
const CITY_PORTALS: Record<string, string> = {
  'תל אביב-יפו': 'https://gis.tel-aviv.gov.il/iView/Map.aspx',
  'תל אביב': 'https://gis.tel-aviv.gov.il/iView/Map.aspx',
  ירושלים: 'https://gis.jerusalem.muni.il',
  חיפה: 'https://gisn.haifa.muni.il',
  'ראשון לציון': 'https://www.rishonlezion.muni.il',
  'פתח תקווה': 'https://www.petah-tikva.muni.il',
  נתניה: 'https://www.netanya.muni.il',
};

@Injectable()
export class MunicipalSource {
  private readonly logger = new Logger(MunicipalSource.name);
  private readonly baseUrl =
    'https://data.gov.il/api/3/action/datastore_search';

  constructor(private readonly config: ConfigService) {}

  async fetch(params: {
    city: string;
    street?: string;
    houseNumber?: string;
    block?: string;
    parcel?: string;
  }): Promise<SourceResult<MunicipalData>> {
    const resourceId =
      this.config.get<string>('BUILDING_PERMITS_RESOURCE_ID') ||
      '4a8cedd3-3085-48b8-8508-96f81d99c99f';

    try {
      // Build search query — try address first
      const q = [params.city, params.street, params.houseNumber]
        .filter(Boolean)
        .join(' ');

      const url = `${this.baseUrl}?resource_id=${resourceId}&q=${encodeURIComponent(q)}&limit=20`;

      this.logger.log(
        `Municipal: Querying data.gov.il building permits for "${q}"`,
      );

      const response = await fetch(url, {
        signal: AbortSignal.timeout(12_000),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`data.gov.il HTTP ${response.status}`);
      }

      const json = (await response.json()) as DataGovPermitResponse;

      if (!json.success || !json.result) {
        throw new Error(
          `data.gov.il API: ${json.error?.message || 'Unknown error'}`,
        );
      }

      const records = json.result.records;
      const totalPermits = json.result.total;

      // Analyze permits
      const openPermits = records.filter(
        (r) =>
          r.permit_status?.includes('פתוח') ||
          r.permit_status?.includes('בתהליך'),
      );
      const violations = records.filter(
        (r) =>
          r.work_type?.includes('חריגה') ||
          r.description?.includes('חריגה') ||
          r.permit_type?.includes('אכיפה'),
      );

      const cityPortal = CITY_PORTALS[params.city] || 'data.gov.il';

      return {
        source: 'municipal',
        success: true,
        data: {
          buildingPermits: records.slice(0, 5).map((r) => ({
            type: r.permit_type || 'היתר בנייה',
            status: r.permit_status || 'לא ידוע',
            date: r.permit_date || null,
            description: r.description || r.work_type || null,
          })),
          openPermitsCount: openPermits.length,
          hasViolations: violations.length > 0,
          violationsCount: violations.length,
          totalPermitsFound: totalPermits,
          cityPortalUrl: cityPortal,
          dataSource: `הנדסת עיריית ${params.city} — data.gov.il / ${cityPortal}`,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`MunicipalSource failed: ${msg}`);
      const cityPortal = CITY_PORTALS[params.city] || 'data.gov.il';
      return {
        source: 'municipal',
        success: true,
        data: {
          buildingPermits: [],
          openPermitsCount: 0,
          hasViolations: false,
          violationsCount: 0,
          totalPermitsFound: 0,
          cityPortalUrl: cityPortal,
          dataSource: `הנדסת עיריית ${params.city} — data.gov.il`,
        },
        warnings: [
          `Municipal building permits API unavailable: ${msg}`,
          `Manual check recommended at: ${cityPortal}`,
        ],
      };
    }
  }
}
