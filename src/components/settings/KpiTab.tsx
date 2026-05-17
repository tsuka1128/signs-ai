"use client";

import { Target, ArrowRight, Star, Trash2, Plus, Save, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { KPI_UNIT_OPTIONS } from "@/lib/constants";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";

interface KpiTabProps {
    kpis: any[];
    setKpis: (kpis: any[]) => void;
    depts: any[];
    handleDeleteKpi: (id: string) => void;
    handleAddKpi: () => void;
    handleSaveAllKpis: () => void;
}

export const KpiTab = ({
    kpis,
    setKpis,
    depts,
    handleDeleteKpi,
    handleAddKpi,
    handleSaveAllKpis
}: KpiTabProps) => {
    const { limits, planName } = usePlanFeatures();
    const isAtLimit = kpis.length >= limits.maxKpis;

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-teal" /> KPI設定
                    <a
                        href="/docs/kpi-setup"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-teal transition-colors"
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                        ヘルプ
                    </a>
                </h2>
                <p className="text-xs text-slate-500 mb-6">各部署の重要指標を定義します。生産性スコアの基盤となります。</p>

                <div className="space-y-4">
                    {kpis.map(k => (
                        <div key={k.id} className="p-7 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] space-y-6 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40">
                            {/* Row 1: KPI Name, Target, Unit */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">指標名</label>
                                    <input
                                        type="text"
                                        value={k.name}
                                        placeholder="指標名を入力"
                                        onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, name: e.target.value } : x))}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">目標値</label>
                                    <input
                                        type="number"
                                        value={k.target_default ?? 0}
                                        placeholder="目標額/数"
                                        onChange={(e) => {
                                            const val = e.target.value === "" ? "" : Number(e.target.value);
                                            setKpis(kpis.map(x => x.id === k.id ? { ...x, target_default: val } : x));
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">単位</label>
                                    <div className="relative">
                                        <select
                                            value={k.unit}
                                            onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, unit: e.target.value } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal appearance-none transition-all pr-10"
                                        >
                                            <option value="">単位を選択</option>
                                            {KPI_UNIT_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Dept, Polarity, Rep KPI, Delete */}
                            <div className="grid grid-cols-1 md:grid-cols-10 gap-5 items-end">
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">主担当部署（任意）</label>
                                    <div className="relative">
                                        <select
                                            value={k.owner_dept_id || ""}
                                            onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, owner_dept_id: e.target.value } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal appearance-none transition-all"
                                        >
                                            <option value="">設定なし</option>
                                            {depts.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">評価基準</label>
                                    <div className="relative">
                                        <select
                                            value={k.is_higher_better ? "true" : "false"}
                                            onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, is_higher_better: e.target.value === "true" } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[10px] font-bold text-slate-800 outline-none focus:border-teal appearance-none transition-all pr-8"
                                        >
                                            <option value="true">最大化目標</option>
                                            <option value="false">最小化目標</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">部署代表KPI</label>
                                    <button
                                        onClick={() => {
                                            const isCurrentlyMain = k.is_main;
                                            const deptId = k.owner_dept_id;
                                            setKpis(kpis.map(x => {
                                                if (deptId && x.owner_dept_id === deptId && x.id !== k.id) return { ...x, is_main: false };
                                                if (x.id === k.id) return { ...x, is_main: !isCurrentlyMain };
                                                return x;
                                            }));
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2 px-3 py-3 rounded-2xl border-2 transition-all font-bold text-[10px] uppercase tracking-widest",
                                            k.is_main
                                                ? "bg-teal/5 border-teal text-teal"
                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                        )}
                                    >
                                        <Star className={cn("w-3.5 h-3.5", k.is_main ? "fill-teal" : "text-slate-300")} />
                                        <span>{k.is_main ? "設定済み" : "代表設定"}</span>
                                    </button>
                                </div>

                                <div className="md:col-span-1 flex justify-end">
                                    <button
                                        onClick={() => handleDeleteKpi(k.id)}
                                        className="p-3.5 rounded-2xl bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Row 3: Toggles */}
                            <div className="pt-2 border-t border-slate-100/50 space-y-3">
                                {/* 売上・利益KPI トグル */}
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer group/rev">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={k.is_revenue || false}
                                                onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, is_revenue: e.target.checked } : x))}
                                                className="sr-only"
                                            />
                                            <div className={cn(
                                                "w-10 h-5 rounded-full transition-all duration-300",
                                                k.is_revenue ? "bg-teal" : "bg-slate-200"
                                            )}></div>
                                            <div className={cn(
                                                "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm",
                                                k.is_revenue ? "translate-x-5" : "translate-x-0"
                                            )}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">売上・利益KPIとして扱う</span>
                                    </label>
                                    <span className="text-[9px] font-medium text-slate-400">※ 労働分配率を表示するには、売上KPIの設定（このフラグをON）が必要です。</span>
                                </div>

                                {/* 全社員に公開する トグル */}
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer group/pub">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={k.is_public_to_players || false}
                                                onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, is_public_to_players: e.target.checked } : x))}
                                                className="sr-only"
                                            />
                                            <div className={cn(
                                                "w-10 h-5 rounded-full transition-all duration-300",
                                                k.is_public_to_players ? "bg-teal" : "bg-slate-200"
                                            )}></div>
                                            <div className={cn(
                                                "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm",
                                                k.is_public_to_players ? "translate-x-5" : "translate-x-0"
                                            )}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">全社員に公開する</span>
                                    </label>
                                    <span className="text-[9px] font-medium text-slate-400">※ プレイヤー向け画面でこのKPIの実績・目標が表示されます（経営透明性）。</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex flex-col gap-3 mt-6">
                        <button 
                            onClick={handleAddKpi} 
                            disabled={isAtLimit}
                            className={cn(
                                "w-full py-4 border-2 border-dashed rounded-2xl font-bold transition-all text-sm flex flex-col items-center justify-center gap-1",
                                isAtLimit 
                                    ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed" 
                                    : "border-slate-200 text-slate-400 hover:border-teal hover:text-teal hover:bg-teal/5"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" /> 
                                {isAtLimit ? "上限に達しました" : "指標を追加"}
                            </div>
                            {isAtLimit && (
                                <span className="text-[10px] font-medium text-slate-400">
                                    {planName}プランの上限は{limits.maxKpis}個です。
                                </span>
                            )}
                        </button>
                        <button onClick={handleSaveAllKpis} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                            <Save className="w-4 h-4" /> KPI設定をすべて保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
