"use client";

/**
 * テナントオンボーディング画面
 *
 * 初回ログイン後に表示されるステップウィザードです。
 * Step 1: 企業名
 * Step 2: 部署登録
 * Step 3: KPI定義
 * Step 4: セマンティックレイヤー（スキップ可）
 *
 * 完了後は /dashboard へ遷移します。
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/** 部署の入力フォーム */
interface DeptInput {
    name: string;
    headcount: number;
}

/** KPI の入力フォーム */
interface KpiInput {
    name: string;
    unit: string;
    target_default: string;
    owner_dept_index: number | null; // 部署のインデックス参照
    sort_order: number;
}

/** フォーム全体の状態 */
interface OnboardingState {
    companyName: string;
    departments: DeptInput[];
    kpis: KpiInput[];
    semanticContent: string;
}

/** ステップ定義 */
const STEPS = [
    { id: 1, label: "企業情報" },
    { id: 2, label: "部署登録" },
    { id: 3, label: "KPI設定" },
    { id: 4, label: "経営方針" },
];

/** KPI 単位の候補 */
const UNIT_OPTIONS = ["万円", "円", "%", "件", "名", "pt", "個", "回", "日", "時間", "その他"];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [state, setState] = useState<OnboardingState>({
        companyName: "",
        departments: [{ name: "", headcount: 0 }],
        kpis: [{ name: "", unit: "万円", target_default: "", owner_dept_index: null, sort_order: 0 }],
        semanticContent: "",
    });

    /* バリデーション */
    const canProceed = () => {
        if (step === 1) return state.companyName.trim().length > 0;
        if (step === 2) return state.departments.every((d) => d.name.trim().length > 0);
        if (step === 3) return state.kpis.every((k) => k.name.trim().length > 0);
        return true;
    };

    /* 部署の追加・削除 */
    const addDept = () =>
        setState((s) => ({ ...s, departments: [...s.departments, { name: "", headcount: 0 }] }));

    const removeDept = (i: number) =>
        setState((s) => ({ ...s, departments: s.departments.filter((_, idx) => idx !== i) }));

    const updateDept = (i: number, field: keyof DeptInput, value: string | number) =>
        setState((s) => {
            const departments = [...s.departments];
            departments[i] = { ...departments[i], [field]: value };
            return { ...s, departments };
        });

    /* KPI の追加・削除 */
    const addKpi = () =>
        setState((s) => ({
            ...s,
            kpis: [
                ...s.kpis,
                { name: "", unit: "万円", target_default: "", owner_dept_index: null, sort_order: s.kpis.length },
            ],
        }));

    const removeKpi = (i: number) =>
        setState((s) => ({ ...s, kpis: s.kpis.filter((_, idx) => idx !== i) }));

    const updateKpi = (i: number, field: keyof KpiInput, value: string | number | null) =>
        setState((s) => {
            const kpis = [...s.kpis];
            kpis[i] = { ...kpis[i], [field]: value };
            return { ...s, kpis };
        });

    /* 最終送信 */
    const handleSubmit = async (skip = false) => {
        try {
            setSubmitting(true);
            setError(null);

            const payload = {
                companyName: state.companyName,
                departments: state.departments,
                kpis: state.kpis,
                semanticContent: skip ? "" : state.semanticContent,
            };

            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const { message } = await res.json();
                throw new Error(message || "保存に失敗しました");
            }

            router.push("/dashboard");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "エラーが発生しました";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex flex-col items-center py-12 px-4">
            {/* ヘッダー */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-2">
                    <span className="text-xl">🌡️</span>
                    <span className="text-lg font-black text-slate-800 tracking-tight">Signs AI</span>
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tighter">初期設定</h1>
                <p className="text-sm text-slate-400 font-medium mt-1">あなたの組織に体温を設定します</p>
            </div>

            {/* ステップバー */}
            <div className="flex items-center gap-2 mb-8">
                {STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                        <div
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                                step === s.id
                                    ? "bg-teal-500 text-white shadow-lg shadow-teal-200"
                                    : step > s.id
                                        ? "bg-emerald-100 text-emerald-600"
                                        : "bg-slate-100 text-slate-400"
                            )}
                        >
                            {step > s.id ? "✓" : s.id}
                        </div>
                        <span
                            className={cn(
                                "text-xs font-bold hidden sm:inline transition-colors",
                                step >= s.id ? "text-slate-600" : "text-slate-300"
                            )}
                        >
                            {s.label}
                        </span>
                        {i < STEPS.length - 1 && (
                            <div className={cn("w-8 h-px mx-1 transition-colors", step > s.id ? "bg-emerald-300" : "bg-slate-200")} />
                        )}
                    </div>
                ))}
            </div>

            {/* フォームカード */}
            <div className="w-full max-w-lg bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                        {error}
                    </div>
                )}

                {/* Step 1: 企業名 */}
                {step === 1 && (
                    <div className="space-y-4 animate-fadeIn">
                        <h2 className="text-lg font-black text-slate-800">企業名を入力してください</h2>
                        <p className="text-sm text-slate-400">ダッシュボードに表示される会社名です</p>
                        <input
                            id="company-name-input"
                            type="text"
                            placeholder="株式会社〇〇"
                            value={state.companyName}
                            onChange={(e) => setState((s) => ({ ...s, companyName: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                        />
                    </div>
                )}

                {/* Step 2: 部署登録 */}
                {step === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                        <h2 className="text-lg font-black text-slate-800">部署を登録してください</h2>
                        <p className="text-sm text-slate-400">後から変更・追加できます</p>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {state.departments.map((dept, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        id={`dept-name-${i}`}
                                        type="text"
                                        placeholder={`部署名（例: 営業部）`}
                                        value={dept.name}
                                        onChange={(e) => updateDept(i, "name", e.target.value)}
                                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                    />
                                    <input
                                        id={`dept-headcount-${i}`}
                                        type="number"
                                        placeholder="人数"
                                        min={0}
                                        value={dept.headcount || ""}
                                        onChange={(e) => updateDept(i, "headcount", parseInt(e.target.value) || 0)}
                                        className="w-20 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                    />
                                    {state.departments.length > 1 && (
                                        <button
                                            onClick={() => removeDept(i)}
                                            className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-sm transition-colors"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            id="add-dept-btn"
                            onClick={addDept}
                            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-all"
                        >
                            ＋ 部署を追加
                        </button>
                    </div>
                )}

                {/* Step 3: KPI定義 */}
                {step === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                        <h2 className="text-lg font-black text-slate-800">KPIを設定してください</h2>
                        <p className="text-sm text-slate-400">最大10個まで登録できます（後から変更可）</p>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {state.kpis.map((kpi, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            id={`kpi-name-${i}`}
                                            type="text"
                                            placeholder="KPI名（例: MRR、商談数）"
                                            value={kpi.name}
                                            onChange={(e) => updateKpi(i, "name", e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                        />
                                        {state.kpis.length > 1 && (
                                            <button
                                                onClick={() => removeKpi(i)}
                                                className="w-7 h-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs transition-colors"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            id={`kpi-unit-${i}`}
                                            value={kpi.unit}
                                            onChange={(e) => updateKpi(i, "unit", e.target.value)}
                                            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                        >
                                            {UNIT_OPTIONS.map((u) => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                        <input
                                            id={`kpi-target-${i}`}
                                            type="number"
                                            placeholder="目標値（任意）"
                                            value={kpi.target_default}
                                            onChange={(e) => updateKpi(i, "target_default", e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                        />
                                    </div>
                                    <select
                                        id={`kpi-owner-${i}`}
                                        value={kpi.owner_dept_index ?? ""}
                                        onChange={(e) =>
                                            updateKpi(i, "owner_dept_index", e.target.value === "" ? null : parseInt(e.target.value))
                                        }
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                    >
                                        <option value="">主担当部署（任意）</option>
                                        {state.departments.filter((d) => d.name).map((dept, di) => (
                                            <option key={di} value={di}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        {state.kpis.length < 10 && (
                            <button
                                id="add-kpi-btn"
                                onClick={addKpi}
                                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-all"
                            >
                                ＋ KPIを追加
                            </button>
                        )}
                    </div>
                )}

                {/* Step 4: セマンティックレイヤー */}
                {step === 4 && (
                    <div className="space-y-4 animate-fadeIn">
                        <h2 className="text-lg font-black text-slate-800">経営方針を入力してください</h2>
                        <p className="text-sm text-slate-400">
                            AIがこの内容を参考に診断を行います。Notionで書いたMarkdownをそのままコピーして使えます。スキップも可能です。
                        </p>
                        <textarea
                            id="semantic-content-input"
                            value={state.semanticContent}
                            onChange={(e) => setState((s) => ({ ...s, semanticContent: e.target.value }))}
                            placeholder={`# 経営方針 v1.0\n\n## 今のフェーズ\n- フェーズ: 垂直立ち上げ\n\n## KPIの解釈\n- MRR: 月次20%成長がNorth Star\n\n## 地雷ワード\n- 「辞めたい」「限界」`}
                            rows={10}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
                        />
                    </div>
                )}

                {/* ナビゲーションボタン */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                    <button
                        id="onboarding-back-btn"
                        onClick={() => setStep((s) => s - 1)}
                        disabled={step === 1}
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
                    >
                        ← 戻る
                    </button>

                    <div className="flex gap-2">
                        {step === 4 && (
                            <button
                                id="skip-semantic-btn"
                                onClick={() => handleSubmit(true)}
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 transition-all"
                            >
                                スキップ
                            </button>
                        )}
                        <button
                            id="onboarding-next-btn"
                            onClick={() => {
                                if (step < 4) setStep((s) => s + 1);
                                else handleSubmit(false);
                            }}
                            disabled={!canProceed() || submitting}
                            className="px-8 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white text-sm font-bold shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {submitting
                                ? "保存中..."
                                : step < 4
                                    ? "次へ →"
                                    : "ダッシュボードへ"}
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-center mt-4 text-xs text-slate-300 font-medium">
                設定は後からいつでも変更できます
            </p>
        </div>
    );
}
