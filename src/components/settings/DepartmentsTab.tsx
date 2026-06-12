"use client";

import { Users, GripVertical, TrendingUp, Trash2, Plus, Save, ArrowRight } from "lucide-react";
import { Reorder } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils/index";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";

interface DepartmentsTabProps {
    depts: any[];
    setDepts: (depts: any[]) => void;
    handleDeleteDept: (id: string) => void;
    handleAddDept: () => void;
    handleSaveAllDepts: () => void;
    users?: any[];
}

export const DepartmentsTab = ({
    depts,
    setDepts,
    handleDeleteDept,
    handleAddDept,
    handleSaveAllDepts,
    users = []
}: DepartmentsTabProps) => {
    const { limits, planName } = usePlanFeatures();
    const isAtLimit = depts.length >= limits.maxDepartments;

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal" /> 部署管理
                </h2>
                <div className="mb-6 space-y-4">
                    <p className="text-xs text-slate-500 mb-1">組織内の各部署を登録してください。バブルチャートの比較に使用されます。</p>
                    
                    <Link href="/labor" className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-2xl hover:bg-amber-100 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900 leading-none mb-1">人件費・人数の履歴を管理</p>
                                <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest">Labor Cost & Headcount History</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-amber-400 transition-transform group-hover:translate-x-1" />
                    </Link>

                    <p className="text-[10px] text-slate-400">※ 各部署の「想定人数」は AI分析・計画用の基準人数 として使用されます。回答率の算出には、人件費・人数入力（/labor）画面の月次実績人数が使用されます。</p>
                </div>

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
                                <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase tracking-widest">部署名</label>
                                        <input
                                            type="text"
                                            value={d.name}
                                            onChange={(e) => setDepts(depts.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all"
                                        />
                                    </div>
                                    <div className="w-48 shrink-0">
                                        <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1 uppercase tracking-widest">AI分析・計画用の基準人数 (人)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={d.headcount || 0}
                                            onChange={(e) => setDepts(depts.map(x => x.id === d.id ? { ...x, headcount: Math.max(0, parseInt(e.target.value) || 0) } : x))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all text-center"
                                        />
                                    </div>
                                    <div className="shrink-0 pt-4 flex flex-col justify-end">
                                        <div className="px-4 py-2.5 bg-slate-100/50 rounded-xl border border-slate-200/50 flex items-center gap-1.5 text-xs text-slate-400 font-bold leading-none">
                                            アカウント数: {users.filter(u => u.department_id === d.id).length}名
                                        </div>
                                    </div>
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
