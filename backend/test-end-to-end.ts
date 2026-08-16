import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PipelineService } from './src/pipeline/pipeline.service';

async function testEndToEnd() {
  console.log('🧪 Starting End-to-End Pipeline & Valuation Test...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  
  const pipelineService = app.get(PipelineService);
  const jobId = `TEST-E2E-${Date.now()}`;

  const payload = {
    location: {
      city: 'תל אביב-יפו',
      street: 'דיזנגוף',
      houseNumber: '142',
      block: '',
      parcel: '',
      subParcel: '',
    },
    details: {
      dealType: 'second-hand',
      askingPrice: '3,450,000',
      propertyArea: '85',
      roomsCount: '4',
      floorNumber: '3',
      condition: 'renovated',
      hasMamad: true,
      hasParking: true,
      hasStorage: true,
      hasElevator: true,
    },
    documents: {
      tabuFileName: null,
      tabuFileBuffer: null,
      additionalDocNames: [],
    },
    personal: {
      fullName: 'ישראל ישראלי',
      email: 'israel@example.com',
      phone: '054-1234567',
    },
  };

  console.log('📥 Executing 11-Source Pipeline for:', payload.location);
  const startTime = Date.now();

  try {
    const report = await pipelineService.runPipeline(jobId, payload as any);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n======================================================');
    console.log(`✅ PIPELINE EXECUTED SUCCESSFULLY IN ${duration}s!`);
    console.log('======================================================');
    console.log(`🆔 Job ID: ${report.jobId}`);
    console.log(`🛡️ SafeScore: ${report.safeScore} / 100`);
    console.log(`⚠️ Risk Level: ${report.riskLevel} (${report.riskText})`);
    console.log(`📍 Address: ${report.property.address}`);
    console.log(`🗺️ Cadastral: ${report.property.cadastral}`);
    console.log('\n---------------- VALUATION REPORT ----------------');
    console.log(`💰 Estimated Market Value: ₪${report.valuation?.estimatedValue?.toLocaleString()}`);
    console.log(`📊 Valuation Range: ₪${report.valuation?.minValue?.toLocaleString()} — ₪${report.valuation?.maxValue?.toLocaleString()}`);
    console.log(`🏷️ Asking Price: ₪${report.valuation?.askingPrice?.toLocaleString()}`);
    console.log(`⚖️ Deal Fairness: ${report.valuation?.dealFairness} (${report.valuation?.fairnessLabel})`);
    console.log(`📈 Confidence: ${report.valuation?.confidenceLevel} (${report.valuation?.confidenceReason})`);
    console.log(`📋 Comparable Sales Found: ${report.valuation?.comparableDeals?.length || 0}`);
    if (report.valuation?.comparableDeals?.length) {
      report.valuation.comparableDeals.forEach((d, i) => {
        console.log(`   ${i + 1}. Date: ${d.dealDate} | ${d.rooms} | ${d.sqm} m² | ₪${d.price?.toLocaleString()} (₪${d.pricePerSqm?.toLocaleString()}/m²)`);
      });
    }

    console.log('\n---------------- 11 SOURCES STATUS ----------------');
    report.sourceStatuses.forEach((s) => {
      console.log(`   [${s.status.toUpperCase()}] ${s.sourceName}`);
    });

  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
  } finally {
    await app.close();
  }
}

testEndToEnd();
