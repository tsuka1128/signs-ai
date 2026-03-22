import Image from "next/image";
import Link from "next/link";
import { 
    ArrowRight, 
    BarChart3, 
    Sparkles, 
    Clock, 
    Target,
    Users,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    Maximize2
} from "lucide-react";

/**
 * バブルチャート（部署別マトリックス）の活用ガイドページ
 *
 * Signs AIの核心機能であるマトリックス分析を、
 * 図解とともに分かりやすく解説する。
 */
export default function BubbleChartGuidePage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">Matrix Guide</span>
            </nav>

            {/* Hero */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    部署別マトリックスの見方
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    組織の「定量（KPI）」と「定性（体温）」を掛け合わせた、Signs AI独自のマトリックス分析を読み解く方法を解説します。
                </p>
            </div>

            {/* Why this matters */}
            <div className="p-8 bg-slate-900 text-white rounded-[32px] shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-teal-400" />
                        <span className="text-xs font-black text-teal-400 uppercase tracking-widest">Why this matters</span>
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight">
                        なぜ2軸で組織を見る必要があるのか？
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        KPI（売上、契約数など）だけでは、<strong className="text-white">現場が健全に成果を出しているのか</strong>が見えません。
                        逆に、エンゲージメント（体温）だけでは<strong className="text-white">その熱量がビジネス成果に直結しているのか</strong>が分かりません。
                        この2つの軸を同時に見ることで、初めて「持続可能な成長」と「構造的なリスク」を一覧で捉えることが可能になります。
                    </p>
                </div>
            </div>

            {/* Actual UI screenshot */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <BarChart3 className="w-7 h-7 text-teal" />
                    実際の画面
                </h2>
                <div className="rounded-[28px] border-2 border-slate-100 overflow-hidden shadow-lg">
                    <Image 
                        src="/docs/bubble_chart_current.png" 
                        alt="Signs AI 部署別マトリックスの実際の画面" 
                        width={1500} 
                        height={900}
                        className="w-full"
                    />
                </div>
                <p className="text-sm text-slate-500 font-medium text-center">
                    ▲ Signs AI ダッシュボードの「マトリックス」タブに表示されるバブルチャート
                </p>
            </section>

            {/* Axes explanation */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900">軸の意味</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white border-2 border-slate-100 rounded-[28px] shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">縦軸：一人当たり生産性</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            各部署のKPI実績を人数で割った<strong>効率性の指標</strong>です。上に位置する部署ほど、少ない人員で大きな成果を出していることを示します。
                        </p>
                        <div className="bg-blue-50 text-blue-700 rounded-xl px-4 py-3 text-xs font-bold">
                            計算式：KPI達成率 ÷ 部署人数
                        </div>
                    </div>
                    <div className="p-6 bg-white border-2 border-slate-100 rounded-[28px] shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">横軸：リソース量</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            部署の人員数を表します。右に位置する部署ほど、多くの人員を有していることを示します。横軸の位置で「少数精鋭か、大所帯か」が一目で分かります。
                        </p>
                        <div className="bg-amber-50 text-amber-700 rounded-xl px-4 py-3 text-xs font-bold">
                            データソース：部署マスタの登録人数
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-teal/5 border border-teal/10 rounded-3xl flex gap-4">
                    <div className="p-2 bg-white rounded-xl h-fit shadow-sm">
                        <Target className="w-5 h-5 text-teal" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">円（バブル）のサイズ</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            バブルの大きさは<strong>KPI達成率</strong>を表しています。大きな円ほどKPIの達成度が高い部署です。
                            また、バブルの周囲に波紋（リップル）が見える場合は、ボイスチェック（体温）のスコアが反映されています。
                        </p>
                    </div>
                </div>
            </section>

            {/* 4 Quadrants */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900">4つの領域の意味</h2>
                <div className="rounded-[28px] border-2 border-slate-100 overflow-hidden shadow-lg">
                    <Image 
                        src="/docs/bubble_chart_quadrant.png" 
                        alt="4象限の概念図" 
                        width={800} 
                        height={800}
                        className="w-full max-w-lg mx-auto"
                    />
                </div>

                <div className="space-y-4">
                    {/* PIONEER */}
                    <div className="flex gap-4 p-6 border border-green-100 bg-green-50/50 rounded-[28px]">
                        <div className="text-3xl">⭐</div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-green-800">PIONEER（開拓者）</h3>
                            <p className="text-xs font-bold text-green-600">左上エリア：少人数 × 高生産性</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                少ない人数で高い成果を出している理想的なチーム。自律的な高効率組織であり、この状態を維持しつつ、成功ノウハウを他部署へ展開することが有効です。
                            </p>
                            <div className="bg-white/80 rounded-xl px-4 py-2 text-xs font-bold text-green-700">
                                💡 アクション例：成功要因を言語化し、採用やオンボーディングに活用する
                            </div>
                        </div>
                    </div>

                    {/* SCALE */}
                    <div className="flex gap-4 p-6 border border-blue-100 bg-blue-50/50 rounded-[28px]">
                        <div className="text-3xl">🚀</div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-blue-800">SCALE（拡大期）</h3>
                            <p className="text-xs font-bold text-blue-600">右上エリア：多人数 × 高生産性</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                大所帯でありながら高い生産性を維持している組織の主力部隊。マネジメントが機能している証拠ですが、人数増加に伴い情報伝達の鈍化やサイロ化のリスクも監視が必要です。
                            </p>
                            <div className="bg-white/80 rounded-xl px-4 py-2 text-xs font-bold text-blue-700">
                                💡 アクション例：中間管理職の育成とチーム内コミュニケーションの仕組み化を推進
                            </div>
                        </div>
                    </div>

                    {/* SEED */}
                    <div className="flex gap-4 p-6 border border-amber-100 bg-amber-50/50 rounded-[28px]">
                        <div className="text-3xl">🌱</div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-amber-800">SEED（種まき）</h3>
                            <p className="text-xs font-bold text-amber-600">左下エリア：少人数 × 低生産性</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                新規事業やR&Dなど、投資フェーズにあるチーム。短期的なKPI達成率は低くても、中長期で見た場合の成長ポテンシャルがここに含まれます。ただし、いつまでこのフェーズを許容するかの判断基準が必要です。
                            </p>
                            <div className="bg-white/80 rounded-xl px-4 py-2 text-xs font-bold text-amber-700">
                                💡 アクション例：マイルストーンベースで進捗管理し、戦略的に投資を継続するか判断する
                            </div>
                        </div>
                    </div>

                    {/* OVERWEIGHT */}
                    <div className="flex gap-4 p-6 border border-red-100 bg-red-50/50 rounded-[28px]">
                        <div className="text-3xl">⚠️</div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-red-800">OVERWEIGHT（肥大化）</h3>
                            <p className="text-xs font-bold text-red-600">右下エリア：多人数 × 低生産性</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                人員に対するリターンが見合っておらず、構造的な改善が必要な領域。調整コスト（会議、承認フロー等）の増大、業務の属人化、目標の曖昧さなどが原因として考えられます。
                            </p>
                            <div className="bg-white/80 rounded-xl px-4 py-2 text-xs font-bold text-red-700">
                                💡 アクション例：業務の棚卸しと再配分、KPIの見直し、場合によっては組織再編を検討
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timelapse */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Clock className="w-7 h-7 text-teal" />
                    タイムラプスで変化を追う
                </h2>
                <p className="text-slate-600 font-medium leading-relaxed">
                    マトリックスの上部にある「TIME LAPSE」では、<strong>現在・1ヶ月前・3ヶ月前・6ヶ月前・1年前</strong>の5段階で組織の変遷を確認できます。
                </p>
                <div className="rounded-[28px] border-2 border-slate-100 overflow-hidden shadow-lg">
                    <Image 
                        src="/docs/bubble_chart_timelapse.png" 
                        alt="タイムラプス機能（1年前の表示例）" 
                        width={1500} 
                        height={900}
                        className="w-full"
                    />
                </div>
                <p className="text-sm text-slate-500 font-medium text-center">
                    ▲ タイムラプスで「1年前」を選択した状態
                </p>

                <div className="bg-white border-2 border-slate-100 p-6 rounded-[32px] shadow-sm space-y-5">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        タイムラプスで何が見えるのか
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex gap-3 items-start">
                            <span className="text-lg">📍</span>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 mb-1">バブルの「移動方向」を観察する</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    部署のバブルが<strong>左上（PIONEER）に移動</strong>していれば、効率化が進んでいる証拠です。逆に<strong>右下（OVERWEIGHT）に向かっている</strong>場合は、増員が成果に結びついていない可能性があります。
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="text-lg">📐</span>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 mb-1">組織再編の効果を検証する</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    3ヶ月前に実施した人事異動や組織再編の後、対象部署が期待通りの象限に移動したかを確認できます。施策の効果測定として非常に有効です。
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="text-lg">🔄</span>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 mb-1">季節変動と構造変化を区別する</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    営業部門の繁忙期（年度末など）による一時的な変動なのか、中長期で徐々に変化しているトレンドなのかを判別できます。1ヶ月前と6ヶ月前を比較するとよく分かります。
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="text-lg">📊</span>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 mb-1">バブルのサイズ変化にも注目</h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    バブルが小さくなっていれば（KPI達成率が低下していれば）、位置だけでなくパフォーマンスの低下を事前に捉えることができます。
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>
            </section>

            {/* View modes */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Maximize2 className="w-6 h-6 text-teal" />
                    表示モード
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
                        <h3 className="text-sm font-black text-slate-900">📋 部署別</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            営業部、開発部、CS部などの組織単位でプロットします。部署間の生産性バランスを俯瞰するのに最適です。
                        </p>
                    </div>
                    <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
                        <h3 className="text-sm font-black text-slate-900">🏷️ 担当領域別</h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            プロダクト、エリア、ブランドなどの切り口でプロットします。同一部署内でも異なるプロダクトのパフォーマンス差が見えるようになります。
                        </p>
                    </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                        <Maximize2 className="w-4 h-4 text-slate-400" />
                        拡大表示
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        右上の「拡大表示」ボタンを押すと、マトリックスをフルスクリーンに近い大きさで表示できます。会議中のプロジェクター投影や、経営会議での共有に便利です。
                    </p>
                </div>
            </section>

            {/* AI Analysis */}
            <section className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-teal/5 to-blue-50 border border-teal/10 rounded-3xl flex gap-4">
                    <div className="p-2 bg-white rounded-xl h-fit shadow-sm">
                        <Sparkles className="w-5 h-5 text-teal" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">AIのマトリックス分析</h3>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            マトリックスの下には、AIがデータを読み解いた分析コメントが自動生成されます。各部署がどの象限に位置し、前月からどの方向に移動したか、そしてどのようなアクションが推奨されるかがテキストで要約されます。
                        </p>
                    </div>
                </div>
            </section>

            {/* Warning */}
            <div className="p-6 bg-amber-50 border border-amber-100/50 rounded-3xl flex gap-4">
                <div className="p-2 bg-white rounded-xl h-fit shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">データ量に関する注意</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        マトリックスを正確に表示するには、<strong>複数部署のKPI実績</strong>と<strong>ボイスチェック（体温）のスコア</strong>の両方が必要です。データが不十分な場合は「分析データが十分にありません」と表示されます。アンケートの回答率を上げることで、より信頼性の高い可視化が可能になります。
                    </p>
                </div>
            </div>

            {/* Next buttons */}
            <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                <Link href="/docs/kpi-setup" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all font-bold group">
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    KPIの設定と入力
                </Link>
                <Link href="/docs" className="flex items-center gap-2 text-teal hover:text-teal-600 transition-all font-bold group">
                    ドキュメントトップへ
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
