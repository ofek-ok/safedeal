/**
 * Fully Synthesized Due-Diligence Report Interface
 */

export type RiskLevel = 'low' | 'low-medium' | 'medium-high' | 'high';

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

export interface SynthesizedReport {
  jobId: string;
  generatedAt: string;
  safeScore: number;
  riskLevel: RiskLevel;
  riskText: string;
  property: {
    address: string;
    cadastral: string;
    askingPrice: string;
    areaSqm: string;
    rooms: string;
  };
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
  missingDataWarnings: string[];
  sourceStatuses: Array<{
    sourceId: string;
    sourceName: string;
    status: 'success' | 'warning' | 'failed';
  }>;
}
