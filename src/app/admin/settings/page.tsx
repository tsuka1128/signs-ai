"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { 
    Settings, 
    ShieldCheck, 
    Brain, 
    Bell, 
    ToggleLeft, 
    Save, 
    RefreshCcw,
    AlertTriangle,
    Mail,
    Globe,
    Lock,
    Cpu,
    ClipboardList,
    CreditCard,
    Timer,
    Link2,
    Zap,
    FileText,
    BarChart3,
    ChevronDown,
    ChevronRight,
    Command
} from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/index";
import { toast } from "sonner";

/** 設定タブの種別 */
type SettingCategory = "system" | "ai" | "alert" | "survey";

/**
 * 管理者設定ページ
 * 
 * サービス全体の設定を管理するページ。
 * タブ: システム制御 / AIコントロール / 通知・監視 / ボイスチェック
 */
export default function AdminSettingsPage() {
    const { supabase, loading: authLoading } = useAdmin();
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingCategory>("system");
    const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
    const [openSlot, setOpenSlot] = useState<string | null>(null);

    // AIスロットの定義
    const AI_SLOTS = [
        { id: 'ai_dashboard_summary', label: '1. ダッシュボード要約 (全社/部署)', desc: 'MainInsightCardの4〜5行のサマリー', defaultTokens: 1024 },
        { id: 'ai_deep_report', label: '2. ディープレポート', desc: 'DeepReportの経営層向け詳細分析', defaultTokens: 4096 },
        { id: 'ai_pulse_analysis', label: '3. 体温分析レポート', desc: 'SurveySectionのボイスチェックAI分析', defaultTokens: 1024 },
        { id: 'ai_policy_translation', label: '4. 方針プレビュー翻訳', desc: 'SemanticLayerで組織方針を各部署の文脈に合わせて翻訳', defaultTokens: 1024 },
        { id: 'ai_policy_extraction', label: '5. 方針サマリー抽出', desc: 'SemanticLayerでフェーズ/最重要KPI/最優先アジェンダを自動抽出', defaultTokens: 512 },
        { id: 'ai_matrix_analysis', label: '6. マトリックス分析', desc: '部署/プロダクトマトリックスでの配置状況・相関の分析', defaultTokens: 1024 },
        { id: 'ai_action_proposal', label: '7. アクション提案', desc: '組織状態に基づき今月打つべき具体策を3〜5点提案', defaultTokens: 1024 },
        { id: 'ai_kpi_insight', label: '8. KPI・プロダクト示唆', desc: '各指標ごとの局所的な相関や示唆テキスト', defaultTokens: 512 },
    ];

    useEffect(() => {
        if (authLoading) return;
        fetchSettings();
    }, [supabase, authLoading]);

    /** DB から全設定を取得し、ローカルの key-value マップに変換する */
    async function fetchSettings() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("system_settings")
                .select("*")
                .order("key");

            if (error) throw error;
            setSettings(data || []);
            
            // フラットなオブジェクトに変換して編集しやすくする
            const local: Record<string, any> = {};
            data?.forEach(s => {
                local[s.key] = s.value;
            });
            setLocalSettings(local);
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * 設定値の変更ハンドラ
     * システム制御の重要項目は確認ダイアログを表示
     */
    const handleChange = (key: string, value: any) => {
        // システム制御項目の場合は確認ポップアップを表示
        if (key === 'maintenance_mode' || key === 'registration_enabled') {
            const label = key === 'maintenance_mode' ? 'メンテナンスモード' : '新規登録の受付';
            const action = value ? '有効' : '解除';
            if (!window.confirm(`${label}を${action}に変更してもよろしいですか？\nシステム全体に影響します。`)) {
                return;
            }
        }

        setLocalSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    /**
     * カテゴリ単位で設定を保存する
     * 
     * handleSave は現在 アクティブタブのカテゴリに属する設定だけを upsert する。
     * AIタブの場合は、'ai' および 'ai_prompt' カテゴリの設定を両方保存する。
     */
    const handleSave = async (category: SettingCategory) => {
        setSaving(true);
        try {
            const categorySettings = settings.filter(s => 
                s.category === category || (category === 'ai' && s.category === 'ai_prompt')
            );
            
            const updates = categorySettings.map(s => ({
                id: s.id,
                key: s.key,
                category: s.category,
                value: localSettings[s.key],
                updated_at: new Date().toISOString()
            }));

            // AIタブ保存時に、settingsに存在しないキー（anthropic_api_key等）も追加して保存
            if (category === 'ai' && localSettings['anthropic_api_key'] !== undefined) {
                const hasKey = updates.some(u => u.key === 'anthropic_api_key');
                if (!hasKey) {
                    updates.push({
                        key: 'anthropic_api_key',
                        category: 'ai',
                        value: localSettings['anthropic_api_key'],
                        updated_at: new Date().toISOString()
                    } as any);
                }
            }

            const { error } = await supabase
                .from("system_settings")
                .upsert(updates);

            if (error) throw error;

            // 再取得してステートを同期
            await fetchSettings();
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("保存に失敗しました。");
        } finally {
            setTimeout(() => setSaving(false), 800);
        }
    };

    /**
     * テストSlack通知送信（管理用）
     */
    const handleTestSlackWebhook = async () => {
        const webhookUrl = localSettings['notification_slack_webhook'];
        if (!webhookUrl) {
            toast.success("Webhook URLを入力・保存してからテストしてください。");
            return;
        }
        
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings/test-slack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ webhookUrl })
            });

            if (res.ok) {
                toast.success("テスト通知を送信しました。Slackチャンネルをご確認ください");
            } else {
                const data = await res.json();
                toast.error(`送信失敗: ${data.error || "詳細不明"}`);
            }
        } catch (error: any) {
            toast.error(`エラーが発生しました: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading fullScreen message="システム設定を読み込んでいます..." />;
    }

    return (
        <div className="p-8 space-y-8 animate-fadeIn max-w-6xl mx-auto pb-32">
            {/* Header Section */}
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">システム設定</h1>
                    </div>
                    <p className="text-slate-500 font-medium font-mono text-sm">/ SERVICE_LEVEL_CONFIGURATION</p>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-md rounded-[24px] w-fit border border-slate-200/50 overflow-x-auto">
                {[
                    { id: "system", label: "システム制御", icon: Globe },
                    { id: "ai", label: "AIコントロール", icon: Brain },
                    { id: "alert", label: "通知・監視", icon: Bell },
                    { id: "survey", label: "ボイスチェック", icon: ClipboardList },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SettingCategory)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-white text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] translate-y-[-1px]"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4 transition-colors", activeTab === tab.id ? "text-teal" : "text-slate-400")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* ========== システム制御タブ ========== */}
                {activeTab === "system" && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                        {/* Maintenance Mode & Registration */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-rose-50 rounded-xl">
                                        <Lock className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900">メンテナンスモード</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Service Interruption Control</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={localSettings['maintenance_mode'] === true}
                                        onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
                                </label>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-teal-50 rounded-xl">
                                        <RefreshCcw className="w-5 h-5 text-teal" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900">新規登録の受付</h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Public Registration Gate</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={localSettings['registration_enabled'] === true}
                                        onChange={(e) => handleChange('registration_enabled', e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal shadow-inner"></div>
                                </label>
                            </div>
                        </div>

                        {/* Trial & Invitation Settings */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-sm font-black text-slate-900 mb-1.5 block">デフォルトトライアル期間（日）</span>
                                    <div className="relative group">
                                        <input 
                                            type="number"
                                            value={localSettings['default_trial_days'] || 0}
                                            onChange={(e) => handleChange('default_trial_days', parseInt(e.target.value))}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-teal/20 transition-all group-hover:bg-slate-100/50"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Days</div>
                                    </div>
                                </label>
                            </div>
                            <div className="space-y-4">
                                <label className="block">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Link2 className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-black text-slate-900">招待リンク有効期限（日）</span>
                                    </div>
                                    <div className="relative group">
                                        <input 
                                            type="number"
                                            value={localSettings['invitation_expiry_days'] || 30}
                                            onChange={(e) => handleChange('invitation_expiry_days', parseInt(e.target.value))}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-teal/20 transition-all group-hover:bg-slate-100/50"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Days</div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">招待トークンが自動失効するまでの日数</p>
                                </label>
                            </div>
                        </div>

                        {/* Plan Pricing Table */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 hover:shadow-md transition-shadow md:col-span-2">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <div className="p-2.5 bg-indigo-50 rounded-xl">
                                    <CreditCard className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">プラン別料金テーブル</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Plan Pricing Configuration</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { key: 'plan_price_free', label: 'Free', color: 'slate' },
                                    { key: 'plan_price_team', label: 'Team', color: 'blue' },
                                    { key: 'plan_price_standard', label: 'Standard', color: 'purple' },
                                    { key: 'plan_price_pro', label: 'Pro', color: 'amber' },
                                ].map((plan) => (
                                    <div key={plan.key} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2.5 h-2.5 rounded-full",
                                                plan.color === 'slate' && "bg-slate-400",
                                                plan.color === 'blue' && "bg-blue-500",
                                                plan.color === 'purple' && "bg-purple-500",
                                                plan.color === 'amber' && "bg-amber-500",
                                            )} />
                                            <span className="text-xs font-black text-slate-700">{plan.label}</span>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">¥</span>
                                            <input 
                                                type="number"
                                                value={localSettings[plan.key] ?? 0}
                                                onChange={(e) => handleChange(plan.key, parseInt(e.target.value) || 0)}
                                                className="w-full pl-8 pr-14 py-3 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-teal/20 transition-all text-right"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">/ 月</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 ml-1">※ MRR計算や課金画面のデフォルト単価として利用されます</p>
                        </div>
                    </section>
                )}

                {/* ========== AIコントロールタブ ========== */}
                {activeTab === "ai" && (
                    <section className="space-y-6 animate-slideUp">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-teal/10 rounded-2xl">
                                    <Brain className="w-6 h-6 text-teal" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">AI分析エンジン調整</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cognitive Core Configuration</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <label className="block">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-black text-slate-900">ベースシステムプロンプト</span>
                                            <Badge className="bg-slate-900 text-white border-none font-black text-[10px] px-3 py-1">STATIC_CORE_PROMPT</Badge>
                                        </div>
                                        <textarea 
                                            value={localSettings['base_system_prompt'] || ""}
                                            onChange={(e) => handleChange('base_system_prompt', e.target.value)}
                                            rows={28}
                                            className="w-full px-5 py-4 bg-slate-950 border-none rounded-[24px] text-xs font-medium text-emerald-400 focus:ring-2 focus:ring-teal/40 transition-all font-mono leading-relaxed shadow-xl ring-1 ring-white/5"
                                            placeholder="AIに対する基本的な役割分担や禁止事項を入力してください..."
                                        />
                                    </label>
                                </div>

                                <div className="space-y-8">
                                    <label className="block">
                                        <span className="text-sm font-black text-slate-900 mb-2 block">デフォルト使用モデル</span>
                                        <div className="relative">
                                            <select 
                                                value={localSettings['default_model'] || ""}
                                                onChange={(e) => handleChange('default_model', e.target.value)}
                                                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all appearance-none pr-10"
                                            >
                                                <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Latest Premium)</option>
                                                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Standard)</option>
                                                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast Logic)</option>
                                                <option value="claude-3-opus-20240229">Claude 3 Opus (Most Intelligent)</option>
                                                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (Legacy)</option>
                                                <option value="claude-3-haiku-20240307">Claude 3 Haiku (Legacy Fast)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <Cpu className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    </label>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-black text-slate-900">Temperature (創造性の強さ)</span>
                                            <span className="text-sm font-black text-teal tabular-nums bg-teal/5 px-2 py-0.5 rounded-lg border border-teal/10">{localSettings['temperature'] || 0.7}</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.1" 
                                            value={localSettings['temperature'] || 0.7}
                                            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                        />
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Deterministic</span>
                                            <span>Creative</span>
                                        </div>
                                    </div>

                                    {/* Max Tokens – 新規追加 */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-black text-slate-900">Max Tokens (出力上限の目安：約{localSettings['max_tokens'] || 1024}文字)</span>
                                            </div>
                                            <span className="text-sm font-black text-teal tabular-nums bg-teal/5 px-2 py-0.5 rounded-lg border border-teal/10">{localSettings['max_tokens'] || 1024}</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="256" 
                                            max="4096" 
                                            step="256" 
                                            value={localSettings['max_tokens'] || 1024}
                                            onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                        />
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>256 (約250文字)</span>
                                            <span>4096 (約4000文字)</span>
                                        </div>
                                    </div>

                                    {/* AI自動実行 – 新規追加 */}
                                    <div className="p-5 bg-slate-50 rounded-[28px] space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                                    <Zap className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">AI分析の自動実行</p>
                                                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">Scheduled Auto-Analysis</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={localSettings['auto_analysis_enabled'] === true}
                                                    onChange={(e) => handleChange('auto_analysis_enabled', e.target.checked)}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal"></div>
                                            </label>
                                        </div>
                                        {localSettings['auto_analysis_enabled'] === true && (
                                            <div className="pl-11">
                                                <label className="block">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">実行頻度</span>
                                                    <select
                                                        value={localSettings['auto_analysis_frequency'] || "monthly"}
                                                        onChange={(e) => handleChange('auto_analysis_frequency', e.target.value)}
                                                        className="w-full px-3 py-2.5 bg-white border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal/20"
                                                    >
                                                        <option value="daily">毎日</option>
                                                        <option value="weekly">毎週</option>
                                                        <option value="monthly">毎月</option>
                                                    </select>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-5 bg-amber-50 rounded-[28px] border border-amber-100/50 flex gap-4 shadow-sm shadow-amber-100/20">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <p className="text-[12px] font-bold text-amber-900 leading-relaxed">
                                            コア・プロンプトの変更は、稼働中の全企業のAI分析ロジックにグローバルに影響します。大規模な改修を行う際は、別ブランチ等での検証後に行ってください。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-teal/10 rounded-2xl">
                                    <Command className="w-6 h-6 text-teal" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">各生成箇所のプロンプト・設定（スロット別）</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generative AI Slots</p>
                                </div>
                            </div>
                            
                            <p className="text-sm font-medium text-slate-500 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                画面内でAIが回答を生成する各箇所に対して、個別にプロンプト（指示書）と制限文字数を与えます。以下のアコーディオンを開いて各スロットの設定を行ってください。
                            </p>

                            <div className="space-y-3">
                                {AI_SLOTS.map(slot => {
                                    const isOpen = openSlot === slot.id;
                                    const promptKey = `${slot.id}_prompt`;
                                    const tokensKey = `${slot.id}_tokens`;
                                    
                                    return (
                                        <div key={slot.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
                                            <button 
                                                onClick={() => setOpenSlot(isOpen ? null : slot.id)}
                                                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                                            >
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800">{slot.label}</h4>
                                                    <p className="text-[11px] font-bold text-slate-400 mt-1">{slot.desc}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-full">
                                                        Max {localSettings[tokensKey] || slot.defaultTokens} Tokens
                                                    </div>
                                                    {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                                </div>
                                            </button>
                                            
                                            {isOpen && (
                                                <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
                                                    <label className="block space-y-2">
                                                        <span className="text-sm font-black text-slate-900">専用システムプロンプト</span>
                                                        <textarea 
                                                            value={localSettings[promptKey] || ""}
                                                            onChange={(e) => handleChange(promptKey, e.target.value)}
                                                            rows={6}
                                                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[20px] text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal/30 focus:border-teal/30 transition-all font-mono leading-relaxed shadow-sm"
                                                            placeholder={`${slot.label}用のプロンプトを入力してください...`}
                                                        />
                                                    </label>

                                                    <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-black text-slate-700">Max Tokens (目安: 約{localSettings[tokensKey] || slot.defaultTokens}文字)</span>
                                                            <span className="text-sm font-black text-teal tabular-nums bg-teal/5 px-3 py-1 rounded-xl border border-teal/10">
                                                                {localSettings[tokensKey] || slot.defaultTokens}
                                                            </span>
                                                        </div>
                                                        <input 
                                                            type="range" 
                                                            min="256" 
                                                            max="4096" 
                                                            step="128" 
                                                            value={localSettings[tokensKey] || slot.defaultTokens}
                                                            onChange={(e) => handleChange(tokensKey, parseInt(e.target.value))}
                                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal"
                                                        />
                                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1">
                                                            <span>256 (約250文字)</span>
                                                            <span className="text-center">{slot.defaultTokens} (推奨)</span>
                                                            <span>4096 (約4000文字)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* API接続設定 – ページ下部へ移動 */}
                        <div className="p-6 bg-slate-900 rounded-[32px] text-white space-y-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <Lock className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm ring-1 ring-white/20">
                                        <Zap className="w-5 h-5 text-teal" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black tracking-tight">API 接続設定</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Global Authentication Keys</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-slate-300">Anthropic API Key (Claude)</span>
                                            <Badge className="bg-teal/20 text-teal border border-teal/30 font-black text-[9px] px-2 py-0">SECURE_STORE</Badge>
                                        </div>
                                        <div className="relative group/key">
                                            <input 
                                                type="password"
                                                value={localSettings['anthropic_api_key'] || ""}
                                                onChange={(e) => handleChange('anthropic_api_key', e.target.value)}
                                                className="w-full pl-5 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-teal focus:ring-2 focus:ring-teal/30 focus:border-teal/30 transition-all group-hover/key:bg-white/10"
                                                placeholder="sk-ant-api..."
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 ml-1 leading-relaxed">
                                            ※ このキーを設定すると、Vercel の環境変数よりも優先して使用されます。<br />
                                            設定しない場合は、システムのデフォルト（環境変数）が使用されます。
                                        </p>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========== 通知・監視タブ ========== */}
                {activeTab === "alert" && (
                    <section className="animate-slideUp max-w-2xl space-y-6">
                        {/* Status Thresholds */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                            <div className="space-y-6">
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                                    解約リスク検知基準
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="block">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">最終ログイン経過日数</span>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={localSettings['churn_threshold_days'] || 0}
                                                onChange={(e) => handleChange('churn_threshold_days', parseInt(e.target.value))}
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-200"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">DAYS</div>
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">KPI未入力月数</span>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={localSettings['kpi_missing_threshold_months'] || 0}
                                                onChange={(e) => handleChange('kpi_missing_threshold_months', parseInt(e.target.value))}
                                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-200"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">MONTHS</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* 非アクティブ検知閾値 – 新規追加 */}
                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <Timer className="w-5 h-5 text-amber-500" />
                                    非アクティブ企業の検知閾値
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="block">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                                            <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">中程度アラート</span>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={localSettings['inactivity_warning_days'] || 30}
                                                onChange={(e) => handleChange('inactivity_warning_days', parseInt(e.target.value))}
                                                className="w-full px-4 py-3 bg-amber-50/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-200"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">DAYS</div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 ml-1">最終更新からこの日数で中アラート</p>
                                    </label>
                                    <label className="block">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            <span className="text-[11px] font-black text-rose-600 uppercase tracking-widest">高アラート</span>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={localSettings['inactivity_critical_days'] || 60}
                                                onChange={(e) => handleChange('inactivity_critical_days', parseInt(e.target.value))}
                                                className="w-full px-4 py-3 bg-rose-50/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-200"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">DAYS</div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1 ml-1">最終更新からこの日数で高アラート</p>
                                    </label>
                                </div>
                            </div>

                            {/* Activity Notifications */}
                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <RefreshCcw className="w-5 h-5 text-teal" />
                                    アクティビティ通知設定
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                                <Building2Icon className="w-4 h-4 text-teal" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">新規企業の登録通知</p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-tight">Send alert on new signup</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={localSettings['notify_new_registration'] === true}
                                                onChange={(e) => handleChange('notify_new_registration', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                                <Settings className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">クライアントの経営方針変更</p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-tight">Send alert on policy updates</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={localSettings['notify_policy_change'] === true}
                                                onChange={(e) => handleChange('notify_policy_change', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal"></div>
                                        </label>
                                    </div>

                                    {/* オンボーディング未完了通知 – 新規追加 */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                                <ClipboardList className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">オンボーディング未完了の通知</p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-tight">Alert on incomplete onboarding</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={localSettings['notify_onboarding_incomplete'] === true}
                                                onChange={(e) => handleChange('notify_onboarding_incomplete', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Destinations */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                            <h3 className="font-black text-slate-900 flex items-center gap-2">
                                <Mail className="w-5 h-5 text-slate-900" />
                                通知先デスティネーション
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Notification Webhook</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <input 
                                                    type="text"
                                                    value={localSettings['notification_slack_webhook'] || ""}
                                                    onChange={(e) => handleChange('notification_slack_webhook', e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-mono text-slate-600 focus:ring-1 focus:ring-slate-200"
                                                    placeholder="https://hooks.slack.com/services/..."
                                                />
                                            </div>
                                            <button 
                                                onClick={handleTestSlackWebhook}
                                                disabled={saving}
                                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors">
                                                {saving ? "..." : "Test"}
                                            </button>
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Main Admin Email</span>
                                        <input 
                                            type="email"
                                            value={localSettings['notification_email'] || ""}
                                            onChange={(e) => handleChange('notification_email', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ========== ボイスチェックタブ（新規追加） ========== */}
                {activeTab === "survey" && (
                    <section className="animate-slideUp max-w-2xl space-y-6">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-indigo-50 rounded-2xl">
                                    <ClipboardList className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">ボイスチェック設定</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Survey & Voice Check Configuration</p>
                                </div>
                            </div>

                            {/* 自由記述の最低文字数 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-black text-slate-900">自由記述の最低文字数</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 relative">
                                        <input 
                                            type="number"
                                            min={0}
                                            max={500}
                                            value={localSettings['min_free_text_length'] ?? 100}
                                            onChange={(e) => handleChange('min_free_text_length', parseInt(e.target.value) || 0)}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-teal/20 transition-all"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">文字</div>
                                    </div>
                                    <span className="text-sm font-black text-teal tabular-nums bg-teal/5 px-3 py-2 rounded-xl border border-teal/10 whitespace-nowrap">
                                        {(localSettings['min_free_text_length'] ?? 100) === 0 ? '任意入力' : `${localSettings['min_free_text_length'] ?? 100}文字以上`}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 ml-1">
                                    アンケートフォームのKPI改善記述欄に適用されます。0にすると自由記述が任意になります。
                                </p>
                            </div>

                            {/* アンケート設問管理（将来対応の枠） */}
                            <div className="space-y-4 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-black text-slate-900">アンケート設問管理</span>
                                    <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] px-2 py-0.5">将来対応</Badge>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[24px] border border-dashed border-slate-200 text-center space-y-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                                        <ClipboardList className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-500">現在、アンケート設問はデフォルト11問で固定されています。</p>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            今後のアップデートで、管理者が設問テキスト・ヒント文・並び順をこの画面から管理できるようになる予定です。
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 回答期間（将来対応の枠） */}
                            <div className="space-y-4 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <Timer className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-black text-slate-900">回答期間ウィンドウ</span>
                                    <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] px-2 py-0.5">将来対応</Badge>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-[24px] border border-dashed border-slate-200 text-center space-y-3">
                                    <p className="text-sm font-bold text-slate-500">現在、ボイスチェックは常時回答可能です。</p>
                                    <p className="text-[11px] text-slate-400">
                                        「毎月1日〜15日のみ回答可能」のようなウィンドウ制御は将来実装予定です。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Premium Floating Action Bar */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-8">
                <div className="bg-slate-900/95 backdrop-blur-xl rounded-[32px] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between">
                    <div className="pl-6 flex items-center gap-3">
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-500",
                            saving ? "bg-teal animate-pulse" : "bg-teal/40"
                        )} />
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                            {saving ? "Deploying Changes..." : `${activeTab.toUpperCase()}_SETTINGS`}
                        </span>
                    </div>
                    <button
                        onClick={() => handleSave(activeTab)}
                        disabled={saving}
                        className="flex items-center gap-3 px-8 py-3.5 bg-white text-slate-900 rounded-[22px] font-black text-sm hover:bg-teal hover:text-white transition-all duration-500 shadow-lg active:scale-[0.96] disabled:opacity-50 min-w-[180px] justify-center"
                    >
                        {saving ? (
                            <RefreshingLoader className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving ? "保存中" : "この内容で適用する"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** ローディングスピナーコンポーネント */
function RefreshingLoader({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

/** ビルディングアイコンコンポーネント */
function Building2Icon({ className }: { className?: string }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
            <path d="M10 6h4"/>
            <path d="M10 10h4"/>
            <path d="M10 14h4"/>
            <path d="M10 18h4"/>
        </svg>
    );
}
