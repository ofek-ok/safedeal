import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PipelineModule } from '../pipeline/pipeline.module';
import { CadastralService } from './cadastral.service';

@Module({
  imports: [PipelineModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, CadastralService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
