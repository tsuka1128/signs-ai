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
import { DEFAULT_SURVEY_QUESTIONS, DEPT_ICONS, DEFAULT_SEMANTIC_POLICY } from "@/lib/constants";
import { normalizeMonth, getLastNMonths, getMonthLabels, getFullMonthLabels } from "@/lib/utils/date";
import { useCompany } from "@/hooks/useCompany";

const questions = DEFAULT_SURVEY_QUESTIONS;
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

  const { company, loading: authLoading, supabase } = useCompany();

  const [realDepts, setRealDepts] = useState<any[]>([]);
  const [realKpis, setRealKpis] = useState<any[]>([]);
  const [realSem, setRealSem] = useState<string>("");
  const [realSemHistory, setRealSemHistory] = useState<any[]>([]);
  const [realResponses, setRealResponses] = useState<any[]>([]);
  const [realAxes, setRealAxes] = useState<any[]>([]);
  const [realKpiRecords, setRealKpiRecords] = useState<any[]>([]);
  const [realResources, setRealResources] = useState<any[]>([]);

  const last13Months = useMemo(() => getLastNMonths(13), []);
  const monthLabels = useMemo(() => getMonthLabels(last13Months), [last13Months]);
  const fullMonthLabels = useMemo(() => getFullMonthLabels(last13Months), [last13Months]);

  useEffect(() => {
    async function loadData() {
      if (!company) return;

      const [d, k, s, r, a, recs, resources] = await Promise.all([
        supabase.from('departments').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
        supabase.from('kpi_definitions').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
        supabase.from('semantic_layers').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
        supabase.from('survey_responses').select('*, survey_answers(*)').eq('company_id', company.id),
        supabase.from('kpi_axes').select('*').eq('company_id', company.id).order('sort_order', { ascending: true }),
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

      if (s.data && s.data.length > 0) {
        setRealSem(s.data[0].content);
        setRealSemHistory(s.data);
      }
      if (r.data) setRealResponses(r.data);
      if (a.data) setRealAxes(a.data);
    }
    loadData();
  }, [company, last13Months, supabase]);

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

    const surveyViewId = (orgView === "product" || orgView === "dept" || orgView === "all") ? "all" : orgView;

    if (surveyViewId !== "all") {
      const dept = realDepts.find(d => d.id === surveyViewId);
      const axis = realAxes.find(a => a.id === surveyViewId);
      viewName = dept ? dept.name : (axis ? axis.name : "不明なターゲット");
      filtered = realResponses.filter(r => r.department_id === surveyViewId || r.axis_id === surveyViewId);
    }

    const latestMonth = last13Months[12];
    const prevMonth = last13Months[11];
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

    let comment = "回答データが蓄積されていません。";
    if (avgPulse > 0) {
      const lowScoreQ = qScores.map((s, i) => ({ s, i })).filter(x => x.s > 0 && x.s < 3.0).sort((a, b) => a.s - b.s)[0];
      if (lowScoreQ) {
        comment = `${questions[lowScoreQ.i].text} のスコアが低迷しています。環境改善の検討が必要です。`;
      } else {
        comment = "全体的に良好な体温が維持されています。";
      }
    }

    return { viewName, scores: qScores, prevScores: prevQScores, pulse: avgPulse, pulseHistory, aiComment: comment };
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
    { id: "all", label: "🏢 全社" },
    ...realDepts.map((d, i) => ({ id: d.id, label: `${DEPT_ICONS[i % DEPT_ICONS.length]} ${d.name}` }))
  ], [realDepts]);

  const ins = useMemo(() => {
    if (tab === "all") {
      return {
        icon: "🏢",
        title: "全社",
        tone: "戦略的分析",
        text: "組織方針に基づき、各部署の体温スコアとKPI達成状況を俯瞰的に分析します。現在、実データの蓄積を開始した段階です。"
      };
    }
    const deptIdx = realDepts.findIndex(d => d.id === tab);
    const dept = realDepts[deptIdx];
    if (!dept) return { icon: "🏢", title: "全社", tone: "戦略的分析", text: "" };
    return {
      icon: DEPT_ICONS[deptIdx % DEPT_ICONS.length],
      title: dept.name,
      tone: ["前向き・行動喚起", "冷静・品質重視", "共感・伴走", "構造的・警告的"][deptIdx % 4],
      text: `「${dept.name}」の直近の体温とKPI達成状況に基づく分析です。AIエンジン接続後、ここに${dept.name}専用の診断テキストが自動生成されます。`
    };
  }, [tab, realDepts]);
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
            onOpenDeepReport={tab === "all" ? () => setShowDeepReport(true) : undefined}
          />

          {/* 部署別AI方針翻訳プレビュー（部署タブ選択時のみ表示） */}
          {tab !== "all" && (() => {
            const deptIdx = realDepts.findIndex(d => d.id === tab);
            const dept = realDepts[deptIdx];
            if (!dept) return null;
            return (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🤖</span>
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
            { id: "matrix", label: "📊 マトリックス" },
            { id: "kpi", label: "📈 KPI推移" },
            { id: "org", label: "🏢 組織のKPI" },
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
            <MatrixSection
              secondaryAxisName={secondaryAxisName}
              sizeKpiName={sizeKpiName}
              matView={matView}
              setMatView={setMatView}
              month={month}
              setMonth={setMonth}
              currentMatData={currentMatData}
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
            <ActionSection actions={actions} />
          )}

          {sec === "semantic" && (
            <SemanticSection
              displaySem={displaySem}
              realSemHistory={realSemHistory}
              realDepts={realDepts}
              onSave={handleSaveSemantic}
              onDelete={handleDeleteSemantic}
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
            content: "今月の組織全体は「売上は達成しているが、現場が身を削っている」状態です。\n\nKPI上は月次売上108%、有効リード112%と好調に見えますが、その裏側で営業部の体温は2.1、開発部は2.4と危険水域にあります。特に営業部は「トップ営業1人に全体の42%の売上が集中」という構造的な脆弱性を抱えており、この人物の離職・休職が発生した場合のインパクトは売上の40%減という極めて高いリスクです。\n\n一方、マーケティング部は体温4.2と全社で最も健全な状態を維持しており、「自律駆動型チーム」の理想的なモデルとなっています。この成功パターンの全社展開が、今後の組織改善の鍵となります。"
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
            content: "組織体温とKPI達成率の相関を分析した結果、以下の構造が見えてきます。\n\n■ 営業部（体温2.1 / KPI達成108%）\n「数字は出ているが、現場が悲鳴を上げている」典型的なパターンです。ボイスチェックでは「社内調整の多さ」「言いたいことが言えない」という声が突出しており、これは属人化された業務フローが「特定個人の忍耐」で回っていることを示しています。この状態が続くと、2〜3ヶ月以内にKPIの急落が発生する確率が高いと予測されます。\n\n■ 開発部（体温2.4 / KPI達成85%）\n体温とKPIが共に低迷する「消耗スパイラル」に陥っています。「意思決定待ち」が最大のボトルネックであり、承認フローの簡素化が生産性と体温の両方を改善するレバレッジポイントです。\n\n■ マーケティング部（体温4.2 / KPI達成112%）\n体温とKPIが共に高い「好循環」の状態です。「自律的に動ける」「挑戦できる」というボイスが多く、これは少人数体制での権限委譲の成功と、明確な目標設定が生み出した結果です。"
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
            content: "■ リスク（放置した場合の予測）\n\n🚨 営業部の崩壊リスク：高\nトップ営業の体温が継続的に低下しており、このまま3ヶ月以内に離職リスクが約45%あります。その場合、月次売上の約40%（約1,680万円）をまかなう手段が失われます。\n\n⚠️ 開発部の生産性低下：中\n業務過多が改善されない場合、ベロシティはさらに10〜15%低下する可能性があります。リリース遅延が顧客体験に直結し、解約率を押し上げる可能性があります。\n\n■ 成長機会（テコ入れした場合の上振れ）\n\n🚀 マーケティングの成功パターン全社展開\nマーケティング部の「少人数×自律駆動×明確目標」という成功パターンを、営業部に展開できれば、全社の生産性を1.3倍に引き上げるポテンシャルがあります。\n\n💰 CS部のアップセルノウハウ活用\nCS部の既存顧客フォローノウハウをセールスイネーブルメントに変換できれば、平均客単価を現在の1.2倍に引き上げる可能性があります。"
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
