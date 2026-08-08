import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceResult, RegistrarCompaniesData } from '../interfaces/pipeline-data.interface';

interface IcaCompanyRecord {
  CompanyName?: string;
  CompanyNumber?: string;
  StatusDesc?: string;
  CompanyType?: string;
  IncorporationDate?: string;
  Address?: string;
  City?: string;
}

interface IcaApiResponse {
  Data?: IcaCompanyRecord[];
  TotalCount?: number;
  Success?: boolean;
}

@Injectable()
export class RegistrarCompaniesSource {
  private readonly logger = new Logger(RegistrarCompaniesSource.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('ICA_BASE_URL') ||
      'https://ica.justice.gov.il';
  }

  async fetch(params: {
    companyName?: string;
    companyId?: string;
    sellerName?: string;
  }): Promise<SourceResult<RegistrarCompaniesData>> {
    const searchTerm = params.companyId || params.companyName || params.sellerName;
    if (!searchTerm) {
      return {
        source: 'registrar_companies',
        success: true,
        data: {
          isRelevant: false,
          message: 'מוכר/קונה פרטי — בדיקת רשם החברות אינה רלוונטית',
          companies: [],
          dataSource: 'רשם החברות — משרד המשפטים',
        },
      };
    }

    try {
      // Try ica.justice.gov.il internal API
      const searchUrl = params.companyId
        ? `${this.baseUrl}/Ica.Application.WebSite/api/FetchCompanies?COMP_NUM=${params.companyId}`
        : `${this.baseUrl}/Ica.Application.WebSite/api/FetchCompanies?COMP_NAME=${encodeURIComponent(searchTerm)}&maxRows=5`;

      this.logger.log(`RegistrarCompanies: Querying ica.justice.gov.il for "${searchTerm}"`);

      const response = await fetch(searchUrl, {
        signal: AbortSignal.timeout(10_000),
        headers: {
          Accept: 'application/json',
          Referer: 'https://ica.justice.gov.il/',
        },
      });

      if (!response.ok) {
        throw new Error(`ica.justice.gov.il HTTP ${response.status}`);
      }

      const json = (await response.json()) as IcaApiResponse;
      const records = json.Data || [];

      if (records.length === 0) {
        return {
          source: 'registrar_companies',
          success: true,
          data: {
            isRelevant: true,
            message: `לא נמצאה חברה בשם "${searchTerm}" ברשם החברות`,
            companies: [],
            dataSource: 'רשם החברות — משרד המשפטים',
          },
        };
      }

      const companies = records.map((r) => ({
        name: r.CompanyName || searchTerm,
        registrationNumber: r.CompanyNumber || null,
        status: r.StatusDesc || 'לא ידוע',
        type: r.CompanyType || 'חברה בע"מ',
        incorporationDate: r.IncorporationDate || null,
        address: r.Address ? `${r.Address}, ${r.City || ''}`.trim() : null,
        isActive: r.StatusDesc?.includes('פעיל') || false,
      }));

      const hasInactiveCompany = companies.some((c) => !c.isActive);

      return {
        source: 'registrar_companies',
        success: true,
        data: {
          isRelevant: true,
          message: hasInactiveCompany
            ? '⚠️ נמצאה חברה שאינה פעילה — נדרשת בדיקה נוספת'
            : `נמצאה חברה פעילה: ${companies[0].name}`,
          companies,
          dataSource: 'רשם החברות — משרד המשפטים',
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`RegistrarCompaniesSource failed: ${msg}`);
      return {
        source: 'registrar_companies',
        success: true,
        data: {
          isRelevant: true,
          message: 'לא ניתן לאמת מול רשם החברות — נא לבדוק ידנית ב-ica.justice.gov.il',
          companies: [],
          dataSource: 'רשם החברות — משרד המשפטים',
        },
        warnings: [`Registrar companies API unavailable: ${msg}`],
      };
    }
  }
}
