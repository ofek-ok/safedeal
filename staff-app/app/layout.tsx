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
      <body className="antialiased">{children}</body>
    </html>
  );
}
