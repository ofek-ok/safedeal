import type { Metadata } from "next";
import "./globals.css";
import "./staff.css";
import "./report.css";

export const metadata: Metadata = {
  title: "SafeDeal | בדיקת נאותות לנכס",
  description: "בדיקת נאותות וסיכונים לעסקאות נדל״ן בישראל.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ fontFamily: '"Heebo", system-ui, -apple-system, sans-serif' }}>{children}</body>
    </html>
  );
}
