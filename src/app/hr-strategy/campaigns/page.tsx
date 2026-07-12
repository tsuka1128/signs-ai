"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/hooks/useCompany";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { PlanGate } from "@/components/ui/PlanGate";
import { calculateCampaignRoi, CampaignRoiResult } from "@/lib/logic/campaign-roi";
import { HrCampaign } from "@/types/database";
import { toast } from "sonner";
import { calculateAchievementRate } from "@/lib/logic/kpi-engine";
import {
  Rocket,
  Plus,
  Trash2,
  Sliders,
  TrendingUp,
  LineChart,
  Calendar,
  AlertCircle,
  HelpCircle,
  FolderMinus,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Users,
  Compass,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils/index";
import { ScatterPlot } from "@/components/dashboard/ScatterPlot";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const CATEGORIES = [
  { id: "hiring", label: "採用 (Hiring)", color: "bg-teal-50 text-teal-600 border-teal-100" },
  { id: "placement", label: "配置・異動 (Placement)", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  { id: "system", label: "評価・制度 (System)", color: "bg-amber-50 text-amber-600 border-amber-100" },
  { id: "development", label: "育成・研修 (Development)", color: "bg-sky-50 text-sky-600 border-sky-100" },
  { id: "culture", label: "組織文化・エンゲージメント (Culture)", color: "bg-rose-50 text-rose-600 border-rose-100" },
  { id: "other", label: "その他 (Other)", color: "bg-slate-50 text-slate-600 border-slate-100" }
];

const formatNumberWithCommas = (value: string): string => {
  const clean = value.replace(/[^\d]/g, "");
  if (!clean) return "";
  return Number(clean).toLocaleString();
};

export default function HrCampaignsPage() {
  useDocumentTitle("施策キャンペーン");
  const router = useRouter();
  const { company, supabase, isImpersonating, userRole, userDepartmentId } = useCompany();
  const { state, derived } = useDashboardData(company, supabase, isImpersonating, userRole, userDepartmentId);
  const { canUse } = usePlanFeatures();

  const displayDepts = derived.displayDepts;
  const displayAxes = derived.displayAxes;
  const hasLaborData = displayDepts.some((d: any) => d.totalLaborCost > 0);

  // 13ヶ月日付リスト
  const last13Months = useMemo(() => {
    // useDashboardDataのリアル時系列と同期するために last13Months を生成
    const months = [];
    const now = new Date();
    // タイムゾーンや日付計算の不整合を防ぐため常に月初に設定
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 0; i < 13; i++) {
      months.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
      d.setMonth(d.getMonth() - 1);
    }
    return months;
  }, []);

  // 状態管理
  const [campaigns, setCampaigns] = useState<HrCampaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // 登録フォームの状態
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("culture");
  const [formScope, setFormScope] = useState("all"); // 'all' | 'dept:xxx' | 'axis:xxx'
  const [formLaunchedAt, setFormLaunchedAt] = useState(""); // YYYY-MM
  const [formInvestedCost, setFormInvestedCost] = useState("");
  const [formMemo, setFormMemo] = useState("");
  const [formTargetKpiId, setFormTargetKpiId] = useState("");

  // フォームクリア処理
  const clearForm = useCallback(() => {
    setFormTitle("");
    setFormCategory("culture");
    setFormScope("all");
    setFormLaunchedAt("");
    setFormInvestedCost("");
    setFormMemo("");
    setFormTargetKpiId("");
    setEditingId(null);
  }, []);

  const handleOpenAddModal = () => {
    clearForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (c: HrCampaign) => {
    setEditingId(c.id);
    setFormTitle(c.title);
    setFormCategory(c.category || "other");
    
    let scope = "all";
    if (c.department_id) {
      scope = `dept:${c.department_id}`;
    } else if (c.axis_id) {
      scope = `axis:${c.axis_id}`;
    }
    setFormScope(scope);
    setFormLaunchedAt(c.launched_at.slice(0, 7));
    setFormInvestedCost(c.invested_cost !== null ? formatNumberWithCommas(c.invested_cost.toString()) : "");
    setFormMemo(c.memo || "");
    setFormTargetKpiId(c.target_kpi_id || "");

    setShowAddModal(true);
  };

  // モーダルを閉じる（編集途中なら確認）。× とオーバーレイ両方から使用
  const handleCloseModal = useCallback(() => {
    const hasContent =
      editingId !== null ||
      formTitle.trim() !== "" ||
      formMemo.trim() !== "" ||
      formLaunchedAt !== "" ||
      formInvestedCost !== "" ||
      formTargetKpiId !== "";
    if (hasContent && !window.confirm("編集途中の内容があります。破棄して閉じますか？")) {
      return;
    }
    setShowAddModal(false);
    clearForm();
  }, [editingId, formTitle, formMemo, formLaunchedAt, formInvestedCost, formTargetKpiId, clearForm]);

  // 詳細画面での前提アサンプション調整用のローカル状態
  const [localLagMonths, setLocalLagMonths] = useState<number>(1);
  const [localWindowMonths, setLocalWindowMonths] = useState<number>(3);
  const [localSalesAttribution, setLocalSalesAttribution] = useState<number>(1.0);
  const [isAssumptionModified, setIsAssumptionModified] = useState(false);

  // アクセス制御 (経営層以外のロールはダッシュボードへ)
  const isAuthorized = useMemo(() => {
    return userRole === "super_admin" || userRole === "admin" || userRole === "executive";
  }, [userRole]);

  // データフェッチ
  const fetchCampaigns = useCallback(async () => {
    if (!company) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("hr_campaigns")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      if (data && data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error("施策データの取得に失敗しました:", err);
      toast.error("施策データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [company, supabase, selectedId]);

  useEffect(() => {
    if (company) {
      if (isAuthorized) {
        fetchCampaigns();
      } else {
        setIsLoading(false);
      }
    }
  }, [company, isAuthorized, fetchCampaigns]);

  // 一般ロールのリダイレクト処理
  useEffect(() => {
    if (company && !isLoading && !isAuthorized) {
      router.push("/");
    }
  }, [company, isLoading, isAuthorized, router]);

  // 選択されたキャンペーンのオブジェクト
  const selectedCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === selectedId) || null;
  }, [campaigns, selectedId]);

  // 選択キャンペーンのローカルアサンプション同期
  useEffect(() => {
    if (selectedCampaign) {
      const assumptions = (selectedCampaign.roi_assumptions as any) || {};
      setLocalLagMonths(typeof assumptions.lagMonths === "number" ? assumptions.lagMonths : 1);
      setLocalWindowMonths(typeof assumptions.windowMonths === "number" ? assumptions.windowMonths : 3);
      setLocalSalesAttribution(typeof assumptions.salesAttribution === "number" ? assumptions.salesAttribution : 1.0);
      setIsAssumptionModified(false);
    }
  }, [selectedCampaign]);

  // 調整したローカル状態を反映した一時キャンペーンROI結果
  const roiResult = useMemo(() => {
    if (!selectedCampaign || !company) return null;

    // ローカル仮定をオーバーライドしてライブ計算
    const tempCampaign: HrCampaign = {
      ...selectedCampaign,
      roi_assumptions: {
        lagMonths: localLagMonths,
        windowMonths: localWindowMonths,
        salesAttribution: localSalesAttribution
      } as any
    };

    return calculateCampaignRoi({
      campaign: tempCampaign,
      displayDepts,
      displayAxes,
      realResources: state.realResources,
      realKpiRecords: state.realKpiRecords,
      realKpis: state.realKpis,
      last13Months
    });
  }, [selectedCampaign, company, localLagMonths, localWindowMonths, localSalesAttribution, displayDepts, displayAxes, state, last13Months]);

  // 目報の特定KPIの Before/After/履歴 集約計算 (表示フォーカス専用)
  const targetKpiResult = useMemo(() => {
    if (!selectedCampaign || !selectedCampaign.target_kpi_id || !roiResult) return null;
    const targetKpiId = selectedCampaign.target_kpi_id;
    const kpiDef = state.realKpis.find(k => k.id === targetKpiId);
    if (!kpiDef) return null;

    const isHigherBetter = kpiDef.is_higher_better !== false;
    const isDept = !!selectedCampaign.department_id;
    const isAxis = !!selectedCampaign.axis_id;

    // 13ヶ月の月初日付に補正
    const months = roiResult.histories.months.map(m => m + "-01");

    // 対象のKPI実績
    const targetKpiAchFilled = months.map((month) => {
      let recs = state.realKpiRecords.filter(r => 
        r.kpi_definition_id === targetKpiId && 
        r.recorded_month.slice(0, 7) === month.slice(0, 7)
      );

      if (isDept) {
        recs = recs.filter(r => r.department_id === selectedCampaign.department_id);
      } else if (isAxis) {
        recs = recs.filter(r => r.axis_id === selectedCampaign.axis_id);
      }

      if (recs.length === 0) return 0;
      
      let sumAch = 0;
      let count = 0;
      recs.forEach(rec => {
        const ach = calculateAchievementRate(rec.value, rec.target_value, isHigherBetter);
        if (ach !== null) {
          sumAch += ach;
          count++;
        }
      });
      return count > 0 ? sumAch / count : 0;
    });

    // 対照群のKPI実績
    const controlKpiAchFilled = months.map((month) => {
      let recs = state.realKpiRecords.filter(r => 
        r.kpi_definition_id === targetKpiId && 
        r.recorded_month.slice(0, 7) === month.slice(0, 7)
      );

      if (isDept) {
        recs = recs.filter(r => r.department_id !== selectedCampaign.department_id);
      } else if (isAxis) {
        recs = recs.filter(r => r.axis_id !== selectedCampaign.axis_id);
      } else {
        return 0; // 全社は対照群なし
      }

      if (recs.length === 0) return 0;
      
      let sumAch = 0;
      let count = 0;
      recs.forEach(rec => {
        const ach = calculateAchievementRate(rec.value, rec.target_value, isHigherBetter);
        if (ach !== null) {
          sumAch += ach;
          count++;
        }
      });
      return count > 0 ? sumAch / count : 0;
    });

    // 平均値計算用のインデックス範囲
    const beforeRange = roiResult.launchIdx >= localWindowMonths 
      ? Array.from({ length: localWindowMonths }, (_, i) => roiResult.launchIdx - localWindowMonths + i) 
      : [];
    const afterRange = roiResult.launchIdx !== -1 && roiResult.launchIdx + localLagMonths <= 12 
      ? Array.from({ length: roiResult.effectMonths }, (_, i) => roiResult.launchIdx + localLagMonths + i) 
      : [];

    const getAvg = (arr: number[], range: number[]) => {
      if (range.length === 0) return 0;
      return range.reduce((s, idx) => s + (arr[idx] ?? 0), 0) / range.length;
    };

    const beforeVal = getAvg(targetKpiAchFilled, beforeRange);
    const afterVal = getAvg(targetKpiAchFilled, afterRange);
    const diffVal = afterVal - beforeVal;

    const controlBefore = getAvg(controlKpiAchFilled, beforeRange);
    const controlAfter = getAvg(controlKpiAchFilled, afterRange);
    const controlDiff = controlAfter - controlBefore;

    const hasControl = isDept || isAxis;
    const netDiffVal = hasControl ? diffVal - controlDiff : diffVal;

    return {
      kpiName: kpiDef.name,
      before: Math.round(beforeVal * 10) / 10,
      after: Math.round(afterVal * 10) / 10,
      diff: Math.round(diffVal * 10) / 10,
      netDiff: Math.round(netDiffVal * 10) / 10,
      history: targetKpiAchFilled,
      isHigherBetter
    };
  }, [selectedCampaign, roiResult, state.realKpis, state.realKpiRecords, localWindowMonths, localLagMonths]);

  // モーダル内で選択可能なKPIリストの絞り込み (対象スコープに存在するKPI定義のみ)
  // SignsAIに登録されたKPI全件を選択肢にする（スコープで絞り込まない。
  // 絞り込むと保存済みKPIが一覧に無く、編集時にプリフィルが「未選択」表示になるため）
  const availableKpis = useMemo(() => {
    if (!company) return [];
    return state.realKpis;
  }, [company, state.realKpis]);

  // 全キャンペーンのROI計算結果（一覧表示用、保存されたDBデータ基準）
  const campaignsWithRoi = useMemo(() => {
    if (!company) return [];
    return campaigns.map((c) => {
      const result = calculateCampaignRoi({
        campaign: c,
        displayDepts,
        displayAxes,
        realResources: state.realResources,
        realKpiRecords: state.realKpiRecords,
        realKpis: state.realKpis,
        last13Months
      });
      return { campaign: c, roi: result };
    });
  }, [campaigns, company, displayDepts, displayAxes, state, last13Months]);

  // 表示用キャンペーン（アーカイブ非表示対応）
  const filteredCampaigns = useMemo(() => {
    return campaignsWithRoi.filter((c) => showArchived || c.campaign.status === "active");
  }, [campaignsWithRoi, showArchived]);

  // スライダー変更検知
  const handleLagChange = (val: number) => {
    setLocalLagMonths(val);
    setIsAssumptionModified(true);
  };
  const handleWindowChange = (val: number) => {
    setLocalWindowMonths(val);
    setIsAssumptionModified(true);
  };
  const handleSalesAttributionChange = (val: number) => {
    setLocalSalesAttribution(val);
    setIsAssumptionModified(true);
  };

  // 前提のDB保存
  const handleSaveAssumptions = async () => {
    if (!selectedId || !company) return;
    try {
      const newAssumptions = {
        lagMonths: localLagMonths,
        windowMonths: localWindowMonths,
        salesAttribution: localSalesAttribution
      };

      const { error } = await supabase
        .from("hr_campaigns")
        .update({
          roi_assumptions: newAssumptions,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedId);

      if (error) throw error;
      toast.success("測定前提条件を保存しました");
      setIsAssumptionModified(false);
      
      // 一覧データを更新
      setCampaigns(prev => prev.map(c => c.id === selectedId ? { ...c, roi_assumptions: newAssumptions } : c));
    } catch (err) {
      console.error("前提条件の保存に失敗しました:", err);
      toast.error("前提条件の保存に失敗しました");
    }
  };

  // 登録・編集送信処理
  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (!formTitle.trim()) {
      toast.error("施策名を入力してください");
      return;
    }
    if (!formLaunchedAt) {
      toast.error("開始月を入力してください");
      return;
    }

    setIsSubmitLoading(true);

    try {
      let department_id: string | null = null;
      let axis_id: string | null = null;

      if (formScope.startsWith("dept:")) {
        department_id = formScope.replace("dept:", "");
      } else if (formScope.startsWith("axis:")) {
        axis_id = formScope.replace("axis:", "");
      }

      const launchedDate = `${formLaunchedAt}-01`;

      const cleanCostStr = formInvestedCost.replace(/,/g, "");
      const invested_cost = cleanCostStr ? parseFloat(cleanCostStr) : null;
      if (cleanCostStr && isNaN(invested_cost as any)) {
        toast.error("投資額には正しい数値を入力してください");
        setIsSubmitLoading(false);
        return;
      }

      const campaignData: any = {
        company_id: company.id,
        title: formTitle,
        category: formCategory,
        department_id,
        axis_id,
        launched_at: launchedDate,
        invested_cost,
        memo: formMemo || null,
        target_kpi_id: formTargetKpiId || null
      };

      if (editingId) {
        campaignData.updated_at = new Date().toISOString();
        const { data, error } = await supabase
          .from("hr_campaigns")
          .update(campaignData)
          .eq("id", editingId)
          .eq("company_id", company.id)
          .select()
          .single();

        if (error) throw error;

        toast.success("施策を更新しました");
        setShowAddModal(false);
        clearForm();

        // 状態更新
        setCampaigns(prev => prev.map(c => c.id === editingId ? data : c));
      } else {
        campaignData.roi_assumptions = {
          lagMonths: 1,
          windowMonths: 3,
          salesAttribution: 1.0
        };
        campaignData.status = "active";

        const { data, error } = await supabase
          .from("hr_campaigns")
          .insert(campaignData)
          .select()
          .single();

        if (error) throw error;

        toast.success("施策を新しく登録しました");
        setShowAddModal(false);
        clearForm();

        setCampaigns(prev => [data, ...prev]);
        setSelectedId(data.id);
      }
    } catch (err) {
      console.error(editingId ? "施策の更新に失敗しました:" : "施策の登録に失敗しました:", err);
      toast.error(editingId ? "施策の更新に失敗しました" : "施策の登録に失敗しました");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // アーカイブ・削除処理
  const handleToggleArchive = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "active" ? "archived" : "active";
      const { error } = await supabase
        .from("hr_campaigns")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success(nextStatus === "archived" ? "施策をアーカイブしました" : "施策のアクティブ化を完了しました");
      
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus as any } : c));
    } catch (err) {
      console.error("ステータスの変更に失敗しました:", err);
      toast.error("ステータスの変更に失敗しました");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm("この施策データを完全に削除しますか？\n（復元はできません）")) return;
    try {
      const { error } = await supabase.from("hr_campaigns").delete().eq("id", id);
      if (error) throw error;

      toast.success("施策データを削除しました");
      const updated = campaigns.filter(c => c.id !== id);
      setCampaigns(updated);
      if (selectedId === id) {
        setSelectedId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (err) {
      console.error("施策の削除に失敗しました:", err);
      toast.error("施策の削除に失敗しました");
    }
  };

  // 組織マップ用のバブル軌跡データを構築
  const scatterPlotData = useMemo(() => {
    if (!roiResult || !company || !selectedCampaign) return [];

    let rawList: any[] = [];
    if (selectedCampaign.department_id) {
      // 部署指定の場合: 対象部署1件のみ
      rawList = displayDepts.filter((d: any) => d.id === selectedCampaign.department_id);
    } else if (selectedCampaign.axis_id) {
      // 軸指定の場合: 対象軸1件のみ
      rawList = displayAxes.filter((a: any) => a.id === selectedCampaign.axis_id);
    } else {
      // 全社指定の場合: 全部署を表示
      rawList = displayDepts;
    }

    return rawList.map((d: any) => ({
      id: d.id,
      name: d.name,
      head: d.headHistory?.[12] ?? d.masterHeadcount ?? d.headcount ?? 0,
      productivity: d.productivity ?? 0,
      pulse: d.pulse ?? 0,
      weather: d.weather ?? "sun",
      kpiAch: d.kpiAch ?? 0,
      kpiName: d.kpiName || "KPI",
      pulseHistory: d.pulseHistory,
      headHistory: d.headHistory,
      kpiAchHistoryFilled: d.kpiAchHistoryFilled,
      productivityHistoryFilled: d.productivityHistoryFilled,
      respondentsCount: d.respondentsCount ?? 0,
      masterHeadcount: d.masterHeadcount ?? d.headcount ?? 0,
      hasKpiData: d.hasKpiData ?? true
    }));
  }, [roiResult, company, selectedCampaign, displayDepts, displayAxes]);

  // プラン保護画面
  if (!canUse("hr_strategy")) {
    return (
      <AppLayout hasLaborData={hasLaborData}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <PlanGate feature="hr_strategy" requiredPlan="Pro">
            <div className="h-40" />
          </PlanGate>
        </div>
      </AppLayout>
    );
  }

  // 制限権限時
  if (!isAuthorized && !isLoading) {
    return (
      <AppLayout hasLaborData={hasLaborData}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-sm text-center shadow-lg">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <h2 className="text-base font-black text-slate-800 mb-2">アクセス権限がありません</h2>
            <p className="text-xs text-slate-500 font-medium">このページは、経営層（Super Admin, Admin, Executive）ロールのユーザーのみアクセス可能です。</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hasLaborData={hasLaborData}>
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          
          {/* ページヘッダー */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md tracking-widest uppercase">PRO</span>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">人事施策 ROI 分析</h1>
              </div>
              <p className="text-slate-400 text-xs font-medium">登録した人事施策の前後での生産性・KPIへの純効果を DiD-lite で金額測定</p>
            </div>
            
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2 self-start md:self-auto shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              施策を登録
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin" />
              <p className="text-xs font-bold">データを読み込み中...</p>
            </div>
          ) : campaigns.length === 0 ? (
            /* 空ステート */
            <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Rocket className="w-8 h-8 text-teal-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-black text-slate-800">登録された人事施策がありません</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto font-medium">
                  「研修の実施」「評価制度の改定」「全社的な配置転換」などの人事施策をキャンペーン登録することで、施策開始月を起点に Before → After の組織効果（生産性・KPI・体温・売上）を金額価値で振り返ることができます。
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 mx-auto hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                最初の施策を登録する
              </button>
            </div>
          ) : (
            /* メインレイアウト */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* 左カラム：施策リスト */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">施策リスト</h3>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                      className="rounded border-slate-300 text-teal focus:ring-teal"
                    />
                    アーカイブを表示
                  </label>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredCampaigns.map(({ campaign: c, roi }) => {
                    const isSelected = c.id === selectedId;
                    const cat = CATEGORIES.find(cat => cat.id === c.category) || CATEGORIES[5];
                    const isArchived = c.status === "archived";

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                          "bg-white border rounded-2xl p-4 cursor-pointer transition-all flex flex-col gap-3 group relative",
                          isSelected
                            ? "border-teal shadow-md ring-2 ring-teal/5 bg-teal-50/[0.01]"
                            : "border-slate-100 hover:border-slate-300 shadow-sm"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider", cat.color)}>
                              {cat.label.split(" (")[0]}
                            </span>
                            <h4 className="font-black text-slate-800 text-sm mt-1.5 leading-snug truncate group-hover:text-teal transition-colors">
                              {c.title}
                            </h4>
                          </div>
                          
                          {/* 右上にステータス表示 */}
                          {isArchived && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200">
                              ARCHIVED
                            </span>
                          )}
                        </div>

                        {/* 金額・ROI簡易情報 */}
                        <div className="flex items-end justify-between border-t border-slate-50 pt-2.5 mt-1">
                          <div className="text-[10px] text-slate-400 font-medium">
                            <div>対象: <span className="font-bold text-slate-600">{roi.targetName}</span></div>
                            <div>開始: <span className="font-bold text-slate-600">{c.launched_at.slice(0, 7)}</span></div>
                          </div>

                          <div className="text-right">
                            {roi.isOutOfWindow || !roi.isBeforeWindowValid || !roi.isAfterWindowValid ? (
                              <span className="text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                                測定待ち
                              </span>
                            ) : roi.isLaborCostMissing ? (
                              <span className="text-[9px] text-rose-500 font-bold bg-rose-50 border border-rose-100 px-2 py-1 rounded">
                                人件費欠損
                              </span>
                            ) : (
                              <div>
                                <div className="text-xs font-black text-slate-800">
                                  ¥{(roi.netEfficiencyImpact / 10000).toFixed(0)}万円
                                </div>
                                {roi.roiPercent !== null && (
                                  <div className={cn("text-[9px] font-black", roi.roiPercent >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                    ROI {roi.roiPercent.toFixed(0)}%
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 右カラム：施策詳細 */}
              <div className="lg:col-span-8">
                {selectedCampaign && roiResult ? (
                  <div className="space-y-6">
                    
                    {/* 詳細トップカード */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                      
                      {/* キャンペーンヘッダー */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-50 pb-5">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider bg-slate-50 border-slate-200 text-slate-500">
                              {CATEGORIES.find(cat => cat.id === selectedCampaign.category)?.label.split(" (")[0] || "その他"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {selectedCampaign.launched_at.slice(0, 7)} 開始
                            </span>
                          </div>
                          <h2 className="text-lg font-black text-slate-800 leading-tight">{selectedCampaign.title}</h2>
                          <p className="text-xs text-slate-400 font-medium mt-1">
                            対象: <span className="font-bold text-slate-600">{roiResult.targetName}</span>
                            {selectedCampaign.memo && <span className="ml-3 italic font-normal">— {selectedCampaign.memo}</span>}
                          </p>
                        </div>

                        {/* アクションボタン */}
                        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(selectedCampaign)}
                            className="px-3 py-1.5 bg-white text-slate-500 border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-700 text-[10px] font-black tracking-widest uppercase transition-all"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleToggleArchive(selectedCampaign.id, selectedCampaign.status)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all border",
                              selectedCampaign.status === "archived"
                                ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                            )}
                          >
                            {selectedCampaign.status === "archived" ? "アクティブ化" : "アーカイブ"}
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                            className="p-1.5 bg-white text-slate-300 border border-slate-200 rounded-lg hover:border-rose-100 hover:text-rose-500 transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 主要インパクト数値看板 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. 見出し金額 (生産性効率インパクト) */}
                        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">生産性純効果 (金額換算)</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 border border-teal-150 shrink-0">DiD Net</span>
                          </div>

                          {roiResult.isOutOfWindow || !roiResult.isBeforeWindowValid || !roiResult.isAfterWindowValid ? (
                            <div className="text-sm font-black text-slate-400 pt-2">測定期間不足</div>
                          ) : roiResult.isLaborCostMissing ? (
                            <div className="text-xs font-black text-rose-500 pt-2 flex items-center gap-1 leading-normal">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              人件費欠損のため換算不可
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-xl font-black text-slate-800">
                                ¥{(roiResult.netEfficiencyImpact).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                （全社比較控除 / 累計）
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. 投資ROI */}
                        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">施策投資の効率</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">ROI</span>
                          </div>

                          {selectedCampaign.invested_cost ? (
                            roiResult.isOutOfWindow || !roiResult.isBeforeWindowValid || !roiResult.isAfterWindowValid ? (
                              <div className="text-sm font-black text-slate-400 pt-2">測定期間不足</div>
                            ) : roiResult.isLaborCostMissing ? (
                              <div className="text-xs font-black text-slate-400 pt-2">計算不可</div>
                            ) : (
                              <div className="space-y-1">
                                <div className={cn("text-xl font-black", (roiResult.roiPercent ?? 0) >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                  {roiResult.roiPercent !== null ? `${roiResult.roiPercent.toFixed(0)}%` : "-%"}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  投資額: ¥{Number(selectedCampaign.invested_cost).toLocaleString()}
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="text-xs font-black text-slate-400 pt-2 leading-normal">
                              投資額未登録のため<br />算出されません
                            </div>
                          )}
                        </div>

                        {/* 3. 回収期間 */}
                        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">投資の回収期間</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">回収</span>
                          </div>

                          {selectedCampaign.invested_cost ? (
                            roiResult.isOutOfWindow || !roiResult.isBeforeWindowValid || !roiResult.isAfterWindowValid ? (
                              <div className="text-sm font-black text-slate-400 pt-2">測定期間不足</div>
                            ) : roiResult.isLaborCostMissing ? (
                              <div className="text-xs font-black text-slate-400 pt-2">計算不可</div>
                            ) : (
                              <div className="space-y-1">
                                <div className="text-xl font-black text-slate-800">
                                  {roiResult.paybackPeriodMonths !== null ? `${roiResult.paybackPeriodMonths.toFixed(1)}ヶ月` : "回収不能"}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  （効果月数: {roiResult.effectMonths}ヶ月）
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="text-xs font-black text-slate-400 pt-2 leading-normal">
                              投資額未登録のため<br />算出されません
                            </div>
                          )}
                        </div>
                      </div>

                      {/* エラー / 警告案内表示 */}
                      {roiResult.missingMonthsMessage && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-black text-amber-700">効果測定が進行中または範囲外です</p>
                            <p className="text-[10px] text-amber-600 font-medium mt-1 leading-relaxed">
                              {roiResult.missingMonthsMessage}
                              開始月を直近13ヶ月以内に指定し、かつ Before ウィンドウ用の過去月と After 用の将来月が十分に確保されているか確認してください。
                            </p>
                          </div>
                        </div>
                      )}

                      {roiResult.isLaborCostMissing && !roiResult.missingMonthsMessage && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-black text-rose-700">人件費レコードがありません</p>
                            <p className="text-[10px] text-rose-600 font-medium mt-1 leading-relaxed">
                              生産性比率の改善金額換算には、効果対象期間の人件費データ（resource_records の labor_cost）が必要です。
                              「人件費入力」ページより該当期間の人件費を登録してください。
                              （※%指標の比較は下記パネルにてご確認いただけます）
                            </p>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* 指標比較カード (Before -> After & DiD net) */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                        <LineChart className="w-4.5 h-4.5 text-slate-400" />
                        <h3 className="text-sm font-black text-slate-700">主要指標の前後比較</h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              <th className="py-2.5 pb-4">指標</th>
                              <th className="py-2.5 pb-4 text-right">Before平均</th>
                              <th className="py-2.5 pb-4 text-right">After平均</th>
                              <th className="py-2.5 pb-4 text-right">
                                <span className="inline-flex items-center gap-1">
                                  改善幅 (Gross)
                                  <span className="relative group inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 text-[8px] font-bold cursor-help flex-shrink-0">
                                    ?
                                    <span className="absolute bottom-full right-0 mb-2 w-48 p-2 text-[9px] text-slate-500 bg-white border rounded shadow invisible group-hover:visible font-medium z-50 normal-case leading-normal text-left">
                                      対象組織の Before→After の単純な変化量。全社的な追い風/逆風も含む。
                                    </span>
                                  </span>
                                </span>
                              </th>
                              <th className="py-2.5 pb-4 text-right">
                                <span className="inline-flex items-center gap-1">
                                  純効果 (Net)
                                  <span className="relative group inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 text-[8px] font-bold cursor-help flex-shrink-0">
                                    ?
                                    <span className="absolute bottom-full right-0 mb-2 w-48 p-2 text-[9px] text-slate-500 bg-white border rounded shadow invisible group-hover:visible font-medium z-50 normal-case leading-normal text-left">
                                      他部署（対照群）の同期間の変化を差し引いた、施策固有の純効果。DiD-lite（差分の差分）で全社トレンドを除去済み。
                                    </span>
                                  </span>
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="font-medium text-slate-600">
                            {/* ターゲットKPI (指定されている場合のみ強調表示) */}
                            {targetKpiResult && (
                              <tr className="border-b border-slate-50 bg-teal-50/20 hover:bg-teal-50/30 transition-colors ring-1 ring-teal-100/50">
                                <td className="py-3 pl-2 font-black text-teal-800">
                                  <span className="flex items-center gap-1">
                                    🎯 目標KPI: {targetKpiResult.kpiName} (%)
                                  </span>
                                </td>
                                <td className="py-3 text-right font-mono font-bold text-teal-700">{targetKpiResult.before.toFixed(0)}%</td>
                                <td className="py-3 text-right font-mono font-bold text-teal-700">{targetKpiResult.after.toFixed(0)}%</td>
                                <td className={cn("py-3 text-right font-mono font-bold", targetKpiResult.diff >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                  {targetKpiResult.diff > 0 ? "+" : ""}{targetKpiResult.diff.toFixed(0)}%
                                </td>
                                <td className={cn("py-3 text-right font-mono font-black", targetKpiResult.netDiff >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                  {targetKpiResult.netDiff > 0 ? "+" : ""}{targetKpiResult.netDiff.toFixed(0)}%
                                  <span className="text-[8px] font-bold block text-slate-400">(対照控除)</span>
                                </td>
                              </tr>
                            )}
                            {/* 1. 一人当たり生産性 */}
                            <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 font-bold text-slate-800">一人当たり生産性</td>
                              <td className="py-3 text-right font-mono">{roiResult.before.productivity.toFixed(1)}</td>
                              <td className="py-3 text-right font-mono">{roiResult.after.productivity.toFixed(1)}</td>
                              <td className={cn("py-3 text-right font-mono font-bold", roiResult.diff.productivity >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                {roiResult.diff.productivity > 0 ? "+" : ""}{roiResult.diff.productivity.toFixed(1)}
                              </td>
                              <td className={cn("py-3 text-right font-mono font-black", roiResult.netDiff.productivity >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                {roiResult.netDiff.productivity > 0 ? "+" : ""}{roiResult.netDiff.productivity.toFixed(1)}
                                <span className="text-[8px] font-bold block text-slate-400">(対照控除)</span>
                              </td>
                            </tr>
                            
                            {/* 2. KPI達成率 */}
                            <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 font-bold text-slate-800">KPI達成率 (%)</td>
                              <td className="py-3 text-right font-mono">{roiResult.before.kpiAch.toFixed(0)}%</td>
                              <td className="py-3 text-right font-mono">{roiResult.after.kpiAch.toFixed(0)}%</td>
                              <td className={cn("py-3 text-right font-mono font-bold", roiResult.diff.kpiAch >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                {roiResult.diff.kpiAch > 0 ? "+" : ""}{roiResult.diff.kpiAch.toFixed(0)}%
                              </td>
                              <td className={cn("py-3 text-right font-mono font-black", roiResult.netDiff.kpiAch >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                {roiResult.netDiff.kpiAch > 0 ? "+" : ""}{roiResult.netDiff.kpiAch.toFixed(0)}%
                                <span className="text-[8px] font-bold block text-slate-400">(対照控除)</span>
                              </td>
                            </tr>

                            {/* 3. 組織の体温 */}
                            <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 font-bold text-slate-800">組織の体温 (0-5)</td>
                              <td className="py-3 text-right font-mono">{roiResult.before.pulse.toFixed(1)}</td>
                              <td className="py-3 text-right font-mono">{roiResult.after.pulse.toFixed(1)}</td>
                              <td className={cn("py-3 text-right font-mono font-bold", roiResult.diff.pulse >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                {roiResult.diff.pulse > 0 ? "+" : ""}{roiResult.diff.pulse.toFixed(1)}
                              </td>
                              <td className={cn("py-3 text-right font-mono font-black", roiResult.netDiff.pulse >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                {roiResult.netDiff.pulse > 0 ? "+" : ""}{roiResult.netDiff.pulse.toFixed(1)}
                                <span className="text-[8px] font-bold block text-slate-400">(対照控除)</span>
                              </td>
                            </tr>

                            {/* 4. 対象人件費 */}
                            <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 font-bold text-slate-800">対象人件費 (月平均)</td>
                              <td className="py-3 text-right font-mono">¥{roiResult.before.laborCost.toLocaleString()}</td>
                              <td className="py-3 text-right font-mono">¥{roiResult.after.laborCost.toLocaleString()}</td>
                              <td className="py-3 text-right font-mono text-slate-500">
                                {roiResult.diff.laborCost > 0 ? "+" : ""}¥{roiResult.diff.laborCost.toLocaleString()}
                              </td>
                              <td className="py-3 text-right font-mono text-slate-400">—</td>
                            </tr>

                            {/* 5. 売上インパクト (該当部署に売上KPIがある場合のみ) */}
                            {roiResult.before.revenue !== null && roiResult.after.revenue !== null && (
                              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 font-bold text-slate-800">紐付売上実績 (月平均)</td>
                                <td className="py-3 text-right font-mono">¥{roiResult.before.revenue.toLocaleString()}</td>
                                <td className="py-3 text-right font-mono">¥{roiResult.after.revenue.toLocaleString()}</td>
                                <td className={cn("py-3 text-right font-mono font-bold", (roiResult.diff.revenue ?? 0) >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                  {roiResult.diff.revenue !== null && roiResult.diff.revenue > 0 ? "+" : ""}
                                  ¥{roiResult.diff.revenue?.toLocaleString()}
                                </td>
                                <td className="py-3 text-right font-mono text-slate-400">
                                  —
                                  <span className="text-[8px] font-bold block text-slate-400">(売上はDiD非対象)</span>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* 売上の対照併記（全社トレンド%の表示） */}
                      {roiResult.before.revenue !== null && roiResult.after.revenue !== null && roiResult.companyRevenueGrowthRate !== null && (
                        <div className="bg-slate-50 rounded-2xl p-4 text-[10px] text-slate-500 leading-relaxed font-bold border border-slate-100 flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            売上への影響について：
                            売上は部署固有の性質が強く絶対額も大きく異なるため、他部署との引き算 (DiD) はおこなっておりません。<br />
                            対照の参考値として、同期間の<span className="text-indigo-600">「全社売上トレンド (平均伸び率): {roiResult.companyRevenueGrowthRate > 0 ? "+" : ""}{roiResult.companyRevenueGrowthRate}%」</span>を併記します。これをもとに外的要因を差し引いて評価してください。
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 13ヶ月スパークライン (推移＋開始マーカー) */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                        <LineChart className="w-4.5 h-4.5 text-slate-400" />
                        <h3 className="text-sm font-black text-slate-700">13ヶ月推移トレンド（施策開始前後の変化）</h3>
                      </div>

                      {/* SVGでのシンプルな折れ線グラフ描画 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* A: 生産性の推移 */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">一人当たり生産性の推移</p>
                          {(() => {
                            const W = 300, H = 100;
                            const pad = { top: 10, right: 10, bottom: 20, left: 25 };
                            const cw = W - pad.left - pad.right;
                            const ch = H - pad.top - pad.bottom;
                            
                            const maxVal = Math.max(...roiResult.histories.productivityFilled, 10);
                            const xPos = (i: number) => pad.left + (i / 12) * cw;
                            const yPos = (v: number) => pad.top + ch - (v / maxVal) * ch;

                            const dAttr = roiResult.histories.productivityFilled.map((v, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(v)}`).join(" ");

                            return (
                              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto border border-slate-50 rounded-xl bg-slate-50/20 select-none">
                                {/* グリッド線 */}
                                {[0, maxVal / 2, maxVal].map(v => (
                                  <line key={v} x1={pad.left} y1={yPos(v)} x2={W - pad.right} y2={yPos(v)} stroke="#F1F5F9" strokeWidth={1} />
                                ))}

                                {/* 施策開始月縦線マーカー */}
                                {roiResult.launchIdx !== -1 && (
                                  <line
                                    x1={xPos(roiResult.launchIdx)} y1={pad.top}
                                    x2={xPos(roiResult.launchIdx)} y2={pad.top + ch}
                                    stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3,2"
                                  />
                                )}

                                {/* Before/Afterの平均線オーバーレイ */}
                                {roiResult.isBeforeWindowValid && (
                                  <line
                                    x1={xPos(roiResult.launchIdx - localWindowMonths)} y1={yPos(roiResult.before.productivity)}
                                    x2={xPos(roiResult.launchIdx - 1)} y2={yPos(roiResult.before.productivity)}
                                    stroke="#14B8A6" strokeWidth={1.5} strokeLinecap="round" opacity={0.6}
                                  />
                                )}
                                {roiResult.isAfterWindowValid && (
                                  <line
                                    x1={xPos(roiResult.launchIdx + localLagMonths)} y1={yPos(roiResult.after.productivity)}
                                    x2={xPos(12)} y2={yPos(roiResult.after.productivity)}
                                    stroke="#14B8A6" strokeWidth={1.5} strokeLinecap="round" opacity={0.6}
                                  />
                                )}

                                {/* メインパス */}
                                <path d={dAttr} fill="none" stroke="#6366F1" strokeWidth={2} strokeLinecap="round" />

                                {/* 軸ラベル */}
                                <text x={pad.left - 4} y={yPos(0) + 3} textAnchor="end" className="text-[8px] fill-slate-400 font-bold">0</text>
                                <text x={pad.left - 4} y={yPos(maxVal) + 3} textAnchor="end" className="text-[8px] fill-slate-400 font-bold">{maxVal.toFixed(0)}</text>
                                {roiResult.launchIdx !== -1 && (
                                  <text x={xPos(roiResult.launchIdx)} y={H - 4} textAnchor="middle" className="text-[8px] fill-amber-500 font-black">開始</text>
                                )}
                              </svg>
                            );
                          })()}
                        </div>

                        {/* B: KPI達成率の推移 */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {targetKpiResult ? `目標KPI: ${targetKpiResult.kpiName} (%) の推移` : "KPI達成率 (%) の推移"}
                          </p>
                          {(() => {
                            const W = 300, H = 100;
                            const pad = { top: 10, right: 10, bottom: 20, left: 25 };
                            const cw = W - pad.left - pad.right;
                            const ch = H - pad.top - pad.bottom;
                            
                            const historyData = targetKpiResult ? targetKpiResult.history : roiResult.histories.kpiAchFilled;
                            const beforeAvg = targetKpiResult ? targetKpiResult.before : roiResult.before.kpiAch;
                            const afterAvg = targetKpiResult ? targetKpiResult.after : roiResult.after.kpiAch;

                            const maxVal = Math.max(...historyData, 100);
                            const xPos = (i: number) => pad.left + (i / 12) * cw;
                            const yPos = (v: number) => pad.top + ch - (v / maxVal) * ch;

                            const dAttr = historyData.map((v, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(v)}`).join(" ");

                            return (
                              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto border border-slate-50 rounded-xl bg-slate-50/20 select-none">
                                {[0, 50, 100].map(v => (
                                  <line key={v} x1={pad.left} y1={yPos(v)} x2={W - pad.right} y2={yPos(v)} stroke="#F1F5F9" strokeWidth={1} />
                                ))}

                                {roiResult.launchIdx !== -1 && (
                                  <line
                                    x1={xPos(roiResult.launchIdx)} y1={pad.top}
                                    x2={xPos(roiResult.launchIdx)} y2={pad.top + ch}
                                    stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3,2"
                                  />
                                )}

                                {roiResult.isBeforeWindowValid && (
                                  <line
                                    x1={xPos(roiResult.launchIdx - localWindowMonths)} y1={yPos(beforeAvg)}
                                    x2={xPos(roiResult.launchIdx - 1)} y2={yPos(beforeAvg)}
                                    stroke="#14B8A6" strokeWidth={1.5} strokeLinecap="round" opacity={0.6}
                                  />
                                )}
                                {roiResult.isAfterWindowValid && (
                                  <line
                                    x1={xPos(roiResult.launchIdx + localLagMonths)} y1={yPos(afterAvg)}
                                    x2={xPos(12)} y2={yPos(afterAvg)}
                                    stroke="#14B8A6" strokeWidth={1.5} strokeLinecap="round" opacity={0.6}
                                  />
                                )}

                                <path d={dAttr} fill="none" stroke="#06B6D4" strokeWidth={2} strokeLinecap="round" />

                                <text x={pad.left - 4} y={yPos(0) + 3} textAnchor="end" className="text-[8px] fill-slate-400 font-bold">0%</text>
                                <text x={pad.left - 4} y={yPos(100) + 3} textAnchor="end" className="text-[8px] fill-slate-400 font-bold">100%</text>
                                {roiResult.launchIdx !== -1 && (
                                  <text x={xPos(roiResult.launchIdx)} y={H - 4} textAnchor="middle" className="text-[8px] fill-amber-500 font-black">開始</text>
                                )}
                              </svg>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* 組織マップ (バブル軌跡 ScatterPlot) */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                        <Compass className="w-4.5 h-4.5 text-slate-400" />
                        <h3 className="text-sm font-black text-slate-700">組織マップ上の軌跡</h3>
                      </div>
                      
                      <div className="text-[10px] text-slate-500 font-bold mb-2">
                        施策実施に伴い、対象組織がマトリックス上をどう推移したかを確認できます（過去4ヶ月分の軌跡を矢印表示）。
                      </div>

                      <div className="max-w-md mx-auto">
                        <ScatterPlot
                          data={scatterPlotData}
                          yAxisMode="productivity"
                          month="default"
                          showTrajectory={true}
                        />
                      </div>
                    </div>

                    {/* 測定前提スライダー */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4.5 h-4.5 text-slate-400" />
                          <h3 className="text-sm font-black text-slate-700">測定前提条件の調整</h3>
                        </div>
                        {isAssumptionModified && (
                          <button
                            onClick={handleSaveAssumptions}
                            className="px-3 py-1.5 bg-teal text-white text-[10px] font-black tracking-widest uppercase rounded-lg hover:bg-teal-600 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            前提条件を保存
                          </button>
                        )}
                      </div>

                      <div className="space-y-6">
                        {/* 1. 効果発現ラグ (lagMonths) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                              効果発現ラグ (Lag)
                              <span className="relative group inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[9px] font-bold cursor-help flex-shrink-0">
                                ?
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-[9px] text-slate-500 bg-white border rounded shadow invisible group-hover:visible font-medium z-50">
                                  施策開始から効果が現れ始めるまでの猶予月数。開始月＋この月数は効果測定から除外されます。
                                </span>
                              </span>
                            </label>
                            <span className="text-xs font-mono font-bold text-slate-500">{localLagMonths}ヶ月</span>
                          </div>
                          <input
                            type="range" min="0" max="6" step="1"
                            value={localLagMonths}
                            onChange={(e) => handleLagChange(parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal"
                          />
                        </div>

                        {/* 2. 基準期間 (windowMonths) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                              比較元期間 (Before窓)
                              <span className="relative group inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[9px] font-bold cursor-help flex-shrink-0">
                                ?
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-[9px] text-slate-500 bg-white border rounded shadow invisible group-hover:visible font-medium z-50">
                                  施策前の基準（Before）となる平均値を算出するための月数。
                                </span>
                              </span>
                            </label>
                            <span className="text-xs font-mono font-bold text-slate-500">{localWindowMonths}ヶ月</span>
                          </div>
                          <input
                            type="range" min="1" max="6" step="1"
                            value={localWindowMonths}
                            onChange={(e) => handleWindowChange(parseInt(e.target.value))}
                            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal"
                          />
                        </div>

                        {/* 3. 売上寄与率 (salesAttribution) */}
                        {roiResult.before.revenue !== null && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                売上への寄与度 (Attribution)
                                <span className="relative group inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[9px] font-bold cursor-help flex-shrink-0">
                                  ?
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-[9px] text-slate-500 bg-white border rounded shadow invisible group-hover:visible font-medium z-50">
                                    売上の増加分のうち、この人事施策が貢献したとみなす比率。
                                  </span>
                                </span>
                              </label>
                              <span className="text-xs font-mono font-bold text-slate-500">{Math.round(localSalesAttribution * 100)}%</span>
                            </div>
                            <input
                              type="range" min="0.0" max="1.0" step="0.1"
                              value={localSalesAttribution}
                              onChange={(e) => handleSalesAttributionChange(parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400 text-xs font-medium shadow-sm">
                    施策を選択すると詳細分析が表示されます
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* 施策追加モーダル */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-[28px] border border-slate-200 p-6 max-w-2xl w-full space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-teal" />
                {editingId ? "人事施策（キャンペーン）を編集" : "人事施策（キャンペーン）を登録"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCampaign} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 施策名 */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">施策名 (必須)</label>
                <input
                  type="text" required
                  placeholder="例: 若手向けOJT制度のリニューアル"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-teal focus:bg-white transition-all text-slate-700"
                />
              </div>

              {/* カテゴリ */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">カテゴリ</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-teal focus:bg-white transition-all text-slate-700"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* 測定対象スコープ */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">対象組織（全社/部署/軸）</label>
                <select
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-teal focus:bg-white transition-all text-slate-700"
                >
                  <option value="all">🏢 全社 (Weighted Avg / Sum)</option>
                  <optgroup label="部署別">
                    {displayDepts.map((d: any) => (
                      <option key={`dept-${d.id}`} value={`dept:${d.id}`}>🏢 {d.name}</option>
                    ))}
                  </optgroup>
                  {displayAxes.length > 0 && (
                    <optgroup label="軸別">
                      {displayAxes.map((a: any) => (
                        <option key={`axis-${a.id}`} value={`axis:${a.id}`}>🧭 {a.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* 開始月と投資額（display:contents で親グリッドに直接参加） */}
              <div className="contents">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">開始月 (必須)</label>
                  <input
                    type="month" required
                    value={formLaunchedAt}
                    onChange={(e) => setFormLaunchedAt(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-teal focus:bg-white transition-all text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">投資額 (円・任意)</label>
                  <input
                    type="text"
                    placeholder="例: 150,000"
                    value={formInvestedCost}
                    onChange={(e) => setFormInvestedCost(formatNumberWithCommas(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-teal focus:bg-white transition-all text-slate-700 text-right"
                  />
                </div>
              </div>

              {/* 改善を狙うKPI（任意） */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">改善を狙うKPI（任意）</label>
                <select
                  value={formTargetKpiId}
                  onChange={(e) => setFormTargetKpiId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-teal focus:bg-white transition-all text-slate-700"
                >
                  <option value="">🎯 未選択 (特になし)</option>
                  {availableKpis.map((k) => (
                    <option key={k.id} value={k.id}>🎯 {k.name}</option>
                  ))}
                </select>
              </div>

              {/* メモ */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">メモ・詳細</label>
                <textarea
                  placeholder="施策の背景や投資の詳細情報など"
                  rows={3}
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:border-teal focus:bg-white transition-all text-slate-700"
                />
              </div>

              <div className="pt-2 sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-100 disabled:opacity-50"
                >
                  {isSubmitLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      {editingId ? "施策を更新する" : "施策を登録する"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
