"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Minus, Info } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/index";

interface PlanDetailsModalProps {
    onClose: () => void;
}

export function PlanDetailsModal({ onClose }: PlanDetailsModalProps) {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchPlans() {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('id', { ascending: true }); // ID順 (free, team, standard, pro)
            
            if (error) {
                console.error("Error fetching plans:", error);
            } else {
                setPlans(data || []);
            }
            setLoading(false);
        }
        fetchPlans();
    }, [supabase]);

    const featureRows = [
        { key: 'max_departments', label: '最大部署数', type: 'number' },
        { key: 'max_kpis', label: '最大KPI数', type: 'number' },
        { key: 'max_headcount', label: '最大メンバー数', type: 'number' },
        { key: 'manual_ai_runs_per_month', label: '月間AI分析回数', type: 'number' },
        { key: 'ai_analysis_frequency', label: 'バッジ更新頻度', type: 'frequency' },
        { key: 'enable_second_axis', label: '第2軸（担当領域）', type: 'boolean' },
        { key: 'enable_slack', label: 'Slack連携', type: 'boolean' },
        { key: 'enable_labor_analytics', label: '人件費ROI分析', type: 'boolean' },
        { key: 'enable_pdf_export', label: 'PDFエクスポート', type: 'boolean' },
        { key: 'trial_duration_days', label: 'トライアル期間', type: 'days' },
    ];

    const renderValue = (plan: any, row: any) => {
        const val = plan[row.key];
        if (row.type === 'boolean') {
            return val ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-200 mx-auto" />;
        }
        if (row.type === 'frequency') {
            return <span className="text-[10px] font-bold">{val === 1 ? "Weekly" : "Monthly"}</span>;
        }
        if (row.type === 'days') {
            return <span className="text-[10px] font-bold">{val} days</span>;
        }
        if (val === 999 || val === 9999) return "無制限";
        return val;
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                onClick={onClose} 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[40px] w-full max-w-4xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh] border border-white/20"
            >
                <header className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3 text-teal mb-1">
                            <Info className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Master Reference</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight text-left">料金プラン・機能仕様 比較表</h2>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </header>

                <div className="p-10 overflow-x-auto overflow-y-auto flex-1">
                    {loading ? (
                        <div className="py-20 text-center text-slate-400 font-bold italic animate-pulse">Loading plan definitions...</div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 bg-white z-20 text-left p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">機能 / 仕様</th>
                                    {plans.map(p => (
                                        <th key={p.id} className="p-4 text-center border-b border-slate-100 min-w-[120px]">
                                            <div className="text-lg font-black text-slate-800">{p.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{p.id}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {featureRows.map((row, i) => (
                                    <tr key={row.key} className="hover:bg-slate-50/50 transition-all group">
                                        <td className={cn(
                                            "sticky left-0 bg-white group-hover:bg-slate-50 transition-all z-20 p-4 text-sm font-bold text-slate-600",
                                            i === featureRows.length - 1 ? "" : "border-b border-slate-50/10"
                                        )}>
                                            {row.label}
                                        </td>
                                        {plans.map(p => (
                                            <td key={p.id} className="p-4 text-center text-sm font-black text-slate-800">
                                                {renderValue(p, row)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <footer className="px-10 py-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-sm text-left">
                        ※ これらの値は `plans` テーブルに直接定義されたシステム設定値です。<br />
                        マイグレーションにより変更された最新の内容を表示しています。
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-10 py-4 bg-slate-800 text-white rounded-[20px] font-black text-sm hover:bg-slate-700 transition-all shadow-lg"
                    >
                        閉じる
                    </button>
                </footer>
            </motion.div>
        </div>
    );
}
