"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/index";
import { CheckCircle2, PlayCircle, XCircle, Clock, Info, Bot, User, RefreshCcw } from "lucide-react";

interface ActionItemProps {
    id?: string; // ai_action_tracking.id
    priority: 'urgent' | 'high' | 'normal';
    title: string;
    description: string;
    dept: string;
    owner: string;
    isAiGenerated?: boolean;
    isArchived?: boolean;
    archivedAt?: string;
    createdAt?: string;
    initialStatus?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'kept' | 'under_review';
    onPriorityChange?: (newPriority: 'urgent' | 'high' | 'normal') => void;
    onStatusChange?: (newStatus: string) => void;
    onRevive?: () => void;
}

export function ActionItem({ priority: initialPriority, title, description, dept, owner, isAiGenerated = true, isArchived = false, archivedAt, createdAt, initialStatus = 'pending', onPriorityChange, onStatusChange, onRevive }: ActionItemProps) {
    const [status, setStatus] = useState(initialStatus);
    const [priority, setPriority] = useState(initialPriority);

    // 親コンポーネントからのプロパティ変更を同期
    React.useEffect(() => {
        setStatus(initialStatus);
    }, [initialStatus]);

    React.useEffect(() => {
        setPriority(initialPriority);
    }, [initialPriority]);

    const isUrgent = priority === 'urgent';

    // ステータスを切り替える（トグル機能：同じステータスなら pending に戻す）
    const handleStatusUpdate = (newStatus: 'accepted' | 'rejected' | 'completed' | 'kept') => {
        const nextStatus = status === newStatus ? 'pending' : newStatus;
        setStatus(nextStatus);
        if (onStatusChange) onStatusChange(nextStatus);
    };

    // 優先度を切り替える（サイクル：最優先 -> 重要 -> 推奨 -> 最優先）
    const handlePriorityToggle = () => {
        const cycle: Record<string, 'urgent' | 'high' | 'normal'> = {
            urgent: 'high',
            high: 'normal',
            normal: 'urgent'
        };
        const next = cycle[priority];
        setPriority(next);
        if (onPriorityChange) onPriorityChange(next);
    };

    // ステータスに応じたスタイルとラベル
    const statusConfig = {
        pending: { label: "未判断", icon: Info, color: "text-slate-400 bg-slate-50 border-slate-100" },
        accepted: { label: "実行中", icon: PlayCircle, color: "text-teal bg-teal/5 border-teal/20" },
        rejected: { label: "採用しない", icon: XCircle, color: "text-rose-400 bg-rose-50 border-rose-100" },
        completed: { label: "完了済み", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
        kept: { label: "キープ（来月以降に実行）", icon: Clock, color: "text-amber-500 bg-amber-50 border-amber-100" },
        under_review: { label: "検討中", icon: Clock, color: "text-slate-500 bg-slate-100 border-slate-200" }
    };

    // 優先度表示用の設定
    const priorityConfig = {
        urgent: { label: "最優先", class: "bg-rose-500 text-white" },
        high: { label: "重要", class: "bg-amber-400 text-white" },
        normal: { label: "推奨", class: "bg-slate-400 text-white" }
    };

    const currentStatus = statusConfig[status];
    const currentPriority = priorityConfig[priority];

    return (
        <div className={cn(
            "w-full p-6 rounded-2xl border transition-all duration-300 group relative",
            isArchived 
                ? "bg-slate-50/50 border-slate-200 grayscale-[0.2]" 
                : isUrgent 
                    ? "bg-rose-50/20 border-rose-100 shadow-sm" 
                    : "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200"
        )}>
            {/* ヘッダー領域 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {isArchived ? (
                        <div className="flex items-center gap-2">
                            <Badge className="bg-slate-500 text-white border-none font-black text-[9px] px-2 py-1 rounded-lg uppercase tracking-widest">
                                アーカイブ済
                            </Badge>
                            {archivedAt && (
                                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                    {archivedAt}
                                </span>
                            )}
                        </div>
                    ) : (
                        <button 
                            onClick={handlePriorityToggle}
                            className={cn(
                                "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-xs transition-transform active:scale-95 hover:brightness-110",
                                currentPriority.class
                            )}
                            title="優先度を変更"
                        >
                            {currentPriority.label}
                        </button>
                    )}
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tight border",
                        isAiGenerated ? "bg-teal/5 text-teal border-teal/10" : "bg-blue-50 text-blue-500 border-blue-100"
                    )}>
                        {isAiGenerated ? <Bot size={12} /> : <User size={12} />}
                        {isAiGenerated ? "AI提案" : "ユーザー登録"}
                    </div>
                </div>
                <h5 className="text-base font-bold text-slate-800 tracking-tight flex-1">{title}</h5>
                
                {/* 現在のステータスバッジ（デスクトップ用） */}
                <div className={cn(
                    "hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold transition-all duration-300",
                    currentStatus.color
                )}>
                    <currentStatus.icon size={12} className="shrink-0" />
                    {currentStatus.label}
                </div>
            </div>

            {/* 本文（可読性を考慮して幅を最大化） */}
            <div className="mb-6">
                <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                    {description}
                </p>
            </div>

            {/* フッター：属性とアクション */}
            <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] px-3 py-1.5 rounded-lg shrink-0">
                            {dept}
                        </Badge>
                        {(status === 'accepted' || status === 'kept') && dept && dept !== '全社' && (
                            <Badge className="bg-teal/5 text-teal border border-teal/20 font-bold text-[9px] px-2 py-1 rounded-lg shrink-0">
                                📬 {dept} に通知済み
                            </Badge>
                        )}
                        <Badge className="bg-amber-50/50 text-amber-600/70 border-none font-bold text-[10px] px-3 py-1.5 rounded-lg shrink-0">
                            推奨担当: {owner}
                        </Badge>
                        {createdAt && (
                            <Badge className="bg-slate-50 text-slate-400 border-slate-100 font-bold text-[10px] px-3 py-1.5 rounded-lg shrink-0 border">
                                作成日: {createdAt}
                            </Badge>
                        )}
                    </div>

                    {/* モバイル用ステータス表示 */}
                    <div className={cn(
                        "md:hidden flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold transition-all duration-300",
                        currentStatus.color
                    )}>
                        <currentStatus.icon size={12} className="shrink-0" />
                        {currentStatus.label}
                    </div>
                </div>

                {/* 操作パネル（グリッドで幅を統一） */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {isArchived ? (
                        <button 
                            onClick={onRevive}
                            className="col-span-2 md:col-span-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[11px] font-bold transition-all bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 shadow-sm"
                        >
                            <RefreshCcw size={14} />
                            このアクションを復活させる（未判断に戻す）
                        </button>
                    ) : (
                        <>
                            {/* 実行する */}
                            <button 
                                onClick={() => handleStatusUpdate('accepted')}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 border",
                                    status === 'accepted' 
                                        ? "bg-teal text-white border-teal shadow-md" 
                                        : "bg-white text-slate-500 border-slate-100 hover:border-teal/30 hover:bg-teal/5 hover:text-teal"
                                )}
                            >
                                <PlayCircle size={15} />
                                実行する
                            </button>

                            {/* 完了 */}
                            <button 
                                onClick={() => handleStatusUpdate('completed')}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 border",
                                    status === 'completed' 
                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md" 
                                        : "bg-white text-slate-500 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-500"
                                )}
                            >
                                <CheckCircle2 size={15} />
                                完了
                            </button>

                            {/* キープ */}
                            <button 
                                onClick={() => handleStatusUpdate('kept')}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 border",
                                    status === 'kept' 
                                        ? "bg-amber-400 text-white border-amber-400 shadow-md" 
                                        : "bg-white text-slate-500 border-slate-100 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-500"
                                )}
                            >
                                <Clock size={15} />
                                キープ
                            </button>

                            {/* 採用しない */}
                            <button 
                                onClick={() => handleStatusUpdate('rejected')}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 border",
                                    status === 'rejected' 
                                        ? "bg-rose-400 text-white border-rose-400 shadow-md" 
                                        : "bg-white text-slate-500 border-slate-100 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                                )}
                            >
                                <XCircle size={15} />
                                不採用
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}




