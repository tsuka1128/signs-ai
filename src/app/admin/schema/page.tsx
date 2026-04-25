"use client";

import { useState } from "react";
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
    Zap,
    Database,
    ArrowRight,
    Lightbulb,
    TrendingUp
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

const zoneColorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    slate: "bg-slate-50 text-slate-500",
};

const ROLE_FLOWS = [
  {
    role: "admin",
    label: "管理者",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badgeColor: "bg-emerald-500",
    description: "システム全体のセットアップを担う。テナント構築からAI分析燃料の投入まで一貫して管理する。",
    steps: [
      { no: 1, object: "Company 作成", fields: "name / plan_id / status", zone: "テナント基盤", color: "emerald" },
      { no: 2, object: "Department 作成", fields: "name / headcount", zone: "テナント基盤", color: "emerald" },
      { no: 3, object: "Invitation 送信", fields: "email / role / expires_at", zone: "管理系", color: "slate" },
      { no: 4, object: "KpiDefinition 登録", fields: "name / unit / target", zone: "業績・KPI", color: "violet" },
      { no: 5, object: "SemanticLayer 設定", fields: "content（会社文脈）", zone: "サーベイ設定", color: "rose" },
      { no: 6, object: "KpiRecord 入力", fields: "value / target / month", zone: "業績・KPI", color: "violet" },
      { no: 7, object: "ResourceRecord 入力", fields: "head_count / labor_cost", zone: "業績・KPI", color: "violet" },
      { no: 8, object: "AiInsight 確認", fields: "weather / content(140字)", zone: "AI分析", color: "amber" },
      { no: 9, object: "ActionItem 作成", fields: "priority / owner / due_date", zone: "アクション", color: "sky" },
    ]
  },
  {
    role: "player",
    label: "プレイヤー（現場）",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    badgeColor: "bg-rose-500",
    description: "接点は最小。Invitationで参加し、毎月Slack通知を受けてアンケートに回答するだけ。",
    steps: [
      { no: 1, object: "Invitation 受け取り", fields: "→ User生成 (role:player)", zone: "管理系", color: "slate" },
      { no: 2, object: "Slack 通知受信", fields: "User.slack_user_id", zone: "テナント基盤", color: "emerald" },
      { no: 3, object: "SurveyResponse 作成", fields: "recorded_month / dept", zone: "サーベイ", color: "rose" },
      { no: 4, object: "SurveyAnswer × 11", fields: "question_no / score", zone: "サーベイ", color: "rose" },
    ],
    note: "匿名URL回答の場合: User不要 → SignsAI IDのみでSurveyResponse作成"
  },
  {
    role: "executive",
    label: "エグゼクティブ（経営者）",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    badgeColor: "bg-amber-500",
    description: "読み専。AiInsightを起点に全社データを横断参照し、ActionItemの承認・作成につなげる。",
    steps: [
      { no: 1, object: "AiInsight 閲覧（全社）", fields: "audience_role: executive", zone: "AI分析", color: "amber" },
      { no: 2, object: "KpiRecord 参照", fields: "全部署・全KPI 月次推移", zone: "業績・KPI", color: "violet" },
      { no: 3, object: "ResourceRecord 参照", fields: "人件費 / 生産性スコア", zone: "業績・KPI", color: "violet" },
      { no: 4, object: "SurveyResponse 参照", fields: "pulse / 部署別サマリー", zone: "サーベイ", color: "rose" },
      { no: 5, object: "ActionItem 承認・作成", fields: "priority: urgent / medium", zone: "アクション", color: "sky" },
    ],
    note: "操作は AdminActivityLog に自動記録（間接参照）"
  },
  {
    role: "partner",
    label: "パートナー（VC・コンサル）",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    badgeColor: "bg-pink-500",
    description: "partner_access_controlで許可された複数社を横断。各社の文脈を掴みAiInsightを読んでActionItemを提案する。",
    steps: [
      { no: 1, object: "複数社横断アクセス", fields: "partner_access_control で許可された企業", zone: "テナント基盤", color: "emerald" },
      { no: 2, object: "SemanticLayer 参照", fields: "各社固有の文脈を把握", zone: "サーベイ設定", color: "rose" },
      { no: 3, object: "AiInsight 閲覧", fields: "各社 executive スコープ", zone: "AI分析", color: "amber" },
      { no: 4, object: "ActionItem 提案", fields: "owner: 各社 admin/manager", zone: "アクション", color: "sky" },
    ]
  }
];

export default function AdminSchemaPage() {
    const [activeRole, setActiveRole] = useState("admin");

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

    const activeFlow = ROLE_FLOWS.find(r => r.role === activeRole) || ROLE_FLOWS[0];

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
            <section className="space-y-4 pt-12 border-t border-slate-100">
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

            {/* Role Flows Section */}
            <section className="space-y-8 pt-12 border-t border-slate-100">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                        ロール別ユースケースフロー
                    </h2>
                    <p className="text-xs text-slate-400 font-bold">
                        各ロールがどのオブジェクトをどの順に操作するかを示します。
                    </p>
                </div>

                {/* Tab UI */}
                <div className="flex flex-wrap gap-2">
                    {ROLE_FLOWS.map(rf => (
                        <button
                            key={rf.role}
                            onClick={() => setActiveRole(rf.role)}
                            className={cn(
                                "px-5 py-2.5 rounded-full text-xs font-black border transition-all shadow-sm",
                                activeRole === rf.role 
                                    ? cn(rf.color, "ring-2 ring-offset-2 ring-slate-100") 
                                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                            )}
                        >
                            {rf.label}
                        </button>
                    ))}
                </div>

                {/* Active Flow Display */}
                <div className={cn("rounded-[40px] border p-8 space-y-8 transition-all", activeFlow.color)}>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Badge className={cn("text-white border-none font-black", activeFlow.badgeColor)}>
                                {activeFlow.label}
                            </Badge>
                            <h3 className="text-lg font-black tracking-tight">{activeFlow.label}のジャーニー</h3>
                        </div>
                        <p className="text-sm font-medium opacity-80 max-w-3xl leading-relaxed">
                            {activeFlow.description}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-stretch">
                        {activeFlow.steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-3xl p-5 shadow-sm min-w-[180px] flex flex-col hover:bg-white transition-all hover:shadow-md h-full">
                                    <div className="text-[10px] font-black text-slate-300 mb-2 uppercase tracking-widest">STEP {step.no}</div>
                                    <div className="text-sm font-black text-slate-800 leading-tight mb-1">{step.object}</div>
                                    <div className="text-[10px] font-mono text-slate-400 line-clamp-2 min-h-[1.5rem]">{step.fields}</div>
                                    <div className={cn("mt-4 text-[9px] font-black px-3 py-1 rounded-full self-start", zoneColorMap[step.color])}>
                                        {step.zone}
                                    </div>
                                </div>
                                {i < activeFlow.steps.length - 1 && (
                                    <div className="text-slate-300/50 font-black text-2xl animate-pulse">
                                        ▸
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {activeFlow.note && (
                        <div className="mt-4 bg-white/40 border border-dashed border-white/60 rounded-3xl px-6 py-4 text-[12px] text-slate-500 font-bold flex items-start gap-3">
                            <span className="text-base mt-[-2px]">💡</span>
                            <p className="leading-relaxed">{activeFlow.note}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Solution Flow Section */}
            <section className="space-y-8 pt-12 border-t border-slate-100">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                        ソリューション・データフロー
                    </h2>
                    <p className="text-xs text-slate-400 font-bold">
                        データが Signs AI 内でどのように処理・変換されるかの論理プロセスを示します。
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {[
                        {
                            stage: "01. INPUT",
                            title: "データの蓄積",
                            icon: Database,
                            color: "bg-emerald-500",
                            desc: "現場の事実と感情を収集",
                            items: ["KpiRecord", "SurveyAnswer", "ResourceRecord"]
                        },
                        {
                            stage: "02. CONTEXT",
                            title: "文脈の定義",
                            icon: Lightbulb,
                            color: "bg-violet-500",
                            desc: "組織の価値基準を定義",
                            items: ["SemanticLayer", "KpiDefinition", "Plan"]
                        },
                        {
                            stage: "03. ANALYSIS",
                            title: "AI 構造化",
                            icon: Brain,
                            color: "bg-amber-500",
                            desc: "データと文脈を掛け合わせ、知恵へ昇華",
                            items: ["AiInsight", "Anomaly Detection"]
                        },
                        {
                            stage: "04. ACTION",
                            title: "価値提供",
                            icon: TrendingUp,
                            color: "bg-sky-500",
                            desc: "具体的な改善行動を促す",
                            items: ["ActionItem", "Slack Notifications"]
                        }
                    ].map((step, i) => (
                        <div key={i} className="relative group">
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm group-hover:shadow-md transition-all h-full flex flex-col">
                                <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black text-white mb-4 shadow-sm", step.color)}>
                                    {step.stage}
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-black text-slate-800">{step.title}</h3>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">{step.desc}</p>
                                <div className="mt-auto flex flex-wrap gap-1.5 border-t border-slate-50 pt-4">
                                    {step.items.map((item, j) => (
                                        <span key={j} className="text-[9px] font-mono bg-slate-50 text-slate-400 px-2 py-0.5 rounded border border-slate-100">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {i < 3 && (
                                <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-slate-100 rounded-full items-center justify-center shadow-sm">
                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <footer className="pt-10 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                SignsAI Object Model Schema Diagram v1.2 - Full Documentation
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
