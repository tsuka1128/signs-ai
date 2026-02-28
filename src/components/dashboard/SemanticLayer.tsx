"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Bot, Send, CheckCircle2, X } from "lucide-react";

// AIによる部署ごとの配慮ある通知メッセージのデモデータ
const aiNotifications = [
    {
        id: "sales",
        dept: "営業部",
        icon: "💼",
        color: "bg-rose-50 text-rose-600 border-rose-100",
        message: "今月も本当にお疲れ様です🍵\nアンケートから「社内調整の多さ」に苦労している声が多く届いており、経営陣も現在の負荷を重く受け止めています。\n\nそこで来月からは方針を変更し、「商談の量より、有効リードへの集中」へ舵を切り、皆さんの無理な負担を下げる決定をしました。少しずつ改善していくので、まずは休んでくださいね。"
    },
    {
        id: "mktg",
        dept: "マーケ部",
        icon: "📢",
        color: "bg-teal-50 text-teal-600 border-teal-100",
        message: "安定したリード獲得、素晴らしい成果です✨\n皆さんの自律的な連携と高い熱量が、今月の会社の数字を力強く支えてくれました。\n\n今後はこの成功パターンを全社に広げる「ハブ」としての役割も少しお願いできればと考えています。引き続きよろしくお願いします！"
    },
    {
        id: "dev",
        dept: "開発部",
        icon: "💻",
        color: "bg-amber-50 text-amber-600 border-amber-100",
        message: "毎日の仕様変更・リリース対応、本当にお疲れ様です🙇‍♂️\n現状、業務量が多すぎて「本来の開発への集中」が削がれている状況について、すぐに優先順位の再整理を行う方針としました。\n\n皆さんのクリエイティブな時間を守るため、まずは現在のタスクの棚卸しと削減から手を付けましょう。"
    }
];

interface PolicyLog {
    ver: string;
    date: string;
    phase: string;
    change: string;
}

interface Interpretation {
    q: string;
    a: string;
}

interface SemanticLayerProps {
    initialText: string;
    onSave: (text: string) => void;
}

const interpretations: Interpretation[] = [
    { q: "商談数が先月比で減少していますが…", a: "現フェーズは「質重視」に転換中。商談数の減少は想定内。成約率が20%以上を維持しているため、方針通りの推移と判断。" },
    { q: "プロダクトB gas数字が悪いのに体温が高いケースは？", a: "セマンティックレイヤーに「3月末まで改善なければピボット検討」と記載あり。現時点では仕込み期間として許容するが、期限を明示して経営層に報告。" },
    { q: "営業部がオーバーヒート状態ですが…", a: "前フェーズでは「踏ん張り時」として許容していたが、現フェーズでは「即座に介入」と方針変更済み。最優先アラートとして出力。" }
];

const logs: PolicyLog[] = [
    { ver: "v1.2", date: "2026/02/01", phase: "ユニットエコノミクス改善", change: "オーバーヒートを即介入に変更。成約率を最重要指標に昇格" },
    { ver: "v1.1", date: "2026/01/15", phase: "垂直立ち上げ（後期）", change: "プロダクトBに3月末の期限を設定。解約率の閾値を3%→即アラートに変更" },
    { ver: "v1.0", date: "2026/01/01", phase: "垂直立ち上げ", change: "初版。量重視。商談数を最大化。体温☔️は成長痛として許容" }
];

const VERSION_CONTENTS: Record<string, string> = {
    "v1.2": "", // Will be set by initialText
    "v1.1": `# 経営方針 v1.1 (2026年1月15日〜)

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
    "v1.0": `# 経営方針 v1.0 (2026年1月1日〜)

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

export function SemanticLayer({ initialText, onSave }: SemanticLayerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentText, setCurrentText] = useState(initialText);
    const [viewingVer, setViewingVer] = useState("v1.2");

    // モーダルと送信のステート
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    // 個別の編集と送信ステート
    const [editableNotifications, setEditableNotifications] = useState(aiNotifications);
    const [individualSending, setIndividualSending] = useState<Record<string, boolean>>({});
    const [individualSent, setIndividualSent] = useState<Record<string, boolean>>({});

    // Sync latest text
    useEffect(() => {
        setCurrentText(initialText);
    }, [initialText]);

    useEffect(() => {
        VERSION_CONTENTS["v1.2"] = currentText;
    }, [currentText]);

    const displayedText = viewingVer === "v1.2" ? currentText : VERSION_CONTENTS[viewingVer] || "";
    const updateDate = logs.find(l => l.ver === viewingVer)?.date || "2026/02/01";
    const isLatest = viewingVer === "v1.2";

    const handleSaveClick = () => {
        if (isEditing) {
            onSave(currentText);
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    };

    const handleOpenPreviewClick = () => {
        // 開くたびに状態をリセットする場合（今回は状態を維持）
        setShowPreviewModal(true);
    };

    const handleNotificationChange = (id: string, newMessage: string) => {
        setEditableNotifications(prev => prev.map(n => n.id === id ? { ...n, message: newMessage } : n));
    };

    const handleIndividualSend = (id: string) => {
        setIndividualSending(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setIndividualSending(prev => ({ ...prev, [id]: false }));
            setIndividualSent(prev => ({ ...prev, [id]: true }));
        }, 1000);
    };

    const handleConfirmSend = () => {
        setIsSending(true);
        // 送信シミュレーション（1.5秒）
        setTimeout(() => {
            setIsSending(false);
            setIsSent(true);

            // 一括送信時はすべてのアイテムを個別に送信完了状態にする
            const allSentStatus: Record<string, boolean> = {};
            aiNotifications.forEach(n => { allSentStatus[n.id] = true; });
            setIndividualSent(allSentStatus);

            onSave(currentText);
            // 2秒後にモーダルを閉じる
            setTimeout(() => {
                setIsSent(false);
                setIndividualSent({});
                setShowPreviewModal(false);
                setIsEditing(false);
            }, 2000);
        }, 1500);
    };

    return (
        <div className="space-y-4">
            {/* Overview Cards */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🧬</span>
                            <h4 className="text-sm font-bold text-slate-800">経営方針</h4>
                            <Badge className="bg-teal/10 text-teal border-none text-[10px]">AIの判断基準</Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            経営方針・KPIの解釈・組織のフェーズをMarkdownで記述。AIはこの文書を毎月の診断時に読み込み、数字の良し悪しを「あなたの会社の文脈」で判断します。
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-mint-light/50 border border-mint/20">
                        <div className="text-[10px] text-teal font-bold mb-1 uppercase tracking-wider">現在のフェーズ</div>
                        <div className="text-sm font-bold text-slate-800">ユニットエコノミクス改善期</div>
                        <div className="text-[10px] text-slate-400 mt-1">量→質への転換中</div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                        <div className="text-[10px] text-blue-600 font-bold mb-1 uppercase tracking-wider">最重要KPI</div>
                        <div className="text-sm font-bold text-slate-800">成約率 20%以上</div>
                        <div className="text-[10px] text-slate-400 mt-1">値引きに頼らない真の成約力</div>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                        <div className="text-[10px] text-rose-600 font-bold mb-1 uppercase tracking-wider">最優先アジェンダ</div>
                        <div className="text-sm font-bold text-slate-800">営業部の属人化解消</div>
                        <div className="text-[10px] text-slate-400 mt-1">トップ営業依存からの脱却</div>
                    </div>
                </div>
            </div>

            {/* AI Interpretation */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 border-l-4 border-teal shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-base">🧠</span>
                    <h5 className="text-sm font-bold text-slate-800 uppercase tracking-tight">AIはこう読み取っています</h5>
                </div>
                <div className="space-y-2">
                    {interpretations.map((item, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-1">
                            <div className="text-xs font-bold text-slate-800">Q. {item.q}</div>
                            <p className="text-xs text-slate-500 leading-relaxed">→ {item.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Policy Change Log */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-base">📜</span>
                    <h5 className="text-sm font-bold text-slate-800 uppercase tracking-tight">方針変遷ログ</h5>
                </div>
                <div className="space-y-2">
                    {logs.map((log, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setViewingVer(log.ver);
                                setIsEditing(false);
                            }}
                            className={cn(
                                "w-full text-left flex gap-4 p-3 rounded-xl items-start transition-all border",
                                viewingVer === log.ver ? "bg-teal/5 border-teal/20" : "bg-slate-50 border-transparent hover:border-slate-200"
                            )}
                        >
                            <div className="min-w-[48px]">
                                <div className={cn("text-xs font-bold", viewingVer === log.ver ? "text-teal" : "text-slate-400")}>{log.ver}</div>
                                <div className="text-[9px] text-slate-400">{log.date}</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-slate-800">{log.phase}</div>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{log.change}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-base">✏️</span>
                        <h5 className="text-sm font-bold text-slate-800">経営方針メモ <span className="text-slate-400 ml-1">{updateDate} 更新</span></h5>
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
                                        onClick={handleOpenPreviewClick}
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
                            {editableNotifications.map((note) => (
                                <div key={note.id} className="space-y-2 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{note.icon}</span>
                                            <span className="text-xs font-black text-slate-700">{note.dept}への通知予定案</span>
                                        </div>
                                        <button
                                            onClick={() => handleIndividualSend(note.id)}
                                            disabled={individualSending[note.id] || individualSent[note.id] || isSending || isSent}
                                            className={cn("px-3 py-1.5 text-[10px] font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-sm",
                                                individualSent[note.id] ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
                                            )}
                                        >
                                            {individualSent[note.id] ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5" /> 送信済</>
                                            ) : individualSending[note.id] ? (
                                                <><span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> 送信中</>
                                            ) : (
                                                <><Send className="w-3 h-3" /> 個別に通知</>
                                            )}
                                        </button>
                                    </div>
                                    <textarea
                                        value={note.message}
                                        onChange={(e) => handleNotificationChange(note.id, e.target.value)}
                                        className={cn(
                                            "w-full p-4 rounded-2xl border text-[13px] leading-relaxed whitespace-pre-wrap font-medium min-h-[140px] resize-y outline-none focus:ring-2 focus:ring-teal/30 transition-all",
                                            note.color
                                        )}
                                    />
                                </div>
                            ))}

                            <div className="text-center py-2">
                                <p className="text-[10px] text-slate-400 font-bold">※その他の部署（HR・財務・CS）への通知は省略して表示しています</p>
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
