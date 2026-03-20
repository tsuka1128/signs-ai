"use client";

import { useState, useMemo } from "react";
import { ActionItem } from "@/components/dashboard/ActionItem";
import { Plus, X, Check, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionSectionProps {
    actions: any[];
}

export function ActionSection({ actions: initialActions }: ActionSectionProps) {
    const [actions, setActions] = useState(initialActions);
    const [isAdding, setIsAdding] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    
    // フォーム用ステート
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newDept, setNewDept] = useState("Sales");
    const [newPriority, setNewPriority] = useState<'urgent' | 'high' | 'normal'>('normal');

    // 優先度の重み付け
    const priorityWeight = {
        urgent: 3,
        high: 2,
        normal: 1
    };

    // 表示対象のアクションをフィルタリング & ソート
    const sortedActions = useMemo(() => {
        const filtered = actions.filter(a => {
            return showArchived ? a.isArchived : !a.isArchived;
        });

        return [...filtered].sort((a, b) => {
            const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
            const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
            return weightB - weightA;
        });
    }, [actions, showArchived]);

    const handleAddAction = () => {
        if (!newTitle.trim()) return;
        
        const newAction = {
            priority: newPriority,
            title: newTitle,
            desc: newDesc || "ユーザーによって手動登録されたアクションです。",
            dept: newDept,
            owner: "マネージャー",
            initialStatus: 'pending',
            isAiGenerated: false,
            createdAt: new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
        };
        
        setActions([newAction, ...actions]);
        setNewTitle("");
        setNewDesc("");
        setIsAdding(false);
    };

    const handleStatusChange = (index: number, newStatus: string) => {
        setActions(prev => prev.map((a, i) => {
            if (i === index) {
                return { 
                    ...a, 
                    initialStatus: newStatus
                };
            }
            return a;
        }));
    };

    const handlePriorityChange = (index: number, newPriority: 'urgent' | 'high' | 'normal') => {
        setActions(prev => prev.map((a, i) => i === index ? { ...a, priority: newPriority } : a));
    };

    const handleRevive = (actionTitle: string) => {
        setActions(prev => prev.map(a => 
            a.title === actionTitle ? { ...a, initialStatus: 'pending', isArchived: false, archivedAt: undefined } : a
        ));
    };

    const currentMonth = "3月";

    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-bold text-slate-800 font-display">🚀 今月のアクション提案</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border",
                            isAdding 
                                ? "bg-slate-100 text-slate-500 border-slate-200" 
                                : "bg-teal text-white border-teal hover:bg-teal-600"
                        )}
                    >
                        {isAdding ? <X size={14} /> : <Plus size={14} />}
                        {isAdding ? "キャンセル" : "アクションを追加"}
                    </button>
                    <button 
                        onClick={() => setShowArchived(!showArchived)}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm",
                            showArchived 
                                ? "bg-slate-800 text-white border-slate-800" 
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                    >
                        <RefreshCcw size={12} className={showArchived ? "animate-spin-slow" : ""} />
                        {showArchived ? "リストに戻る" : "振り返り (アーカイブ)"}
                    </button>
                </div>
            </div>

            {/* 新規登録フォーム (アーカイブ表示時は非表示) */}
            {isAdding && !showArchived && (
                <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">アクション名</label>
                            <input 
                                type="text" 
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="例：営業プロセスの見直し"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal outline-none text-sm font-bold text-slate-700 bg-white"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">内容（詳細）</label>
                            <textarea 
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="分析結果を踏まえた具体的なアクション内容を入力してください..."
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal outline-none text-sm font-medium text-slate-600 bg-white min-h-[100px] resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">担当部署</label>
                                <select 
                                    value={newDept}
                                    onChange={(e) => setNewDept(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal outline-none text-sm font-bold text-slate-700 bg-white"
                                >
                                    <option value="Sales">Sales</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="HR">HR</option>
                                    <option value="全社">全社</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">優先度</label>
                                <select 
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value as any)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal outline-none text-sm font-bold text-slate-700 bg-white"
                                >
                                    <option value="normal">🔵 推奨</option>
                                    <option value="high">🟡 重要</option>
                                    <option value="urgent">🔴 最優先</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={handleAddAction}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal text-white text-sm font-bold hover:bg-teal-600 transition-all shadow-md shadow-teal-100"
                            >
                                <Check size={16} />
                                アクションを登録
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {sortedActions.length > 0 ? (
                    sortedActions.map((a, i) => (
                        <ActionItem
                            key={`${a.title}-${i}`}
                            priority={a.priority}
                            title={a.title}
                            description={a.desc}
                            dept={a.dept}
                            owner={a.owner}
                            isAiGenerated={a.isAiGenerated}
                            isArchived={showArchived}
                            archivedAt={a.archivedAt}
                            createdAt={a.createdAt}
                            initialStatus={a.initialStatus}
                            onPriorityChange={(p) => handlePriorityChange(actions.indexOf(a), p)}
                            onStatusChange={(s) => handleStatusChange(actions.indexOf(a), s)}
                            onRevive={() => handleRevive(a.title)}
                        />
                    ))
                ) : (
                    <p className="text-center py-10 text-slate-400 text-sm italic">
                        {showArchived ? "アーカイブされたアクションはありません。" : "提案されたアクションはまだありません。"}
                    </p>
                )}
            </div>
        </div>
    );
}
