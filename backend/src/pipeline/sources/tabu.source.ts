import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SourceResult, TabuData } from '../interfaces/pipeline-data.interface';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as pdfParse from 'pdf-parse';

const TABU_EXTRACTION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    owners: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          id: { type: SchemaType.STRING },
          shareNumerator: { type: SchemaType.NUMBER },
          shareDenominator: { type: SchemaType.NUMBER },
        },
        required: ['name'],
      },
    },
    propertyType: { type: SchemaType.STRING },
    block: { type: SchemaType.STRING },
    parcel: { type: SchemaType.STRING },
    subParcel: { type: SchemaType.STRING },
    area: { type: SchemaType.NUMBER },
    mortgages: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          creditorName: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
          currency: { type: SchemaType.STRING },
          registrationDate: { type: SchemaType.STRING },
          isActive: { type: SchemaType.BOOLEAN },
        },
        required: ['creditorName'],
      },
    },
    warnings: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    alerts: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    extractionConfidence: { type: SchemaType.STRING },
  },
  required: ['owners', 'extractionConfidence'],
};

const TABU_SYSTEM_PROMPT = `אתה מומחה לניתוח מסמכי טאבו (נסח טאבו) ישראליים. 
המשימה שלך: לחלץ נתונים מובנים מטקסט גולמי של נסח טאבו.

חלץ:
- בעלי הנכס (שם, תעודת זהות/ח"פ, חלק בבעלות)
- סוג הנכס (דירה, בית פרטי, מגרש וכו')
- גוש, חלקה, תת-חלקה
- שטח (מ"ר)
- משכנתאות ועיקולים (שם הנושה, סכום, מטבע, תאריך רישום)
- אזהרות חשובות (עיקולים, הערות אזהרה, הגבלות)
- דגלים אדומים (חריגות בנייה, בעלות מחלוקת, שיעבודים)

השתמש בעברית לכל ממצא. אם פרט לא מופיע במסמך, השמט אותו.
הגדר extractionConfidence: "high" / "medium" / "low" בהתאם לאיכות הטקסט.`;

@Injectable()
export class TabuSource {
  private readonly logger = new Logger(TabuSource.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('TabuSource: Gemini AI initialized ✓');
    } else {
      this.logger.warn('TabuSource: GEMINI_API_KEY not set — OCR extraction disabled');
    }
  }

  /** Extract text from PDF buffer using pdf-parse */
  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const parsed = await (pdfParse as any)(buffer);
      return parsed.text || '';
    } catch (err) {
      throw new Error(`PDF parsing failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Extract structured data from raw text using Gemini 1.5 Flash */
  private async extractWithGemini(rawText: string): Promise<any> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: TABU_EXTRACTION_SCHEMA as any,
      },
    });

    const prompt = `${TABU_SYSTEM_PROMPT}\n\n=== טקסט נסח הטאבו ===\n${rawText.substring(0, 30_000)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  }

  async fetch(params: {
    tabuFileName?: string | null;
    tabuFileBuffer?: Buffer | null;
    block?: string;
    parcel?: string;
  }): Promise<SourceResult<TabuData>> {
    // Case 1: File buffer provided — run real OCR + Gemini extraction
    if (params.tabuFileBuffer) {
      try {
        this.logger.log(`TabuSource: Processing PDF "${params.tabuFileName || 'unknown'}"`);

        const rawText = await this.extractPdfText(params.tabuFileBuffer);
        if (!rawText || rawText.trim().length < 50) {
          throw new Error('PDF text extraction yielded insufficient content (possibly scanned image)');
        }

        this.logger.log(`TabuSource: PDF text extracted (${rawText.length} chars). Sending to Gemini...`);
        const extracted = await this.extractWithGemini(rawText);

        const owners = (extracted.owners || []).map((o: any) => ({
          name: o.name || 'לא ידוע',
          id: o.id || null,
          ownership: o.shareNumerator && o.shareDenominator
            ? `${o.shareNumerator}/${o.shareDenominator}`
            : '1/1',
        }));

        const mortgages = (extracted.mortgages || []).map((m: any) => ({
          creditorName: m.creditorName || 'לא ידוע',
          amount: m.amount || null,
          currency: m.currency || 'ILS',
          registrationDate: m.registrationDate || null,
          isActive: m.isActive !== false,
        }));

        return {
          source: 'tabu',
          success: true,
          data: {
            owners,
            propertyType: extracted.propertyType || 'לא ידוע',
            block: extracted.block || params.block || '',
            parcel: extracted.parcel || params.parcel || '',
            subParcel: extracted.subParcel || null,
            areaSqm: extracted.area || null,
            mortgages,
            hasMortgage: mortgages.some((m: any) => m.isActive),
            warnings: extracted.warnings || [],
            redFlags: extracted.alerts || [],
            extractionMethod: 'gemini-1.5-flash',
            extractionConfidence: extracted.extractionConfidence || 'low',
            dataSource: 'נסח טאבו — משרד המשפטים / רשם המקרקעין',
          },
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`TabuSource OCR failed: ${msg}`);
        return {
          source: 'tabu',
          success: true,
          data: this.buildManualReviewResult(params),
          warnings: [`Tabu OCR extraction failed: ${msg}. Manual review required.`],
        };
      }
    }

    // Case 2: Only filename — file not uploaded yet
    if (params.tabuFileName) {
      this.logger.log(`TabuSource: Only filename provided (${params.tabuFileName}) — no buffer for extraction`);
      return {
        source: 'tabu',
        success: true,
        data: this.buildManualReviewResult(params),
        warnings: [
          `קובץ טאבו הוזכר (${params.tabuFileName}) אך לא הועלה לשרת לצורך ניתוח אוטומטי. נא לנתח ידנית.`,
        ],
      };
    }

    // Case 3: No document
    return {
      source: 'tabu',
      success: true,
      data: this.buildManualReviewResult(params),
      warnings: ['לא הועלה נסח טאבו. ניתוח מבוסס על נתוני הגוש/חלקה בלבד.'],
    };
  }

  private buildManualReviewResult(params: { block?: string; parcel?: string; tabuFileName?: string | null }): TabuData {
    return {
      owners: [],
      propertyType: 'לא ידוע',
      block: params.block || '',
      parcel: params.parcel || '',
      subParcel: null,
      areaSqm: null,
      mortgages: [],
      hasMortgage: false,
      warnings: [],
      redFlags: ['נסח טאבו לא סופק — נדרשת בדיקה ידנית ב-מינהל הרישום'],
      extractionMethod: 'manual_review_required',
      extractionConfidence: 'none',
      dataSource: 'נסח טאבו — משרד המשפטים / רשם המקרקעין',
    };
  }
}
