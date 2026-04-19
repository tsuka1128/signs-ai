"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordUpdatePage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("パスワードが一致しません。");
            return;
        }

        if (password.length < 8) {
            setError("パスワードは8文字以上で入力してください。");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await updatePassword(password);
            alert("パスワードを更新しました。新しいパスワードでログインしてください。");
            router.push("/login");
        } catch (err: any) {
            setError(err.message || "パスワードの更新に失敗しました。");
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
                        新しいパスワードを設定
                    </h1>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        新しいパスワードを入力してください。
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                                {error}
                            </div>
                        )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        新しいパスワード
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:bg-white transition-all placeholder:text-slate-200 pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold ml-1">※ 8文字以上（英数字の組み合わせ）を推奨</p>
                                </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                パスワード（確認）
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
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
                            <span>パスワードを更新</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
