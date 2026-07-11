"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUpWithEmail } from "@/lib/auth";
import { getBaseURL, validatePassword, cn } from "@/lib/utils/index";
import { Eye, EyeOff } from "lucide-react";

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [inviteCompanyName, setInviteCompanyName] = useState<string | null>(null);

    useEffect(() => {
        // 1. クエリパラメータからトークンを取得
        let token = searchParams.get("token");

        // 2. なければハッシュフラグメントから取得（後方互換）
        if (!token && typeof window !== "undefined") {
            const hash = window.location.hash;
            if (hash.startsWith("#token=")) {
                token = hash.substring(7);
            }
        }

        if (token) {
            setInviteCode(token);
        }
    }, [searchParams]);

    // 招待トークンから会社名を取得してバナー表示（未ログイン=anon でも RLS で読める）
    useEffect(() => {
        const token = inviteCode.trim();
        if (!token) { setInviteCompanyName(null); return; }
        if (token === "TAION") { setInviteCompanyName("株式会社 TAION (デモ)"); return; }

        let cancelled = false;
        (async () => {
            const { createClient } = await import("@/lib/supabase");
            const supabase = createClient();
            const { data } = await supabase
                .from("invitations")
                .select("email, companies(name)")
                .eq("token", token)
                .eq("status", "pending")
                .gt("expires_at", new Date().toISOString())
                .maybeSingle();
            if (!cancelled && data) {
                setInviteCompanyName((data as any)?.companies?.name ?? null);
                if (data.email) {
                    setEmail(data.email);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [inviteCode]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("パスワードが一致しません。");
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 招待トークンがある場合、確認メールのリンクに引き継ぐ
            // パラメータ名 token は Supabase Auth メール確認用の token パラメータと衝突して
            // 上書きされてしまうため、自前のクエリには invite_token を使用します。
            const redirectTo = inviteCode.trim()
                ? `${getBaseURL()}/auth/callback?invite_token=${encodeURIComponent(inviteCode.trim())}`
                : undefined;

            await signUpWithEmail(email, password, redirectTo);

            setSuccess(true);
        } catch (err: any) {
            if (err.message === "ALREADY_REGISTERED") {
                setError("このメールアドレスはすでに登録されています。ログインするか、Googleアカウントで続行してください。");
            } else {
                setError(err.message || "登録に失敗しました。もう一度お試しください。");
            }
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
            {/* 招待コンテキスト（招待トークンありのとき主役として表示） */}
            {inviteCompanyName && (
                <div className="mb-6 p-4 bg-teal-50 border border-teal-100 rounded-2xl text-center animate-fadeIn">
                    <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1">招待されています</p>
                    <p className="text-sm font-black text-slate-800">
                        <span className="text-teal-600">{inviteCompanyName}</span> への参加
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">アカウントを作成して参加しましょう</p>
                </div>
            )}
            {success ? (
                <div className="text-center py-6 space-y-6 animate-fadeIn">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner shadow-emerald-100/50">
                        ✓
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">メールを確認してください</h2>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-sm text-slate-600 font-bold leading-relaxed mb-2">
                                <span className="text-teal-600 underline underline-offset-4">{email}</span>
                                <br />
                                へ確認リンクを送信しました。
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                                メール内のリンクをクリックすると、<br />
                                自動的にダッシュボードへログインします。
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4 pt-2">
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] animate-pulse">
                            Waiting for confirmation...
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link
                                href={inviteCode ? `/login?token=${encodeURIComponent(inviteCode)}` : "/login"}
                                className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors"
                            >
                                ログイン画面に戻る
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium flex flex-col gap-2">
                            <span>{error}</span>
                            {error.includes("すでに登録") && (
                                <Link 
                                    href={inviteCode ? `/login?token=${encodeURIComponent(inviteCode)}` : "/login"} 
                                    className="text-[11px] text-teal-600 underline font-black hover:text-teal-700 transition-colors"
                                >
                                    ログイン画面へ
                                </Link>
                            )}
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
                                readOnly={!!inviteCompanyName}
                                className={cn(
                                    "w-full px-4 py-3 rounded-xl border border-slate-100 text-sm font-bold transition-all placeholder:text-slate-300",
                                    inviteCompanyName
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed select-none"
                                        : "bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:bg-white"
                                )}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                パスワード
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:bg-white transition-all placeholder:text-slate-300 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {password && (
                                <div className="mt-1.5 space-y-1">
                                    <div className="flex gap-1">
                                        {[
                                            password.length >= 8,
                                            /[A-Z]/.test(password),
                                            /[a-z]/.test(password),
                                            /[0-9]/.test(password),
                                        ].map((met, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-colors ${
                                                    met ? "bg-teal-400" : "bg-slate-200"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        大文字・小文字・数字をそれぞれ1文字以上含む8文字以上
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                パスワード（確認）
                            </label>
                            <div className="relative group">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:bg-white transition-all placeholder:text-slate-300 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
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

                    <div className="pt-4 text-center space-y-4">
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4">
                            アカウントを作成することで、<Link href="/terms" className="text-teal-600 hover:underline">利用規約</Link>および<Link href="/privacy" className="text-teal-600 hover:underline">プライバシーポリシー</Link>に同意したものとみなされます。
                        </p>
                        <Link
                            href={inviteCode ? `/login?token=${encodeURIComponent(inviteCode)}` : "/login"}
                            className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors block"
                        >
                            すでにアカウントをお持ちですか？ ログイン
                        </Link>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function RegisterPage() {
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
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-200">
                            <span className="text-white font-black text-base italic">S</span>
                        </div>
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
                <Suspense fallback={<div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl p-8 h-96 animate-pulse" />}>
                    <RegisterForm />
                </Suspense>

                <p className="text-center mt-6 text-xs text-slate-400 font-medium">
                    © 2026 株式会社Taion — Signs AI
                </p>
            </div>
        </div>
    );
}
