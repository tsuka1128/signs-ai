"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
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
import { DeepReport } from "@/components/dashboard/DeepReport";
import { cn } from "@/lib/utils";
import { Target, Thermometer, Shield, Rocket, Lightbulb } from "lucide-react";

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

// モックデータを削除。DBから集計。

// --- Full Original Data --- 

const products = [
  { id: "a", name: "SaaS プロダクト A", head: 22, productivity: 129, pulse: 3.8, weather: "sun" as const, kpiAch: 105, prevHead: 20, prevProductivity: 120, prevPulse: 3.7, prevWeather: "sun", prevKpiAch: 100, kpiName: "MRR", mrr: 1800, prevMrr: 1600 },
  { id: "b", name: "新規事業プロジェクト B", head: 14, productivity: 86, pulse: 2.1, weather: "rain" as const, kpiAch: 82, prevHead: 12, prevProductivity: 110, prevPulse: 2.6, prevWeather: "cloud", prevKpiAch: 95, kpiName: "売上", mrr: 520, prevMrr: 600 },
  { id: "c", name: "オプションサービス C", head: 9, productivity: 156, pulse: 4.3, weather: "sun" as const, kpiAch: 118, prevHead: 8, prevProductivity: 145, prevPulse: 4.1, prevWeather: "sun", prevKpiAch: 105, kpiName: "MRR", mrr: 460, prevMrr: 380 }
];

const deptData = [
  {
    id: "sales", name: "営業部", head: 15, productivity: 260, pulse: 2.1, pulseHistory: [3.1, 2.9, 2.8, 2.5, 2.3, 2.1], weather: "rain" as const, arrow: "down" as const, kpiAch: 108, prevHead: 14, prevProductivity: 250, prevPulse: 2.5, prevWeather: "cloud", prevKpiAch: 102, kpiName: "受注金額",
    kpis: [
      { name: "月次売上", val: "4,200万", ach: 108, type: "stack" },
      { name: "新規契約件数", val: "15件", ach: 92, type: "stack" },
      { name: "平均客単価", val: "280万", ach: 110, type: "rate" }
    ]
  },
  {
    id: "mktg", name: "マーケティング部", head: 4, productivity: 280, pulse: 4.2, pulseHistory: [3.8, 3.9, 4.0, 4.1, 4.1, 4.2], weather: "sun" as const, arrow: "up" as const, kpiAch: 90, prevHead: 4, prevProductivity: 260, prevPulse: 4.0, prevWeather: "sun", prevKpiAch: 105, kpiName: "有効リード数",
    kpis: [
      { name: "有効リード獲得数", val: "128件", ach: 112, type: "stack" },
      { name: "商談獲得数", val: "42件", ach: 90, type: "stack" }
    ]
  },
  {
    id: "dev", name: "開発部", head: 22, productivity: 80, pulse: 2.4, pulseHistory: [3.4, 3.2, 3.0, 2.8, 2.5, 2.4], weather: "rain" as const, arrow: "down" as const, kpiAch: 80, prevHead: 20, prevProductivity: 85, prevPulse: 2.8, prevWeather: "cloud", prevKpiAch: 85, kpiName: "リリース頻度",
    kpis: [
      { name: "ベロシティ", val: "120pt", ach: 85, type: "stack" },
      { name: "障害発生率", val: "0.2%", ach: 110, type: "inverse" }
    ]
  },
  {
    id: "cs", name: "カスタマーサクセス部", head: 7, productivity: 110, pulse: 3.1, pulseHistory: [3.6, 3.5, 3.4, 3.2, 3.1, 3.1], weather: "cloud" as const, arrow: "flat" as const, kpiAch: 72, prevHead: 6, prevProductivity: 115, prevPulse: 3.4, prevWeather: "cloud", prevKpiAch: 80, kpiName: "解約率",
    kpis: [
      { name: "顧客解約率", val: "1.8%", ach: 115, type: "inverse" },
      { name: "アップセル成約額", val: "450万", ach: 90, type: "stack" }
    ]
  },
  {
    id: "hr", name: "人事総務部", head: 3, productivity: 190, pulse: 4.0, pulseHistory: [3.9, 3.9, 3.8, 3.9, 4.0, 4.0], weather: "sun" as const, arrow: "up" as const, kpiAch: 105, prevHead: 3, prevProductivity: 180, prevPulse: 3.8, prevWeather: "sun", prevKpiAch: 95, kpiName: "採用進捗",
    kpis: [
      { name: "採用充足率", val: "85%", ach: 105, type: "rate" },
      { name: "離職率", val: "4.2%", ach: 120, type: "inverse" }
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
    id: "mrr", name: "月次売上", unit: "万円", val: 4200, target: 4000, prev: [3200, 3450, 3680, 3890, 4000, 4200], dept: "営業部", voices: [
      { text: "目標超過だが、トップ営業への依存度が依然として高い", mood: "cloud" },
      { text: "大型案件による見かけの数字。利益率の精査が必要", mood: "cloud" },
      { text: "新規顧客の獲得コストが想定より上がっている", mood: "rain" }
    ]
  },
  {
    id: "leads", name: "有効リード獲得数", unit: "件", val: 128, target: 120, prev: [95, 102, 110, 115, 120, 128], dept: "マーケティング部", voices: [
      { text: "コンテンツマーケティング経由の質が高いリードが増加", mood: "sun" },
      { text: "広告費に対する獲得単価(CPA)が改善傾向にある", mood: "sun" }
    ]
  },
  {
    id: "mktg_opps", name: "商談獲得数", unit: "件", val: 42, target: 50, prev: [38, 42, 48, 51, 47, 42], dept: "マーケティング部", voices: [
      { text: "リード数は増えたが、商談化率が伸び悩んでいる", mood: "cloud" },
      { text: "インサイドセールのリソース不足が露呈し始めている", mood: "rain" }
    ]
  },
  {
    id: "contracts", name: "新規契約件数", unit: "件", val: 15, target: 12, prev: [8, 10, 12, 11, 13, 15], dept: "営業部", voices: [
      { text: "中小規模案件のクロージングが効率化できている", mood: "sun" },
      { text: "契約管理プロセスの工数が増えており、現場の心理的負荷が高い", mood: "cloud" }
    ]
  },
  {
    id: "churn", name: "顧客解約率", unit: "%", val: 1.8, target: 2.0, prev: [2.5, 2.3, 2.2, 2.0, 1.9, 1.8], dept: "カスタマーサクセス部", voices: [
      { text: "ハイタッチ対応の強化により、主要顧客の継続意向が向上", mood: "sun" },
      { text: "オンボーディングの自動化が一部の顧客には不評", mood: "cloud" }
    ]
  },
  {
    id: "velocity", name: "ベロシティ", unit: "pt", val: 120, target: 140, prev: [100, 110, 115, 125, 130, 120], dept: "開発部", voices: [
      { text: "技術的負債の返済に工数を割いたため、新機能開発が停滞", mood: "cloud" },
      { text: "レビュープロセスのボトルネック化により、リリース速度が低下", mood: "rain" }
    ]
  },
  {
    id: "recruit", name: "採用充足率", unit: "%", val: 85, target: 100, prev: [70, 75, 80, 82, 85, 85], dept: "人事総務部", voices: [
      { text: "エージェント経由の応募は多いが、カルチャーマッチが課題", mood: "cloud" },
      { text: "面接官のリソース確保が難しく、先行プロセスが滞留気味", mood: "cloud" }
    ]
  }
];

const insights = {
  exec: { icon: "👔", title: "経営層", tone: "戦略的分析", text: "月次売上は目標を超過していますが、営業部の「体温」2.1は組織的な歪みを示唆しています。ボイスチェックでは特定個人への業務集中と、開発部門との連携摩擦が主要な懸念事項として挙がっています。持続可能な成長のためには、プロセスの標準化が急務です。" },
  admin: { icon: "📋", title: "経企・人事", tone: "構造分析", text: "開発部のベロシティ低下と、CS部の解約率改善が相関しています。品質重視へのシフトは成果を上げていますが、開発現場では承認フローの停滞が心理的負荷となっています。採用充足率の維持と並行し、意思決定の迅速化が求められます。" },
  mgr: { icon: "🎯", title: "マネージャー", tone: "現場支援", text: "現場メンバーから『突発的な仕様変更』と『リード質の乖離』が主要ボトルネックとして挙がっています。期待値調整の仕組み化により、現場の心理的安全性を確保することが生産性回復の鍵となります。" },
  player: { icon: "💪", title: "現場", tone: "前向きな共有", text: "LP改修後のリード質向上について、営業現場からポジティブな反応が出ています。事務作業などの『非本質的な時間』を削減し、顧客に向き合う時間を最大化する流れができつつあります。" }
};

const actions = [
  { pri: "🔴 緊急", title: "営業部の属人化を解消するためのプロセス標準化", desc: "トップ営業への依存が限界に達しており、メンバーの疲弊が顕著。商談フェーズの定義とナレッジ共有を2月中に完了させる。", dept: "営業部", owner: "営業部長" },
  { pri: "🔴 緊急", title: "社内承認フローの簡素化（2段階への圧縮）", desc: "全部署で『決定待ち』による体温低下が発生。CEO直轄プロジェクトとして承認プロセスの見直しを断行する。", dept: "全社", owner: "CEO" },
  { pri: "🟡 今月中", title: "開発・マーケ間のリード品質基準の再定義", desc: "獲得数は目標達成しているが、営業現場の期待値と乖離がある。スコアリング条件を実態に合わせてアップデートする。", dept: "マーケ×営業", owner: "マーケ部長" },
  { pri: "🟡 今月中", title: "離職リスクが懸念されるメンバーへの重点フォロー", desc: "体温低下が著しい入社1年目メンバーを中心に、メンターによる1on1の頻度を週1回に増やす。", dept: "人事総務部", owner: "人事責任者" },
  { pri: "🟢 継続", title: "CS部のアップセル成功事例をセールスイネーブルメントに活用", desc: "好調な既存顧客フォローのノウハウを新規営業にも転用し、全体の客単価向上を図るサイクルを構築する。", dept: "CS→営業", owner: "CS部長" }
];

const semTextDefault = `# 組織方針 v1.5 (2026年3月〜)

## 組織の現在地
- フェーズ: ユニットエコノミクス改善期
- 現在の優先順位: 収益の質向上 ＞ 獲得件数の最大化
- 組織の目標: 「自律駆動型組織」への転換。現場が主役となる意思決定構造の構築

## KPIの解釈ガイド
- 月次売上: 目標達成は通過点。特定個人への依存はボトルネックとみなす
- 有効リード獲得数: 営業現場の声を反映した「商談の質」を最重視する
- 顧客解約率: 2.0%以下を健全ラインとする。予兆を早期検知し、能動的(Proactive)に動く
- 採用充足率: 現場の過負荷を解消し、挑戦できる余白を創出するための投資

## 数字と体温の関係
- ☀️なのに☔️ (生産性の歪み): 成果は出ているが現場に無理が生じている。仕組み（フロー・ツール）の見直しが必要
- ☔️なのに☀️ (期待先行型): 体温は高いが成果に結びついていない。戦略の方向性またはリソース配分の修正が必要

## 組織の注意点
- 部門間の「サイロ化」を放置しない。SignsAIのボイスチェックを共通言語として活用
- 承認フローなどの事務工数は極力排除し、本来のクリエイティブな仕事に集中する

## 地雷ワード (AIが検知したら最優先でアラート)
- 「自分には関係ない」「誰も聞いてくれない」「上から言われただけ」「今のままでいい」`;

export default function DashboardPage() {
  const [tab, setTab] = useState<keyof typeof insights>("exec");
  const [sec, setSec] = useState("matrix");
  const [matView, setMatView] = useState("dept");
  const [selKpi, setSelKpi] = useState("mrr");
  const [orgView, setOrgView] = useState("dept");
  const [month, setMonth] = useState("default");
  const [showDeepReport, setShowDeepReport] = useState(false);

  const [realDepts, setRealDepts] = useState<any[]>([]);
  const [realKpis, setRealKpis] = useState<any[]>([]);
  const [realSem, setRealSem] = useState<string>("");
  const [realResponses, setRealResponses] = useState<any[]>([]);
  const [realAxes, setRealAxes] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: comp } = await supabase.from('users').select('company_id').eq('id', user.id).single();
      if (!comp?.company_id) return;

      const [d, k, s, r, a] = await Promise.all([
        supabase.from('departments').select('*').eq('company_id', comp.company_id).order('created_at', { ascending: true }),
        supabase.from('kpi_definitions').select('*').eq('company_id', comp.company_id).order('sort_order', { ascending: true }),
        supabase.from('semantic_layers').select('content').eq('company_id', comp.company_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('survey_responses').select('*, survey_answers(*)').eq('company_id', comp.company_id),
        supabase.from('kpi_axes').select('*').eq('company_id', comp.company_id).order('sort_order', { ascending: true })
      ]);

      if (d.data && d.data.length > 0) setRealDepts(d.data);
      if (k.data && k.data.length > 0) setRealKpis(k.data);
      if (s.data?.content) setRealSem(s.data.content);
      if (r.data) setRealResponses(r.data);
      if (a.data) setRealAxes(a.data);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last6Months = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    }
    return dates;
  }, []);

  const monthLabels = useMemo(() => {
    return last6Months.map(m => {
      const mm = m.split("-")[1];
      return `${parseInt(mm)}月`;
    });
  }, [last6Months]);

  const getSimulatedIndex = (deptName: string) => {
    if (deptName.includes("営業")) return 0; // sales
    if (deptName.includes("マーケ")) return 1; // mktg
    if (deptName.includes("開発") || deptName.includes("エンジニア")) return 2; // dev
    if (deptName.includes("CS") || deptName.includes("カスタマー")) return 3; // cs
    if (deptName.includes("人事") || deptName.includes("HR")) return 4; // hr
    return -1;
  };

  const currentSurveyData = useMemo(() => {
    let filtered = realResponses;
    let viewName = "全社";

    const surveyViewId = (orgView === "product" || orgView === "dept") ? "all" : orgView;

    if (surveyViewId !== "all") {
      const dept = realDepts.find(d => d.id === surveyViewId);
      viewName = dept ? dept.name : "不明な部署";
      filtered = realResponses.filter(r => r.department_id === surveyViewId);
    }

    const latestMonth = last6Months[5];
    const qScores = questions.map(q => {
      const answers = filtered
        .filter(r => r.recorded_month === latestMonth)
        .flatMap(r => r.survey_answers || [])
        .filter(a => a.question_id === q.id);
      if (answers.length === 0) return 0;
      return answers.reduce((sum, a) => sum + a.score, 0) / answers.length;
    });

    const avgPulse = qScores.length > 0 ? qScores.reduce((a, b) => a + b, 0) / qScores.length : 0;

    const pulseHistory = last6Months.map(month => {
      const monthAnswers = filtered
        .filter(r => r.recorded_month === month)
        .flatMap(r => r.survey_answers || []);
      if (monthAnswers.length === 0) return 0;
      const scores = questions.map(q => {
        const answers = monthAnswers.filter(a => a.question_id === q.id);
        return answers.length > 0 ? answers.reduce((sum, a) => sum + a.score, 0) / answers.length : 0;
      }).filter(s => s > 0);
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    });

    let comment = "回答データが蓄積されていません。";
    if (avgPulse > 0) {
      const lowScoreQ = qScores.map((s, i) => ({ s, i })).filter(x => x.s > 0 && x.s < 3.0).sort((a, b) => a.s - b.s)[0];
      if (lowScoreQ) {
        comment = `${questions[lowScoreQ.i].text} のスコアが低迷しています。環境改善の検討が必要です。`;
      } else {
        comment = "全体的に良好な体温が維持されています。";
      }
    }

    return { viewName, scores: qScores, pulse: avgPulse, pulseHistory, aiComment: comment };
  }, [orgView, realResponses, realDepts, last6Months]);

  const displayDepts = useMemo(() => {
    return realDepts.map((d, i) => {
      let dummyIdx = getSimulatedIndex(d.name);
      if (dummyIdx === -1) dummyIdx = i % deptData.length;
      const dummyRef = deptData[dummyIdx];

      // 実データから体温を集計 (最新月)
      const latestMonth = last6Months[5];
      const deptResponses = realResponses.filter(r => r.department_id === d.id);
      const latestAnswers = deptResponses
        .filter(r => r.recorded_month === latestMonth)
        .flatMap(r => r.survey_answers || []);

      const pulseScore = latestAnswers.length > 0
        ? latestAnswers.reduce((sum, a) => sum + a.score, 0) / latestAnswers.length
        : 0; // データがなければ 0 (モックを排除)

      // 過去6ヶ月の推移
      const pulseHistory = last6Months.map(month => {
        const monthAnswers = deptResponses
          .filter(r => r.recorded_month === month)
          .flatMap(r => r.survey_answers || []);
        if (monthAnswers.length === 0) return pulseScore * (0.8 + Math.random() * 0.4); // データなければランダム気味
        return monthAnswers.reduce((sum, a) => sum + a.score, 0) / monthAnswers.length;
      });

      return {
        ...d,
        ...dummyRef,
        id: d.id,
        name: d.name,
        head: d.headcount || dummyRef.head,
        pulse: Number(pulseScore.toFixed(1)),
        pulseHistory,
        kpis: realKpis.filter(k => k.owner_dept_id === d.id)
          .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
          .map((k: any) => ({
            name: k.name,
            val: `${k.target_default ?? 100}${k.unit}`,
            ach: 100,
            type: "stack"
          })).concat(dummyRef.kpis).slice(0, 3),
        kpiName: realKpis.find(k => k.owner_dept_id === d.id && k.is_main)?.name ||
          realKpis.find(k => k.owner_dept_id === d.id)?.name ||
          dummyRef.kpiName
      };
    });
  }, [realDepts, realResponses, last6Months, realKpis]);

  const displayKpis = realKpis.length > 0 ? realKpis.map((k, i) => {
    const dummyRef = kpiDefs[i % kpiDefs.length];
    return {
      ...k,
      ...dummyRef, // preserve dummy history fields like `prev`, `voices`
      id: `kpi_${k.id}`,
      name: k.name,
      unit: k.unit,
      target: k.target_value || dummyRef.target,
      val: dummyRef.val, // Keep dummy tracking history
      dept: realDepts.find(d => d.id === k.owner_department_id)?.name || dummyRef.dept,
    };
  }) : kpiDefs;

  const displayAxes = useMemo(() => {
    return realAxes.map((axis, i) => {
      const dummyProd = prodKpis[i % prodKpis.length];
      const latestMonth = last6Months[5];
      const axisResponses = realResponses.filter(r => r.axis_id === axis.id);
      const latestAnswers = axisResponses
        .filter(r => r.recorded_month === latestMonth)
        .flatMap(r => r.survey_answers || []);

      const pulseScore = latestAnswers.length > 0
        ? latestAnswers.reduce((sum, a) => sum + a.score, 0) / latestAnswers.length
        : 0;

      const pulseHistory = last6Months.map(month => {
        const monthAnswers = axisResponses
          .filter(r => r.recorded_month === month)
          .flatMap(r => r.survey_answers || []);
        if (monthAnswers.length === 0) return pulseScore * (0.8 + Math.random() * 0.4);
        return monthAnswers.reduce((sum, a) => sum + a.score, 0) / monthAnswers.length;
      });

      return {
        ...axis,
        id: axis.id,
        name: axis.name,
        head: dummyProd.head, // リソース量はまだモック
        productivity: dummyProd.productivity, // マトリックス描画に必須
        kpiAch: dummyProd.kpiAch, // 円のサイズ計算に必須
        mrr: dummyProd.mrr,
        pulse: Number(pulseScore.toFixed(1)),
        pulseHistory,
        weather: pulseScore >= 4.0 ? "sun" : pulseScore >= 3.0 ? "cloud" : "rain",
        arrow: "flat",
        kpis: dummyProd.kpis
      } as any;
    });
  }, [realAxes, realResponses, last6Months]);

  const displaySem = realSem || semTextDefault;

  const ins = insights[tab];
  const selectedKpiDef = displayKpis.find(k => k.id === selKpi) || displayKpis[0];
  const achRate = selectedKpiDef.target ? Math.round((selectedKpiDef.val / selectedKpiDef.target) * 100) : null;

  const currentMatData = (matView === "product" ? displayAxes : displayDepts).map(d => {
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
      else if (month !== "default") { head = 15; productivity = 70; pulse = 2.1; kpiAch = 85; } // current: OVERWEIGHT
    }
    else if (d.id === "dev") {
      if (month === "1m") { head = 21; productivity = 75; pulse = 2.6; kpiAch = 88; }
      else if (month === "3m") { head = 20; productivity = 95; pulse = 3.2; kpiAch = 100; }
      else if (month === "6m") { head = 18; productivity = 120; pulse = 3.8; kpiAch = 110; }
      else if (month !== "default") { head = 22; productivity = 65; pulse = 2.4; kpiAch = 80; } // current: OVERWEIGHT
    }
    else if (d.id === "mktg") {
      if (month === "1m") { head = 4; productivity = 230; pulse = 3.8; kpiAch = 105; }
      else if (month === "3m") { head = 4; productivity = 180; pulse = 3.4; kpiAch = 95; }
      else if (month === "6m") { head = 3; productivity = 130; pulse = 3.1; kpiAch = 85; }
      else if (month !== "default") { head = 4; productivity = 270; pulse = 4.0; kpiAch = 120; } // current: PIONEER V字回復
    }
    // --- プロダクト別のタイムラプスストーリー ---
    // Prod B: 6m前(順調) -> Now(拡大で崩壊, 低体温・低生産性)
    // Prod C: 6m前(低迷) -> Now(少人数で超高効率, 高体温・高生産性へ成長)
    // Prod A: 6m前(普通) -> Now(順調にSCALE, 体温も安定上昇)
    else if (d.id === "prod_b" || d.id === "b") {
      if (month === "1m") { head = 13; productivity = 80; pulse = 2.6; mrr = 850; kpiAch = 85; }
      else if (month === "3m") { head = 12; productivity = 110; pulse = 2.9; mrr = 950; kpiAch = 95; }
      else if (month === "6m") { head = 10; productivity = 140; pulse = 3.8; mrr = 1100; kpiAch = 105; }
      else if (month !== "default") { head = 14; productivity = 60; pulse = 2.1; mrr = 720; kpiAch = 75; } // current: OVERWEIGHT
    }
    else if (d.id === "prod_c" || d.id === "c") {
      if (month === "1m") { head = 9; productivity = 145; pulse = 4.1; mrr = 420; kpiAch = 112; }
      else if (month === "3m") { head = 8; productivity = 130; pulse = 3.8; mrr = 380; kpiAch = 105; }
      else if (month === "6m") { head = 7; productivity = 115; pulse = 3.2; mrr = 280; kpiAch = 95; }
      else if (month !== "default") { head = 9; productivity = 156; pulse = 4.3; mrr = 460; kpiAch = 118; } // current: PIONEER
    }
    else if (d.id === "prod_a" || d.id === "a") {
      if (month === "1m") { head = 20; productivity = 120; pulse = 3.7; mrr = 1600; kpiAch = 100; }
      else if (month === "3m") { head = 18; productivity = 115; pulse = 3.5; mrr = 1400; kpiAch = 95; }
      else if (month === "6m") { head = 15; productivity = 110; pulse = 3.4; mrr = 1100; kpiAch = 90; }
      else if (month !== "default") { head = 22; productivity = 129; pulse = 3.8; mrr = 1800; kpiAch = 105; } // current: SCALE
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
            onOpenDeepReport={tab === "exec" ? () => setShowDeepReport(true) : undefined}
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
            { id: "semantic", label: "🧬 組織方針" }
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
                {displayKpis.map(k => (
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
                  {selectedKpiDef.voices?.map((v: any, i: number) => {
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
                {(orgView === "dept" ? displayDepts : displayAxes).map((d: any, i: number) => (
                  <OrganizationCard
                    key={i}
                    name={d.name}
                    head={d.head}
                    pulse={d.pulse}
                    weather={d.weather}
                    arrow={d.arrow || "flat"}
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
                      text="解約率8.1%は危険水域。14名のリソースに対してMRR520万は効率が悪い。教育体制の不備か、ターゲットとのミスマッチが疑われる。組織方針では「3月末まで改善なければピボット検討」と記載あり。期限まで残り1ヶ月。"
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
                    ...realDepts.map(d => ({ id: d.id, label: d.name }))
                  ]}
                  active={orgView === "product" ? "all" : orgView} // Reuse orgView state or fix it
                  onChange={(id) => setOrgView(id as any)}
                />
              </div>

              {(() => {
                const data = currentSurveyData;

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
                            data.pulse === 0 ? "text-slate-300" : data.pulse >= 3.5 ? "text-emerald-500" : data.pulse >= 2.5 ? "text-amber-500" : "text-rose-500"
                          )}>
                            {data.pulse === 0 ? "-" : data.pulse.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="h-40 w-full pt-4">
                        <DetailLineChart
                          data={data.pulseHistory}
                          labels={monthLabels}
                          color={data.pulse >= 3.5 ? "#10B981" : data.pulse >= 2.5 ? "#F59E0B" : "#EF4444"}
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
                            <p className="text-[10px] text-teal font-black uppercase tracking-widest">{data.viewName}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-50">
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {data.aiComment}
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
                            score={data.scores[i]}
                            prevScore={data.scores[i] * 0.95}
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
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧬</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">組織方針</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">AIの判断基準</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                組織方針・KPIの解釈・組織のフェーズをMarkdownで記述。AIはこの文書を毎月の診断時に読み込み、数字の良し悪しを「あなたの会社の文脈」で判断します。
              </p>
              <SemanticLayer
                initialText={displaySem}
                onSave={async (txt: string) => {
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  const { data: comp } = await supabase.from('users').select('company_id').eq('id', user.id).single();
                  if (!comp?.company_id) return;

                  await supabase.from('semantic_layers').insert({
                    company_id: comp.company_id,
                    content: txt,
                    valid_from: new Date().toISOString()
                  });
                  setRealSem(txt);
                }}
              />
            </div>
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

      {/* Deep Report Modal */}
      <DeepReport
        isOpen={showDeepReport}
        onClose={() => setShowDeepReport(false)}
        generatedAt="2026年3月度"
        sections={[
          {
            id: "executive-summary",
            icon: <Target className="w-5 h-5 text-teal" />,
            title: "総評：組織の健全性と戦略進捗",
            subtitle: "Executive Summary",
            highlights: [
              { label: "全社体温", value: "3.2", trend: "down", color: "text-amber-500" },
              { label: "月次売上達成率", value: "108%", trend: "up", color: "text-emerald-500" },
              { label: "重点アラート", value: "3件", color: "text-rose-500" },
              { label: "改善傾向KPI", value: "2", trend: "up", color: "text-teal" }
            ],
            content: "今月の組織全体は「売上は達成しているが、現場が身を粋っている」状態です。\n\nKPI上は月次売上108%、有効リード112%と好調に見えますが、その裏側で営業部の体温は2.1、開発部は2.4と危険水域にあります。特に営業部は「トップ営業。1人に全体の42%の売上が集中」という構造的な脆弱性を抱えており、この人物の離職・休職が発生した場合のインパクトは売上の40%減という極めて高いリスクです。\n\n一方、マーケティング部は体温4.2と全社で最も健全な状態を維持しており、「自律駆動型チーム」の理想的なモデルとなっています。この成功パターンの全社展開が、今後の組織改善の鍵となります。"
          },
          {
            id: "correlation",
            icon: <Thermometer className="w-5 h-5 text-teal" />,
            title: "組織力とKPIの相関解析",
            subtitle: "Organizational Health × KPI Correlation",
            highlights: [
              { label: "体温↓×KPI↑", value: "営業部", color: "text-rose-500" },
              { label: "体温↑×KPI↑", value: "マーケ", color: "text-emerald-500" },
              { label: "体温↓×KPI↓", value: "開発部", color: "text-amber-500" },
              { label: "体温→×KPI→", value: "CS部", color: "text-slate-500" }
            ],
            content: "組織体温とKPI達成率の相関を分析した結果、以下の構造が見えてきます。\n\n■ 営業部（体温2.1 / KPI達成108%）\n「数字は出ているが、現場が悲鸣を上げている」典型的なパターンです。ボイスチェックでは「社内調整の多さ」「言いたいことが言えない」という声が突出しており、これは属人化された業務フローが「特定個人の芝耐」で回っていることを示しています。この状態が続くと、2〜3ヶ月以内にKPIの急落が発生する確率が高いと予測されます。\n\n■ 開発部（体温2.4 / KPI達成85%）\n体温とKPIが共に低迷する「消耗スパイラル」に陥っています。「扏け決定待ち」が最大のボトルネックであり、承認フローの簡素化が生産性と体温の両方を改善するレバレッジポイントです。\n\n■ マーケティング部（体温4.2 / KPI達成112%）\n体温とKPIが共に高い「好循環」の状態です。「自律的に動ける」「挑戦できる」というボイスが多く、これは少人数体制での権限委譲の成功と、明確な目標設定が生み出した結果です。"
          },
          {
            id: "strategic-alignment",
            icon: <Shield className="w-5 h-5 text-teal" />,
            title: "組織方針との整合性チェック",
            subtitle: "Strategic Alignment Analysis",
            content: "現在の組織方針（v1.5）では「ユニットエコノミクス改善期」として「収益の質向上」を最優先としています。この方針と現場の現実を照らし合わせます。\n\n✅ 整合している点\n・マーケティング部の「量より質」への転換は、方針通りに機能しており、有効リードの質向上が営業現場でも好評価を得ています。\n・CS部の解約率改善（2.8%→3.2%）は、「能動的に動く」という方針が徐々に浸透しつつある兆候です。\n\n⚠️ 乖離が見られる点\n・営業部の属人化状態は、「自律駆動型組織への転換」という組織目標と正反対の状態です。特定一人への依存が、他メンバーの成長機会を奪っています。\n・開発部の「承認フロー3段階」は、方針に記載の「事務工数の排除」と矛盾しており、組織方針が現場に届いていないことが伺えます。\n\n📝 方針への提言\n次回の組織方針更新では、「営業プロセスの標準化」を明記し、属人化解消を組織全体の方針として位置づけることを推奨します。"
          },
          {
            id: "risks-opportunities",
            icon: <Rocket className="w-5 h-5 text-teal" />,
            title: "中長期リスクと成長機会",
            subtitle: "Mid-term Risks & Growth Opportunities",
            content: "■ リスク（放置した場合の予測）\n\n🚨 営業部の崩壊リスク：高\nトップ営業の体温が継続的に低下しており、このまま3ヶ月以内に离職リスクが約45%あります。その場合、月次売上の約40%（約1,680万円）のまかなう手段が失われます。\n\n⚠️ 開発部の生産性低下：中\n業務過多が改善されない場合、ベロシティはさらに10〜15%低下する可能性があります。リリース遅延が顧客体験に直結し、解約率を押し上げる可能性があります。\n\n■ 成長機会（テコ入れした場合の上振れ）\n\n🚀 マーケティングの成功パターン全社展開\nマーケティング部の「少人数×自律駆動×明確目標」という成功パターンを、営業部に展開できれば、全社の生産性を1.3倍に引き上げるポテンシャルがあります。\n\n💰 CS部のアップセルノウハウ活用\nCS部の既存顧客フォローノウハウをセールスイネーブルメントに変換できれば、平均客単価を現在の1.2倍に引き上げる可能性があります。"
          },
          {
            id: "actionable-insights",
            icon: <Lightbulb className="w-5 h-5 text-teal" />,
            title: "具体的提言：経営層が打つべき「次の一手」",
            subtitle: "Actionable Insights for Leadership",
            content: "① 【即日】営業部の属人化解消プロジェクトの発足\nトップ営業のナレッジを「商談フェーズ定義」「テンプレート化」「同行訓練」の3ステップで標準化する。期限3週間。これのみで離職リスクを大幅に低減できます。\n\n② 【1週間以内】承認フローの2段階への圧縮\nCEO直轄で、現在の3段階承認フローを2段階に圧縮。ボイスチェックで最も多くの部署から挙げられている「意思決定待ち」を解消し、開発部の体温回復に直結させます。\n\n③ 【今月中】マーケ×営業のリード品質基準の再定義\n現在の「有効リード」の定義を、営業現場の期待値と整合させる。BANTなどのスコアリング条件を実態に合わせてアップデートすることで、営業部の不満と無駄な工数を同時に削減できます。\n\n④ 【継続】部署間フィードバックループの制度化\n毎月のボイスチェック結果を、部署間で「読み合う」場を作る。現在の「他部署の状況が見えない」というサイロ化の解消が、中長期的な組織力の底上げに繋がります。"
          }
        ]}
      />
    </div>
  );
}
