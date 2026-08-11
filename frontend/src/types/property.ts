// ─────────────────────────────────────────────────────────────
// SafeDeal – Form Types (5-Step Wizard)
// ─────────────────────────────────────────────────────────────

// ── Step 1 – Personal Details ────────────────────────────────
export type UserPurpose = "buyer" | "seller" | "investor";

export const USER_PURPOSE_LABELS: Record<UserPurpose, string> = {
  buyer: "קונה",
  seller: "מוכר",
  investor: "משקיע",
};

export interface Step1Personal {
  fullName: string;
  email: string;
  phone: string;
  purpose: UserPurpose | "";
  agreeToTerms: boolean;
}

// ── Step 2 – Property Identification ────────────────────────
export interface Step2PropertyId {
  city: string;
  street: string;
  houseNumber: string;
  block: string;       // גוש
  parcel: string;      // חלקה
  subParcel: string;   // תת-חלקה
}

// ── Step 3 – Deal Details ────────────────────────────────────
export type DealType = "second-hand" | "developer";

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  "second-hand": "יד שנייה",
  developer: "קבלן / יזם",
};

export type PropertyCondition = "new-contractor" | "renovated" | "good" | "needs-renovation";

export const PROPERTY_CONDITION_LABELS: Record<PropertyCondition, string> = {
  "new-contractor": "חדש מקבלן",
  renovated: "משופץ אדריכלית",
  good: "שמור כחדש",
  "needs-renovation": "דורש שיפוץ",
};

export const ROOMS_OPTIONS = [
  "1", "1.5", "2", "2.5", "3", "3.5",
  "4", "4.5", "5", "5.5", "6", "6+",
] as const;

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
  dealFairness: "fair" | "underpriced" | "overpriced";
  fairnessLabel: string;
  confidenceLevel: "high" | "medium" | "low";
  confidenceReason: string;
  comparableDeals: ComparableDeal[];
}

export interface Step3DealDetails {
  dealType: DealType | "";
  askingPrice: string;   // raw numeric string (formatted for display)
  propertyArea: string;  // m²
  roomsCount: string;
  floorNumber: string;
  condition: PropertyCondition | "";
  hasParking: boolean;
  hasStorage: boolean;
  hasMamad: boolean;     // ממ"ד (safe room)
  hasElevator: boolean;  // מעלית
  hasBalcony: boolean;   // מרפסת
  isBuildingOnPillars: boolean; // בניין על עמודים
  hasAccessibility: boolean;    // גישה לנכים
  monthlyRent: string;   // optional
}

// ── Step 4 – Documents ───────────────────────────────────────
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export interface Step4Documents {
  tabuFile: File | null;
  buildingFile: File | null;
}

// ── Full form state ───────────────────────────────────────────
export interface WizardFormData {
  step1: Step1Personal;
  step2: Step2PropertyId;
  step3: Step3DealDetails;
  step4: Step4Documents;
}

// ── Initial values ────────────────────────────────────────────
export const INITIAL_FORM_DATA: WizardFormData = {
  step1: {
    fullName: "",
    email: "",
    phone: "",
    purpose: "",
    agreeToTerms: false,
  },
  step2: {
    city: "",
    street: "",
    houseNumber: "",
    block: "",
    parcel: "",
    subParcel: "",
  },
  step3: {
    dealType: "",
    askingPrice: "",
    propertyArea: "",
    roomsCount: "",
    floorNumber: "",
    condition: "",
    hasParking: false,
    hasStorage: false,
    hasMamad: false,
    hasElevator: false,
    hasBalcony: false,
    isBuildingOnPillars: false,
    hasAccessibility: false,
    monthlyRent: "",
  },
  step4: {
    tabuFile: null,
    buildingFile: null,
  },
};
