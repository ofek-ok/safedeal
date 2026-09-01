/**
 * Fully Synthesized Due-Diligence Report Interface
 * Supporting Executive Deck 2-Page Format for both Second-Hand and New-Developer properties.
 * Includes Madlan & Neighborhood Intelligence.
 */

export type DealType = 'second-hand' | 'new-developer';
export type RiskLevel = 'low' | 'low-medium' | 'medium-high' | 'high';

export interface TopFindingItem {
  title: string;
  text?: string;
  isPositive: boolean;
}

export interface QuickRiskCategory {
  id: string;
  label: string;
  status: 'green' | 'yellow' | 'red';
}

export interface ScoreBreakdownItem {
  id: string;
  label: string;
  score: number;
  status: 'green' | 'yellow' | 'red';
  iconKey?: string;
}

export interface ActionableItem {
  id: number;
  title: string;
  description: string;
}

export interface PillarMetricItem {
  label: string;
  value: string;
  status: 'green' | 'yellow' | 'red';
  details?: string;
}

export interface PillarData {
  id: string;
  title: string;
  subtitle: string;
  metrics: PillarMetricItem[];
}

export interface OperativeStep {
  id: string;
  target: 'עורך דין' | 'שמאי' | 'מוכר' | 'בנק';
  title: string;
  description: string;
}

export interface ComparableDeal {
  dealDate: string;
  address: string;
  rooms: string;
  sqm: number;
  price: number;
  pricePerSqm: number;
}

export interface PropertyValuation {
  estimatedValue: number;
  minValue: number;
  maxValue: number;
  askingPrice: number;
  priceDiffPercent: number;
  dealFairness: 'fair' | 'underpriced' | 'overpriced';
  fairnessLabel: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceReason: string;
  comparableDeals: ComparableDeal[];
}

export interface MadlanInsights {
  overallScore: number;
  neighborhoodName: string;
  priceTrend5Years: string;
  demandIndex: 'high' | 'medium' | 'low';
  demandLabel: string;
  avgDaysOnMarket: number;
  estimatedMonthlyRent: number;
  estimatedYieldPercent: number;
  ratings: {
    schools: number;
    quietness: number;
    accessibility: number;
    renewalPotential: number;
  };
  highlights: string[];
}

export interface SynthesizedReport {
  jobId: string;
  generatedAt: string;
  dealType: DealType;
  reportNumber: string;
  safeScore: number;
  riskLevel: RiskLevel;
  riskText: string;
  recommendationText: string;
  property: {
    projectName?: string;
    developerName?: string;
    address: string;
    cadastral: string;
    propertyType: string;
    rooms: string;
    areaSqm: string;
    balconySqm?: string;
    floor: string;
    totalFloors?: string;
    parkingStorage?: string;
    askingPrice: string;
    askingPriceNum?: number;
    yearBuilt?: string;
  };
  top5Findings: TopFindingItem[];
  quickRiskMap: QuickRiskCategory[];
  recommendationBanner: {
    verdictText: string;
    subtext: string;
  };
  scoreBreakdown: ScoreBreakdownItem[];
  actionableSection: {
    title: string;
    items: ActionableItem[];
  };
  bottomLine: {
    text: string;
    score: number;
  };
  valuation?: PropertyValuation;
  madlanInsights?: MadlanInsights;
  executiveSummary: {
    title: string;
    badgeText: string;
    overview: string;
    strengths: string[];
    riskPoints: string[];
  };
  pillars: {
    cadastral: PillarData;
    economic: PillarData;
    planning: PillarData;
    engineering: PillarData;
  };
  operativeNextSteps: OperativeStep[];
  coveragePercent?: number;
  missingDataWarnings?: string[];
  sourceStatuses: Array<{
    sourceId: string;
    sourceName: string;
    status: 'success' | 'warning' | 'failed';
  }>;
}
