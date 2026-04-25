"use client";

import { useState } from "react";
import { Settings2, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils/index";
import { useSettingsData } from "@/hooks/useSettingsData";
import { PlanGate } from "@/components/ui/PlanGate";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { TrialGuard } from "@/components/layout/TrialGuard";

// Tab Components
import { CompanyTab } from "@/components/settings/CompanyTab";
import { DepartmentsTab } from "@/components/settings/DepartmentsTab";
import { KpiTab } from "@/components/settings/KpiTab";
import { AxesTab } from "@/components/settings/AxesTab";
import { MembersTab } from "@/components/settings/MembersTab";
import { IntegrationTab } from "@/components/settings/IntegrationTab";
import { AITab } from "@/components/settings/AITab";

// Modals
import { HistoryModal } from "@/components/settings/HistoryModal";
import { MemberEditModal } from "@/components/settings/MemberEditModal";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("company");
    const { state, handlers } = useSettingsData();
    const { plan, limits } = usePlanFeatures();

    if (state.loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <AppLayout>
            <TrialGuard>
                <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                            <Settings2 className="w-8 h-8 text-teal" />
                            設定
                        </h1>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">組織構成と指標のカスタマイズ</p>
                    </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
                    {[
                        { id: "company", label: "基本設定" },
                        { id: "dept", label: "部署" },
                        { id: "kpi", label: "KPI" },
                        { id: "axis", label: "担当領域" },
                        { id: "ai", label: "AI分析" },
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

                {/* Content Area */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[500px]">
                    {activeTab === "company" && (
                        <CompanyTab 
                            company={state.company}
                            setCompany={handlers.setCompany}
                            handleCopyId={handlers.handleCopyId}
                            handleSaveCompany={handlers.handleSaveCompany}
                            copied={state.copied}
                        />
                    )}

                    {activeTab === "dept" && (
                        <DepartmentsTab 
                            depts={state.depts}
                            setDepts={handlers.setDepts}
                            getHistoryTrend={handlers.getHistoryTrend}
                            handleOpenHistory={handlers.handleOpenHistory}
                            handleDeleteDept={handlers.handleDeleteDept}
                            handleAddDept={handlers.handleAddDept}
                            handleSaveAllDepts={handlers.handleSaveAllDepts}
                        />
                    )}

                    {activeTab === "kpi" && (
                        <KpiTab 
                            kpis={state.kpis}
                            setKpis={handlers.setKpis}
                            depts={state.depts}
                            handleDeleteKpi={handlers.handleDeleteKpi}
                            handleAddKpi={handlers.handleAddKpi}
                            handleSaveAllKpis={handlers.handleSaveAllKpis}
                        />
                    )}

                    {activeTab === "axis" && (
                        <PlanGate feature="second_axis" requiredPlan="Standard">
                            <AxesTab 
                                secondaryAxisName={state.secondaryAxisName}
                                setSecondaryAxisName={handlers.setSecondaryAxisName}
                                company={state.company}
                                setCompany={handlers.setCompany}
                                kpis={state.kpis}
                                axes={state.axes}
                                setAxes={handlers.setAxes}
                                getHistoryTrend={handlers.getHistoryTrend}
                                handleOpenHistory={handlers.handleOpenHistory}
                                handleDeleteAxis={handlers.handleDeleteAxis}
                                handleAddAxis={handlers.handleAddAxis}
                                handleSaveAllAxes={handlers.handleSaveAllAxes}
                            />
                        </PlanGate>
                    )}

                    {activeTab === "ai" && (
                        <AITab 
                            isAnalyzing={state.isAnalyzing}
                            handleRunAnalyze={handlers.handleRunAnalyze}
                            company={state.company}
                            plan={plan}
                            limits={limits}
                        />
                    )}

                    {activeTab === "users" && (
                        <MembersTab 
                            inviteEmail={state.inviteEmail}
                            setInviteEmail={handlers.setInviteEmail}
                            inviteDeptId={state.inviteDeptId}
                            setInviteDeptId={handlers.setInviteDeptId}
                            depts={state.depts}
                            secondaryAxisName={state.secondaryAxisName}
                            inviteAxisId={state.inviteAxisId}
                            setInviteAxisId={handlers.setInviteAxisId}
                            axes={state.axes}
                            inviteSlackUserId={state.inviteSlackUserId}
                            setInviteSlackUserId={handlers.setInviteSlackUserId}
                            handleTestMemberSlack={handlers.handleTestMemberSlack}
                            handleInvite={handlers.handleInvite}
                            users={state.users}
                            kpis={state.kpis}
                            handleStartEditUser={handlers.handleStartEditUser}
                            invitations={state.invitations}
                            handleCopyInviteLink={handlers.handleCopyInviteLink}
                            handleResendInvitation={handlers.handleResendInvitation}
                            handleDeleteInvitation={handlers.handleDeleteInvitation}
                            inviteRole={state.inviteRole}
                            setInviteRole={handlers.setInviteRole}
                        />
                    )}

                    {activeTab === "integration" && (
                        <PlanGate feature="slack_integration" requiredPlan="Standard">
                            <IntegrationTab 
                                company={state.company}
                                setCompany={handlers.setCompany}
                                handleTestClientSlackWebhook={handlers.handleTestClientSlackWebhook}
                                handleSaveIntegration={handlers.handleSaveIntegration}
                                handleRemindVoiceCheck={handlers.handleRemindVoiceCheck}
                                handlePreviewNotification={handlers.handlePreviewNotification}
                                handleRemindKpi={handlers.handleRemindKpi}
                            />
                        </PlanGate>
                    )}
                </div>

            {/* Modals outside of main content for better layering */}
            {state.historyModalOpen && (
                <HistoryModal 
                    historyTarget={state.historyTarget}
                    setHistoryModalOpen={handlers.setHistoryModalOpen}
                    tempHistory={state.tempHistory}
                    setTempHistory={handlers.setTempHistory}
                    handleSaveHistory={handlers.handleSaveHistory}
                    isSavingHistory={state.isSavingHistory}
                />
            )}

            {state.editingUser && (
                <MemberEditModal 
                    userEmail={state.editingUser.email || "未設定"}
                    onClose={() => handlers.setEditingUser(null)}
                    editForm={state.editForm}
                    setEditForm={handlers.setEditForm}
                    depts={state.depts}
                    secondaryAxisName={state.secondaryAxisName}
                    axes={state.axes}
                    handleTestMemberSlack={handlers.handleTestMemberSlack}
                    handleSaveUserDetail={handlers.handleSaveUserDetail}
                    handleDeleteUser={handlers.handleDeleteUser}
                />
            )}
                </div>
            </TrialGuard>
        </AppLayout>
    );
}
