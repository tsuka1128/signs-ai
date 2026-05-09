"use client";

import { useState, useEffect } from "react";
import { 
    HelpCircle, 
    Plus, 
    Trash2, 
    ChevronDown, 
    ChevronUp, 
    Info, 
    CheckCircle2, 
    AlertCircle,
    Eye,
    EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils/index";
import { createClient } from "@/lib/supabase";
import { DEFAULT_SURVEY_QUESTIONS } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";

interface Question {
    id: string;
    text: string;
    hint: string | null;
    sort_order: number;
    company_id: string | null;
    is_active: boolean;
}

interface SurveyTabProps {
    companyId: string;
}

export function SurveyTab({ companyId }: SurveyTabProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [showStandard, setShowStandard] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // カスタム設問の取得
    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('survey_questions')
                    .select('*')
                    .eq('company_id', companyId)
                    .order('sort_order', { ascending: true });

                if (error) throw error;
                setQuestions(data || []);
            } catch (err) {
                console.error("Error fetching custom questions:", err);
            } finally {
                setLoading(false);
            }
        };

        if (companyId) fetchQuestions();
    }, [companyId, supabase]);

    // 設問の追加
    const handleAddQuestion = () => {
        if (questions.length >= 3) return;

        const nextOrder = 12 + questions.length;
        const newQ: Question = {
            id: crypto.randomUUID(),
            text: "",
            hint: "",
            sort_order: nextOrder,
            company_id: companyId,
            is_active: true
        };
        setQuestions([...questions, newQ]);
    };

    // 入力値の変更
    const handleChange = (id: string, field: 'text' | 'hint' | 'is_active', value: string | boolean) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    // 削除
    const handleDelete = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    // 保存
    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            // 1. 既存のカスタム設問を一度削除（物理削除または、idが一致しないものを削除するロジック）
            // シンプルにするため、今回は upsert を使用
            
            // バリデーション: テキストが空のものは除外
            const validQuestions = questions.filter(q => q.text.trim() !== "");

            // 全件入れ替え（company_id 一致分を一度消して入れ直すか、個別に処理）
            // ここでは upsert で対応
            const { error: upsertErr } = await supabase
                .from('survey_questions')
                .upsert(validQuestions.map(q => ({
                    id: q.id,
                    company_id: companyId,
                    text: q.text,
                    hint: q.hint,
                    sort_order: q.sort_order,
                    is_active: q.is_active
                })));

            if (upsertErr) throw upsertErr;

            // 画面上のリストに存在しない（削除された）DB上の設問を消す
            const currentIds = validQuestions.map(q => q.id);
            const { error: deleteErr } = await supabase
                .from('survey_questions')
                .delete()
                .eq('company_id', companyId)
                .not('id', 'in', `(${currentIds.join(',')})`);

            if (deleteErr) throw deleteErr;

            setQuestions(validQuestions);
            setMessage({ type: 'success', text: "設問設定を保存しました。" });
        } catch (err: any) {
            console.error("Save error:", err);
            setMessage({ type: 'error', text: `保存に失敗しました: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold">読み込み中...</div>;

    return (
        <div className="space-y-10 animate-fadeIn">
            {/* Header */}
            <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-teal" />
                    ボイスチェック設問設定
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Voice Check Question Customization</p>
            </div>

            {/* Standard Questions (Read Only) */}
            <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                <button 
                    onClick={() => setShowStandard(!showStandard)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-teal" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-slate-700">標準設問 (11問)</p>
                            <p className="text-[10px] text-slate-400 font-bold">組織の「体温」を測るためのコア質問。変更不可。</p>
                        </div>
                    </div>
                    {showStandard ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showStandard && (
                    <div className="px-6 pb-6 pt-2 space-y-3 border-t border-slate-100 bg-white/50">
                        {DEFAULT_SURVEY_QUESTIONS.map((q, i) => (
                            <div key={q.id} className="flex items-start gap-4 p-3 rounded-xl bg-white border border-slate-100">
                                <span className="text-xs font-black text-slate-300 mt-0.5">Q{i+1}</span>
                                <div>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed">{q.text}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 italic">{q.hint}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Questions Section */}
            <div className="space-y-6">
                <div className="flex items-end justify-between">
                    <div>
                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            オリジナル質問
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-400">最大3問</Badge>
                        </h4>
                        <p className="text-[11px] text-slate-400 font-bold mt-1">自社特有の課題や文化に合わせた質問を追加できます。</p>
                    </div>
                    <button
                        onClick={handleAddQuestion}
                        disabled={questions.length >= 3}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
                            questions.length >= 3 
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                                : "bg-teal text-white shadow-md shadow-teal-100 hover:scale-105 active:scale-95"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        質問を追加
                    </button>
                </div>

                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-100 rounded-[2rem] p-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-6 h-6 text-slate-200" />
                            </div>
                            <p className="text-sm font-bold text-slate-300 italic">追加された質問はありません</p>
                        </div>
                    ) : (
                        questions.map((q, i) => (
                            <div key={q.id} className={cn(
                                "p-6 rounded-3xl border transition-all space-y-4",
                                q.is_active ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black">
                                            Q{12 + i}
                                        </div>
                                        <Badge variant="secondary" className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 font-black tracking-widest uppercase">Custom</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleChange(q.id, 'is_active', !q.is_active)}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                                q.is_active ? "text-teal hover:bg-teal-50" : "text-slate-400 hover:bg-slate-200"
                                            )}
                                            title={q.is_active ? "一時停止する" : "再開する"}
                                        >
                                            {q.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            {q.is_active ? "Active" : "Paused"}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">質問文</label>
                                        <input
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => handleChange(q.id, 'text', e.target.value)}
                                            placeholder="例：今のチームで最高の成果を出せると確信していますか？"
                                            className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ヒント文 (任意)</label>
                                        <input
                                            type="text"
                                            value={q.hint || ""}
                                            onChange={(e) => handleChange(q.id, 'hint', e.target.value)}
                                            placeholder="例：スキルだけでなく、信頼関係も含めて直感で答えてください。"
                                            className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 flex gap-4">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-black text-amber-900">カスタム設問運用のアドバイス</p>
                    <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed">
                        ボイスチェックは「継続的な変化」を追うためのものです。一度設定した質問を頻繁に変更すると、過去との比較ができなくなります。
                        最低でも3ヶ月〜半年は同じ設問で運用することをお勧めします。
                    </p>
                </div>
            </div>

            {/* Footer / Save Button */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                    {message && (
                        <div className={cn(
                            "flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl animate-fadeIn",
                            message.type === 'success' ? "text-teal bg-teal-50" : "text-rose-500 bg-rose-50"
                        )}>
                            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {message.text}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "px-10 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-slate-200",
                        saving ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                    )}
                >
                    {saving ? "保存中..." : "設定を保存する"}
                </button>
            </div>
        </div>
    );
}
