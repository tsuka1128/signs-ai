"use client";

import { Link2, Save, BellRing } from "lucide-react";
import { SlackHelpTooltip } from "@/components/ui/SlackHelpTooltip";

interface IntegrationTabProps {
    company: any;
    setCompany: (company: any) => void;
    handleTestClientSlackWebhook: () => void;
    handleSaveIntegration: () => void;
    handleRemindVoiceCheck: () => void;
}

export const IntegrationTab = ({
    company,
    setCompany,
    handleTestClientSlackWebhook,
    handleSaveIntegration,
    handleRemindVoiceCheck
}: IntegrationTabProps) => {
    return (
        <div className="space-y-12 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-teal" /> 外部連携
                    </h2>
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                        <div className="max-w-xl">
                            <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase flex items-center">
                                Slack Webhook URL
                                <SlackHelpTooltip mode="webhook" />
                            </label>
                            <p className="text-xs text-slate-500 mb-4 ml-1">
                                ここにSlackのIncoming Webhook URLを設定すると、AI分析の完了時やアンケートのリマインドが指定チャンネルに自動通知されます。
                            </p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="url"
                                        value={company?.slack_webhook_url || ""}
                                        onChange={(e) => setCompany({ ...company, slack_webhook_url: e.target.value })}
                                        placeholder="https://hooks.slack.com/services/..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono text-slate-600 outline-none focus:border-teal"
                                    />
                                </div>
                                <button
                                    onClick={handleTestClientSlackWebhook}
                                    className="bg-slate-200 text-slate-600 px-6 rounded-2xl font-bold hover:bg-slate-300 transition-all shadow-sm"
                                >
                                    Test
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveIntegration}
                            className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg"
                        >
                            <Save className="w-4 h-4" /> 連携設定を保存
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BellRing className="w-5 h-5 text-amber-500" /> クイックアクション
                    </h2>
                    <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 space-y-4">
                        <h3 className="text-sm font-black text-amber-800">未回答者への回答催促（Slack）</h3>
                        <p className="text-xs text-amber-700 font-medium leading-relaxed">
                            今月のボイスチェック（アンケート）にまだ回答していないメンバー全員に対して、Slackで一斉に催促メッセージを送信します。
                        </p>
                        <div className="pt-2">
                            <button
                                onClick={handleRemindVoiceCheck}
                                className="bg-amber-500 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 flex items-center gap-2 text-sm"
                            >
                                <BellRing className="w-4 h-4" /> 未回答者に催促を送る
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
