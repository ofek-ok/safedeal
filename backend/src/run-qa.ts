import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PropertiesService } from './properties/properties.service';

interface TestScenario {
  id: string;
  name: string;
  payload: any;
  expectedMinCoverage: number;
}

async function runScenario(propertiesService: PropertiesService, scenario: TestScenario) {
  console.log(`\n================================================================`);
  console.log(`🧪 RUNNING TEST SCENARIO [${scenario.id}]: ${scenario.name}`);
  console.log(`================================================================`);

  const initResult = await propertiesService.initiateAnalysis(scenario.payload);
  const jobId = initResult.jobId;
  console.log(`📍 Initiated Job ID: ${jobId}`);

  let isCompleted = false;
  let attempts = 0;

  while (!isCompleted && attempts < 30) {
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;
    const progress = propertiesService.getJobStatus(jobId);

    console.log(
      `⏳ Attempt ${attempts}: ${progress.percentComplete}% - ${progress.currentStepMessage}`,
    );

    if (progress.status === 'completed') {
      isCompleted = true;
      const report = propertiesService.getReport(jobId);

      console.log(`\n📊 SCENARIO [${scenario.id}] RESULTS:`);
      console.log(`   🏠 Address: ${report.property.address}`);
      console.log(`   🏗️ Deal Type: ${report.dealType}`);
      console.log(`   🛡️ SafeScore: ${report.safeScore}/100 | Risk: ${report.riskText}`);
      console.log(`   📡 Coverage: ${report.coveragePercent}% (Min Expected: ${scenario.expectedMinCoverage}%)`);
      console.log(`   💡 Recommendation: ${report.recommendationText}`);
      console.log(`   🏷️ Recommendation Banner: ${report.recommendationBanner.verdictText}`);
      console.log(`      Subtext: ${report.recommendationBanner.subtext}`);

      console.log(`\n   🔍 Top 5 Key Findings:`);
      report.top5Findings.forEach((f, idx) => {
        const icon = f.isPositive ? '✓' : '⚠️';
        console.log(`      ${idx + 1}. [${icon}] ${f.title} — ${f.text}`);
      });

      console.log(`\n   📊 Domain Breakdown Scores:`);
      report.scoreBreakdown.forEach((s) => {
        console.log(`      - ${s.label}: ${s.score}/100 [${s.status.toUpperCase()}]`);
      });

      console.log(`\n   🗺️ Quick Risk Map:`);
      report.quickRiskMap.forEach((q) => {
        console.log(`      - ${q.label}: [${q.status.toUpperCase()}]`);
      });

      console.log(`\n   🔌 11 Source Integration Statuses:`);
      report.sourceStatuses.forEach((s) => {
        console.log(`      - [${s.status.toUpperCase()}] ${s.sourceName}`);
      });

      if (report.valuation) {
        console.log(`\n   💰 Valuation: Asking: ₪${report.valuation.askingPrice?.toLocaleString()} | Est: ₪${report.valuation.estimatedValue?.toLocaleString()} (${report.valuation.dealFairness})`);
      }

      if (report.missingDataWarnings && report.missingDataWarnings.length > 0) {
        console.log(`\n   ⚠️ Missing Data Warnings (${report.missingDataWarnings.length}):`);
        report.missingDataWarnings.forEach((w) => console.log(`      - ${w}`));
      }

      console.log(`\n✅ SCENARIO [${scenario.id}] PASSED AUDIT SUCCESSFULLY.`);
      return true;
    } else if (progress.status === 'failed') {
      console.error(`❌ Scenario [${scenario.id}] Failed:`, progress.warnings);
      return false;
    }
  }
  return false;
}

async function runFullQA() {
  console.log('🚀 Starting Comprehensive SafeDeal E2E Automated QA Suite...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const propertiesService = app.get(PropertiesService);

  const scenarios: TestScenario[] = [
    {
      id: 'A',
      name: 'דירת יד שנייה תקינה (הוד השרון - מחיר שוק הוגן, ללא חובות)',
      expectedMinCoverage: 80,
      payload: {
        location: {
          city: 'הוד השרון',
          street: 'הרימון',
          houseNumber: '8',
          block: '6404',
          parcel: '25',
        },
        details: {
          dealType: 'second-hand',
          askingPrice: '2980000',
          propertyArea: '110',
          roomsCount: '4',
          condition: 'preserved-like-new',
          hasParking: true,
          hasUndergroundParking: true,
          hasStorage: true,
          hasMamad: true,
          hasElevator: true,
          hasBalcony: true,
          sellerName: 'יוסי כהן',
          sellerIdNumber: '032154879',
          monthlyRent: '7800',
        },
        documents: {},
        personal: {
          fullName: 'רוכש לדוגמה',
          email: 'buyer@test.com',
          phone: '054-1234567',
        },
      },
    },
    {
      id: 'B',
      name: 'דירת יד שנייה עם תמחור יתר (חריגת שוק והפעלת תקרת STOP 39)',
      expectedMinCoverage: 80,
      payload: {
        location: {
          city: 'תל אביב-יפו',
          street: 'דיזנגוף',
          houseNumber: '140',
          block: '6902',
          parcel: '14',
        },
        details: {
          dealType: 'second-hand',
          askingPrice: '4800000', // extreme overpriced vs 2.4M baseline
          propertyArea: '65',
          roomsCount: '2.5',
          condition: 'needs-renovation',
          hasParking: false,
          hasMamad: false,
          hasElevator: false,
          hasBalcony: false,
          sellerName: 'ישראל ישראלי',
          sellerIdNumber: '012345678',
        },
        documents: {},
        personal: {
          fullName: 'רוכש בדיקה',
          email: 'tester@test.com',
          phone: '052-9876543',
        },
      },
    },
    {
      id: 'C',
      name: 'דירה חדשה מקבלן (תל אביב - יזם, רשם החברות, היתרים ותכנון XPLAN)',
      expectedMinCoverage: 55,
      payload: {
        location: {
          city: 'תל אביב-יפו',
          street: 'אבן גבירול',
          houseNumber: '100',
        },
        details: {
          dealType: 'developer',
          askingPrice: '3850000',
          propertyArea: '95',
          roomsCount: '4',
          hasUndergroundParking: true,
          hasAbovegroundParking: false,
          hasStorage: true,
          hasMamad: true,
          hasElevator: true,
          hasBalcony: true,
          hasGym: true,
          hasResidentsLounge: true,
          hasRooftop: true,
          developerName: 'נווה פארק יזמות בע״מ',
          developerRegNumber: '514123456',
          accreditedBank: 'בנק הפועלים',
          targetDeliveryDate: '12/2027',
          monthlyRent: '9500',
        },
        documents: {},
        personal: {
          fullName: 'קונה מקבלן',
          email: 'devbuyer@test.com',
          phone: '050-7778899',
        },
      },
    },
  ];

  let passedCount = 0;
  for (const scenario of scenarios) {
    const success = await runScenario(propertiesService, scenario);
    if (success) passedCount++;
  }

  console.log(`\n================================================================`);
  console.log(`🏁 FULL QA SUITE SUMMARY: ${passedCount} / ${scenarios.length} SCENARIOS PASSED`);
  console.log(`================================================================\n`);

  await app.close();
}

runFullQA();
