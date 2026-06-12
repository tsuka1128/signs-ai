"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { resolveAllDepartmentsHeadcounts } from "@/lib/headcount";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import {
    Save,
    Copy,
    Check,
    Share2,
    FileText,
    MessageSquare,
    ClipboardList,
    HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils/index";
import { toast } from "sonner";

/**
 * ボイスチェック運用ページ
 * アンケートの配布（URLコピー）と、部署ごとの回答状況（回答率）の確認、期限設定を行います。
 */
export default function VoiceCheckPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState<any>(null);
    const [depts, setDepts] = useState<any[]>([]);
    const [voiceCheckStats, setVoiceCheckStats] = useState<Record<string, number>>({});
    const [copied, setCopied] = useState(false);
    const [copiedTemplate, setCopiedTemplate] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // Get company_id
            const { data: userData } = await supabase.from('users').select('company_id, role').eq('id', user.id).single();
            
            // 管理者以外で会社に所属していない場合は処理中断
            if (!userData?.company_id && userData?.role !== 'super_admin') {
                router.push("/");
                return;
            }

            // Role check: Only admin and super_admin allowed
            if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
                router.push("/");
                return;
            }

            // 代理ログイン ID の調整 (super_admin ロールを最優先)
            let effectiveId = userData?.company_id;
            const isSuperAdmin = userData?.role === 'super_admin';

            if (isSuperAdmin && typeof window !== "undefined") {
                const impersonatedId = localStorage.getItem("impersonated_company_id");
                if (impersonatedId) {
                    effectiveId = impersonatedId;
                }
            }

            if (!effectiveId) {
                setLoading(false);
                return;
            }

            // Load Voice Check stats for current month
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // Load company, departments, and resolved headcounts
            const [comp, d, headcounts] = await Promise.all([
                supabase.from('companies').select('*').eq('id', effectiveId).single(),
                supabase.from('departments').select('*').eq('company_id', effectiveId).order('sort_order', { ascending: true }),
                resolveAllDepartmentsHeadcounts(supabase, effectiveId, currentMonth)
            ]);

            if (comp.data) setCompany(comp.data);
            if (d.data) {
                const updatedDepts = d.data.map((dept: any) => ({
                    ...dept,
                    resolvedHeadcount: headcounts[dept.id] || 0
                }));
                setDepts(updatedDepts);
            }

            const { data: respData } = await supabase
                .from('survey_responses')
                .select('department_id')
                .eq('company_id', effectiveId)
                .eq('recorded_month', currentMonth);

            if (respData) {
                const stats: Record<string, number> = {};
                (respData as any[]).forEach((r: any) => {
                    if (r.department_id) {
                        stats[r.department_id] = (stats[r.department_id] || 0) + 1;
                    }
                });
                setVoiceCheckStats(stats);
            }

            setLoading(false);
        }
        loadData();
    }, [router]);

    const handleSaveDeadline = async () => {
        const supabase = createClient();
        const { error } = await supabase.from('companies').update({
            survey_deadline_day: company.survey_deadline_day
        }).eq('id', company.id);

        if (!error) toast.success("回答期限を保存しました");
        else toast.error(`保存に失敗しました: ${error.message}`);
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;

    return (
        <AppLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 text-teal" />
                        ボイスチェック運用
                        <a
                            href="/docs/voice-check"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-teal transition-colors"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            ヘルプ
                        </a>
                    </h1>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">アンケートの配布と回答状況の管理</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="space-y-12 animate-in fade-in">
                        {/* 配布セクション */}
                        <section className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                                    <Share2 className="w-5 h-5 text-teal" /> アンケートを配布する
                                </h2>
                                <p className="text-xs text-slate-500">メンバーがログイン不要で回答できる専用URLを共有しましょう。</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">回答用URL</label>
                                        <Badge className="bg-teal/10 text-teal border-none text-[9px]">ログイン不要</Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 truncate">
                                            {typeof window !== "undefined" ? `${window.location.origin}/form?c=${company?.short_id}` : ""}
                                        </code>
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/form?c=${company?.short_id}`;
                                                navigator.clipboard.writeText(url);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-teal-50 hover:border-teal-200 transition-all shadow-sm group"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-teal" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-teal" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">※ このURLからアクセスすると、所属部署の選択からスムーズに開始できます。</p>
                                </div>

                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">案内テキスト</label>
                                        <span className="text-[9px] font-bold text-slate-400">Slack / メール用</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/form?c=${company?.short_id}`;
                                            const text = `お疲れ様です！今月のボイスチェック（アンケート）の回答をお願いします。\n\n【回答期限：${new Date().getMonth() + 1}月${company?.survey_deadline_day || 20}日】\n\n回答はこちらから（ログイン不要）：\n${url}\n\n※所要時間は5分程度です。率直な声をお聞かせください。`;
                                            navigator.clipboard.writeText(text);
                                            setCopiedTemplate(true);
                                            setTimeout(() => setCopiedTemplate(false), 2000);
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:border-teal-200 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {copiedTemplate ? <Check className="w-4 h-4 text-teal" /> : <FileText className="w-4 h-4 text-slate-400" />}
                                        {copiedTemplate ? "コピーしました！" : "案内文をクリップボードにコピー"}
                                    </button>
                                    <p className="text-[10px] text-slate-400 font-medium">※ 案内文には上記の回答用URLが含まれます。</p>
                                </div>
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">回答期限の設定</label>
                                        <span className="text-[9px] font-bold text-slate-400 tabular-nums">毎月</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={company?.survey_deadline_day || 20}
                                            onChange={(e) => setCompany({ ...company, survey_deadline_day: parseInt(e.target.value) || 1 })}
                                            className="w-20 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:border-teal outline-none transition-all tabular-nums"
                                        />
                                        <span className="text-sm font-bold text-slate-600">日 締め切り</span>
                                        <button
                                            onClick={handleSaveDeadline}
                                            className="ml-auto px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <Save className="w-3.5 h-3.5" /> 保存
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">※ 設定した日は、メンバーの回答画面にも「回答期限」として表示されます。</p>
                                </div>

                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">回答画面のプレビュー</label>
                                        <span className="text-[9px] font-bold text-slate-400">管理者用</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const url = `/form?c=${company?.short_id}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-teal hover:bg-teal-50 hover:border-teal-200 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <ClipboardList className="w-4 h-4" />
                                        ボイスチェックフォーム確認
                                    </button>
                                    <p className="text-[10px] text-slate-400 font-medium">※ メンバーが実際に回答する画面を別タブで開きます。</p>
                                </div>
                            </div>
                        </section>

                        {/* 回答状況セクション */}
                        <section className="space-y-6">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-teal" /> 今月の回答状況
                                    </h2>
                                    <p className="text-xs text-slate-500">{new Date().getFullYear()}年{new Date().getMonth() + 1}月の回答進捗を確認できます。</p>
                                </div>
                                <div className="flex items-end gap-6">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">回答期限まで</div>
                                        <div className="text-2xl font-black text-slate-800 tabular-nums flex items-baseline gap-1">
                                            {(() => {
                                                const now = new Date();
                                                const deadlineDay = company?.survey_deadline_day || 20;
                                                const deadlineDate = new Date(now.getFullYear(), now.getMonth(), deadlineDay);
                                                
                                                if (deadlineDate.getMonth() !== now.getMonth()) {
                                                    deadlineDate.setDate(0);
                                                }

                                                const diffTime = deadlineDate.getTime() - now.getTime();
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                
                                                if (diffDays < 0) return <span className="text-rose-500 text-sm font-bold">期限切れ</span>;
                                                return (
                                                    <>
                                                        <span>あと</span>
                                                        <span className={cn("text-2xl", diffDays <= 3 ? "text-rose-500" : "text-slate-800")}>{diffDays}</span>
                                                        <span className="text-sm">日</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">組織全体の回答率</div>
                                        <div className="text-2xl font-black text-teal tabular-nums">
                                            {(() => {
                                                const totalResp = Object.values(voiceCheckStats).reduce((a, b) => a + b, 0);
                                                const totalHead = depts.reduce((a, b) => a + (b.resolvedHeadcount || 0), 0);
                                                return totalHead > 0 ? Math.round((totalResp / totalHead) * 100) : 0;
                                            })()}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100/50">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">部署・チーム</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">回答数 / 在籍</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">進捗・回答率</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {depts.map(d => {
                                            const respCount = voiceCheckStats[d.id] || 0;
                                            const headcount = d.resolvedHeadcount || 0;
                                            const rate = headcount > 0 ? Math.min(100, Math.round((respCount / headcount) * 100)) : 0;
                                            
                                            return (
                                                <tr key={d.id} className="group hover:bg-white transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="font-bold text-slate-800">{d.name}</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <div className="font-black text-slate-700 tabular-nums">
                                                            {respCount} <span className="text-slate-300 font-medium">/</span> {headcount}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={cn(
                                                                        "h-full transition-all duration-1000",
                                                                        rate >= 80 ? "bg-teal" : rate >= 40 ? "bg-indigo-400" : "bg-slate-400"
                                                                    )}
                                                                    style={{ width: `${rate}%` }}
                                                                />
                                                            </div>
                                                            <div className="w-10 text-right text-xs font-black text-slate-500 tabular-nums">
                                                                {rate}%
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center font-medium italic">
                                ※ 回答率は組織の「体温」を測る重要なシグナルです。定期的な声がけで健全な対話を促進しましょう。
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
