"use client";

import { UserPlus, Mail, ArrowRight, ShieldCheck, Edit3, Copy, Send, Trash2 } from "lucide-react";
import { SlackHelpTooltip } from "@/components/ui/SlackHelpTooltip";

interface MembersTabProps {
    inviteEmail: string;
    setInviteEmail: (email: string) => void;
    inviteDeptId: string;
    setInviteDeptId: (id: string) => void;
    depts: any[];
    secondaryAxisName: string;
    inviteAxisId: string;
    setInviteAxisId: (id: string) => void;
    axes: any[];
    inviteSlackUserId: string;
    setInviteSlackUserId: (id: string) => void;
    handleTestMemberSlack: (id: string) => void;
    handleInvite: () => void;
    users: any[];
    kpis: any[];
    handleStartEditUser: (user: any) => void;
    invitations: any[];
    handleCopyInviteLink: (inv: any) => void;
    handleResendInvitation: (inv: any) => void;
    handleDeleteInvitation: (id: string) => void;
    inviteRole: string;
    setInviteRole: (role: string) => void;
}

export const MembersTab = ({
    inviteEmail,
    setInviteEmail,
    inviteDeptId,
    setInviteDeptId,
    depts,
    secondaryAxisName,
    inviteAxisId,
    setInviteAxisId,
    axes,
    inviteSlackUserId,
    setInviteSlackUserId,
    handleTestMemberSlack,
    handleInvite,
    users,
    kpis,
    handleStartEditUser,
    invitations,
    handleCopyInviteLink,
    handleResendInvitation,
    handleDeleteInvitation,
    inviteRole,
    setInviteRole
}: MembersTabProps) => {
    return (
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
                            <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest">付与する権限 <span className="text-rose-400">*</span></label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:border-teal appearance-none"
                            >
                                <option value="player">一般メンバー (player)</option>
                                <option value="manager">マネージャー (manager)</option>
                                <option value="executive">経営層 (executive)</option>
                                <option value="admin">管理者 (admin)</option>
                                <option value="partner">外部パートナー (partner)</option>
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
    );
};
