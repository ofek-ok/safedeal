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
import { AggregatedPipelineData } from './interfaces/pipeline-data.interface';
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

export interface PipelinePayload {
  location: {
    city: string;
    street: string;
    houseNumber: string;
    block?: string;
    parcel?: string;
    subParcel?: string;
  };
  details: {
    dealType?: string;
    askingPrice?: string;
    propertyArea?: string;
    roomsCount?: string;
  };
  documents: {
    tabuFileName?: string | null;
    tabuFileBuffer?: Buffer | null;
    additionalDocNames?: string[];
  };
  personal?: {
    fullName?: string;
    email?: string;
    phone?: string;
    idNumber?: string;
  };
  seller?: {
    name?: string;
    idNumber?: string;
    companyId?: string;
  };
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

  getJobProgress(jobId: string): JobProgress | undefined {
    return this.jobs.get(jobId);
  }

  getReport(jobId: string): SynthesizedReport | undefined {
    return this.jobs.get(jobId)?.report;
  }

  /**
   * Executes all 11 sources concurrently, aggregates, and synthesizes the report.
   */
  async runPipeline(jobId: string, payload: PipelinePayload): Promise<SynthesizedReport> {
    this.logger.log(`🚀 Starting 11-Source Pipeline — Job: ${jobId}`);

    let job = this.jobs.get(jobId);
    if (!job) job = this.registerJob(jobId);

    job.status = 'processing';
    job.percentComplete = 8;
    job.currentStepMessage = 'מתחבר ל-11 מאגרי מידע ממשלתיים וסטטיסטיים...';

    const block = payload.location.block || '';
    const parcel = payload.location.parcel || '';
    const subParcel = payload.location.subParcel || '';
    const allWarnings: string[] = [];

    const guard = async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
      try {
        return await fn();
      } catch (err: any) {
        const msg = `${label} — שגיאה: ${err?.message || 'לא ידוע'}`;
        allWarnings.push(msg);
        this.logger.warn(msg);
        throw err;
      }
    };

    // ── Execute all 11 sources concurrently ──────────────────────────────────
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
    ] = await Promise.allSettled([
      // 1. GovMap
      guard(
        () => this.govMapSource.fetch({
          address: `${payload.location.street} ${payload.location.houseNumber}, ${payload.location.city}`,
          city: payload.location.city,
          street: payload.location.street,
          houseNumber: payload.location.houseNumber,
        }),
        'GovMap',
      ),

      // 2. Tax Authority — nadlan.gov.il deals
      guard(
        () => this.taxAuthoritySource.fetch({ block, parcel, city: payload.location.city }),
        'רשות המסים',
      ),

      // 3. Real Estate Gov — city price stats
      guard(
        () => this.realEstateGovSource.fetch({
          city: payload.location.city,
          neighborhood: payload.location.street,
        }),
        'נדל"ן ממשלתי',
      ),

      // 4. XPLAN / Mavat
      guard(
        () => this.xplanSource.fetch({ block, parcel, subParcel }),
        'XPLAN/Mavat',
      ),

      // 5. CBS — static city cluster
      guard(
        () => this.cbsSource.fetch({ city: payload.location.city }),
        'הלמ"ס',
      ),

      // 6. Urban Renewal — data.gov.il
      guard(
        () => this.urbanRenewalSource.fetch({
          block,
          parcel,
          city: payload.location.city,
        }),
        'התחדשות עירונית',
      ),

      // 7. Tabu — PDF + Gemini OCR
      guard(
        () => this.tabuSource.fetch({
          tabuFileName: payload.documents.tabuFileName,
          tabuFileBuffer: payload.documents.tabuFileBuffer || null,
          block,
          parcel,
        }),
        'נסח טאבו',
      ),

      // 8. Municipal — data.gov.il building permits (all Israel)
      guard(
        () => this.municipalSource.fetch({
          city: payload.location.city,
          street: payload.location.street,
          houseNumber: payload.location.houseNumber,
          block,
          parcel,
        }),
        'הנדסה עירונית',
      ),

      // 9. Registrar of Companies
      guard(
        () => this.registrarCompaniesSource.fetch({
          companyId: payload.seller?.companyId,
          companyName: payload.seller?.name,
          sellerName: payload.personal?.fullName,
        }),
        'רשם החברות',
      ),

      // 10. Pledges
      guard(
        () => this.pledgesSource.fetch({
          block,
          parcel,
          ownerName: payload.seller?.name || payload.personal?.fullName,
          ownerId: payload.seller?.idNumber || payload.personal?.idNumber,
        }),
        'רשם המשכונות',
      ),

      // 11. Judicial
      guard(
        () => this.judicialSource.fetch({
          sellerName: payload.seller?.name,
          sellerId: payload.seller?.idNumber,
          buyerName: payload.personal?.fullName,
          buyerId: payload.personal?.idNumber,
        }),
        'נט המשפט',
      ),
    ]);

    // ── Resolve allSettled results ────────────────────────────────────────────
    const resolve = <T>(settled: PromiseSettledResult<T>, fallback: T): T =>
      settled.status === 'fulfilled' ? settled.value : fallback;

    const emptySource = (src: string) => ({
      source: src,
      success: false,
      data: {} as any,
      warnings: ['Source execution failed'],
    });

    job.percentComplete = 72;
    job.completedSourcesCount = 11;
    job.currentStepMessage = 'מנוע AI Synthesis מעבד את 11 המקורות ומחשב SafeScore...';

    const aggregatedData: AggregatedPipelineData = {
      jobId,
      submittedAt: new Date().toISOString(),
      location: {
        city: payload.location.city,
        street: payload.location.street,
        houseNumber: payload.location.houseNumber,
        block,
        parcel,
        subParcel,
      },
      sources: {
        govmap: resolve(govmapRes, emptySource('govmap')),
        taxAuthority: resolve(taxRes, emptySource('tax_authority')),
        realEstateGov: resolve(realEstateRes, emptySource('real_estate_gov')),
        xplan: resolve(xplanRes, emptySource('xplan')),
        cbs: resolve(cbsRes, emptySource('cbs')),
        urbanRenewal: resolve(urbanRenewalRes, emptySource('urban_renewal')),
        tabu: resolve(tabuRes, emptySource('tabu')),
        municipal: resolve(municipalRes, emptySource('municipal')),
        registrarCompanies: resolve(companiesRes, emptySource('registrar_companies')),
        pledges: resolve(pledgesRes, emptySource('pledges')),
        judicial: resolve(judicialRes, emptySource('judicial')),
      },
      warnings: allWarnings,
    };

    // ── Synthesize final report ───────────────────────────────────────────────
    const report = this.aiSynthesisService.synthesizeReport(aggregatedData);

    job.status = 'completed';
    job.percentComplete = 100;
    job.currentStepMessage = 'הדוח הושלם בהצלחה — SafeScore מוכן';
    job.report = report;
    job.warnings = allWarnings;

    this.logger.log(
      `✅ Pipeline completed — Job: ${jobId} | SafeScore: ${report.safeScore} | Warnings: ${allWarnings.length}`,
    );

    return report;
  }
}
