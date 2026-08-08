import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceResult, UrbanRenewalData } from '../interfaces/pipeline-data.interface';

interface DataGovRecord {
  GUSH?: string;
  HLK?: string;
  PROJ_NAME?: string;
  CITY?: string;
  STATUS?: string;
  APPROVAL_DATE?: string;
  UNITS_DEMO?: number;
  UNITS_BUILD?: number;
  _id?: number;
}

interface DataGovResponse {
  success: boolean;
  result?: {
    records: DataGovRecord[];
    total: number;
  };
  error?: { message: string };
}

@Injectable()
export class UrbanRenewalSource {
  private readonly logger = new Logger(UrbanRenewalSource.name);
  private readonly baseUrl = 'https://data.gov.il/api/3/action/datastore_search';

  constructor(private readonly config: ConfigService) {}

  async fetch(params: {
    block: string;
    parcel: string;
    city?: string;
  }): Promise<SourceResult<UrbanRenewalData>> {
    const resourceId =
      this.config.get<string>('URBAN_RENEWAL_RESOURCE_ID') ||
      'd745a928-d861-4ffe-84a0-c8db5d90e7ee';

    try {
      // Try block/parcel lookup first
      const filters = JSON.stringify({ GUSH: params.block });
      const url = `${this.baseUrl}?resource_id=${resourceId}&filters=${encodeURIComponent(filters)}&limit=10`;

      this.logger.log(`UrbanRenewal: Querying data.gov.il for block=${params.block}`);
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`data.gov.il HTTP ${response.status}`);
      }

      const json = (await response.json()) as DataGovResponse;

      if (!json.success || !json.result) {
        throw new Error(`data.gov.il API error: ${json.error?.message || 'Unknown'}`);
      }

      const records = json.result.records;
      const hasProject = records.length > 0;

      if (hasProject) {
        const record = records[0];
        return {
          source: 'urban_renewal',
          success: true,
          data: {
            hasActiveProject: true,
            projectName: record.PROJ_NAME || 'פרויקט התחדשות עירונית',
            status: record.STATUS || 'בתהליך',
            approvalDate: record.APPROVAL_DATE || null,
            unitsToDemo: record.UNITS_DEMO || null,
            unitsToBuild: record.UNITS_BUILD || null,
            nearbyProjects: records.length,
            dataSource: 'הרשות הלאומית להתחדשות עירונית — data.gov.il',
          },
        };
      }

      // No project found for this block — check city-level
      const cityFilters = JSON.stringify({ CITY: params.city });
      const cityUrl = `${this.baseUrl}?resource_id=${resourceId}&filters=${encodeURIComponent(cityFilters)}&limit=5`;
      const cityResponse = await fetch(cityUrl, { signal: AbortSignal.timeout(8_000) });
      const cityJson = (await cityResponse.json()) as DataGovResponse;
      const cityRecords = cityJson.result?.records || [];

      return {
        source: 'urban_renewal',
        success: true,
        data: {
          hasActiveProject: false,
          projectName: null,
          status: 'לא נמצאו פרויקטים פעילים בגוש זה',
          approvalDate: null,
          unitsToDemo: null,
          unitsToBuild: null,
          nearbyProjects: cityRecords.length,
          dataSource: 'הרשות הלאומית להתחדשות עירונית — data.gov.il',
        },
        warnings: cityRecords.length > 0
          ? [`נמצאו ${cityRecords.length} פרויקטים ב${params.city || 'העיר'} — לא בגוש זה ספציפית`]
          : [],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`UrbanRenewalSource failed: ${msg}`);
      return {
        source: 'urban_renewal',
        success: true,
        data: {
          hasActiveProject: false,
          projectName: null,
          status: 'לא ניתן לאמת — נא לבדוק ישירות מול הרשות להתחדשות עירונית',
          approvalDate: null,
          unitsToDemo: null,
          unitsToBuild: null,
          nearbyProjects: 0,
          dataSource: 'הרשות הלאומית להתחדשות עירונית — data.gov.il',
        },
        warnings: [`Urban renewal API unavailable: ${msg}`],
      };
    }
  }
}
