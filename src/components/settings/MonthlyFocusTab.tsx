"use client";

import { useEffect, useState } from "react";
import { Sparkles, Save, Calendar, HelpCircle, History } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils/index";

interface FocusEntry {
    id?: string;
    month: string;        // YYYY-MM
    title: string;
    content: string;
    updated_at?: string;
}

interface MonthlyFocusTabProps {
    companyId: string | undefined;
}

export const MonthlyFocusTab = ({ companyId }: MonthlyFocusTabProps) => {
    const supabase = createClient();
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [selectedMonth, setSelectedMonth] = useState<string>(currentYM);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [history, setHistory] = useState<FocusEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 過去6ヶ月＋今月の選択肢
    const monthOptions = (() => {
        const opts: { ym: string; label: string }[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = i === 0 ? `${ym}（今月）` : ym;
            opts.push({ ym, label });
        }
        return opts;
    })();

    useEffect(() => {
        if (companyId) fetchHistory();
    }, [companyId]);

    useEffect(() => {
        // 選択月のデータをロード
        const found = history.find(h => h.month === selectedMonth);
        setTitle(found?.title || "");
        setContent(found?.content || "");
    }, [selectedMonth, history]);

    const fetchHistory = async () => {
        if (!companyId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('executive_monthly_focus')
            .select('id, month, title, content, updated_at')
            .eq('company_id', companyId)
            .order('month', { ascending: false });
        if (error) {
            toast.error(`履歴の取得に失敗しました: ${error.message}`);
        } else {
            setHistory(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!companyId) return;
        if (!title.trim()) { toast.error("タイトルを入力してください"); return; }
        if (!content.trim()) { toast.error("内容を入力してください"); return; }

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('executive_monthly_focus')
            .upsert({
                company_id: companyId,
                month: selectedMonth,
                title: title.trim(),
                content: content.trim(),
                created_by: user?.id || null,
            }, { onConflict: 'company_id,month' });

        if (error) {
            toast.error(`保存に失敗しました: ${error.message}`);
        } else {
            toast.success(`${selectedMonth} の今月の課題を保存しました`);
            await fetchHistory();
        }
        setSaving(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal" /> 今月の課題
                    <a
                        href="/docs/monthly-focus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-teal transition-colors"
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                        ヘルプ
                    </a>
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                    経営層として今月特に注目している課題を記録します。プレイヤー向けの「組織の温度」ページに公開されます。
                </p>

                {/* 編集フォーム */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-7 space-y-5">
                    {/* 月セレクター */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            対象月
                        </label>
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full md:w-64 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal appearance-none"
                            >
                                {monthOptions.map(o => (
                                    <option key={o.ym} value={o.ym}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* タイトル */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">
                            タイトル（短く一文で）
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="例：下期は粗利重視で進める"
                            maxLength={100}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 ml-1">{title.length} / 100</p>
                    </div>

                    {/* 内容 */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">
                            詳細・背景
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="経営層として今月、なぜこの課題に注目しているか。社員に伝えたい背景や意図を記述します。"
                            rows={6}
                            maxLength={1000}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-teal resize-y"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 ml-1">{content.length} / 1000</p>
                    </div>

                    {/* 保存ボタン */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving || !title.trim() || !content.trim()}
                            className={cn(
                                "flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all",
                                saving
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-teal text-white hover:bg-teal-600 shadow-lg shadow-teal/20"
                            )}
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "保存中..." : "保存する"}
                        </button>
                    </div>
                </div>

                {/* 履歴 */}
                <div className="mt-10">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-400" />
                        過去の登録履歴
                    </h3>
                    {loading ? (
                        <p className="text-xs text-slate-400">読み込み中...</p>
                    ) : history.length === 0 ? (
                        <p className="text-xs text-slate-400 bg-slate-50 px-5 py-4 rounded-2xl">まだ登録履歴がありません。</p>
                    ) : (
                        <div className="space-y-2">
                            {history.map(h => (
                                <button
                                    key={h.id}
                                    onClick={() => setSelectedMonth(h.month)}
                                    className={cn(
                                        "w-full text-left bg-white border rounded-2xl px-5 py-4 transition-all hover:bg-slate-50",
                                        h.month === selectedMonth ? "border-teal/40 ring-2 ring-teal/10" : "border-slate-100"
                                    )}
                                >
                                    <div className="flex items-baseline gap-3 mb-1">
                                        <span className="text-[10px] font-black text-teal uppercase tracking-widest">{h.month}</span>
                                        <span className="text-sm font-black text-slate-800">{h.title}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium line-clamp-2">{h.content}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
