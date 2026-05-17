"use client";

import { useState, useRef } from "react";
import { UserPlus, Mail, ArrowRight, ShieldCheck, Edit3, Copy, Send, Trash2, HelpCircle, Upload, Download, AlertTriangle } from "lucide-react";
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
    handleBulkInvite: (rows: { email: string; role: string; department_id: string | null; slack_user_id: string | null }[]) => Promise<{ success: number; failed: number; errors: { email: string; reason: string }[] }>;
    handleBulkUpdateUsers: (updates: { userId: string; email?: string; role?: string; department_id?: string | null; slack_user_id?: string | null }[]) => Promise<{ success: number; failed: number; errors: { email: string; reason: string }[] }>;
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
    handleBulkUpdateUsers,
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
    // ── 型定義 ──
    interface BulkRow {
        email: string; role: string; deptName: string; deptId: string | null;
        slackUserId: string; valid: boolean; errorMsg: string;
    }
    interface UpdateWarning {
        userId: string; email: string;
        changes: { field: string; label: string; current: string; incoming: string }[];
    }
    type BulkInviteResult = { success: number; failed: number; errors: { email: string; reason: string }[] };

    // ── CSV パース（新規招待 ／ 既存差分 を分離）──
    function parseBulkCsvEnhanced(
        text: string, depts: any[], existingUsers: any[]
    ): { inviteRows: BulkRow[]; updateWarnings: UpdateWarning[]; skippedCount: number } {
        const validRoles = ['player', 'manager', 'executive', 'admin', 'partner'];
        const inviteRows: BulkRow[] = [];
        const updateWarnings: UpdateWarning[] = [];
        let skippedCount = 0;

        text.trim().split('\n')
            .filter(line => line.trim() && !line.toLowerCase().startsWith('email'))
            .forEach(line => {
                const [rawEmail = '', rawRole = '', rawDept = '', rawSlack = ''] =
                    line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                const email = rawEmail.toLowerCase();
                const role = validRoles.includes(rawRole.toLowerCase()) ? rawRole.toLowerCase() : 'player';
                const deptName = rawDept;
                const dept = deptName ? depts.find((d: any) => d.name === deptName) : null;
                const deptId = dept?.id || null;
                const slackUserId = rawSlack;

                const existing = existingUsers.find(u => u.email?.toLowerCase() === email);
                if (existing) {
                    const changes: UpdateWarning['changes'] = [];
                    if (existing.role !== role)
                        changes.push({ field: 'role', label: 'ロール', current: existing.role || '—', incoming: role });
                    const curDept = depts.find((d: any) => d.id === existing.department_id)?.name || '—';
                    const inDept = deptName || '—';
                    if (curDept !== inDept)
                        changes.push({ field: 'department_id', label: '部署', current: curDept, incoming: inDept });
                    const curSlack = existing.slack_user_id || '—';
                    const inSlack = slackUserId || '—';
                    if (curSlack !== inSlack)
                        changes.push({ field: 'slack_user_id', label: 'Slack ID', current: curSlack, incoming: inSlack });

                    if (changes.length > 0) updateWarnings.push({ userId: existing.id, email, changes });
                    else skippedCount++;
                } else {
                    let errorMsg = '';
                    if (!email || !email.includes('@')) errorMsg = 'メールアドレスが無効';
                    else if (role === 'manager' && !deptId)
                        errorMsg = deptName ? `部署「${deptName}」が見つかりません` : '部署は必須です（managerロール）';
                    inviteRows.push({ email, role, deptName, deptId, slackUserId, valid: !errorMsg, errorMsg });
                }
            });

        return { inviteRows, updateWarnings, skippedCount };
    }

    // ── テンプレート CSV ダウンロード ──
    function downloadTemplate(includeExisting: boolean, existingUsers: any[], depts: any[]) {
        const headers = ['email', 'role', 'department', 'slack_user_id'];
        const rows: string[][] = includeExisting
            ? existingUsers.map(u => [
                  u.email || '', u.role || '',
                  depts.find((d: any) => d.id === u.department_id)?.name || '',
                  u.slack_user_id || '',
              ])
            : [];
        const csv = [headers, ...rows]
            .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\r\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = includeExisting ? 'メンバー一覧.csv' : 'メンバー招待テンプレート.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── CSV ファイル読み込み & 自動パース ──
    function handleCsvFileSelect(file: File) {
        const reader = new FileReader();

        reader.onerror = () => {
            setSelectedFileName(null);
            // リセット
            setBulkPreview([]);
            setUpdateWarnings([]);
            setWarningSelections({});
            setBulkSkippedCount(0);
            // エラーはブラウザのコンソールに出るが、UIにも表示
            alert('ファイルの読み込みに失敗しました。');
        };

        reader.onload = (e) => {
            const text = (e.target?.result as string).replace(/^\uFEFF/, ''); // BOM除去
            setSelectedFileName(file.name);
            const { inviteRows, updateWarnings: warns, skippedCount } =
                parseBulkCsvEnhanced(text, depts, users);
            setBulkPreview(inviteRows);
            setUpdateWarnings(warns);
            setWarningSelections({});
            setBulkSkippedCount(skippedCount);
            setBulkResult(null);
            setBulkUpdateResult(null);
        };

        reader.readAsText(file, 'utf-8');
    }

    // ── ローカル state ──
    const [includeExistingInTemplate, setIncludeExistingInTemplate] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const csvFileInputRef = useRef<HTMLInputElement>(null);
    const [bulkPreview, setBulkPreview] = useState<BulkRow[]>([]);
    const [updateWarnings, setUpdateWarnings] = useState<UpdateWarning[]>([]);
    const [warningSelections, setWarningSelections] = useState<Record<number, boolean>>({});
    const [bulkSkippedCount, setBulkSkippedCount] = useState(0);
    const [bulkSending, setBulkSending] = useState(false);
    const [bulkResult, setBulkResult] = useState<BulkInviteResult | null>(null);
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [bulkUpdateResult, setBulkUpdateResult] = useState<BulkInviteResult | null>(null);

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

            {/* CSV 一括招待 / メンバー更新 */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-slate-400" /> CSVで一括招待 / メンバー更新
                    </h3>
                    <button
                        onClick={() => {
                            setShowBulk(!showBulk);
                            setBulkPreview([]); setBulkResult(null);
                            setUpdateWarnings([]); setWarningSelections({}); setBulkUpdateResult(null);
                            setSelectedFileName(null);
                            if (csvFileInputRef.current) csvFileInputRef.current.value = '';
                        }}
                        className="text-[10px] font-black text-slate-400 hover:text-teal transition-colors"
                    >
                        {showBulk ? '▲ 閉じる' : '▼ 開く'}
                    </button>
                </div>

                {showBulk && (
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">

                        {/* ① テンプレートダウンロード */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">テンプレートをダウンロード</p>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeExistingInTemplate}
                                        onChange={e => setIncludeExistingInTemplate(e.target.checked)}
                                        className="w-4 h-4 accent-teal"
                                    />
                                    <span className="text-[11px] font-bold text-slate-600">登録済みメンバーのデータを含める</span>
                                </label>
                                <button
                                    onClick={() => downloadTemplate(includeExistingInTemplate, users, depts)}
                                    className="flex items-center gap-1.5 text-[11px] font-black text-teal hover:text-teal-700 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" /> ダウンロード
                                </button>
                            </div>
                        </div>

                        {/* ② フォーマット説明 */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CSV形式（1行目はヘッダーとして無視）</p>
                            <code className="text-[11px] text-slate-500 font-mono block">email <span className="text-rose-400">*必須</span>,role,department,slack_user_id</code>
                            <code className="text-[11px] text-slate-500 font-mono block">member@company.com,player,営業部,U12345678</code>
                            <code className="text-[11px] text-slate-500 font-mono block">manager@company.com,manager,開発部,</code>
                            <p className="text-[10px] text-slate-400 mt-2">role: player / manager / executive / admin / partner（省略時は player）　※ manager は部署必須</p>
                            <p className="text-[10px] text-slate-400">登録済みメールアドレスは招待ではなく変更提案として扱われます</p>
                        </div>

                        {/* ③ ファイル選択 */}
                        <div>
                            <input
                                ref={csvFileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleCsvFileSelect(file);
                                    e.target.value = ''; // 同じファイルの再選択を可能にする
                                }}
                            />
                            <button
                                onClick={() => csvFileInputRef.current?.click()}
                                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl py-8 bg-white hover:border-teal hover:bg-teal/5 transition-all group"
                            >
                                <Upload className="w-6 h-6 text-slate-300 group-hover:text-teal transition-colors" />
                                {selectedFileName ? (
                                    <div className="text-center space-y-1">
                                        <p className="text-xs font-black text-teal">{selectedFileName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">別のファイルを選択</p>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-1">
                                        <p className="text-xs font-black text-slate-500">CSVファイルを選択</p>
                                        <p className="text-[10px] text-slate-400 font-bold">クリックしてファイルを選択してください</p>
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* ⑤A 新規招待 */}
                        {bulkPreview.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">新規招待</p>
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
                                            setBulkSending(true); setBulkResult(null);
                                            const result = await handleBulkInvite(
                                                bulkPreview.filter(r => r.valid).map(r => ({
                                                    email: r.email, role: r.role,
                                                    department_id: r.deptId, slack_user_id: r.slackUserId || null,
                                                }))
                                            );
                                            setBulkResult(result);
                                            setBulkSending(false);
                                            if (result.success > 0 && result.failed === 0) {
                                                setBulkPreview([]);
                                                setSelectedFileName(null);
                                                if (csvFileInputRef.current) csvFileInputRef.current.value = '';
                                            }
                                        }}
                                        disabled={bulkSending || bulkPreview.filter(r => r.valid).length === 0}
                                        className="bg-teal text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-teal-600 transition-all shadow-xl shadow-teal/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {bulkSending ? '送信中...' : <>{bulkPreview.filter(r => r.valid).length}件を一括招待 <Send className="w-4 h-4" /></>}
                                    </button>
                                </div>
                                {bulkResult && (
                                    <div className="space-y-2">
                                        <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${bulkResult.failed === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                            完了: {bulkResult.success}件成功 / {bulkResult.failed}件失敗
                                        </div>
                                        {bulkResult.errors.length > 0 && (
                                            <div className="overflow-x-auto rounded-2xl border border-rose-100">
                                                <table className="w-full text-xs border-collapse">
                                                    <thead>
                                                        <tr className="bg-rose-50">
                                                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-rose-600 uppercase">メール</th>
                                                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-rose-600 uppercase">エラー理由</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bulkResult.errors.map((e, i) => (
                                                            <tr key={i} className="border-t border-rose-100">
                                                                <td className="px-4 py-2 font-mono text-slate-600">{e.email}</td>
                                                                <td className="px-4 py-2 text-rose-600 font-bold">{e.reason}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ⑤B 既存メンバー差分警告 */}
                        {updateWarnings.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                    <p className="text-[11px] font-black text-amber-700">
                                        {updateWarnings.length}件は登録済みのメールアドレスです。変更内容を確認・選択してください。
                                    </p>
                                </div>
                                <div className="overflow-x-auto rounded-2xl border border-amber-100">
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-amber-50">
                                                <th className="px-4 py-2.5 text-center w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={updateWarnings.every((_, i) => warningSelections[i] !== false)}
                                                        onChange={e => {
                                                            const s: Record<number, boolean> = {};
                                                            updateWarnings.forEach((_, i) => { s[i] = e.target.checked; });
                                                            setWarningSelections(s);
                                                        }}
                                                        className="w-4 h-4 accent-amber-500"
                                                    />
                                                </th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-black text-amber-700 uppercase">メール</th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-black text-amber-700 uppercase">変更内容（現在 → 変更後）</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {updateWarnings.map((w, i) => (
                                                <tr key={i} className={`border-t border-amber-100 transition-opacity ${warningSelections[i] === false ? 'opacity-40' : ''}`}>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={warningSelections[i] !== false}
                                                            onChange={e => setWarningSelections(prev => ({ ...prev, [i]: e.target.checked }))}
                                                            className="w-4 h-4 accent-amber-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-slate-600">{w.email}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="space-y-1.5">
                                                            {w.changes.map((c, j) => (
                                                                <div key={j} className="flex items-center gap-2 text-[11px]">
                                                                    <span className="font-black text-slate-500 w-16 shrink-0">{c.label}</span>
                                                                    <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-mono">{c.current}</span>
                                                                    <span className="text-slate-300">→</span>
                                                                    <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">{c.incoming}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <p className="text-[11px] text-slate-500 font-bold">
                                        選択中: <span className="text-amber-600">{updateWarnings.filter((_, i) => warningSelections[i] !== false).length}件</span>を更新
                                    </p>
                                    <button
                                        onClick={async () => {
                                            setBulkUpdating(true); setBulkUpdateResult(null);
                                            const selected = updateWarnings.filter((_, i) => warningSelections[i] !== false);
                                            const payloads = selected.map(w => {
                                                const upd: any = { userId: w.userId, email: w.email };
                                                w.changes.forEach(c => {
                                                    if (c.field === 'role') upd.role = c.incoming;
                                                    else if (c.field === 'department_id')
                                                        upd.department_id = depts.find((d: any) => d.name === c.incoming)?.id ?? null;
                                                    else if (c.field === 'slack_user_id')
                                                        upd.slack_user_id = c.incoming === '—' ? null : c.incoming;
                                                });
                                                return upd;
                                            });
                                            const result = await handleBulkUpdateUsers(payloads);
                                            setBulkUpdateResult(result);
                                            setBulkUpdating(false);
                                            if (result.success > 0 && result.failed === 0) setUpdateWarnings([]);
                                        }}
                                        disabled={bulkUpdating || updateWarnings.filter((_, i) => warningSelections[i] !== false).length === 0}
                                        className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {bulkUpdating ? '更新中...' : `選択した${updateWarnings.filter((_, i) => warningSelections[i] !== false).length}件を更新`}
                                    </button>
                                </div>
                                {bulkUpdateResult && (
                                    <div className="space-y-2">
                                        <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${bulkUpdateResult.failed === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                            更新完了: {bulkUpdateResult.success}件成功 / {bulkUpdateResult.failed}件失敗
                                        </div>
                                        {bulkUpdateResult.errors.length > 0 && (
                                            <div className="overflow-x-auto rounded-2xl border border-rose-100">
                                                <table className="w-full text-xs border-collapse">
                                                    <thead>
                                                        <tr className="bg-rose-50">
                                                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-rose-600 uppercase">メール</th>
                                                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-rose-600 uppercase">エラー理由</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bulkUpdateResult.errors.map((e, i) => (
                                                            <tr key={i} className="border-t border-rose-100">
                                                                <td className="px-4 py-2 font-mono text-slate-600">{e.email}</td>
                                                                <td className="px-4 py-2 text-rose-600 font-bold">{e.reason}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ⑤C スキップ件数 */}
                        {bulkSkippedCount > 0 && (
                            <p className="text-[11px] text-slate-400 font-bold">
                                ※ {bulkSkippedCount}件は登録済み・変更なしのためスキップします
                            </p>
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
