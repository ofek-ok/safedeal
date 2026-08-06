/**
 * Interface definitions for the 11 SafeDeal Data Sources
 */

export interface SourceResult<T> {
  sourceId: string;
  sourceName: string;
  success: boolean;
  timestamp: string;
  executionTimeMs: number;
  data: T | null;
  warning?: string;
}

// 1. GovMap GIS Source
export interface GovMapData {
  coordinates: { lat: number; lng: number };
  resolvedBlock: string;
  resolvedParcel: string;
  district: string;
  neighborhood: string;
  gisBounds: string[];
}

// 2. Israel Tax Authority Source (עסקאות השוואה)
export interface TaxAuthorityData {
  comparableDeals: Array<{
    date: string;
    rooms: number;
    area: number;
    floor: number;
    price: number;
    pricePerSqm: number;
  }>;
  avgPricePerSqm: number;
  areaPriceTrend: string;
}

// 3. Government Real Estate Site (אתר הנדל"ן הממשלתי)
export interface RealEstateGovData {
  neighborhoodIndex: number;
  annualPriceChangePercent: number;
  avgDaysOnMarket: number;
  neighborhoodTrend: 'rising' | 'stable' | 'declining';
}

// 4. XPLAN Planning Administration (מינהל התכנון)
export interface XplanData {
  masterPlanNumber: string;
  landDesignation: string;
  futureZoningPlans: Array<{
    planName: string;
    status: string;
    description: string;
  }>;
  buildingRightsRemainingPercent: number;
  infrastructureImpacts: string[];
}

// 5. Central Bureau of Statistics (למ"ס)
export interface CbsData {
  socioEconomicCluster: number; // 1-10
  clusterPercentile: number;
  populationDensity: number;
  medianIncomeLevel: string;
}

// 6. Urban Renewal Authority (הרשות להתחדשות עירונית)
export interface UrbanRenewalData {
  hasActiveProject: boolean;
  projectType: 'tama38-1' | 'tama38-2' | 'pinui-binui' | 'none';
  projectStage: string;
  developerName?: string;
  expectedCompletionYear?: number;
}

// 7. Tabu PDF Extract Analysis (נסח מקרקעין)
export interface TabuExtractData {
  ownershipStatus: string;
  owners: string[];
  mortgages: Array<{
    bank: string;
    amount?: number;
    registrationDate: string;
  }>;
  warningNotes: string[]; // הערות אזהרה
  liensAndAttachments: string[]; // עיקולים ושיעבודים
  isCleanTitle: boolean;
}

// 8. Municipal Engineering Archives (אתרי הנדסה עירוניים)
export interface MunicipalData {
  buildingFileStatus: 'found' | 'incomplete' | 'not_found';
  buildingPermitYear: number | null;
  hasForm4: boolean;
  unpermittedAdditions: Array<{
    additionType: string;
    yearDetected: string;
    status: 'unpermitted' | 'legalized' | 'under_review';
  }>;
}

// 9. Registrar of Companies (רשם החברות)
export interface RegistrarCompaniesData {
  isCompanyOwner: boolean;
  companyId?: string;
  companyName?: string;
  status?: string;
  isDelinquentCompany?: boolean;
}

// 10. Registrar of Pledges (רשם המשכונות)
export interface PledgesData {
  sellerIdsChecked: string[];
  registeredPledgesCount: number;
  pledgesDetails: Array<{
    creditor: string;
    pledgeType: string;
    registrationDate: string;
  }>;
}

// 11. Nevo / Net HaMishpat (נבו / נט המשפט)
export interface JudicialData {
  hasActiveLawsuits: boolean;
  lawsuitsCount: number;
  insolvencyProceedings: boolean;
  riskAlerts: string[];
}

/**
 * Aggregated Output of all 11 Sources
 */
export interface AggregatedPipelineData {
  jobId: string;
  submittedAt: string;
  location: {
    city: string;
    street: string;
    houseNumber: string;
    block: string;
    parcel: string;
    subParcel: string;
  };
  sources: {
    govmap: SourceResult<GovMapData>;
    taxAuthority: SourceResult<TaxAuthorityData>;
    realEstateGov: SourceResult<RealEstateGovData>;
    xplan: SourceResult<XplanData>;
    cbs: SourceResult<CbsData>;
    urbanRenewal: SourceResult<UrbanRenewalData>;
    tabu: SourceResult<TabuExtractData>;
    municipal: SourceResult<MunicipalData>;
    registrarCompanies: SourceResult<RegistrarCompaniesData>;
    pledges: SourceResult<PledgesData>;
    judicial: SourceResult<JudicialData>;
  };
  warnings: string[];
}
