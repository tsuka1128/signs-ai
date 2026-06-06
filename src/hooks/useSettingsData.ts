import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Company, Department, KpiDefinition, KpiAxis, User, Invitation, ResourceRecord } from "@/types/database";
import { UserRole } from "@/lib/constants";
import { getLastNMonths, normalizeMonth } from "@/lib/utils/date";
import { calculateAchievementRate } from "@/lib/logic/kpi-engine";
import { toast } from "sonner";

export function useSettingsData() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    const [userRole, setUserRole] = useState<UserRole | "super_admin">("player");
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [inviteRole, setInviteRole] = useState<UserRole>("player");
    
    // Invitation extra state
    const [inviteDeptId, setInviteDeptId] = useState("");
    const [inviteAxisId, setInviteAxisId] = useState("");
    const [inviteSlackUserId, setInviteSlackUserId] = useState("");


    // Editing user state
    const [editingUser, setEditingUser] = useState<User | any>(null);
    const [editForm, setEditForm] = useState({
        display_name: "",
        slack_user_id: "",
        department_id: "",
        axis_id: "",
        role: "player"
    });

    const [displayDepts, setDisplayDepts] = useState<any[]>([]);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            router.push("/login");
            return;
        }
        setCurrentUserId(authUser.id);

        const { data: userData } = await supabase.from('users').select('company_id, role').eq('id', authUser.id).single();
        
        if (userData?.role) setUserRole(userData.role as any);
        let targetId = userData?.company_id;

        if (userData?.role === 'super_admin') {
            const storedId = typeof window !== "undefined" ? localStorage.getItem("impersonated_company_id") : null;
            if (storedId) {
                targetId = storedId;
                setIsImpersonating(true);
            } else {
                setIsImpersonating(false);
            }
        }

        if (!targetId) {
            if (userData?.role !== 'super_admin') {
                router.push("/onboarding");
            } else {
                setLoading(false);
            }
            return;
        }

        const [comp, d, k, a, u, i] = await Promise.all([
            supabase.from('companies').select('*, plans(name)').eq('id', targetId).single(),
            supabase.from('departments').select('*').eq('company_id', targetId).order('sort_order', { ascending: true }),
            supabase.from('kpi_definitions').select('*').eq('company_id', targetId).order('sort_order', { ascending: true }),
            supabase.from('kpi_axes').select('*').eq('company_id', targetId).order('sort_order', { ascending: true }),
            supabase.from('users').select('*').eq('company_id', targetId),
            supabase.from('invitations').select('*').eq('company_id', targetId).eq('status', 'pending')
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

        // --- 先行指標チャート用の最小限の履歴データ加工 ---
        const last13 = getLastNMonths(13);
        const [responses, records] = await Promise.all([
            supabase.from('survey_responses').select('*, survey_answers(score)').eq('company_id', targetId).in('recorded_month', last13),
            supabase.from('kpi_records').select('*').in('kpi_definition_id', (k.data || []).map(def => def.id)).in('recorded_month', last13)
        ]);

        const historyDepts = (d.data || []).map(dept => {
            const pulseHistory = last13.map(month => {
                const monthRes = (responses.data || []).filter(r => r.department_id === dept.id && normalizeMonth(r.recorded_month) === month);
                const answers = monthRes.flatMap(r => r.survey_answers || []);
                return answers.length > 0 ? answers.reduce((s, a) => s + (a as any).score, 0) / answers.length : 0;
            });

            const kpiAchHistory = last13.map(month => {
                const deptKpis = (k.data || []).filter(def => def.owner_dept_id === dept.id);
                const monthRecs = (records.data || []).filter(r => r.axis_id === null && normalizeMonth(r.recorded_month) === month && (r.department_id === dept.id || (r.department_id === null && deptKpis.some(dk => dk.id === r.kpi_definition_id))));
                
                let totalAch = 0;
                let count = 0;
                deptKpis.forEach(def => {
                    const rec = monthRecs.find(r => r.kpi_definition_id === def.id);
                    if (rec && rec.target_value !== null) {
                        const ach = calculateAchievementRate(rec.value, rec.target_value, def.is_higher_better !== false);
                        if (ach !== null) { totalAch += ach; count++; }
                    }
                });
                return count > 0 ? Math.round(totalAch / count) : 0;
            });

            return { id: dept.id, pulseHistory, kpiAchHistory };
        });
        setDisplayDepts(historyDepts);

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
            survey_deadline_day: company.survey_deadline_day,
            industry: company.industry || null,
            size_category: company.size_category || null,
            fiscal_year_start_month: company.fiscal_year_start_month || 1
        }).eq('id', company.id);

        if (!error) toast.success("企業情報を保存しました");
        else toast.error(`保存に失敗しました: ${error.message}`);
    };

    const handleSaveIntegration = async () => {
        const supabase = createClient();
        const { error } = await supabase.from('companies').update({
            slack_webhook_url: company.slack_webhook_url,
            anomaly_threshold_absolute: company.anomaly_threshold_absolute,
            anomaly_threshold_drop: company.anomaly_threshold_drop,
            anomaly_threshold_gap: company.anomaly_threshold_gap,
            anomaly_alert_enabled: company.anomaly_alert_enabled ?? true,
            slack_msg_ai_summary: company.slack_msg_ai_summary,
            slack_msg_anomaly_alert: company.slack_msg_anomaly_alert,
            slack_msg_voice_check: company.slack_msg_voice_check,
            slack_msg_kpi_reminder: company.slack_msg_kpi_reminder
        }).eq('id', company.id);

        if (!error) toast.success("連携・通知設定を保存しました");
        else toast.error(`保存に失敗しました: ${error.message}`);
    };

    const handlePreviewNotification = async (type: string) => {
        const webhookUrl = company?.slack_webhook_url;
        if (!webhookUrl) {
            toast.error("Webhook URLを入力・保存してからプレビューしてください。");
            return;
        }

        try {
            const res = await fetch("/api/settings/test-slack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    webhookUrl, 
                    previewType: type,
                    customMessages: {
                        slack_msg_ai_summary: company.slack_msg_ai_summary,
                        slack_msg_anomaly_alert: company.slack_msg_anomaly_alert,
                        slack_msg_voice_check: company.slack_msg_voice_check,
                        slack_msg_kpi_reminder: company.slack_msg_kpi_reminder
                    }
                })
            });
            if (res.ok) {
                toast.success("プレビュー通知を送信しました。Slackをご確認ください");
            } else {
                const data = await res.json();
                toast.error(`送信失敗: ${data.error || "詳細不明"}`);
            }
        } catch (e: any) {
            toast.error(`エラーが発生しました: ${e.message}`);
        }
    };

    const handleTestClientSlackWebhook = async () => {
        const webhookUrl = company?.slack_webhook_url;
        if (!webhookUrl) {
            toast.error("Webhook URLを入力・保存してからテストしてください。");
            return;
        }

        try {
            const res = await fetch("/api/settings/test-slack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ webhookUrl })
            });
            if (res.ok) {
                toast.success("テスト通知を送信しました。Slackをご確認ください");
            } else {
                const data = await res.json();
                toast.error(`送信失敗: ${data.error || "詳細不明"}`);
            }
        } catch (e: any) {
            toast.error(`エラーが発生しました: ${e.message}`);
        }
    };

    const handleTestMemberSlack = async (slackUserId: string) => {
        const webhookUrl = company?.slack_webhook_url;
        if (!webhookUrl) {
            toast.error("まず「外部連携」タブでWebhook URLを保存してください。");
            return;
        }
        if (!slackUserId) {
            toast.error("Slack User IDを入力してください。");
            return;
        }

        try {
            const res = await fetch("/api/settings/test-slack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ webhookUrl, slackUserId })
            });
            if (res.ok) {
                toast.success(`Slack ID: ${slackUserId} 宛にテストメンションを送信しました。Slackをご確認ください`);
            } else {
                const data = await res.json();
                toast.error(`送信失敗: ${data.error || "詳細不明"}`);
            }
        } catch (e: any) {
            toast.error(`エラーが発生しました: ${e.message}`);
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

            toast.success("部署情報を一括保存しました");
            const { data } = await supabase.from('departments').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setDepts(data);
        } catch (err: any) {
            toast.error(`部署情報の保存に失敗しました: ${err.message || "詳細不明"}`);
        }
    };

    const handleDeleteDept = async (id: string) => {
        if (id.startsWith("new_")) {
            // 未保存の部署はそのまま除去
            setDepts(depts.filter(d => d.id !== id));
            return;
        }

        const supabase = createClient();

        // 関連データ件数を事前確認
        const [{ count: surveyCount }, { count: kpiCount }] = await Promise.all([
            supabase.from('survey_responses').select('*', { count: 'exact', head: true }).eq('department_id', id),
            supabase.from('kpi_records').select('*', { count: 'exact', head: true }).eq('department_id', id),
        ]);

        const dept = depts.find(d => d.id === id);
        const deptName = (dept as any)?.name || "この部署";
        const hasLinkedData = (surveyCount ?? 0) > 0 || (kpiCount ?? 0) > 0;

        let confirmMessage = `「${deptName}」を削除しますか？`;
        if (hasLinkedData) {
            confirmMessage =
                `⚠️ 警告：「${deptName}」には紐付いたデータがあります。\n\n` +
                `  • アンケート回答: ${surveyCount ?? 0} 件\n` +
                `  • KPI実績: ${kpiCount ?? 0} 件\n\n` +
                `削除すると、これらのデータは「どの組織にも属さない孤立データ」になり、` +
                `ダッシュボードに表示されなくなります。\n\n` +
                `本当に削除しますか？`;
        }

        if (!confirm(confirmMessage)) return;

        await supabase.from('departments').delete().eq('id', id);
        setDepts(depts.filter(d => d.id !== id));
    };

    const handleAddKpi = () => {
        setKpis([...kpis, { id: `new_${Date.now()}`, name: "", unit: "", target_default: 0, is_main: false, is_revenue: false, is_higher_better: true, is_public_to_players: false, is_new: true } as any]);
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
                    is_revenue: k.is_revenue ?? false,
                    is_public_to_players: k.is_public_to_players ?? false,
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
                    is_revenue: k.is_revenue ?? false,
                    is_public_to_players: k.is_public_to_players ?? false,
                    sort_order: k.sort_order
                }))) : Promise.resolve({ error: null })
            ]);

            const firstError = (results as any[]).find(r => r.error)?.error;
            if (firstError) throw new Error(firstError.message);

            toast.success("KPI設定を一括保存しました");
            const { data } = await supabase.from('kpi_definitions').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setKpis(data);
        } catch (err: any) {
            toast.error(`KPI設定の保存に失敗しました: ${err.message || "詳細不明"}`);
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

            toast.success(`${secondaryAxisName}設定を一括保存しました`);
            const { data } = await supabase.from('kpi_axes').select('*').eq('company_id', company.id).order('sort_order', { ascending: true });
            if (data) setAxes(data);
        } catch (err: any) {
            toast.error(`保存に失敗しました: ${err.message || "詳細不明"}`);
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
        const { data: inv, error } = await supabase.from('invitations').insert({
            email: inviteEmail,
            company_id: company.id,
            inviter_id: currentUserId,
            role: inviteRole,
            department_id: inviteDeptId || null,
            axis_id: inviteAxisId || null,
            slack_user_id: inviteSlackUserId || null
        }).select().single();

        if (!error && inv) {
            try {
                const mailRes = await fetch("/api/emails/invite", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ invitationId: inv.id })
                });
                if (!mailRes.ok) {
                    const mailErr = await mailRes.json();
                    console.warn("Mail sending failed but invite was created:", mailErr);
                }
            } catch (e) {
                console.error("Mail API Error:", e);
            }

            toast.success("招待を送信しました（メールが配信されます）");
            setInviteEmail("");
            setInviteRole("player");
            setInviteDeptId("");
            setInviteAxisId("");
            setInviteSlackUserId("");
            const { data } = await supabase.from('invitations').select('*').eq('company_id', company.id).eq('status', 'pending');
            if (data) setInvitations(data);
        } else {
            toast.error(`招待に失敗しました: ${error?.message}`);
        }
    };

    const handleBulkInvite = async (
        rows: { email: string; role: string; department_id: string | null; slack_user_id: string | null }[]
    ): Promise<{ success: number; failed: number; errors: { email: string; reason: string }[] }> => {
        if (!company?.id || !currentUserId) return { success: 0, failed: rows.length, errors: [] };
        const supabase = createClient();
        let success = 0, failed = 0;
        const errors: { email: string; reason: string }[] = [];

        for (const row of rows) {
            try {
                const { data: inv, error } = await supabase.from('invitations').insert({
                    email: row.email,
                    company_id: company.id,
                    inviter_id: currentUserId,
                    role: row.role,
                    department_id: row.department_id,
                    axis_id: null,
                    slack_user_id: row.slack_user_id,
                }).select().single();

                if (!error && inv) {
                    await fetch("/api/emails/invite", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ invitationId: inv.id })
                    });
                    success++;
                } else {
                    failed++;
                    const reason = error?.code === '23505' ? '既に招待済みのメールアドレスです'
                                 : error?.code === '42501' ? '権限がありません'
                                 : error?.message || '不明なエラー';
                    errors.push({ email: row.email, reason });
                }
            } catch (e: any) {
                failed++;
                errors.push({ email: row.email, reason: e?.message || '不明なエラー' });
            }
        }

        const { data } = await supabase.from('invitations').select('*').eq('company_id', company.id).eq('status', 'pending');
        if (data) setInvitations(data);

        if (success > 0) toast.success(`${success}件の招待を送信しました。${failed > 0 ? `（${failed}件失敗）` : ''}`);
        if (success === 0) toast.error(`すべての招待に失敗しました（${failed}件）`);

        return { success, failed, errors };
    };

    const handleBulkUpdateUsers = async (
        updates: { userId: string; email?: string; role?: string; department_id?: string | null; slack_user_id?: string | null }[]
    ): Promise<{ success: number; failed: number; errors: { email: string; reason: string }[] }> => {
        if (!company?.id) return { success: 0, failed: updates.length, errors: [] };
        const supabase = createClient();
        let success = 0, failed = 0;
        const errors: { email: string; reason: string }[] = [];

        for (const upd of updates) {
            const payload: any = {};
            if (upd.role !== undefined) payload.role = upd.role;
            if (upd.department_id !== undefined) payload.department_id = upd.department_id;
            if (upd.slack_user_id !== undefined) payload.slack_user_id = upd.slack_user_id;

            const { error } = await supabase.from('users').update(payload).eq('id', upd.userId);
            if (!error) {
                success++;
            } else {
                failed++;
                errors.push({
                    email: upd.email || upd.userId,
                    reason: error?.code === '42501' ? '権限がありません' : error?.message || '不明なエラー'
                });
            }
        }

        const { data } = await supabase.from('users').select('*').eq('company_id', company.id);
        if (data) setUsers(data);

        if (success > 0) toast.success(`${success}件のメンバー情報を更新しました。${failed > 0 ? `（${failed}件失敗）` : ''}`);
        if (success === 0) toast.error(`更新に失敗しました（${failed}件）`);

        return { success, failed, errors };
    };

    const handleDeleteInvitation = async (id: string) => {
        if (!confirm("この招待を取り消しますか？")) return;
        const supabase = createClient();
        const { error } = await supabase.from('invitations').delete().eq('id', id);
        if (!error) setInvitations(invitations.filter(i => i.id !== id));
        else toast.error(`削除に失敗しました: ${error.message}`);
    };

    const handleResendInvitation = async (inv: Invitation) => {
        try {
            const mailRes = await fetch("/api/emails/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invitationId: inv.id })
            });
            if (mailRes.ok) {
                toast.success(`${inv.email} 宛に招待メールを再送しました`);
                setInvitations(prev => prev.map(p => p.id === inv.id ? { ...p, updated_at: new Date().toISOString() } : p));
            } else {
                const err = await mailRes.json();
                toast.error(`再送に失敗しました: ${err.error}`);
            }
        } catch (e: any) {
            toast.error(`エラーが発生しました: ${e.message}`);
        }
    };

    const handleCopyInviteLink = async (inv: Invitation | any) => {
        const url = `${window.location.origin}/onboarding?token=${inv.token}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("招待用URLをコピーしました！ Slackなどで共有してください。");
        } catch (err) {
            toast.error(`コピーに失敗しました: ${url}`);
        }
    };


    const handleStartEditUser = (u: User) => {
        setEditingUser(u);
        setEditForm({
            display_name: u.display_name || "",
            slack_user_id: (u as any).slack_user_id || "",
            department_id: u.department_id || "",
            axis_id: u.axis_id || "",
            role: u.role || "player"
        });
    };

    const handleSaveUserDetail = async () => {
        if (!editingUser) return;
        const supabase = createClient();
        const { error } = await supabase.from('users').update({
            display_name: editForm.display_name || null,
            slack_user_id: editForm.slack_user_id || null,
            department_id: editForm.department_id || null,
            axis_id: editForm.axis_id || null,
            role: editForm.role
        } as any).eq('id', editingUser.id);

        if (!error) {
            toast.success("ユーザー情報を更新しました");
            const { data } = await supabase.from('users').select('*').eq('company_id', company.id);
            if (data) setUsers(data);
            setEditingUser(null);
        } else toast.error(`保存に失敗しました: ${error.message}`);
    };

    const handleDeleteUser = async (userIdArg?: string) => {
        const userId = userIdArg || editingUser?.id;
        if (!userId) return;
        if (!window.confirm("本当にこのメンバーを削除しますか？\nこの操作は取り消せません。")) return;
        const supabase = createClient();
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (!error) {
            toast.success("メンバーを削除しました");
            setUsers(users.filter(u => u.id !== userId));
            setEditingUser(null);
        } else toast.error(`削除に失敗しました: ${error.message}`);
    };

    const handleRunAnalyze = async () => {
        const msg = isImpersonating 
            ? "【注意】現在は代理ログイン中です。他社の本番データを書き換え、最新の分析を生成します。本当によろしいですか？"
            : "AI分析を実行しますか？現在設定されているKPIや部署情報などをもとに、組織状態の推測とドキュメント生成を行います。";
        
        if (typeof window !== "undefined" && !confirm(msg)) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/ai/analyze", { method: "POST" });
            if (!res.ok) throw new Error("API Request Failed");
            toast.success("AIの分析処理が完了しました。ダッシュボードをご確認ください。");
            
            if (company) {
                setCompany({
                    ...company,
                    manual_ai_runs_used_this_month: (company.manual_ai_runs_used_this_month || 0) + 1
                });
            }
        } catch (error: any) {
            toast.error(`分析の実行中にエラーが発生しました: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRemindVoiceCheck = async () => {
        if (!confirm("今月のアンケート未回答者に、Slackで回答を催促しますか？")) return;
        try {
            const res = await fetch("/api/settings/remind-voice-check", { method: "POST" });
            if (!res.ok) throw new Error("API Request Failed");
            toast.success("未回答者に催促通知を送信しました。");
        } catch (error: any) {
            toast.error(`エラーが発生しました: ${error.message}`);
        }
    };

    const handleRemindKpi = async () => {
        if (!confirm("前月分のKPI未入力部署に、Slackで入力を催促しますか？")) return;
        try {
            const res = await fetch("/api/settings/remind-kpi", { method: "POST" });
            if (!res.ok) throw new Error("API Request Failed");
            toast.success("KPI入力リマインドを送信しました。");
        } catch (error: any) {
            toast.error(`エラーが発生しました: ${error.message}`);
        }
    };

    return {
        state: {
            loading, isAnalyzing, company, depts, kpis, axes, secondaryAxisName, users, invitations, inviteEmail,
            copied, inviteDeptId, inviteAxisId, inviteSlackUserId, editingUser, editForm, inviteRole, displayDepts
        },
        handlers: {
            setCompany, setDepts, setKpis, setAxes, setSecondaryAxisName, setInviteEmail, setInviteDeptId,
            setInviteRole,
            setInviteAxisId, setInviteSlackUserId, setEditForm, setEditingUser,
            handleCopyId, handleSaveCompany, handleSaveIntegration, handleTestClientSlackWebhook,
            handleTestMemberSlack, handleAddDept, handleSaveAllDepts, handleDeleteDept, handleAddKpi,
            handleSaveAllKpis, handleDeleteKpi, handleAddAxis, handleSaveAllAxes, handleDeleteAxis,
            handleInvite, handleBulkInvite, handleBulkUpdateUsers, handleDeleteInvitation, handleResendInvitation, handleCopyInviteLink,
            handleStartEditUser,
            handleSaveUserDetail, handleDeleteUser, handleRunAnalyze, handleRemindVoiceCheck,
            handlePreviewNotification, handleRemindKpi
        },
        userRole
    };
}
