"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Company, Department, KpiDefinition, KpiAxis, User, Invitation, ResourceRecord } from "@/types/database";

export function useSettingsData() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // State
    const [company, setCompany] = useState<Company | any>(null);
    const [depts, setDepts] = useState<Department[] | any[]>([]);
    const [kpis, setKpis] = useState<KpiDefinition[] | any[]>([]);
    const [axes, setAxes] = useState<KpiAxis[] | any[]>([]);
    const [secondaryAxisName, setSecondaryAxisName] = useState("担当領域");
    const [users, setUsers] = useState<User[] | any[]>([]);
    const [invitations, setInvitations] = useState<Invitation[] | any[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [copied, setCopied] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    // Invitation extra state
    const [inviteDeptId, setInviteDeptId] = useState("");
    const [inviteAxisId, setInviteAxisId] = useState("");
    const [inviteSlackUserId, setInviteSlackUserId] = useState("");
    const [resources, setResources] = useState<ResourceRecord[] | any[]>([]);

    // History Modal State
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyTarget, setHistoryTarget] = useState<{ type: 'dept' | 'axis', id: string, name: string } | null>(null);
    const [tempHistory, setTempHistory] = useState<any[]>([]);
    const [isSavingHistory, setIsSavingHistory] = useState(false);

    // Editing user state
    const [editingUser, setEditingUser] = useState<User | any>(null);
    const [editForm, setEditForm] = useState({
        display_name: "",
        slack_user_id: "",
        department_id: "",
        axis_id: ""
    });

    const loadSettings = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            router.push("/login");
            return;
        }
        setCurrentUserId(authUser.id);

        const { data: userData } = await supabase.from('users').select('company_id').eq('id', authUser.id).single();
        if (!userData?.company_id) return;

        const [comp, d, k, a, u, i, res] = await Promise.all([
            supabase.from('companies').select('*, plans(name)').eq('id', userData.company_id).single(),
            supabase.from('departments').select('*').eq('company_id', userData.company_id).order('sort_order', { ascending: true }),
            supabase.from('kpi_definitions').select('*').eq('company_id', userData.company_id).order('sort_order', { ascending: true }),
            supabase.from('kpi_axes').select('*').eq('company_id', userData.company_id).order('sort_order', { ascending: true }),
            supabase.from('users').select('*').eq('company_id', userData.company_id),
            supabase.from('invitations').select('*').eq('company_id', userData.company_id).eq('status', 'pending'),
            supabase.from('resource_records').select('*').eq('company_id', userData.company_id)
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
        if (res.data) setResources(res.data);

        setLoading(false);
    }, [router]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleCopyId = () => {
        if (!company?.short_id) return;
        navigator.clipboard.writeText(company.short_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
        setDepts([...depts, { id: `new_${Date.now()}`, name: "", headcount: 0, is_new: true } as any]);
    };

    const handleSaveAllDepts = async () => {
        const supabase = createClient();
        try {
            const toUpdate = depts.filter((d: any) => !d.is_new).map((d, index) => ({ ...d, sort_order: index }));
            const toCreate = depts.filter((d: any) => d.is_new).map(({ id, is_new, ...rest }: any, index) => {
                const totalExisting = depts.filter((d: any) => !d.is_new).length;
                return { ...rest, company_id: company.id, sort_order: totalExisting + index };
            });

            const results = await Promise.all([
                ...toUpdate.map(d => supabase.from('departments').update({ name: d.name, headcount: d.headcount, sort_order: d.sort_order }).eq('id', d.id)),
                toCreate.length > 0 ? supabase.from('departments').insert(toCreate) : Promise.resolve({ error: null })
            ]);

            const firstError = (results as any[]).find(r => r.error)?.error;
            if (firstError) throw new Error(firstError.message);

            alert("部署情報を一括保存しました");
            const { data } = await supabase.from('departments').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setDepts(data);
        } catch (err: any) {
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
        setKpis([...kpis, { id: `new_${Date.now()}`, name: "", unit: "", target_default: 0, is_main: false, is_higher_better: true, is_new: true } as any]);
    };

    const handleSaveAllKpis = async () => {
        const supabase = createClient();
        try {
            const toUpdate = kpis.filter((k: any) => !k.is_new).map((k, index) => ({ ...k, sort_order: index }));
            const toCreate = kpis.filter((k: any) => k.is_new).map(({ id, is_new, ...rest }: any, index) => {
                const totalExisting = kpis.filter((k: any) => !k.is_new).length;
                return { ...rest, company_id: company.id, sort_order: totalExisting + index };
            });

            const results = await Promise.all([
                ...toUpdate.map(k => supabase.from('kpi_definitions').update({
                    name: k.name,
                    unit: k.unit,
                    target_default: k.target_default,
                    is_main: k.is_main,
                    owner_dept_id: k.owner_dept_id,
                    is_higher_better: k.is_higher_better ?? true,
                    sort_order: k.sort_order
                }).eq('id', k.id)),
                toCreate.length > 0 ? supabase.from('kpi_definitions').insert(toCreate.map(k => ({
                    company_id: k.company_id,
                    name: k.name,
                    unit: k.unit,
                    target_default: k.target_default ?? 0,
                    is_main: k.is_main,
                    owner_dept_id: k.owner_dept_id,
                    is_higher_better: k.is_higher_better ?? true,
                    sort_order: k.sort_order
                }))) : Promise.resolve({ error: null })
            ]);

            const firstError = (results as any[]).find(r => r.error)?.error;
            if (firstError) throw new Error(firstError.message);

            alert("KPI設定を一括保存しました");
            const { data } = await supabase.from('kpi_definitions').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setKpis(data);
        } catch (err: any) {
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
        setAxes([...axes, { id: `new_${Date.now()}`, name: "", headcount: 0, is_new: true } as any]);
    };

    const handleSaveAllAxes = async () => {
        const supabase = createClient();
        try {
            await supabase.from('companies').update({
                secondary_axis_name: secondaryAxisName,
                secondary_axis_size_kpi_id: company.secondary_axis_size_kpi_id || null
            }).eq('id', company.id);

            const toUpdate = axes.filter((a: any) => !a.is_new).map((a, index) => ({ ...a, sort_order: index }));
            const toCreate = axes.filter((a: any) => a.is_new).map(({ id, is_new, ...rest }: any, index) => {
                const totalExisting = axes.filter((a: any) => !a.is_new).length;
                return { ...rest, company_id: company.id, sort_order: totalExisting + index };
            });

            const results = await Promise.all([
                ...toUpdate.map(a => supabase.from('kpi_axes').update({ name: a.name, headcount: a.headcount, sort_order: a.sort_order }).eq('id', a.id)),
                toCreate.length > 0 ? supabase.from('kpi_axes').insert(toCreate) : Promise.resolve({ error: null })
            ]);

            const firstError = (results as any[]).find(r => r.error)?.error;
            if (firstError) throw new Error(firstError.message);

            alert(`${secondaryAxisName}設定を一括保存しました`);
            const { data } = await supabase.from('kpi_axes').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setAxes(data);
        } catch (err: any) {
            alert(`保存に失敗しました: ${err.message || "詳細不明"}`);
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
        if (!error) setInvitations(invitations.filter(i => i.id !== id));
        else alert(`削除に失敗しました: ${error.message}`);
    };

    const handleResendInvitation = async (inv: Invitation) => {
        const supabase = createClient();
        const { error } = await supabase.from('invitations').update({ updated_at: new Date().toISOString() } as any).eq('id', inv.id);
        if (!error) alert(`${inv.email} 宛に招待を再送（再通知）しました`);
        else alert(`再送に失敗しました: ${error.message}`);
    };

    const handleCopyInviteLink = async (inv: Invitation | any) => {
        const url = `${window.location.origin}/onboarding?token=${inv.token}`;
        try {
            await navigator.clipboard.writeText(url);
            alert("招待用URLをコピーしました！ Slackなどで共有してください。");
        } catch (err) {
            alert(`コピーに失敗しました: ${url}`);
        }
    };

    const handleOpenHistory = (type: 'dept' | 'axis', id: string, name: string) => {
        setHistoryTarget({ type, id, name });
        const months = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
            const existing = resources.find(r => r.recorded_month === m && (type === 'dept' ? r.department_id === id : r.axis_id === id));
            months.push({ month: m, head_count: existing?.head_count || 0, labor_cost: existing?.labor_cost || 0 });
        }
        setTempHistory(months);
        setHistoryModalOpen(true);
    };

    const handleSaveHistory = async () => {
        if (!historyTarget || !company?.id) return;
        setIsSavingHistory(true);
        const supabase = createClient();
        try {
            const upserts = tempHistory.map(h => ({
                company_id: company.id,
                department_id: historyTarget.type === 'dept' ? historyTarget.id : null,
                axis_id: historyTarget.type === 'axis' ? historyTarget.id : null,
                recorded_month: h.month,
                head_count: h.head_count,
                labor_cost: h.labor_cost || null
            }));
            const { error } = await supabase.from('resource_records').upsert(upserts as any, {
                onConflict: 'company_id, department_id, axis_id, recorded_month'
            });
            if (error) throw error;
            alert("履歴を保存しました");
            const { data } = await supabase.from('resource_records').select('*').eq('company_id', company.id);
            if (data) setResources(data);
            setHistoryModalOpen(false);
        } catch (err: any) {
            alert(`保存に失敗しました: ${err.message}`);
        } finally {
            setIsSavingHistory(false);
        }
    };

    const getHistoryTrend = useCallback((id: string, type: 'dept' | 'axis') => {
        const now = new Date();
        const trend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
            const existing = resources.find(r => r.recorded_month === m && (type === 'dept' ? r.department_id === id : r.axis_id === id));
            trend.push(existing?.head_count || 0);
        }
        return trend;
    }, [resources]);

    const handleStartEditUser = (u: User) => {
        setEditingUser(u);
        setEditForm({
            display_name: u.display_name || "",
            slack_user_id: (u as any).slack_user_id || "",
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
        } as any).eq('id', editingUser.id);

        if (!error) {
            alert("ユーザー情報を更新しました");
            const { data } = await supabase.from('users').select('*').eq('company_id', company.id);
            if (data) setUsers(data);
            setEditingUser(null);
        } else alert(`保存に失敗しました: ${error.message}`);
    };

    const handleDeleteUser = async (userIdArg?: string) => {
        const userId = userIdArg || editingUser?.id;
        if (!userId) return;
        if (!window.confirm("本当にこのメンバーを削除しますか？\nこの操作は取り消せません。")) return;
        const supabase = createClient();
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (!error) {
            alert("メンバーを削除しました");
            setUsers(users.filter(u => u.id !== userId));
            setEditingUser(null);
        } else alert(`削除に失敗しました: ${error.message}`);
    };

    return {
        state: {
            loading, company, depts, kpis, axes, secondaryAxisName, users, invitations, inviteEmail,
            copied, inviteDeptId, inviteAxisId, inviteSlackUserId, resources, historyModalOpen,
            historyTarget, tempHistory, isSavingHistory, editingUser, editForm
        },
        handlers: {
            setCompany, setDepts, setKpis, setAxes, setSecondaryAxisName, setInviteEmail, setInviteDeptId,
            setInviteAxisId, setInviteSlackUserId, setTempHistory, setHistoryModalOpen, setEditForm, setEditingUser,
            handleCopyId, handleSaveCompany, handleSaveIntegration, handleTestClientSlackWebhook,
            handleTestMemberSlack, handleAddDept, handleSaveAllDepts, handleDeleteDept, handleAddKpi,
            handleSaveAllKpis, handleDeleteKpi, handleAddAxis, handleSaveAllAxes, handleDeleteAxis,
            handleInvite, handleDeleteInvitation, handleResendInvitation, handleCopyInviteLink,
            handleOpenHistory, handleSaveHistory, getHistoryTrend, handleStartEditUser,
            handleSaveUserDetail, handleDeleteUser
        }
    };
}
