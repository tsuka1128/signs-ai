"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { MainInsightCard } from "@/components/dashboard/MainInsightCard";
import { TabBar } from "@/components/ui/TabBar";
import { Pills } from "@/components/ui/Pills";
import { ScatterPlot } from "@/components/dashboard/ScatterPlot";
import { KpiSummaryCard } from "@/components/dashboard/KpiSummaryCard";
import { OrganizationCard } from "@/components/dashboard/OrganizationCard";
import { ActionItem } from "@/components/dashboard/ActionItem";
import { SemanticLayer } from "@/components/dashboard/SemanticLayer";
import { Badge } from "@/components/ui/Badge";
import { DetailLineChart } from "@/components/dashboard/DetailLineChart";
import { ProductInsight } from "@/components/dashboard/ProductInsight";
import { FeedbackItem } from "@/components/dashboard/FeedbackItem";
import { SurveyQuestionCard } from "@/components/dashboard/SurveyQuestionCard";
import { cn } from "@/lib/utils";

const questions = [
  { id: 1, text: "今の仕事にワクワクしていますか？", hint: "月曜の朝、布団の中で思い浮かべてみてください。" },
  { id: 2, text: "何かが決まるのを「待つ時間」は少なかったですか？", hint: "待っている間、あなたの熱量は少しずつ冷めていきます。" },
  { id: 3, text: "必要な情報が自分まで届いていましたか？", hint: "知らなかったことで、損をしていませんでしたか。" },
  { id: 4, text: "「調整」や「根回し」に時間を取られすぎていませんか？", hint: "本来、何に使いたかった時間ですか。" },
  { id: 5, text: "言いづらいことを飲み込まずに伝えられましたか？", hint: "飲み込んだ言葉は、どこかで体温を下げます。" },
  { id: 6, text: "「何を成すべきか」に迷わず集中できましたか？", hint: "迷いは、あなたのせいではないかもしれません。" },
  { id: 7, text: "上司や仲間から反応（賞賛や指摘）がありましたか？", hint: "無反応は、じわじわと人を蝕みます。" },
  { id: 8, text: "業務量は、質を維持できる範囲でしたか？", hint: "「頑張ればできる」は、長くは続きません。" },
  { id: 9, text: "「顧客のプラスになること」に時間を使えましたか？", hint: "社内都合に時間を奪われた日、悔しくなかったですか。" },
  { id: 10, text: "新しい工夫や挑戦ができましたか？", hint: "同じことの繰り返しは、安全に見えて危険です。" },
  { id: 11, text: "KPI達成に向けて、準備周到に活動できていますか？", hint: "道筋が見えているだけで、体温は上がります。" },
];

const surveyData = {
  all: {
    scores: [4.2, 2.1, 3.8, 1.8, 3.5, 3.2, 4.0, 2.4, 4.1, 3.7, 3.9],
    pulse: 3.2,
    pulseHistory: [3.5, 3.4, 3.3, 3.2, 3.1, 3.2],
    aiComment: "組織全体として「ワクワク感」と「顧客貢献感」は高い水準にありますが、「意思決定の待ち時間（Q2）」と「根回しコスト（Q4）」が明確なボトルネックとなっています。特にQ2の2.1は危険水域であり、スピード感の欠如が後続のQ8（業務量）への圧迫に繋がっている構造が見えます。仕組みによる解決が急務です。"
  },
  sales: {
    scores: [4.5, 1.8, 4.0, 1.2, 2.5, 3.0, 4.2, 1.9, 4.6, 3.5, 3.8],
    pulse: 2.1,
    pulseHistory: [3.1, 2.9, 2.8, 2.5, 2.3, 2.1],
    aiComment: "営業部は「顧客の役に立ちたい」という熱量が非常に高い（Q9: 4.6）一方で、社内調整（Q4: 1.2）と決定待ち（Q2: 1.8）でエネルギーが削がれています。言いたいことを飲み込む傾向（Q5: 2.5）もあり、数字を作るための『無理』が個人の体温低下として顕在化しつつあります。"
  },
  mktg: {
    scores: [4.3, 3.5, 4.2, 3.8, 4.0, 4.1, 3.9, 3.8, 4.4, 4.0, 4.2],
    pulse: 4.2,
    pulseHistory: [3.8, 3.9, 4.0, 4.1, 4.1, 4.2],
    aiComment: "マーケ部は全指標において安定した高スコアを維持しており、現在の「質の高いリード獲得」という方針が個人の納得感と直結しています。調整コストも低く、理想的な自律駆動型チームとなっています。他部署へのナレッジ展開のハブとなることを推奨します。"
  },
  dev: {
    scores: [3.8, 2.5, 3.2, 3.0, 3.1, 2.8, 3.5, 2.0, 3.6, 4.2, 3.5],
    pulse: 2.4,
    pulseHistory: [3.4, 3.2, 3.0, 2.8, 2.5, 2.4],
    aiComment: "開発部は「新しい技術への挑戦（Q10: 4.2）」にやりがいを感じていますが、恒常的な業務過多（Q8: 2.0）が深刻です。仕様決定の不透明さが『迷い』を生み、集中を削いでいます。クリエイティブな時間を確保するための優先順位の整理が不可欠です。"
  },
  cs: {
    scores: [3.5, 2.2, 3.0, 2.4, 2.2, 3.0, 3.1, 2.5, 4.0, 3.2, 3.0],
    pulse: 3.1,
    pulseHistory: [3.6, 3.5, 3.4, 3.2, 3.1, 3.1],
    aiComment: "CS部は顧客への貢献意欲は高いものの、他部署（特に開発）からの情報伝達や仕様変更の反映待ち（Q2）により、自信を持って顧客対応ができないジレンマ（Q5: 2.2）を抱えています。現場の声を製品に反映させるパイプの詰まりを解消する必要があります。"
  },
};

// --- Full Original Data --- 

const products = [
  { id: "a", name: "プロダクトA", head: 22, productivity: 129, pulse: 3.8, weather: "sun" as const, kpiAch: 105, prevHead: 20, prevProductivity: 120, prevPulse: 3.7, prevWeather: "sun", prevKpiAch: 100, kpiName: "MRR", mrr: 1800, prevMrr: 1600 },
  { id: "b", name: "プロダクトB", head: 14, productivity: 86, pulse: 2.1, weather: "rain" as const, kpiAch: 82, prevHead: 12, prevProductivity: 110, prevPulse: 2.6, prevWeather: "cloud", prevKpiAch: 95, kpiName: "MRR", mrr: 520, prevMrr: 600 },
  { id: "c", name: "プロダクトC", head: 9, productivity: 156, pulse: 4.3, weather: "sun" as const, kpiAch: 118, prevHead: 8, prevProductivity: 145, prevPulse: 4.1, prevWeather: "sun", prevKpiAch: 105, kpiName: "MRR", mrr: 460, prevMrr: 380 }
];

const deptData = [
  {
    id: "sales", name: "営業部", head: 15, productivity: 260, pulse: 2.1, pulseHistory: [3.1, 2.9, 2.8, 2.5, 2.3, 2.1], weather: "rain" as const, arrow: "down" as const, kpiAch: 108, prevHead: 14, prevProductivity: 250, prevPulse: 2.5, prevWeather: "cloud", prevKpiAch: 102, kpiName: "売上",
    kpis: [
      { name: "売上", val: "2,840万", ach: 108, type: "stack" },
      { name: "契約件数", val: "12件", ach: 92, type: "stack" },
      { name: "成約率", val: "22%", ach: 110, type: "rate" }
    ]
  },
  {
    id: "mktg", name: "マーケ部", head: 4, productivity: 280, pulse: 4.2, pulseHistory: [3.8, 3.9, 4.0, 4.1, 4.1, 4.2], weather: "sun" as const, arrow: "up" as const, kpiAch: 90, prevHead: 4, prevProductivity: 260, prevPulse: 4.0, prevWeather: "sun", prevKpiAch: 105, kpiName: "有効リード",
    kpis: [
      { name: "商談獲得数", val: "384件", ach: 112, type: "stack" },
      { name: "有効リード", val: "45件", ach: 90, type: "stack" }
    ]
  },
  {
    id: "dev", name: "開発部", head: 22, productivity: 80, pulse: 2.4, pulseHistory: [3.4, 3.2, 3.0, 2.8, 2.5, 2.4], weather: "rain" as const, arrow: "down" as const, kpiAch: 80, prevHead: 20, prevProductivity: 85, prevPulse: 2.8, prevWeather: "cloud", prevKpiAch: 85, kpiName: "NPS",
    kpis: [
      { name: "NPS", val: "32pt", ach: 80, type: "rate" }
    ]
  },
  {
    id: "fin", name: "財務経理部", head: 10, productivity: 90, pulse: 3.9, pulseHistory: [3.8, 3.7, 3.8, 3.9, 3.9, 3.9], weather: "sun" as const, arrow: "flat" as const, kpiAch: 100, prevHead: 9, prevProductivity: 90, prevPulse: 3.8, prevWeather: "sun", prevKpiAch: 99, kpiName: "コスト",
    kpis: [
      { name: "コスト", val: "850万円", ach: 100, type: "inverse" }
    ]
  },
  {
    id: "cs", name: "CS部", head: 7, productivity: 110, pulse: 3.1, pulseHistory: [3.6, 3.5, 3.4, 3.2, 3.1, 3.1], weather: "cloud" as const, arrow: "flat" as const, kpiAch: 72, prevHead: 6, prevProductivity: 115, prevPulse: 3.4, prevWeather: "cloud", prevKpiAch: 80, kpiName: "解約率",
    kpis: [
      { name: "解約率", val: "4.2%", ach: 72, type: "inverse" }
    ]
  },
  {
    id: "hr", name: "人事部", head: 3, productivity: 190, pulse: 4.0, pulseHistory: [3.9, 3.9, 3.8, 3.9, 4.0, 4.0], weather: "sun" as const, arrow: "up" as const, kpiAch: 105, prevHead: 3, prevProductivity: 180, prevPulse: 3.8, prevWeather: "sun", prevKpiAch: 95, kpiName: "採用人数",
    kpis: [
      { name: "採用応募数", val: "18名", ach: 120, type: "stack" },
      { name: "退職人数", val: "3名", ach: 76, type: "inverse" }
    ]
  }
];

const prodKpis = [
  {
    id: "prod_a", name: "プロダクトA", head: 22, pulse: 3.8, pulseHistory: [3.6, 3.7, 3.6, 3.7, 3.8, 3.8], weather: "sun" as const, arrow: "up" as const,
    kpis: [
      { name: "MRR", val: "1,800万", ach: 115, type: "stack" },
      { name: "解約率", val: "1.8%", ach: 110, type: "inverse" },
      { name: "NPS", val: "42pt", ach: 105, type: "rate" }
    ]
  },
  {
    id: "prod_b", name: "プロダクトB", head: 14, pulse: 2.1, pulseHistory: [3.0, 2.9, 2.7, 2.4, 2.2, 2.1], weather: "rain" as const, arrow: "down" as const,
    kpis: [
      { name: "MRR", val: "520万", ach: 68, type: "stack" },
      { name: "解約率", val: "8.1%", ach: 37, type: "inverse" },
      { name: "NPS", val: "18pt", ach: 45, type: "rate" }
    ]
  },
  {
    id: "prod_c", name: "プロダクトC", head: 9, pulse: 4.3, pulseHistory: [3.9, 4.0, 4.1, 4.2, 4.3, 4.3], weather: "sun" as const, arrow: "up" as const,
    kpis: [
      { name: "MRR", val: "460万", ach: 128, type: "stack" },
      { name: "解約率", val: "2.2%", ach: 95, type: "inverse" },
      { name: "NPS", val: "38pt", ach: 95, type: "rate" }
    ]
  }
];

const kpiDefs = [
  {
    id: "mrr", name: "売上", unit: "万円", val: 2840, target: 2630, prev: [2100, 2250, 2380, 2490, 2630, 2840], dept: "営業部", voices: [
      { text: "目標超過だが、トップ営業1人に依存。属人リスクが顕在化しつつある", mood: "rain" },
      { text: "大型案件2件は値引き幅が大きく、利益率は悪化傾向", mood: "rain" },
      { text: "新規偏重で既存フォローが後手に回っている実感がある", mood: "cloud" }
    ]
  },
  {
    id: "mktg_leads", name: "商談獲得数", unit: "件", val: 384, target: 343, prev: [280, 295, 310, 328, 343, 384], dept: "マーケ部", voices: [
      { text: "ターゲティング精度向上が奏功", mood: "sun" },
      { text: "アポの質に関する営業部からのフィードバックが役立っている", mood: "sun" }
    ]
  },
  {
    id: "deals", name: "有効リード", unit: "件", val: 45, target: 50, prev: [38, 42, 48, 51, 47, 45], dept: "マーケ部", voices: [
      { text: "リード質は改善したが、総数が伸び悩んでいる", mood: "cloud" },
      { text: "LPのCVR改善施策を急ぐ必要がある", mood: "rain" }
    ]
  },
  {
    id: "contracts", name: "契約件数", unit: "件", val: 12, target: 8, prev: [5, 8, 10, 6, 9, 12], dept: "営業部", voices: [
      { text: "先月獲得した大口顧客からの契約が増加している", mood: "sun" },
      { text: "小規模案件の契約手続きに手間取っている", mood: "cloud" }
    ]
  },
  {
    id: "close", name: "成約率", unit: "%", val: 22, target: 20, prev: [18, 17, 19, 21, 20, 22], dept: "営業部", voices: [
      { text: "提案パターンが確立できた手応えがある", mood: "sun" },
      { text: "値引きで成約率を上げている面もあり、真の成約力か疑問", mood: "cloud" },
      { text: "業界特化の事例が増えたことが刺さっている", mood: "sun" }
    ]
  },
  {
    id: "cost", name: "コスト", unit: "万円", val: 850, target: 850, prev: [820, 830, 840, 850, 840, 850], dept: "財務経理部", voices: [
      { text: "インフラコストの最適化が課題になっている", mood: "cloud" },
      { text: "予算内には収まっているがSaaSツールの見直しが必要", mood: "cloud" }
    ]
  },
  {
    id: "churn", name: "解約率", unit: "%", val: 4.2, target: 3.0, prev: [2.8, 3.1, 3.0, 3.2, 3.5, 4.2], dept: "CS部", voices: [
      { text: "プロダクトBの解約が突出。機能不足が主因と顧客から聞いている", mood: "rain" },
      { text: "オンボーディング完了前の離脱が先月から急増", mood: "rain" }
    ]
  },
  {
    id: "nps", name: "NPS", unit: "pt", val: 32, target: 40, prev: [28, 30, 31, 33, 34, 32], dept: "開発部", voices: [
      { text: "UIリニューアル後の評価は向上したがパフォーマンス改善の要望が根強い", mood: "cloud" },
      { text: "新機能リリースがユーザーの評価に直結している実感がある", mood: "sun" }
    ]
  },
  {
    id: "recruit", name: "採用応募数", unit: "名", val: 18, target: 15, prev: [10, 12, 15, 8, 10, 18], dept: "人事部", voices: [
      { text: "イベントの効果が応募数に直結している", mood: "sun" },
      { text: "数は取れているが、スクリーニングの工数が逼迫している", mood: "cloud" }
    ]
  },
  {
    id: "resign", name: "退職人数", unit: "名", val: 3, target: 4, prev: [2, 3, 2, 4, 1, 3], dept: "人事部", voices: [
      { text: "前月に比べ若手の離職が目立つのが気がかり", mood: "rain" },
      { text: "個別面談でのフォローアップの効果が少しずつ出ている", mood: "sun" }
    ]
  }
];

const insights = {
  exec: { icon: "👔", title: "経営層", tone: "戦略的分析", text: "MRRは目標超過だが、営業部の体温スコア2.1は過去最低値。数字の裏側でトップ営業への依存が深刻化している可能性が高い。仮にこの状態が継続すれば、来月以降のパイプラインに影響が出ることが想定される。リソース配分の見直しを検討すべき局面。" },
  admin: { icon: "📋", title: "経企・人事", tone: "構造分析", text: "営業部と開発部の間で仕様変更プロセスの摩擦が発生しており、双方の体温を押し下げている構造が見られる。また、解約率4.2%はCS部の属人対応の限界を示唆。承認フローの短縮と業務標準化を並行で進めることを推奨。" },
  mgr: { icon: "🎯", title: "マネージャー", tone: "現場支援", text: "チームから『承認フロー遅延』と『仕様変更の突発性』が主要ボトルネックとして挙がっています。メンバーの疲弊は手法ではなく仕組みに起因する可能性が高い。" },
  player: { icon: "💪", title: "現場", tone: "前向きな共有", text: "『仕様決定のスピード』が今月のボトルネック上位に挙がっており、組織として改善の優先度が上がっています。改善プロセスが動き始めています。" }
};

const actions = [
  { pri: "🔴 緊急", title: "営業部のトップ営業依存を解消する", desc: "属人化が進行しており、仮にキーパーソンが離脱した場合のインパクトが大きい。プロセスの標準化に着手することを推奨。", dept: "営業部", owner: "営業部長" },
  { pri: "🔴 緊急", title: "承認フローの2段階への短縮を検討する", desc: "全部署横断でボトルネック1位。意思決定スピードの両方に影響しており、組織全体の体温を押し下げている構造的要因と考えられる。", dept: "全社", owner: "CEO" },
  { pri: "🟡 今月中", title: "開発↔営業の仕様変更プロセスを整備する", desc: "仕様変更の事前通知ルール（最低3営業日前）の設定が有効と考えられる。双方の体温改善に寄与する可能性が高い。", dept: "開発×営業", owner: "PdM" },
  { pri: "🟡 今月中", title: "解約率4.2%の原因を構造的に分析する", desc: "直近解約5社のヒアリングを実施し、プロダクト起因か対応起因かを切り分けることを推奨。", dept: "CS部", owner: "CS部長" },
  { pri: "🟢 継続", title: "マーケ部の成功パターンを営業と共有する", desc: "リード品質改善の要因を営業部と共有し、商談化率改善につなげる。好循環を組織的に再現する仕組みづくりを。", dept: "マーケ→営業", owner: "マーケ部長" }
];

const semTextDefault = `# 経営方針 v1.2 (2026年2月〜)

## 組織の現在地
- フェーズ: ユニットエコノミクス改善期
- 前フェーズ（〜1月）: 垂直立ち上げ → 量重視
- 現フェーズ（2月〜）: 質重視へ転換。筋肉質な黒字化が最優先
- 現場に求める空気感: 1件1件の質にこだわる執着心

## KPIの解釈ガイド
- MRR: 月次15%成長を維持しつつ、値引き率を抑制方向へ
- 商談数: 量より質へ転換中。数の減少は想定内。成約率で判断
- 成約率: 最重要指標。20%以上を死守
- リード数: コンテンツマーケ経由の質の高いリードを重視
- 解約率: 3%以下が健全ライン。4%超は即座にアラート
- 解約金額: 大口解約は事前察知が必須。CS部に月次ヒアリングを義務化
- NPS: 40pt到達が年度目標。中間層の引き上げに注力
- 機能利用率: 差別化機能の利用率向上がNPS改善の鍵
- 採用数: エンジニア採用が最優先。給与テーブルの見直しを検討中

## 数字と体温の関係
- ☀️なのに☔️（オーバーヒート）: 前フェーズでは許容していたが、現フェーズでは即座に介入。持続不能な成果は評価しない
- ☔️なのに☀️: プロダクトBが該当。3月末までに改善が見られなければピボット検討

## 組織の注意点
- 営業部トップ営業への依存が深刻化。属人化解消を2月の最優先アジェンダに
- 開発↔営業の仕様変更摩擦が体温を下げている。承認フロー短縮で構造的に解決

## 地雷ワード（AIが検知したら最優先で報告）
- 「辞めたい」「転職」「意味がない」「誰も聞いてくれない」「もう限界」`;

export default function DashboardPage() {
  const [tab, setTab] = useState<keyof typeof insights>("exec");
  const [sec, setSec] = useState("matrix");
  const [matView, setMatView] = useState("dept");
  const [selKpi, setSelKpi] = useState("mrr");
  const [orgView, setOrgView] = useState("dept");
  const [month, setMonth] = useState("default");

  const ins = insights[tab];
  const selectedKpiDef = kpiDefs.find(k => k.id === selKpi)!;
  const achRate = selectedKpiDef.target ? Math.round((selectedKpiDef.val / selectedKpiDef.target) * 100) : null;

  const currentMatData = (matView === "product" ? products : deptData).map(d => {
    let head = d.head;
    let productivity = d.productivity;
    let pulse = d.pulse;
    let kpiAch = d.kpiAch;
    let mrr = 'mrr' in d ? d.mrr : undefined;

    // --- 部署別のタイムラプスストーリー（体温に連動して生産性も変化） ---
    // Sales: 6m前(少数精鋭,高スコア) -> Now(拡大で崩壊,低スコア)
    // Dev: 6m前(順調) -> Now(拡大で低迷)
    // Marketing: 6m前(低迷) -> Now(V字回復)
    if (d.id === "sales") {
      if (month === "1m") { head = 14; productivity = 85; pulse = 2.8; kpiAch = 92; }
      else if (month === "3m") { head = 13; productivity = 120; pulse = 3.5; kpiAch = 105; }
      else if (month === "6m") { head = 10; productivity = 160; pulse = 4.1; kpiAch = 130; }
      else { head = 15; productivity = 70; pulse = 2.1; kpiAch = 85; } // current: OVERWEIGHT
    }
    else if (d.id === "dev") {
      if (month === "1m") { head = 21; productivity = 75; pulse = 2.6; kpiAch = 88; }
      else if (month === "3m") { head = 20; productivity = 95; pulse = 3.2; kpiAch = 100; }
      else if (month === "6m") { head = 18; productivity = 120; pulse = 3.8; kpiAch = 110; }
      else { head = 22; productivity = 65; pulse = 2.4; kpiAch = 80; } // current: OVERWEIGHT
    }
    else if (d.id === "mktg") {
      if (month === "1m") { head = 4; productivity = 230; pulse = 3.8; kpiAch = 105; }
      else if (month === "3m") { head = 4; productivity = 180; pulse = 3.4; kpiAch = 95; }
      else if (month === "6m") { head = 3; productivity = 130; pulse = 3.1; kpiAch = 85; }
      else { head = 4; productivity = 270; pulse = 4.0; kpiAch = 120; } // current: PIONEER V字回復
    }
    // --- プロダクト別のタイムラプスストーリー ---
    // Prod B: 6m前(順調) -> Now(拡大で崩壊, 低体温・低生産性)
    // Prod C: 6m前(低迷) -> Now(少人数で超高効率, 高体温・高生産性へ成長)
    // Prod A: 6m前(普通) -> Now(順調にSCALE, 体温も安定上昇)
    else if (d.id === "prod_b" || d.id === "b") {
      if (month === "1m") { head = 13; productivity = 80; pulse = 2.6; mrr = 850; kpiAch = 85; }
      else if (month === "3m") { head = 12; productivity = 110; pulse = 2.9; mrr = 950; kpiAch = 95; }
      else if (month === "6m") { head = 10; productivity = 140; pulse = 3.8; mrr = 1100; kpiAch = 105; }
      else { head = 14; productivity = 60; pulse = 2.1; mrr = 720; kpiAch = 75; } // current: OVERWEIGHT
    }
    else if (d.id === "prod_c" || d.id === "c") {
      if (month === "1m") { head = 9; productivity = 145; pulse = 4.1; mrr = 420; kpiAch = 112; }
      else if (month === "3m") { head = 8; productivity = 130; pulse = 3.8; mrr = 380; kpiAch = 105; }
      else if (month === "6m") { head = 7; productivity = 115; pulse = 3.2; mrr = 280; kpiAch = 95; }
      else { head = 9; productivity = 156; pulse = 4.3; mrr = 460; kpiAch = 118; } // current: PIONEER
    }
    else if (d.id === "prod_a" || d.id === "a") {
      if (month === "1m") { head = 20; productivity = 120; pulse = 3.7; mrr = 1600; kpiAch = 100; }
      else if (month === "3m") { head = 18; productivity = 115; pulse = 3.5; mrr = 1400; kpiAch = 95; }
      else if (month === "6m") { head = 15; productivity = 110; pulse = 3.4; mrr = 1100; kpiAch = 90; }
      else { head = 22; productivity = 129; pulse = 3.8; mrr = 1800; kpiAch = 105; } // current: SCALE
    }
    // その他の部署・プロダクトは適度に変動
    else {
      if (month === "1m") {
        head = ("prevHead" in d && d.prevHead !== undefined) ? d.prevHead : d.head;
        productivity = ("prevProductivity" in d && d.prevProductivity !== undefined) ? d.prevProductivity : d.productivity - 10;
        pulse = ("prevPulse" in d && d.prevPulse !== undefined) ? d.prevPulse : d.pulse - 0.2;
        mrr = mrr ? mrr - 100 : undefined;
      } else if (month === "3m") {
        head = Math.max(1, d.head - 1);
        productivity = d.productivity - 25;
        pulse = d.pulse - 0.4;
        mrr = mrr ? mrr - 250 : undefined;
      } else if (month === "6m") {
        head = Math.max(1, d.head - 2);
        productivity = d.productivity - 40;
        pulse = d.pulse - 0.6;
        mrr = mrr ? mrr - 400 : undefined;
      }
    }

    pulse = Number(pulse.toFixed(1));
    const weather = pulse >= 4.0 ? "sun" : pulse >= 3.0 ? "cloud" : "rain";

    return { ...d, head, productivity, pulse, weather, kpiAch, mrr };
  }) as any[];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-8">
        {/* Main AI Insight */}
        <div className="space-y-4">
          <MainInsightCard
            icon={ins.icon}
            title={ins.title}
            tone={ins.tone}
            text={ins.text}
            weather="cloud"
            trend="down"
          />
          <TabBar
            tabs={[
              { id: "exec", label: "👔 経営層" },
              { id: "admin", label: "📋 経企・人事" },
              { id: "mgr", label: "🎯 マネージャー" },
              { id: "player", label: "💪 現場" }
            ]}
            active={tab}
            onChange={(id) => setTab(id as any)}
          />
        </div>

        {/* Section Navigation */}
        <Pills
          items={[
            { id: "matrix", label: "📊 マトリックス" },
            { id: "kpi", label: "📈 KPI詳細" },
            { id: "org", label: "🏢 部署・プロダクト" },
            { id: "survey", label: "🗣️ 組織の体温" },
            { id: "action", label: "📌 アクション" },
            { id: "semantic", label: "🧬 経営方針" }
          ]}
          active={sec}
          onChange={setSec}
        />

        {/* Content Sections */}
        <div className="animate-fadeIn">
          {sec === "matrix" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight">部署 / プロダクト マトリックス</h3>
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                        <div className="flex items-center gap-1">
                          <span>縦軸: 一人当たり生産性</span>
                          <div className="relative group/calc">
                            <button className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-600 flex items-center justify-center text-[9px] font-black cursor-help transition-colors">?</button>
                            <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 text-white p-3.5 rounded-xl shadow-xl text-[10px] leading-relaxed break-normal whitespace-normal hidden group-hover/calc:block group-focus-within/calc:block z-[400] normal-case tracking-normal transition-all animate-in fade-in zoom-in-95">
                              <div className="font-bold text-white mb-2 flex items-center gap-1.5"><span className="text-sm">📉</span>生産性スコアの計算式</div>
                              <div className="bg-slate-900/80 p-2 rounded-lg font-mono text-[10px] text-emerald-400 mb-2.5 border border-slate-700">
                                主担当KPIの達成率 × 体温係数
                              </div>
                              <div className="text-slate-300">
                                ※ 各部署のKPIが異なるため、<span className="font-bold text-white">「目標の達成率」</span>で標準化。<br />
                                そこに<span className="font-bold text-white">組織体温（無理をしていないか）</span>を掛け合わせることで、バックオフィスを含む全社のチームを同列のY軸で比較評価します。
                              </div>
                            </div>
                          </div>
                        </div>
                        <span>｜ 横軸: リソース量 ｜ 円サイズ: {matView === "product" ? "MRRの大きさ" : "KPI達成率"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <TabBar
                      tabs={[{ id: "dept", label: "部署別" }, { id: "product", label: "プロダクト別" }]}
                      active={matView}
                      onChange={setMatView}
                      className="w-auto"
                    />
                    <div className="flex items-center gap-2 md:border-l border-slate-200 md:pl-3">
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase hidden md:inline">Time Lapse</span>
                      <div className="flex items-center bg-slate-100/80 p-0.5 rounded-full">
                        <button onClick={() => setMonth("default")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "default" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>現在</button>
                        <button onClick={() => setMonth("1m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "1m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>1ヶ月前</button>
                        <button onClick={() => setMonth("3m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "3m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>3ヶ月前</button>
                        <button onClick={() => setMonth("6m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "6m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>6ヶ月前</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4">
                  <ScatterPlot
                    data={currentMatData}
                    isProduct={matView === "product"}
                    month={month}
                    onMonthChange={setMonth}
                    onProductToggle={(isProd) => setMatView(isProd ? "product" : "dept")}
                  />
                </div>

                {/* ヘルプテキスト */}
                <div className="mt-4 flex items-center justify-end gap-2 text-right">
                  {month === "default" ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300"></span>
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold">タイムラプスで組織の変化を確認できます</p>
                    </>
                  ) : (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                      </span>
                      <p className="text-[10px] text-teal-600 font-bold">過去データを表示中</p>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border-l-4 border-teal shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🧠</span>
                  <h4 className="text-sm font-bold text-slate-800">AIのマトリックス分析</h4>
                </div>
                <div className="text-xs leading-loose text-slate-600 font-medium">
                  {matView === "product" ? (
                    month !== "default" ? (
                      month === "1m" ? (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（1ヶ月前）】</strong> プロダクトBにおいて、現場エンジニアの退職と引き継ぎ不足により体温が急落（2.6）。一部メンバーへの負荷集中が深刻化しています。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> その後1ヶ月で体温2.1まで悪化、開発効率も大きく低下しました。負の連鎖により「OVERWEIGHT」最深部へ沈んでいます。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: キーパーソンの離脱後、適切なリソース再配置と目標の見直しが行われなかったことが致命傷となりました。</p>
                          </div>
                        </div>
                      ) : month === "3m" ? (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（3ヶ月前）】</strong> プロダクトA・Bともに高水準の生産性を維持。しかしプロダクトB（体温2.9）は新規機能開発のプレッシャーが高まり、現場の残業時間が増加傾向にあります。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> プロダクトAは人員拡充に成功し「SCALE」へ。一方プロダクトBは無理な開発の反動で燃え尽き症候群が頻発し、生産性が急降下しました。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: アラート時点で開発ロードマップの調整が行われていれば、現在の崩壊は防げました。</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（6ヶ月前）】</strong> 全プロダクトが「PIONEER」「SCALE」領域にあり、理想的な状態です。プロダクトBも新体制直後で士気が高く（体温3.8）、高い生産性を発揮しています。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> その後プロダクトBは無理な増員でコミュニケーションパスが複雑化。現在は生産性が最下位レベルまで落ち込んでいます。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: プロダクトBへの強引な人員投下は、マネジメント体制の崩壊とKPI未達という最悪の結果を招きました。</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        <p><strong>【現在の組織分析】</strong> プロダクトCは少人数ながら極めて高い生産性と体温（4.3）を維持し、全社の模範的な「PIONEER」となっています。対照的にプロダクトBは「OVERWEIGHT」領域に位置し、人数に対するリターンが見合わない深刻な状態です。</p>
                        <p><strong>プロダクトA</strong>は「SCALE」領域に位置し、組織の売上を牽引する安定した主力部隊となっています。</p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 my-2">
                          <p className="font-bold text-slate-700 mb-1">🏷️ 各プロダクトの状況</p>
                          <ul className="space-y-1.5 text-xs text-slate-600">
                            <li><span className="font-bold w-24 inline-block">プロダクトA:</span> 安定成長で全社売上を牽引。機能追加への期待が高まっています。</li>
                            <li><span className="font-bold w-24 inline-block">プロダクトB:</span> リソース過多によるコミュニケーションロスが発生。抜本的見直しが必要です。</li>
                            <li><span className="font-bold w-24 inline-block">プロダクトC:</span> 少人数での高効率運用が実現しており、全社の理想モデルとなる状態です。</li>
                          </ul>
                        </div>
                        <p className="text-teal font-bold bg-teal/5 p-3 rounded-lg border border-teal/10">💡 提言: プロダクトBの余剰リソースをCに移動させた場合、全社MRRへの影響と組織の体温回復をシミュレーションすることを推奨します。</p>
                      </div>
                    )
                  ) : (
                    month !== "default" ? (
                      month === "1m" ? (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（1ヶ月前）】</strong> 営業部の体温が急落（2.8）。生産性は高いものの、リソースに対する現場の疲弊が著しく、バーンアウトの兆候が見られます。短期的なメンタルケアが必要です。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> その後1ヶ月で体温は2.1まで悪化し、生産性も急落し始めました。早期のケア不足が「Overweight」領域への転落を招いたことが分かります。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: アラート発生時の初動遅れが、その後のチーム崩壊の引き金となりました。</p>
                          </div>
                        </div>
                      ) : month === "3m" ? (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（3ヶ月前）】</strong> 開発部は人数規模の拡大によりコミュニケーションコストが増大し、生産性を圧迫しています。一方、営業部は依然として高い生産性を維持しています。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> 開発部はその後生産性低下が止まらず、営業部もスケールの壁に直面し急落しました。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: 組織拡大期特有のマネジメント不足が、主要部門に同時多発的なダメージを与えています。</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（6ヶ月前）】</strong> 営業部が極めて高い生産性を記録し、組織全体を牽引しています。しかし、人事データからはトップへの過度な依存による現場の負荷拡大の兆候が読み取れます。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> その後、営業部はPIONEERから「OVERWEIGHT」に向かって急落しています（人数増・生産性低下・体温2.1へ悪化）。典型的な「スケール時の壁」に直面しました。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: 当時の営業部の増員計画に伴う一時的な生産性の低下と、既存メンバーのケアにもっと注力すべきだったことが立証されました。</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        <p><strong>【現在の組織分析】</strong> 開発部（15名）が最大リソースを抱えながら生産性が低迷しています。対照的に、営業部は一人当たり生産性が突出していますが、体温スコア2.1（危険水域）であり、持続可能性に重大な懸念があります。</p>
                        <p><strong>マーケ部</strong>は8名体制で生産性と組織体温のバランスが理想的です。現在の「量より質」のリード獲得方針が組織全体の効率化に寄与しています。</p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 my-2">
                          <p className="font-bold text-slate-700 mb-1">🏷️ 各部署の状況</p>
                          <ul className="space-y-1.5 text-xs text-slate-600">
                            <li><span className="font-bold w-16 inline-block">営業部:</span> 売上は好調も、トップ依存による属人化リスクが体温（2.1）に表れています。</li>
                            <li><span className="font-bold w-16 inline-block">マーケ部:</span> 「量より質」の方針が機能し、生産性と体温の理想的なバランスを維持。</li>
                            <li><span className="font-bold w-16 inline-block">開発部:</span> 最大リソースを抱える中で業務過多が体温低下に直結しており要警戒。</li>
                            <li><span className="font-bold w-16 inline-block">CS部:</span> 大口解約の対応に追われ、他部署への依存ジレンマを抱えています。</li>
                            <li><span className="font-bold w-16 inline-block">人事部:</span> 採用数KPIは順調で、高い組織体温（4.0）を持続的に維持しています。</li>
                          </ul>
                        </div>
                        <p className="text-teal font-bold bg-teal/5 p-3 rounded-lg border border-teal/10">💡 提言: 開発プロセスの改善による全社の底上げと、営業部の負荷軽減が最優先課題です。</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {sec === "kpi" && (
            <div className="space-y-4">
              {/* KPI Summary Row */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {kpiDefs.map(k => (
                  <KpiSummaryCard
                    key={k.id}
                    name={k.name}
                    value={k.val.toLocaleString()}
                    unit={k.unit}
                    isActive={selKpi === k.id}
                    onClick={() => setSelKpi(k.id)}
                  />
                ))}
              </div>

              {/* Major Detail Block */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">{selectedKpiDef.name}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="bg-slate-100 text-slate-500 font-bold border-none">担当: {selectedKpiDef.dept}</Badge>
                      {selectedKpiDef.target && (
                        <span className="text-xs text-slate-400 font-bold">目標: {selectedKpiDef.target.toLocaleString()}{selectedKpiDef.unit}</span>
                      )}
                      {achRate !== null && (
                        <Badge className={cn(
                          "border-none font-black",
                          achRate >= 100 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                        )}>
                          達成率 {achRate}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1.5 justify-end">
                      <span className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter">{selectedKpiDef.val.toLocaleString()}</span>
                      <span className="text-lg font-bold text-slate-400">{selectedKpiDef.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">6ヶ月推移</div>
                  <div className="h-40 w-full">
                    <DetailLineChart
                      data={selectedKpiDef.prev}
                      labels={["9月", "10月", "11月", "12月", "1月", "2月"]}
                      color={selectedKpiDef.prev[5] >= selectedKpiDef.prev[4] ? "#10B981" : "#EF4444"}
                    />
                  </div>
                </div>

                {achRate !== null && (
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">目標進捗</span>
                      <span className={achRate >= 100 ? "text-emerald-500" : "text-rose-500"}>{achRate}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          achRate >= 100 ? "bg-emerald-400" : "bg-rose-400"
                        )}
                        style={{ width: `${Math.min(achRate, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Voices Details */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗣️</span>
                  <h4 className="text-base font-bold text-slate-800">{selectedKpiDef.dept}の匿名アンケート要約</h4>
                  <Badge className="bg-slate-50 text-slate-400 border-none ml-2 tracking-tighter text-[10px] uppercase font-bold">{selectedKpiDef.name}に関する声</Badge>
                </div>
                <div className="space-y-3">
                  {selectedKpiDef.voices.map((v, i) => {
                    const moodColor = v.mood === "sun" ? "bg-emerald-50/50 border-emerald-100" : v.mood === "rain" ? "bg-rose-50/50 border-rose-100" : "bg-amber-50/50 border-amber-100";
                    return (
                      <div key={i} className={`p-5 rounded-2xl border flex gap-4 transition-all hover:translate-x-1 ${moodColor}`}>
                        <span className="text-xl shrink-0">{v.mood === "sun" ? "☀️" : v.mood === "cloud" ? "☁️" : "☔️"}</span>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{v.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {sec === "org" && (
            <div className="space-y-6">
              <TabBar
                tabs={[{ id: "dept", label: "🏢 部署別" }, { id: "product", label: "📦 プロダクト別" }]}
                active={orgView}
                onChange={setOrgView}
              />
              <div className="space-y-4 pt-2">
                {(orgView === "dept" ? deptData : prodKpis).map((d: any, i: number) => (
                  <OrganizationCard
                    key={i}
                    name={d.name}
                    head={d.head}
                    pulse={d.pulse}
                    weather={d.weather}
                    arrow={d.arrow}
                    kpis={d.kpis}
                  />
                ))}
              </div>

              {/* AI Analysis / Feedback Bottom Section */}
              {orgView === "product" ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔗</span>
                    <h3 className="text-sm font-bold text-slate-800">プロダクト間の比較分析（AI）</h3>
                  </div>
                  <div className="space-y-3">
                    <ProductInsight
                      name="プロダクトA"
                      tag="Star"
                      type="star"
                      text="全指標で目標超過かつ体温良好。成功パターンが確立されている。このチームのナレッジをBに展開することで、組織全体の底上げが見込める。"
                    />
                    <ProductInsight
                      name="プロダクトB"
                      tag="Dog"
                      type="dog"
                      text="解約率8.1%は危険水域。14名のリソースに対してMRR520万は効率が悪い。教育体制の不備か、ターゲットとのミスマッチが疑われる。経営方針では「3月末まで改善なければピボット検討」と記載あり。期限まで残り1ヶ月。"
                    />
                    <ProductInsight
                      name="プロダクトC"
                      tag="Question Mark → Star候補"
                      type="question"
                      text="9名で一人当たりMRRが最高値。体温4.3は全プロダクト中1位。プロダクトBからの配置転換2〜3名で、さらにスケールする可能性がある。"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔗</span>
                    <h3 className="text-sm font-bold text-slate-800">部署間フィードバック（AIサマリー）</h3>
                  </div>
                  <div className="space-y-2">
                    <FeedbackItem from="営業" to="マーケ" type="positive" text="リードの質が改善傾向。ターゲティング精度の向上が商談の質に好影響を与えている。" />
                    <FeedbackItem from="営業" to="開発" type="warning" text="仕様変更の頻度と突発性が提案資料の手戻りを生んでおり、営業部の体温低下の一因になっている可能性がある。" />
                    <FeedbackItem from="CS" to="開発" type="alert" text="バグ対応の優先順位が不透明で、顧客への説明に窮する場面が増えているとの声が複数あがっている。" />
                    <FeedbackItem from="開発" to="全社" type="info" text="承認フローの3段階構造が開発速度のボトルネックとして最も多く挙げられている。短縮の検討を推奨。" />
                  </div>
                </div>
              )}
            </div>
          )}

          {sec === "survey" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                      組織の体温
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-[0.1em]">11の問いから紐解く現場の真実</p>
                  </div>
                </div>
                <TabBar
                  tabs={[
                    { id: "all", label: "🏢 全社" },
                    { id: "sales", label: "💼 営業部" },
                    { id: "mktg", label: "📢 マーケ部" },
                    { id: "dev", label: "💻 開発部" },
                    { id: "cs", label: "🎧 CS部" },
                  ]}
                  active={orgView === "product" ? "all" : orgView} // Reuse orgView state or fix it
                  onChange={(id) => setOrgView(id as any)}
                />
              </div>

              {(() => {
                const currentData = (surveyData as Record<string, { pulse: number, pulseHistory: number[], scores: number[], aiComment: string }>)[orgView === "product" ? "all" : orgView] || surveyData.all;

                return (
                  <>
                    {/* Pulse History Chart */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">🌡️</span>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">組織体温の推移（直近6ヶ月）</h3>
                          </div>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest pl-8">
                            継続的なストレスや熱量の変化をモニタリング
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">当月平均</span>
                          <span className={cn(
                            "text-4xl font-black tabular-nums tracking-tighter",
                            currentData.pulse >= 3.5 ? "text-emerald-500" : currentData.pulse >= 2.5 ? "text-amber-500" : "text-rose-500"
                          )}>
                            {currentData.pulse.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="h-40 w-full pt-4">
                        <DetailLineChart
                          data={currentData.pulseHistory}
                          labels={["9月", "10月", "11月", "12月", "1月", "2月"]}
                          color={currentData.pulse >= 3.5 ? "#10B981" : currentData.pulse >= 2.5 ? "#F59E0B" : "#EF4444"}
                          height={140}
                        />
                      </div>
                    </div>

                    {/* AI Analysis Card */}
                    <div className="relative overflow-hidden bg-white rounded-3xl p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                      <div className="relative space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center text-xl shadow-inner shadow-teal/5">🧠</div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-800">AI組織分析レポート</h3>
                            <p className="text-[10px] text-teal font-black uppercase tracking-widest">{orgView === "all" ? "Whole Company" : `${orgView.toUpperCase()} UNIT`}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-50">
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {currentData.aiComment}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Question Grid */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">設問別スコア詳細</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {questions.map((q, i) => (
                          <SurveyQuestionCard
                            key={q.id}
                            question={q.text}
                            hint={q.hint}
                            score={currentData.scores[i]}
                            prevScore={currentData.scores[i] * 0.95}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {sec === "action" && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-800 mb-6">📌 今月のアクション提案</h3>
              <div className="space-y-3">
                {actions.map((a, i) => (
                  <ActionItem
                    key={i}
                    priority={a.pri}
                    title={a.title}
                    description={a.desc}
                    dept={a.dept}
                    owner={a.owner}
                  />
                ))}
              </div>
            </div>
          )}

          {sec === "semantic" && (
            <SemanticLayer
              initialText={semTextDefault}
              onSave={(txt: string) => console.log("Saved:", txt)}
            />
          )}

        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-5 py-20 text-center space-y-4">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-200">
            <span className="text-white font-black text-base italic">S</span>
          </div>
          <h2 className="text-3xl font-black text-slate-300 tracking-tighter">Signs AI</h2>
        </div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">組織に体温を</p>
        <p className="text-[9px] text-slate-300 font-bold uppercase">by 株式会社 Taion</p>
      </footer>
    </div>
  );
}
