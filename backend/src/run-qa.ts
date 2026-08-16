import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PropertiesService } from './properties/properties.service';

async function runQA() {
  console.log('🚀 Starting Full SafeDeal Automated E2E QA Test...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const propertiesService = app.get(PropertiesService);

  const testPayload: any = {
    location: {
      city: 'תל אביב-יפו',
      street: 'דיזנגוף',
      houseNumber: '140',
      block: '6902',
      parcel: '14',
    },
    details: {
      dealType: 'second-hand',
      askingPrice: '3450000',
      propertyArea: '85',
      roomsCount: '3.5',
      condition: 'good',
      hasParking: true,
      hasStorage: true,
      hasMamad: true,
      hasElevator: true,
      hasBalcony: true,
      sellerName: 'ישראל ישראלי',
    },
    documents: {},
    personal: {
      fullName: 'ישראל ישראלי (QA Test)',
      email: 'qa-tester@safedeal.co.il',
      phone: '050-1234567',
    },
  };

  console.log('📍 Initiating Real Pipeline Analysis for: תל אביב-יפו, דיזנגוף 140...');
  const initResult = await propertiesService.initiateAnalysis(testPayload);
  const jobId = initResult.jobId;
  console.log(`📋 Job ID Created: ${jobId}\n`);

  let isCompleted = false;
  let attempts = 0;

  while (!isCompleted && attempts < 30) {
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;
    const progress = propertiesService.getJobStatus(jobId);

    console.log(
      `⏳ Attempt ${attempts}: Status=${progress.status}, ${progress.percentComplete}% - ${progress.currentStepMessage}`,
    );

    if (progress.status === 'completed') {
      isCompleted = true;
      const report = propertiesService.getReport(jobId);

      console.log('\n====================================================');
      console.log('📊 REAL E2E QA AUDIT RESULTS FOR JOB:', jobId);
      console.log('====================================================');
      console.log(`🏠 Address: ${report.property.address}`);
      console.log(`📍 Cadastral (GovMap Lot/Parcel): ${report.property.cadastral}`);
      console.log(`🛡️ SafeScore: ${report.safeScore}/100 (${report.riskText})`);
      console.log(`💡 Recommendation: ${report.recommendationText}`);
      console.log('\n💰 VALUATION & MARKET COMPARISON (Real Tax Authority Transactions):');
      console.log(`   - Estimated Market Value: ₪${report.valuation?.estimatedValue?.toLocaleString()}`);
      console.log(`   - Asking Price: ₪${report.valuation?.askingPrice?.toLocaleString()}`);
      console.log(`   - Price Diff: ${report.valuation?.priceDiffPercent}% (${report.valuation?.dealFairness})`);
      console.log(`   - Comparable Deals Found: ${report.valuation?.comparableDeals?.length}`);
      
      report.valuation?.comparableDeals.slice(0, 4).forEach((deal, idx) => {
        console.log(`     [${idx + 1}] ${deal.dealDate} | ${deal.address} | ${deal.sqm}m² | ₪${deal.price.toLocaleString()} (₪${deal.pricePerSqm.toLocaleString()}/m²)`);
      });

      console.log('\n🏙️ MADLAN & NEIGHBORHOOD INSIGHTS:');
      console.log(`   - Neighborhood Rating: ${report.madlanInsights?.overallScore}/10 (${report.madlanInsights?.neighborhoodName})`);
      console.log(`   - 5-Year Price Trend: ${report.madlanInsights?.priceTrend5Years}`);
      console.log(`   - Demand Index: ${report.madlanInsights?.demandLabel}`);
      console.log(`   - Estimated Monthly Rent: ₪${report.madlanInsights?.estimatedMonthlyRent?.toLocaleString()} (${report.madlanInsights?.estimatedYieldPercent}% yield)`);

      console.log('\n🏛️ 4 PILLARS DUE-DILIGENCE STATUS:');
      console.log('   1. Cadastral & Legal:', report.pillars.cadastral.metrics.map(m => `\n      - ${m.label}: ${m.value} [${m.status}]`).join(''));
      console.log('   2. Economic & Market:', report.pillars.economic.metrics.map(m => `\n      - ${m.label}: ${m.value} [${m.status}]`).join(''));
      console.log('   3. Planning & Zoning:', report.pillars.planning.metrics.map(m => `\n      - ${m.label}: ${m.value} [${m.status}]`).join(''));
      console.log('   4. Engineering & Municipal:', report.pillars.engineering.metrics.map(m => `\n      - ${m.label}: ${m.value} [${m.status}]`).join(''));

      console.log('\n🔌 11 SOURCE CONNECTION STATUSES:');
      report.sourceStatuses.forEach(s => {
        console.log(`   - [${s.status.toUpperCase()}] ${s.sourceName}`);
      });
      console.log('====================================================\n');
    } else if (progress.status === 'failed') {
      console.error('❌ Job Failed:', progress.warnings);
      break;
    }
  }

  await app.close();
}

runQA();
