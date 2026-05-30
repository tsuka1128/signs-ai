import type { Metadata } from "next";
import DeckHub from "./_components/DeckHub";

export const metadata: Metadata = {
  title: "Signs AI ご提案資料",
  description: "KPIと現場の声を融合するAI経営参謀 Signs AI のご提案資料",
};

export default function ProposalPage() {
  return <DeckHub />;
}
