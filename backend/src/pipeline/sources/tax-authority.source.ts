import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceResult, TaxAuthorityData } from '../interfaces/pipeline-data.interface';

interface NadlanDeal {
  DEALDATE?: string;
  DEALNATURE?: string;
  ASSETCLASSIFICATIONDESCRIPTION?: string;
  DEALPRICE?: number;
  FLOORNO?: number;
  FLOORSINNBUILDING?: number;
  NEWASSET?: boolean;
  ROOMS?: number;
  BUILDINGYEAR?: number;
  DEALAMOUNT?: number;
  DEALPERCENTAGE?: number;
  AREA?: number;
}

interface NadlanResponse {
  Data?: NadlanDeal[];
  Success?: boolean;
  ErrorMessage?: string;
}

@Injectable()
export class TaxAuthoritySource {
  private readonly logger = new Logger(TaxAuthoritySource.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('NADLAN_BASE_URL') ||
      'https://www.nadlan.gov.il/Nadlan.REST';
  }

  async fetch(params: {
    block: string;
    parcel: string;
    city?: string;
  }): Promise<SourceResult<TaxAuthorityData>> {
    try {
      // Use nadlan.gov.il internal API (used by their own SPA)
      const url =
        `${this.baseUrl}/getDealsByBlock` +
        `?block=${params.block}&parcel=${params.parcel}&subtypeId=0&assestStatusId=0`;

      this.logger.log(`TaxAuthority: Querying nadlan.gov.il block=${params.block} parcel=${params.parcel}`);

      const response = await fetch(url, {
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

      const json = (await response.json()) as NadlanResponse;

      if (!json.Success && json.ErrorMessage) {
        throw new Error(`nadlan.gov.il: ${json.ErrorMessage}`);
      }

      const deals = json.Data || [];

      if (deals.length === 0) {
        return {
          source: 'tax_authority',
          success: true,
          data: {
            transactionHistory: [],
            avgPricePerSqm: null,
            lastSaleDate: null,
            lastSalePrice: null,
            totalDeals: 0,
            dataSource: 'רשות המסים — פורטל נדל"ן gov.il',
          },
          warnings: ['No transactions found for this block/parcel'],
        };
      }

      // Calculate average price per sqm from deals with area data
      const dealsWithPrice = deals.filter((d) => d.DEALPRICE && d.AREA && d.AREA > 0);
      const avgPricePerSqm =
        dealsWithPrice.length > 0
          ? Math.round(
              dealsWithPrice.reduce((sum, d) => sum + (d.DEALPRICE! / d.AREA!), 0) /
                dealsWithPrice.length,
            )
          : null;

      const sortedDeals = [...deals].sort(
        (a, b) => new Date(b.DEALDATE || 0).getTime() - new Date(a.DEALDATE || 0).getTime(),
      );

      const lastDeal = sortedDeals[0];

      return {
        source: 'tax_authority',
        success: true,
        data: {
          transactionHistory: sortedDeals.slice(0, 10).map((d) => ({
            date: d.DEALDATE || '',
            price: d.DEALPRICE || 0,
            area: d.AREA || null,
            pricePerSqm: d.AREA ? Math.round((d.DEALPRICE || 0) / d.AREA) : null,
            rooms: d.ROOMS || null,
            floor: d.FLOORNO || null,
            isNew: d.NEWASSET || false,
            nature: d.DEALNATURE || '',
          })),
          avgPricePerSqm,
          lastSaleDate: lastDeal?.DEALDATE || null,
          lastSalePrice: lastDeal?.DEALPRICE || null,
          totalDeals: deals.length,
          dataSource: 'רשות המסים — פורטל נדל"ן gov.il',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`TaxAuthoritySource failed: ${msg}`);

      // Graceful fallback with clear indication
      return {
        source: 'tax_authority',
        success: true,
        data: {
          transactionHistory: [],
          avgPricePerSqm: null,
          lastSaleDate: null,
          lastSalePrice: null,
          totalDeals: 0,
          dataSource: 'רשות המסים — פורטל נדל"ן gov.il',
        },
        warnings: [`Tax authority API unavailable: ${msg}. Check nadlan.gov.il manually.`],
      };
    }
  }
}
