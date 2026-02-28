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

import { useState, useRef, useEffect } from "react";
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
const UNIT_OPTIONS = ["円", "%", "件", "名", "pt", "個", "回", "日", "時間", "その他"];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 自動スクロール用の参照
    const deptListEndRef = useRef<HTMLDivElement>(null);
    const kpiListEndRef = useRef<HTMLDivElement>(null);

    // 経営方針ウィザード用の状態
    const [semanticMode, setSemanticMode] = useState<"wizard" | "manual">("wizard");
    const [wizardState, setWizardState] = useState<{
        vision: string;
        phase: string;
        kpiGuide: Record<number, string>;
        issues: string;
        triggerWords: string;
    }>({
        vision: "",
        phase: "",
        kpiGuide: {},
        issues: "",
        triggerWords: "",
    });

    const [state, setState] = useState<OnboardingState>({
        companyName: "",
        departments: [{ name: "", headcount: 0 }],
        kpis: [{ name: "", unit: "万円", target_default: "", owner_dept_index: null, sort_order: 0 }],
        semanticContent: "",
    });

    /* ウィザード入力からMarkdownを自動生成 */
    useEffect(() => {
        if (semanticMode === "wizard") {
            let content = "# 経営方針\n\n";
            if (wizardState.vision) content += `## 目指す組織\n- ${wizardState.vision.split('\n').join('\n- ')}\n\n`;
            if (wizardState.phase) content += `## 組織の現在地\n- ${wizardState.phase.split('\n').join('\n- ')}\n\n`;

            // KPIごとのガイドラインを生成
            const kpiItems = state.kpis
                .map((kpi, i) => {
                    const guide = wizardState.kpiGuide[i];
                    if (kpi.name && guide) {
                        return `- **${kpi.name}**: ${guide}`;
                    }
                    return null;
                })
                .filter(Boolean);

            if (kpiItems.length > 0) {
                content += `## KPIの解釈ガイド\n${kpiItems.join('\n')}\n\n`;
            }

            if (wizardState.issues) content += `## 組織の注意点\n- ${wizardState.issues.split('\n').join('\n- ')}\n\n`;
            if (wizardState.triggerWords) content += `## 気になるキーワード\n- ${wizardState.triggerWords.split(',').map(w => w.trim()).filter(Boolean).join('\n- ')}\n\n`;

            // 何も入力されていない場合はプレースホルダーを入れる
            if (content === "# 経営方針\n\n") content = "";

            setState((s) => ({ ...s, semanticContent: content.trim() }));
        }
    }, [wizardState, semanticMode]);

    /* 追加時にスクロールする副作用 */
    useEffect(() => {
        if (step === 2) {
            deptListEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [state.departments.length, step]);

    useEffect(() => {
        if (step === 3) {
            kpiListEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [state.kpis.length, step]);

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
                { name: "", unit: "円", target_default: "", owner_dept_index: null, sort_order: s.kpis.length },
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

            router.push("/");
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
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">部署を登録してください</h2>
                                <p className="text-sm text-slate-400">組織の構成単位を入力します</p>
                            </div>
                            <span className="text-xs font-bold text-slate-400">全 {state.departments.length} 部署</span>
                        </div>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {state.departments.map((dept, i) => (
                                <div key={i} className="flex items-center gap-2 group">
                                    <div className="w-6 text-[10px] font-black text-slate-300 group-hover:text-teal-400 transition-colors">
                                        {String(i + 1).padStart(2, '0')}
                                    </div>
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
                            <div ref={deptListEndRef} />
                        </div>
                        <button
                            id="add-dept-btn"
                            onClick={addDept}
                            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-all bg-slate-50/50 hover:bg-teal-50/30"
                        >
                            ＋ 部署を追加
                        </button>
                    </div>
                )}

                {/* Step 3: KPI定義 */}
                {step === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">KPIを設定してください</h2>
                                <p className="text-sm text-slate-400">毎月追跡したい主要な数字（KPI）を定義します</p>
                            </div>
                            <span className="text-xs font-bold text-slate-400">{state.kpis.length} / 10 個</span>
                        </div>
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 -mr-2">
                            {state.kpis.map((kpi, i) => (
                                <div key={i} className="p-5 bg-white rounded-2xl space-y-4 border border-slate-100 shadow-sm shadow-slate-200/50 transition-all hover:border-teal-200 group relative">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-none w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[11px] font-black text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-inner">
                                            {i + 1}
                                        </div>
                                        <input
                                            id={`kpi-name-${i}`}
                                            type="text"
                                            placeholder="KPI名（例: MRR、商談数）"
                                            value={kpi.name}
                                            onChange={(e) => updateKpi(i, "name", e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl border border-transparent bg-slate-50/50 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-teal-400 focus:ring-4 focus:ring-teal-400/5 transition-all"
                                        />
                                        {state.kpis.length > 1 && (
                                            <button
                                                onClick={() => removeKpi(i)}
                                                className="flex-none w-8 h-8 rounded-xl bg-red-50 text-red-300 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-sm transition-all"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 pl-9">
                                        <div className="relative flex-none w-24">
                                            <select
                                                id={`kpi-unit-${i}`}
                                                value={kpi.unit}
                                                onChange={(e) => updateKpi(i, "unit", e.target.value)}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-600 appearance-none focus:outline-none focus:bg-white focus:border-teal-400 transition-all cursor-pointer"
                                            >
                                                {UNIT_OPTIONS.map((u) => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-slate-400">
                                                ▼
                                            </div>
                                        </div>
                                        <input
                                            id={`kpi-target-${i}`}
                                            type="number"
                                            placeholder="毎月の目標値（任意）"
                                            value={kpi.target_default}
                                            onChange={(e) => updateKpi(i, "target_default", e.target.value)}
                                            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-600 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-teal-400 transition-all"
                                        />
                                    </div>
                                    <div className="pl-9">
                                        <div className="relative">
                                            <select
                                                id={`kpi-owner-${i}`}
                                                value={kpi.owner_dept_index ?? ""}
                                                onChange={(e) =>
                                                    updateKpi(i, "owner_dept_index", e.target.value === "" ? null : parseInt(e.target.value))
                                                }
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-600 appearance-none focus:outline-none focus:bg-white focus:border-teal-400 transition-all cursor-pointer"
                                            >
                                                <option value="">（未設定）主担当部署</option>
                                                {state.departments.filter((d) => d.name).map((dept, di) => (
                                                    <option key={di} value={di}>{dept.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-slate-400">
                                                ▼
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={kpiListEndRef} />
                        </div>
                        {state.kpis.length < 10 && (
                            <button
                                id="add-kpi-btn"
                                onClick={addKpi}
                                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-all bg-slate-50/50 hover:bg-teal-50/30"
                            >
                                ＋ 新しいKPIを追加
                            </button>
                        )}
                    </div>
                )}

                {/* Step 4: セマンティックレイヤー */}
                {step === 4 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-start sm:items-end mb-4 gap-4">
                            <div className="flex-1">
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    経営方針を入力してください
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    AIがこの内容を参考に診断を行います（スキップ可能）
                                </p>
                            </div>
                            <div className="flex-none flex items-center bg-slate-100 p-1 rounded-lg self-center sm:self-end">
                                <button
                                    onClick={() => setSemanticMode("wizard")}
                                    className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap", semanticMode === "wizard" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                >
                                    質問に答える
                                </button>
                                <button
                                    onClick={() => setSemanticMode("manual")}
                                    className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap", semanticMode === "manual" ? "bg-white text-teal-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                >
                                    直接編集
                                </button>
                            </div>
                        </div>

                        {semanticMode === "wizard" ? (
                            <div className="space-y-5 max-h-[450px] overflow-y-auto pr-2 pb-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs">1</span>
                                        どんな組織を目指しているのか？
                                    </label>
                                    <textarea
                                        placeholder="例: お客様に寄り添い、真の課題解決を提供する組織。"
                                        value={wizardState.vision}
                                        onChange={(e) => setWizardState(s => ({ ...s, vision: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/5 transition-all resize-none h-20 bg-slate-50 hover:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs">2</span>
                                        組織の現在地やフェーズは？
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="例: ユニットエコノミクス改善期に入った。質重視。"
                                        value={wizardState.phase}
                                        onChange={(e) => setWizardState(s => ({ ...s, phase: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/5 transition-all bg-slate-50 hover:bg-white"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <span className="w-5 h-5 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs">3</span>
                                            KPIの解釈ガイドライン
                                        </label>
                                        <p className="text-[11px] text-slate-400 sm:pl-7">今の組織でKPIをどう捉えるべきかを設定します</p>
                                    </div>
                                    <div className="space-y-3">
                                        {state.kpis.map((kpi, i) => {
                                            if (!kpi.name.trim()) return null;
                                            return (
                                                <div key={i} className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-teal-700">{kpi.name}</span>
                                                    <input
                                                        type="text"
                                                        placeholder="例: 商談数は減少してもOK。成約率20%を死守。"
                                                        value={wizardState.kpiGuide[i] || ""}
                                                        onChange={(e) => setWizardState(s => ({
                                                            ...s,
                                                            kpiGuide: { ...s.kpiGuide, [i]: e.target.value }
                                                        }))}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/5 transition-all bg-slate-50 hover:bg-white"
                                                    />
                                                </div>
                                            );
                                        })}
                                        {state.kpis.every(k => !k.name.trim()) && (
                                            <p className="text-xs text-slate-400 italic">※先にStep3でKPI名を登録してください</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs">4</span>
                                        組織の注意点や課題は？
                                    </label>
                                    <textarea
                                        placeholder="例: 特定メンバーへの属人化が課題。新人の育成が必要。"
                                        value={wizardState.issues}
                                        onChange={(e) => setWizardState(s => ({ ...s, issues: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/5 transition-all resize-none h-20 bg-slate-50 hover:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xs">5</span>
                                        気になるキーワード（カンマ区切り）
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="例: 辞めたい, 新機能, 競合他社A, 生成AI"
                                        value={wizardState.triggerWords}
                                        onChange={(e) => setWizardState(s => ({ ...s, triggerWords: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/5 transition-all bg-slate-50 hover:bg-white"
                                    />
                                    <p className="text-[11px] text-slate-400 pl-1">AIに優先的に注目させたいキーワードを複数指定できます</p>
                                </div>
                            </div>
                        ) : (
                            <textarea
                                id="semantic-content-input"
                                value={state.semanticContent}
                                onChange={(e) => setState((s) => ({ ...s, semanticContent: e.target.value }))}
                                placeholder={`# 経営方針 v1.0\n\n## 目指す組織\n- お客様に真の価値を提供する\n\n## 今のフェーズ\n- フェーズ: 垂直立ち上げ\n\n## KPIの解釈\n- MRR: 月次20%成長がNorth Star\n\n## 気になるキーワード\n- 「辞めたい」「〇〇社」「新機能」`}
                                rows={12}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none bg-slate-50/50"
                            />
                        )}
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
