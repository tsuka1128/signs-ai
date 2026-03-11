"use client";

import { TabBar } from "@/components/ui/TabBar";
import { ScatterPlot } from "@/components/dashboard/ScatterPlot";

interface MatrixSectionProps {
    secondaryAxisName: string;
    sizeKpiName: string;
    matView: string;
    setMatView: (view: string) => void;
    month: string;
    setMonth: (m: string) => void;
    currentMatData: any[];
}

export function MatrixSection({
    secondaryAxisName,
    sizeKpiName,
    matView,
    setMatView,
    month,
    setMonth,
    currentMatData,
}: MatrixSectionProps) {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">部署 / {secondaryAxisName} マトリックス</h3>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">
                                <div className="flex items-center gap-1">
                                    <span>縦軸: 一人当たり生産性</span>
                                    <div className="relative group/calc text-left">
                                        <button className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-600 flex items-center justify-center text-[9px] font-black cursor-help transition-colors select-none">?</button>
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 text-white p-3.5 rounded-xl shadow-xl text-[10px] leading-relaxed break-normal whitespace-normal hidden group-hover/calc:block z-[150] normal-case tracking-normal animate-in fade-in zoom-in-95 font-medium">
                                            <div className="font-bold text-white mb-2 flex items-center gap-1.5"><span className="text-sm">📉</span>生産性スコアの計算式</div>
                                            <div className="bg-slate-900/80 p-2 rounded-lg font-mono text-[9px] text-emerald-400 mb-2.5 border border-slate-700">
                                                主担当KPIの達成率 × 体温係数
                                            </div>
                                            <div className="text-slate-200">
                                                ※ 各部署のKPIが異なるため、<span className="font-bold text-white">「目標の達成率」</span>で標準化、。<br />
                                                そこに<span className="font-bold text-white">組織体温（無理をしていないか）</span>を掛け合わせることで、部署を同列の軸で評価します。
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <span>｜ 横軸: {matView === "product" ? "所属人数" : "リソース量"} ｜ 円サイズ: {sizeKpiName}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <TabBar
                            tabs={[{ id: "dept", label: "部署別" }, { id: "product", label: `${secondaryAxisName}別` }]}
                            active={matView}
                            onChange={setMatView}
                            className="w-auto"
                        />
                        <div className="flex items-center gap-2 md:border-l border-slate-200 md:pl-3">
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase hidden md:inline">Time Lapse</span>
                            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-full">
                                <button onClick={() => setMonth("default")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "default" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>現在</button>
                                <button onClick={() => setMonth("1m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "1m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>1ヶ月前</button>
                                <button onClick={() => setMonth("3m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "3m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>3ヶ月前</button>
                                <button onClick={() => setMonth("6m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "6m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>6ヶ月前</button>
                                <button onClick={() => setMonth("12m")} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${month === "12m" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>1年前</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-4">
                    <ScatterPlot
                        data={currentMatData}
                        isProduct={matView === "product"}
                        sizeKpiName={sizeKpiName}
                        month={month}
                        onMonthChange={setMonth}
                        onProductToggle={(isProd) => setMatView(isProd ? "product" : "dept")}
                    />
                </div>

                {/* ヘルプテキスト */}
                <div className="mt-4 flex items-center justify-end gap-2 text-right">
                    {month === "default" ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300"></span>
                            </span>
                            <p className="text-[10px] text-slate-400 font-bold">タイムラプスで組織の変化を確認できます</p>
                        </>
                    ) : (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <p className="text-[10px] text-teal-600 font-bold">過去データを表示中</p>
                        </>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-l-4 border-teal shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🧠</span>
                    <h4 className="text-sm font-bold text-slate-800">AIのマトリックス分析</h4>
                </div>
                <div className="text-xs leading-loose text-slate-600 font-medium">
                    {matView === "product" ? (
                        month !== "default" ? (
                            month === "1m" ? (
                                <div className="space-y-4">
                                    <p><strong>【過去の記録（1ヶ月前）】</strong> プロダクトBにおいて、現場エンジニアの退職と引き継ぎ不足により体温が急落（2.6）。一部メンバーへの負荷集中が深刻化しています。</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <p><strong>【当時と現在を比較しての変化】</strong> その後1ヶ月で体温2.1まで悪化、開発効率も大きく低下しました。負の連鎖により「OVERWEIGHT」最深部へ沈んでいます。</p>
                                        <p className="text-slate-500 font-bold">👀 振り返り: キーパーソンの離脱後、適切なリソース再配置と目標の見直しが行われなかったことが致命傷となりました。</p>
                                    </div>
                                </div>
                            ) : month === "3m" ? (
                                <div className="space-y-4">
                                    <p><strong>【過去の記録（3ヶ月前）】</strong> プロダクトA・Bともに高水準の生産性を維持。しかしプロダクトB（体温2.9）は新規機能開発のプレッシャーが高まり、現場の残業時間が増加傾向にあります。</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <p><strong>【当時と現在を比較しての変化】</strong> プロダクトAは人員拡充に成功し「SCALE」へ。一方プロダクトBは無理な開発の反動で燃えつい症候群が頻発し、生産性が急降下しました。</p>
                                        <p className="text-slate-500 font-bold">👀 振り返り: アラート時点で開発ロードマップの調整が行われていれば、現在の崩壊は防げました。</p>
                                    </div>
                                </div>
                            ) : month === "6m" ? (
                                <div className="space-y-4">
                                    <p><strong>【過去の記録（6ヶ月前）】</strong> 全プロダクトが「PIONEER」「SCALE」領域にあり、理想的な状態です。プロダクトBも新体制直後で士気が高く（体温3.8）、高い生産性を発揮しています。</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <p><strong>【当時と現在を比較しての変化】</strong> その後プロダクトBは無理な増員でコミュニケーションパスが複雑化。現在は生産性が最下位レベルまで落ち込んでいます。</p>
                                        <p className="text-slate-500 font-bold">👀 振り返り: プロダクトBへの強引な人員投下は、マネジメント体制の崩壊とKPI未達という最悪の結果を招きました。</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p><strong>【過去の記録（1年前）】</strong> 創業以来の急成長期。プロダクトC（当時はβ版）が少人数ながら驚異的な一人当たり生産性を記録し始め、全社の希望となっていました。プロダクトA・Bは中核事業として安定した基盤を築いていました。</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <p><strong>【当時と現在を比較しての変化】</strong> 1年を通じてプロダクトCは順調にスケールしましたが、プロダクトBは当時の「熱量」を維持できず、官僚化による停滞を招いています。</p>
                                        <p className="text-slate-500 font-bold">👀 振り返り: 当時の「現場主導のスピード感」がどこで失われたのか、1年前のボイスを再確認し、原点回帰の施策を検討すべきです。</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="space-y-4">
                                <p><strong>【現在の組織分析】</strong> プロダクトCは少人数ながら極めて高い生産性と体温（4.3）を維持し、全社の模範的な「PIONEER」となっています。対照的にプロダクトBは「OVERWEIGHT」領域に位置し、人数に対するリターンが見合わない深刻な状態です。</p>
                                <p><strong>プロダクトA</strong>は「SCALE」領域に位置し、組織の売上を牽引する安定した主力部隊となっています。</p>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 my-2">
                                    <p className="font-bold text-slate-700 mb-1">🏷️ 各プロダクトの状況</p>
                                    <ul className="space-y-1.5 text-xs text-slate-600">
                                        <li><span className="font-bold w-24 inline-block">プロダクトA:</span> 安定成長で全社売上を牽引。機能追加への期待が高まっています。</li>
                                        <li><span className="font-bold w-24 inline-block">プロダクトB:</span> リソース過多によるコミュニケーションロスが発生。抜本的見直しが必要です。</li>
                                        <li><span className="font-bold w-24 inline-block">プロダクトC:</span> 少人数での高効率運用が実現しており、全社の理想モデルとなる状態です。</li>
                                    </ul>
                                </div>
                                <p className="text-teal font-bold bg-teal/5 p-3 rounded-lg border border-teal/10">💡 提言: プロダクトBの余剰リソースをCに移動させた場合、全社MRRへの影響と組織の体温回復をシミュレーションすることを推奨します。</p>
                            </div>
                        )
                    ) : (
                        month !== "default" ? (
                            month === "1m" ? (
                                <div className="space-y-4">
                                    <p><strong>【過去の記録（1ヶ月前）】</strong> 営業部の体温が急落（2.8）。生産性は高いものの、リソースに対する現場の疲弊が著しく、バーンアウトの兆候が見られます。短期的なメンタルケアが必要です。</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <p><strong>【当時と現在を比較しての変化】</strong> その後1ヶ月で体温は2.1まで悪化し、生産性も急落し始めました。早期のケア不足が「Overweight」領域への転落を招いたことが分かります。</p>
                                        <p className="text-slate-500 font-bold">👀 振り返り: アラート発生時の初動遅れが、その後のチーム崩壊の引き金となりました。</p>
                                    </div>
                                </div>
                            ) : month === "3m" ? (
                                <div className="space-y-4">
                                    <p><strong>【過去の記録（3ヶ月前）】</strong> 開発部は人数規模の拡大によりコミュニケーションコストが増大し、生産性を圧迫しています。一方、営業部は依然として高い生産性を維持しています。</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <p><strong>【当時と現在を比較しての変化】</strong> 開発部はその後生産性低下が止まらず、営業部もスケールの壁に直面し急落しました。</p>
                                        <p className="text-slate-500 font-bold">👀 振り返り: 組織拡大期特有のマネジメント不足が、主要部門に同時多発的なダメージを与えています。</p>
                                    </div>
                                </div>
                            ) : month === "6m" ? (
                                <div className="space-y-4">
                                    <p><strong>【過去の記録（6ヶ月前）】</strong> 営業部が極めて高い生産性を記録し、組織全体を牽引しています。しかし、人事データからはトップへの過度な依存による現場の負荷拡大の兆候が読み取れます。</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <p><strong>【当時と現在を比較しての変化】</strong> その後、営業部はPIONEERから「OVERWEIGHT」に向かって急落しています（人数増・生産性低下・体温2.1へ悪化）。典型的な「スケール時の壁」に直面しました。</p>
                                        <p className="text-slate-500 font-bold">👀 振り返り: 当時の営業部の増員計画に伴う一時的な生産性の低下と、既存メンバーのケアにもっと注力すべきだったことが立証されました。</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p><strong>【過去の記録（1年前）】</strong> 組織全体が「少数精鋭」を体現していた時期。営業・開発ともに高い体温（4.0以上）を維持し、全社的にポジティブなフィードバックが飛び交っていました。部署間の壁も極めて薄い状態でした。</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                        <p><strong>【当時と現在を比較しての変化】</strong> 規模の拡大とともに、当時の「透明性」が損なわれ、各部署が自部門の最適化に走る（サイロ化）傾向が強まっています。</p>
                                        <p className="text-slate-500 font-bold">👀 振り返り: 1年前の成功要因は「全員が顧客価値に集中できていたこと」にあります。現在の社内調整コストを極限まで削るアクションが必要です。</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="space-y-4">
                                <p><strong>【現在の組織分析】</strong> 開発部（15名）が最大リソースを抱えながら生産性が低迷しています。対照的に、営業部は一人当たり生産性が突出していますが、体温スコア2.1（危険水域）であり、持続可能性に重大な懸念があります。</p>
                                <p><strong>マーケ部</strong>は8名体制で生産性と組織体温のバランスが理想的です。現在の「量より質」のリード獲得方針が組織全体の効率化に寄与しています。</p>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 my-2">
                                    <p className="font-bold text-slate-700 mb-1">🏷️ 各部署の状況</p>
                                    <ul className="space-y-1.5 text-xs text-slate-600">
                                        <li><span className="font-bold w-16 inline-block">営業部:</span> 売上は好調も、トップ依存による属人化リスクが体温（2.1）に表れています。</li>
                                        <li><span className="font-bold w-16 inline-block">マーケ部:</span> 「量より質」の方針が機能し、生産性と体温の理想的なバランスを維持。</li>
                                        <li><span className="font-bold w-16 inline-block">開発部:</span> 最大リソースを抱える中で業務過多が体温低下に直結しており要警戒。</li>
                                        <li><span className="font-bold w-16 inline-block">CS部:</span> 大口解約の対応に追われ、他部署への依存ジレンマを抱えています。</li>
                                        <li><span className="font-bold w-16 inline-block">人事部:</span> 採用数KPIは順調で、高い組織体温（4.0）を持続的に維持しています。</li>
                                    </ul>
                                </div>
                                <p className="text-teal font-bold bg-teal/5 p-3 rounded-lg border border-teal/10">💡 提言: 開発プロセスの改善による全社の底上げと、営業部の負荷軽減が最優先課題です。</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
