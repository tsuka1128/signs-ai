"use client";

import { Users, GripVertical, TrendingUp, Trash2, Plus, Save } from "lucide-react";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";

interface DepartmentsTabProps {
    depts: any[];
    setDepts: (depts: any[]) => void;
    getHistoryTrend: (id: string, type: 'dept' | 'axis') => number[];
    handleOpenHistory: (type: 'dept' | 'axis', id: string, name: string) => void;
    handleDeleteDept: (id: string) => void;
    handleAddDept: () => void;
    handleSaveAllDepts: () => void;
}

export const DepartmentsTab = ({
    depts,
    setDepts,
    getHistoryTrend,
    handleOpenHistory,
    handleDeleteDept,
    handleAddDept,
    handleSaveAllDepts
}: DepartmentsTabProps) => {
    const { limits, planName } = usePlanFeatures();
    const isAtLimit = depts.length >= limits.maxDepartments;

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal" /> 部署管理
                </h2>
                <p className="text-xs text-slate-500 mb-6">組織内の各部署を登録してください。バブルチャートの比較に使用されます。</p>

                <div className="space-y-4">
                    <Reorder.Group axis="y" values={depts} onReorder={setDepts} className="space-y-4">
                        {depts.map(d => (
                            <Reorder.Item
                                key={d.id}
                                value={d}
                                className="flex flex-col sm:flex-row gap-4 items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl cursor-default"
                            >
                                <div className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1 w-full flex items-center gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase tracking-widest">部署名</label>
                                        <input
                                            type="text"
                                            value={d.name}
                                            onChange={(e) => setDepts(depts.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all"
                                        />
                                    </div>
                                    <div className="shrink-0 pt-4 hidden sm:block">
                                        <div className="px-4 py-2 bg-slate-100/50 rounded-xl border border-slate-200/50 flex items-center gap-1.5 hover:bg-slate-100 transition-colors">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-sm font-black text-slate-700 tracking-tighter">{d.headcount || 0}</span>
                                                <span className="text-[9px] font-bold text-slate-400">名</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1.5 min-w-[70px] pt-2 sm:pt-0 group">
                                    <div className="h-6 w-full flex items-center justify-center px-1">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                                            <defs>
                                                <linearGradient id={`gradient-${d.id}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="rgb(20, 184, 166)" stopOpacity="0.4" />
                                                    <stop offset="100%" stopColor="rgb(20, 184, 166)" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {(() => {
                                                const trend = getHistoryTrend(d.id, 'dept');
                                                const max = Math.max(...trend, d.headcount || 1);
                                                const min = Math.min(...trend);
                                                const range = max - min || 1;
                                                const points = trend.map((v, i) => `${(i / (trend.length - 1)) * 60},${20 - ((v - min) / range) * 16 - 2}`);
                                                const pathData = `M ${points.join(' L ')}`;
                                                const areaData = `${pathData} L 60,20 L 0,20 Z`;
                                                return (
                                                    <>
                                                        <path d={areaData} fill={`url(#gradient-${d.id})`} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                        <path d={pathData} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 group-hover:text-teal transition-colors" />
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    </div>
                                    <button
                                        onClick={() => handleOpenHistory('dept', d.id, d.name)}
                                        className={cn(
                                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm",
                                            d.id.startsWith("new_") 
                                                ? "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100" 
                                                : "text-teal hover:text-white bg-teal/5 hover:bg-teal border border-teal/20"
                                        )}
                                        title={d.id.startsWith("new_") ? "先に「すべて保存」をクリックしてください" : ""}
                                    >
                                        <TrendingUp className="w-3 h-3" />
                                        詳細・履歴
                                    </button>
                                </div>
                                <div className="flex justify-end pt-2 sm:pt-0">
                                    <button
                                        onClick={() => handleDeleteDept(d.id)}
                                        className="p-3 bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    <div className="flex flex-col gap-3 mt-6">
                        <button 
                            onClick={handleAddDept} 
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
                                {isAtLimit ? "上限に達しました" : "新しい部署を追加"}
                            </div>
                            {isAtLimit && (
                                <span className="text-[10px] font-medium text-slate-400">
                                    {planName}プランの上限は{limits.maxDepartments}部署です。
                                </span>
                            )}
                        </button>
                        <button onClick={handleSaveAllDepts} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                            <Save className="w-4 h-4" /> 部署の設定をすべて保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
