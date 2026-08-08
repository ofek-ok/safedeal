/**
 * Interface definitions for the 11 SafeDeal Data Sources (Milestone 2 — Real Integrations)
 */

export interface SourceResult<T> {
  source: string;
  success: boolean;
  data: T;
  warnings?: string[];
}

// ── 1. GovMap GIS Source ─────────────────────────────────────────────────────
export interface GovMapData {
  canonicalAddress: string;
  city: string;
  street: string;
  houseNumber: string;
  coordinates: { lat: number; lng: number };
  itmCoordinates: { x: number; y: number } | null;
  objectId: number | null | undefined;
}

// ── 2. Israel Tax Authority (רשות המסים) ─────────────────────────────────────
export interface TaxAuthorityData {
  transactionHistory: Array<{
    date: string;
    price: number;
    area: number | null;
    pricePerSqm: number | null;
    rooms: number | null;
    floor: number | null;
    isNew: boolean;
    nature: string;
  }>;
  avgPricePerSqm: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  totalDeals: number;
  dataSource: string;
}

// ── 3. Government Real Estate (נדל"ן ממשלתי) ─────────────────────────────────
export interface RealEstateGovData {
  neighborhoodIndex: number | null;
  avgPricePerSqmCity: number | null;
  annualPriceChangePercent: number | null;
  totalDealsInArea: number | null;
  avgDealAmount: number | null;
  dataSource: string;
  quarterRef: string | null;
}

// ── 4. XPLAN / Mavat (מינהל התכנון) ──────────────────────────────────────────
export interface XplanData {
  activePlans: Array<{
    name: string;
    number: string;
    type: string;
    status: string;
  }>;
  activePlansCount: number;
  hasSignificantDevelopment: boolean;
  mainPlanName: string | null;
  mainPlanNumber: string | null;
  planStatus: string;
  dataSource: string;
}

// ── 5. Central Bureau of Statistics (הלמ"ס) ──────────────────────────────────
export interface CbsData {
  socioEconomicCluster: number; // 1-10
  socioEconomicPercentile: number;
  clusterDescription: string;
  medianIncomeVsNational: string;
  dataSource: string;
  dataYear: number;
}

// ── 6. Urban Renewal Authority (התחדשות עירונית) ──────────────────────────────
export interface UrbanRenewalData {
  hasActiveProject: boolean;
  projectName: string | null;
  status: string;
  approvalDate: string | null;
  unitsToDemo: number | null;
  unitsToBuild: number | null;
  nearbyProjects: number;
  dataSource: string;
}

// ── 7. Tabu PDF + Gemini OCR ─────────────────────────────────────────────────
export interface TabuData {
  owners: Array<{
    name: string;
    id: string | null;
    ownership: string; // e.g. "1/2"
  }>;
  propertyType: string;
  block: string;
  parcel: string;
  subParcel: string | null;
  areaSqm: number | null;
  mortgages: Array<{
    creditorName: string;
    amount: number | null;
    currency: string;
    registrationDate: string | null;
    isActive: boolean;
  }>;
  hasMortgage: boolean;
  warnings: string[];
  redFlags: string[];
  extractionMethod: 'gemini-1.5-flash' | 'manual_review_required';
  extractionConfidence: 'high' | 'medium' | 'low' | 'none';
  dataSource: string;
}

// ── 8. Municipal Engineering (הנדסה עירונית — כל ישראל) ──────────────────────
export interface MunicipalData {
  buildingPermits: Array<{
    type: string;
    status: string;
    date: string | null;
    description: string | null;
  }>;
  openPermitsCount: number;
  hasViolations: boolean;
  violationsCount: number;
  totalPermitsFound: number;
  cityPortalUrl: string;
  dataSource: string;
}

// ── 9. Registrar of Companies (רשם החברות) ───────────────────────────────────
export interface RegistrarCompaniesData {
  isRelevant: boolean;
  message: string;
  companies: Array<{
    name: string;
    registrationNumber: string | null;
    status: string;
    type: string;
    incorporationDate: string | null;
    address: string | null;
    isActive: boolean;
  }>;
  dataSource: string;
}

// ── 10. Registrar of Pledges (רשם המשכונות) ──────────────────────────────────
export interface PledgesData {
  hasPledges: boolean | null; // null = cannot determine automatically
  pledgesCount: number | null;
  pledges: unknown[];
  verificationStatus: 'verified' | 'manual_required' | 'api_available';
  manualCheckUrl: string;
  searchReference: string;
  estimatedFee: string;
  integrationNote: string;
  dataSource: string;
}

// ── 11. Nevo / Net HaMishpat (נבו / נט המשפט) ────────────────────────────────
export interface JudicialData {
  hasActiveLawsuits: boolean | null; // null = cannot determine automatically
  lawsuitsCount: number | null;
  lawsuits: unknown[];
  subjects: Array<{ role: string; name: string; id?: string }>;
  verificationStatus: 'verified' | 'manual_required';
  manualCheckUrl: string;
  premiumApiOption: string;
  integrationNote: string;
  dataSource: string;
}

// ── Aggregated Output of all 11 Sources ──────────────────────────────────────
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
    tabu: SourceResult<TabuData>;
    municipal: SourceResult<MunicipalData>;
    registrarCompanies: SourceResult<RegistrarCompaniesData>;
    pledges: SourceResult<PledgesData>;
    judicial: SourceResult<JudicialData>;
  };
  warnings: string[];
}
