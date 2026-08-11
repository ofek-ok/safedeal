import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SourceResult,
  TaxAuthorityData,
} from '../interfaces/pipeline-data.interface';
import { chromium } from 'playwright-extra';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

chromium.use(StealthPlugin());

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

  constructor(private readonly config: ConfigService) {}

  async fetch(params: {
    block: string;
    parcel: string;
    city?: string;
  }): Promise<SourceResult<TaxAuthorityData>> {
    let browser: any = null;
    try {
      this.logger.log(
        `TaxAuthority: Launching headless browser for block=${params.block} parcel=${params.parcel}`,
      );

      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();

      this.logger.log(
        `TaxAuthority: Navigating to nadlan.gov.il to bypass WAF`,
      );
      await page.goto('https://www.nadlan.gov.il/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      this.logger.log(
        `TaxAuthority: Executing internal fetch in browser context`,
      );
      // Execute the request inside the browser to leverage WAF cookies
      const jsonStr = await page.evaluate(
        async ({ b, p }) => {
          try {
            const res = await fetch(
              `https://www.nadlan.gov.il/Nadlan.REST/getDealsByBlock?block=${b}&parcel=${p}&subtypeId=0&assestStatusId=0`,
              {
                headers: {
                  Accept: 'application/json',
                  'X-Requested-With': 'XMLHttpRequest',
                  Referer: 'https://www.nadlan.gov.il/',
                },
              },
            );
            return await res.text();
          } catch (e: any) {
            return JSON.stringify({ Success: false, ErrorMessage: e.message });
          }
        },
        { b: params.block, p: params.parcel },
      );

      let json: NadlanResponse = {};
      try {
        json = JSON.parse(jsonStr) as NadlanResponse;
      } catch (parseErr) {
        throw new Error(
          `Failed to parse Nadlan API response: HTML/WAF block detected`,
        );
      }

      await browser.close();
      browser = null;

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
            dataSource: 'רשות המסים — פורטל נדל"ן gov.il (Scraper)',
          },
          warnings: ['No transactions found for this block/parcel'],
        };
      }

      // Calculate average price per sqm from deals with area data
      const dealsWithPrice = deals.filter(
        (d) => d.DEALPRICE && d.AREA && d.AREA > 0,
      );
      const avgPricePerSqm =
        dealsWithPrice.length > 0
          ? Math.round(
              dealsWithPrice.reduce(
                (sum, d) => sum + d.DEALPRICE! / d.AREA!,
                0,
              ) / dealsWithPrice.length,
            )
          : null;

      const sortedDeals = [...deals].sort(
        (a, b) =>
          new Date(b.DEALDATE || 0).getTime() -
          new Date(a.DEALDATE || 0).getTime(),
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
            pricePerSqm: d.AREA
              ? Math.round((d.DEALPRICE || 0) / d.AREA)
              : null,
            rooms: d.ROOMS || null,
            floor: d.FLOORNO || null,
            isNew: d.NEWASSET || false,
            nature: d.DEALNATURE || '',
          })),
          avgPricePerSqm,
          lastSaleDate: lastDeal?.DEALDATE || null,
          lastSalePrice: lastDeal?.DEALPRICE || null,
          totalDeals: deals.length,
          dataSource: 'רשות המסים — פורטל נדל"ן gov.il (Scraper)',
        },
      };
    } catch (err: unknown) {
      if (browser) await browser.close().catch(() => {});
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`TaxAuthoritySource Playwright failed: ${msg}`);

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
          dataSource: 'רשות המסים — פורטל נדל"ן gov.il (Fallback)',
        },
        warnings: [
          `Tax authority API unavailable: ${msg}. Check nadlan.gov.il manually.`,
        ],
      };
    }
  }
}
