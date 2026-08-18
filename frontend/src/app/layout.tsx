import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SafeDeal – בדיקת נאותות לדירות יד שנייה",
  description:
    "קבלו דוח בדיקת נאותות מקיף לכל דירת יד שנייה בישראל. כמו בדיקת רכב, רק לדירה. מבוסס על מקורות ממשלתיים ובינה מלאכותית.",
  keywords: ["בדיקת נאותות", "נסח טאבו", "דירה יד שנייה", "SafeDeal", "PropTech ישראל"],
  authors: [{ name: "SafeDeal" }],
  openGraph: {
    title: "SafeDeal – לפני שקונים דירה, עושים SafeDeal.",
    description:
      "הפלטפורמה החכמה לבדיקת עסקאות נדל״ן בישראל.",
    type: "website",
    locale: "he_IL",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;500;700;900&family=Heebo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
