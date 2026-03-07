"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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

const insights = {
  exec: { icon: "👔", title: "経営層", tone: "戦略的分析", text: "組織方針に基づき、各部署の体温スコアとKPI達成状況を俯瞰的に分析します。現在、実データの蓄積を開始した段階です。" },
  admin: { icon: "📋", title: "経企・人事", tone: "構造分析", text: "全部署のコンディションを横断的にモニタリングします。データ不足箇所は早急なアクションが必要です。" },
  mgr: { icon: "🎯", title: "マネージャー", tone: "現場支援", text: "担当部署のボイスチェックに基づき、現場メンバーの心理的安全性と生産性の両立を支援します。" },
  player: { icon: "💪", title: "現場", tone: "前向きな共有", text: "SignsAIを通じて現場の今の声を可視化し、より良い働き方の実現に向けたフィードバックを行います。" }
};

const actions: any[] = [];

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
  const router = useRouter();
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
  const [company, setCompany] = useState<any>(null);
  const [realKpiRecords, setRealKpiRecords] = useState<any[]>([]);
  const [realResources, setRealResources] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: comp } = await supabase.from('users').select('company_id').eq('id', user.id).single();
      if (!comp?.company_id) {
        router.push("/onboarding");
        return;
      }

      const [d, k, s, r, a, recs, resources] = await Promise.all([
        supabase.from('departments').select('*').eq('company_id', comp.company_id).order('created_at', { ascending: true }),
        supabase.from('kpi_definitions').select('*').eq('company_id', comp.company_id).order('sort_order', { ascending: true }),
        supabase.from('semantic_layers').select('content').eq('company_id', comp.company_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('survey_responses').select('*, survey_answers(*)').eq('company_id', comp.company_id),
        supabase.from('kpi_axes').select('*').eq('company_id', comp.company_id).order('sort_order', { ascending: true }),
        supabase.from('kpi_records').select('*').in('recorded_month', last13Months),
        supabase.from('resource_records').select('*').in('recorded_month', last13Months)
      ]);

      if (d.data && d.data.length > 0) setRealDepts(d.data);
      if (recs.data) setRealKpiRecords(recs.data);
      if (resources.data) setRealResources(resources.data);

      // KPI定義に最新の実績・目標と推移をマージ
      if (k.data && k.data.length > 0) {
        const latestMonth = last13Months[12];
        const mergedKpis = k.data.map(def => {
          const records = (recs.data || []).filter(rec => rec.kpi_definition_id === def.id && rec.axis_id === null);
          const latest = records.find(rec => normalizeMonth(rec.recorded_month) === latestMonth);

          // 過去13ヶ月の推移配列を作成
          const history = last13Months.map(m => {
            const r = records.find(rec => normalizeMonth(rec.recorded_month) === m);
            return r ? r.value : 0;
          });

          // 過去13ヶ月の目標値履歴
          const targetHistory = last13Months.map(m => {
            const r = records.find(rec => normalizeMonth(rec.recorded_month) === m);
            return r ? r.target_value : (def.target_default ?? 0);
          });

          return {
            ...def,
            val: latest ? latest.value : (def.val ?? 0),
            target_value: latest ? latest.target_value : (def.target_default ?? 0),
            prev: history,
            targetHistory // 追加
          };
        });
        setRealKpis(mergedKpis);
      }

      if (s.data?.content) setRealSem(s.data.content);
      if (r.data) setRealResponses(r.data);
      if (a.data) setRealAxes(a.data);

      const { data: compInfo } = await supabase.from('companies').select('*').eq('id', comp.company_id).single();
      if (compInfo) setCompany(compInfo);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recorded_month の形式を YYYY-MM-DD に統一する（YYYY-MM 形式も受け入れる）
  const normalizeMonth = (m: string): string => {
    if (!m) return m;
    // YYYY-MM 形式を YYYY-MM-01 に変換
    if (/^\d{4}-\d{2}$/.test(m)) return `${m}-01`;
    return m;
  };

  const last13Months = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
    }
    return dates;
  }, []);

  const monthLabels = useMemo(() => {
    return last13Months.map(m => {
      const mm = m.split("-")[1];
      return `${parseInt(mm)}月`;
    });
  }, [last13Months]);

  const fullMonthLabels = useMemo(() => {
    return last13Months.map(m => {
      const parts = m.split("-");
      return `${parts[0]}年${parseInt(parts[1])}月`;
    });
  }, [last13Months]);

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

    const latestMonth = last13Months[12];
    const latestAnswers = filtered
      .filter(r => normalizeMonth(r.recorded_month) === latestMonth)
      .flatMap(r => r.survey_answers || []);

    // question_id の UUID vs 整数不一致を回避するため、インデックスベースで設問別スコアを集計
    const qScores = questions.map((_, qi) => {
      const scoresForQ: number[] = [];
      filtered
        .filter(r => normalizeMonth(r.recorded_month) === latestMonth)
        .forEach(r => {
          const ans = r.survey_answers || [];
          if (ans[qi]) scoresForQ.push(ans[qi].score);
        });
      if (scoresForQ.length === 0) return 0;
      return scoresForQ.reduce((sum: number, s: number) => sum + s, 0) / scoresForQ.length;
    });

    const avgPulse = latestAnswers.length > 0
      ? latestAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / latestAnswers.length
      : 0;

    const pulseHistory = last13Months.map(month => {
      const monthAnswers = filtered
        .filter(r => normalizeMonth(r.recorded_month) === month)
        .flatMap(r => r.survey_answers || []);
      if (monthAnswers.length === 0) return 0;
      return monthAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / monthAnswers.length;
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
  }, [orgView, realResponses, realDepts, last13Months]);

  const displayDepts = useMemo(() => {
    return realDepts.map((d, i) => {
      // 実データから体温を集計 (最新月)
      const latestMonth = last13Months[12];
      const deptResponses = realResponses.filter(r => r.department_id === d.id);
      const latestAnswers = deptResponses
        .filter(r => normalizeMonth(r.recorded_month) === latestMonth)
        .flatMap(r => r.survey_answers || []);

      const pulseScore = latestAnswers.length > 0
        ? latestAnswers.reduce((sum, a) => sum + a.score, 0) / latestAnswers.length
        : 0; // データがなければ 0 (モックを排除)

      // 過去13ヶ月の推移
      const pulseHistory = last13Months.map(month => {
        const monthAnswers = deptResponses
          .filter(r => normalizeMonth(r.recorded_month) === month)
          .flatMap(r => r.survey_answers || []);
        if (monthAnswers.length === 0) return 0; // データなければ 0
        return monthAnswers.reduce((sum, a) => sum + a.score, 0) / monthAnswers.length;
      });

      const pulseWeather = pulseScore >= 4.0 ? "sun" : pulseScore >= 3.0 ? "cloud" : "rain";
      // 正式な人数推移 (resource_records)
      const headHistory = last13Months.map(month => {
        const res = realResources.find(rr => rr.department_id === d.id && normalizeMonth(rr.recorded_month) === month);
        return res ? res.head_count : 0;
      });

      const activeHead = headHistory[12];

      return {
        id: d.id,
        name: d.name,
        head: `${activeHead} / ${d.headcount || 0}`,
        headHistory,
        productivity: 150,
        pulse: Number(pulseScore.toFixed(1)),
        pulseHistory,
        weather: pulseWeather,
        arrow: "flat",
        kpiAch: 100, // マトリックス用の中立値
        // kpis は DB から取得した実データのみ（ダミーは連結しない）
        kpis: realKpis.filter(k => k.owner_dept_id === d.id)
          .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
          .map((k: any) => ({
            name: k.name,
            val: `${k.val ?? 0}${k.unit ?? ''}`,
            ach: (k.target_value && k.target_value > 0) ? Math.round((k.val / k.target_value) * 100) : 0,
            type: "stack"
          })).slice(0, 3),
        kpiName: realKpis.find(k => k.owner_dept_id === d.id && k.is_main)?.name ||
          realKpis.find(k => k.owner_dept_id === d.id)?.name ||
          "",
        // 動的な生産性計算（達成率 × 体温係数）
        productivityHistory: last13Months.map(month => {
          const mKpis = realKpis.filter(k => k.owner_dept_id === d.id);
          const mRecs = realKpiRecords.filter(r => r.recorded_month === month);

          let totalAch = 0;
          let count = 0;
          mKpis.forEach(def => {
            const rec = mRecs.find(r => r.kpi_definition_id === def.id && r.axis_id === null);
            if (rec && rec.target_value > 0) {
              totalAch += (rec.value / rec.target_value) * 100;
              count++;
            }
          });
          const avgAch = count > 0 ? totalAch / count : 100;
          const monthPulse = pulseHistory[last13Months.indexOf(month)] || 0;
          const pulseFactor = monthPulse > 0 ? (monthPulse / 3.0) : 1.0;
          return Math.round(avgAch * pulseFactor);
        })
      };
    });
  }, [realDepts, realResponses, last13Months, realKpis, realKpiRecords]);

  const displayKpis = realKpis.length > 0 ? realKpis.map((k, i) => {
    return {
      ...k,
      id: `kpi_${k.id}`,
      name: k.name,
      unit: k.unit,
      target: k.target_value || 0,
      val: k.val || 0,
      dept: realDepts.find(d => d.id === k.owner_department_id)?.name || "",
      voices: [],
      prev: k.prev || [], // historyデータを保持
      targetHistory: k.targetHistory || [] // 追加
    };
  }) : [];

  const displayAxes = useMemo(() => {
    return realAxes.map((axis, i) => {
      const latestMonth = last13Months[12];
      const axisResponses = realResponses.filter(r => r.axis_id === axis.id);
      const latestAnswers = axisResponses
        .filter(r => normalizeMonth(r.recorded_month) === latestMonth)
        .flatMap(r => r.survey_answers || []);

      const pulseScore = latestAnswers.length > 0
        ? latestAnswers.reduce((sum, a) => sum + a.score, 0) / latestAnswers.length
        : 0;

      const pulseHistory = last13Months.map(month => {
        const monthAnswers = axisResponses
          .filter(r => normalizeMonth(r.recorded_month) === month)
          .flatMap(r => r.survey_answers || []);
        if (monthAnswers.length === 0) return 0; // データなければ 0
        return monthAnswers.reduce((sum, a) => sum + a.score, 0) / monthAnswers.length;
      });

      const activeHead = axisResponses.filter(r => normalizeMonth(r.recorded_month) === latestMonth).length;

      // サイズ用KPIの履歴を抽出
      const sizeHistory = last13Months.map(month => {
        if (!company?.secondary_axis_size_kpi_id) return 0;
        const sizeRec = realKpiRecords.find(rec =>
          rec.axis_id === axis.id &&
          rec.kpi_definition_id === company.secondary_axis_size_kpi_id &&
          normalizeMonth(rec.recorded_month) === month
        );
        return sizeRec ? sizeRec.value : 0;
      });

      // 各月の人数履歴 (resource_records)
      const headHistory = last13Months.map(month => {
        const res = realResources.find(rr => rr.axis_id === axis.id && normalizeMonth(rr.recorded_month) === month);
        return res ? res.head_count : 0;
      });

      // 最新のsizeValue
      const sizeValue = sizeHistory[12];

      return {
        ...(axis as any),
        id: axis.id,
        name: axis.name,
        head: `${activeHead} / ${axis.headcount || 0}`, // 表示用: "回答/所属"
        headHistory,
        xAxisHead: axis.headcount || 0,                 // 散布図のX軸用: 純粋な数値
        sizeValue: sizeValue,                          // 散布図のバブルサイズ用
        sizeHistory,
        productivity: 150,
        kpiAch: 100,
        mrr: sizeValue, // 互換性のために mrr にも入れる（後で ScatterPlot を修正）
        pulse: Number(pulseScore.toFixed(1)),
        pulseHistory,
        weather: pulseScore >= 4.0 ? "sun" : pulseScore >= 3.0 ? "cloud" : "rain",
        arrow: "flat",
        kpis: realKpis.map(def => {
          const rec = realKpiRecords.find(r => r.kpi_definition_id === def.id && r.axis_id === axis.id && normalizeMonth(r.recorded_month) === latestMonth);
          if (!rec) return null;
          return {
            name: def.name,
            val: `${(rec.value || 0).toLocaleString()}${def.unit || ''}`,
            ach: (rec.target_value && rec.target_value > 0) ? Math.round((rec.value / rec.target_value) * 100) : 0,
            type: "stack"
          };
        }).filter(Boolean).slice(0, 3) as any[],
        productivityHistory: last13Months.map(month => {
          const mRecs = realKpiRecords.filter(r => r.recorded_month === month && r.axis_id === axis.id);
          let totalAch = 0;
          let count = 0;
          mRecs.forEach(rec => {
            if (rec.target_value > 0) {
              totalAch += (rec.value / rec.target_value) * 100;
              count++;
            }
          });
          const avgAch = count > 0 ? totalAch / count : 100;
          const monthPulse = pulseHistory[last13Months.indexOf(month)] || 0;
          const pulseFactor = monthPulse > 0 ? (monthPulse / 3.0) : 1.0;
          return Math.round(avgAch * pulseFactor);
        })
      };
    });
  }, [realAxes, realResponses, last13Months, company, realKpiRecords]);

  const displaySem = realSem || semTextDefault;

  const ins = insights[tab];
  const selectedKpiDef = displayKpis.find(k => k.id === selKpi) || displayKpis[0];
  const achRate = (selectedKpiDef && selectedKpiDef.target) ? Math.round((selectedKpiDef.val / selectedKpiDef.target) * 100) : null;

  const secondaryAxisName = company?.secondary_axis_name || "プロダクト";

  const currentMatData = useMemo(() => {
    const monthsMap: Record<string, number> = {
      "default": 12,
      "1m": 11,
      "3m": 9,
      "6m": 6,
      "12m": 0
    };
    const targetIdx = monthsMap[month] ?? 12;

    return (matView === "product" ? displayAxes : displayDepts).map(d => {
      // 履歴から該当月のデータを抽出
      // 履歴は 13ヶ月分 (0=12ヶ月前, 12=最新)
      const pulseAtMonth = d.pulseHistory?.[targetIdx] || 0;
      const headAtMonth = d.headHistory?.[targetIdx] || 0;
      const prodAtMonth = d.productivityHistory?.[targetIdx] || 100;
      const sizeAtMonth = (matView === "product" && d.sizeHistory) ? d.sizeHistory[targetIdx] : 100;

      let head = headAtMonth;
      // ヘッドカウント履歴が0（未回答月など）の場合は、定義マスタの人数を使用
      if (head === 0) {
        if (matView === "dept") {
          const deptDef = realDepts.find(rd => rd.id === d.id);
          head = deptDef?.headcount || 0;
        } else {
          head = d.xAxisHead || 0;
        }
      }

      let productivity = prodAtMonth;
      let pulse = pulseAtMonth || d.pulse;
      let kpiAch = matView === "dept" ? 100 : d.kpiAch;
      let mrr = sizeAtMonth;

      return {
        ...d,
        head,
        productivity,
        pulse,
        weather: pulse >= 4.0 ? "sun" : pulse >= 3.0 ? "cloud" : "rain",
        kpiAch,
        mrr,
        sizeValue: mrr
      };
    });
  }, [matView, month, displayAxes, displayDepts]);

  // サイズ用KPIの名称を取得
  const sizeKpiName = useMemo(() => {
    if (matView === "dept") return "KPI達成率";
    const kpiDef = realKpis.find(k => k.id === company?.secondary_axis_size_kpi_id);
    return kpiDef ? kpiDef.name : "MRRの大きさ"; // フォールバック
  }, [matView, company, realKpis]);

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
            { id: "org", label: `🏢 部署・${secondaryAxisName}` },
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
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight">部署 / {secondaryAxisName} マトリックス</h3>
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                        <div className="flex items-center gap-1">
                          <span>縦軸: 一人当たり生産性</span>
                          {/* ... (Question mark button) ... */}
                        </div>
                        <span>｜ 横軸: {matView === "product" ? "所属人数" : "リソース量"} ｜ 円サイズ: {sizeKpiName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <TabBar
                      tabs={[{ id: "dept", label: "部署別" }, { id: "product", label: `${secondaryAxisName}別` }]}
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
                        <button onClick={() => setMonth("12m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "12m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>1年前</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4">
                  <ScatterPlot
                    data={currentMatData}
                    isProduct={matView === "product"}
                    sizeKpiName={sizeKpiName}
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
                      ) : month === "6m" ? (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（6ヶ月前）】</strong> 全プロダクトが「PIONEER」「SCALE」領域にあり、理想的な状態です。プロダクトBも新体制直後で士気が高く（体温3.8）、高い生産性を発揮しています。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> その後プロダクトBは無理な増員でコミュニケーションパスが複雑化。現在は生産性が最下位レベルまで落ち込んでいます。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: プロダクトBへの強引な人員投下は、マネジメント体制の崩壊とKPI未達という最悪の結果を招きました。</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（1年前）】</strong> 創業以来の急成長期。プロダクトC（当時はβ版）が少人数ながら驚異的な一人当たり生産性を記録し始め、全社の希望となっていました。プロダクトA・Bは中核事業として安定した基盤を築いていました。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> 1年を通じてプロダクトCは順調にスケールしましたが、プロダクトBは当時の「熱量」を維持できず、官僚化による停滞を招いています。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: 当時の「現場主導のスピード感」がどこで失われたのか、1年前のボイスを再確認し、原点回帰の施策を検討すべきです。</p>
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
                      ) : month === "6m" ? (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（6ヶ月前）】</strong> 営業部が極めて高い生産性を記録し、組織全体を牽引しています。しかし、人事データからはトップへの過度な依存による現場の負荷拡大の兆候が読み取れます。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> その後、営業部はPIONEERから「OVERWEIGHT」に向かって急落しています（人数増・生産性低下・体温2.1へ悪化）。典型的な「スケール時の壁」に直面しました。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: 当時の営業部の増員計画に伴う一時的な生産性の低下と、既存メンバーのケアにもっと注力すべきだったことが立証されました。</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p><strong>【過去の記録（1年前）】</strong> 組織全体が「少数精鋭」を体現していた時期。営業・開発ともに高い体温（4.0以上）を維持し、全社的にポジティブなフィードバックが飛び交っていました。部署間の壁も極めて薄い状態でした。</p>
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p><strong>【当時と現在を比較しての変化】</strong> 規模の拡大とともに、当時の「透明性」が損なわれ、各部署が自部門の最適化に走る（サイロ化）傾向が強まっています。</p>
                            <p className="text-slate-500 font-bold">👀 振り返り: 1年前の成功要因は「全員が顧客価値に集中できていたこと」にあります。現在の社内調整コストを極限まで削るアクションが必要です。</p>
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
              {displayKpis.length > 0 ? (
                <>
                  {/* KPI Summary Row */}
                  <div className="flex gap-2 overflow-x-auto pt-2 pb-2 mt-[-8px] scrollbar-hide">
                    {displayKpis.map(k => (
                      <KpiSummaryCard
                        key={k.id}
                        name={k.name}
                        value={(k.val || 0).toLocaleString()}
                        unit={k.unit}
                        isActive={selKpi === k.id}
                        onClick={() => setSelKpi(k.id)}
                      />
                    ))}
                  </div>

                  {/* Major Detail Block */}
                  {selectedKpiDef && (
                    <>
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
                              <span className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter">{(selectedKpiDef?.val || 0).toLocaleString()}</span>
                              <span className="text-lg font-bold text-slate-400">{selectedKpiDef?.unit}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">1年推移</div>
                          <div className="h-40 w-full">
                            <DetailLineChart
                              data={selectedKpiDef.prev || []}
                              targetData={selectedKpiDef.targetHistory || []}
                              labels={monthLabels}
                              fullLabels={fullMonthLabels}
                              unit={selectedKpiDef.unit}
                              color={(selectedKpiDef.prev && selectedKpiDef.prev.length >= 12 && selectedKpiDef.prev[11] >= (selectedKpiDef.prev[10] ?? 0)) ? "#10B981" : "#EF4444"}
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
                          {selectedKpiDef.voices?.length > 0 ? (
                            selectedKpiDef.voices.map((v: any, i: number) => {
                              const moodColor = v.mood === "sun" ? "bg-emerald-50/50 border-emerald-100" : v.mood === "rain" ? "bg-rose-50/50 border-rose-100" : "bg-amber-50/50 border-amber-100";
                              return (
                                <div key={i} className={`p-5 rounded-2xl border flex gap-4 transition-all hover:translate-x-1 ${moodColor}`}>
                                  <span className="text-xl shrink-0">{v.mood === "sun" ? "☀️" : v.mood === "cloud" ? "☁️" : "☔️"}</span>
                                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{v.text}</p>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center py-10 text-slate-400 text-sm italic">このKPIに関連するボイスはまだありません。</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm text-center space-y-4">
                  <div className="text-4xl">📈</div>
                  <h4 className="text-lg font-bold text-slate-800">KPIデータがありません</h4>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    設定画面から部署の重要指標(KPI)を登録することで、進捗と体温の相関を分析できるようになります。
                  </p>
                </div>
              )}
            </div>
          )}

          {sec === "org" && (
            <div className="space-y-6">
              <TabBar
                tabs={[{ id: "dept", label: "🏢 部署別" }, { id: "product", label: `📦 ${secondaryAxisName}別` }]}
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
                    <h3 className="text-sm font-bold text-slate-800">{secondaryAxisName}間の比較分析（AI）</h3>
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
