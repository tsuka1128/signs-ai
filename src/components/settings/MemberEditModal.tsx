"use client";

import { createPortal } from "react-dom";
import { X, Save, Trash2 } from "lucide-react";
import { SlackHelpTooltip } from "@/components/ui/SlackHelpTooltip";
import { USER_ROLES } from "@/lib/constants";

interface MemberEditModalProps {
    userEmail: string;
    onClose: () => void;
    editForm: any;
    setEditForm: (form: any) => void;
    depts: any[];
    secondaryAxisName: string;
    axes: any[];
    handleTestMemberSlack: (id: string) => void;
    handleSaveUserDetail: () => void;
    handleDeleteUser: () => void;
}

export const MemberEditModal = ({
    userEmail,
    onClose,
    editForm,
    setEditForm,
    depts,
    secondaryAxisName,
    axes,
    handleTestMemberSlack,
    handleSaveUserDetail,
    handleDeleteUser
}: MemberEditModalProps) => {
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tighter">メンバー属性の編集</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{userEmail}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
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
                            <label className="block text-[10px] font-black text-slate-400 mb-2 ml-1 uppercase tracking-widest">
                                権限ロール
                            </label>
                            <select
                                value={editForm.role || ''}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-teal transition-all"
                            >
                                {USER_ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                            {editForm.role === 'manager' && !editForm.department_id && (
                                <p className="text-[10px] text-rose-400 mt-1.5 ml-1 font-bold">
                                    マネージャーには所属部署の設定が必要です
                                </p>
                            )}
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
                            onClick={onClose}
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
                            onClick={handleDeleteUser}
                            className="w-full py-4 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> このメンバーを削除する
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
