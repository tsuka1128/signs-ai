"use client";

import { Link2, Save } from "lucide-react";
import { SlackHelpTooltip } from "@/components/ui/SlackHelpTooltip";

interface IntegrationTabProps {
    company: any;
    setCompany: (company: any) => void;
    handleTestClientSlackWebhook: () => void;
    handleSaveIntegration: () => void;
}

export const IntegrationTab = ({
    company,
    setCompany,
    handleTestClientSlackWebhook,
    handleSaveIntegration
}: IntegrationTabProps) => {
    return (
        <div className="space-y-8 animate-in fade-in">
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
                            ここにSlackのIncoming Webhook URLを設定すると、AI分析の完了時やアンケートのリマインドが指定チャンネルに自動通知されます。（連携機能）
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
        </div>
    );
};
