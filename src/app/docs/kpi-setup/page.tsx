import { 
    BarChart3, 
    ArrowRight, 
    CheckCircle2, 
    AlertCircle,
    Copy,
    Settings,
    Plus,
    Zap
} from "lucide-react";
import Link from "next/link";

export default function KpiSetupPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">KPI Setup</span>
            </nav>

            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">KPIの設定と入力</h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    組織のパフォーマンスを測るための定量指標（KPI）を管理する方法を解説します。
                </p>
            </div>

            {/* Section 1: Definition */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">1</div>
                    <h2 id="define-kpi" className="text-2xl font-black text-slate-900">KPI項目を定義する</h2>
                </div>
                <div className="pl-11 space-y-4">
                    <p className="text-slate-600 font-medium leading-relaxed">
                        計測したい項目（売上、残業時間、商談数など）をシステムに登録します。
                    </p>
                    <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                        <ul className="space-y-3 list-none pl-0 text-sm text-slate-600 font-medium">
                            <li className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-slate-400" />
                                <span>「設定」→「KPI」タブを開きます。</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-slate-400" />
                                <span>「KPIを追加」ボタンをクリックし、項目名と単位（円、時間、件など）を入力します。</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-teal" />
                                <span>「全部署で計測」か「特定の部署のみ」かを選択して保存します。</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Section 2: Input */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">2</div>
                    <h2 id="input-results" className="text-2xl font-black text-slate-900">月次の実績を入力する</h2>
                </div>
                <div className="pl-11 space-y-4">
                    <p className="text-slate-600 font-medium leading-relaxed">
                        定義したKPIに基づき、「設定」→「KPI」タブ、または /kpi（KPI入力）画面から毎月の実績値を入力します。未入力の項目は「0」ではなく「空欄」のまま保存すると、AIがデータ欠損として適切に処理します。
                    </p>
                    <Link
                        href="/docs/kpi-input"
                        className="inline-flex items-center gap-2 text-sm font-black text-teal hover:gap-3 transition-all"
                    >
                        詳しくは「KPI実績の入力方法」をご覧ください
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Hint section */}
            <div className="p-6 bg-teal/5 border border-teal/10 rounded-3xl flex gap-4">
                <div className="p-2 bg-white rounded-xl h-fit shadow-sm text-teal">
                    <Zap className="w-5 h-5" />
                </div>
                <div>
                    <h3 id="tips" className="text-sm font-black text-slate-900 mb-1">効率的な運用</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        KPIの入力は毎月5日頃までに行うことを推奨します。これにより、AIが最新のデータに基づいた深い洞察（インサイト）を提供できます。
                    </p>
                </div>
            </div>

        </div>
    );
}
