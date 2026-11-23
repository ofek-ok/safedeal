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
  xs: { icon: 24, text: "text-base",  gap: "gap-2" },
  sm: { icon: 32, text: "text-xl",    gap: "gap-2" },
  md: { icon: 40, text: "text-2xl",   gap: "gap-3" },
  lg: { icon: 52, text: "text-3xl",   gap: "gap-3" },
  xl: { icon: 68, text: "text-4xl",   gap: "gap-4" },
};

/** SVG shield + checkmark — solid product accent without gradients */
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
      <path
        d="M50 5 L90 22 L90 55 C90 78 72 97 50 105 C28 97 10 78 10 55 L10 22 Z"
        fill="#0D1522"
        stroke="#00C896"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M28 54 L43 70 L72 38"
        stroke="#00C896"
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
        className={`font-medium tracking-normal leading-none ${text}`}
      >
        <span style={{ color: "#f8fafc" }}>Safe</span>
        <span style={{ color: "#00C896" }}>Deal</span>
      </span>
    </div>
  );
}
