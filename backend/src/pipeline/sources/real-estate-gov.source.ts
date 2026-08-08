import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceResult, RealEstateGovData } from '../interfaces/pipeline-data.interface';

interface NadlanStatsResponse {
  Data?: {
    AssetCount?: number;
    AvgDealAmount?: number;
    AvgArea?: number;
    MinDealAmount?: number;
    MaxDealAmount?: number;
    AvgFloorNo?: number;
    YEAR_QUARTER?: string;
  }[];
  Success?: boolean;
  ErrorMessage?: string;
}

interface NadlanNeighborhoodResponse {
  Data?: {
    STREET?: string;
    QUARTER?: string;
    AVG_PRICE_PER_SQM?: number;
    COUNT_DEALS?: number;
    AVG_AREA?: number;
  }[];
  Success?: boolean;
}

@Injectable()
export class RealEstateGovSource {
  private readonly logger = new Logger(RealEstateGovSource.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('NADLAN_BASE_URL') ||
      'https://www.nadlan.gov.il/Nadlan.REST';
  }

  async fetch(params: {
    city: string;
    neighborhood?: string;
    assetType?: string;
  }): Promise<SourceResult<RealEstateGovData>> {
    try {
      // Fetch city-level stats from nadlan.gov.il
      const cityStatsUrl =
        `${this.baseUrl}/getAssetsByCity?city=${encodeURIComponent(params.city)}&subtypeId=0&assestStatusId=0&fromYear=2022&toYear=2025`;

      this.logger.log(`RealEstateGov: Querying nadlan.gov.il for city="${params.city}"`);

      const response = await fetch(cityStatsUrl, {
        signal: AbortSignal.timeout(12_000),
        headers: {
          Accept: 'application/json',
          Referer: 'https://www.nadlan.gov.il/',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`nadlan.gov.il HTTP ${response.status}`);
      }

      const json = (await response.json()) as NadlanStatsResponse;

      if (!json.Success || !json.Data || json.Data.length === 0) {
        throw new Error(`nadlan.gov.il: No city data found for "${params.city}"`);
      }

      const latestStats = json.Data[json.Data.length - 1];
      const avgPricePerSqm = latestStats.AvgDealAmount && latestStats.AvgArea
        ? Math.round(latestStats.AvgDealAmount / latestStats.AvgArea)
        : null;

      // Calculate year-over-year change
      const prevYearStats = json.Data.length > 4 ? json.Data[json.Data.length - 5] : null;
      let annualChange: number | null = null;
      if (prevYearStats?.AvgDealAmount && latestStats.AvgDealAmount) {
        annualChange = parseFloat(
          (((latestStats.AvgDealAmount - prevYearStats.AvgDealAmount) / prevYearStats.AvgDealAmount) * 100).toFixed(1),
        );
      }

      return {
        source: 'real_estate_gov',
        success: true,
        data: {
          neighborhoodIndex: avgPricePerSqm ? Math.round(avgPricePerSqm / 1000) : null,
          avgPricePerSqmCity: avgPricePerSqm,
          annualPriceChangePercent: annualChange,
          totalDealsInArea: latestStats.AssetCount || null,
          avgDealAmount: latestStats.AvgDealAmount || null,
          dataSource: 'מינהל הנדל"ן הממשלתי — nadlan.gov.il',
          quarterRef: latestStats.YEAR_QUARTER || null,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`RealEstateGovSource failed: ${msg}`);
      return {
        source: 'real_estate_gov',
        success: true,
        data: {
          neighborhoodIndex: null,
          avgPricePerSqmCity: null,
          annualPriceChangePercent: null,
          totalDealsInArea: null,
          avgDealAmount: null,
          dataSource: 'מינהל הנדל"ן הממשלתי — nadlan.gov.il',
          quarterRef: null,
        },
        warnings: [`Real estate gov API unavailable: ${msg}`],
      };
    }
  }
}
