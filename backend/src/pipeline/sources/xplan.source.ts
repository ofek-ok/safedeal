import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceResult, XplanData } from '../interfaces/pipeline-data.interface';

interface ArcGISFeature {
  attributes: {
    PL_NAME?: string;
    PL_NUMBER?: string;
    PL_TYPE?: string;
    STATION?: string;
    GUSH_NUM?: number;
    HLK_NUM?: number;
    [key: string]: unknown;
  };
}

interface ArcGISResponse {
  features?: ArcGISFeature[];
  error?: { code: number; message: string };
}

@Injectable()
export class XplanSource {
  private readonly logger = new Logger(XplanSource.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('IPLAN_BASE_URL') ||
      'https://ags.iplan.gov.il/arcgisiplan/rest/services/PlanningPublic';
  }

  async fetch(params: {
    block: string;
    parcel: string;
    subParcel?: string;
  }): Promise<SourceResult<XplanData>> {
    try {
      const where = encodeURIComponent(
        `GUSH_NUM = ${params.block} AND HLK_NUM = ${params.parcel}`,
      );
      const xplanUrl =
        `${this.baseUrl}/Xplan/MapServer/2/query` +
        `?where=${where}&outFields=PL_NAME,PL_NUMBER,PL_TYPE,STATION,GUSH_NUM,HLK_NUM` +
        `&f=json&returnGeometry=false`;

      this.logger.log(`XPLAN: Querying iplan.gov.il block=${params.block} parcel=${params.parcel}`);

      const response = await fetch(xplanUrl, {
        signal: AbortSignal.timeout(12_000),
        headers: {
          Accept: 'application/json',
          Referer: 'https://mavat.iplan.gov.il/',
        },
      });

      if (!response.ok) {
        throw new Error(`iplan.gov.il HTTP ${response.status}`);
      }

      const json = (await response.json()) as ArcGISResponse;

      if (json.error) {
        throw new Error(`ArcGIS error ${json.error.code}: ${json.error.message}`);
      }

      const features = json.features || [];
      if (features.length === 0) {
        // Return a partial result — no active plans found
        return {
          source: 'xplan',
          success: true,
          data: {
            activePlans: [],
            activePlansCount: 0,
            hasSignificantDevelopment: false,
            mainPlanName: null,
            mainPlanNumber: null,
            planStatus: 'לא נמצאו תוכניות פעילות ברשומות ArcGIS',
            dataSource: 'מינהל התכנון — מערכת XPLAN / iplan.gov.il',
          },
          warnings: ['No plans found for this block/parcel in iplan.gov.il'],
        };
      }

      const plans = features.map((f) => ({
        name: f.attributes.PL_NAME || 'תוכנית לא ידועה',
        number: f.attributes.PL_NUMBER || '',
        type: f.attributes.PL_TYPE || '',
        status: f.attributes.STATION || 'לא ידוע',
      }));

      const mainPlan = plans[0];
      const hasSignificantDevelopment = plans.some(
        (p) =>
          p.type?.includes('פינוי') ||
          p.type?.includes('תמ"א') ||
          p.name?.includes('רכבת') ||
          p.name?.includes('מטרו'),
      );

      return {
        source: 'xplan',
        success: true,
        data: {
          activePlans: plans,
          activePlansCount: plans.length,
          hasSignificantDevelopment,
          mainPlanName: mainPlan.name,
          mainPlanNumber: mainPlan.number,
          planStatus: mainPlan.status,
          dataSource: 'מינהל התכנון — מערכת XPLAN / iplan.gov.il',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`XplanSource failed: ${msg}`);
      return {
        source: 'xplan',
        success: true,
        data: {
          activePlans: [],
          activePlansCount: 0,
          hasSignificantDevelopment: false,
          mainPlanName: null,
          mainPlanNumber: null,
          planStatus: 'שגיאה בשליפת נתוני תכנון — נא לבדוק ב-mavat.iplan.gov.il',
          dataSource: 'מינהל התכנון — מערכת XPLAN / iplan.gov.il',
        },
        warnings: [`XPLAN/iplan API failed: ${msg}`],
      };
    }
  }
}
