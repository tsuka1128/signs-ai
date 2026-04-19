import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoNSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Signs AI | 組織に体温を",
  description: "KPIと現場の声を融合するAI経営参謀",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoNSansJP.variable}`}>
        <ImpersonationBanner />
        {children}
      </body>
    </html>
  );
}
