import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signs AI | 組織の「サイン」を読み解き、成長を加速させる",
  description: "KPIと現場のボイスチェックをAIが統合分析。組織のボトルネックを特定し、具体的な改善アクションを提案する次世代のAI経営参謀です。",
  openGraph: {
    title: "Signs AI | 組織のサインを読み解くAI経営参謀",
    description: "KPI達成率と組織体温をマトリックスで可視化。現場の声を置き去りにしない、真のデータドリブン経営を実現します。",
    url: "https://www.signs-ai.jp/marketing",
    siteName: "Signs AI",
    images: [
      {
        url: "/ogp.png", // 後ほど生成して配置
        width: 1200,
        height: 630,
        alt: "Signs AI マーケティングイメージ",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Signs AI | 組織のサインを読み解くAI経営参謀",
    description: "KPIと現場の声を融合する次世代マネジメントツール。無料でトライアル開始。",
    images: ["/ogp.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
