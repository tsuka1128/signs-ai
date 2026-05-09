"use client";

import { Save, Building2, Copy, Check } from "lucide-react";

interface CompanyTabProps {
    company: any;
    setCompany: (company: any) => void;
    handleCopyId: () => void;
    handleSaveCompany: () => void;
    copied: boolean;
}

export const CompanyTab = ({ company, setCompany, handleCopyId, handleSaveCompany, copied }: CompanyTabProps) => {
    return (
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

                    {/* 業種 */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase">
                            業種
                        </label>
                        <select
                            value={company?.industry || ""}
                            onChange={(e) => setCompany({ ...company, industry: e.target.value || null })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:border-teal outline-none transition-all"
                        >
                            <option value="">選択してください</option>
                            <option value="it">IT・ソフトウェア</option>
                            <option value="manufacturing">製造</option>
                            <option value="retail">小売・EC</option>
                            <option value="healthcare">医療・介護</option>
                            <option value="finance">金融・保険</option>
                            <option value="consulting">コンサルティング</option>
                            <option value="education">教育</option>
                            <option value="realestate">不動産</option>
                            <option value="hospitality">飲食・ホスピタリティ</option>
                            <option value="other">その他サービス</option>
                        </select>
                    </div>

                    {/* 従業員規模 */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase">
                            従業員規模
                        </label>
                        <select
                            value={company?.size_category || ""}
                            onChange={(e) => setCompany({ ...company, size_category: e.target.value || null })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:border-teal outline-none transition-all"
                        >
                            <option value="">選択してください</option>
                            <option value="micro">〜20名</option>
                            <option value="small">21〜100名</option>
                            <option value="medium">101〜300名</option>
                            <option value="large">301名〜</option>
                        </select>
                    </div>

                    {/* 会計年度開始月 */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase">
                            会計年度開始月
                        </label>
                        <select
                            value={company?.fiscal_year_start_month || 1}
                            onChange={(e) => setCompany({ ...company, fiscal_year_start_month: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 focus:border-teal outline-none transition-all"
                        >
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                <option key={m} value={m}>{m}月始まり{m === 4 ? "（日本企業で多い）" : m === 1 ? "（暦年）" : ""}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1 ml-1">
                            ※ 現時点では記録のみ。将来の年度別レポートに使用します。
                        </p>
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
    );
};
