"use client";
import { useState } from "react";
import { HelpCircle, X, ExternalLink } from "lucide-react";

interface SlackHelpTooltipProps {
    mode?: 'userId' | 'webhook';
}

export const SlackHelpTooltip = ({ mode = 'userId' }: SlackHelpTooltipProps) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="relative inline-block ml-1">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors inline-flex items-center"
                title={mode === 'userId' ? "Slack IDの確認方法" : "Webhook URLの確認方法"}
            >
                <HelpCircle className="w-3.5 h-3.5 text-teal/60" />
            </button>
            {isOpen && (
                <div className="absolute left-0 bottom-full mb-3 w-80 z-[60] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                    <div className="bg-slate-900/95 backdrop-blur-md text-white p-6 rounded-[2rem] shadow-2xl text-[13px] leading-relaxed border border-white/10">
                        <div className="flex justify-between items-start mb-4">
                            <span className="font-black text-teal-400 uppercase tracking-widest text-[9px]">
                                {mode === 'userId' ? "IDの取得手順" : "Webhookの取得手順"}
                            </span>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-3.5 h-3.5 text-slate-500" /></button>
                        </div>

                        {mode === 'userId' ? (
                            <div className="space-y-5">
                                <div>
                                    <p className="font-black mb-2 flex items-center gap-2 text-slate-100">
                                        <span className="w-2 h-2 rounded-full bg-teal-400" />
                                        自分のユーザーIDを確認する
                                    </p>
                                    <ol className="space-y-2 ml-4 list-decimal text-slate-400 font-bold">
                                        <li>Slack画面左下の写真をクリック</li>
                                        <li>「プロフィール」を選択</li>
                                        <li>「その他」（3つの点）をクリック</li>
                                        <li>「メンバーIDをコピー」を選択</li>
                                    </ol>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <p className="font-black mb-2 flex items-center gap-2 text-slate-100">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                        他のユーザーのIDを確認する
                                    </p>
                                    <ol className="space-y-2 ml-4 list-decimal text-slate-400 font-bold">
                                        <li>対象者のプロフィールを表示</li>
                                        <li>「その他」（3つの点）をクリック</li>
                                        <li>「メンバーIDをコピー」を選択</li>
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <p className="font-black mb-2 flex items-center gap-2 text-slate-100">
                                        <span className="w-2 h-2 rounded-full bg-teal-400" />
                                        Incoming Webhookを有効化
                                    </p>
                                    <ol className="space-y-2 ml-4 list-decimal text-slate-400 font-bold">
                                        <li>Slack AppディレクトリでApp作成</li>
                                        <li>「Incoming Webhooks」をオンに</li>
                                        <li>「Add New Webhook to Workspace」</li>
                                        <li>通知したいチャンネルを選択</li>
                                        <li>Webhook URLをコピーして貼り付け</li>
                                    </ol>
                                </div>
                                <a 
                                    href="/docs/slack-integration" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-teal-400 font-black hover:text-teal-300 transition-colors pt-2 border-t border-white/5"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" /> SignsAI セットアップガイドを確認
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
