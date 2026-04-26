"use client";

import { TrendingUp, X, Save } from "lucide-react";
import { cn } from "@/lib/utils/index";

interface HistoryModalProps {
    historyTarget: { type: 'dept' | 'axis', name: string } | null;
    setHistoryModalOpen: (open: boolean) => void;
    tempHistory: any[];
    setTempHistory: (history: any[]) => void;
    handleSaveHistory: () => void;
    isSavingHistory: boolean;
}

export const HistoryModal = ({
    historyTarget,
    setHistoryModalOpen,
    tempHistory,
    setTempHistory,
    handleSaveHistory,
    isSavingHistory
}: HistoryModalProps) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setHistoryModalOpen(false)} />
            <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-10 space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                                <TrendingUp className="w-7 h-7 text-teal" />
                                {historyTarget?.name} の推移
                            </h3>
                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">月別の人数と人件費（任意）の実績を入力</p>
                            {historyTarget?.type === 'axis' && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
                                    <span className="text-amber-500 mt-0.5">⚠️</span>
                                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                                        ここで入力した人件費・人数は領域別分析にのみ使用されます。<br />
                                        全社合計は「部署」タブで入力した数値が優先的に集計されます。<br />
                                        （部署を運用していない場合のみ、こちらの数値が全社合計に使われます）
                                    </p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setHistoryModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar relative">
                            <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: "1200px" }}>
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 top-0 z-40 w-[140px] bg-slate-50 border-b border-r border-slate-100 p-3 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] text-center">
                                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">対象月 / 項目</span>
                                        </th>
                                        {tempHistory.slice().reverse().map((h, idx) => (
                                            <th key={h.month} className={cn(
                                                "w-[140px] border-b border-r border-slate-100 p-2 text-center",
                                                idx === 0 ? "bg-teal-50/50" : "bg-slate-50/30"
                                            )}>
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <div className={cn(
                                                        "text-[12px] font-black tracking-tighter",
                                                        idx === 0 ? "text-teal-900" : "text-slate-500"
                                                    )}>
                                                        {idx === 0 ? "今月度" : h.month.substring(0, 7).replace("-", " / ")}
                                                    </div>
                                                    {idx === 0 && <span className="text-[8px] font-black text-teal-500 bg-teal/10 px-1.5 py-0.5 rounded leading-none">INPUT</span>}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 所属人数 Row */}
                                    <tr className="group">
                                        <td className="sticky left-0 z-30 bg-white border-b border-r border-slate-100 p-4 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-bold text-slate-700 leading-none mb-1">所属人数</span>
                                                <span className="text-[9px] font-bold text-slate-400 font-mono tracking-tighter">Person Count</span>
                                            </div>
                                        </td>
                                        {tempHistory.slice().reverse().map((h, idx) => (
                                            <td key={h.month} className={cn(
                                                "p-0 border-b border-r border-slate-100 align-middle transition-colors",
                                                idx === 0 ? "bg-emerald-50/20" : "bg-white group-hover:bg-slate-50/30"
                                            )}>
                                                <div className="relative group/input p-2 pb-0">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={h.head_count === 0 ? "" : h.head_count}
                                                        onChange={(e) => {
                                                            const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                            setTempHistory(tempHistory.map(x => x.month === h.month ? { ...x, head_count: val } : x));
                                                        }}
                                                        placeholder="---"
                                                        className="w-full text-center text-[15px] font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-200"
                                                    />
                                                    <span className="block text-center text-[8px] font-bold text-slate-300 mt-1 uppercase pb-1 tracking-tighter group-active:text-teal">名</span>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 人件費 Row */}
                                    <tr className="group">
                                        <td className="sticky left-0 z-30 bg-white border-r border-slate-100 p-4 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.05)] transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-bold text-slate-700 leading-none mb-1">人件費実績</span>
                                                <span className="text-[9px] font-bold text-slate-400 font-mono tracking-tighter">Labor Cost</span>
                                            </div>
                                        </td>
                                        {tempHistory.slice().reverse().map((h, idx) => (
                                            <td key={h.month} className={cn(
                                                "p-0 border-r border-slate-100 align-middle transition-colors",
                                                idx === 0 ? "bg-emerald-50/20" : "bg-white group-hover:bg-slate-50/30"
                                            )}>
                                                <div className="relative group/input p-2 pb-0">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={h.labor_cost === 0 ? "" : h.labor_cost}
                                                        onChange={(e) => {
                                                            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                                            setTempHistory(tempHistory.map(x => x.month === h.month ? { ...x, labor_cost: val } : x));
                                                        }}
                                                        placeholder="---"
                                                        className="w-full text-center text-[15px] font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-200"
                                                    />
                                                    <span className="block text-center text-[8px] font-bold text-slate-300 mt-1 uppercase pb-1 tracking-tighter group-active:text-teal">万円</span>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={() => setHistoryModalOpen(false)}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSaveHistory}
                            disabled={isSavingHistory}
                            className="flex-[2] py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                        >
                            {isSavingHistory ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            履歴を保存
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(203, 213, 225, 0.4); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.8); }
            `}} />
        </div>
    );
};
