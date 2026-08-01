import {
  Controller,
  Post,
  Body,
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
   *
   * Accepts property details from the SafeDeal multi-step form,
   * validates the payload using class-validator, and enqueues
   * a background analysis job.
   */
  @Post('analyze')
  @HttpCode(HttpStatus.ACCEPTED)
  async analyze(@Body() dto: CreatePropertyAnalysisDto) {
    this.logger.log('POST /api/v1/properties/analyze received');
    return this.propertiesService.initiateAnalysis(dto);
  }
}
