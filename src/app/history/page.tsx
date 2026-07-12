"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AppLayout } from "@/components/layout/AppLayout";
import { TabBar } from "@/components/ui/TabBar";
import { Bell, CheckCircle2, ChevronRight, Brain, Target, Thermometer, Shield, AlertTriangle, Lightbulb, Calendar, Lock } from "lucide-react";
import { ReportSection } from "@/components/dashboard/sections/ReportSection";
import { Loading } from "@/components/ui/Loading";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/index";
import { useCompany } from "@/hooks/useCompany";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function HistoryPage() {
    useDocumentTitle("通知・分析履歴");
    const router = useRouter();
    const { company, loading: authLoading, supabase, userRole } = useCompany();
    
    // タブ選択状態
    const [activeTab, setActiveTab] = useState("notifications");
    
    // 通知ログ関連の状態
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);
    
    // AI分析履歴関連の状態
    const [insights, setInsights] = useState<any[]>([]);
    const [selectedInsight, setSelectedInsight] = useState<any>(null);
    const [loadingInsights, setLoadingInsights] = useState(true);

    // 経営層ロールかどうかの判定 (admin, executive, super_admin)
    const isExecutiveRole = userRole === "admin" || userRole === "executive" || userRole === "super_admin";

    // タブリスト
    const tabs = [
        { id: "notifications", label: "通知ログ" },
        ...(isExecutiveRole ? [{ id: "ai_insights", label: "AI分析履歴" }] : [])
    ];

    // 通知データの取得
    const fetchNotifications = async () => {
        try {
            setLoadingNotifications(true);
            const res = await fetch("/api/notifications?all=1&limit=100");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // AI分析履歴データの取得
    const fetchInsights = async () => {
        if (!isExecutiveRole || !company) return;
        try {
            setLoadingInsights(true);
            const { data, error } = await supabase
                .from("ai_insights")
                .select("id, target_month, content, created_at")
                .eq("company_id", company.id) // super_admin は is_super_admin() RLSで全社返るため明示フィルタ必須
                .eq("insight_type", "full_report")
                .order("target_month", { ascending: false });

            if (error) throw error;
            setInsights(data || []);
            if (data && data.length > 0) {
                setSelectedInsight(data[0]); // デフォルトで最新月を選択
            }
        } catch (err) {
            console.error("Failed to fetch AI insights:", err);
        } finally {
            setLoadingInsights(false);
        }
    };

    // 初回フェッチ
    useEffect(() => {
        if (!authLoading && company) {
            fetchNotifications();
            if (isExecutiveRole) {
                fetchInsights();
            }
        }
    }, [authLoading, company, userRole]);

    // 通知クリック時の既読化と遷移
    const handleNotificationClick = async (n: any) => {
        if (!n.is_read) {
            try {
                await fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: [n.id] }),
                });
                // ローカルステートを既読に更新
                setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
            } catch (err) {
                console.error("Failed to mark notification as read:", err);
            }
        }
        if (n.link) {
            router.push(n.link);
        }
    };

    // すべて既読にする
    const handleMarkAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: unreadIds }),
            });
            if (res.ok) {
                setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
            }
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    // 表示月の日本語フォーマット
    const formatMonth = (monthStr: string) => {
        if (!monthStr) return "";
        const parts = monthStr.split("-");
        if (parts.length >= 2) {
            return `${parts[0]}年${parseInt(parts[1], 10)}月度`;
        }
        return monthStr;
    };

    // AIレポート詳細用セクションのマッピング
    const getReportSections = (insight: any) => {
        if (!insight || !insight.content) return [];
        const aiContent = insight.content;
        return [
            {
                id: "executive-summary",
                icon: <Target className="w-5 h-5" />,
                title: "総評：組織の健全性と戦略進捗",
                subtitle: "Executive Summary",
                content: aiContent.deep_report?.executive_summary || "データなし"
            },
            {
                id: "correlation",
                icon: <Thermometer className="w-5 h-5" />,
                title: "組織力とKPIの相関解析",
                subtitle: "Organizational Health × KPI Correlation",
                content: aiContent.deep_report?.correlation || "データなし"
            },
            {
                id: "strategic-alignment",
                icon: <Shield className="w-5 h-5" />,
                title: "組織方針との整合性チェック",
                subtitle: "Strategic Alignment",
                content: aiContent.deep_report?.strategic_alignment || "データなし"
            },
            {
                id: "risks",
                icon: <AlertTriangle className="w-5 h-5" />,
                title: "リスクと成長機会の特定",
                subtitle: "Risks & Opportunities",
                content: aiContent.deep_report?.risks || "データなし"
            },
            {
                id: "recommendations",
                icon: <Lightbulb className="w-5 h-5" />,
                title: "経営判断への具体的提言",
                subtitle: "Actionable Recommendations",
                content: aiContent.deep_report?.recommendations || "データなし"
            }
        ];
    };

    if (authLoading) {
        return <Loading fullScreen message="データを準備しています..." />;
    }

    return (
        <AppLayout currentSection="history">
            <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-6">
                {/* ページヘッダー */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">履歴・ログ</h1>
                        <p className="text-xs text-slate-400 font-bold mt-1.5">
                            過去の通知履歴およびAI分析レポートのアーカイブ
                        </p>
                    </div>
                    {/* 経営層ロールのみタブを表示。それ以外は非表示にして通知ログ固定にする */}
                    {isExecutiveRole && (
                        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} className="self-start md:self-auto" />
                    )}
                </div>

                {/* タブコンテンツ */}
                <div className="animate-fadeIn">
                    {activeTab === "notifications" ? (
                        /* 通知ログ */
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">通知一覧 (直近100件)</span>
                                {notifications.some(n => !n.is_read) && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-[11px] font-bold text-teal hover:text-teal/80 transition-colors flex items-center gap-1.5"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        すべて既読にする
                                    </button>
                                )}
                            </div>
                            
                            <div className="divide-y divide-slate-100">
                                {loadingNotifications ? (
                                    <div className="py-20 text-center">
                                        <Loading message="通知履歴を取得しています..." />
                                    </div>
                                ) : notifications.length > 0 ? (
                                    notifications.map(n => {
                                        const Icon = n.type === "ai_analysis_done" ? Brain : n.type === "anomaly_alert" ? AlertTriangle : Bell;
                                        const iconBg = n.type === "ai_analysis_done" 
                                            ? "bg-teal/10 text-teal" 
                                            : n.type === "anomaly_alert" 
                                                ? "bg-rose-50 text-rose-500 border border-rose-100" 
                                                : "bg-slate-50 text-slate-400";
                                        return (
                                            <div
                                                key={n.id}
                                                onClick={() => handleNotificationClick(n)}
                                                className={cn(
                                                    "p-5 hover:bg-slate-50/50 transition-colors flex gap-4 cursor-pointer relative group",
                                                    !n.is_read ? "bg-teal/[0.015]" : ""
                                                )}
                                            >
                                                {/* 未読インジケータ */}
                                                {!n.is_read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal rounded-r-full" />
                                                )}
                                                
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", iconBg)}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                                                        <h4 className={cn("text-sm font-bold text-slate-800 leading-snug truncate", !n.is_read ? "font-black" : "")}>
                                                            {n.title}
                                                        </h4>
                                                        <span className="shrink-0 text-[10px] font-bold text-slate-400">
                                                            {new Date(n.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    {n.body && <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.body}</p>}
                                                </div>
                                                
                                                {n.link && (
                                                    <div className="shrink-0 flex items-center self-center text-slate-300 group-hover:text-slate-500 transition-colors">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="px-6 py-20 text-center">
                                        <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-400">通知履歴はありません</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* AI分析履歴 (経営層向けのみ) */
                        isExecutiveRole ? (
                            <div className="flex flex-col lg:flex-row gap-6 items-start">
                                {/* 左側：対象月リスト */}
                                <div className="w-full lg:w-64 shrink-0 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">レポートアーカイブ</h4>
                                    <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                        {loadingInsights ? (
                                            <div className="py-8 text-center">
                                                <Loading message="月次リストを取得中..." />
                                            </div>
                                        ) : insights.length > 0 ? (
                                            insights.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setSelectedInsight(item)}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-between border border-transparent",
                                                        selectedInsight?.id === item.id
                                                            ? "bg-teal text-white shadow-lg shadow-teal/20 border-teal"
                                                            : "text-slate-600 hover:bg-slate-50 hover:border-slate-100"
                                                    )}
                                                >
                                                    <span>{formatMonth(item.target_month)}</span>
                                                    <Calendar className={cn("w-3.5 h-3.5", selectedInsight?.id === item.id ? "text-white" : "text-slate-400")} />
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-center py-6 text-xs text-slate-400 font-bold">過去のAI分析履歴はありません</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* 右側：レポート詳細 */}
                                <div className="flex-1 w-full bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm">
                                    {loadingInsights ? (
                                        <div className="py-20 text-center">
                                            <Loading message="AI分析レポートを読み込んでいます..." />
                                        </div>
                                    ) : selectedInsight ? (
                                        <ReportSection
                                            generatedAt={new Date(selectedInsight.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            sections={getReportSections(selectedInsight)}
                                        />
                                    ) : (
                                        <div className="text-center py-20 text-slate-400">
                                            <Brain className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                                            <p className="text-sm font-bold">選択された月のAI分析レポートはありません</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* ロール権限エラー (直接URL入力などで遷移した場合の防衛策) */
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center max-w-md mx-auto">
                                <Lock className="w-12 h-12 mx-auto text-rose-500 bg-rose-50 p-2.5 rounded-2xl mb-4 border border-rose-100" />
                                <h3 className="text-base font-black text-slate-800 tracking-tight">アクセス権限がありません</h3>
                                <p className="text-xs text-slate-400 font-bold mt-2">
                                    AI分析履歴は経営層ロール（管理者・役員）専用コンテンツです。
                                </p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
