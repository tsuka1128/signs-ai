"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Brain,
    AreaChart,
    BarChart3,
    Target,
    Thermometer,
    CheckCircle2,
    BookOpen,
    Building2,
    Activity,
    Settings,
    CalendarDays,
    Users,
    Rocket,
    Wallet,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/index";

type Role = string | null | undefined;

const isManagerUp = (r: Role) => r === "super_admin" || r === "admin" || r === "executive" || r === "manager";
const isAdmin = (r: Role) => r === "super_admin" || r === "admin";
const isExecUp = (r: Role) => r === "super_admin" || r === "admin" || r === "executive";

interface TileDef {
    label: string;
    icon: any;
    /** ?sec= で切り替えるセクション or 別ページへの Link */
    kind: "section" | "link";
    target: string;
    visible: (role: Role, isPro: boolean) => boolean;
    pro?: boolean;
}

const TILES: TileDef[] = [
    // 全ユーザー（ダッシュボード内セクション）
    { label: "AI組織診断", icon: Brain, kind: "section", target: "report", visible: () => true },
    { label: "マトリックス", icon: AreaChart, kind: "section", target: "matrix", visible: () => true },
    { label: "KPI推移", icon: BarChart3, kind: "section", target: "kpi", visible: () => true },
    { label: "組織サマリー", icon: Target, kind: "section", target: "org", visible: () => true },
    { label: "組織の体温", icon: Thermometer, kind: "section", target: "survey", visible: () => true },
    { label: "組織方針", icon: BookOpen, kind: "section", target: "semantic", visible: () => true },
    // マネージャー以上
    { label: "部署マネジメント", icon: Building2, kind: "link", target: "/dept", visible: (r) => isManagerUp(r) },
    { label: "アクション", icon: CheckCircle2, kind: "section", target: "action", visible: (r) => isManagerUp(r) },
    { label: "KPI入力", icon: Activity, kind: "link", target: "/kpi", visible: (r) => isManagerUp(r) },
    // 管理者
    { label: "ボイスチェック", icon: CheckCircle2, kind: "link", target: "/voice-check", visible: (r) => isAdmin(r) },
    { label: "設定管理", icon: Settings, kind: "link", target: "/settings", visible: (r) => isAdmin(r) },
    { label: "今月の組織目標", icon: CalendarDays, kind: "link", target: "/monthly-focus", visible: (r) => isExecUp(r) },
    // Pro（管理者・役員）
    { label: "人事インサイト", icon: Users, kind: "link", target: "/hr-strategy", visible: (r) => isExecUp(r), pro: true },
    { label: "施策ROI", icon: Rocket, kind: "link", target: "/hr-strategy/campaigns", visible: (r) => isExecUp(r), pro: true },
    { label: "人件費分析", icon: Wallet, kind: "section", target: "finance", visible: (r) => isExecUp(r), pro: true },
];

interface QuickAccessGridProps {
    userRole: Role;
    isPro: boolean;
    onSectionChange?: (id: string) => void;
}

export function QuickAccessGrid({ userRole, isPro, onSectionChange }: QuickAccessGridProps) {
    const router = useRouter();
    const tiles = TILES.filter((t) => t.visible(userRole, isPro));

    const handleClick = (t: TileDef) => {
        if (t.kind === "section") {
            onSectionChange?.(t.target);
            // 上部へスクロールしてセクションを見せる
            if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            router.push(t.target);
        }
    };

    return (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                クイックアクセス
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
                {tiles.map((t) => (
                    <button
                        key={t.label}
                        onClick={() => handleClick(t)}
                        className={cn(
                            "group flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border border-slate-100",
                            "text-left transition-all hover:border-teal/30 hover:bg-teal/5"
                        )}
                    >
                        <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-100 flex items-center justify-center shrink-0 transition-colors">
                            <t.icon className="w-4 h-4 text-slate-500 group-hover:text-teal transition-colors" />
                        </div>
                        <span className="text-[12px] font-bold text-slate-600 group-hover:text-slate-900 leading-tight flex-1 min-w-0 truncate">
                            {t.label}
                        </span>
                        {t.pro && (
                            <span className="text-[8px] font-black text-amber-500 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded shrink-0 tracking-widest">
                                PRO
                            </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                ))}
            </div>
        </section>
    );
}
