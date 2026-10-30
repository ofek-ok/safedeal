/**
 * Frontend mirror of the backend SynthesizedReport interface.
 * Matches ai-synthesis.service.ts output exactly.
 */

export type RiskLevel = 'low' | 'low-medium' | 'medium-high' | 'high';
export type MetricStatus = 'green' | 'yellow' | 'red';
export type SourceStatus = 'success' | 'warning' | 'error';
export type StepTarget = 'עורך דין' | 'שמאי' | 'מוכר' | 'בנק';

export interface PillarMetric {
  label: string;
  value: string;
  status: MetricStatus;
  details: string;
}

export interface Pillar {
  id: string;
  title: string;
  subtitle: string;
  metrics: PillarMetric[];
}

export interface OperativeStep {
  id: string;
  target: StepTarget;
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
    cadastral: Pillar;
    economic: Pillar;
    planning: Pillar;
    engineering: Pillar;
  };
  operativeNextSteps: OperativeStep[];
  missingDataWarnings: string[];
  sourceStatuses: Array<{
    sourceId: string;
    sourceName: string;
    status: SourceStatus;
  }>;
}

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  percentComplete: number;
  completedSourcesCount: number;
  totalSourcesCount: number;
  currentStepMessage: string;
  warnings: string[];
  createdAt: string;
}
