"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { 
    Info, 
    Check, 
    Minus, 
    Zap, 
    ShieldCheck, 
    BarChart3, 
    Users, 
    Layers, 
    Clock,
    Target,
    BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPlansPage() {
    const { supabase, loading: authLoading } = useAdmin();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlans() {
            if (authLoading) return;
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('id', { ascending: true });
            
            if (!error) {
                // 表示順を Free -> Team -> Standard -> Pro に固定
                const order = ['Free', 'Team', 'Standard', 'Pro'];
                const sorted = (data || []).sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
                setPlans(sorted);
            }
            setLoading(false);
        }
        fetchPlans();
    }, [supabase, authLoading]);

    const featureRows = [
        { key: 'max_departments', label: '最大部署・拠点数', description: '一つの企業アカウント内で作成可能な部署の数です。', type: 'number' },
        { key: 'max_kpis', label: '最大KPI定義数', description: '追跡可能なKPI（独自指標）の最大数です。', type: 'number' },
        { key: 'max_headcount', label: '最大メンバー登録数', description: 'アカウントに招待可能な全ユーザーの合計上限です。', type: 'number' },
        { key: 'manual_ai_runs_per_month', label: '月間AI分析実行枠', description: '任意のタイミングで実行可能なAIダッシュボード生成の回数です。', type: 'number' },
        { key: 'ai_badge_frequency', label: 'AI自動解析 / バッジ更新', description: 'データの自動解析およびバッジへの反映頻度です。', type: 'frequency' },
        { key: 'enable_second_axis', label: '第2軸（担当領域）表示', description: '部署とは別の切り口（エリア、職種等）で集計・表示する機能です。', type: 'boolean' },
        { key: 'enable_slack', label: 'Slack連携通知', description: '回答のリマインドやAIレポートの通知をSlackへ送信します。', type: 'boolean' },
        { key: 'enable_labor_analytics', label: '人件費ROIダッシュボード', description: '人件費データとKPIを掛け合わせた、投資対効果の可視化機能です。', type: 'boolean' },
        { key: 'enable_pdf_export', label: 'PDFレポート書き出し', description: 'ダッシュボードの解析結果を定型PDFとして保存・共有可能です。', type: 'boolean' },
        { key: 'trial_duration_days', label: '標準トライアル期間', description: '新規登録時に自動付与される無料試用期間です。', type: 'days' },
    ];

    const renderValue = (plan: any, row: any) => {
        const val = plan[row.key];
        if (row.type === 'boolean') {
            return val ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <Minus className="w-5 h-5 text-slate-200 mx-auto" />;
        }
        if (row.type === 'frequency') {
            const isWeekly = val === 'weekly';
            return <Badge className={cn("border-none text-xs font-black px-3 py-1", isWeekly ? "bg-teal text-white" : "bg-slate-100 text-slate-400")}>
                {isWeekly ? "週次 (Weekly)" : "月次 (Monthly)"}
            </Badge>;
        }
        if (row.type === 'days') {
            return <span className="font-black text-slate-700">{val || 0} 日間</span>;
        }
        if (val === 999 || val === 9999) return <span className="text-teal font-black italic">無制限</span>;
        return <span className="font-black text-slate-700">{val}</span>;
    };

    if (loading || authLoading) {
        return <Loading fullScreen message="マスタープラン情報を取得中..." />;
    }

    return (
        <main className="p-8 space-y-12 animate-fadeIn pb-24">
            <header className="space-y-2">
                <div className="flex items-center gap-3 text-teal mb-3">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Product Encyclopedia</span>
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter">プラン仕様・機能定義マニュアル</h1>
                <p className="text-slate-500 font-medium">現在システム（DB）に定義されている最新の仕様と、各機能の詳細解説です。</p>
            </header>

            {/* Plan Overviews */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {plans.map(p => (
                    <div key={p.id} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-1.5",
                            p.name === 'Pro' ? "bg-amber-400" :
                            p.name === 'Standard' ? "bg-purple-500" :
                            p.name === 'Team' ? "bg-blue-500" : "bg-slate-300"
                        )} />
                        <h3 className="text-xl font-black text-slate-800 mb-2">{p.name}</h3>
                        <div className="mb-6 h-4" /> {/* ID表示列を削除し、間隔を保持 */}
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
                                    {p.name === 'Free' && "まずは計測から始めたい、スモールチーム向けの無料プラン。"}
                                    {p.name === 'Team' && "複数の部署やエリアをまたぐ、成長初期段階の組織に最適。"}
                                    {p.name === 'Standard' && "より高度な分析と、戦略的なKPI管理が必要な企業向け。"}
                                    {p.name === 'Pro' && "エンタープライズ規模の複雑な組織と、費用対効果の最大化に対応。"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Users className="w-3.5 h-3.5" />
                                <span>~ {p.max_headcount === 9999 ? "無制限" : `${p.max_headcount}名`} まで推奨</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Comparison Table */}
            <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <header className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">機能・制限値 比較マトリクス</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Full Matrix Overview</p>
                    </div>
                    <Badge className="bg-teal/5 text-teal border-none font-black text-[10px] tracking-widest px-4 py-1 rounded-full uppercase">
                        Current System Values
                    </Badge>
                </header>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-[240px]">機能項目</th>
                                {plans.map(p => (
                                    <th key={p.id} className="p-6 text-center border-b border-slate-100">
                                        <div className="text-sm font-black text-slate-800">{p.name}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {featureRows.map((row) => (
                                <tr key={row.key} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="p-6">
                                        <div className="font-bold text-slate-700 text-sm mb-1">{row.label}</div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{row.description}</p>
                                    </td>
                                    {plans.map(p => (
                                        <td key={p.id} className="p-6 text-center text-sm">
                                            {renderValue(p, row)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* In-depth Manual Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">「第2軸（担当領域）」の仕様</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Secondary Axis</p>
                        </div>
                    </div>
                    <div className="space-y-4 text-sm leading-relaxed font-medium text-slate-600">
                        <p>
                            Signs AI では、一人のユーザーは必ず一つの「部署（拠点）」に所属しますが、さらに「エリア」「職種」「雇用形態」などの
                            <span className="text-teal font-black">別の切り口でもフィルタリングや比較を可能にする</span>のが「第2軸」機能です。
                        </p>
                        <ul className="space-y-2 list-disc pl-5 text-slate-500">
                            <li>企業ごとに名称（例：担当エリア、店舗ランクなど）を自由に変更可能です。</li>
                            <li>Team プラン以上の比較的高度な分析が必要な場合に開放されます。</li>
                        </ul>
                    </div>
                </section>

                <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">AI分析頻度と手動実行</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">AI Engine Specs</p>
                        </div>
                    </div>
                    <div className="space-y-4 text-sm leading-relaxed font-medium text-slate-600">
                        <p>
                            プランによりAIエンジンの稼働サイクルが変わります。
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <h4 className="font-black text-slate-800 mb-1 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    Monthly
                                </h4>
                                <p className="text-[10px] text-slate-400 leading-tight">月次の締め処理後、一ヶ月間のサマリーを生成。Standardプラン以下に適用。</p>
                            </div>
                            <div className="p-4 bg-teal/5 rounded-2xl">
                                <h4 className="font-black text-teal mb-1 flex items-center gap-2">
                                    <Zap className="w-3 h-3" />
                                    Weekly / Realtime
                                </h4>
                                <p className="text-[10px] text-teal/40 leading-tight font-black">週次での改善アクション提案を行います。Proプランおよびアドオンにて有効。</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">トライアル・ガード機能</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Trial Safeguard</p>
                        </div>
                    </div>
                    <div className="space-y-4 text-sm leading-relaxed font-medium text-slate-600">
                        <p>
                            新規登録したテナントは、デフォルトで <span className="text-rose-500 font-black">70日間</span> の無料試用期間が付与されます。
                        </p>
                        <ul className="space-y-2 list-disc pl-5 text-slate-500">
                            <li>期間終了の 24時間前 に、テナント管理者へ通知が送信されます。</li>
                            <li>期間が終了すると、自動的に「ガード画面（EXPIRED）」が表示され、契約プランを選択して支払い設定を行うまでデータの閲覧が制限されます。</li>
                        </ul>
                    </div>
                </section>

                <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">セキュリティ・SSO</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Security & Audit</p>
                        </div>
                    </div>
                    <div className="space-y-4 text-sm leading-relaxed font-medium text-slate-600">
                        <p>
                            法人向けの堅牢な認証統合と、監査ログの管理機能です。
                        </p>
                        <ul className="space-y-2 list-disc pl-5 text-slate-500">
                            <li>SAML 2.0 に準拠したシングルサインオン（Azure AD, Google Workspace等）に対応。</li>
                            <li>管理代行権限（Impersonation）の詳細ログを出力し、いつ誰が何を見たかを 永久保存 します。</li>
                        </ul>
                    </div>
                </section>
            </div>
            
            <footer className="text-center pt-8">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    Signs AI Administration Framework — v2.0
                </p>
            </footer>
        </main>
    );
}
