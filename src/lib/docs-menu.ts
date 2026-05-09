import {
    BookOpen,
    MessageSquare,
    BarChart3,
    Users,
    HelpCircle,
    Target,
    CheckSquare,
    Rocket,
    MessageSquareHeart,
    Table2,
    LayoutDashboard,
    TrendingUp,
    Workflow,
    Crown,
} from "lucide-react";

export type DocsMenuItem = {
    title: string;
    href: string;
    icon: typeof BookOpen;
};

export type DocsMenuGroup = {
    title: string;
    items: DocsMenuItem[];
};

export const DOCS_MENU: DocsMenuGroup[] = [
    {
        title: "はじめに",
        items: [
            { title: "Signs AIとは？", href: "/docs/introduction", icon: BookOpen },
            { title: "使い方の全体像（月次サイクル）", href: "/docs/flow", icon: Workflow },
            { title: "初回セットアップガイド", href: "/docs/getting-started", icon: Rocket },
        ],
    },
    {
        title: "設定と連携",
        items: [
            { title: "KPIの設定と入力", href: "/docs/kpi-setup", icon: BarChart3 },
            { title: "組織方針の登録", href: "/docs/policy-guide", icon: Target },
            { title: "Slackアプリを準備する", href: "/docs/slack-integration", icon: MessageSquare },
            { title: "メンバーの招待・管理", href: "/docs/member-management", icon: Users },
        ],
    },
    {
        title: "日常の運用",
        items: [
            { title: "ボイスチェック回答ガイド", href: "/docs/voice-check", icon: MessageSquareHeart },
            { title: "KPI実績の入力方法", href: "/docs/kpi-input", icon: Table2 },
            { title: "ダッシュボードの見方", href: "/docs/dashboard-guide", icon: LayoutDashboard },
        ],
    },
    {
        title: "分析と改善",
        items: [
            { title: "組織改善のPDCAサイクル", href: "/docs/pdca-guide", icon: Target },
            { title: "アクション管理の使い方", href: "/docs/action-guide", icon: CheckSquare },
            { title: "マトリックスの見方", href: "/docs/bubble-chart-guide", icon: BarChart3 },
            { title: "マトリックスが示す成長の軌跡", href: "/docs/growth-steps", icon: TrendingUp },
        ],
    },
    {
        title: "Pro 機能",
        items: [
            { title: "人事戦略インサイトの使い方", href: "/docs/hr-strategy-guide", icon: Crown },
        ],
    },
    {
        title: "サポート",
        items: [
            { title: "FAQ / トラブルシューティング", href: "/docs/faq", icon: HelpCircle },
        ],
    },
];
