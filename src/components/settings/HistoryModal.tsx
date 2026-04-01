"use client";

import { TrendingUp, X, Save } from "lucide-react";

interface HistoryModalProps {
    historyTarget: { name: string } | null;
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
                        </div>
                        <button onClick={() => setHistoryModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-4 -mr-4 custom-scrollbar">
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-4 px-2 mb-2 text-center">
                                <div className="col-span-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">対象月</div>
                                <div className="col-span-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">所属人数</div>
                                <div className="col-span-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">人件費 (任意)</div>
                            </div>
                            {tempHistory.map((h, idx) => (
                                <div key={h.month} className="grid grid-cols-12 gap-4 items-center p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                    <div className="col-span-3">
                                        <span className="text-sm font-black text-slate-700">{h.month.substring(0, 7)}</span>
                                    </div>
                                    <div className="col-span-4 relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={h.head_count === 0 ? "" : h.head_count}
                                            onChange={(e) => {
                                                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                setTempHistory(tempHistory.map((x, i) => i === idx ? { ...x, head_count: val } : x));
                                            }}
                                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-teal text-center outline-none transition-all pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">名</span>
                                    </div>
                                    <div className="col-span-5 relative">
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="未入力"
                                            value={h.labor_cost === 0 ? "" : h.labor_cost}
                                            onChange={(e) => {
                                                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                                setTempHistory(tempHistory.map((x, i) => i === idx ? { ...x, labor_cost: val } : x));
                                            }}
                                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-teal text-center outline-none transition-all pr-12"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">万円</span>
                                    </div>
                                </div>
                            ))}
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
        </div>
    );
};
