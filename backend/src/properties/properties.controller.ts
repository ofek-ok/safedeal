import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyAnalysisDto } from './dto/create-property-analysis.dto';

@Controller('properties')
export class PropertiesController {
  private readonly logger = new Logger(PropertiesController.name);

  constructor(private readonly propertiesService: PropertiesService) {}

  /**
   * POST /api/v1/properties/analyze
   * Enqueues property analysis job and initiates 11-source pipeline.
   */
  @Post('analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  async analyze(@Body() dto: CreatePropertyAnalysisDto) {
    this.logger.log('POST /api/v1/properties/analyze received');
    return this.propertiesService.initiateAnalysis(dto);
  }

  /**
   * GET /api/v1/properties/status/:jobId
   * Returns live progress status of the 11-source pipeline (0-100%).
   */
  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    return this.propertiesService.getJobStatus(jobId);
  }

  /**
   * GET /api/v1/properties/report/:jobId
   * Returns the final synthesized due-diligence report object.
   */
  @Get('report/:jobId')
  async getReport(@Param('jobId') jobId: string) {
    return this.propertiesService.getReport(jobId);
  }
}
