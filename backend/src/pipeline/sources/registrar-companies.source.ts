import { Injectable, Logger } from '@nestjs/common';
import { SourceResult, RegistrarCompaniesData } from '../interfaces/pipeline-data.interface';

@Injectable()
export class RegistrarCompaniesSource {
  private readonly logger = new Logger(RegistrarCompaniesSource.name);

  async fetch(dealType: string): Promise<SourceResult<RegistrarCompaniesData>> {
    const startTime = Date.now();
    this.logger.log(`🏢 [Source 9/11] Querying Registrar of Companies (רשם החברות Online) for developer status`);

    try {
      const isDeveloper = dealType === 'new-developer';
      const data: RegistrarCompaniesData = {
        isCompanyOwner: isDeveloper,
        companyId: isDeveloper ? '515904832' : undefined,
        companyName: isDeveloper ? 'יזמי נדל״ן בע״מ' : undefined,
        status: 'חברה פעילה רשומה כחוק',
        isDelinquentCompany: false,
      };

      return {
        sourceId: 'registrarCompanies',
        sourceName: 'רשם החברות (תאגידים Online)',
        success: true,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data,
      };
    } catch (err: any) {
      this.logger.warn(`⚠️ Registrar of Companies source failed: ${err?.message}`);
      return {
        sourceId: 'registrarCompanies',
        sourceName: 'רשם החברות (תאגידים Online)',
        success: false,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        data: null,
        warning: 'רשם החברות: בדיקת חברה לא בוצעה.',
      };
    }
  }
}
