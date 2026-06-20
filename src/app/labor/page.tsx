"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlanGate } from "@/components/ui/PlanGate";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase";
import { Building2, Save, ArrowLeft, Users, DollarSign, Wallet, HelpCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { HelpLink } from "@/components/ui/HelpLink";

// 実績データの型
interface ResourceRecord {
  id?: string;
  company_id: string;
  department_id: string | null;
  axis_id: string | null;
  recorded_month: string;
  head_count: number;
  labor_cost: number | null;
}

export default function LaborPage() {
  return (
    <AppLayout>
      <PlanGate feature="labor_analytics" requiredPlan="Pro">
        <LaborInputContent />
      </PlanGate>
    </AppLayout>
  );
}

function LaborInputContent() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dept' | 'axis'>('dept');
  const [depts, setDepts] = useState<any[]>([]);
  const [axes, setAxes] = useState<any[]>([]);
  const [secondaryAxisName, setSecondaryAxisName] = useState("第2軸");
  const [allMonths, setAllMonths] = useState<{ month: string, label: string }[]>([]);
  
  // key: {deptOrAxisId}__{month}
  const [editValues, setEditValues] = useState<Record<string, { head_count: string, labor_cost: string }>>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }

    // ユーザー情報の取得
    const { data: userData } = await supabase.from('users').select('company_id, role').eq('id', authUser.id).single();
    let effectiveId = userData?.company_id;

    // 代理ログイン対応
    if (userData?.role === 'super_admin' && typeof window !== "undefined") {
      const impersonatedId = localStorage.getItem("impersonated_company_id");
      if (impersonatedId) effectiveId = impersonatedId;
    }

    if (!effectiveId) {
      setLoading(false);
      return;
    }
    setCompanyId(effectiveId);

    // 月リストの生成 (過去13ヶ月)
    const months: { month: string, label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const monthStr = `${yyyy}-${mm}-01`;
      months.push({
        month: monthStr,
        label: i === 0 ? "今月度" : `${yyyy} / ${mm}`
      });
    }
    setAllMonths(months);

    // 企業設定・部署・第2軸の取得
    const [compRes, deptRes, axisRes, recordsRes] = await Promise.all([
      supabase.from('companies').select('secondary_axis_name').eq('id', effectiveId).single(),
      supabase.from('departments').select('id, name').eq('company_id', effectiveId).order('sort_order', { ascending: true }),
      supabase.from('kpi_axes').select('id, name').eq('company_id', effectiveId).order('sort_order', { ascending: true }),
      supabase.from('resource_records').select('*').eq('company_id', effectiveId)
    ]);

    if (compRes.data) setSecondaryAxisName(compRes.data.secondary_axis_name || "第2軸");
    setDepts(deptRes.data || []);
    setAxes(axisRes.data || []);

    // 既存データのマッピング
    const values: Record<string, { head_count: string, labor_cost: string }> = {};
    recordsRes.data?.forEach(rec => {
      const id = rec.department_id || rec.axis_id;
      if (id) {
        values[`${id}__${rec.recorded_month}`] = {
          head_count: rec.head_count?.toString() || "",
          labor_cost: rec.labor_cost?.toString() || ""
        };
      }
    });
    setEditValues(values);
    setLoading(false);
  };

  const handleInputChange = (id: string, month: string, field: 'head_count' | 'labor_cost', val: string) => {
    const key = `${id}__${month}`;
    setEditValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { head_count: "", labor_cost: "" }),
        [field]: val
      }
    }));
    setIsSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!companyId) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const upsertData: ResourceRecord[] = [];
      const currentItems = activeTab === 'dept' ? depts : axes;

      // 現在のタブに関連するデータのみを抽出して整形
      currentItems.forEach(item => {
        allMonths.forEach(m => {
          const key = `${item.id}__${m.month}`;
          const val = editValues[key];
          
          // 値が入力されている場合のみ upsert 対象にする（または明示的に0として更新）
          if (val && (val.head_count !== "" || val.labor_cost !== "")) {
            upsertData.push({
              company_id: companyId,
              department_id: activeTab === 'dept' ? item.id : null,
              axis_id: activeTab === 'axis' ? item.id : null,
              recorded_month: m.month,
              head_count: parseInt(val.head_count) || 0,
              labor_cost: val.labor_cost !== "" ? parseFloat(val.labor_cost) : null
            });
          }
        });
      });

      if (upsertData.length === 0) {
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('resource_records')
        .upsert(upsertData, {
          onConflict: 'company_id,department_id,axis_id,recorded_month'
        });

      if (error) throw error;
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error("Save Error:", err);
      setSaveError("保存に失敗しました。入力内容を確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <Loading fullScreen message="人件費データを読み込んでいます..." />;

  const currentItems = activeTab === 'dept' ? depts : axes;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-teal transition-colors group mb-2 w-fit">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            ダッシュボードへ戻る
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">人件費・人数入力</h1>
            <Badge className="bg-amber-500 text-white border-none text-[10px] px-2 py-0.5 font-black italic tracking-widest">PRO</Badge>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            組織のパフォーマンス分析に必要な月次の実績値を管理します
          </p>
        </div>

        <div className="flex items-center gap-3">
          <HelpLink href="/docs/kpi-input" className="hidden md:flex" />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-slate-200",
              isSaved ? "bg-teal text-white shadow-teal-200" : "bg-slate-800 text-white hover:bg-slate-700 active:scale-95 disabled:opacity-50"
            )}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                保存完了
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存する
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast-like notification for errors or status */}
      {saveError && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-sm">{saveError}</span>
            <button onClick={() => setSaveError(null)} className="ml-2 hover:opacity-70">✕</button>
          </div>
        </div>
      )}

      {isSaved && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-teal-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-teal-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm">人件費・人数データを保存しました</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveTab('dept')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all",
              activeTab === 'dept' ? "bg-white text-slate-800 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Building2 className="w-4 h-4" />
            部署別
          </button>
          <button
            onClick={() => setActiveTab('axis')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all",
              activeTab === 'axis' ? "bg-white text-slate-800 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Wallet className="w-4 h-4" />
            {secondaryAxisName}別
          </button>
        </div>

        {activeTab === 'axis' && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
            <span className="text-amber-500 mt-0.5">⚠️</span>
            <p className="text-[13px] font-bold text-amber-700 leading-relaxed">
              ここで入力した人件費・人数は領域別分析（第2軸）にのみ使用されます。<br />
              全社合計および財務パフォーマンスの算出は、原則として「部署」タブで入力された数値が優先的に集計されます。
            </p>
          </div>
        )}
      </div>

      {/* Input Table or Empty State */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {currentItems.length === 0 ? (
          <div className="p-20">
            <EmptyState 
              title={activeTab === 'dept' ? "部署が登録されていません" : `${secondaryAxisName}が登録されていません`}
              description="設定ページから項目を追加すると、人件費と人数の入力が可能になります。"
            />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar relative">
            <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: "1800px" }}>
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-40 w-[240px] bg-slate-50 border-b border-r border-slate-200 p-4 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] text-center">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">対象月 / 項目</span>
                </th>
                {allMonths.map((m, idx) => (
                  <th key={m.month} className={cn(
                    "w-[120px] border-b border-r border-slate-200 p-3 text-center transition-colors",
                    idx === 0 ? "bg-teal-50/50" : "bg-slate-50/30"
                  )}>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={cn(
                        "text-[12px] font-black tracking-tighter",
                        idx === 0 ? "text-teal-900" : "text-slate-500"
                      )}>
                        {m.label}
                      </div>
                      {idx === 0 && <span className="text-[8px] font-black text-teal-500 bg-teal/10 px-1.5 py-0.5 rounded leading-none">INPUT</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id} className="group">
                  <td className="sticky left-0 z-30 bg-white group-hover:bg-slate-50 border-b border-r border-slate-200 p-4 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-slate-800 leading-tight mb-0.5">{item.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{activeTab === 'dept' ? 'Department' : secondaryAxisName}</span>
                    </div>
                  </td>
                  {allMonths.map((m, idx) => {
                    const key = `${item.id}__${m.month}`;
                    const val = editValues[key] || { head_count: "", labor_cost: "" };
                    return (
                      <td key={m.month} className={cn(
                        "p-0 border-b border-r border-slate-200 align-middle transition-colors",
                        idx === 0 ? "bg-teal-50/10" : "group-hover:bg-slate-50/30"
                      )}>
                        <div className="flex flex-col p-2 gap-2">
                          {/* Headcount Input */}
                          <div className="relative group/input flex items-center gap-2 px-2 bg-slate-50/50 rounded-lg border border-transparent focus-within:border-teal/30 focus-within:bg-white transition-all">
                            <Users className="w-3 h-3 text-slate-300" />
                            <input
                              type="number"
                              min="0"
                              value={val.head_count}
                              onChange={(e) => handleInputChange(item.id, m.month, 'head_count', e.target.value)}
                              placeholder="---"
                              className="w-full text-right text-[13px] font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-200 py-1"
                            />
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter shrink-0">名</span>
                          </div>
                          {/* Labor Cost Input */}
                          <div className="relative group/input flex items-center gap-2 px-2 bg-slate-50/50 rounded-lg border border-transparent focus-within:border-teal/30 focus-within:bg-white transition-all">
                            <DollarSign className="w-3 h-3 text-slate-300" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={val.labor_cost}
                              onChange={(e) => handleInputChange(item.id, m.month, 'labor_cost', e.target.value)}
                              placeholder="---"
                              className="w-full text-right text-[13px] font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-200 py-1"
                            />
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter shrink-0">万円</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Common Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(203, 213, 225, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.8); }
      `}} />
    </div>
  );
}
