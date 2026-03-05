"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpWithEmail } from "@/lib/auth";
import { getBaseURL } from "@/lib/utils/url";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("パスワードが一致しません。");
            return;
        }

        if (password.length < 6) {
            setError("パスワードは6文字以上で入力してください。");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // サインアップ。Supabaseの設定によってはメール確認が必要
            await signUpWithEmail(email, password);

            setSuccess(true);
            // 数秒後にログイン画面へ誘導、または自動リダイレクト
            setTimeout(() => {
                router.push("/login?registered=true");
            }, 3000);
        } catch (err: any) {
            setError(err.message || "登録に失敗しました。もう一度お試しください。");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center p-4">
            {/* 背景装飾 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* ロゴ・コピー */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 mb-6">
                        <span className="text-2xl">🌡️</span>
                        <span className="text-xl font-black text-slate-800 tracking-tight">
                            Signs AI
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter leading-tight mb-3">
                        アカウントを作成。
                    </h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        組織の体温を可視化。
                        <br />
                        AI経営参謀を始めましょう
                    </p>
                </div>

                {/* 登録カード */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                    {success ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                                ✓
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">登録ありがとうございます！</h2>
                            <p className="text-sm text-slate-500">
                                登録したメールアドレスでログインできるようになります。
                                <br />
                                もし確認メールが届いた場合は、リンクをクリックしてください。
                            </p>
                            <p className="text-xs text-slate-400">ログイン画面へ移動しています...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        メールアドレス
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:bg-white transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        パスワード
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:bg-white transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        パスワード（確認）
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:bg-white transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-slate-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin inline-block align-middle mr-2" />
                                ) : null}
                                <span>{loading ? "登録中..." : "アカウントを作成する"}</span>
                            </button>

                            <div className="pt-4 text-center">
                                <Link
                                    href="/login"
                                    className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors"
                                >
                                    すでにアカウントをお持ちですか？ ログイン
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center mt-6 text-xs text-slate-400 font-medium">
                    © 2026 株式会社Taion — Signs AI
                </p>
            </div>
        </div>
    );
}
