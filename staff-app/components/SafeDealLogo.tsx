/**
 * SafeDeal Logo Component
 * Matches the official brand logo: shield with checkmark + SAFE (white) DEAL (teal) wordmark.
 * Usage: <SafeDealLogo size="md" /> or <SafeDealLogo iconOnly />
 */

interface SafeDealLogoProps {
  /** Control overall scale */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Render just the shield icon, no wordmark */
  iconOnly?: boolean;
  className?: string;
}

const SIZES = {
  xs: { icon: 24, text: "text-base",  gap: "gap-1.5" },
  sm: { icon: 32, text: "text-xl",    gap: "gap-2"   },
  md: { icon: 40, text: "text-2xl",   gap: "gap-2.5" },
  lg: { icon: 52, text: "text-3xl",   gap: "gap-3"   },
  xl: { icon: 68, text: "text-4xl",   gap: "gap-4"   },
};

/** SVG shield + checkmark — matches the provided brand logo exactly */
function ShieldIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shield outer fill */}
      <path
        d="M50 5 L90 22 L90 55 C90 78 72 97 50 105 C28 97 10 78 10 55 L10 22 Z"
        fill="#0A1628"
      />

      {/* Shield teal gradient border */}
      <defs>
        <linearGradient id="sd-shield-grad" x1="10" y1="5" x2="90" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#2DD4BF" />
          <stop offset="60%"  stopColor="#00C896" />
          <stop offset="100%" stopColor="#00866A" />
        </linearGradient>
      </defs>
      <path
        d="M50 5 L90 22 L90 55 C90 78 72 97 50 105 C28 97 10 78 10 55 L10 22 Z"
        fill="none"
        stroke="url(#sd-shield-grad)"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Checkmark */}
      <path
        d="M28 54 L43 70 L72 38"
        stroke="url(#sd-shield-grad)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function SafeDealLogo({ size = "md", iconOnly = false, className = "" }: SafeDealLogoProps) {
  const { icon, text, gap } = SIZES[size];

  if (iconOnly) {
    return <ShieldIcon size={icon} />;
  }

  return (
    <div className={`inline-flex items-center ${gap} ${className}`} aria-label="SafeDeal">
      <ShieldIcon size={icon} />
      <span
        className={`font-black tracking-tight leading-none ${text}`}
        style={{ letterSpacing: "-0.02em" }}
      >
        <span style={{ color: "#f8fafc" }}>SAFE</span>
        <span style={{ color: "#00C896" }}>DEAL</span>
      </span>
    </div>
  );
}
