"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "@/lib/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            setMessage(null);

            await sendPasswordResetEmail(email);

            setMessage("パスワード再設定用のメールを送信しました。メール内のリンクをクリックして手続きを進めてください。");
        } catch (err: any) {
            setError(err.message || "メールの送信に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-200">
                            <span className="text-white font-black text-base italic">S</span>
                        </div>
                        <span className="text-xl font-black text-slate-800 tracking-tight">
                            Signs AI
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-tight mb-3">
                        パスワードを再設定
                    </h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        ご登録のメールアドレスを入力してください。
                        <br />
                        パスワード再設定用のリンクをお送りします。
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-6">
                    {message ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-600 font-bold leading-relaxed text-center">
                            {message}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    メールアドレス
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:bg-white transition-all placeholder:text-slate-200"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-slate-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin inline-block align-middle mr-2" />
                                ) : null}
                                <span>再設定メールを送信</span>
                            </button>
                        </form>
                    )}

                    <div className="text-center pt-2">
                        <Link
                            href="/login"
                            className="text-xs text-slate-400 hover:text-teal-600 font-bold transition-colors"
                        >
                            ログイン画面に戻る
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
