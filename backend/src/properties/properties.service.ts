import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatePropertyAnalysisDto } from './dto/create-property-analysis.dto';
import { PipelineService, JobProgress } from '../pipeline/pipeline.service';
import { SynthesizedReport } from '../pipeline/interfaces/synthesized-report.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly pipelineService: PipelineService) {}

  /**
   * Initiate property analysis: register job, trigger async 11-source pipeline execution, and return immediate response.
   */
  async initiateAnalysis(dto: CreatePropertyAnalysisDto): Promise<JobProgress> {
    const jobId = `SD-${randomUUID().slice(0, 8).toUpperCase()}`;

    this.logger.log(`📥 Received property analysis request | Job ID: ${jobId}`);
    this.logger.log(
      `   Target Property: ${dto.location.streetName} ${dto.location.houseNumber}, ${dto.location.city}`,
    );

    // Register job in queued state
    const jobProgress = this.pipelineService.registerJob(jobId);

    // Trigger pipeline processing asynchronously (background task)
    const payload = {
      location: {
        city: dto.location.city,
        street: dto.location.streetName,
        houseNumber: dto.location.houseNumber,
        block: dto.location.block,
        parcel: dto.location.parcel,
        subParcel: dto.location.subParcel,
      },
      details: {
        dealType: dto.details.dealType,
        askingPrice: dto.details.askingPrice,
        propertyArea: dto.details.propertyArea,
        roomsCount: dto.details.roomsCount,
      },
      documents: {
        tabuFileName: dto.documents.tabuFileName,
        additionalDocNames: dto.documents.additionalDocNames || [],
      },
    };

    // Run pipeline asynchronously
    this.pipelineService.runPipeline(jobId, payload).catch((err) => {
      this.logger.error(`❌ Pipeline failed for Job ${jobId}: ${err?.message}`, err?.stack);
    });

    return jobProgress;
  }

  /**
   * Fetch current job progress status
   */
  getJobStatus(jobId: string): JobProgress {
    const status = this.pipelineService.getJobProgress(jobId);
    if (!status) {
      throw new NotFoundException(`בדיקה מספר #${jobId} לא נמצאה בשרת`);
    }
    return status;
  }

  /**
   * Fetch final synthesized due-diligence report
   */
  getReport(jobId: string): SynthesizedReport {
    const report = this.pipelineService.getReport(jobId);
    if (!report) {
      // If job is still processing, attempt to generate or return error
      const status = this.pipelineService.getJobProgress(jobId);
      if (!status) {
        throw new NotFoundException(`דוח עבור בקשה #${jobId} לא נמצא`);
      }
      if (status.status !== 'completed') {
        throw new NotFoundException(`הדוח עבור בקשה #${jobId} עדיין בתהליך עיבוד (${status.percentComplete}%)`);
      }
      throw new NotFoundException(`דוח עבור בקשה #${jobId} אינו זמין כעת`);
    }
    return report;
  }
}
