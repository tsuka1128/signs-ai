import { BarChart3, ShieldCheck, Zap, LucideIcon } from "lucide-react";

export interface AddonDefinition {
    id: string;
    name: string;
    shortName: string;
    description: string;
    icon: LucideIcon;
    includedInPlans: string[];
}

/**
 * アドオン（オプション機能）の定義
 * 管理画面の編集モーダルと、企業詳細画面の表示で共通して使用します。
 */
export const AVAILABLE_ADDONS: AddonDefinition[] = [
    {
        id: "addon_labor_analytics",
        name: "人件費分析・ROIダッシュボード",
        shortName: "人件費・ROI",
        description: "人件費データを用いたKPI分析と、施策の投資対効果（ROI）を可視化します。",
        icon: BarChart3,
        includedInPlans: ["pro"]
    },
    {
        id: "addon_ai_weekly",
        name: "AI 週次分析レポート",
        shortName: "AI週次分析",
        description: "月次ではなく週単位でのAIサマリーとアクション改善提案を生成します。",
        icon: Zap,
        includedInPlans: ["pro"]
    },
    {
        id: "addon_security_sso",
        name: "SSO / セキュリティ強化",
        shortName: "SSO/セキュリティ",
        description: "SAML認証によるSSOログインや、詳細な監査ログの書き出し制限を解除します。",
        icon: ShieldCheck,
        includedInPlans: []
    }
];
