import React from 'react';
import { BookOpen, Compass, AlertTriangle, Lightbulb, Zap, Calendar, User, ArrowRight } from 'lucide-react';

export default function GrowthStepsPage() {
    return (
        <article className="pb-24 animate-in fade-in duration-500 max-w-3xl mx-auto">
            {/* Blog Header / Hero */}
            <header className="space-y-6 mb-12 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200 text-slate-600 rounded-full text-xs font-bold tracking-widest uppercase">
                    <BookOpen className="w-3.5 h-3.5" />
                    Signs AI Insight
                </div>
                <h1 className="text-3xl md:text-[2.5rem] font-black text-slate-900 leading-[1.3] tracking-tight">
                    マトリックスが示す<br className="md:hidden"/>「組織成長の軌跡」
                </h1>
                
                <div className="flex items-center justify-center gap-6 text-sm text-slate-500 font-medium pt-4 pb-8 border-b border-slate-100 w-full">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Signs AI 運営チーム</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>2026年3月</span>
                    </div>
                </div>
            </header>

            {/* Content Body */}
            <div className="prose prose-slate prose-lg max-w-none text-slate-700 font-medium leading-[1.8]">
                
                <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-bold tracking-tight mb-12">
                    Signs AIのバブルチャートは、単に部署同士を比較整理するためだけのマトリックスではありません。<strong className="text-slate-900 border-b-2 border-teal-300 pb-0.5">組織をいかにして健全に拡大（スケール）させるか</strong>という「成長のセオリー」そのものを可視化したものです。
                </p>

                <h2 id="theory" className="flex items-center gap-3 text-2xl font-black text-slate-900 border-b border-slate-200 pb-4 mt-16 mb-6">
                    <Compass className="w-6 h-6 text-teal-500" />
                    王道のセオリー：「Nail It Then Scale It」
                </h2>
                <p>
                    アメリカのスタートアップ調査機関（Startup Genome）のレポートによれば、失敗する企業の約7割が<strong>「ビジネスプロセスやプロダクトが未熟な段階で、人員追加やマーケティング偏重の『規模拡大』に走ったこと（Premature Scaling）」</strong>を原因としています。
                </p>
                <p>
                    そこでシリコンバレーをはじめとする世界的な起業家や投資家が提唱するのが、<strong>「Nail It Then Scale It（釘を刺してから拡大せよ = 勝ちパターンを確立してから拡大せよ）」</strong>という原則です。<br/>
                    この原則において、理想的な組織の成長パスは以下の3つのステップを踏むことになります。
                </p>

                {/* Step Cards */}
                <div className="not-prose grid gap-4 my-10">
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-amber-50/50 border border-amber-100 rounded-[24px] shadow-sm relative">
                        <div className="w-12 h-12 shrink-0 bg-white text-amber-500 rounded-xl flex items-center justify-center text-xl font-black border border-amber-200 shadow-sm">1</div>
                        <div className="space-y-2">
                            <h3 id="seed" className="text-lg font-black text-amber-900 flex items-center gap-2">
                                🌱 SEED (種まき)
                            </h3>
                            <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                まずは少人数チームのまま、泥臭く顧客ニーズを満たすビジネスプロセス（PMF）を極限まで磨き込みます。この未熟な投資段階ではまだ生産性が低くても問題ありません。
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-emerald-50/50 border border-emerald-100 rounded-[24px] shadow-sm relative">
                        <div className="w-12 h-12 shrink-0 bg-white text-emerald-500 rounded-xl flex items-center justify-center text-xl font-black border border-emerald-200 shadow-sm">2</div>
                        <div className="space-y-2">
                            <h3 id="pioneer" className="text-lg font-black text-emerald-900 flex items-center gap-2">
                                ⭐ PIONEER (開拓者)
                            </h3>
                            <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                                業務の仕組み化と熱量の高いカルチャーが定着し、少ない人数でも高い生産性を出せる「勝ちパターン（理想のチーム）」へ引き上げます。ここで初めて「拡大の準備」が整います。
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-5 p-6 bg-blue-50/50 border border-blue-100 rounded-[24px] shadow-sm relative">
                        <div className="w-12 h-12 shrink-0 bg-white text-blue-500 rounded-xl flex items-center justify-center text-xl font-black border border-blue-200 shadow-sm">3</div>
                        <div className="space-y-2">
                            <h3 id="scale" className="text-lg font-black text-blue-900 flex items-center gap-2">
                                🚀 SCALE (拡大期)
                            </h3>
                            <p className="text-sm text-blue-800 leading-relaxed font-medium">
                                PIONEERで確立した高生産性の仕組みをコピー＆ペーストするように採用を強化し、品質を落とさずに一気に組織規模を拡大します。
                            </p>
                        </div>
                    </div>
                </div>

                <p>
                    マトリックスにおける<strong>「タイムラプス機能」</strong>は、まさに自社のそれぞれの部署がこの<strong>「SEED ➔ PIONEER ➔ SCALE」</strong>という健全な軌跡を描けているかを追跡するために存在します。
                </p>

                <h2 id="traps" className="flex items-center gap-3 text-2xl font-black text-slate-900 border-b border-slate-200 pb-4 mt-16 mb-6">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                    陥りやすい罠：ブルックスの法則と「肥大化」
                </h2>
                
                <p>
                    もし、仕組みやカルチャーが整っていない（SEEDのように生産性が低い状態）にも関わらず、売上拡大を焦って人員だけを追加するとどうなるでしょうか？
                </p>

                <blockquote className="border-l-4 border-slate-300 pl-6 my-8 italic text-slate-600 bg-slate-50 py-4 pr-4 rounded-r-2xl">
                    「遅れているソフトウェアプロジェクトへの要員追加は、プロジェクトをさらに遅らせるだけである。」<br/>
                    <span className="text-sm font-bold mt-2 block not-italic">— ブルックスの法則（フレデリック・ブルックス）</span>
                </blockquote>

                <p>
                    新しいメンバーへの教育コストが重くのしかかり、コミュニケーションパスは爆発的に増加します。さらに仕組み化されていないがゆえに属人的なミスが多発することで、<strong>一人当たりの生産性はむしろ低下</strong>してしまいます。<br/>
                    これこそが、Signs AIが最も警戒すべきと定義している<strong>「OVERWEIGHT（肥大化）」</strong>の状態です。
                </p>

                <div className="not-prose bg-rose-50 border border-rose-100 rounded-2xl p-6 mt-8 mb-12">
                    <h4 className="font-black text-rose-900 flex items-center gap-2 mb-2">
                        💡 OVERWEIGHTにならないための軌道修正
                    </h4>
                    <p className="text-sm text-rose-800 leading-relaxed font-medium">
                        バブルチャートで自部署が「右下（多人数×低生産性）」へ移動し始めている兆候が見えたら、<strong>直ちに採用や拡大スピードを落としてください。</strong>まずは業務の棚卸しやプロセスの自動化、オンボーディングの再構築にフルコミットし、ふたたび「PIONEER」や「SCALE」へ力強く引き上げる努力が最優先となります。
                    </p>
                </div>


                <h2 id="exceptions" className="flex items-center gap-3 text-2xl font-black text-slate-900 border-b border-slate-200 pb-4 mt-16 mb-6">
                    <Zap className="w-6 h-6 text-indigo-500" />
                    例外となる「逆説の戦略」
                </h2>

                <p>
                    ここまで王道アプローチを解説しましたが、ビジネスの世界にはこのセオリーを完全に無視した**「効率や生産性は赤字でもいいから、とにかく人間を集めまくって巨大化すべき（いきなり OVERWEIGHT や SCALE を目指す）」**という逆張りの戦略も存在します。
                </p>

                <div className="not-prose grid gap-4 my-8">
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 text-sm">1</div>
                        <div>
                            <span className="font-bold text-slate-800 block mb-1">勝者総取り市場（ブリッツスケーリング）</span>
                            <span className="text-sm text-slate-600 font-medium leading-relaxed block">UberやAirbnbのように「先にネットワークを握った者が独占的に勝つ」領域において、莫大な赤字と組織崩壊を許容してでも最速でシェアを取りに行く戦略。</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 text-sm">2</div>
                        <div>
                            <span className="font-bold text-slate-800 block mb-1">超・労働集約型ビジネス</span>
                            <span className="text-sm text-slate-600 font-medium leading-relaxed block">効率化の余地があまりなく、「現場の頭数と行動量（配達員やテレアポの数など）」がそのまま売上に直結するため、属人性を許容して大量採用を優先すべきモデル。</span>
                        </div>
                    </div>
                </div>

                <p>
                    しかし、これらは莫大な資金調達を前提としたハイリスクな戦い方であったり、特殊な市場環境にのみ許されるアプローチです。
                </p>

                {/* Conclusion */}
                <div className="not-prose mt-12 p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-32 bg-teal-500/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                    <div className="relative z-10 space-y-4">
                        <h3 id="conclusion" className="text-xl font-black flex items-center gap-2">
                            結論：王道こそが最短ルート
                        </h3>
                        <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
                            大半のB2B企業や、堅実で持続的な利益成長を目指す組織にとっては、<strong>「まずは少人数で高生産性のPIONEERを作り、その優れた仕組みを広げてSCALEしていく」アプローチこそが、最も安全で着実な王道です。</strong><br/><br/>
                            ぜひ Signs AI のマトリックスを活用し、自社がスケールの王道軌道に乗っているかを確認し続けてください。
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}
