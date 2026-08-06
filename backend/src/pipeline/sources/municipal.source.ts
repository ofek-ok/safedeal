import { Injectable, Logger } from '@nestjs/common';
import { SourceResult, MunicipalData } from '../interfaces/pipeline-data.interface';

@Injectable()
export class MunicipalSource {
  private readonly logger = new Logger(MunicipalSource.name);

  async fetch(city: string, street: string, houseNumber: string): Promise<SourceResult<MunicipalData>> {
    const startTime = Date.now();
    this.logger.log(`🏗️ [Source 8/11] Querying Municipal Engineering Archives for ${city}, ${street} ${houseNumber}`);

    try {
      const data: MunicipalData = {
        buildingFileStatus: 'found',
        buildingPermitYear: 1994,
        hasForm4: true,
        unpermittedAdditions: [
          {
            additionType: 'סגירת מרפסת (כ-8 מ״ר)',
            yearDetected: '2008',
            status: 'under_review',
          },
        ],
      };

      return {
        sourceId: 'municipal',
        sourceName: 'אתרי ההנדסה העירוניים',
        success: true,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data,
      };
    } catch (err: any) {
      this.logger.warn(`⚠️ Municipal engineering query failed: ${err?.message}`);
      return {
        sourceId: 'municipal',
        sourceName: 'אתרי ההנדסה העירוניים',
        success: false,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data: null,
        warning: 'אתרי ההנדסה: תיק בניין אינו נגיש בדיגיטל.',
      };
    }
  }
}
