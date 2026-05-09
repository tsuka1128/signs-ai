import Link from "next/link";
import { ArrowRight, Crown, TrendingUp, PieChart, Target, Sun, BarChart3, Info } from "lucide-react";

export default function LaborCostGuidePage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">Labor Cost Guide</span>
            </nav>

            {/* Hero */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">人件費分析の使い方</h1>
                    <span className="text-sm font-black text-amber-500 border border-amber-300 rounded-lg px-2.5 py-1 leading-none flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 fill-amber-400" />
                        Pro
                    </span>
                </div>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    人件費データとKPI・体温を掛け合わせ、「投資対効果」「組織の健全性」「改善ポテンシャル」を可視化するProプラン専用機能です。サイドバーの「人事戦略 → 人件費分析」から開けます。
                </p>
            </div>

            {/* Pro バナー */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-5 flex items-start gap-4">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-black text-amber-700 mb-1">事前準備：人件費データの登録</p>
                    <p className="text-sm text-amber-600 font-medium leading-relaxed">
                        人件費・人数データは <strong>設定 → 人件費・人数入力</strong> から月次で登録します。データが1件も登録されていない場合、この画面は表示されません。登録方法は
                        <Link href="/docs/kpi-setup" className="text-amber-700 font-bold hover:underline ml-1">KPIの設定と入力</Link>
                        を参照してください。
                    </p>
                </div>
            </div>

            {/* Section ① サマリーKPI */}
            <section className="space-y-4">
                <h2 id="summary-kpi" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-teal-500" />
                    サマリーKPI（3つの指標）
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    画面上部に全社の主要3指標が並びます。月次でこの数値を追うことで、組織全体のコスト効率の変化を把握できます。
                </p>
                <div className="space-y-3">
                    {[
                        {
                            title: "人件費ROI（投資対効果）",
                            formula: "平均KPI達成率 ÷ (総人件費 / 100)",
                            color: "bg-teal-50 border-teal-100",
                            titleColor: "text-teal-700",
                            desc: "人件費という投資に対してどれだけKPIを達成できているかを示す独自指標です。数値が高いほど「少ない人件費で高い成果」を上げています。",
                            example: "例：ROI 3.2 → 100万円あたり3.2%分のKPI達成を生み出している状態",
                            usecase: "月次でROIが下がっていれば、採用・昇給コストに対して成果が追いついていないサイン。人員計画の見直しや目標設定の見直しを検討してください。",
                        },
                        {
                            title: "一人当たり平均単価",
                            formula: "総人件費 ÷ 総人数",
                            color: "bg-amber-50 border-amber-100",
                            titleColor: "text-amber-700",
                            desc: "全社の基準値として象限分析やシミュレーターに使用されます。部署ごとの単価とこの基準値を比較することで、投資バランスを評価できます。",
                            example: "例：全社平均80万円 → 100万円の部署は高単価、50万円の部署は低単価と分類",
                            usecase: "単価が高い部署が体温・KPI共に高ければ「適正な投資」、低ければ「コスト効率の改善余地あり」と判断できます。",
                        },
                        {
                            title: "労働分配率",
                            formula: "総人件費 ÷ 売上KPI実績 × 100",
                            color: "bg-indigo-50 border-indigo-100",
                            titleColor: "text-indigo-700",
                            desc: "売上に対して人件費がどれだけ占めるかを示す財務指標です。売上KPIが登録されている場合のみ表示されます。一般的に40〜60%が適正とされますが、ビジネスモデルにより異なります。",
                            example: "例：労働分配率55% → 売上1,000万円のうち550万円が人件費",
                            usecase: "60%を超える場合は人件費の見直しか売上の増加施策が必要。逆に30%以下は人材投資が不足している可能性があります。",
                        },
                    ].map((item, i) => (
                        <div key={i} className={`rounded-2xl border px-6 py-5 ${item.color}`}>
                            <p className={`text-sm font-black mb-1 ${item.titleColor}`}>{item.title}</p>
                            <p className="text-xs font-black text-slate-400 mb-2">計算式：{item.formula}</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-2">{item.desc}</p>
                            <p className="text-xs text-slate-500 font-medium italic mb-1">{item.example}</p>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-200/60 pt-2 mt-2">
                                <strong>活用：</strong>{item.usecase}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section ② 効率分析一覧テーブル */}
            <section className="space-y-4">
                <h2 id="efficiency-table" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <BarChart3 className="w-7 h-7 text-indigo-500" />
                    効率分析一覧テーブル
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    部署ごとに単価・KPI達成率・体温・ROI・効率スコアを一覧で比較できます。部署別と担当領域別をタブで切り替えられます。
                </p>
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                    {[
                        { col: "単価（万）", desc: "一人当たり月次人件費。全社平均より高い場合はオレンジ色で表示されます。" },
                        { col: "KPI達成率", desc: "当月のKPI平均達成率。100%以上の場合はteal色で強調されます。" },
                        { col: "体温", desc: "最新月のボイスチェック平均スコア（1〜5）。3.0未満の行は薄い赤背景で警告表示されます。" },
                        { col: "ROI", desc: "その部署単体の人件費ROI。高いほどコストパフォーマンスが良い状態です。" },
                        { col: "効率スコア", desc: "ROIを5段階の●で視覚化。KPI達成率 ÷ 一人当たり単価で算出します。" },
                    ].map((item, i) => (
                        <div key={i} className={`px-5 py-4 flex items-start gap-4 ${i !== 0 ? "border-t border-slate-100" : ""}`}>
                            <span className="text-xs font-black text-slate-700 w-32 flex-shrink-0">{item.col}</span>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-5 py-4">
                    <p className="text-sm font-black text-slate-600 mb-1">読み方のポイント</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        体温が低い（赤背景）かつ単価が高い（オレンジ）部署が最優先の見直し対象です。逆に体温が高く効率スコアも高い部署は、投資が成果に結びついているモデルケースとして他部署の参考にしてください。
                    </p>
                </div>
            </section>

            {/* Section ③ 体温 × コスト 象限分析 */}
            <section className="space-y-4">
                <h2 id="quadrant" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Target className="w-7 h-7 text-teal-500" />
                    体温 × コスト 象限分析
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    全部署を「体温（3.0を境界）」と「一人当たり単価（全社平均を境界）」で4象限に自動分類します。部署名がどの象限にあるかで、投資戦略の方向性がひと目でわかります。
                </p>
                <div className="grid grid-cols-2 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                    {[
                        {
                            label: "理想的", sub: "自律型高効率", color: "bg-emerald-50", badge: "bg-white border-emerald-200 text-emerald-700",
                            pos: "体温 高 × 単価 低",
                            desc: "少ないコストで高いエンゲージメントを維持している最良の状態。この部署の働き方・マネジメントを横展開することで全社が底上げできます。",
                            action: "現状維持 + モデルケースとして展開",
                        },
                        {
                            label: "安定投資", sub: "高稼働・厚待遇", color: "bg-indigo-50/40", badge: "bg-white border-indigo-200 text-indigo-700",
                            pos: "体温 高 × 単価 高",
                            desc: "コストをかけている分、エンゲージメントも高い健全な状態。ただし、KPI達成率と合わせて費用対効果を定期的に確認してください。",
                            action: "KPIとのバランスを月次で確認",
                        },
                        {
                            label: "要注意", sub: "投資不足リスク", color: "bg-amber-50/40", badge: "bg-white border-amber-200 text-amber-700",
                            pos: "体温 低 × 単価 低",
                            desc: "単価が低いにもかかわらず体温も低い状態。待遇への不満や成長機会の不足が原因の可能性があります。",
                            action: "1on1やボイスチェックで原因を深掘りし、待遇・成長機会の見直しを検討",
                        },
                        {
                            label: "警告域", sub: "構造的非能率", color: "bg-rose-50/40", badge: "bg-white border-rose-200 text-rose-700",
                            pos: "体温 低 × 単価 高",
                            desc: "コストをかけているのにエンゲージメントが低い最も危険な状態。離職・低生産性のリスクが高く、早急な対応が必要です。",
                            action: "人事戦略インサイトのリスクアラートと合わせて緊急で原因分析。業務設計・評価・マネジメントの見直しを優先",
                        },
                    ].map((q, i) => (
                        <div key={i} className={`p-6 space-y-3 ${q.color} ${i >= 2 ? "border-t border-slate-100" : ""} ${i % 2 !== 0 ? "border-l border-slate-100" : ""}`}>
                            <div>
                                <span className={`text-[10px] font-black border rounded-full px-2.5 py-1 ${q.badge}`}>{q.label}</span>
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5">{q.pos} / {q.sub}</p>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{q.desc}</p>
                            <p className="text-xs font-black text-slate-500 border-t border-slate-200/60 pt-2">
                                推奨アクション：{q.action}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section ④ 体温改善シミュレーター */}
            <section className="space-y-4">
                <h2 id="simulator" className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Sun className="w-7 h-7 text-amber-400" />
                    体温改善シミュレーター
                </h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    「体温がX pt改善したら、組織全体でどれだけの価値（金額）が生まれるか」を試算するツールです。施策投資の意思決定や経営層への説明資料として活用できます。
                </p>

                {/* 使い方 */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 px-6 py-5 space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">使い方</p>
                    <div className="space-y-3">
                        {[
                            { step: "1", text: "スライダーで「体温の改善幅」を選択します（0.1〜2.0pt）。「今の体温から+0.5改善したら」という仮定を設定するイメージです。" },
                            { step: "2", text: "「推定改善価値（万円）」と「総人件費比（%）」がリアルタイムで更新されます。これが体温改善によって生まれる推定的な価値です。" },
                            { step: "3", text: "「部署別インパクト内訳」で、どの部署が最も改善余地（インパクト）が大きいかを確認できます。体温が低い部署ほど改善幅が大きく出ます。" },
                        ].map((item) => (
                            <div key={item.step} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-teal text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{item.step}</span>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 計算の仕組み */}
                <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-6 py-5 space-y-3">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">計算の仕組み</p>
                    <p className="text-sm text-indigo-700 font-medium leading-relaxed">
                        全部署の「体温 → KPI達成率」の線形回帰から<strong>傾き（%/pt）</strong>を算出します。これは「体温が1pt上がるとKPIが何%改善するか」を示す値です。<br /><br />
                        各部署の推定改善価値 ＝ 改善KPI% × 部署人件費（万円）<br />
                        全社合計がシミュレーター上部の「推定改善価値」として表示されます。
                    </p>
                    <div className="flex items-start gap-2 text-xs text-indigo-500 font-medium italic">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        体温が既に5.0に近い部署は改善幅が小さく算出されます（上限5.0にクランプ）。また、逆相関（体温が高いのにKPIが低い）の場合は改善インパクト0として扱われます。
                    </div>
                </div>

                {/* ユースケース */}
                <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">活用シーン</p>
                    {[
                        {
                            title: "施策投資の費用対効果を事前検討",
                            desc: "例えば「全社で体温+0.3改善する施策（研修・1on1強化）に500万円かける」とします。シミュレーターで+0.3の推定価値が500万円を超えれば、投資対効果があると判断できます。",
                            color: "bg-teal-50 border-teal-100",
                        },
                        {
                            title: "優先部署の特定",
                            desc: "部署別インパクト内訳を見ると、体温が低く人件費コストが大きい部署ほど改善インパクトが大きく算出されます。限られた施策リソースをどの部署に集中投下するかの判断材料になります。",
                            color: "bg-amber-50 border-amber-100",
                        },
                        {
                            title: "経営層への説明資料",
                            desc: "「体温を1pt改善すると○○万円の価値創出が見込まれる」という数字は、エンゲージメント施策への予算申請を経営層に説明する際の根拠として使えます。",
                            color: "bg-indigo-50 border-indigo-100",
                        },
                    ].map((item, i) => (
                        <div key={i} className={`rounded-xl border px-5 py-4 ${item.color}`}>
                            <p className="text-sm font-black text-slate-700 mb-1.5">{item.title}</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
}
