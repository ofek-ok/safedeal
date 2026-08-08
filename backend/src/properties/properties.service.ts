import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreatePropertyAnalysisDto } from './dto/create-property-analysis.dto';
import { PipelineService, JobProgress } from '../pipeline/pipeline.service';
import { SynthesizedReport } from '../pipeline/interfaces/synthesized-report.interface';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly pipelineService: PipelineService) {}

  async initiateAnalysis(dto: CreatePropertyAnalysisDto): Promise<{ jobId: string } & JobProgress> {
    const jobId = `SD-${randomUUID().slice(0, 8).toUpperCase()}`;

    // Resolve street from either "street" or legacy "streetName"
    const street = dto.location.street || dto.location.streetName || '';
    // Resolve deal details from either "deal" or legacy "details"
    const deal = dto.deal || dto.details || {};

    this.logger.log(`📥 Analysis request — Job: ${jobId}`);
    this.logger.log(`   Property: ${street} ${dto.location.houseNumber || ''}, ${dto.location.city}`);
    this.logger.log(`   Personal: ${dto.personal?.fullName || 'anonymous'} (${dto.personal?.email || 'no email'})`);

    const jobProgress = this.pipelineService.registerJob(jobId);

    let tabuFileBuffer: Buffer | null = null;
    if (dto.documents?.tabuFileName) {
      try {
        const filePath = path.join(process.cwd(), 'uploads', dto.documents.tabuFileName);
        tabuFileBuffer = await fs.readFile(filePath);
        this.logger.log(`   Tabu file loaded: ${dto.documents.tabuFileName} (${tabuFileBuffer.length} bytes)`);
      } catch (err) {
        this.logger.warn(`   Failed to load tabu file ${dto.documents.tabuFileName}: ${err.message}`);
      }
    }

    const payload = {
      location: {
        city: dto.location.city,
        street,
        houseNumber: dto.location.houseNumber || '',
        block: dto.location.block || '',
        parcel: dto.location.parcel || '',
        subParcel: dto.location.subParcel || '',
      },
      details: {
        dealType: deal.dealType,
        askingPrice: deal.askingPrice,
        propertyArea: deal.propertyArea,
        roomsCount: deal.roomsCount,
      },
      documents: {
        tabuFileName: dto.documents?.tabuFileName ?? null,
        tabuFileBuffer,
        additionalDocNames: dto.documents?.additionalDocNames || [],
      },
      personal: {
        fullName: dto.personal?.fullName,
        email: dto.personal?.email,
        phone: dto.personal?.phone,
        idNumber: dto.personal?.idNumber,
      },
      seller: {
        name: dto.personal?.fullName, // placeholder — seller details TBD in future
      },
    };

    // Run async in background — do not await
    this.pipelineService.runPipeline(jobId, payload).catch((err) => {
      this.logger.error(`❌ Pipeline failed — Job ${jobId}: ${err?.message}`, err?.stack);
    });

    return { ...jobProgress, jobId };
  }

  getJobStatus(jobId: string): JobProgress {
    const status = this.pipelineService.getJobProgress(jobId);
    if (!status) {
      throw new NotFoundException(`בדיקה מספר #${jobId} לא נמצאה`);
    }
    return status;
  }

  getReport(jobId: string): SynthesizedReport {
    const report = this.pipelineService.getReport(jobId);
    if (report) return report;

    const status = this.pipelineService.getJobProgress(jobId);
    if (!status) {
      throw new NotFoundException(`דוח עבור בקשה #${jobId} לא נמצא`);
    }
    throw new NotFoundException(`הדוח עבור #${jobId} עדיין בעיבוד (${status.percentComplete}%)`);
  }
}
