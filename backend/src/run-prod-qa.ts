async function runProdQA() {
  console.log('🚀 Initiating Real Production Analysis on Render: https://safedeal.onrender.com ...\n');

  const prodUrl = 'https://safedeal.onrender.com';

  const testPayload = {
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
      fullName: 'ישראל ישראלי (Prod QA)',
      email: 'qa-prod@safedeal.co.il',
      phone: '050-1234567',
    },
  };

  console.log('📍 Submitting POST request to Render Production API...');
  const initRes = await fetch(`${prodUrl}/api/v1/properties/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });

  if (!initRes.ok) {
    console.error(`❌ HTTP Error on analyze: ${initRes.status} ${initRes.statusText}`);
    const text = await initRes.text();
    console.error('Response:', text);
    return;
  }

  const initData: any = await initRes.json();
  const jobId = initData.jobId;
  console.log(`✅ Job ID Created on Render Production: ${jobId}\n`);

  let isCompleted = false;
  let attempts = 0;

  while (!isCompleted && attempts < 40) {
    await new Promise((r) => setTimeout(r, 2000));
    attempts++;

    const statusRes = await fetch(`${prodUrl}/api/v1/properties/status/${jobId}`);
    if (!statusRes.ok) {
      console.log(`⏳ Poll Attempt ${attempts}: Waiting for server response (${statusRes.status})...`);
      continue;
    }

    const progress: any = await statusRes.json();
    console.log(
      `⏳ Attempt ${attempts}: Status=${progress.status}, ${progress.percentComplete}% - ${progress.currentStepMessage}`,
    );

    if (progress.status === 'completed') {
      isCompleted = true;
      const rptRes = await fetch(`${prodUrl}/api/v1/properties/report/${jobId}`);
      const report: any = await rptRes.json();

      console.log('\n====================================================');
      console.log('🌐 PRODUCTION RENDER E2E QA AUDIT RESULTS FOR JOB:', jobId);
      console.log('====================================================');
      console.log(`🏠 Address: ${report.property.address}`);
      console.log(`📍 Cadastral (GovMap Lot/Parcel): ${report.property.cadastral}`);
      console.log(`🛡️ SafeScore: ${report.safeScore}/100 (${report.riskText})`);
      console.log(`💡 Recommendation: ${report.recommendationText}`);
      console.log(`🔗 LIVE VERCEL REPORT URL: https://safedeal-coral.vercel.app/report/${jobId}`);
      console.log('\n💰 VALUATION & MARKET COMPARISON (Production Data):');
      console.log(`   - Estimated Market Value: ₪${report.valuation?.estimatedValue?.toLocaleString()}`);
      console.log(`   - Asking Price: ₪${report.valuation?.askingPrice?.toLocaleString()}`);
      console.log(`   - Price Diff: ${report.valuation?.priceDiffPercent}% (${report.valuation?.dealFairness})`);

      console.log('\n🏛️ 4 PILLARS DUE-DILIGENCE STATUS:');
      console.log('   1. Cadastral & Legal:', report.pillars.cadastral.metrics.map((m: any) => `\n      - ${m.label}: ${m.value} [${m.status}]`).join(''));
      console.log('   2. Economic & Market:', report.pillars.economic.metrics.map((m: any) => `\n      - ${m.label}: ${m.value} [${m.status}]`).join(''));
      console.log('   3. Planning & Zoning:', report.pillars.planning.metrics.map((m: any) => `\n      - ${m.label}: ${m.value} [${m.status}]`).join(''));
      console.log('   4. Engineering & Municipal:', report.pillars.engineering.metrics.map((m: any) => `\n      - ${m.label}: ${m.value} [${m.status}]`).join(''));

      console.log('\n🔌 11 SOURCE CONNECTION STATUSES ON PRODUCTION:');
      report.sourceStatuses.forEach((s: any) => {
        console.log(`   - [${s.status.toUpperCase()}] ${s.sourceName}`);
      });
      console.log('====================================================\n');
    } else if (progress.status === 'failed') {
      console.error('❌ Job Failed on Production:', progress.warnings);
      break;
    }
  }
}

runProdQA();
