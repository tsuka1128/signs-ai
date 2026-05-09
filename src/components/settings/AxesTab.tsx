"use client";

import { Layers, Users, GripVertical, TrendingUp, Trash2, Plus, Save, ArrowRight } from "lucide-react";
import { Reorder } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils/index";

interface AxesTabProps {
    secondaryAxisName: string;
    setSecondaryAxisName: (name: string) => void;
    company: any;
    setCompany: (company: any) => void;
    kpis: any[];
    axes: any[];
    setAxes: (axes: any[]) => void;
    getHistoryTrend: (id: string, type: 'dept' | 'axis') => number[];
    handleOpenHistory: (type: 'dept' | 'axis', id: string, name: string) => void;
    handleDeleteAxis: (id: string) => void;
    handleAddAxis: () => void;
    handleSaveAllAxes: () => void;
    users?: any[];
}

export const AxesTab = ({
    secondaryAxisName,
    setSecondaryAxisName,
    company,
    setCompany,
    kpis,
    axes,
    setAxes,
    getHistoryTrend,
    handleOpenHistory,
    handleDeleteAxis,
    handleAddAxis,
    handleSaveAllAxes,
    users = []
}: AxesTabProps) => {
    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal" /> 担当領域の設定（地域・プロダクトなど）
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase">軸の呼称</label>
                        <input
                            type="text"
                            value={secondaryAxisName}
                            placeholder="例: 担当領域"
                            onChange={(e) => setSecondaryAxisName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                        />
                        <p className="text-[10px] text-slate-400 mt-3 ml-1 line-relaxed">※ 「KPI入力」や「マトリックス切替」の名称として使用されます。</p>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase">バブルサイズのKPI</label>
                        <select
                            value={company?.secondary_axis_size_kpi_id || ""}
                            onChange={(e) => setCompany({ ...company, secondary_axis_size_kpi_id: e.target.value || null })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                        >
                            <option value="">-- 指定なし（達成率を使用） --</option>
                            {kpis.map(k => (
                                <option key={k.id} value={k.id}>{k.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-3 ml-1 line-relaxed">※ マトリックスの円の大きさに反映させる重要指標を選択してください。</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="ml-1 mb-2 space-y-4">
                        <h3 className="text-sm font-bold text-slate-700 mb-1">{secondaryAxisName}の項目一覧</h3>
                        
                        <Link href="/labor" className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-2xl hover:bg-amber-100 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <TrendingUp className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900 leading-none mb-1">{secondaryAxisName}別の人件費・人数を管理</p>
                                    <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest">Labor Cost & Headcount History by {secondaryAxisName}</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-amber-400 transition-transform group-hover:translate-x-1" />
                        </Link>

                        <p className="text-[10px] text-slate-400">※ 各領域の人数は、システムに登録されているメンバー数（アカウント数）と自動的に連動しています。</p>
                    </div>
                    <Reorder.Group axis="y" values={axes} onReorder={setAxes} className="space-y-4">
                        {axes.map(a => (
                            <Reorder.Item
                                key={a.id}
                                value={a}
                                className="flex flex-col sm:flex-row gap-4 items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl cursor-default"
                            >
                                <div className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1 w-full flex items-center gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase tracking-widest">{secondaryAxisName}名</label>
                                        <input
                                            type="text"
                                            value={a.name}
                                            onChange={(e) => setAxes(axes.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all"
                                        />
                                    </div>
                                    <div className="shrink-0 pt-4 hidden sm:block">
                                        <div className="px-4 py-2 bg-slate-100/50 rounded-xl border border-slate-200/50 flex items-center gap-1.5 hover:bg-slate-100 transition-colors">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-sm font-black text-slate-700 tracking-tighter">
                                                    {users.filter(u => u.axis_id === a.id).length}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400">名</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2 sm:pt-0">
                                    <button
                                        onClick={() => handleDeleteAxis(a.id)}
                                        className="p-3 bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    <div className="flex flex-col gap-3 mt-6">
                        <button onClick={handleAddAxis} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> 新しい{secondaryAxisName}を追加
                        </button>
                        <button onClick={handleSaveAllAxes} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                            <Save className="w-4 h-4" /> {secondaryAxisName}設定をすべて保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
