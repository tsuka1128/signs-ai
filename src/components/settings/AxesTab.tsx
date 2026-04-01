"use client";

import { Layers, GripVertical, TrendingUp, Trash2, Plus, Save } from "lucide-react";
import { Reorder } from "framer-motion";

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
    handleSaveAllAxes
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
                    <h3 className="text-sm font-bold text-slate-700 ml-1">{secondaryAxisName}の項目一覧</h3>
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
                                <div className="flex-1 w-full">
                                    <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">{secondaryAxisName}名</label>
                                    <input
                                        type="text"
                                        value={a.name}
                                        onChange={(e) => setAxes(axes.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                    />
                                </div>
                                <div className="w-full sm:w-32">
                                    <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">所属人数</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={a.headcount === 0 ? "" : a.headcount}
                                            onChange={(e) => {
                                                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                setAxes(axes.map(x => x.id === a.id ? { ...x, headcount: val } : x));
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">名</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1.5 min-w-[70px] pt-2 sm:pt-0 group">
                                    <div className="h-6 w-full flex items-center justify-center px-1">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
                                            <defs>
                                                <linearGradient id={`gradient-axis-${a.id}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="rgb(20, 184, 166)" stopOpacity="0.4" />
                                                    <stop offset="100%" stopColor="rgb(20, 184, 166)" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {(() => {
                                                const trend = getHistoryTrend(a.id, 'axis');
                                                const max = Math.max(...trend, a.headcount || 1);
                                                const min = Math.min(...trend);
                                                const range = max - min || 1;
                                                const points = trend.map((v, i) => `${(i / (trend.length - 1)) * 60},${20 - ((v - min) / range) * 16 - 2}`);
                                                const pathData = `M ${points.join(' L ')}`;
                                                const areaData = `${pathData} L 60,20 L 0,20 Z`;
                                                return (
                                                    <>
                                                        <path d={areaData} fill={`url(#gradient-axis-${a.id})`} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                        <path d={pathData} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal/40 group-hover:text-teal transition-colors" />
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    </div>
                                    <button
                                        onClick={() => handleOpenHistory('axis', a.id, a.name)}
                                        className="flex items-center gap-1 text-[9px] font-black text-teal hover:text-teal/70 transition-colors uppercase tracking-widest bg-teal/5 px-2 py-1 rounded-lg"
                                    >
                                        <TrendingUp className="w-2.5 h-2.5" /> 履歴
                                    </button>
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
