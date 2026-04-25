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
    History
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/index";

export default function AdminSchemaPage() {
    const zones = [
        {
            title: "テナント基盤",
            id: "foundation",
            colorClass: "bg-emerald-50 border-emerald-200",
            titleClass: "text-emerald-700",
            icon: Building2,
            objects: [
                { name: "Plan", desc: "契約プラン定義", icon: CreditCard },
                { name: "Company", desc: "テナント企業", icon: Building2 },
                { name: "Department", desc: "組織部署", icon: Users },
                { name: "User", desc: "利用者", icon: Users },
                { name: "NotificationSetting", desc: "通知設定", icon: Bell },
            ]
        },
        {
            title: "業績・リソース",
            id: "performance",
            colorClass: "bg-violet-50 border-violet-200",
            titleClass: "text-violet-700",
            icon: LineChart,
            objects: [
                { name: "KpiDefinition", desc: "指標定義", icon: Target },
                { name: "KpiRecord", desc: "月次実績", icon: LineChart },
                { name: "KpiAxis", desc: "集計軸 (Areaなど)", icon: Layers },
                { name: "ResourceRecord", desc: "人件費・人数", icon: Users },
            ]
        },
        {
            title: "サーベイ",
            id: "survey",
            colorClass: "bg-rose-50 border-rose-200",
            titleClass: "text-rose-700",
            icon: ClipboardList,
            objects: [
                { name: "SurveyResponse", desc: "回答ヘッダ", icon: ClipboardList },
                { name: "SurveyAnswer", desc: "各問のスコア", icon: CheckCircle2 },
                { name: "SemanticLayer", desc: "組織方針", icon: FileSearch },
            ]
        },
        {
            title: "AI分析",
            id: "ai",
            colorClass: "bg-amber-50 border-amber-200",
            titleClass: "text-amber-700",
            icon: Brain,
            objects: [
                { name: "AiInsight", desc: "分析レポート全文", icon: Brain },
                { name: "Summary Data", desc: "weather / risk_level", icon: Zap },
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
                { name: "ActionItem", desc: "組織改善施策", icon: CheckCircle2 },
                { name: "Invitation", desc: "招待トークン", icon: Mail },
                { name: "AdminActivityLog", desc: "操作履歴", icon: History },
            ]
        }
    ];

    const Zap = ({ className }: { className?: string }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M4 14.75V3.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 .5.5v11.25" />
        <path d="M15 21l-3-3 3-3" />
        <path d="M9 15l3 3-3 3" />
      </svg>
    );

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

            <footer className="pt-10 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                SignsAI Object Model Schema Diagram v1.0
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
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:text-slate-600 transition-colors">
                                <obj.icon className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-sm font-black text-slate-700 tracking-tight">{obj.name}</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold ml-8">{obj.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
