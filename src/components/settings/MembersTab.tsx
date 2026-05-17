"use client";

import { useState } from "react";
import { UserPlus, Mail, ArrowRight, ShieldCheck, Edit3, Copy, Send, Trash2, HelpCircle, Upload } from "lucide-react";
import { SlackHelpTooltip } from "@/components/ui/SlackHelpTooltip";
import { USER_ROLES, UserRole } from "@/lib/constants";

function getActivityStatus(lastSignInAt: string | null) {
    if (!lastSignInAt) return { label: "未ログイン", className: "bg-slate-100 text-slate-400" };
    const days = Math.floor((Date.now() - new Date(lastSignInAt).getTime()) / 86400000);
    if (days < 30)  return { label: "アクティブ", className: "bg-emerald-50 text-emerald-600" };
    if (days < 90)  return { label: "非アクティブ", className: "bg-amber-50 text-amber-600" };
    return { label: "長期未ログイン", className: "bg-rose-50 text-rose-500" };
}

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
    handleBulkInvite: (rows: { email: string; role: string; department_id: string | null; slack_user_id: string | null }[]) => Promise<{ success: number; failed: number }>;
    users: any[];
    kpis: any[];
    handleStartEditUser: (user: any) => void;
    invitations: any[];
    handleCopyInviteLink: (inv: any) => void;
    handleResendInvitation: (inv: any) => void;
    handleDeleteInvitation: (id: string) => void;
    inviteRole: UserRole;
    setInviteRole: (role: UserRole) => void;
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
    handleBulkInvite,
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
    interface BulkRow {
        email: string;
        role: string;
        deptName: string;
        deptId: string | null;
        slackUserId: string;
        valid: boolean;
        errorMsg: string;
    }

    function parseBulkCsv(text: string, depts: any[]): BulkRow[] {
        const validRoles = ['player', 'manager', 'executive', 'admin', 'partner'];
        return text.trim().split('\n')
            .filter(line => line.trim() && !line.toLowerCase().startsWith('email'))
            .map(line => {
                const [rawEmail = '', rawRole = '', rawDept = '', rawSlack = ''] =
                    line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                const email = rawEmail.toLowerCase();
                const role = validRoles.includes(rawRole.toLowerCase()) ? rawRole.toLowerCase() : 'player';
                const deptName = rawDept;
                const dept = deptName ? depts.find((d: any) => d.name === deptName) : null;
                const deptId = dept?.id || null;
                const slackUserId = rawSlack;
                let errorMsg = '';
                if (!email || !email.includes('@')) errorMsg = 'メールアドレスが無効';
                else if (role === 'manager' && deptName && !deptId) errorMsg = `部署「${deptName}」が見つかりません`;
                return { email, role, deptName, deptId, slackUserId, valid: !errorMsg, errorMsg };
            });
    }

    const [showBulk, setShowBulk] = useState(false);
    const [csvText, setCsvText] = useState("");
    const [bulkPreview, setBulkPreview] = useState<BulkRow[]>([]);
    const [bulkSending, setBulkSending] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ success: number; failed: number } | null>(null);

    return (
        <div className="space-y-10 animate-in fade-in">
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-teal" /> メンバーを招待
                    <a
                        href="/docs/member-management"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-teal transition-colors"
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                        ヘルプ
                    </a>
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
                            <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest">
                                所属部署
                                {inviteRole === 'manager' ? (
                                    <span className="text-rose-400 ml-1">*</span>
                                ) : (
                                    <span className="text-slate-300 ml-1">(任意)</span>
                                )}
                            </label>
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
                                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 outline-none focus:border-teal appearance-none"
                            >
                                {USER_ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
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
                            disabled={!inviteEmail || (inviteRole === 'manager' && !inviteDeptId)}
                            title={inviteRole === 'manager' && !inviteDeptId ? 'マネージャーには所属部署の設定が必要です' : undefined}
                            className="bg-teal text-white px-10 py-4 rounded-2xl font-black hover:bg-teal-600 transition-all shadow-xl shadow-teal/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            招待メールを送信 <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* CSV 一括招待 */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-slate-400" /> CSVで一括招待
                    </h3>
                    <button
                        onClick={() => { setShowBulk(!showBulk); setBulkPreview([]); setCsvText(""); setBulkResult(null); }}
                        className="text-[10px] font-black text-slate-400 hover:text-teal transition-colors"
                    >
                        {showBulk ? "▲ 閉じる" : "▼ 開く"}
                    </button>
                </div>

                {showBulk && (
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                        {/* フォーマット説明 */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CSV形式（1行目はヘッダーとして無視されます）</p>
                            <code className="text-[11px] text-slate-500 font-mono block">email,role,department,slack_user_id</code>
                            <code className="text-[11px] text-slate-500 font-mono block">member@company.com,player,営業部,U12345678</code>
                            <code className="text-[11px] text-slate-500 font-mono block">manager@company.com,manager,開発部,</code>
                            <p className="text-[10px] text-slate-400 mt-2">role: player / manager / executive / admin / partner（省略時は player）</p>
                        </div>

                        <textarea
                            value={csvText}
                            onChange={(e) => setCsvText(e.target.value)}
                            placeholder="CSVをここに貼り付けてください"
                            rows={5}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono text-slate-700 outline-none focus:border-teal resize-y"
                        />

                        <button
                            onClick={() => setBulkPreview(parseBulkCsv(csvText, depts))}
                            disabled={!csvText.trim()}
                            className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all disabled:opacity-40"
                        >
                            プレビュー確認
                        </button>

                        {bulkPreview.length > 0 && (
                            <div className="space-y-3">
                                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase">メール</th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase">ロール</th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase">部署</th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase">Slack ID</th>
                                                <th className="px-4 py-2.5 text-center text-[10px] font-black text-slate-400 uppercase">状態</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bulkPreview.map((row, i) => (
                                                <tr key={i} className={`border-t border-slate-100 ${row.valid ? '' : 'bg-rose-50/40'}`}>
                                                    <td className="px-4 py-2 font-mono">{row.email}</td>
                                                    <td className="px-4 py-2">{row.role}</td>
                                                    <td className="px-4 py-2">{row.deptName || '—'}</td>
                                                    <td className="px-4 py-2 font-mono">{row.slackUserId || '—'}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        {row.valid
                                                            ? <span className="text-emerald-500 font-black">✓</span>
                                                            : <span className="text-rose-500 font-black text-[10px]">⚠ {row.errorMsg}</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <p className="text-[11px] text-slate-500 font-bold">
                                        送信可能: <span className="text-emerald-600">{bulkPreview.filter(r => r.valid).length}件</span>
                                        {bulkPreview.filter(r => !r.valid).length > 0 && (
                                            <span className="text-rose-500 ml-2">エラー: {bulkPreview.filter(r => !r.valid).length}件</span>
                                        )}
                                    </p>
                                    <button
                                        onClick={async () => {
                                            setBulkSending(true);
                                            setBulkResult(null);
                                            const validRows = bulkPreview.filter(r => r.valid).map(r => ({
                                                email: r.email,
                                                role: r.role,
                                                department_id: r.deptId,
                                                slack_user_id: r.slackUserId || null,
                                            }));
                                            const result = await handleBulkInvite(validRows);
                                            setBulkResult(result);
                                            setBulkSending(false);
                                            if (result.success > 0) { setBulkPreview([]); setCsvText(""); }
                                        }}
                                        disabled={bulkSending || bulkPreview.filter(r => r.valid).length === 0}
                                        className="bg-teal text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-xl shadow-teal/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {bulkSending
                                            ? "送信中..."
                                            : <>{bulkPreview.filter(r => r.valid).length}件を一括招待 <Send className="w-4 h-4" /></>}
                                    </button>
                                </div>

                                {bulkResult && (
                                    <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${bulkResult.failed === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                        完了: {bulkResult.success}件成功 / {bulkResult.failed}件失敗
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
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
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">権限</th>
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
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <div className="text-sm font-black text-slate-800 leading-tight">{u.display_name || "未設定"}</div>
                                                            {(() => {
                                                                const status = getActivityStatus(u.last_sign_in_at ?? null);
                                                                return (
                                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${status.className}`}>
                                                                        {status.label}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
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
                                                <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500">
                                                    {USER_ROLES.find(r => r.value === u.role)?.label?.split('（')[0] ?? u.role}
                                                </span>
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
