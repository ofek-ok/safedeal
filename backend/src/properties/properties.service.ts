import { Injectable, Logger } from '@nestjs/common';
import { CreatePropertyAnalysisDto } from './dto/create-property-analysis.dto';
import { randomUUID } from 'crypto';

export interface AnalysisJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  receivedAt: string;
}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  /**
   * Receive a property analysis request, log it, and enqueue it.
   * In Milestone 2 this will push a job to BullMQ.
   */
  async initiateAnalysis(dto: CreatePropertyAnalysisDto): Promise<AnalysisJob> {
    const jobId = `SD-${randomUUID().slice(0, 8).toUpperCase()}`;

    this.logger.log(`📥 New analysis request | Job: ${jobId}`);
    this.logger.log(
      `   Location: ${dto.location.streetName} ${dto.location.houseNumber}, ${dto.location.city}`,
    );
    this.logger.log(
      `   Deal: ${dto.details.dealType} | Price: ₪${dto.details.askingPrice} | ${dto.details.roomsCount} rooms, ${dto.details.propertyArea}m²`,
    );
    this.logger.log(
      `   Tabu: ${dto.documents.tabuFileName ?? 'not provided'} | Additional docs: ${dto.documents.additionalDocNames.length}`,
    );
    this.logger.debug('Full DTO:', JSON.stringify(dto, null, 2));

    // TODO (Milestone 2): enqueue to BullMQ
    // await this.analysisQueue.add('run-analysis', { jobId, dto });

    return {
      jobId,
      status: 'queued',
      message: 'הבקשה התקבלה ועומדת להיות מעובדת.',
      receivedAt: new Date().toISOString(),
    };
  }
}
