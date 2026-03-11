"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Bot, Send, CheckCircle2, X } from "lucide-react";

interface SemanticLayerProps {
    initialText: string;
    history?: any[];
    onSave: (text: string) => void;
}

const VERSION_CONTENTS: Record<string, string> = {
    "v1.2": "", // Will be set by initialText
    "v1.1": `# 組織方針 v1.1 (2026年1月15日〜)

## 組織の現在地
- フェーズ: 垂直立ち上げ（後期）
- 目標: 広範なリード獲得から質の選別へ移行開始
- 状況: 12月までの先行投資が実り始め、リード数は目標を大きく上回るペース。一方で、商談化率のバラつきが課題。

## KPIの解釈ガイド
- MRR: 月次15%成長を維持。一部の値引きキャンペーンを容認するが、LTVを意識。
- 商談数: 量から質への転換期。無効リードを弾き、有効商談率を15%以上に。
- 成約率: 18%以上を目標に。営業プロセスの標準化を開始。
- リード数: コンテンツマーケへの投資を倍増。質の高い潜在層にアプローチ。
- 解約率: 3%を超えたら即アラート設定。CSのリソースが限界に達しつつある。
- 解約金額: 大口アカウントの離脱だけは防ぐ。個別フォロー体制の構築。
- NPS: 30ptを目指す。まずは推奨者を10名以上生み出す。
- 機能利用率: オンボーディング完了率を先行指標として重視。
- 採用数: エンジニア採用が最優先。既存メンバーのリファラルを強化。

## 組織の注意点
- プロダクトBについて、3月末までに改善の兆候（チャーンレートの低下）が見られなければピボットを検討する。
- 営業と開発の月次MTGを定例化し、フィードバックループを強化。`,
    "v1.0": `# 組織方針 v1.0 (2026年1月1日〜)

## 組織の現在地
- フェーズ: 垂直立ち上げ
- 目標: とにかくマーケットシェアを獲る。商談数とリード数を最大化する
- スローガン: 「スピードこそが最大の価値」

## KPIの解釈ガイド
- MRR: 前月比20%以上の成長を死守。値引きによる獲得も戦略的に許容。
- 商談数: 最優先指標。日次で追う。目標達成のためなら多少のCPA悪化は許容。
- 成約率: 15%を最低ラインとする。まずは数をこなして改善ポイントを探る。
- リード数: 全方位。広告・SNS・イベント何でも試して数を集める。
- 解約率: 立ち上げ期のため4〜5%までは「成長痛」として許容する。
- 解約金額: 現時点では重視しない。まずは契約者数を増やす。
- NPS: 未計測。
- 機能利用率: まずは全機能を触ってもらう。利用時間でエンゲージメントを測る。
- 採用数: 全職種で大量採用。カルチャーよりもまずは実行力を重視。

## 組織の注意点
- 立ち上げ期のため、現場の負荷（体温☔️）はある程度「成長痛」として許容する。
- 全員が全プロダクトの売上に責任を持つ。`
};

export function SemanticLayer({ initialText, history = [], onSave }: SemanticLayerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentText, setCurrentText] = useState(initialText);
    const [viewingId, setViewingId] = useState<string | null>(null);
    const [showAllLogs, setShowAllLogs] = useState(false);

    // モーダルと送信のステート
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    // Sync latest text
    useEffect(() => {
        setCurrentText(initialText);
    }, [initialText]);

    const viewingRecord = history.find(h => h.id === viewingId);
    const displayedText = viewingId ? (viewingRecord?.content || "") : currentText;
    const updateDate = viewingId ? (viewingRecord ? new Date(viewingRecord.created_at).toLocaleDateString() : "-") : "最新";
    const isLatest = !viewingId;

    const handleSaveClick = () => {
        if (isEditing) {
            onSave(currentText);
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    };

    const handleConfirmSend = () => {
        setIsSending(true);
        // 保存のみ実行
        setTimeout(() => {
            setIsSending(false);
            setIsSent(true);

            onSave(currentText);
            // 2秒後にモーダルを閉じる
            setTimeout(() => {
                setIsSent(false);
                setShowPreviewModal(false);
                setIsEditing(false);
            }, 2000);
        }, 1000);
    };

    return (
        <div className="space-y-4">
            {/* Overview Cards */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🧬</span>
                            <h4 className="text-sm font-bold text-slate-800">組織方針</h4>
                            <Badge className="bg-teal/10 text-teal border-none text-[10px]">AIの判断基準</Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            組織方針・KPIの解釈・組織のフェーズをMarkdownで記述。AIはこの文書を毎月の診断時に読み込み、数字の良し悪しを「あなたの会社の文脈」で判断します。
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-mint-light/50 border border-mint/20">
                        <div className="text-[10px] text-teal font-bold mb-1 uppercase tracking-wider">現在のフェーズ</div>
                        <div className="text-sm font-bold text-slate-800">未設定 / 分析待ち</div>
                        <div className="text-[10px] text-slate-400 mt-1">AIが方針から抽出します</div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                        <div className="text-[10px] text-blue-600 font-bold mb-1 uppercase tracking-wider">最重要KPI</div>
                        <div className="text-sm font-bold text-slate-800">分析待ち</div>
                        <div className="text-[10px] text-slate-400 mt-1">方針に基づく重要指標を特定中</div>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                        <div className="text-[10px] text-rose-600 font-bold mb-1 uppercase tracking-wider">最優先アジェンダ</div>
                        <div className="text-sm font-bold text-slate-800">分析待ち</div>
                        <div className="text-[10px] text-slate-400 mt-1">直近のアクションを生成中</div>
                    </div>
                </div>
            </div>

            {/* AI Interpretation (Placeholder until AI implemented) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 border-l-4 border-slate-200 shadow-sm opacity-60">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-base grayscale">🧠</span>
                    <h5 className="text-sm font-bold text-slate-400 uppercase tracking-tight">AI分析シミュレーション</h5>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-400 text-center italic">
                            AIエンジン未接続です。フェーズ7の実装完了後、この方針テキストに基づいた自動的な課題抽出と、各部署への個別トーンでの方針伝達が可能になります。
                        </p>
                    </div>
                </div>
            </div>

            {/* Policy Change Log */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-base">📜</span>
                    <h5 className="text-sm font-bold text-slate-800 uppercase tracking-tight">方針変遷ログ</h5>
                </div>
                <div className="space-y-2">
                    <button
                        onClick={() => {
                            setViewingId(null);
                            setIsEditing(false);
                        }}
                        className={cn(
                            "w-full text-left flex gap-4 p-3 rounded-xl items-start transition-all border",
                            !viewingId ? "bg-teal/5 border-teal/20" : "bg-slate-50 border-transparent hover:border-slate-200"
                        )}
                    >
                        <div className="min-w-[48px]">
                            <div className={cn("text-xs font-bold", !viewingId ? "text-teal" : "text-slate-400")}>Latest</div>
                            <div className="text-[9px] text-slate-400">現在有効</div>
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-slate-800">最新の組織方針</div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">AI分析の基準として使用されているアクティブなバージョン</p>
                        </div>
                    </button>

                    {(showAllLogs ? history.slice(1) : history.slice(1, 5)).map((log, i) => (
                        <button
                            key={log.id}
                            onClick={() => {
                                setViewingId(log.id);
                                setIsEditing(false);
                            }}
                            className={cn(
                                "w-full text-left flex gap-4 p-3 rounded-xl items-start transition-all border",
                                viewingId === log.id ? "bg-teal/5 border-teal/20" : "bg-slate-50 border-transparent hover:border-slate-200"
                            )}
                        >
                            <div className="min-w-[48px]">
                                <div className={cn("text-xs font-bold", viewingId === log.id ? "text-teal" : "text-slate-400")}>v.prev</div>
                                <div className="text-[9px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-slate-800">過去の方針メモ</div>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                    {log.content.substring(0, 50)}...
                                </p>
                            </div>
                        </button>
                    ))}

                    {history.length > 5 && !showAllLogs && (
                        <button
                            onClick={() => setShowAllLogs(true)}
                            className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-teal transition-colors border-2 border-dashed border-slate-100 rounded-xl uppercase tracking-widest"
                        >
                            ＋ さらに {history.length - 5} 件の方針履歴を表示
                        </button>
                    )}
                </div>
            </div>

            {/* Editor Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-base">✏️</span>
                        <h5 className="text-sm font-bold text-slate-800">組織方針メモ <span className="text-slate-400 ml-1">{updateDate} 更新</span></h5>
                        {!isLatest && <Badge className="bg-slate-100 text-slate-400 border-none text-[9px] font-bold">アーカイブ表示中（編集不可）</Badge>}
                    </div>
                    {isLatest && (
                        <div className="flex gap-2">
                            {isEditing ? (
                                <button
                                    onClick={handleSaveClick}
                                    className="px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm bg-gradient-to-r from-teal to-mint text-dark"
                                >
                                    保存する
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveClick}
                                        className="px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                                    >
                                        編集する
                                    </button>
                                    <button
                                        onClick={() => setShowPreviewModal(true)}
                                        className="px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm bg-teal text-white flex gap-1 items-center hover:bg-teal-600"
                                    >
                                        <Send className="w-3 h-3" /> 各部署へ通知
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {isEditing && isLatest ? (
                    <textarea
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        className="w-full min-h-[400px] p-5 rounded-xl border-2 border-teal/30 focus:border-teal outline-none font-mono text-[13px] leading-relaxed bg-[#FAFFFE] text-slate-800 resize-none transition-all"
                    />
                ) : (
                    <div className={cn(
                        "p-5 rounded-xl font-mono text-[12px] leading-relaxed whitespace-pre-wrap min-h-[400px] overflow-y-auto scrollbar-hide border transition-all",
                        isLatest ? "bg-slate-50 border-slate-100 text-slate-700" : "bg-slate-100 border-slate-200 text-slate-400 grayscale-[0.5]"
                    )}>
                        {displayedText}
                    </div>
                )}

                <div className="flex justify-between items-center mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>最終集計: {updateDate} 09:30</span>
                    <span>{isLatest ? "次回の集計実行時にAIが再分析します" : "このバージョンは現在の分析には使用されていません"}</span>
                </div>
            </div>

            {/* AI Notification Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Bot className="w-5 h-5 text-teal" />
                                    <h3 className="text-lg font-black text-slate-800">各部署へのAI通知文プレビュー</h3>
                                </div>
                                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                                    更新された方針と、毎月の「組織体温・KPI状況」を掛け合わせ、<br />
                                    AIが各部署の状況に寄り添ったトーンで方針変更を個別通知（連携）します。
                                </p>
                            </div>
                            <button
                                onClick={() => !isSending && !isSent && setShowPreviewModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body / Previews */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
                            <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-3xl space-y-3">
                                <div className="text-3xl grayscale mb-2">🚥</div>
                                <p className="text-sm font-bold text-slate-600">AI通知機能は準備中です</p>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                                    現在は方針の「保存」のみ可能です。フェーズ7のAI実装完了後、ここに入力した方針から自動的に各部署向けの通知メッセージが生成・プレビューできるようになります。
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-white flex justify-end items-center gap-3">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                disabled={isSending || isSent}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                キャンセル
                            </button>

                            <button
                                onClick={handleConfirmSend}
                                disabled={isSending || isSent}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all text-white",
                                    isSent ? "bg-emerald-500" : "bg-gradient-to-r from-teal to-mint text-dark disabled:opacity-70"
                                )}
                            >
                                {isSent ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" /> 方針を保存・送信しました
                                    </>
                                ) : isSending ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-slate-800/20 border-t-slate-800 rounded-full animate-spin" />
                                        送信準備中...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" /> 方針を更新し、全部署に一括通知する
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
