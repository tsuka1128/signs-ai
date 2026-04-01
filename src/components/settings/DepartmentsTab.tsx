"use client";

import { Users, GripVertical, TrendingUp, Trash2, Plus, Save } from "lucide-react";
import { Reorder } from "framer-motion";

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
                                <div className="flex-1 w-full">
                                    <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">部署名</label>
                                    <input
                                        type="text"
                                        value={d.name}
                                        onChange={(e) => setDepts(depts.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                    />
                                </div>
                                <div className="w-full sm:w-32">
                                    <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">所属人数</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={d.headcount === 0 ? "" : d.headcount}
                                            onChange={(e) => {
                                                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                setDepts(depts.map(x => x.id === d.id ? { ...x, headcount: val } : x));
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
                                        className="flex items-center gap-1 text-[9px] font-black text-teal hover:text-teal/70 transition-colors uppercase tracking-widest bg-teal/5 px-2 py-1 rounded-lg"
                                    >
                                        <TrendingUp className="w-2.5 h-2.5" /> 履歴
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
                        <button onClick={handleAddDept} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> 新しい部署を追加
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
