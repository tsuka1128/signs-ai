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
