import { Injectable, Logger } from '@nestjs/common';
import { GovMapSource } from './sources/govmap.source';
import { TaxAuthoritySource } from './sources/tax-authority.source';
import { RealEstateGovSource } from './sources/real-estate-gov.source';
import { XplanSource } from './sources/xplan.source';
import { CbsSource } from './sources/cbs.source';
import { UrbanRenewalSource } from './sources/urban-renewal.source';
import { TabuSource } from './sources/tabu.source';
import { MunicipalSource } from './sources/municipal.source';
import { RegistrarCompaniesSource } from './sources/registrar-companies.source';
import { PledgesSource } from './sources/pledges.source';
import { JudicialSource } from './sources/judicial.source';
import { AiSynthesisService } from './ai-synthesis.service';
import { AggregatedPipelineData, SourceResult } from './interfaces/pipeline-data.interface';
import { SynthesizedReport } from './interfaces/synthesized-report.interface';

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  percentComplete: number;
  completedSourcesCount: number;
  totalSourcesCount: number;
  currentStepMessage: string;
  report?: SynthesizedReport;
  warnings: string[];
  createdAt: string;
}

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);
  private readonly jobs = new Map<string, JobProgress>();

  constructor(
    private readonly govMapSource: GovMapSource,
    private readonly taxAuthoritySource: TaxAuthoritySource,
    private readonly realEstateGovSource: RealEstateGovSource,
    private readonly xplanSource: XplanSource,
    private readonly cbsSource: CbsSource,
    private readonly urbanRenewalSource: UrbanRenewalSource,
    private readonly tabuSource: TabuSource,
    private readonly municipalSource: MunicipalSource,
    private readonly registrarCompaniesSource: RegistrarCompaniesSource,
    private readonly pledgesSource: PledgesSource,
    private readonly judicialSource: JudicialSource,
    private readonly aiSynthesisService: AiSynthesisService,
  ) {}

  /**
   * Register a new job in queued state
   */
  registerJob(jobId: string): JobProgress {
    const job: JobProgress = {
      jobId,
      status: 'queued',
      percentComplete: 0,
      completedSourcesCount: 0,
      totalSourcesCount: 11,
      currentStepMessage: 'הבקשה התקבלה בתור העיבוד',
      warnings: [],
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);
    return job;
  }

  /**
   * Get job progress status
   */
  getJobProgress(jobId: string): JobProgress | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get final synthesized report for job
   */
  getReport(jobId: string): SynthesizedReport | undefined {
    return this.jobs.get(jobId)?.report;
  }

  /**
   * Executes the 11-source pipeline asynchronously for a job
   */
  async runPipeline(
    jobId: string,
    payload: {
      location: { city: string; street: string; houseNumber: string; block?: string; parcel?: string; subParcel?: string };
      details: { dealType?: string; askingPrice?: string; propertyArea?: string; roomsCount?: string };
      documents: { tabuFileName?: string | null; additionalDocNames?: string[] };
      personal?: { fullName?: string; email?: string; phone?: string };
    },
  ): Promise<SynthesizedReport> {
    this.logger.log(`🚀 Starting 11-Source Execution Pipeline for Job: ${jobId}`);

    let job = this.jobs.get(jobId);
    if (!job) {
      job = this.registerJob(jobId);
    }

    job.status = 'processing';
    job.percentComplete = 10;
    job.currentStepMessage = 'מתחבר למאגרים ממשלתיים וקדסטרליים (GovMap, טאבו, XPLAN)...';

    const warnings: string[] = [];

    // Helper wrapper for non-blocking source execution
    const runSource = async <T>(
      fn: () => Promise<SourceResult<T>>,
      defaultSourceId: string,
      defaultSourceName: string,
    ): Promise<SourceResult<T>> => {
      try {
        const res = await fn();
        if (res.warning) warnings.push(res.warning);
        return res;
      } catch (err: any) {
        const warnMsg = `${defaultSourceName}: השאילתה נכשלה (${err?.message || 'שגיאת תקשורת'})`;
        warnings.push(warnMsg);
        return {
          sourceId: defaultSourceId,
          sourceName: defaultSourceName,
          success: false,
          timestamp: new Date().toISOString(),
          executionTimeMs: 0,
          data: null,
          warning: warnMsg,
        };
      }
    };

    // Execute 11 sources concurrently via Promise.allSettled
    const [
      govmapRes,
      taxRes,
      realEstateRes,
      xplanRes,
      cbsRes,
      urbanRenewalRes,
      tabuRes,
      municipalRes,
      companiesRes,
      pledgesRes,
      judicialRes,
    ] = await Promise.all([
      runSource(() => this.govMapSource.fetch(payload.location), 'govmap', 'GovMap'),
      runSource(() => this.taxAuthoritySource.fetch(payload.location.block || '6902', payload.location.parcel || '44'), 'taxAuthority', 'רשות המסים'),
      runSource(() => this.realEstateGovSource.fetch(payload.location.city), 'realEstateGov', 'אתר הנדל"ן הממשלתי'),
      runSource(() => this.xplanSource.fetch(payload.location.block || '6902', payload.location.parcel || '44'), 'xplan', 'XPLAN מינהל התכנון'),
      runSource(() => this.cbsSource.fetch(payload.location.city), 'cbs', 'הלמ"ס'),
      runSource(() => this.urbanRenewalSource.fetch(payload.location.block || '6902', payload.location.parcel || '44'), 'urbanRenewal', 'הרשות להתחדשות עירונית'),
      runSource(() => this.tabuSource.fetch(payload.documents.tabuFileName), 'tabu', 'נסח טאבו'),
      runSource(() => this.municipalSource.fetch(payload.location.city, payload.location.street, payload.location.houseNumber), 'municipal', 'אתרי הנדסה עירוניים'),
      runSource(() => this.registrarCompaniesSource.fetch(payload.details.dealType || 'second-hand'), 'registrarCompanies', 'רשם החברות'),
      runSource(() => this.pledgesSource.fetch(payload.personal?.phone), 'pledges', 'רשם המשכונות'),
      runSource(() => this.judicialSource.fetch(payload.personal?.fullName), 'judicial', 'נבו / נט המשפט'),
    ]);

    job.percentComplete = 75;
    job.completedSourcesCount = 11;
    job.currentStepMessage = 'מעבד ומצליב את כל 11 המקורות במנוע AI Synthesis...';

    // Aggregate results
    const aggregatedData: AggregatedPipelineData = {
      jobId,
      submittedAt: new Date().toISOString(),
      location: {
        city: payload.location.city,
        street: payload.location.street,
        houseNumber: payload.location.houseNumber,
        block: payload.location.block || '6902',
        parcel: payload.location.parcel || '44',
        subParcel: payload.location.subParcel || '12',
      },
      sources: {
        govmap: govmapRes,
        taxAuthority: taxRes,
        realEstateGov: realEstateRes,
        xplan: xplanRes,
        cbs: cbsRes,
        urbanRenewal: urbanRenewalRes,
        tabu: tabuRes,
        municipal: municipalRes,
        registrarCompanies: companiesRes,
        pledges: pledgesRes,
        judicial: judicialRes,
      },
      warnings,
    };

    // Synthesize final report using AI engine
    const report = this.aiSynthesisService.synthesizeReport(aggregatedData);

    job.status = 'completed';
    job.percentComplete = 100;
    job.currentStepMessage = 'הדוח הושלם בהצלחה וזמין לצפייה';
    job.report = report;
    job.warnings = warnings;

    this.logger.log(`✅ Pipeline execution finished for Job: ${jobId} | SafeScore: ${report.safeScore}`);
    return report;
  }
}
