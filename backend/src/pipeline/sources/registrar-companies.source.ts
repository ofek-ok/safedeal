import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceResult, RegistrarCompaniesData } from '../interfaces/pipeline-data.interface';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromium } from 'playwright-extra';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

chromium.use(StealthPlugin());

interface GeminiCompanyResponse {
  company_name: string;
  company_number: string;
  status: string;
  company_type: string;
  is_violating_law: boolean;
  pledges_exist: boolean;
  notes: string;
}

@Injectable()
export class RegistrarCompaniesSource {
  private readonly logger = new Logger(RegistrarCompaniesSource.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName = 'gemini-1.5-pro';

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. Registrar of Companies AI parsing might fail.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
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

    let browser: any = null;
    try {
      this.logger.log(`RegistrarCompanies: Launching Playwright to search for "${searchTerm}"`);
      
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await browser.newContext({
        locale: 'he-IL',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      const page = await context.newPage();

      // Navigate to the search page
      await page.goto('https://ica.justice.gov.il/GenericSearch/SearchCompany', { waitUntil: 'networkidle', timeout: 15000 });

      // Fill in the search term. Assume #CompanyNumber for ID, else use #CompanyName (guessing selector)
      if (params.companyId) {
        await page.fill('#CompanyNumber', params.companyId);
      } else {
        await page.fill('#CompanyName', searchTerm);
      }

      // Click search
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
        page.click('#btnSearch').catch(() => {})
      ]);

      // Wait a moment for dynamic rendering if needed
      await page.waitForTimeout(2000);

      // Extract the raw text from the DOM
      const companyDataText = await page.evaluate(() => {
        const container = (document.querySelector('.company-details-container') as HTMLElement) || document.body;
        return container.innerText;
      });

      await browser.close();
      browser = null;

      if (!companyDataText || companyDataText.length < 50) {
        throw new Error('No company data extracted from the page');
      }

      this.logger.log(`RegistrarCompanies: Extracted HTML text. Sending to Gemini for parsing.`);

      // Send to Gemini
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const prompt = `להלן טקסט שחולץ מאתר רשם החברות עבור חברה מסוימת.
קרא את הטקסט וחלץ מתוכו בפורמט JSON נקי (ללא עטיפות markdown) את השדות הבאים. 
אם לא מצאת נתון, החזר ריק (מחרוזת ריקה) או false בהתאמה.
אם הטקסט לא מכיל מידע על חברה, החזר שדות ריקים עם name "Not Found".

{
  "company_name": "שם החברה המלא",
  "company_number": "מספר ח.פ",
  "status": "סטטוס החברה (לדוגמה: פעילה / בפירוק / מפרת חוק / חיסול)",
  "company_type": "סוג החברה (לדוגמה: חברה פרטית / ציבורית)",
  "is_violating_law": true/false,
  "pledges_exist": true/false,
  "notes": "הערות אזהרה או אזהרות מיוחדות אם קיימות (כגון: בפירוק, מפרת חוק, כינוס נכסים, חברה ממשלתית וכו')"
}

טקסט:
${companyDataText.substring(0, 5000)}
`;

      const aiResponse = await model.generateContent(prompt);
      const jsonText = aiResponse.response.text();
      const parsed = JSON.parse(jsonText) as GeminiCompanyResponse;

      if (parsed.company_name === 'Not Found' || !parsed.company_name) {
        return {
          source: 'registrar_companies',
          success: true,
          data: {
            isRelevant: true,
            message: `לא נמצאה חברה תואמת עבור "${searchTerm}" ברשם החברות`,
            companies: [],
            dataSource: 'רשם החברות — משרד המשפטים',
          },
        };
      }

      // Check severe keywords
      const isDangerous = parsed.is_violating_law || 
                          parsed.status.includes('פירוק') || 
                          parsed.status.includes('חיסול') || 
                          parsed.status.includes('כינוס') ||
                          parsed.status.includes('מפרת חוק');

      const companies = [{
        name: parsed.company_name || searchTerm,
        registrationNumber: parsed.company_number || null,
        status: parsed.status || 'לא ידוע',
        type: parsed.company_type || 'חברה בע"מ',
        incorporationDate: null,
        address: null,
        isActive: !isDangerous,
      }];

      let message = `נמצאה חברה: ${parsed.company_name} (סטטוס: ${parsed.status})`;
      if (isDangerous) {
        message = `⚠️ אזהרה: חברה בסטטוס בעייתי (${parsed.status}${parsed.notes ? ' - ' + parsed.notes : ''})`;
      } else if (parsed.pledges_exist) {
        message = `נמצאה חברה פעילה (${parsed.company_name}), אך קיימים שעבודים.`;
      }

      const warnings: string[] = [];
      if (isDangerous) warnings.push(`חברה בסטטוס חריג: ${parsed.status}`);
      if (parsed.pledges_exist) warnings.push(`קיימים שעבודים ברשם החברות`);
      if (parsed.is_violating_law) warnings.push(`מוגדרת כחברה מפרת חוק!`);

      return {
        source: 'registrar_companies',
        success: true,
        data: {
          isRelevant: true,
          message,
          companies,
          dataSource: 'רשם החברות — משרד המשפטים',
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      };

    } catch (err: unknown) {
      if (browser) await browser.close().catch(() => {});
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`RegistrarCompaniesSource failed: ${msg}`);
      
      // Fallback
      return {
        source: 'registrar_companies',
        success: true,
        data: {
          isRelevant: true,
          message: 'לא ניתן לאמת מול רשם החברות (שגיאת רשת/חסימה) — נא לבדוק ידנית באתר התאגידים',
          companies: [],
          dataSource: 'רשם החברות — משרד המשפטים (Fallback)',
        },
        warnings: [`Registrar scraper failed: ${msg}`],
      };
    }
  }
}
