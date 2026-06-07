"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ActionItem } from "@/components/dashboard/ActionItem";
import { Plus, X, Check, RefreshCcw, Target } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { HelpLink } from "@/components/ui/HelpLink";
import { toast } from "sonner";

interface ActionSectionProps {
    actions: any[];
    depts?: any[];
    /** ステータス/優先度変更後に useDashboardData 側の realActionItems を同期するコールバック */
    onActionUpdated?: (id: string, updates: Record<string, unknown>) => void;
}

export function ActionSection({ actions: initialActions, depts = [], onActionUpdated }: ActionSectionProps) {
    const [actions, setActions] = useState(initialActions);

    // AI分析実行後など、親コンポーネントから新しいアクションが渡された場合に同期する
    React.useEffect(() => {
        setActions(initialActions);
    }, [initialActions]);

    const [isAdding, setIsAdding] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // フォーム用ステート
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newDept, setNewDept] = useState(depts.length > 0 ? depts[0].id : "全社");
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
            const archived = a.is_archived ?? a.isArchived;
            return showArchived ? archived : !archived;
        });

        return [...filtered].sort((a, b) => {
            const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
            const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
            return weightB - weightA;
        });
    }, [actions, showArchived]);

    const handleAddAction = async () => {
        if (!newTitle.trim() || isSubmitting) return;
        setIsSubmitting(true);
        
        try {
            const requestBody = {
                title: newTitle,
                description: newDesc || "ユーザーによって手動登録されたアクションです。",
                department_id: newDept === "全社" ? null : newDept,
                priority: newPriority,
                owner: "マネージャー",
                status: 'pending',
                is_ai_generated: false
            };

            const response = await fetch('/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error("Failed to add action");

            const { data } = await response.json();

            // 表示用に変換
            const deptName = newDept === "全社" ? "全社" : (depts.find(d => d.id === newDept)?.name || "不明");
            
            const newAction = {
                id: data.id,
                priority: data.priority,
                title: data.title,
                desc: data.description,
                dept: deptName,
                owner: data.owner,
                initialStatus: data.status,
                isAiGenerated: data.is_ai_generated,
                createdAt: new Date(data.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
            };
            
            setActions([newAction, ...actions]);
            setNewTitle("");
            setNewDesc("");
            setIsAdding(false);
        } catch (error) {
            console.error(error);
            toast.error("アクションの追加に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (index: number, newStatus: string) => {
        const action = actions[index];
        const nextActions = [...actions];
        
        // completed または rejected の場合、自動的にアーカイブ対象とする
        const shouldArchive = newStatus === 'completed' || newStatus === 'rejected';
        const now = new Date().toISOString();

        nextActions[index] = { 
            ...action, 
            initialStatus: newStatus, 
            status: newStatus,
            isArchived: shouldArchive,
            is_archived: shouldArchive,
            archivedAt: shouldArchive ? now : null,
            archived_at: shouldArchive ? now : null
        };
        setActions(nextActions);

        if (action.id) {
            try {
                const res = await fetch('/api/actions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: action.id,
                        updates: {
                            status: newStatus,
                            is_archived: shouldArchive,
                            archived_at: shouldArchive ? now : null
                        }
                    })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                // sec切替でActionSectionがアンマウントされても状態が消えないよう親フック側も同期
                onActionUpdated?.(action.id, {
                    status: newStatus,
                    is_archived: shouldArchive,
                    archived_at: shouldArchive ? now : null
                });
            } catch (error) {
                console.error('アクション保存エラー:', error);
                toast.error('ステータスの保存に失敗しました。再度お試しください。');
                // ロールバック: ローカル状態を元に戻す
                setActions(prev => prev.map((a, i) => i === index ? action : a));
            }
        }
    };

    const handlePriorityChange = async (index: number, newPriority: 'urgent' | 'high' | 'normal') => {
        const action = actions[index];
        const nextActions = [...actions];
        nextActions[index] = { ...action, priority: newPriority };
        setActions(nextActions);

        if (action.id) {
            try {
                const res = await fetch('/api/actions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: action.id, updates: { priority: newPriority } })
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                onActionUpdated?.(action.id, { priority: newPriority });
            } catch (error) {
                console.error('優先度保存エラー:', error);
                toast.error('優先度の保存に失敗しました。');
                setActions(prev => prev.map((a, i) => i === index ? action : a));
            }
        }
    };

    const handleRevive = async (actionIdOrTitle: string, index: number) => {
        const action = actions[index];
        // 復活＝アーカイブ解除し、ステータスをpendingに
        const nextActions = [...actions];
        nextActions[index] = { ...action, initialStatus: 'pending', status: 'pending', isArchived: false, is_archived: false, archivedAt: undefined, archived_at: null };
        setActions(nextActions);

        if (action.id) {
            try {
                await fetch('/api/actions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: action.id, updates: { status: 'pending', is_archived: false, archived_at: null } })
                });
            } catch (error) {
                console.error(error);
            }
        }
    };

    const currentMonth = "3月";

    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Target className="text-teal" size={20} />
                    <h3 className="text-base font-bold text-slate-800 font-display text-nowrap">今月のアクション提案</h3>
                    <HelpLink href="/docs/action-guide" label="活用のコツ" />
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
                                    <option value="全社">全社</option>
                                    {depts.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">優先度</label>
                                <select 
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value as any)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal outline-none text-sm font-bold text-slate-700 bg-white"
                                >
                                    <option value="normal">推奨</option>
                                    <option value="high">重要</option>
                                    <option value="urgent">最優先</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={handleAddAction}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal text-white text-sm font-bold hover:bg-teal-600 transition-all shadow-md shadow-teal-100 disabled:opacity-50"
                            >
                                <Check size={16} />
                                {isSubmitting ? "処理中..." : "アクションを登録"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {sortedActions.length > 0 ? (
                    sortedActions.map((a, i) => {
                        const deptName = a.dept || (a.department_id ? (depts.find(d => d.id === a.department_id)?.name || "不明") : "全社");
                        
                        return (
                            <ActionItem
                                key={a.id || `${a.title}-${i}`}
                                id={a.id}
                                priority={a.priority}
                                title={a.title}
                                description={a.description || a.desc}
                                dept={deptName}
                                owner={a.owner}
                                isAiGenerated={a.is_ai_generated ?? a.isAiGenerated}
                                isArchived={showArchived}
                                archivedAt={a.archived_at ?? a.archivedAt}
                                createdAt={a.created_at ? new Date(a.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }) : a.createdAt}
                                initialStatus={a.status ?? a.initialStatus}
                                onPriorityChange={(p) => handlePriorityChange(actions.indexOf(a), p)}
                                onStatusChange={(s) => handleStatusChange(actions.indexOf(a), s)}
                                onRevive={() => handleRevive(a.title, actions.indexOf(a))}
                            />
                        );
                    })
                ) : (
                    <p className="text-center py-10 text-slate-400 text-sm italic">
                        {showArchived ? "アーカイブされたアクションはありません。" : "提案されたアクションはまだありません。"}
                    </p>
                )}
            </div>
        </div>
    );
}
