import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { AiSynthesisService } from './ai-synthesis.service';
import { ScoringEngineService } from './scoring-engine.service';
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

@Module({
  providers: [
    PipelineService,
    AiSynthesisService,
    ScoringEngineService,
    GovMapSource,
    TaxAuthoritySource,
    RealEstateGovSource,
    XplanSource,
    CbsSource,
    UrbanRenewalSource,
    TabuSource,
    MunicipalSource,
    RegistrarCompaniesSource,
    PledgesSource,
    JudicialSource,
  ],
  exports: [PipelineService, AiSynthesisService, ScoringEngineService],
})
export class PipelineModule {}
