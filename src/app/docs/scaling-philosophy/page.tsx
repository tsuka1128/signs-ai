import React from 'react';
import { BookOpen, Compass, AlertTriangle, Lightbulb, Zap } from 'lucide-react';

export default function ScalingPhilosophyPage() {
    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-500">
            {/* Header Section */}
            <section className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 text-teal-700 rounded-full text-xs font-bold tracking-tight mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    Focus Column
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                    Signs AIが考える「組織成長」<br className="max-md:hidden" />
                    の王道と逆説
                </h1>
                <p className="text-base text-slate-600 font-medium leading-relaxed max-w-2xl mt-4">
                    Signs AIのバブルチャートは、単なる現状の可視化ツールではありません。<br/>
                    そこには組織を健全にスケールさせるための明確な「哲学」が組み込まれています。<br/>
                    このページでは、その背景にある理論と、例外となる逆説的アプローチについて読み物として深く解説します。
                </p>
            </section>

            {/* 王道のセオリー */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Compass className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        王道のセオリー：「Nail It Then Scale It」
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                    <p>
                        イノベーション分野の世界的ベストセラーや、シリコンバレーの多くの投資家が警鐘を鳴らすのが<strong>「早すぎる拡大（Premature Scaling）の罠」</strong>です。アメリカのStartup Genomeのレポートによれば、失敗する企業の約7割が「ビジネスプロセスが未熟なまま規模拡大（採用やマーケティングの偏重）に走ったこと」を原因としています。
                    </p>
                    <p>
                        そこで提唱されるのが<strong>「Nail It Then Scale It（釘を刺してから拡大せよ = 勝ちパターンを確立してから拡大せよ）」</strong>という原則です。
                        Signs AIのマトリックスが示す「SEED ➔ PIONEER ➔ SCALE」の順序は、この王道理論に完全に合致するものです。
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="text-3xl mb-2">🌱</div>
                        <h3 className="font-black text-amber-900 text-lg">1. SEED</h3>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            まずは少人数のまま、顧客ニーズを満たすビジネスプロセス（PMF）を極限まで磨き込みます。ここでは生産性が低くても問題ありません。
                        </p>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="text-3xl mb-2">⭐</div>
                        <h3 className="font-black text-emerald-900 text-lg">2. PIONEER</h3>
                        <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                            仕組みとカルチャーが定着し、少ない人数でも高い生産性を出せる「勝ちパターン（理想のチーム）」を一つ確立します。
                        </p>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                        <div className="text-3xl mb-2">🚀</div>
                        <h3 className="font-black text-blue-900 text-lg">3. SCALE</h3>
                        <p className="text-xs text-blue-800 font-medium leading-relaxed">
                            PIONEERで確立した高生産性の仕組みをコピーするように採用を強化し、品質を落とさずに一気に規模を拡大します。
                        </p>
                    </div>
                </div>
            </section>

            {/* 陥りがちな罠 */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        陥りがちな罠：ブルックスの法則と「肥大化」
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                    <p>
                        ソフトウェアエンジニアリングにおける有名な格言に<strong>「ブルックスの法則（遅れているプロジェクトに人員を追加すると、かえって遅れる）」</strong>というものがあります。
                    </p>
                    <p>
                        仕組みやカルチャーが整っていない（SEEDのような生産性が低い状態）で人員を追加するとどうなるでしょうか？<br/>
                        新メンバーへの教育コスト、コミュニケーションパスの爆発的な増加、そして属人的なミスの多発により、<strong>一人当たりの生産性はむしろ低下</strong>します。これこそが、Signs AIが最も警戒すべきと定義している<strong>「OVERWEIGHT（肥大化）」</strong>の状態です。
                    </p>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6 relative">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <span className="font-bold text-slate-600">Q</span>
                            </div>
                            <div className="space-y-2">
                                <p className="font-bold text-slate-800">OVERWEIGHTにならないための対策は？</p>
                                <p className="text-sm text-slate-600">
                                    バブルチャートで自部署が「右下（多人数×低生産性）」へ移動し始めている兆候（タイムラプス）が見えたら、**直ちに採用スピードを緩め、業務の棚卸しやプロセスの自動化、オンボーディングの再構築（PIONEERへ戻す努力）**にリソースを全振りすることが重要です。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 例外的な「逆説」とSigns AIのポジション */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        例外となる「逆説の戦略」
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                    <p>
                        ただし、世の中にはこの王道セオリーを無視し、<strong>「効率や生産性は後回しにして、まずは非効率でもいいから人間を集めまくって巨大化すべき（いきなり OVERWEIGHT や SCALE を目指す）」</strong>という逆張りの強力な戦略も存在します。代表的なものをご紹介します。
                    </p>
                </div>

                <div className="space-y-6 mt-6">
                    <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl">
                        <h4 className="font-black text-indigo-900 text-lg flex items-center gap-2 mb-3">
                            <span className="bg-white px-2 py-0.5 rounded text-xs border border-indigo-200">例外 1</span>
                            ブリッツスケーリング（Blitzscaling）
                        </h4>
                        <p className="text-sm text-indigo-800/80 font-medium leading-relaxed">
                            LinkedIn創業者のリード・ホフマンなどが提唱する「勝者総取り（Winner-takes-all）」市場での戦い方です。UberやAirbnbのように「先にネットワークやシェアを握った者がすべて勝つ」ビジネスモデルの場合、莫大な赤字と組織の混乱（OVERWEIGHTな状態）を許容してでも、すさまじいスピードで人員と組織を拡大させます。「効率化（PIONEER化）は、市場を制覇してから後でやればいい」という極端かつハイリスクな哲学です。
                        </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                        <h4 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-3">
                            <span className="bg-white px-2 py-0.5 rounded text-xs border border-slate-200">例外 2</span>
                            超・労働集約型モデル
                        </h4>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            高度な効率化よりも「とにかく現場の頭数と行動量がそのまま売上に直結する」モデル（例えば、大規模なコールセンターやギグワーカーのネットワークなど）の場合、一人当たりの生産性を高めるのを待つよりも、オペレーションを極限までシンプルにして大量採用を優先した方が成長が早いケースがあります。
                        </p>
                    </div>
                </div>
            </section>

            {/* Conclusion */}
            <section className="mt-12 p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="relative z-10 space-y-4">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-amber-400" />
                        持続的な成長モデルの構築に向けて
                    </h3>
                    <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
                        ブリッツスケーリングのような「死を覚悟した超高速拡大」は、一部のスタートアップや特殊な市場環境にのみ許される戦い方であり、一般企業にとっては極めてハイリスクです。
                    </p>
                    <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
                        Signs AIが対象とする多くのB2B企業や、確実な利益成長を目指す組織にとっては、やはり<strong>「まずは少人数で高生産性のPIONEERを作り、その優れた仕組みを広げてSCALEしていく」アプローチこそが最も安全かつ王道</strong>に他なりません。<br/>
                        ぜひ、バブルチャートを通じて自社が「王道の軌道」に乗っているかを確認し続けてください。
                    </p>
                </div>
            </section>

        </div>
    );
}
