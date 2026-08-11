import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { PropertiesService } from './properties.service';
import { CreatePropertyAnalysisDto } from './dto/create-property-analysis.dto';
import { CadastralService } from './cadastral.service';

@Controller('properties')
export class PropertiesController {
  private readonly logger = new Logger(PropertiesController.name);

  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly cadastralService: CadastralService,
  ) {}

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
   * POST /api/v1/properties/upload-doc
   * Uploads a document (like Tabu PDF) to the server temporarily.
   */
  @Post('upload-doc')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = randomUUID();
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadDoc(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
          new FileTypeValidator({ fileType: '.(pdf|jpg|jpeg|png|doc|docx)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.log(
      `POST /api/v1/properties/upload-doc received: ${file.filename}`,
    );
    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Post('cadastral-lookup')
  async lookupCadastral(
    @Body() body: { city: string; street: string; houseNumber: string },
  ) {
    return this.cadastralService.lookup(
      body.city,
      body.street,
      body.houseNumber,
    );
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
