"use client";

import { Link2, Save, BellRing, AlertCircle, Eye, HelpCircle, Plus, Trash2, Check, RefreshCw, Layers } from "lucide-react";
import { SlackHelpTooltip } from "@/components/ui/SlackHelpTooltip";
import { SLACK_MESSAGE_DEFAULTS, SlackMessageKey } from "@/lib/slack-message-defaults";
import { cn } from "@/lib/utils/index";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

interface IntegrationTabProps {
    company: any;
    setCompany: (company: any) => void;
    handleSaveIntegration: () => void;
    handleRemindVoiceCheck: () => void;
    handleRemindKpi: () => void;
}

interface SlackChannel {
    id: string;
    name: string;
    channel_type: 'company' | 'executive' | 'department' | 'custom';
    department_id: string | null;
    webhook_url: string;
    notify_voice_check_reminder: boolean;
    notify_voice_check_feedback: boolean;
    notify_ai_summary: boolean;
    notify_anomaly_alert: boolean;
    notify_kpi_reminder: boolean;
    notify_policy_update: boolean; // 組織方針更新フラグを追加
    created_at: string;
}

export const IntegrationTab = ({
    company,
    setCompany,
    handleSaveIntegration,
    handleRemindVoiceCheck,
    handleRemindKpi
}: IntegrationTabProps) => {
    const supabase = createClient();
    const [channels, setChannels] = useState<SlackChannel[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [testing, setTesting] = useState<string | null>(null);

    // 新規追加モーダル状態
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newChanName, setNewChanName] = useState("");
    const [newChanType, setNewChanType] = useState<'company' | 'executive' | 'department' | 'custom'>('department');
    const [newChanDeptId, setNewChanDeptId] = useState("");
    const [newChanUrl, setNewChanUrl] = useState("");
    const [newChanTesting, setNewChanTesting] = useState(false);

    // チャンネルと部署の初期読み込み
    const fetchChannelsAndDepts = async () => {
        if (!company?.id) return;
        try {
            setLoading(true);
            
            // 1. チャンネル一覧の取得
            const response = await fetch("/api/settings/slack-channels");
            const data = await response.json();
            if (data.channels) {
                setChannels(data.channels);
            }

            // 2. 部署一覧の取得
            const { data: depts } = await supabase
                .from("departments")
                .select("id, name")
                .eq("company_id", company.id)
                .order("sort_order", { ascending: true });

            if (depts) {
                setDepartments(depts);
                if (depts.length > 0) {
                    setNewChanDeptId(depts[0].id);
                }
            }
        } catch (error) {
            console.error("データ取得エラー:", error);
            toast.error("接続情報の読み込みに失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChannelsAndDepts();
    }, [company?.id]);

    // 新規登録時の部署名自動セット
    useEffect(() => {
        if (newChanType === 'department') {
            const dept = departments.find(d => d.id === newChanDeptId);
            if (dept) {
                setNewChanName(`${dept.name}チャンネル`);
            }
        } else if (newChanType === 'company') {
            setNewChanName("全社チャンネル");
        } else if (newChanType === 'executive') {
            setNewChanName("経営陣チャンネル");
        } else {
            setNewChanName("カスタムチャンネル");
        }
    }, [newChanType, newChanDeptId, departments]);

    // 新規追加の送信
    const handleAddChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChanName || !newChanUrl) {
            toast.error("必須フィールドを入力してください。");
            return;
        }

        try {
            setNewChanTesting(true);
            const response = await fetch("/api/settings/slack-channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newChanName,
                    channel_type: newChanType,
                    department_id: newChanType === 'department' ? newChanDeptId : null,
                    webhook_url: newChanUrl
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("チャンネルを追加しました！（スマートデフォルト設定が適用されました）");
                setIsAddModalOpen(false);
                setNewChanUrl("");
                fetchChannelsAndDepts();
            } else {
                toast.error(`登録エラー: ${data.error}`);
            }
        } catch (error) {
            toast.error("サーバーエラーが発生しました。");
        } finally {
            setNewChanTesting(false);
        }
    };

    // チャンネル更新
    const handleUpdateChannel = async (chan: SlackChannel) => {
        try {
            setSaving(chan.id);
            const response = await fetch("/api/settings/slack-channels", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(chan)
            });

            if (response.ok) {
                toast.success("設定を更新しました。");
                fetchChannelsAndDepts();
            } else {
                const data = await response.json();
                toast.error(`更新エラー: ${data.error}`);
            }
        } catch (error) {
            toast.error("サーバーエラーが発生しました。");
        } finally {
            setSaving(null);
        }
    };

    // チャンネル個別のテスト送信
    const handleTestChannel = async (id: string) => {
        try {
            setTesting(id);
            const response = await fetch(`/api/settings/slack-channels/${id}/test`, {
                method: "POST"
            });

            if (response.ok) {
                toast.success("接続テストに成功！Slackを確認してください。");
            } else {
                const data = await response.json();
                toast.error(`テスト送信失敗: ${data.error}`);
            }
        } catch (error) {
            toast.error("通信エラーが発生しました。");
        } finally {
            setTesting(null);
        }
    };

    // 保存前URLの直接疎通テスト（モーダル内用）
    const handleTestUnsavedUrl = async () => {
        if (!newChanUrl) {
            toast.error("Webhook URLを入力してください。");
            return;
        }
        try {
            setNewChanTesting(true);
            const response = await fetch("/api/settings/slack-channels/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ webhookUrl: newChanUrl })
            });

            if (response.ok) {
                toast.success("接続テストメッセージを送信しました！Slackを確認してください。");
            } else {
                const data = await response.json();
                toast.error(`送信失敗: ${data.error}`);
            }
        } catch (error) {
            toast.error("疎通エラーが発生しました。");
        } finally {
            setNewChanTesting(false);
        }
    };

    // チャンネル削除
    const handleDeleteChannel = async (id: string) => {
        if (!confirm("本当にこのチャンネル設定を削除しますか？")) return;
        try {
            const response = await fetch(`/api/settings/slack-channels?id=${id}`, {
                method: "DELETE"
            });

            if (response.ok) {
                toast.success("チャンネルを削除しました。");
                fetchChannelsAndDepts();
            } else {
                const data = await response.json();
                toast.error(`削除エラー: ${data.error}`);
            }
        } catch (error) {
            toast.error("サーバーエラーが発生しました。");
        }
    };

    // プレビュー通知送信ハンドラーの自立実装
    const handlePreviewNotification = async (type: string) => {
        // 登録されているチャンネルから「全社（company）」の Webhook を自動判別
        const companyChannel = channels.find(c => c.channel_type === 'company');
        if (!companyChannel?.webhook_url) {
            toast.error("全社（company）チャンネルが登録されていません。「チャンネル追加」から全社チャンネルを登録・保存してください。");
            return;
        }

        try {
            const res = await fetch("/api/settings/slack-channels/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    webhookUrl: companyChannel.webhook_url, 
                    previewType: type,
                    customMessages: {
                        slack_msg_ai_summary: company.slack_msg_ai_summary,
                        slack_msg_anomaly_alert: company.slack_msg_anomaly_alert,
                        slack_msg_voice_check: company.slack_msg_voice_check,
                        slack_msg_kpi_reminder: company.slack_msg_kpi_reminder,
                        slack_msg_voice_feedback: company.slack_msg_voice_feedback
                    }
                })
            });
            if (res.ok) {
                toast.success("プレビュー通知を送信しました。Slackをご確認ください");
            } else {
                const data = await res.json();
                toast.error(`送信失敗: ${data.error || "詳細不明"}`);
            }
        } catch (e: any) {
            toast.error(`エラーが発生しました: ${e.message}`);
        }
    };

    // 各個別フラグ切り替えハンドラー
    const toggleNotifyFlag = (chan: SlackChannel, flagKey: keyof SlackChannel) => {
        const updated = { ...chan, [flagKey]: !chan[flagKey] };
        // 状態をローカルに即座反映
        setChannels(prev => prev.map(c => c.id === chan.id ? updated as SlackChannel : c));
        // バックエンドに保存
        handleUpdateChannel(updated as SlackChannel);
    };

    return (
        <div className="space-y-12 animate-in fade-in pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Slackチャンネル一覧 & RLS設定 */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Link2 className="w-5 h-5 text-teal" /> Slack 連携チャンネル
                                <a
                                    href="/docs/slack-integration"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-slate-400 hover:text-teal transition-colors flex items-center gap-0.5 ml-2"
                                >
                                    <HelpCircle className="w-3 h-3" /> ヘルプ
                                </a>
                            </h2>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-teal text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-teal-600 transition-all flex items-center gap-1.5 shadow-md shadow-teal-100 active:scale-[0.97]"
                            >
                                <Plus className="w-3.5 h-3.5" /> チャンネル追加
                            </button>
                        </div>

                        {loading ? (
                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-16 text-center space-y-3 flex flex-col items-center justify-center">
                                <RefreshCw className="w-8 h-8 text-teal animate-spin" />
                                <p className="text-xs text-slate-500 font-bold">チャンネル情報をロード中...</p>
                            </div>
                        ) : channels.length === 0 ? (
                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center space-y-4">
                                <Link2 className="w-10 h-10 text-slate-300 mx-auto" />
                                <div>
                                    <h3 className="text-sm font-black text-slate-700">Slack連携が未設定です</h3>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                                        右上の「チャンネル追加」から、全社や部署別のSlack Incoming Webhookを登録して、自動通知や「AI参謀」機能を有効にしましょう。
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {channels.map((chan) => {
                                    const icon = chan.channel_type === 'company' ? '🏢' : chan.channel_type === 'executive' ? '👑' : chan.channel_type === 'department' ? '👥' : '📌';
                                    const badgeLabel = chan.channel_type === 'company' ? '全社' : chan.channel_type === 'executive' ? '経営陣' : chan.channel_type === 'department' ? '部署別' : 'カスタム';
                                    const isDeptMissing = chan.channel_type === 'department' && !departments.some(d => d.id === chan.department_id);

                                    return (
                                        <div key={chan.id} className="bg-white border border-slate-200 hover:border-slate-300 transition-all rounded-3xl p-6 shadow-sm space-y-5">
                                            {/* ヘッダー情報 */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-lg">{icon}</span>
                                                        <h3 className="text-sm font-black text-slate-800">{chan.name}</h3>
                                                        <span className={cn(
                                                            "text-[9px] font-black px-2 py-0.5 rounded-md border tracking-wider",
                                                            chan.channel_type === 'company' ? "bg-teal-50 border-teal-200 text-teal" :
                                                            chan.channel_type === 'executive' ? "bg-indigo-50 border-indigo-200 text-indigo" :
                                                            chan.channel_type === 'department' ? "bg-amber-50 border-amber-200 text-amber-600" :
                                                            "bg-slate-50 border-slate-200 text-slate-500"
                                                        )}>
                                                            {badgeLabel}
                                                        </span>
                                                        {chan.channel_type === 'department' && (
                                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                                                                {departments.find(d => d.id === chan.department_id)?.name || "所属部署不明"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs sm:max-w-md">
                                                        {chan.webhook_url.substring(0, 45)}...
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleTestChannel(chan.id)}
                                                        disabled={testing === chan.id}
                                                        className="text-[10px] font-black bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                                                    >
                                                        {testing === chan.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "テスト"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteChannel(chan.id)}
                                                        className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="削除"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 通知のオン・オフコントロール */}
                                            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">配信通知設定</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                                                    {/* AI分析サマリー */}
                                                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-800 transition-colors py-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={chan.notify_ai_summary}
                                                            onChange={() => toggleNotifyFlag(chan, 'notify_ai_summary')}
                                                            className="w-4 h-4 rounded text-teal border-slate-200 outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                        />
                                                        <span>AI分析サマリー</span>
                                                    </label>

                                                    {/* 異常スコアアラート */}
                                                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-800 transition-colors py-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={chan.notify_anomaly_alert}
                                                            onChange={() => toggleNotifyFlag(chan, 'notify_anomaly_alert')}
                                                            className="w-4 h-4 rounded text-teal border-slate-200 outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                        />
                                                        <span>異常スコアアラート</span>
                                                    </label>

                                                    {/* ボイスチェック催促 */}
                                                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-800 transition-colors py-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={chan.notify_voice_check_reminder}
                                                            onChange={() => toggleNotifyFlag(chan, 'notify_voice_check_reminder')}
                                                            className="w-4 h-4 rounded text-teal border-slate-200 outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                        />
                                                        <span>ボイスチェック催促</span>
                                                    </label>

                                                    {/* KPI実績リマインド */}
                                                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-800 transition-colors py-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={chan.notify_kpi_reminder}
                                                            onChange={() => toggleNotifyFlag(chan, 'notify_kpi_reminder')}
                                                            className="w-4 h-4 rounded text-teal border-slate-200 outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                        />
                                                        <span>KPI入力催促</span>
                                                    </label>

                                                    {/* 組織方針更新 */}
                                                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-800 transition-colors py-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={chan.notify_policy_update}
                                                            onChange={() => toggleNotifyFlag(chan, 'notify_policy_update')}
                                                            className="w-4 h-4 rounded text-teal border-slate-200 outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                        />
                                                        <span>組織方針更新</span>
                                                    </label>

                                                    {/* 参謀フィードバック */}
                                                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-slate-800 transition-colors py-0.5 col-span-1 sm:col-span-2 border-t border-slate-100 pt-2 mt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={chan.notify_voice_check_feedback}
                                                            onChange={() => toggleNotifyFlag(chan, 'notify_voice_check_feedback')}
                                                            className="w-4 h-4 rounded text-teal border-slate-200 outline-none focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                        />
                                                        <span className="flex items-center gap-1.5">
                                                            AI参謀フィードバック
                                                            <span className="text-[8px] font-black text-teal bg-teal-50 px-1.5 py-0.2 rounded-full border border-teal-200 animate-pulse">New</span>
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 異常検知閾値設定（既存維持） */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6 mt-8">
                            <div className="border-t border-slate-200/50 pt-1">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-teal" /> 異常検知アラートの閾値 (AI分析時)
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-[10px] font-bold text-slate-500">
                                            {company?.anomaly_alert_enabled !== false ? "通知オン" : "通知オフ"}
                                        </span>
                                        <div
                                            onClick={() => setCompany({ ...company, anomaly_alert_enabled: !(company?.anomaly_alert_enabled !== false) })}
                                            className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${
                                                company?.anomaly_alert_enabled !== false ? "bg-teal" : "bg-slate-300"
                                            }`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow m-0.5 transition-transform absolute left-0 top-0 ${
                                                company?.anomaly_alert_enabled !== false ? "translate-x-5" : "translate-x-0"
                                            }`} />
                                        </div>
                                    </label>
                                </div>
                                <div className={cn(
                                    "grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-300",
                                    company?.anomaly_alert_enabled === false && "opacity-40 pointer-events-none grayscale-[0.5]"
                                )}>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">絶対値下限（体温スコアがこの値を下回ったら検知）</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={company?.anomaly_threshold_absolute ?? 60}
                                                onChange={(e) => setCompany({ ...company, anomaly_threshold_absolute: parseInt(e.target.value) })}
                                                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">点</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">前月比下落（前月より何ポイント下がったら検知）</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="50"
                                                value={company?.anomaly_threshold_drop ?? 10}
                                                onChange={(e) => setCompany({ ...company, anomaly_threshold_drop: parseInt(e.target.value) })}
                                                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">pt</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">部門別乖離（全社平均との差がこの値を超えたら検知）</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={company?.anomaly_threshold_gap ?? 20}
                                                onChange={(e) => setCompany({ ...company, anomaly_threshold_gap: parseInt(e.target.value) })}
                                                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">pt</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-3 ml-1 leading-relaxed">
                                    全社平均スコアがこの閾値を超えた変動を検知した場合、管理者・経営層（admin / executive ロール）が通知を有効化している全チャンネル（全社・経営陣宛て）にアラートが通知されます。
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveIntegration}
                                    className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg active:scale-[0.98]"
                                >
                                    <Save className="w-4 h-4" /> 閾値設定を保存する
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* プレビュー & クイックアクション & カスタマイズ */}
                <div className="space-y-8">
                    {/* 通知文面カスタマイズ（既存維持＋参謀フィードバック新規追加） */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BellRing className="w-5 h-5 text-teal" /> 通知文面のカスタマイズ
                        </h2>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                            <p className="text-xs text-slate-500 -mt-2 leading-relaxed">
                                各通知のSlackメッセージ文言を変更できます。空欄にするとシステム初期値が使用されます。
                            </p>

                            {/* 各通知タイプのテキストエリア */}
                            {[
                                { key: "slack_msg_ai_summary",    label: "AI分析完了通知",        defaultKey: "ai_summary" },
                                { key: "slack_msg_anomaly_alert", label: "異常スコアアラート",     defaultKey: "anomaly_alert", hint: "※この後に検知された詳細リストが自動で続きます" },
                                { key: "slack_msg_voice_check",   label: "ボイスチェックリマインド", defaultKey: "voice_check" },
                                { key: "slack_msg_kpi_reminder",  label: "KPI実績入力リマインド",  defaultKey: "kpi_reminder" },
                                { key: "slack_msg_voice_feedback", label: "AI参謀フィードバック ✦New", defaultKey: "voice_feedback", hint: "※この後にAI参謀による解説・分析が自動で続きます" },
                            ].map(({ key, label, defaultKey, hint }) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</label>
                                            {hint && <span className="text-[9px] text-teal-500 font-bold">{hint}</span>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCompany({ ...company, [key]: null })}
                                            className="text-[10px] font-bold text-teal/60 hover:text-teal underline transition-colors"
                                        >
                                            デフォルトに戻す
                                        </button>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={company?.[key] ?? (SLACK_MESSAGE_DEFAULTS as any)[defaultKey]}
                                        onChange={(e) => setCompany({ ...company, [key]: e.target.value })}
                                        placeholder={(SLACK_MESSAGE_DEFAULTS as any)[defaultKey]}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[11px] text-slate-600 outline-none focus:border-teal resize-none font-mono leading-relaxed shadow-sm"
                                    />
                                </div>
                            ))}

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveIntegration}
                                    className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg active:scale-[0.98]"
                                >
                                    <Save className="w-4 h-4" /> 文面設定を保存する
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 通知プレビュー（既存維持） */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-teal" /> 通知プレビュー
                        </h2>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4">
                            <p className="text-[11px] text-slate-500 mb-4">
                                実際に配信される通知のサンプルをSlackへ送信して確認できます（通知有効のチャンネル宛てに送信されます）。
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={() => handlePreviewNotification('ai_summary')}
                                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-teal hover:bg-teal/5 transition-all text-xs font-bold text-slate-700 shadow-sm"
                                >
                                    <span>AI分析完了通知 のサンプル</span>
                                    <div className="flex items-center gap-1 text-teal">送信 <Save className="w-3 h-3" /></div>
                                </button>
                                <button 
                                    onClick={() => handlePreviewNotification('anomaly_alert')}
                                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-rose-300 hover:bg-rose-50 transition-all text-xs font-bold text-slate-700 shadow-sm"
                                >
                                    <span>異常検知アラート のサンプル</span>
                                    <div className="flex items-center gap-1 text-rose-500">送信 <AlertCircle className="w-3 h-3" /></div>
                                </button>
                                <button 
                                    onClick={() => handlePreviewNotification('voice_check_reminder')}
                                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-amber-300 hover:bg-amber-50 transition-all text-xs font-bold text-slate-700 shadow-sm"
                                >
                                    <span>回答催促メッセージ のサンプル</span>
                                    <div className="flex items-center gap-1 text-amber-600">送信 <BellRing className="w-3 h-3" /></div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 手動催促アクション（既存維持） */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BellRing className="w-5 h-5 text-amber-500" /> 手動アクション
                        </h2>
                        <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-amber-800">未回答者への一斉催促</h3>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded-full">ボイスチェックリマインド設定を使用</span>
                                </div>
                                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                    今月のボイスチェック（アンケート）にまだ回答していないメンバー全員に対して、Slackで一斉に催促メッセージを送信します。
                                </p>
                                <div className="pt-2">
                                    <button
                                        onClick={handleRemindVoiceCheck}
                                        className="bg-amber-500 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 flex items-center gap-2 text-sm active:scale-[0.98]"
                                    >
                                        <BellRing className="w-4 h-4" /> 今すぐ催促を送る
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-amber-200 pt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-amber-800">KPI未入力部署へのリマインド</h3>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded-full">KPI実績入力リマインド設定を使用</span>
                                </div>
                                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                    前月分のKPIが未入力の部署を検知し、その部署のマネージャーにSlackでリマインドを送信します。マネージャーが未設定の場合は、管理者・経営層（admin / executive ロール）にフォールバック通知されます。
                                </p>
                                <div className="pt-2">
                                    <button
                                        onClick={handleRemindKpi}
                                        className="bg-amber-100 text-amber-800 border border-amber-200 px-8 py-3.5 rounded-2xl font-bold hover:bg-amber-200 transition-all flex items-center gap-2 text-sm active:scale-[0.98]"
                                    >
                                        <BellRing className="w-4 h-4 text-amber-600" /> KPI入力を催促する
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================================
                新規追加用モーダルダイアログ (Glassmorphism & Slide-in)
               ===================================================== */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="fixed inset-0" 
                        onClick={() => setIsAddModalOpen(false)} 
                    />
                    <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full space-y-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative z-10 border border-slate-100">
                        {/* モーダルヘッダー */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center">
                                    <Link2 className="w-5 h-5 text-teal" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800">Slack チャンネル追加</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Add Slack Channel</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* モーダルフォーム */}
                        <form onSubmit={handleAddChannel} className="space-y-5">
                            {/* タイプ選択 */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase ml-1">チャンネルタイプ</label>
                                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                    {[
                                        { type: 'department', label: '👥 部署別' },
                                        { type: 'company',    label: '🏢 全社' },
                                        { type: 'executive',  label: '👑 経営陣' },
                                        { type: 'custom',     label: '📌 カスタム' }
                                    ].map(({ type, label }) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewChanType(type as any)}
                                            className={cn(
                                                "py-3 px-4 border rounded-2xl transition-all active:scale-[0.97]",
                                                newChanType === type 
                                                    ? "bg-teal/5 border-teal text-teal shadow-sm" 
                                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 部署指定（部署別チャンネルの場合のみ表示） */}
                            {newChanType === 'department' && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase ml-1">対象の部署</label>
                                    {departments.length === 0 ? (
                                        <p className="text-xs text-rose-500 font-bold ml-1">⚠️ 部署が登録されていません。先に部署タブで登録してください。</p>
                                    ) : (
                                        <select
                                            value={newChanDeptId}
                                            onChange={(e) => setNewChanDeptId(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:border-teal appearance-none shadow-sm cursor-pointer"
                                        >
                                            {departments.map((d) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* チャンネル名（基本は自動セット、カスタムや調整可能） */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase ml-1">チャンネル表示名</label>
                                <input
                                    type="text"
                                    required
                                    value={newChanName}
                                    onChange={(e) => setNewChanName(e.target.value)}
                                    placeholder="営業部チャンネル など"
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:border-teal shadow-sm"
                                />
                            </div>

                            {/* Incoming Webhook URL */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase ml-1 flex items-center gap-1">
                                    Incoming Webhook URL
                                    <SlackHelpTooltip mode="webhook" />
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        required
                                        value={newChanUrl}
                                        onChange={(e) => setNewChanUrl(e.target.value)}
                                        placeholder="https://hooks.slack.com/services/..."
                                        className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-mono text-slate-600 outline-none focus:border-teal shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleTestUnsavedUrl}
                                        disabled={newChanTesting}
                                        className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 px-4 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
                                    >
                                        {newChanTesting ? <RefreshCw className="w-4 h-4 animate-spin text-teal" /> : "テスト"}
                                    </button>
                                </div>
                            </div>

                            {/* モーダルCTA */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={newChanTesting || (newChanType === 'department' && departments.length === 0)}
                                    className="flex-1 py-4 bg-teal text-white rounded-2xl text-xs font-bold hover:bg-teal-600 transition-all shadow-md shadow-teal-100 disabled:opacity-50"
                                >
                                    連携を保存する
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
