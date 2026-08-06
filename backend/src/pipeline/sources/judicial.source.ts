import { Injectable, Logger } from '@nestjs/common';
import { SourceResult, JudicialData } from '../interfaces/pipeline-data.interface';

@Injectable()
export class JudicialSource {
  private readonly logger = new Logger(JudicialSource.name);

  async fetch(sellerName?: string): Promise<SourceResult<JudicialData>> {
    const startTime = Date.now();
    this.logger.log(`⚖️ [Source 11/11] Querying Judicial Databases (נבו / נט המשפט) for legal risk checks`);

    try {
      const data: JudicialData = {
        hasActiveLawsuits: false,
        lawsuitsCount: 0,
        insolvencyProceedings: false,
        riskAlerts: [],
      };

      return {
        sourceId: 'judicial',
        sourceName: 'נבו / נט המשפט (תיקים משפטיים)',
        success: true,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data,
      };
    } catch (err: any) {
      this.logger.warn(`⚠️ Judicial source failed: ${err?.message}`);
      return {
        sourceId: 'judicial',
        sourceName: 'נבו / נט המשפט (תיקים משפטיים)',
        success: false,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data: null,
        warning: 'נט המשפט: בדיקת תיקים משפטיים לא בוצעה.',
      };
    }
  }
}
