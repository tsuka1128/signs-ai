"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";

const SlackHelpTooltip = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative inline-block ml-1">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors inline-flex items-center"
                title="Slack IDの確認方法"
            >
                <HelpCircle className="w-3.5 h-3.5 text-teal/60" />
            </button>
            {isOpen && (
                <div className="absolute left-0 bottom-full mb-3 w-80 z-[60] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                    <div className="bg-slate-900/95 backdrop-blur-md text-white p-6 rounded-[2rem] shadow-2xl text-[11px] leading-relaxed border border-white/10">
                        <div className="flex justify-between items-start mb-4">
                            <span className="font-black text-teal-400 uppercase tracking-widest text-[9px]">IDの取得手順</span>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-3.5 h-3.5 text-slate-500" /></button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <p className="font-black mb-2 flex items-center gap-2 text-slate-100">
                                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                                    自分のユーザーIDを確認する
                                </p>
                                <ol className="space-y-2 ml-4 list-decimal text-slate-400 font-bold">
                                    <li>Slack画面左下の写真をクリック</li>
                                    <li>「プロフィール」を選択</li>
                                    <li>「その他」（3つの点）をクリック</li>
                                    <li>「メンバーIDをコピー」を選択</li>
                                </ol>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <p className="font-black mb-2 flex items-center gap-2 text-slate-100">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    他のユーザーのIDを確認する
                                </p>
                                <ol className="space-y-2 ml-4 list-decimal text-slate-400 font-bold">
                                    <li>対象者のプロフィールを表示</li>
                                    <li>「その他」（3つの点）をクリック</li>
                                    <li>「メンバーIDをコピー」を選択</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
import {
    Settings2,
    Building2,
    Users,
    Target,
    Layers,
    Save,
    Plus,
    Trash2,
    Star,
    Mail,
    UserPlus,
    ShieldCheck,
    ArrowRight,
    Copy,
    Check,
    Link2,
    Edit3,
    X,
    HelpCircle,
    ClipboardList,
    Share2,
    Send,
    FileText,
    MessageSquare,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";
import { KPI_UNIT_OPTIONS } from "@/lib/constants";

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("company");
    const [loading, setLoading] = useState(true);

    // State
    const [company, setCompany] = useState<any>(null);
    const [depts, setDepts] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any[]>([]);
    const [axes, setAxes] = useState<any[]>([]);
    const [secondaryAxisName, setSecondaryAxisName] = useState("担当領域");
    const [users, setUsers] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [copied, setCopied] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    // Invitation extra state
    const [inviteDeptId, setInviteDeptId] = useState("");
    const [inviteAxisId, setInviteAxisId] = useState("");
    const [inviteSlackUserId, setInviteSlackUserId] = useState("");

    // Editing user state
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        display_name: "",
        slack_user_id: "",
        department_id: "",
        axis_id: ""
    });

    const handleCopyId = () => {
        if (!company?.short_id) return;
        navigator.clipboard.writeText(company.short_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        async function loadSettings() {
            setLoading(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setCurrentUserId(user.id);

            // Get company_id
            const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single();
            if (!userData?.company_id) return;

            // Load data in parallel
            const [comp, d, k, a, u, i] = await Promise.all([
                supabase.from('companies').select('*, plans(name)').eq('id', userData.company_id).single(),
                supabase.from('departments').select('*').eq('company_id', userData.company_id).order('sort_order', { ascending: true }),
                supabase.from('kpi_definitions').select('*').eq('company_id', userData.company_id).order('sort_order', { ascending: true }),
                supabase.from('kpi_axes').select('*').eq('company_id', userData.company_id).order('sort_order', { ascending: true }),
                supabase.from('users').select('*').eq('company_id', userData.company_id),
                supabase.from('invitations').select('*').eq('company_id', userData.company_id).eq('status', 'pending')
            ]);

            if (comp.data) {
                setCompany(comp.data);
                const axisName = comp.data.secondary_axis_name;
                setSecondaryAxisName((!axisName || axisName === "プロダクト" || axisName === "担当プロダクト") ? "担当領域" : axisName);
            }
            if (d.data) setDepts(d.data);
            if (k.data) setKpis(k.data);
            if (a.data) setAxes(a.data);
            if (u.data) setUsers(u.data);
            if (i.data) setInvitations(i.data);

            setLoading(false);
        }
        loadSettings();
    }, [router]);

    // Handlers
    const handleSaveCompany = async () => {
        const supabase = createClient();
        const { error } = await supabase.from('companies').update({
            name: company.name,
            website_url: company.website_url,
            secondary_axis_name: secondaryAxisName,
            secondary_axis_size_kpi_id: company.secondary_axis_size_kpi_id,
            survey_deadline_day: company.survey_deadline_day
        }).eq('id', company.id);

        if (!error) alert("企業情報を保存しました");
        else alert(`保存に失敗しました: ${error.message}`);
    };

    const handleSaveIntegration = async () => {
        const supabase = createClient();
        const { error } = await supabase.from('companies').update({
            slack_webhook_url: company.slack_webhook_url
        }).eq('id', company.id);

        if (!error) alert("連携設定を保存しました");
        else alert(`保存に失敗しました: ${error.message}`);
    };

    const handleTestClientSlackWebhook = async () => {
        const webhookUrl = company?.slack_webhook_url;
        if (!webhookUrl) {
            alert("Webhook URLを入力・保存してからテストしてください。");
            return;
        }

        try {
            const res = await fetch("/api/settings/test-slack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ webhookUrl })
            });
            if (res.ok) {
                alert("テスト通知を送信しました。Slackをご確認ください");
            } else {
                const data = await res.json();
                alert(`送信失敗: ${data.error || "詳細不明"}`);
            }
        } catch (e: any) {
            alert(`エラーが発生しました: ${e.message}`);
        }
    };

    const handleTestMemberSlack = async (slackUserId: string) => {
        const webhookUrl = company?.slack_webhook_url;
        if (!webhookUrl) {
            alert("まず「外部連携」タブでWebhook URLを保存してください。");
            return;
        }
        if (!slackUserId) {
            alert("Slack User IDを入力してください。");
            return;
        }

        try {
            const res = await fetch("/api/settings/test-slack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ webhookUrl, slackUserId })
            });
            if (res.ok) {
                alert(`Slack ID: ${slackUserId} 宛にテストメンションを送信しました。Slackをご確認ください`);
            } else {
                const data = await res.json();
                alert(`送信失敗: ${data.error || "詳細不明"}`);
            }
        } catch (e: any) {
            alert(`エラーが発生しました: ${e.message}`);
        }
    };

    const handleAddDept = () => {
        setDepts([...depts, { id: `new_${Date.now()}`, name: "", headcount: 0, is_new: true }]);
    };

    const handleSaveAllDepts = async () => {
        const supabase = createClient();
        try {
            const toUpdate = depts.filter(d => !d.is_new).map((d, index) => ({ ...d, sort_order: index }));
            const toCreate = depts.filter(d => d.is_new).map(({ id, is_new, ...rest }, index) => {
                const totalExisting = depts.filter(d => !d.is_new).length;
                return { ...rest, company_id: company.id, sort_order: totalExisting + index };
            });

            const results = await Promise.all([
                ...toUpdate.map(d => supabase.from('departments').update({ name: d.name, headcount: d.headcount, sort_order: d.sort_order }).eq('id', d.id)),
                toCreate.length > 0 ? supabase.from('departments').insert(toCreate) : Promise.resolve({ error: null })
            ]);

            const firstError = (results as any[]).find(r => r.error)?.error;
            if (firstError) {
                console.error("Depts save error:", firstError);
                throw new Error(firstError.message);
            }

            alert("部署情報を一括保存しました");
            const { data } = await supabase.from('departments').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setDepts(data);
        } catch (err: any) {
            console.error("Depts save failed:", err);
            alert(`部署情報の保存に失敗しました: ${err.message || "詳細不明"}`);
        }
    };

    const handleDeleteDept = async (id: string) => {
        if (!confirm("この部署を削除しますか？")) return;
        if (!id.startsWith("new_")) {
            const supabase = createClient();
            await supabase.from('departments').delete().eq('id', id);
        }
        setDepts(depts.filter(d => d.id !== id));
    };

    const handleAddKpi = () => {
        setKpis([...kpis, { id: `new_${Date.now()}`, name: "", unit: "", target_default: 0, is_main: false, is_new: true }]);
    };

    const handleSaveAllKpis = async () => {
        const supabase = createClient();
        try {
            const toUpdate = kpis.filter(k => !k.is_new).map((k, index) => ({ ...k, sort_order: index }));
            const toCreate = kpis.filter(k => k.is_new).map(({ id, is_new, ...rest }, index) => {
                const totalExisting = kpis.filter(k => !k.is_new).length;
                return { ...rest, company_id: company.id, sort_order: totalExisting + index };
            });

            const results = await Promise.all([
                ...toUpdate.map(k => supabase.from('kpi_definitions').update({
                    name: k.name,
                    unit: k.unit,
                    target_default: k.target_default,
                    is_main: k.is_main,
                    owner_dept_id: k.owner_dept_id,
                    sort_order: k.sort_order
                }).eq('id', k.id)),
                toCreate.length > 0 ? supabase.from('kpi_definitions').insert(toCreate.map(k => ({
                    ...k,
                    target_default: k.target_default ?? 0
                }))) : Promise.resolve({ error: null })
            ]);

            const firstError = (results as any[]).find(r => r.error)?.error;
            if (firstError) {
                console.error("KPIs save error:", firstError);
                throw new Error(firstError.message);
            }

            alert("KPI設定を一括保存しました");
            const { data } = await supabase.from('kpi_definitions').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setKpis(data);
        } catch (err: any) {
            console.error("KPIs save failed:", err);
            alert(`KPI設定の保存に失敗しました: ${err.message || "詳細不明"}`);
        }
    };

    const handleDeleteKpi = async (id: string) => {
        if (!confirm("このKPIを削除しますか？")) return;
        if (!id.startsWith("new_")) {
            const supabase = createClient();
            await supabase.from('kpi_definitions').delete().eq('id', id);
        }
        setKpis(kpis.filter(k => k.id !== id));
    };

    const handleAddAxis = () => {
        setAxes([...axes, { id: `new_${Date.now()}`, name: "", headcount: 0, is_new: true }]);
    };

    const handleSaveAllAxes = async () => {
        const supabase = createClient();

        try {
            // 1. 公司設定の保存 (バブルサイズKPI含む)
            // secondary_axis_name や secondary_axis_size_kpi_id がキャッシュエラーで失敗する場合があるため、個別にエラーハンドリング
            const { error: companyError } = await supabase.from('companies').update({
                secondary_axis_name: secondaryAxisName,
                secondary_axis_size_kpi_id: company.secondary_axis_size_kpi_id || null
            }).eq('id', company.id);

            if (companyError) {
                console.warn("Company fields update warning (schema cache issue?):", companyError.message);
                // 致命的エラーとはせず続行を検討（軸項目の保存を優先するため）、
                // ただしユーザーには警告を表示
            }

            // 2. 軸項目の保存
            const toUpdate = axes.filter(a => !a.is_new).map((a, index) => ({ ...a, sort_order: index }));
            const toCreate = axes.filter(a => a.is_new).map(({ id, is_new, ...rest }, index) => {
                const totalExisting = axes.filter(a => !a.is_new).length;
                return { ...rest, company_id: (company as any).id, sort_order: totalExisting + index };
            });

            const results = await Promise.all([
                ...toUpdate.map(a => supabase.from('kpi_axes').update({ name: a.name, headcount: a.headcount, sort_order: a.sort_order }).eq('id', a.id)),
                toCreate.length > 0 ? supabase.from('kpi_axes').insert(toCreate) : Promise.resolve({ error: null })
            ]);

            const firstError = (results as any[]).find(r => r.error)?.error;
            if (firstError) {
                console.error("Axes save error:", firstError);
                throw new Error(`${secondaryAxisName}の保存に失敗: ${firstError.message}`);
            }

            alert(`${secondaryAxisName}設定を一括保存しました`);
            const { data } = await supabase.from('kpi_axes').select('*').eq('company_id', (company as any).id).order('sort_order', { ascending: true });
            if (data) setAxes(data);
        } catch (err: any) {
            console.error("Save failed:", err);
            alert(`保存に失敗しました: ${err.message || "詳細不明のエラー"}`);
        }
    };

    const handleDeleteAxis = async (id: string) => {
        if (!confirm(`この${secondaryAxisName}を削除しますか？`)) return;
        if (!id.startsWith("new_")) {
            const supabase = createClient();
            await supabase.from('kpi_axes').delete().eq('id', id);
        }
        setAxes(axes.filter(a => a.id !== id));
    };

    const handleInvite = async () => {
        if (!company?.id || !currentUserId) return;

        const supabase = createClient();
        const { error } = await supabase.from('invitations').insert({
            email: inviteEmail,
            company_id: company.id,
            inviter_id: currentUserId,
            role: 'player',
            department_id: inviteDeptId || null,
            axis_id: inviteAxisId || null,
            slack_user_id: inviteSlackUserId || null
        });

        if (!error) {
            alert("招待を送信しました");
            setInviteEmail("");
            setInviteDeptId("");
            setInviteAxisId("");
            setInviteSlackUserId("");
            const { data } = await supabase.from('invitations').select('*').eq('company_id', company.id).eq('status', 'pending');
            if (data) setInvitations(data);
        } else {
            alert(`招待に失敗しました: ${error.message}`);
        }
    };

    const handleDeleteInvitation = async (id: string) => {
        if (!confirm("この招待を取り消しますか？")) return;
        const supabase = createClient();
        const { error } = await supabase.from('invitations').delete().eq('id', id);
        if (!error) {
            setInvitations(invitations.filter(i => i.id !== id));
        } else {
            alert(`削除に失敗しました: ${error.message}`);
        }
    };

    const handleResendInvitation = async (inv: any) => {
        const supabase = createClient();
        // 招待日時を更新して再通知したことにする
        const { error } = await supabase.from('invitations').update({ updated_at: new Date().toISOString() }).eq('id', inv.id);
        if (!error) {
            alert(`${inv.email} 宛に招待を再送（再通知）しました`);
        } else {
            alert(`再送に失敗しました: ${error.message}`);
        }
    };

    const handleCopyInviteLink = async (inv: any) => {
        const url = `${window.location.origin}/onboarding?token=${inv.token}`;
        try {
            await navigator.clipboard.writeText(url);
            alert("招待用URLをコピーしました！ Slackなどで共有してください。");
        } catch (err) {
            console.error("Copy error:", err);
            alert(`コピーに失敗しました: ${url}`);
        }
    };

    const handleStartEditUser = (u: any) => {
        setEditingUser(u);
        setEditForm({
            display_name: u.display_name || "",
            slack_user_id: u.slack_user_id || "",
            department_id: u.department_id || "",
            axis_id: u.axis_id || ""
        });
    };

    const handleSaveUserDetail = async () => {
        if (!editingUser) return;
        const supabase = createClient();
        const { error } = await supabase.from('users').update({
            display_name: editForm.display_name || null,
            slack_user_id: editForm.slack_user_id || null,
            department_id: editForm.department_id || null,
            axis_id: editForm.axis_id || null
        }).eq('id', editingUser.id);

        if (!error) {
            alert("ユーザー情報を更新しました");
            const { data } = await supabase.from('users').select('*').eq('company_id', company.id);
            if (data) setUsers(data);
            setEditingUser(null);
        } else {
            alert(`保存に失敗しました: ${error.message}`);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("本当にこのメンバーを削除しますか？\nこの操作は取り消せません。")) return;
        
        const supabase = createClient();
        const { error } = await supabase.from('users').delete().eq('id', userId);

        if (!error) {
            alert("メンバーを削除しました");
            setUsers(users.filter(u => u.id !== userId));
            setEditingUser(null);
        } else {
            alert(`削除に失敗しました: ${error.message}`);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                            <Settings2 className="w-8 h-8 text-teal" />
                            設定
                        </h1>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">組織構成と指標のカスタマイズ</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
                    {[
                        { id: "company", label: "基本設定" },
                        { id: "dept", label: "部署" },
                        { id: "kpi", label: "KPI" },
                        { id: "axis", label: "担当領域" },
                        { id: "users", label: "メンバー" },
                        { id: "integration", label: "外部連携" }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                activeTab === t.id ? "bg-white text-teal shadow-md" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Cards */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[500px]">
                    {activeTab === "company" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-teal" /> 企業基本情報
                                </h2>
                                <div className="space-y-6 max-w-xl">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase">企業名</label>
                                        <input
                                            type="text"
                                            value={company?.name || ""}
                                            onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:border-teal outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase">WebサイトURL</label>
                                        <input
                                            type="url"
                                            placeholder="https://example.com"
                                            value={company?.website_url || ""}
                                            onChange={(e) => setCompany({ ...company, website_url: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:border-teal outline-none transition-all"
                                        />
                                    </div>
                                    <div className="pt-2 ml-1 flex items-center gap-3 group">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SignsAI ID</p>
                                            <div
                                                onClick={handleCopyId}
                                                className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-all bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg w-fit"
                                            >
                                                <span className="text-xs font-bold text-slate-600 tracking-tight">
                                                    {company?.short_id}
                                                </span>
                                                {copied ? (
                                                    <Check className="w-3 h-3 text-teal" />
                                                ) : (
                                                    <Copy className="w-3 h-3 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                        {copied && (
                                            <span className="text-[10px] font-bold text-teal animate-in fade-in slide-in-from-left-1">Copied!</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSaveCompany}
                                        className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                                    >
                                        <Save className="w-4 h-4" /> 企業情報を保存
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "dept" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-teal" /> 部署管理
                                </h2>
                                <p className="text-xs text-slate-500 mb-6">組織内の各部署を登録してください。バブルチャートの比較に使用されます。</p>

                                <div className="space-y-4">
                                    <Reorder.Group axis="y" values={depts} onReorder={setDepts} className="space-y-4">
                                        {depts.map(d => (
                                            <Reorder.Item
                                                key={d.id}
                                                value={d}
                                                className="flex flex-col sm:flex-row gap-4 items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl cursor-default"
                                            >
                                                <div className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">部署名</label>
                                                    <input
                                                        type="text"
                                                        value={d.name}
                                                        onChange={(e) => setDepts(depts.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-32">
                                                    <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">所属人数</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={d.headcount === 0 ? "" : d.headcount}
                                                            onChange={(e) => {
                                                                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                                setDepts(depts.map(x => x.id === d.id ? { ...x, headcount: val } : x));
                                                            }}
                                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal pr-8"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">名</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-2 sm:pt-0">
                                                    <button
                                                        onClick={() => handleDeleteDept(d.id)}
                                                        className="p-3 bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>

                                    <div className="flex flex-col gap-3 mt-6">
                                        <button onClick={handleAddDept} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> 新しい部署を追加
                                        </button>
                                        <button onClick={handleSaveAllDepts} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                                            <Save className="w-4 h-4" /> 部署の設定をすべて保存
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "kpi" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-teal" /> KPI設定
                                </h2>
                                <p className="text-xs text-slate-500 mb-6">各部署の重要指標を定義します。生産性スコアの基盤となります。</p>

                                <div className="space-y-4">
                                    {kpis.map(k => (
                                        <div key={k.id} className="p-7 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] space-y-6 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40">
                                            {/* Row 1: KPI Name, Target, Unit */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">指標名</label>
                                                    <input
                                                        type="text"
                                                        value={k.name}
                                                        placeholder="指標名を入力"
                                                        onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, name: e.target.value } : x))}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">目標値</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={k.target_default ?? 0}
                                                        placeholder="目標額/数"
                                                        onChange={(e) => {
                                                            const val = e.target.value === "" ? "" : Number(e.target.value);
                                                            setKpis(kpis.map(x => x.id === k.id ? { ...x, target_default: val } : x));
                                                        }}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">単位</label>
                                                    <div className="relative">
                                                        <select
                                                            value={k.unit}
                                                            onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, unit: e.target.value } : x))}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal appearance-none transition-all"
                                                        >
                                                            <option value="">単位を選択</option>
                                                            {KPI_UNIT_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                            <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 2: Dept, Main Toggle, Save, Delete */}
                                            <div className="grid grid-cols-1 md:grid-cols-10 gap-5 items-end">
                                                <div className="md:col-span-5">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">主担当部署（任意）</label>
                                                    <div className="relative">
                                                        <select
                                                            value={k.owner_dept_id || ""}
                                                            onChange={(e) => setKpis(kpis.map(x => x.id === k.id ? { ...x, owner_dept_id: e.target.value } : x))}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal appearance-none transition-all"
                                                        >
                                                            <option value="">設定なし</option>
                                                            {depts.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                            <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-4">
                                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-tighter">部署代表KPI設定</label>
                                                    <button
                                                        onClick={() => {
                                                            const isCurrentlyMain = k.is_main;
                                                            const deptId = k.owner_dept_id;
                                                            setKpis(kpis.map(x => {
                                                                if (deptId && x.owner_dept_id === deptId && x.id !== k.id) return { ...x, is_main: false };
                                                                if (x.id === k.id) return { ...x, is_main: !isCurrentlyMain };
                                                                return x;
                                                            }));
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border-2 transition-all font-bold text-sm",
                                                            k.is_main
                                                                ? "bg-teal/5 border-teal text-teal"
                                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <Star className={cn("w-4 h-4", k.is_main ? "fill-teal" : "text-slate-300")} />
                                                        <span>{k.is_main ? "設定済み" : "設定する"}</span>
                                                    </button>
                                                </div>

                                                <div className="md:col-span-1 flex justify-end">
                                                    <button
                                                        onClick={() => handleDeleteKpi(k.id)}
                                                        className="p-3.5 rounded-2xl bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex flex-col gap-3 mt-6">
                                        <button onClick={handleAddKpi} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> 指標を追加
                                        </button>
                                        <button onClick={handleSaveAllKpis} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                                            <Save className="w-4 h-4" /> KPI設定をすべて保存
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "axis" && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-teal" /> 担当領域の設定（地域・プロダクトなど）
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase">軸の呼称</label>
                                        <input
                                            type="text"
                                            value={secondaryAxisName}
                                            placeholder="例: 担当領域"
                                            onChange={(e) => setSecondaryAxisName(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-3 ml-1 line-relaxed">※ 「KPI入力」や「マトリックス切替」の名称として使用されます。</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase">バブルサイズのKPI</label>
                                        <select
                                            value={company?.secondary_axis_size_kpi_id || ""}
                                            onChange={(e) => setCompany({ ...company, secondary_axis_size_kpi_id: e.target.value || null })}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                        >
                                            <option value="">-- 指定なし（達成率を使用） --</option>
                                            {kpis.map(k => (
                                                <option key={k.id} value={k.id}>{k.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-3 ml-1 line-relaxed">※ マトリックスの円の大きさに反映させる重要指標を選択してください。</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-700 ml-1">{secondaryAxisName}の項目一覧</h3>
                                    <Reorder.Group axis="y" values={axes} onReorder={setAxes} className="space-y-4">
                                        {axes.map(a => (
                                            <Reorder.Item
                                                key={a.id}
                                                value={a}
                                                className="flex flex-col sm:flex-row gap-4 items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl cursor-default"
                                            >
                                                <div className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">{secondaryAxisName}名</label>
                                                    <input
                                                        type="text"
                                                        value={a.name}
                                                        onChange={(e) => setAxes(axes.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                                    />
                                                </div>
                                                <div className="w-full sm:w-32">
                                                    <label className="block text-[9px] font-bold text-slate-400 mb-1 ml-1">所属人数</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={a.headcount === 0 ? "" : a.headcount}
                                                            onChange={(e) => {
                                                                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                                                setAxes(axes.map(x => x.id === a.id ? { ...x, headcount: val } : x));
                                                            }}
                                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal pr-8"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">名</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-2 sm:pt-0">
                                                    <button
                                                        onClick={() => handleDeleteAxis(a.id)}
                                                        className="p-3 bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>

                                    <div className="flex flex-col gap-3 mt-6">
                                        <button onClick={handleAddAxis} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-teal hover:text-teal hover:bg-teal/5 transition-all text-sm flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> 新しい{secondaryAxisName}を追加
                                        </button>
                                        <button onClick={handleSaveAllAxes} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                                            <Save className="w-4 h-4" /> {secondaryAxisName}設定をすべて保存
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="space-y-10 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-teal" /> メンバーを招待
                                </h2>
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest">メールアドレス <span className="text-rose-400">*</span></label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="email"
                                                        value={inviteEmail}
                                                        onChange={(e) => setInviteEmail(e.target.value)}
                                                        placeholder="example@company.com"
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-11 py-4 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest">所属部署 (任意)</label>
                                            <select
                                                value={inviteDeptId}
                                                onChange={(e) => setInviteDeptId(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:border-teal appearance-none"
                                            >
                                                <option value="">未設定</option>
                                                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest">{secondaryAxisName} (任意)</label>
                                            <select
                                                value={inviteAxisId}
                                                onChange={(e) => setInviteAxisId(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:border-teal appearance-none"
                                            >
                                                <option value="">未設定</option>
                                                {axes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>


                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest flex items-center">
                                                Slack User ID (任意)
                                                <SlackHelpTooltip />
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={inviteSlackUserId}
                                                    onChange={(e) => setInviteSlackUserId(e.target.value)}
                                                    placeholder="例: U12345678"
                                                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-teal"
                                                />
                                                <button
                                                    onClick={() => handleTestMemberSlack(inviteSlackUserId)}
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-2xl transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase whitespace-nowrap"
                                                    title="テストメンションを送信"
                                                >
                                                    テスト送信
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleInvite}
                                            disabled={!inviteEmail}
                                            className="bg-teal text-white px-10 py-4 rounded-2xl font-black hover:bg-teal-600 transition-all shadow-xl shadow-teal/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            招待メールを送信 <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-teal" /> 登録済みメンバー
                                </h2>
                                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">メンバー</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">所属部署</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">担当領域</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Slack ID</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">設定</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {users.map(u => {
                                                    const dept = depts.find(d => d.id === u.department_id);
                                                    const axis = axes.find(a => a.id === u.axis_id);
                                                    const kpi = kpis.find(k => k.id === u.assigned_kpi_id);
                                                    return (
                                                        <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px] flex-shrink-0">
                                                                        {(u.display_name || u.email || "U")[0].toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-black text-slate-800 leading-tight">{u.display_name || "未設定"}</div>
                                                                        <div className="text-[10px] text-slate-400 font-bold">{u.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                {dept ? (
                                                                    <span className="inline-flex px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black">
                                                                        {dept.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300 text-[10px] font-bold">未設定</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col gap-1">
                                                                    {axis ? (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                                            <span className="text-[10px] font-black text-slate-600">{axis.name}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-300 text-[10px] font-bold">未設定</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-center">
                                                                {u.slack_user_id ? (
                                                                    <code className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-500">{u.slack_user_id}</code>
                                                                ) : (
                                                                    <span className="text-slate-200 text-[10px] font-black">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <button
                                                                    onClick={() => handleStartEditUser(u)}
                                                                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-teal hover:bg-teal-50 rounded-xl transition-all"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                {invitations.length > 0 && (
                                    <div className="mt-10">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">招待中のメンバー ({invitations.length})</h3>
                                        <p className="text-[11px] text-slate-400 mt-1 mb-6 ml-1 leading-relaxed">
                                            ※メールが届かない場合は、該当メンバーのカードをホバーし、右側に現れる [リンクコピー] ボタンから招待URLを送信してください。
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {invitations.map(inv => (
                                                <div key={inv.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 border-dashed rounded-[1.5rem] group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 font-black text-xs">
                                                            {(inv.email || "I")[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-500">{inv.email}</div>
                                                            <div className="text-[10px] text-teal-500 font-black uppercase flex items-center gap-1">
                                                                <span className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
                                                                招待送信済み
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleCopyInviteLink(inv)}
                                                            className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                            title="招待リンクをコピー"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleResendInvitation(inv)}
                                                            className="p-2.5 text-slate-400 hover:text-teal hover:bg-teal-50 rounded-xl transition-all"
                                                            title="再送する"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteInvitation(inv.id)}
                                                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="削除する"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "integration" && (

                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Link2 className="w-5 h-5 text-teal" /> 外部連携
                                </h2>
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                                    <div className="max-w-xl">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase">Slack Webhook URL</label>
                                        <p className="text-xs text-slate-500 mb-4 ml-1">
                                            ここにSlackのIncoming Webhook URLを設定すると、AI分析の完了時やアンケートのリマインドが指定チャンネルに自動通知されます。（連携機能）
                                        </p>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="url"
                                                    value={company?.slack_webhook_url || ""}
                                                    onChange={(e) => setCompany({ ...company, slack_webhook_url: e.target.value })}
                                                    placeholder="https://hooks.slack.com/services/..."
                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono text-slate-600 outline-none focus:border-teal"
                                                />
                                            </div>
                                            <button
                                                onClick={handleTestClientSlackWebhook}
                                                className="bg-slate-200 text-slate-600 px-6 rounded-2xl font-bold hover:bg-slate-300 transition-all shadow-sm"
                                            >
                                                Test
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSaveIntegration}
                                        className="inline-flex items-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg"
                                    >
                                        <Save className="w-4 h-4" /> 連携設定を保存
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Member Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tighter">メンバー属性の編集</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{editingUser.email}</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">氏名 (任意)</label>
                                    <input
                                        type="text"
                                        value={editForm.display_name}
                                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                        placeholder="例: 佐藤 太郎"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-teal transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">所属部署</label>
                                    <select
                                        value={editForm.department_id}
                                        onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-teal transition-all"
                                    >
                                        <option value="">未設定</option>
                                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">{secondaryAxisName}</label>
                                    <select
                                        value={editForm.axis_id}
                                        onChange={(e) => setEditForm({ ...editForm, axis_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-teal transition-all"
                                    >
                                        <option value="">未設定</option>
                                        {axes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest flex items-center">
                                        Slack User ID
                                        <SlackHelpTooltip />
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={editForm.slack_user_id || ""}
                                                onChange={(e) => setEditForm({...editForm, slack_user_id: e.target.value})}
                                                placeholder="例: U12345678"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-teal transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleTestMemberSlack(editForm.slack_user_id || "")}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-2xl transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase whitespace-nowrap"
                                            title="テストメンションを送信"
                                        >
                                            テスト送信
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 ml-1 font-medium">※ Slackでの個人宛メンション通知に使用されます</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 flex flex-col gap-3 font-bold">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 transition-all font-bold"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSaveUserDetail}
                                    className="flex-[2] py-4 bg-teal text-white rounded-2xl font-black shadow-lg shadow-teal/20 hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> ユーザー情報を保存
                                </button>
                            </div>
                            
                            <div className="pt-2 border-t border-slate-200 mt-2">
                                <button
                                    onClick={() => handleDeleteUser(editingUser.id)}
                                    className="w-full py-4 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> このメンバーを削除する
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
