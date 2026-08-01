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

export const ROOMS_OPTIONS = [
  "1", "1.5", "2", "2.5", "3", "3.5",
  "4", "4.5", "5", "5.5", "6", "6+",
] as const;

export interface Step3DealDetails {
  dealType: DealType | "";
  askingPrice: string;   // raw numeric string (formatted for display)
  propertyArea: string;  // m²
  roomsCount: string;
  floorNumber: string;
  hasParking: boolean;
  hasStorage: boolean;
  hasMamad: boolean;     // ממ"ד (safe room)
  hasElevator: boolean;  // מעלית
  monthlyRent: string;   // optional
}

// ── Step 4 – Documents ───────────────────────────────────────
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export interface Step4Documents {
  tabuFile: UploadedFile | null;       // נסח טאבו (required for full report)
  buildingFile: UploadedFile | null;   // תיק בניין (optional)
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
    hasParking: false,
    hasStorage: false,
    hasMamad: false,
    hasElevator: false,
    monthlyRent: "",
  },
  step4: {
    tabuFile: null,
    buildingFile: null,
  },
};
