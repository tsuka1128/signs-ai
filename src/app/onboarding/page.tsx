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

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { Sun, Cloud, CloudRain, Check } from "lucide-react";
import { KPI_UNIT_OPTIONS } from "@/lib/constants";

/** 部署の入力フォーム */
interface DeptInput {
    id?: string; // 既存部署の場合
    name: string;
    headcount: number;
}

/** KPI の入力フォーム */
interface KpiInput {
    id?: string; // 既存KPIの場合
    name: string;
    unit: string;
    target_default: string;
    owner_dept_index: number | null; // 部署のインデックス参照
    sort_order: number;
}

/** フォーム全体の状態 */
interface OnboardingState {
    mode: "create" | "join";
    companyName: string;
    invitationToken: string;
    departments: DeptInput[];
    kpis: KpiInput[];
    semanticContent: string;
    invitedCompany?: {
        name: string;
        departments: any[];
        kpis: any[];
        secondaryAxisName: string;
        axes: any[];
    };
    selectedDeptId?: string;
    selectedKpiIds: string[];
    selectedAxisId?: string;
    websiteUrl?: string;
}

/** KPI 単位の候補 */

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        const fetchUserProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("users")
                .select("department_id, axis_id")
                .eq("id", user.id)
                .single();

            if (profile) {
                console.log("Existing user profile found:", profile);
                setState(prev => ({
                    ...prev,
                    selectedDeptId: profile.department_id || prev.selectedDeptId,
                    selectedAxisId: profile.axis_id || prev.selectedAxisId,
                }));
            }
        };

        fetchUserProfile();
        console.log("Onboarding Page Loaded - Refinement: Sync with existing profile");
    }, []);

    const tokenParam = searchParams.get("token");

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 招待リンク経由かどうかの初期判定
    const initialMode = tokenParam ? "join" : "create";

    const [state, setState] = useState<OnboardingState>({
        mode: initialMode,
        companyName: "",
        invitationToken: tokenParam || "",
        departments: [{ name: "", headcount: 0 }],
        kpis: [{ name: "", unit: "件", target_default: "", owner_dept_index: null, sort_order: 0 }],
        semanticContent: "",
        selectedKpiIds: [],
        websiteUrl: "",
    });

    /** ステップ定義を動的に生成 */
    const steps = useMemo(() => {
        if (state.mode === "join") {
            return [
                { id: 1, label: "参加確認" },
                { id: 2, label: "所属部署" },
                { id: 3, label: state.invitedCompany?.secondaryAxisName || "担当項目" },
            ];
        }
        return [
            { id: 1, label: "企業情報" },
            { id: 2, label: "部署登録" },
            { id: 3, label: "KPI設定" },
            { id: 4, label: "組織方針" },
        ];
    }, [state.mode]);

    // 自動スクロール用の参照
    const deptListEndRef = useRef<HTMLDivElement>(null);
    const kpiListEndRef = useRef<HTMLDivElement>(null);

    // 組織方針ウィザード用の状態
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

    /* 招待情報のフェッチ */
    useEffect(() => {
        const fetchInviteInfo = async () => {
            const token = state.invitationToken;
            if (!token || token.length < 3) return;

            // 特殊なダミートークン「TAION」の処理
            if (token === "TAION") {
                setState(prev => ({
                    ...prev,
                    invitedCompany: {
                        name: "株式会社 TAION (デモ)",
                        departments: [
                            { id: "demo-dept-1", name: "営業部" },
                            { id: "demo-dept-2", name: "マーケティング部" },
                            { id: "demo-dept-3", name: "カスタマーサクセス部" },
                            { id: "demo-dept-4", name: "開発部" },
                            { id: "demo-dept-5", name: "人事総務部" }
                        ],
                        kpis: [
                            { id: "demo-kpi-1", name: "月次売上", unit: "万円" },
                            { id: "demo-kpi-2", name: "有効リード獲得数", unit: "件" },
                            { id: "demo-kpi-3", name: "商談獲得数", unit: "件" },
                            { id: "demo-kpi-4", name: "顧客解約率 (チャーンレート)", unit: "%" },
                            { id: "demo-kpi-5", name: "新規契約件数", unit: "件" },
                            { id: "demo-kpi-6", name: "平均客単価", unit: "万円" }
                        ],
                        secondaryAxisName: "ブランド / エリア",
                        axes: [
                            { id: "demo-axis-1", name: "東京本店" },
                            { id: "demo-axis-2", name: "大阪支店" },
                            { id: "demo-axis-3", name: "名古屋支店" },
                            { id: "demo-axis-4", name: "福岡支店" },
                            { id: "demo-axis-5", name: "ECサイト" }
                        ]
                    }
                }));
                console.log("TAION demo mode active - UI will sync with DB on completion");
                setError(null);
                return;
            }

            try {
                const { data: invite, error: inviteError } = await supabase
                    .from("invitations")
                    .select("*, companies(name, kpi_secondary_axis_name, departments(id, name), kpi_definitions(id, name), kpi_axes(id, name))")
                    .eq("token", token)
                    .single();

                if (inviteError || !invite) {
                    setError("無効または期限切れの招待リンクです。");
                    return;
                }

                const company = invite.companies;
                console.log("Fetched company info for onboarding:", company);

                setState(prev => ({
                    ...prev,
                    invitedCompany: {
                        name: company.name,
                        departments: company.departments || [],
                        kpis: company.kpi_definitions || [],
                        secondaryAxisName: company.kpi_secondary_axis_name || "担当項目",
                        axes: company.kpi_axes || [],
                    }
                }));
                setError(null);
            } catch (err) {
                console.error("Invite fetch error:", err);
            }
        };

        // 少し入力が落ち着いてからフェッチするように（簡易デバウンス処理的）
        const timer = setTimeout(() => {
            fetchInviteInfo();
        }, 500);

        return () => clearTimeout(timer);
    }, [state.invitationToken]);

    /* ウィザード入力からMarkdownを自動生成 */
    useEffect(() => {
        if (semanticMode === "wizard") {
            let content = "# 組織方針\n\n";
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

            if (content === "# 組織方針\n\n") content = "";
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
        if (step === 1) {
            if (state.mode === "join") return state.invitationToken.trim().length > 0;
            return state.companyName.trim().length > 0;
        }

        if (state.mode === "join") {
            if (step === 2) return !!state.selectedDeptId;
            if (step === 3) return state.invitedCompany && state.invitedCompany.axes.length > 0 ? !!state.selectedAxisId : true;
        } else {
            if (step === 2) return state.departments.every((d) => d.name.trim().length > 0);
            if (step === 3) return state.kpis.every((k) => k.name.trim().length > 0);
        }
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
                { name: "", unit: "件", target_default: "", owner_dept_index: null, sort_order: s.kpis.length },
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

            // ユーザー情報を取得
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインセッションが切れています。再度ログインしてください。");

            const payload: any = {
                invitationToken: state.mode === "join" ? state.invitationToken : undefined,
                selectedDeptId: state.mode === "join" ? state.selectedDeptId : undefined,
                selectedKpiIds: state.mode === "join" ? state.selectedKpiIds : undefined,
                selectedAxisId: state.mode === "join" ? state.selectedAxisId : undefined,
                companyName: state.mode === "create" ? state.companyName : undefined,
                websiteUrl: state.mode === "create" ? state.websiteUrl : undefined,
                departments: state.mode === "create" ? state.departments : undefined,
                kpis: state.mode === "create" ? state.kpis : undefined,
                semanticContent: state.mode === "create" ? (skip ? "" : state.semanticContent) : undefined,
            };

            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const { companyId } = await res.json();

                // DBへの反映（RLSの伝播など）に若干のタイムラグがある場合があるため、
                // 実際にプロフィールに company_id がセットされたことを数回リトライして確認する
                for (let i = 0; i < 5; i++) {
                    const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single();
                    if (profile?.company_id === companyId) break;
                    await new Promise(r => setTimeout(r, 500)); // 0.5秒待機
                }

                setError(null);
                // キャッシュをクリアして最新のセッション情報を取得させる
                router.refresh();
                router.push("/");
            } else {
                const { message, detail } = await res.json();
                const fullError = detail ? `${message} (${detail})` : message;
                throw new Error(fullError || "保存に失敗しました");
            }
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
                    <span className="text-lg font-black text-slate-800 tracking-tight">Signs AI <span className="text-teal-500 text-[10px] ml-1">v1.1</span></span>
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tighter">初期設定</h1>
                <p className="text-sm text-slate-400 font-medium mt-1">あなたの組織に体温を設定します</p>
            </div>

            {/* ステップバー */}
            <div className="flex items-center gap-2 mb-8">
                {steps.map((s, i) => (
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
                        {i < steps.length - 1 && (
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

                {/* Step 1: 企業名 / 招待 */}
                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="space-y-3">
                            <h2 className="text-lg font-black text-slate-800">始め方を選択してください</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => !tokenParam && setState(s => ({ ...s, mode: "create" }))}
                                    disabled={!!tokenParam}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 text-left transition-all",
                                        state.mode === "create"
                                            ? "border-teal-500 bg-teal-50/50"
                                            : "border-slate-100 bg-white hover:border-slate-200",
                                        tokenParam && "opacity-50 cursor-not-allowed grayscale"
                                    )}
                                >
                                    <div className="text-xl mb-1">新規作成</div>
                                    <div className="text-sm font-bold text-slate-700">新しい組織を作成</div>
                                    <div className="text-[10px] text-slate-400 mt-1">会社を新しくセットアップします</div>
                                </button>
                                <button
                                    onClick={() => setState(s => ({ ...s, mode: "join" }))}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 text-left transition-all",
                                        state.mode === "join"
                                            ? "border-teal-500 bg-teal-50/50"
                                            : "border-slate-100 bg-white hover:border-slate-200"
                                    )}
                                >
                                    <div className="text-xl mb-1">参加</div>
                                    <div className="text-sm font-bold text-slate-700">招待を受けて参加</div>
                                    <div className="text-[10px] text-slate-400 mt-1">招待コード・リンクをお持ちの方</div>
                                </button>
                            </div>
                        </div>

                        {state.mode === "create" ? (
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">企業名</label>
                                    <input
                                        id="company-name-input"
                                        type="text"
                                        placeholder="株式会社〇〇"
                                        value={state.companyName}
                                        onChange={(e) => setState((s) => ({ ...s, companyName: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                                    />
                                    <p className="text-[10px] text-slate-400 ml-1">※後から設定画面で変更可能です</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">会社Webサイト（任意）</label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com"
                                        value={state.websiteUrl}
                                        onChange={(e) => setState(s => ({ ...s, websiteUrl: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all bg-white"
                                    />
                                    <p className="text-[10px] text-slate-400 ml-1">AIが事業内容を把握する参考にします</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">招待トークン / コード</label>
                                <input
                                    id="invitation-token-input"
                                    type="text"
                                    placeholder="招待コードを入力"
                                    value={state.invitationToken}
                                    onChange={(e) => setState((s) => ({ ...s, invitationToken: e.target.value }))}
                                    readOnly={!!tokenParam}
                                    className={cn(
                                        "w-full px-4 py-3 rounded-xl border text-slate-800 font-medium text-sm focus:outline-none transition-all",
                                        tokenParam ? "bg-slate-50 border-slate-100 text-slate-400" : "bg-white border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                    )}
                                />
                                {state.invitedCompany && (
                                    <div className="mt-4 p-4 bg-teal-50 rounded-2xl border border-teal-100">
                                        <div className="text-[10px] text-teal-600 font-black uppercase tracking-tighter mb-1">参加先組織</div>
                                        <div className="text-sm font-black text-slate-800">{state.invitedCompany.name}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: 部署登録 / 所属選択 */}
                {step === 2 && (
                    <div className="space-y-4 animate-fadeIn">
                        {state.mode === "create" ? (
                            <>
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
                                            <button
                                                onClick={() => removeDept(i)}
                                                className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-sm"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <div ref={deptListEndRef} />
                                </div>
                                <button
                                    onClick={addDept}
                                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-all bg-slate-50/50 hover:bg-teal-50/30"
                                >
                                    ＋ 部署を追加
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">所属部署を選択してください</h2>
                                    <p className="text-sm text-slate-400">あなたのメインの所属先を選んでください</p>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                                    {state.invitedCompany?.departments.map((dept: any) => (
                                        <button
                                            key={dept.id}
                                            onClick={() => setState(s => ({ ...s, selectedDeptId: dept.id }))}
                                            className={cn(
                                                "p-4 rounded-xl border-2 text-left transition-all font-bold text-sm",
                                                state.selectedDeptId === dept.id
                                                    ? "border-teal-500 bg-teal-50 text-teal-700"
                                                    : "border-slate-100 hover:border-slate-200 text-slate-600 bg-white"
                                            )}
                                        >
                                            {dept.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 3: KPI定義 / 担当設定 */}
                {step === 3 && (
                    <div className="space-y-4 animate-fadeIn">
                        {state.mode === "create" ? (
                            <>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-lg font-black text-slate-800">KPIを設定してください</h2>
                                        <p className="text-sm text-slate-400">追跡したい主要な数字（KPI）を定義します</p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">{state.kpis.length} / 10 個</span>
                                </div>
                                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                                    {state.kpis.map((kpi, i) => (
                                        <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="KPI名（例: 商談数）"
                                                    value={kpi.name}
                                                    onChange={(e) => updateKpi(i, "name", e.target.value)}
                                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                                                />
                                                <button onClick={() => removeKpi(i)} className="text-slate-300 hover:text-red-400">×</button>
                                            </div>
                                            <div className="flex gap-2">
                                                <select
                                                    value={kpi.unit}
                                                    onChange={(e) => updateKpi(i, "unit", e.target.value)}
                                                    className="w-24 px-2 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                                                >
                                                    {KPI_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="月次目標"
                                                    value={kpi.target_default}
                                                    onChange={(e) => updateKpi(i, "target_default", e.target.value)}
                                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={kpiListEndRef} />
                                </div>
                                <button
                                    onClick={addKpi}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:border-teal-300"
                                >
                                    ＋ KPIを追加
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">
                                        担当の{state.invitedCompany?.secondaryAxisName || "項目"}を選択してください
                                    </h2>
                                    <p className="text-sm text-slate-400">あなたが所属する、または担当する単位を選んでください</p>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                                    {state.invitedCompany?.axes && state.invitedCompany.axes.length > 0 ? (
                                        state.invitedCompany.axes.map((axis: any) => (
                                            <button
                                                key={axis.id}
                                                id={`axis-select-${axis.id}`}
                                                onClick={() => setState(s => ({ ...s, selectedAxisId: axis.id }))}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 text-left transition-all font-bold text-sm flex justify-between items-center group",
                                                    state.selectedAxisId === axis.id
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-100 hover:border-slate-200 text-slate-600 bg-white"
                                                )}
                                            >
                                                <span>{axis.name}</span>
                                                {state.selectedAxisId === axis.id ? (
                                                    <span className="text-emerald-500">✓</span>
                                                ) : (
                                                    <span className="text-slate-200 group-hover:text-slate-300 transition-colors">→</span>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
                                            選択可能な {state.invitedCompany?.secondaryAxisName || "項目"} がありません。<br />そのまま完了して進んでください。
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 4: セマンティックレイヤー */}
                {step === 4 && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-start sm:items-end mb-4 gap-4">
                            <div className="flex-1">
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    組織方針を入力してください
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
                                        placeholder="例: プロダクトの市場価値を最大化し、高収益な組織を目指す。"
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
                                        placeholder="例: 収益基盤の強化期。量より質の高い案件創出を優先。"
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
                                                        placeholder="例: 数値達成の背景にあるプロセスの質を重視して判断。"
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
                                        placeholder="例: 属人化による機会損失。ナレッジ共有による効率化。"
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
                                        placeholder="例: 粗利率, 競合, LTV, 営業利益, 解約率"
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
                                placeholder={`# 組織方針 v1.0\n\n## 目指す組織\n- お客様に真の価値を提供する\n\n## 今のフェーズ\n- フェーズ: 垂直立ち上げ\n\n## KPIの解釈\n- MRR: 月次20%成長がNorth Star\n\n## 気になるキーワード\n- 「辞めたい」「〇〇社」「新機能」`}
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
                                if (step < steps.length) setStep((s) => s + 1);
                                else handleSubmit(false);
                            }}
                            disabled={!canProceed() || submitting}
                            className="px-8 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white text-sm font-bold shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {submitting
                                ? "処理中..."
                                : step < steps.length
                                    ? "次へ →"
                                    : "完了して開始"}
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

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}
