"use client";

import { Link2, Save, BellRing, AlertCircle, Eye } from "lucide-react";
import { SlackHelpTooltip } from "@/components/ui/SlackHelpTooltip";
import { SLACK_MESSAGE_DEFAULTS, SlackMessageKey } from "@/lib/slack-message-defaults";

interface IntegrationTabProps {
    company: any;
    setCompany: (company: any) => void;
    handleTestClientSlackWebhook: () => void;
    handleSaveIntegration: () => void;
    handleRemindVoiceCheck: () => void;
    handlePreviewNotification: (type: string) => void;
    handleRemindKpi: () => void;
}

export const IntegrationTab = ({
    company,
    setCompany,
    handleTestClientSlackWebhook,
    handleSaveIntegration,
    handleRemindVoiceCheck,
    handlePreviewNotification,
    handleRemindKpi
}: IntegrationTabProps) => {
    return (
        <div className="space-y-12 animate-in fade-in pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Slack連携 & 閾値設定 */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-teal" /> Slack 連携設定
                        </h2>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                            <div className="max-w-xl">
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase flex items-center gap-1">
                                    Slack Webhook URL
                                    <SlackHelpTooltip mode="webhook" />
                                </label>
                                <p className="text-[11px] text-slate-500 mb-4 ml-1">
                                    AI分析の完了時やリマインドが指定チャンネルに自動通知されます。
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={company?.slack_webhook_url || ""}
                                        onChange={(e) => setCompany({ ...company, slack_webhook_url: e.target.value })}
                                        placeholder="https://hooks.slack.com/services/..."
                                        className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-xs font-mono text-slate-600 outline-none focus:border-teal"
                                    />
                                    <button
                                        onClick={handleTestClientSlackWebhook}
                                        className="bg-white text-slate-600 px-6 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all text-xs"
                                    >
                                        接続テスト
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-6">
                                <label className="block text-[10px] font-bold text-slate-400 mb-4 ml-1 uppercase flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> 異常検知アラートの閾値 (AI分析時)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">絶対値下限</label>
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
                                        <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">前月比下落</label>
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
                                        <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">部門別乖離</label>
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
                                    全社平均スコアがこの閾値を下回るか、急激な変動があった場合にSlack通知が飛びます。
                                </p>
                            </div>

                            {/* 通知文面カスタマイズ */}
                            <div className="pt-6 border-t border-slate-200 space-y-6">
                                <h3 className="text-sm font-bold text-slate-700">通知文面のカスタマイズ</h3>
                                <p className="text-xs text-slate-500 -mt-4 leading-relaxed">
                                    各通知のSlackメッセージ文を変更できます。空欄にするとデフォルト文が使用されます。
                                </p>

                                {/* 各通知タイプのテキストエリア */}
                                {[
                                    { key: "slack_msg_ai_summary",    label: "AI分析完了通知",        defaultKey: "ai_summary" },
                                    { key: "slack_msg_anomaly_alert", label: "異常スコアアラート",     defaultKey: "anomaly_alert" },
                                    { key: "slack_msg_voice_check",   label: "ボイスチェックリマインド", defaultKey: "voice_check" },
                                    { key: "slack_msg_kpi_reminder",  label: "KPI実績入力リマインド",  defaultKey: "kpi_reminder" },
                                ].map(({ key, label, defaultKey }) => (
                                    <div key={key} className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</label>
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
                                            value={company?.[key] ?? SLACK_MESSAGE_DEFAULTS[defaultKey as SlackMessageKey]}
                                            onChange={(e) => setCompany({ ...company, [key]: e.target.value })}
                                            placeholder={SLACK_MESSAGE_DEFAULTS[defaultKey as SlackMessageKey]}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[11px] text-slate-600 outline-none focus:border-teal resize-none font-mono leading-relaxed shadow-sm"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveIntegration}
                                    className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg"
                                >
                                    <Save className="w-4 h-4" /> 設定を保存する
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* プレビュー & クイックアクション */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-teal" /> 通知プレビュー
                        </h2>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4">
                            <p className="text-[11px] text-slate-500 mb-4">
                                実際に配信される通知のサンプルをSlackへ送信して確認できます。
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

                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BellRing className="w-5 h-5 text-amber-500" /> 手動アクション
                        </h2>
                        <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-amber-800">未回答者への一斉催促</h3>
                                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                    今月のボイスチェック（アンケート）にまだ回答していないメンバー全員に対して、Slackで一斉に催促メッセージを送信します。
                                </p>
                                <div className="pt-2">
                                    <button
                                        onClick={handleRemindVoiceCheck}
                                        className="bg-amber-500 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 flex items-center gap-2 text-sm"
                                    >
                                        <BellRing className="w-4 h-4" /> 今すぐ催促を送る
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-amber-200 pt-6 space-y-4">
                                <h3 className="text-sm font-black text-amber-800">KPI未入力部署へのリマインド</h3>
                                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                    前月分のKPIがまだ入力されていない担当部署のマネージャーに対して、Slackで入力を促すメッセージを送信します。
                                </p>
                                <div className="pt-2">
                                    <button
                                        onClick={handleRemindKpi}
                                        className="bg-amber-100 text-amber-800 border border-amber-200 px-8 py-3.5 rounded-2xl font-bold hover:bg-amber-200 transition-all flex items-center gap-2 text-sm"
                                    >
                                        <BellRing className="w-4 h-4 text-amber-600" /> KPI入力を催促する
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
