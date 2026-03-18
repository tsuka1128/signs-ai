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
    Cpu
} from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type SettingCategory = "system" | "ai" | "alert";

export default function AdminSettingsPage() {
    const { supabase, loading: authLoading } = useAdmin();
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingCategory>("system");
    const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

    useEffect(() => {
        if (authLoading) return;
        fetchSettings();
    }, [supabase, authLoading]);

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

    const handleChange = (key: string, value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = async (category: SettingCategory) => {
        setSaving(true);
        try {
            const categorySettings = settings.filter(s => s.category === category);
            
            const updates = categorySettings.map(s => ({
                id: s.id,
                key: s.key,
                category: s.category,
                value: localSettings[s.key],
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from("system_settings")
                .upsert(updates);

            if (error) throw error;
            alert("設定を保存しました。");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("保存に失敗しました。");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading fullScreen message="システム設定を読み込んでいます..." />;
    }

    return (
        <div className="p-8 space-y-8 animate-fadeIn max-w-6xl mx-auto">
            {/* Header Section */}
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">システム設定</h1>
                    </div>
                    <p className="text-slate-500 font-medium">サービス全体の制御・AI品質・アラート基準を管理します</p>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex p-1.5 bg-slate-100 rounded-[24px] w-fit">
                {[
                    { id: "system", label: "システム制御", icon: Globe },
                    { id: "ai", label: "AIコントロール", icon: Brain },
                    { id: "alert", label: "アラート・通知", icon: Bell },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SettingCategory)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                            activeTab === tab.id
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-teal" : "text-slate-400")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {activeTab === "system" && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                        {/* Maintenance Mode */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 rounded-xl">
                                        <Lock className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900">メンテナンスモード</h3>
                                        <p className="text-xs font-medium text-slate-400">一般ユーザーのアクセスを制限します</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={localSettings['maintenance_mode'] === true}
                                        onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-500"></div>
                                </label>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-50 rounded-xl">
                                        <RefreshCcw className="w-5 h-5 text-teal" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900">新規登録の受付</h3>
                                        <p className="text-xs font-medium text-slate-400">LPからのサインアップを許可します</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={localSettings['registration_enabled'] === true}
                                        onChange={(e) => handleChange('registration_enabled', e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal"></div>
                                </label>
                            </div>
                        </div>

                        {/* Other System Settings */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-sm font-black text-slate-900 mb-1.5 block">デフォルトトライアル期間（日）</span>
                                    <input 
                                        type="number"
                                        value={localSettings['default_trial_days'] || 0}
                                        onChange={(e) => handleChange('default_trial_days', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                                    />
                                </label>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === "ai" && (
                    <section className="space-y-6 animate-slideUp">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <div className="p-3 bg-teal/10 rounded-2xl">
                                    <Brain className="w-6 h-6 text-teal" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">AI分析エンジン調整</h3>
                                    <p className="text-sm font-medium text-slate-500">プロンプトと生成パラメータをチューニングします</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <label className="block">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-black text-slate-900">ベースシステムプロンプト</span>
                                            <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px]">Global Prompt</Badge>
                                        </div>
                                        <textarea 
                                            value={localSettings['base_system_prompt'] || ""}
                                            onChange={(e) => handleChange('base_system_prompt', e.target.value)}
                                            rows={8}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-[24px] text-sm font-medium focus:ring-2 focus:ring-teal/20 transition-all font-mono leading-relaxed"
                                            placeholder="AIに対する基本的な役割分担や禁止事項を入力してください..."
                                        />
                                    </label>
                                </div>

                                <div className="space-y-8">
                                    <label className="block">
                                        <span className="text-sm font-black text-slate-900 mb-2 block">デフォルト使用モデル</span>
                                        <select 
                                            value={localSettings['default_model'] || ""}
                                            onChange={(e) => handleChange('default_model', e.target.value)}
                                            className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all appearance-none"
                                        >
                                            <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Latest)</option>
                                            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                                            <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
                                        </select>
                                    </label>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-black text-slate-900">Temperature (創造性の強さ)</span>
                                            <span className="text-sm font-black text-teal tabular-nums">{localSettings['temperature'] || 0.7}</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.1" 
                                            value={localSettings['temperature'] || 0.7}
                                            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal"
                                        />
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>堅実・一貫性</span>
                                            <span>創造的・多様性</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                                            プロンプトやモデルの変更は、すべての企業のAI分析に即座に反映されます。本番環境での大幅な変更は十分な検証後に行ってください。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === "alert" && (
                    <section className="animate-slideUp max-w-2xl">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                            <div className="space-y-6">
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    解約リスク（アラート）閾値
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="block">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">最終ログイン経過日数</span>
                                        <input 
                                            type="number"
                                            value={localSettings['churn_threshold_days'] || 0}
                                            onChange={(e) => handleChange('churn_threshold_days', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">KPI未入力月数</span>
                                        <input 
                                            type="number"
                                            value={localSettings['kpi_missing_threshold_months'] || 0}
                                            onChange={(e) => handleChange('kpi_missing_threshold_months', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-teal" />
                                    運営用通知先設定
                                </h3>
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Slack Webhook URL</span>
                                        <input 
                                            type="text"
                                            value={localSettings['notification_slack_webhook'] || ""}
                                            onChange={(e) => handleChange('notification_slack_webhook', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium"
                                            placeholder="https://hooks.slack.com/services/..."
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">管理用メールアドレス</span>
                                        <input 
                                            type="email"
                                            value={localSettings['notification_email'] || ""}
                                            onChange={(e) => handleChange('notification_email', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="sticky bottom-8 flex justify-center pt-8">
                <button
                    onClick={() => handleSave(activeTab)}
                    disabled={saving}
                    className="flex items-center gap-3 px-10 py-4.5 bg-slate-900 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-slate-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <RefreshingLoader className="w-6 h-6 animate-spin" />
                    ) : (
                        <Save className="w-6 h-6" />
                    )}
                    {saving ? "保存中..." : `${activeTab === 'system' ? 'システム' : activeTab === 'ai' ? 'AI' : 'アラート'}設定を保存`}
                </button>
            </div>
        </div>
    );
}

function RefreshingLoader({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}
