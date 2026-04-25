import { 
    Network,
    Building2,
    Users,
    LineChart,
    Brain,
    ClipboardList,
    Bell,
    CheckCircle2,
    Mail,
    ShieldCheck,
    CreditCard,
    Target,
    Layers,
    FileSearch,
    History,
    Zap
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/index";

const RELATIONS = [
    { from: "Plan", to: "Company", cardinality: "1:n", type: "データ依存", note: "subscribes" },
    { from: "Company", to: "Department", cardinality: "1:n", type: "データ依存" },
    { from: "Company", to: "User", cardinality: "1:n", type: "データ依存" },
    { from: "Department", to: "User", cardinality: "1:n", type: "データ依存" },
    { from: "Plan", to: "KpiDefinition", cardinality: "1:n", type: "データ依存" },
    { from: "KpiDefinition", to: "KpiRecord", cardinality: "1:n", type: "データ依存" },
    { from: "KpiDefinition", to: "KpiAxis", cardinality: "1:n", type: "データ依存" },
    { from: "User", to: "ResourceRecord", cardinality: "1:n", type: "データ依存" },
    { from: "User", to: "NotificationSetting", cardinality: "1:n", type: "データ依存" },
    { from: "SurveyResponse", to: "SurveyAnswer", cardinality: "1:n", type: "データ依存" },
    { from: "SurveyResponse", to: "AiInsight", cardinality: "n:1", type: "データ依存" },
    { from: "SurveyAnswer", to: "AiInsight", cardinality: "n:1", type: "データ依存" },
    { from: "SemanticLayer", to: "AiInsight", cardinality: "n:1", type: "データ依存" },
    { from: "AiInsight", to: "ActionItem", cardinality: "1:n", type: "データ依存" },
    { from: "AiInsight", to: "Invitation", cardinality: "間接", type: "間接参照" },
    { from: "AiInsight", to: "AdminActivityLog", cardinality: "間接", type: "間接参照" },
];

export default function AdminSchemaPage() {
    const zones = [
        {
            title: "テナント基盤",
            id: "foundation",
            colorClass: "bg-emerald-50 border-emerald-200",
            titleClass: "text-emerald-700",
            icon: Building2,
            objects: [
                { name: "Plan", desc: "契約プラン定義", icon: CreditCard, fields: "max_depts / ai_frequency" },
                { name: "Company", desc: "テナント企業", icon: Building2, fields: "status / plan_id" },
                { name: "Department", desc: "組織部署", icon: Users, fields: "headcount / sort_order" },
                { name: "User", desc: "利用者", icon: Users, fields: "role / slack_user_id" },
                { name: "NotificationSetting", desc: "通知設定", icon: Bell, fields: "notification_type / slack_enabled" },
            ]
        },
        {
            title: "業績・リソース",
            id: "performance",
            colorClass: "bg-violet-50 border-violet-200",
            titleClass: "text-violet-700",
            icon: LineChart,
            objects: [
                { name: "KpiDefinition", desc: "指標定義", icon: Target, fields: "name / unit / target" },
                { name: "KpiRecord", desc: "月次実績", icon: LineChart, fields: "value / target_value / month" },
                { name: "KpiAxis", desc: "集計軸", icon: Layers, fields: "axis / label" },
                { name: "ResourceRecord", desc: "人件費・人数", icon: Users, fields: "head_count / labor_cost" },
            ]
        },
        {
            title: "サーベイ",
            id: "survey",
            colorClass: "bg-rose-50 border-rose-200",
            titleClass: "text-rose-700",
            icon: ClipboardList,
            objects: [
                { name: "SurveyResponse", desc: "回答ヘッダ", icon: ClipboardList, fields: "recorded_month / pulse" },
                { name: "SurveyAnswer", desc: "各問スコア", icon: CheckCircle2, fields: "question_no / score" },
                { name: "SemanticLayer", desc: "組織方針", icon: FileSearch, fields: "content / valid_from" },
            ]
        },
        {
            title: "AI分析",
            id: "ai",
            colorClass: "bg-amber-50 border-amber-200",
            titleClass: "text-amber-700",
            icon: Brain,
            objects: [
                { name: "AiInsight", desc: "分析レポート", icon: Brain, fields: "overall_weather / trend_arrow / content" },
                { name: "Summary Data", desc: "weather / risk_level", icon: Zap, fields: "risk_level / risk_reason" },
            ]
        },
        {
            title: "アクション管理 / 管理系",
            id: "admin",
            colorClass: "bg-sky-50 border-sky-200",
            titleClass: "text-sky-700",
            icon: ShieldCheck,
            fullWidth: true,
            objects: [
                { name: "ActionItem", desc: "組織改善施策", icon: CheckCircle2, fields: "priority / status / due_date" },
                { name: "Invitation", desc: "招待トークン", icon: Mail, fields: "email / role / expires_at" },
                { name: "AdminActivityLog", desc: "操作履歴", icon: History, fields: "action_type / details" },
            ]
        }
    ];

    return (
        <main className="p-8 space-y-12 animate-fadeIn max-w-7xl mx-auto pb-32">
            <header className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-xl shadow-lg">
                        <Network className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter">オブジェクト構成図</h1>
                    <Badge className="bg-teal text-white border-none font-bold px-3 py-1">SUPER ADMIN</Badge>
                </div>
                <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
                    Signs AI のデータモデルと各オブジェクトの関係を示します。
                </p>
            </header>

            <div className="space-y-6">
                {/* 1st row: Foundation and Performance */}
                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-2">
                    <div className="md:col-span-5 self-stretch">
                        <ZoneCard zone={zones[0]} />
                    </div>
                    <div className="md:col-span-1 flex justify-center text-slate-300 font-black text-2xl">
                        <span className="hidden md:inline">▸</span>
                        <span className="md:hidden">▾</span>
                    </div>
                    <div className="md:col-span-5 self-stretch">
                        <ZoneCard zone={zones[1]} />
                    </div>
                </div>

                {/* Vertical arrows between rows */}
                <div className="grid grid-cols-1 md:grid-cols-11 gap-2">
                    <div className="md:col-start-3 md:col-span-1 flex justify-center text-slate-300 font-black text-2xl">
                        ▾
                    </div>
                    <div className="md:col-start-9 md:col-span-1 flex justify-center text-slate-300 font-black text-2xl">
                        ▾
                    </div>
                </div>

                {/* 2nd row: Survey and AI Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-2">
                    <div className="md:col-span-5 self-stretch">
                        <ZoneCard zone={zones[2]} />
                    </div>
                    <div className="md:col-span-1 flex justify-center text-slate-300 font-black text-2xl">
                        <span className="hidden md:inline">▸</span>
                        <span className="md:hidden">▾</span>
                    </div>
                    <div className="md:col-span-5 self-stretch">
                        <ZoneCard zone={zones[3]} />
                    </div>
                </div>

                {/* Arrow to Admin */}
                <div className="flex justify-center text-slate-300 font-black text-2xl py-2">
                    ▾
                </div>

                {/* 3rd row: Admin Management */}
                <div className="w-full">
                    <ZoneCard zone={zones[4]} />
                </div>
            </div>

            {/* Relations Section */}
            <section className="space-y-4 pt-12">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                    オブジェクト間リレーション
                </h2>

                {/* Legend */}
                <div className="flex items-center gap-6 text-[11px] text-slate-500 font-bold">
                    <span className="flex items-center gap-2 uppercase tracking-tighter">
                        <span className="inline-block w-8 h-0.5 bg-slate-400"></span> データ依存
                    </span>
                    <span className="flex items-center gap-2 uppercase tracking-tighter">
                        <span className="inline-block w-8 border-t-2 border-dashed border-slate-300"></span> 間接参照
                    </span>
                </div>

                {/* Relation Table */}
                <div className="rounded-3xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50/80 backdrop-blur-sm">
                            <tr>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">From</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">To</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">カーディナリティ</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">種別</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {RELATIONS.map((rel, i) => (
                                <tr key={i} className={cn(
                                    "hover:bg-slate-50 transition-colors",
                                    rel.type === "間接参照" ? "text-slate-400 italic" : "text-slate-600 font-medium"
                                )}>
                                    <td className="px-6 py-3.5">{rel.from}</td>
                                    <td className="px-6 py-3.5">{rel.to}</td>
                                    <td className="px-6 py-3.5"><Badge className="bg-slate-100 text-slate-500 border-none px-2 py-0 text-[10px] font-black">{rel.cardinality}</Badge></td>
                                    <td className="px-6 py-3.5">{rel.type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <footer className="pt-10 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                SignsAI Object Model Schema Diagram v1.1 - Detailed View
            </footer>
        </main>
    );
}

function ZoneCard({ zone }: { zone: any }) {
    return (
        <div className={cn("rounded-3xl border p-6 flex flex-col h-full", zone.colorClass)}>
            <div className="flex items-center gap-3 mb-6">
                <div className={cn("p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5", zone.titleClass)}>
                    <zone.icon className="w-5 h-5" />
                </div>
                <h2 className={cn("text-lg font-black tracking-tight", zone.titleClass)}>
                    {zone.title}
                </h2>
            </div>
            
            <div className={cn(
                "grid gap-3",
                zone.fullWidth ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
            )}>
                {zone.objects.map((obj: any, i: number) => (
                    <div key={i} className="bg-white/60 backdrop-blur-sm border border-white p-4 rounded-2xl shadow-sm group hover:bg-white transition-all">
                        <div className="flex items-center gap-3 mb-0.5">
                            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:text-slate-600 transition-colors">
                                <obj.icon className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-sm font-black text-slate-700 tracking-tight">{obj.name}</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold ml-8 leading-tight">{obj.desc}</p>
                        {obj.fields && (
                            <p className="text-[9px] text-slate-400/80 font-mono ml-8 mt-1.5 truncate border-t border-slate-100/50 pt-1">
                                {obj.fields}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
