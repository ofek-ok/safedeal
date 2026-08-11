import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SourceResult,
  UrbanRenewalData,
} from '../interfaces/pipeline-data.interface';

@Injectable()
export class UrbanRenewalSource {
  private readonly logger = new Logger(UrbanRenewalSource.name);
  private readonly gisUrl =
    'https://gisserver.gov.il/arcgis/rest/services/UrbanRenewal/MapServer/0/query';

  constructor(private readonly config: ConfigService) {}

  async fetch(params: {
    block: string;
    parcel: string;
    city?: string;
    xCoord?: number;
    yCoord?: number;
  }): Promise<SourceResult<UrbanRenewalData>> {
    // Check if coordinates were provided by a previous pipeline step (e.g., GovMap)
    if (!params.xCoord || !params.yCoord) {
      this.logger.warn(
        `UrbanRenewal: Missing ITM coordinates for block ${params.block}. Skipping GIS intersect.`,
      );
      return {
        source: 'urban_renewal',
        success: true,
        data: {
          hasActiveProject: false,
          projectName: null,
          status: 'חסרות קואורדינטות מדויקות לבדיקת מתחם',
          approvalDate: null,
          unitsToDemo: null,
          unitsToBuild: null,
          nearbyProjects: 0,
          dataSource: 'הרשות הממשלתית להתחדשות עירונית — GIS',
        },
      };
    }

    try {
      this.logger.log(
        `UrbanRenewal: Querying GIS spatial intersect at X:${params.xCoord}, Y:${params.yCoord}`,
      );

      const searchParams = new URLSearchParams({
        f: 'json',
        returnGeometry: 'false',
        spatialRel: 'esriSpatialRelIntersects',
        geometry: JSON.stringify({ x: params.xCoord, y: params.yCoord }),
        geometryType: 'esriGeometryPoint',
        inSR: '2039',
        outFields:
          'COMPLEX_NAME,COMPLEX_STATUS,HOUSING_UNITS_ADD,DEVELOPER_NAME,DECLARATION_DATE',
      });

      const response = await fetch(
        `${this.gisUrl}?${searchParams.toString()}`,
        {
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!response.ok) {
        throw new Error(`GIS Server HTTP ${response.status}`);
      }

      const data = await response.json();
      const features = data.features || [];

      if (features.length === 0) {
        return {
          source: 'urban_renewal',
          success: true,
          data: {
            hasActiveProject: false,
            projectName: null,
            status: 'הנכס אינו ממוקם בתוך מתחם התחדשות עירונית מוכרז',
            approvalDate: null,
            unitsToDemo: null,
            unitsToBuild: null,
            nearbyProjects: 0,
            dataSource: 'הרשות הממשלתית להתחדשות עירונית — GIS',
          },
        };
      }

      const siteInfo = features[0].attributes || {};

      return {
        source: 'urban_renewal',
        success: true,
        data: {
          hasActiveProject: true,
          projectName: siteInfo.COMPLEX_NAME || 'מתחם התחדשות עירונית',
          status: siteInfo.COMPLEX_STATUS || 'מוכרז',
          approvalDate: siteInfo.DECLARATION_DATE || null,
          unitsToDemo: null, // Endpoint doesn't explicitly return demo units
          unitsToBuild: siteInfo.HOUSING_UNITS_ADD || null,
          nearbyProjects: features.length,
          dataSource: 'הרשות הממשלתית להתחדשות עירונית — GIS',
        },
        warnings: siteInfo.DEVELOPER_NAME
          ? [`היזם המבצע: ${siteInfo.DEVELOPER_NAME}`]
          : undefined,
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
          status:
            'לא ניתן לאמת מרחבית — נא לבדוק במפות העירייה / רשות להתחדשות עירונית',
          approvalDate: null,
          unitsToDemo: null,
          unitsToBuild: null,
          nearbyProjects: 0,
          dataSource: 'הרשות הממשלתית להתחדשות עירונית — GIS (Fallback)',
        },
        warnings: [`Urban renewal GIS unavailable: ${msg}`],
      };
    }
  }
}
