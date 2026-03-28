"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Header } from "@/components/layout/Header";
import { MainInsightCard } from "@/components/dashboard/MainInsightCard";
import { TabBar } from "@/components/ui/TabBar";
import { Pills } from "@/components/ui/Pills";
import { DeepReport } from "@/components/dashboard/DeepReport";
import { ActionSection } from "@/components/dashboard/sections/ActionSection";
import { SemanticSection } from "@/components/dashboard/sections/SemanticSection";
import { SurveySection } from "@/components/dashboard/sections/SurveySection";
import { OrganizationSection } from "@/components/dashboard/sections/OrganizationSection";
import { KpiSection } from "@/components/dashboard/sections/KpiSection";
import { MatrixSection } from "@/components/dashboard/sections/MatrixSection";
import { cn } from "@/lib/utils";
import { Target, Thermometer, Shield, Rocket, Lightbulb } from "lucide-react";
import { DEFAULT_SURVEY_QUESTIONS, DEFAULT_SEMANTIC_POLICY } from "@/lib/constants";
import { normalizeMonth, getLastNMonths, getMonthLabels, getFullMonthLabels } from "@/lib/utils/date";
import { useCompany } from "@/hooks/useCompany";
import { Loading, LoadingCard } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";

const questions = DEFAULT_SURVEY_QUESTIONS;
// TODO: DBから取得するように変更するが、現時点では空配列
const actions: any[] = [];

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<string>("all");
  const [sec, setSec] = useState("matrix");
  const [matView, setMatView] = useState("dept");
  const [selKpi, setSelKpi] = useState("mrr");
  const [orgView, setOrgView] = useState("dept");
  const [month, setMonth] = useState("default");
  const [showDeepReport, setShowDeepReport] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { company, loading: authLoading, supabase } = useCompany();

  const [realDepts, setRealDepts] = useState<any[]>([]);
  const [realKpis, setRealKpis] = useState<any[]>([]);
  const [realSem, setRealSem] = useState<string>("");
  const [realSemHistory, setRealSemHistory] = useState<any[]>([]);
  const [realResponses, setRealResponses] = useState<any[]>([]);
  const [realAxes, setRealAxes] = useState<any[]>([]);
  const [realKpiRecords, setRealKpiRecords] = useState<any[]>([]);
  const [realResources, setRealResources] = useState<any[]>([]);
  const [realAiInsights, setRealAiInsights] = useState<any[]>([]);
  const [realActionItems, setRealActionItems] = useState<any[]>([]);

  const last13Months = useMemo(() => getLastNMonths(13), []);
  const monthLabels = useMemo(() => getMonthLabels(last13Months), [last13Months]);
  const fullMonthLabels = useMemo(() => getFullMonthLabels(last13Months), [last13Months]);

  useEffect(() => {
    async function loadData() {
      if (!company) return;

      const [d, k, s, r, a, recs, resources, ai, act] = await Promise.all([
        supabase.from('departments').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
        supabase.from('kpi_definitions').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
        supabase.from('semantic_layers').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
        supabase.from('survey_responses').select('*, survey_answers(*)').eq('company_id', company.id),
        supabase.from('kpi_axes').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
        supabase.from('kpi_records').select('*').in('recorded_month', last13Months),
        supabase.from('resource_records').select('*').in('recorded_month', last13Months),
        supabase.from('ai_insights').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('action_items').select('*').eq('company_id', company.id).eq('is_archived', false).order('created_at', { ascending: false })
      ]);

      if (d.data) setRealDepts(d.data);
      if (recs.data) setRealKpiRecords(recs.data);
      if (resources.data) setRealResources(resources.data);
      if (ai.data) setRealAiInsights(ai.data);
      if (act.data) setRealActionItems(act.data);

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

      if (s.data && s.data.length > 0) {
        setRealSem(s.data[0].content);
        setRealSemHistory(s.data);
      }
      if (r.data) setRealResponses(r.data);
      if (a.data) setRealAxes(a.data);
    }
    loadData();
  }, [company, last13Months, supabase]);

  const latestAi = realAiInsights[0];
  const aiContent = latestAi?.content;

  const currentSurveyData = useMemo(() => {
    let filtered = realResponses;
    let viewName = "全社";
    let targetHeadcount = realDepts.reduce((sum: number, d: any) => sum + (d.headcount || 0), 0);

    const surveyViewId = (orgView === "product" || orgView === "dept" || orgView === "all") ? "all" : orgView;

    if (surveyViewId !== "all") {
      const dept = realDepts.find(d => d.id === surveyViewId);
      const axis = realAxes.find(a => a.id === surveyViewId);
      viewName = dept ? dept.name : (axis ? axis.name : "不明なターゲット");
      filtered = realResponses.filter(r => r.department_id === surveyViewId || r.axis_id === surveyViewId);
      targetHeadcount = dept ? (dept.headcount || 0) : (axis ? (axis.headcount || 0) : 0);
    }

    const latestMonth = last13Months[12];
    const prevMonth = last13Months[11];
    
    const latestResponses = filtered.filter(r => normalizeMonth(r.recorded_month) === latestMonth);
    const latestAnswers = latestResponses.flatMap(r => r.survey_answers || []);

    const responseCount = latestResponses.length;
    const responseRate = targetHeadcount > 0 ? Math.round((responseCount / targetHeadcount) * 100) : 0;

    // question_id の UUID vs 整数不一致を回避するため、インデックスベースで設問別スコアを集計
    const qScores = questions.map((_, qi) => {
      const scoresForQ: number[] = [];
      latestResponses.forEach(r => {
        const ans = r.survey_answers || [];
        if (ans[qi]) scoresForQ.push(ans[qi].score);
      });
      if (scoresForQ.length === 0) return 0;
      return scoresForQ.reduce((sum: number, s: number) => sum + s, 0) / scoresForQ.length;
    });

    const prevQScores = questions.map((_, qi) => {
      const scoresForQ: number[] = [];
      filtered
        .filter(r => normalizeMonth(r.recorded_month) === prevMonth)
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

    let comment = aiContent?.summary || "回答データが蓄積されていません。";
    if (!aiContent && avgPulse > 0) {
      const lowScoreQ = qScores.map((s, i) => ({ s, i })).filter(x => x.s > 0 && x.s < 3.0).sort((a, b) => a.s - b.s)[0];
      if (lowScoreQ) {
        comment = `${questions[lowScoreQ.i].text} のスコアが低迷しています。環境改善の検討が必要です。`;
      } else {
        comment = "全体的に良好な体温が維持されています。";
      }
    }

    return { viewName, scores: qScores, prevScores: prevQScores, pulse: avgPulse, pulseHistory, aiComment: comment, responseCount, responseRate };
  }, [orgView, realResponses, realDepts, realAxes, last13Months, aiContent]);


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
      const respondentsCount = deptResponses.filter(r => normalizeMonth(r.recorded_month) === latestMonth).length;

      return {
        id: d.id,
        name: d.name,
        head: `${activeHead} / ${d.headcount || 0}`,
        respondentsCount,
        masterHeadcount: d.headcount || 0,
        headHistory,
        productivity: 150,
        pulse: Number(pulseScore.toFixed(1)),
        pulseHistory,
        weather: pulseWeather,
        arrow: "flat",
        kpiAch: (() => {
          const mKpis = realKpis.filter(k => k.owner_dept_id === d.id);
          const mRecs = realKpiRecords.filter(r => r.recorded_month === last13Months[12]);
          let totalAch = 0;
          let count = 0;
          mKpis.forEach(def => {
            const rec = mRecs.find(r => r.kpi_definition_id === def.id && r.axis_id === null);
            if (rec && rec.target_value > 0) {
              totalAch += (rec.value / rec.target_value) * 100;
              count++;
            }
          });
          return count > 0 ? Math.round(totalAch / count) : 0;
        })(),
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
      targetHistory: k.targetHistory || [], // 追加
      yoy: (() => {
        const history = k.prev || [];
        const currentVal = Number(history[12]);
        const prevVal = Number(history[0]);
        if (history.length >= 13 && !isNaN(currentVal) && !isNaN(prevVal) && prevVal > 0) {
          return Math.round((currentVal / prevVal) * 100);
        }
        return null;
      })()
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
        respondentsCount: activeHead,
        masterHeadcount: axis.headcount || 0,
        headHistory,
        xAxisHead: axis.headcount || 0,                 // 散布図のX軸用: 純粋な数値
        sizeValue: sizeValue,                          // 散布図のバブルサイズ用
        sizeHistory,
        productivity: 150,
        kpiAch: (() => {
          const mRecs = realKpiRecords.filter(r => r.recorded_month === last13Months[12] && r.axis_id === axis.id);
          let totalAch = 0;
          let count = 0;
          mRecs.forEach(rec => {
            if (rec.target_value > 0) {
              totalAch += (rec.value / rec.target_value) * 100;
              count++;
            }
          });
          return count > 0 ? Math.round(totalAch / count) : 0;
        })(),
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

  const displaySem = realSem || DEFAULT_SEMANTIC_POLICY;

  // 部署連動のインサイトを動的に生成
  const deptTabs = useMemo(() => [
    { id: "all", label: "全社" },
    ...realDepts.map((d, i) => ({ id: d.id, label: d.name }))
  ], [realDepts]);

  const ins = useMemo(() => {
    const pulse = currentSurveyData.pulse;
    const prevPulse = currentSurveyData.pulseHistory[11] || 0;
    const weather = pulse >= 4.0 ? "sun" : pulse >= 3.0 ? "cloud" : pulse > 0 ? "rain" : "cloud";
    const trend = pulse > prevPulse ? "up" : pulse < prevPulse ? "down" : "flat";

    if (tab === "all") {
      return {
        icon: "",
        title: "全社",
        tone: "戦略的分析",
        text: aiContent?.summary || (currentSurveyData.pulse > 0 ? currentSurveyData.aiComment : "組織方針に基づき、各部署の体温スコアとKPI達成状況を俯瞰的に分析します。現在、実データの蓄積を開始した段階です。"),
        weather,
        trend
      };
    }
    const deptIdx = realDepts.findIndex(d => d.id === tab);
    const dept = realDepts[deptIdx];
    if (!dept) return { icon: "", title: "全社", tone: "戦略的分析", text: "", weather, trend };
    
    // AIインサイトの反映
    const deptInsight = aiContent?.insights_by_dept?.[dept.id];
    
    return {
      icon: "",
      title: dept.name,
      tone: deptInsight?.tone || ["前向き・行動喚起", "冷静・品質重視", "共感・伴走", "構造的・警告的"][deptIdx % 4],
      text: deptInsight?.text || `「${dept.name}」の直近の体温とKPI達成状況に基づく分析です。AIによる分析を実行すると専用の診断テキストが表示されます。`,
      weather,
      trend
    };
  }, [tab, realDepts, currentSurveyData, aiContent]);

  const selectedKpiDef = displayKpis.find(k => k.id === selKpi) || displayKpis[0];
  const achRate = (() => {
    if (!selectedKpiDef || !selectedKpiDef.target) return null;
    const v = Number(selectedKpiDef.val);
    const t = Number(selectedKpiDef.target);
    if (isNaN(v) || isNaN(t) || t <= 0) return 0;
    return Math.round((v / t) * 100);
  })();

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
      let kpiAch = d.kpiAch;
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

  const handleRunAnalyze = async () => {
    if (!company) return;
    try {
      setIsAnalyzing(true);
      const res = await fetch('/api/ai/analyze', { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        // データの再取得
        const { data: newAi } = await supabase.from('ai_insights').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(1);
        const { data: newAct } = await supabase.from('action_items').select('*').eq('company_id', company.id).eq('is_archived', false).order('created_at', { ascending: false });
        if (newAi) setRealAiInsights(newAi);
        if (newAct) setRealActionItems(newAct);
        alert("AI分析が完了しました。");
      } else {
        alert("AI分析に失敗しました: " + result.error);
      }
    } catch (err) {
      console.error("AI分析実行エラー:", err);
      alert("AI分析の実行中にエラーが発生しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveSemantic = async (txt: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: comp } = await supabase.from('users').select('company_id').eq('id', user.id).single();
    if (!comp?.company_id) return;

    const { data: newSem, error: semErr } = await supabase.from('semantic_layers').insert({
      company_id: comp.company_id,
      content: txt,
      valid_from: new Date().toISOString()
    }).select('*').single();

    if (!semErr && newSem) {
      setRealSem(txt);
      setRealSemHistory(prev => [newSem, ...prev]);
    }
  };

  const handleDeleteSemantic = async (id: string) => {
    const backup = [...realSemHistory];
    setRealSemHistory(prev => prev.filter(h => h.id !== id));

    try {
      const res = await fetch(`/api/semantic-layers?id=${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();

      if (!res.ok) {
        console.error('[SemanticLayer] 削除失敗:', result);
        alert(`削除に失敗しました: ${result.error || '不明なエラー'}`);
        setRealSemHistory(backup);
        return;
      }

      if (result.history) {
        setRealSemHistory(result.history);
      }
    } catch (err) {
      console.error('[SemanticLayer] 削除例外:', err);
      alert('削除中にエラーが発生しました');
      setRealSemHistory(backup);
    }
  };

  // サイズ用KPIの名称を取得
  const sizeKpiName = useMemo(() => {
    if (matView === "dept") return "KPI達成率";
    const kpiDef = realKpis.find(k => k.id === company?.secondary_axis_size_kpi_id);
    return kpiDef ? kpiDef.name : "MRRの大きさ"; // フォールバック
  }, [matView, company, realKpis]);

  if (authLoading) {
    return <Loading fullScreen message="データを準備しています..." />;
  }

  if (!company) {
    return null; // useCompany側でリダイレクトされる
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-8">
        {/* Main AI Insight */}
        <div className="space-y-4">
          <MainInsightCard
            title={ins.title}
            tone={ins.tone}
            text={ins.text}
            weather={ins.weather as any}
            trend={ins.trend as any}
            onOpenDeepReport={tab === "all" ? () => setShowDeepReport(true) : undefined}
          />

          {tab === "all" && (
            <div className="flex justify-end">
              <button
                onClick={handleRunAnalyze}
                disabled={isAnalyzing}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all",
                  isAnalyzing 
                    ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                    : "bg-white text-teal border-teal/20 hover:bg-teal/5 hover:border-teal/30 shadow-sm"
                )}
              >
                {isAnalyzing ? "分析を生成中..." : "最新の分析を生成"}
                {!isAnalyzing && <Rocket className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* 部署別AI方針翻訳プレビュー（部署タブ選択時のみ表示） */}
          {tab !== "all" && (() => {
            const deptIdx = realDepts.findIndex(d => d.id === tab);
            const dept = realDepts[deptIdx];
            if (!dept) return null;
            return (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <h5 className="text-xs font-bold text-slate-700">AI方針翻訳 — {dept.name}</h5>
                  <span className="text-[9px] text-white font-bold px-2 py-0.5 bg-teal/80 rounded-full">最新の通知</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  ※現在AIエンジン未接続です。フェーズ7以降、ここに「{dept.name}」の直近のコンディション（体温）と全社方針を掛け合わせた、専用の翻訳メッセージが毎月自動生成されます。
                </p>
              </div>
            );
          })()}

          <TabBar
            tabs={deptTabs}
            active={tab}
            onChange={setTab}
          />
        </div>

        {/* Section Navigation */}
        <Pills
          items={[
            { id: "matrix", label: "マトリックス" },
            { id: "kpi", label: "KPI推移" },
            { id: "org", label: "組織のKPI" },
            { id: "survey", label: "組織の体温" },
            { id: "action", label: "アクション" },
            { id: "semantic", label: "組織方針" }
          ]}
          active={sec}
          onChange={setSec}
        />

        {/* Content Sections */}
        <div className="animate-fadeIn">
          {sec === "matrix" && (
            <MatrixSection
              secondaryAxisName={secondaryAxisName}
              sizeKpiName={sizeKpiName}
              matView={matView}
              setMatView={setMatView}
              month={month}
              setMonth={setMonth}
              currentMatData={currentMatData}
              aiContent={aiContent}
            />
          )}

          {sec === "kpi" && (
            <KpiSection
              displayKpis={displayKpis}
              selKpi={selKpi}
              setSelKpi={setSelKpi}
              selectedKpiDef={selectedKpiDef}
              achRate={achRate}
              monthLabels={monthLabels}
              fullMonthLabels={fullMonthLabels}
            />
          )}

          {sec === "org" && (
            <OrganizationSection
              secondaryAxisName={secondaryAxisName}
              orgView={orgView}
              setOrgView={setOrgView}
              displayDepts={displayDepts}
              displayAxes={displayAxes}
              aiContent={aiContent}
            />
          )}

          {sec === "survey" && (
            <SurveySection
              data={currentSurveyData}
              secondaryAxisName={secondaryAxisName}
              matView={matView}
              setMatView={setMatView}
              realDepts={realDepts}
              realAxes={realAxes}
              orgView={orgView}
              setOrgView={setOrgView}
              monthLabels={monthLabels}
              questions={questions}
            />
          )}

          {sec === "action" && (
            <ActionSection actions={realActionItems} depts={realDepts} />
          )}

          {sec === "semantic" && (
            <SemanticSection
              displaySem={displaySem}
              realSemHistory={realSemHistory}
              realDepts={realDepts}
              actions={actions}
              onSave={handleSaveSemantic}
              onDelete={handleDeleteSemantic}
              aiContent={aiContent}
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

      {/* Deep Report Modal */}
      <DeepReport
        isOpen={showDeepReport}
        onClose={() => setShowDeepReport(false)}
        generatedAt={latestAi ? new Date(latestAi.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : ""}
        sections={[
          {
            id: "executive-summary",
            icon: <Target className="w-5 h-5 text-teal" />,
            title: "総評：組織の健全性と戦略進捗",
            subtitle: "Executive Summary",
            content: aiContent?.deep_report?.executive_summary || "データに基づいた総評を生成するには、最新の分析を実行してください。"
          },
          {
            id: "correlation",
            icon: <Thermometer className="w-5 h-5 text-teal" />,
            title: "組織力とKPIの相関解析",
            subtitle: "Organizational Health × KPI Correlation",
            content: aiContent?.deep_report?.correlation || "組織体温とKPI達成率の相関分析データがありません。"
          },
          {
            id: "strategic-alignment",
            icon: <Shield className="w-5 h-5 text-teal" />,
            title: "組織方針との整合性チェック",
            subtitle: "Strategic Alignment Analysis",
            content: aiContent?.deep_report?.strategic_alignment || "組織方針（Semantic Layer）との整合性分析データがありません。"
          },
          {
            id: "risks-opportunities",
            icon: <Rocket className="w-5 h-5 text-teal" />,
            title: "中長期リスクと成長機会",
            subtitle: "Mid-term Risks & Growth Opportunities",
            content: aiContent?.deep_report?.risks || "データに基づいたリスク・機会の分析がありません。"
          }
        ]}
      />
    </div>
  );
}

