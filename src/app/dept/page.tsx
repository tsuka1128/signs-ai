"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { AnonymityGate } from "@/components/ui/AnonymityGate";
import {
    passesAnonymityGuard,
    ANONYMITY_HIDDEN_REASON,
} from "@/lib/utils/anonymity";
import { createClient } from "@/lib/supabase";
import { DeptAiSummary, DeptActionPlan } from "@/types/database";
import { resolveMonthlyHeadcounts } from "@/lib/headcount";

import {
    Building2,
    Info,
    ChevronRight,
    ClipboardList,
    Inbox,
    Lock,
    Bookmark,
    AlertTriangle,
    Check,
    X,
    Plus,
    Trash2,
    Sparkles,
    Rocket,
    RefreshCcw,
    TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { FeedbackItem } from "@/components/dashboard/FeedbackItem";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";

interface DeptMonthlyScore {
    month: string;     // YYYY-MM
    label: string;
    avg: number | null;
    respondentCount: number;
    headcount: number;
}

interface QuestionScore {
    questionId: string;
    text: string;
    avg: number | null;
}

const THEME_MAPPING: Record<string, string[]> = {
    "意思決定・実行": ["speed", "friction"],
    "方向づけ": ["clarity", "readiness", "transparency"],
    "関係性・安全": ["safety", "feedback"],
    "意欲・成長": ["engagement", "challenge", "impact"],
    "働きやすさ": ["workload"]
};

// "YYYY-MM"（または "YYYY-MM-01"）→ "YYYY年M月"
const formatYM = (ym?: string | null): string => {
    if (!ym) return "";
    const [y, m] = ym.split("-");
    if (!y || !m) return ym;
    return `${y}年${parseInt(m, 10)}月`;
};

export default function DeptDashboardPage() {
    const supabase = createClient();
    const router = useRouter();

    const [roleLoading, setRoleLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userRole, setUserRole] = useState<string>("player");
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [departmentId, setDepartmentId] = useState<string | null>(null);
    const [departmentName, setDepartmentName] = useState<string>("");

    const [deptScores, setDeptScores] = useState<DeptMonthlyScore[]>([]);
    const [questionScores, setQuestionScores] = useState<QuestionScore[]>([]);

    const [userId, setUserId] = useState<string | null>(null);
    const [note, setNote] = useState<string>("");
    const [savingNote, setSavingNote] = useState<boolean>(false);
    const [currentFocus, setCurrentFocus] = useState<any>(null);
    const [pastFocus, setPastFocus] = useState<any[]>([]);
    const [aiSummary, setAiSummary] = useState<DeptAiSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

    // アクションプラン管理用 State
    const [actionPlans, setActionPlans] = useState<DeptActionPlan[]>([]);
    const [newTitle, setNewTitle] = useState<string>("");
    const [newDescription, setNewDescription] = useState<string>("");
    const [isAddingAction, setIsAddingAction] = useState<boolean>(false);
    const [actionSaving, setActionSaving] = useState<boolean>(false);

    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
    const [deptLoading, setDeptLoading] = useState<boolean>(false);
    const [deptFeedback, setDeptFeedback] = useState<any[]>([]);
    // 経営層から委譲されたアクション（accepted/kept）
    const [execActions, setExecActions] = useState<any[]>([]);
    // 部署で判断済みのアクション履歴（completed/rejected/kept-archived）
    const [execActionHistory, setExecActionHistory] = useState<any[]>([]);
    const [showExecHistory, setShowExecHistory] = useState(false);
    const [showResponseTrend, setShowResponseTrend] = useState(false);
    // calendarYM: 書き込み用の当月。latestDataYM はローカル変数として fetchDeptData 内で使用
    const [calendarMonthYM, setCalendarMonthYM] = useState<string | null>(null);

    // 案A: 部署プロフィールレーダー用 State
    const [radarData, setRadarData] = useState<any[]>([]);
    const [dept3mResponsesCount, setDept3mResponsesCount] = useState<number>(0);
    const [company3mResponsesCount, setCompany3mResponsesCount] = useState<number>(0);

    // 全社データ取得重複防止のためのキャッシュ
    const companyDataCache = useRef<Record<string, { companyResponses: any[], companyAnswers: any[] }>>({});

    useEffect(() => {
        checkRoleAndInit();
    }, []);

    useEffect(() => {
        if (selectedDepartmentId && companyId) {
            fetchDeptData(selectedDepartmentId);
        }
    }, [selectedDepartmentId, companyId]);

    const checkRoleAndInit = async () => {
        try {
            setRoleLoading(true);
            setLoading(true);

            // 認証確認
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // ユーザー情報およびロール・所属部署の確認
            const { data: profile } = await supabase
                .from('users')
                .select('company_id, department_id, role, departments(name)')
                .eq('id', user.id)
                .single();

            if (!profile) {
                setError("ユーザープロファイルを取得できませんでした");
                setRoleLoading(false);
                setLoading(false);
                return;
            }

            // ロール制御: player はアクセス不可、強制リダイレクト
            if (profile.role === "player") {
                toast.error("このページへのアクセス権限がありません");
                router.push("/");
                return;
            }

            setUserRole(profile.role);
            setRoleLoading(false); // ロール確認完了

            if (!profile.company_id) {
                setError("会社情報が設定されていません");
                setLoading(false);
                return;
            }

            setCompanyId(profile.company_id);
            setDepartmentId(profile.department_id);
            setDepartmentName((profile as any).departments?.name || "");
            setUserId(user.id);

            // 部署リスト取得（上位ロールのみ）
            let initialDeptId: string | null = profile.department_id;
            if (profile.role === "admin" || profile.role === "executive" || profile.role === "super_admin") {
                const { data: depts, error: deptsErr } = await supabase
                    .from('departments')
                    .select('id, name')
                    .eq('company_id', profile.company_id)
                    .order('sort_order', { ascending: true });

                if (deptsErr) throw deptsErr;

                const deptList = depts || [];
                setDepartments(deptList);

                // 初期部署：自部署があればそれ、なければリストの最初の部署
                if (!initialDeptId && deptList.length > 0) {
                    initialDeptId = deptList[0].id;
                }
            }

            setSelectedDepartmentId(initialDeptId);

            // 部署IDが確定していない場合（部署未所属かつ会社に部署が1つもない）は初期ロード完了
            if (!initialDeptId) {
                setLoading(false);
            }

        } catch (e: any) {
            setError(e?.message || "初期化に失敗しました");
            toast.error(e?.message || "初期化に失敗しました");
            setLoading(false);
        }
    };

    const fetchDeptData = async (deptId: string) => {
        if (!companyId) return;
        try {
            setDeptLoading(true);

            // ── 過去6ヶ月の月リスト生成 ──
            const now = new Date();
            const months: { ym: string; label: string }[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months.push({
                    ym,
                    label: `${d.getMonth() + 1}月`,
                });
            }

            const targetYMs = months.map(m => m.ym);

            // 部署の月次実績人数を取得（過去6ヶ月分を一括解決）
            const monthlyHeadcounts = await resolveMonthlyHeadcounts(supabase, deptId, targetYMs);

            // 1. survey_responses 取得
            const { data: responses, error: responseErr } = await supabase
                .from('survey_responses')
                .select('id, recorded_month, fingerprint')
                .eq('company_id', companyId)
                .eq('department_id', deptId)
                .in('recorded_month', targetYMs);

            if (responseErr) throw responseErr;

            const responsesByMonth: Record<string, string[]> = {};
            (responses || []).forEach(r => {
                if (!responsesByMonth[r.recorded_month]) responsesByMonth[r.recorded_month] = [];
                responsesByMonth[r.recorded_month].push(r.id);
            });

            // 2. survey_answers 取得
            const allResponseIds = (responses || []).map(r => r.id);
            const { data: answers, error: answerErr } = allResponseIds.length > 0
                ? await supabase
                    .from('survey_answers')
                    .select('response_id, question_id, score')
                    .in('response_id', allResponseIds)
                : { data: [], error: null };

            if (answerErr) throw answerErr;

            const answerByResponse: Record<string, { questionId: string; score: number }[]> = {};
            (answers || []).forEach(a => {
                if (!a.response_id || !a.question_id) return;
                if (!answerByResponse[a.response_id]) answerByResponse[a.response_id] = [];
                answerByResponse[a.response_id].push({
                    questionId: a.question_id,
                    score: a.score,
                });
            });

            // 3. 過去6ヶ月分の月別総合スコア集計
            const scored: DeptMonthlyScore[] = months.map(m => {
                const ids = responsesByMonth[m.ym] || [];
                const respondentCount = ids.length;
                const headcount = monthlyHeadcounts[m.ym] || 0;
                const allScores: number[] = [];
                ids.forEach(rid => {
                    (answerByResponse[rid] || []).forEach(ans => allScores.push(ans.score));
                });
                const avg = allScores.length > 0
                    ? Number((allScores.reduce((s, v) => s + v, 0) / allScores.length).toFixed(2))
                    : null;
                return {
                    month: m.ym,
                    label: m.label,
                    avg,
                    respondentCount,
                    headcount,
                };
            });

            setDeptScores(scored);

            // 5. 設問一覧の取得（標準11問＋会社独自問を取得）
            const { data: questions, error: questionErr } = await supabase
                .from('survey_questions')
                .select('id, text, category, sort_order')
                .or(`company_id.is.null,company_id.eq.${companyId}`)
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (questionErr) throw questionErr;

            // 6. 設問別平均スコア集計
            // calendarYM: 当月（メモ・アクションプラン等の書き込み先）
            // latestDataYM: 回答が1件以上ある最新月（スコア・AI要約の表示用）
            const calendarYM = months[months.length - 1].ym;
            setCalendarMonthYM(calendarYM); // メモ・アクションプランの書き込み先として保持
            const latestDataYM = [...months]
                .reverse()
                .find(m => (responsesByMonth[m.ym] || []).length > 0)?.ym ?? calendarYM;
            const currentYM = latestDataYM; // 表示系はlatestDataYMを使用

            const currentResponseIds = responsesByMonth[currentYM] || [];

            const qScores: QuestionScore[] = (questions || []).map(q => {
                const scoresForQ: number[] = [];
                currentResponseIds.forEach(rid => {
                    const ansList = answerByResponse[rid] || [];
                    ansList.forEach(ans => {
                        if (ans.questionId === q.id) {
                            scoresForQ.push(ans.score);
                        }
                    });
                });
                const avg = scoresForQ.length > 0
                    ? Number((scoresForQ.reduce((s, v) => s + v, 0) / scoresForQ.length).toFixed(2))
                    : null;
                return {
                    questionId: q.id,
                    text: q.text,
                    avg,
                };
            });
            qScores.sort((a, b) => {
                if (a.avg === null && b.avg === null) return 0;
                if (a.avg === null) return 1;   // null は末尾
                if (b.avg === null) return -1;
                return a.avg - b.avg;           // 低スコア順
            });
            setQuestionScores(qScores);

            // 7. 案A：部署プロフィールレーダー用 3ヶ月トレーリングデータ集計
            // 部署の3ヶ月窓（latestDataYM 基準）
            const latestIdx = targetYMs.indexOf(latestDataYM);
            const deptTrailingMonths = latestIdx !== -1
                ? targetYMs.slice(Math.max(0, latestIdx - 2), latestIdx + 1)
                : targetYMs.slice(-3);

            // 全社も同じ3ヶ月窓（latestDataYM 基準）に統一し、期間の不整合を防ぐ
            const companyTrailingMonths = deptTrailingMonths;

            // 全社回答データのキャッシュ付きフェッチ
            const cacheKey = `${companyId}-${companyTrailingMonths.join(',')}`;
            let companyResponses = [];
            let companyAnswers = [];

            if (companyDataCache.current[cacheKey]) {
                companyResponses = companyDataCache.current[cacheKey].companyResponses;
                companyAnswers = companyDataCache.current[cacheKey].companyAnswers;
            } else {
                const { data: compRes, error: compResErr } = await supabase
                    .from('survey_responses')
                    .select('id, recorded_month, fingerprint')
                    .eq('company_id', companyId)
                    .in('recorded_month', companyTrailingMonths);

                if (compResErr) throw compResErr;

                const compResIds = (compRes || []).map(r => r.id);
                const { data: compAns, error: compAnsErr } = compResIds.length > 0
                    ? await supabase
                        .from('survey_answers')
                        .select('response_id, question_id, score')
                        .in('response_id', compResIds)
                    : { data: [], error: null };

                if (compAnsErr) throw compAnsErr;

                companyResponses = compRes || [];
                companyAnswers = compAns || [];
                companyDataCache.current[cacheKey] = { companyResponses, companyAnswers };
            }

            // 会社回答のマッピング
            const companyAnswerByResponse: Record<string, { questionId: string; score: number }[]> = {};
            (companyAnswers || []).forEach(a => {
                if (!a.response_id || !a.question_id) return;
                if (!companyAnswerByResponse[a.response_id]) companyAnswerByResponse[a.response_id] = [];
                companyAnswerByResponse[a.response_id].push({
                    questionId: a.question_id,
                    score: a.score,
                });
            });

            // 部署の3ヶ月回答者数の算出（fingerprint による個人の重複排除）
            const dept3mResponses = (responses || []).filter(r => deptTrailingMonths.includes(r.recorded_month)) || [];
            const uniqueDeptUserIds = new Set(dept3mResponses.map(r => r.fingerprint || r.id).filter(Boolean));
            const dept3mCount = uniqueDeptUserIds.size;
            setDept3mResponsesCount(dept3mCount);

            const deptUniqueAnswers: Array<{ response_id: string; question_id: string; score: number }> = [];
            dept3mResponses.forEach(r => {
                const seenQuestionIds = new Set<string>();
                const ansList = answerByResponse[r.id] || [];
                ansList.forEach(ans => {
                    if (!seenQuestionIds.has(ans.questionId)) {
                        seenQuestionIds.add(ans.questionId);
                        deptUniqueAnswers.push({
                            response_id: r.id,
                            question_id: ans.questionId,
                            score: ans.score
                        });
                    }
                });
            });

            // 全社の3ヶ月回答者数の算出（fingerprint による個人の重複排除）
            const company3mResponses = (companyResponses || []).filter(r => companyTrailingMonths.includes(r.recorded_month)) || [];
            const uniqueCompanyUserIds = new Set(company3mResponses.map(r => r.fingerprint || r.id).filter(Boolean));
            const company3mCount = uniqueCompanyUserIds.size;
            setCompany3mResponsesCount(company3mCount);

            const companyUniqueAnswers: Array<{ response_id: string; question_id: string; score: number }> = [];
            company3mResponses.forEach(r => {
                const seenQuestionIds = new Set<string>();
                const ansList = companyAnswerByResponse[r.id] || [];
                ansList.forEach(ans => {
                    if (!seenQuestionIds.has(ans.questionId)) {
                        seenQuestionIds.add(ans.questionId);
                        companyUniqueAnswers.push({
                            response_id: r.id,
                            question_id: ans.questionId,
                            score: ans.score
                        });
                    }
                });
            });

            // questions.find() を O(1) にするための Map
            const questionMap = new Map((questions || []).map(q => [q.id, q]));

            // 部署カテゴリ平均
            const deptCategoryScores: Record<string, number[]> = {};
            deptUniqueAnswers.forEach(ans => {
                const q = questionMap.get(ans.question_id);
                if (q && q.category) {
                    if (!deptCategoryScores[q.category]) {
                        deptCategoryScores[q.category] = [];
                    }
                    deptCategoryScores[q.category].push(ans.score);
                }
            });
            const deptCategoryAvgs: Record<string, number> = {};
            Object.keys(deptCategoryScores).forEach(cat => {
                const scores = deptCategoryScores[cat];
                deptCategoryAvgs[cat] = scores.reduce((sum, v) => sum + v, 0) / scores.length;
            });

            // 全社カテゴリ平均
            const companyCategoryScores: Record<string, number[]> = {};
            companyUniqueAnswers.forEach(ans => {
                const q = questionMap.get(ans.question_id);
                if (q && q.category) {
                    if (!companyCategoryScores[q.category]) {
                        companyCategoryScores[q.category] = [];
                    }
                    companyCategoryScores[q.category].push(ans.score);
                }
            });
            const companyCategoryAvgs: Record<string, number> = {};
            Object.keys(companyCategoryScores).forEach(cat => {
                const scores = companyCategoryScores[cat];
                companyCategoryAvgs[cat] = scores.reduce((sum, v) => sum + v, 0) / scores.length;
            });

            // 5テーマ別集約（データ欠損時は null）
            const calculatedRadarData = Object.keys(THEME_MAPPING).map(themeName => {
                const cats = THEME_MAPPING[themeName];

                // 部署スコア
                const deptScoresForTheme = cats
                    .map(cat => deptCategoryAvgs[cat])
                    .filter(val => val !== undefined && val !== null);
                const deptScore = deptScoresForTheme.length > 0
                    ? Number((deptScoresForTheme.reduce((sum, v) => sum + v, 0) / deptScoresForTheme.length).toFixed(2))
                    : null; // nullに変更（誤読防止）

                // 全社スコア
                const companyScoresForTheme = cats
                    .map(cat => companyCategoryAvgs[cat])
                    .filter(val => val !== undefined && val !== null);
                const companyScore = companyScoresForTheme.length > 0
                    ? Number((companyScoresForTheme.reduce((sum, v) => sum + v, 0) / companyScoresForTheme.length).toFixed(2))
                    : null; // nullに変更

                return {
                    subject: themeName,
                    dept: deptScore,
                    company: companyScore
                };
            });

            setRadarData(calculatedRadarData);

            // ── 経営方針インボックス用データ取得 ──
            const { data: focusList, error: focusErr } = await supabase
                .from('executive_monthly_focus')
                .select('id, month, title, content')
                .eq('company_id', companyId)
                .order('month', { ascending: false })
                .limit(7);

            if (focusErr) throw focusErr;

            // 経営方針は「当月（calendarYM）」で探す。latestDataYM（最新回答月）と混同しないこと
            const curFocus = focusList?.find(f => f.month === calendarYM) || null;
            const pstFocus = (focusList || []).filter(f => f.month !== calendarYM).slice(0, 6);
            setCurrentFocus(curFocus);
            setPastFocus(pstFocus);

            // 2. 自分のメモ（当月分、本人のみ取得可能）— calendarYM で取得
            if (userId) {
                const { data: noteData, error: noteErr } = await supabase
                    .from('manager_directive_notes')
                    .select('note, focus_id')
                    .eq('manager_user_id', userId)
                    .eq('month', calendarYM)
                    .maybeSingle();

                if (noteErr) throw noteErr;
                setNote(noteData?.note || '');
            } else {
                setNote('');
            }

            // ── ボイスチェックAI要約キャッシュ取得 ──
            const { data: summaryData } = await supabase
                .from('dept_ai_summaries')
                .select('*')
                .eq('department_id', deptId)
                .eq('month', currentYM)
                .maybeSingle();
            setAiSummary(summaryData || null);

            // ── アクションプラン取得（当月 calendarYM、proposed含む全ステータス、dismissed以外） ──
            const { data: actionPlansData, error: actionPlanErr } = await supabase
                .from('dept_action_plans')
                .select('*')
                .eq('department_id', deptId)
                .eq('month', calendarYM)
                .neq('status', 'dismissed')
                .order('created_at', { ascending: true });

            if (actionPlanErr) throw actionPlanErr;
            setActionPlans(actionPlansData || []);

            // ── 経営層から委譲されたアクション（accepted/kept かつ未アーカイブ）──
            const { data: execActionsData } = await supabase
                .from('action_items')
                .select('*')
                .eq('company_id', companyId)
                .eq('department_id', deptId)
                .in('status', ['accepted', 'kept'])
                .eq('is_archived', false)
                .order('created_at', { ascending: false });
            setExecActions(execActionsData || []);

            // ── 部署の判断済みアクション履歴（completed/rejected のみ。keptはアクティブに残すため除外）──
            const { data: execHistoryData } = await supabase
                .from('action_items')
                .select('*')
                .eq('company_id', companyId)
                .eq('department_id', deptId)
                .in('status', ['completed', 'rejected'])
                .order('updated_at', { ascending: false })
                .limit(30);
            setExecActionHistory(execHistoryData || []);

            // ── 最新 AI 分析から「組織として話したいこと」（部署間フィードバック）を取得 ──
            const { data: latestInsight } = await supabase
                .from('ai_insights')
                .select('content')
                .eq('company_id', companyId)
                .eq('insight_type', 'full_report')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            const feedback = (latestInsight?.content as any)?.department_feedback;
            setDeptFeedback(Array.isArray(feedback) ? feedback : []);

        } catch (e: any) {
            setError(e?.message || "データの取得に失敗しました");
            toast.error(e?.message || "データの取得に失敗しました");
        } finally {
            setDeptLoading(false);
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!userId || !companyId || !departmentId) {
            toast.error("ユーザー情報または部署情報が不足しているため保存できません");
            return;
        }
        try {
            setSavingNote(true);
            const noteYM = calendarMonthYM ?? deptScores[deptScores.length - 1]?.month;
            if (!noteYM) {
                toast.error("現在の月情報を取得できませんでした");
                return;
            }

            const { error: upsertErr } = await supabase
                .from('manager_directive_notes')
                .upsert({
                    company_id: companyId,
                    department_id: departmentId,
                    manager_user_id: userId,
                    month: noteYM,
                    focus_id: currentFocus?.id ?? null,
                    note: note,
                }, {
                    onConflict: 'manager_user_id,month'
                });

            if (upsertErr) throw upsertErr;
            toast.success("メモを保存しました");
        } catch (e: any) {
            toast.error(e?.message || "メモの保存に失敗しました");
        } finally {
            setSavingNote(false);
        }
    };

    const handleGenerateSummary = async (force: boolean = false) => {
        if (!selectedDepartmentId) return;
        // AI要約は「回答がある最新月」で生成（暦の当月が未回答でも、直近で回答のある月を使う）
        const summaryYM = [...deptScores].reverse().find(s => s.respondentCount > 0)?.month
            ?? deptScores[deptScores.length - 1]?.month;
        if (!summaryYM) {
            toast.error("現在の月情報を取得できませんでした");
            return;
        }

        setSummaryLoading(true);
        try {
            const res = await fetch('/api/ai/dept-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    department_id: selectedDepartmentId,
                    month: summaryYM,
                    force, // true のときキャッシュを無視して作り直す（回答が増えた後の更新用）
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                if (err.error === 'INSUFFICIENT_RESPONSES') {
                    toast.error('回答数が3名未満のため要約を生成できません');
                } else {
                    toast.error(err.error || 'AI要約の生成に失敗しました');
                }
                return;
            }
            const data = await res.json();
            setAiSummary(data);
            toast.success(force ? 'AI要約を再生成しました' : 'AI要約を生成しました');

            // AI要約生成成功後、続けてアクション提案も生成（失敗しても無視）
            try {
                await fetch('/api/ai/dept-action-proposals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ department_id: selectedDepartmentId, month: summaryYM }),
                });
            } catch (proposalErr) {
                // サイレントフェイル（提案生成の失敗は要約生成の成否に影響しない）
                console.error("AI提案の自動生成に失敗しました（無視します）:", proposalErr);
            }

            // UI更新
            fetchDeptData(selectedDepartmentId);
        } catch (e: any) {
            toast.error('AI要約の生成に失敗しました');
        } finally {
            setSummaryLoading(false);
        }
    };

    /**
     * マネージャーが経営層委譲アクションを判断する（完了/キープ/不採用）
     * - completed / rejected: アーカイブして履歴へ移動
     * - kept: アクティブリストに残したままステータスのみ更新（履歴には載せない）
     */
    const handleExecActionDecision = async (
        actionId: string,
        decision: 'completed' | 'kept' | 'rejected'
    ) => {
        const shouldArchive = decision === 'completed' || decision === 'rejected';
        const now = new Date().toISOString();
        const target = execActions.find(a => a.id === actionId);
        const prevExecActions = execActions;

        // 楽観的UI更新
        if (shouldArchive) {
            // 完了・不採用 → 履歴へ移動
            setExecActions(prev => prev.filter(a => a.id !== actionId));
            if (target) {
                setExecActionHistory(prev => [
                    { ...target, status: decision, is_archived: true, archived_at: now, updated_at: now },
                    ...prev
                ]);
            }
        } else {
            // キープ → アクティブに残してステータスだけ更新
            setExecActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'kept', updated_at: now } : a));
        }

        const res = await fetch('/api/actions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: actionId,
                updates: {
                    status: decision,
                    is_archived: shouldArchive,
                    archived_at: shouldArchive ? now : null
                }
            })
        });

        if (!res.ok) {
            toast.error('判断の保存に失敗しました');
            // ロールバック
            setExecActions(prevExecActions);
            if (shouldArchive) {
                setExecActionHistory(prev => prev.filter(a => a.id !== actionId));
            }
        } else {
            const labelMap = { completed: '完了', kept: 'キープ', rejected: '不採用' };
            toast.success(`「${target?.title}」を${labelMap[decision]}にしました`);
        }
    };

    /**
     * 部署判断済みのアクションを「実行中」に復活させる（履歴 → アクティブ）
     */
    const handleReviveExecAction = async (actionId: string) => {
        const now = new Date().toISOString();
        const target = execActionHistory.find(a => a.id === actionId);
        const prevHistory = execActionHistory;

        // 楽観的UI更新
        setExecActionHistory(prev => prev.filter(a => a.id !== actionId));
        if (target) {
            setExecActions(prev => [
                { ...target, status: 'accepted', is_archived: false, archived_at: null, updated_at: now },
                ...prev
            ]);
        }

        const res = await fetch('/api/actions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: actionId,
                updates: { status: 'accepted', is_archived: false, archived_at: null }
            })
        });

        if (!res.ok) {
            toast.error('復活に失敗しました');
            // ロールバック
            setExecActionHistory(prevHistory);
            setExecActions(prev => prev.filter(a => a.id !== actionId));
        } else {
            toast.success(`「${target?.title}」を実行中に戻しました`);
        }
    };

    const handleAddAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) {
            toast.error("タイトルを入力してください");
            return;
        }
        if (!userId || !companyId || !selectedDepartmentId) {
            toast.error("ユーザー情報または部署情報が不足しています");
            return;
        }

        const currentYM = deptScores[deptScores.length - 1]?.month;
        if (!currentYM) {
            toast.error("現在の月情報を取得できませんでした");
            return;
        }

        try {
            setActionSaving(true);
            const { error: insertErr } = await supabase
                .from('dept_action_plans')
                .insert({
                    company_id: companyId,
                    department_id: selectedDepartmentId,
                    manager_user_id: userId,
                    month: currentYM,
                    title: newTitle.trim(),
                    description: newDescription.trim() || null,
                    source: 'manual',
                    status: 'accepted',
                });

            if (insertErr) throw insertErr;

            toast.success("アクションを追加しました");
            setNewTitle("");
            setNewDescription("");
            setIsAddingAction(false);
            
            // UIデータ再取得
            fetchDeptData(selectedDepartmentId);
        } catch (e: any) {
            toast.error(e?.message || "アクションの追加に失敗しました");
        } finally {
            setActionSaving(false);
        }
    };

    const handleUpdateStatus = async (planId: string, nextStatus: 'proposed' | 'accepted' | 'in_progress' | 'done' | 'dismissed') => {
        if (!userId || !selectedDepartmentId) return;

        try {
            const updateData: any = {
                status: nextStatus,
                updated_at: new Date().toISOString()
            };

            // 採用する（accepted）または却下（dismissed）の場合、manager_user_id を本人のIDに更新する
            if (nextStatus === 'accepted' || nextStatus === 'dismissed') {
                updateData.manager_user_id = userId;
            }

            const { error: updateErr } = await supabase
                .from('dept_action_plans')
                .update(updateData)
                .eq('id', planId);

            if (updateErr) throw updateErr;

            if (nextStatus === 'accepted') {
                toast.success("提案アクションを採用しました");
            } else if (nextStatus === 'dismissed') {
                toast.success("提案を却下しました");
            } else {
                toast.success("ステータスを更新しました");
            }

            // UIデータ再取得
            fetchDeptData(selectedDepartmentId);
        } catch (e: any) {
            toast.error(e?.message || "更新に失敗しました");
        }
    };

    const handleDeleteAction = async (planId: string) => {
        if (!selectedDepartmentId) return;
        if (!window.confirm("このアクションプランを削除しますか？")) return;

        try {
            const { error: deleteErr } = await supabase
                .from('dept_action_plans')
                .delete()
                .eq('id', planId);

            if (deleteErr) throw deleteErr;

            toast.success("アクションプランを削除しました");
            // UIデータ再取得
            fetchDeptData(selectedDepartmentId);
        } catch (e: any) {
            toast.error(e?.message || "削除に失敗しました");
        }
    };

    // ロール判定中は Loading コンポーネントを即座に返し、コンテンツの露出を防ぐ
    if (roleLoading) {
        return <Loading fullScreen message="アクセス権限を確認しています..." />;
    }

    // player はリダイレクトが発火するためコンテンツは描画しない
    if (userRole === "player") {
        return null;
    }

    if (loading) {
        return <Loading fullScreen message="部署のデータを読み込んでいます..." />;
    }

    // 匿名ガード・AI要約表示の判定に使用。当月が未回答でも、回答がある最新月のスコアを採用する
    const currentMonthScore = [...deptScores].reverse().find(s => s.respondentCount > 0) ?? deptScores[deptScores.length - 1];

    // AI要約の対象月ラベル（回答がある最新月 / なければキャッシュ済み要約の月）
    const summaryTargetLabel = formatYM(
        ([...deptScores].reverse().find(s => s.respondentCount > 0)?.month) ?? aiSummary?.month
    );

    // 対象月のボイスチェックがまだ全員分揃っていない（途中集計）か
    const isPartialSummaryMonth = !!currentMonthScore
        && currentMonthScore.headcount > 0
        && currentMonthScore.respondentCount < currentMonthScore.headcount;


    // 要注意シグナルの判定
    type Signal = {
        level: 'critical' | 'warning';
        message: string;
    };

    const signals: Signal[] = [];

    // ① スコア急降下（前月比 -0.5 以上）
    const currentAvg = currentMonthScore?.avg ?? null;
    const prevMonthScore = deptScores[deptScores.length - 2] ?? null;
    const prevAvg = prevMonthScore?.avg ?? null;

    if (
        currentAvg !== null &&
        prevAvg !== null &&
        passesAnonymityGuard(currentMonthScore!.respondentCount) &&
        passesAnonymityGuard(prevMonthScore!.respondentCount)
    ) {
        const diff = currentAvg - prevAvg;
        if (diff <= -0.5) {
            signals.push({
                level: 'critical',
                message: `今月のスコアが先月より ${Math.abs(diff).toFixed(2)} ポイント低下しています（${prevAvg.toFixed(2)} → ${currentAvg.toFixed(2)}）`,
            });
        }
    }

    // ③ 低スコア設問あり（3.0 未満かつ匿名ガード通過済みの月）
    if (currentMonthScore && passesAnonymityGuard(currentMonthScore.respondentCount)) {
        const lowQuestions = questionScores.filter(q => q.avg !== null && q.avg < 3.0);
        if (lowQuestions.length > 0) {
            signals.push({
                level: 'warning',
                message: `${lowQuestions.length} つの設問でスコアが 3.0 を下回っています`,
            });
        }
    }

    // 選択中の部署名（フォールバックとしてprofileから取得したdepartmentNameを使用）
    const selectedDeptName = departments.find(d => d.id === selectedDepartmentId)?.name || departmentName;

    // 「組織として話したいこと」は選択中の部署が関係するフィードバックのみ表示する
    const relevantFeedback = deptFeedback.filter((f: any) =>
        f.from_dept === selectedDeptName || f.to_dept === selectedDeptName
    );

    return (
        <AppLayout>
            <main className="max-w-[1100px] mx-auto px-4 py-8 space-y-8">
                {/* ヘッダー */}
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3 mb-2">
                        <Building2 className="w-7 h-7 text-teal" />
                        部署マネジメント
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {userRole === 'manager'
                            ? "自部署の状況を理解し、次の一歩を考えるためのワークスペースです。"
                            : "各部署の状況を理解し、次の一歩を考えるためのワークスペースです。"
                        }
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold animate-in fade-in">
                        {error}
                    </div>
                )}

                {/* 部署切替セレクタ（上位ロール限定） */}
                {(userRole === 'admin' || userRole === 'executive' || userRole === 'super_admin') && departments.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-teal-50 flex items-center justify-center text-teal">
                                <Building2 className="w-4.5 h-4.5" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-800 tracking-tight">部署データを表示</h3>
                                <p className="text-[10px] text-slate-400 font-bold">分析対象の部署を切り替えることができます</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-black text-slate-500">部署を選択:</label>
                            <select
                                value={selectedDepartmentId || ''}
                                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                                className="text-xs font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all cursor-pointer min-w-[160px]"
                            >
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {!selectedDepartmentId ? (
                    <EmptyState
                        title={
                            userRole === "manager"
                                ? "部署に所属していません"
                                : "会社にまだ部署が登録されていません"
                        }
                        description={
                            userRole === "manager"
                                ? "部署マネジメントは、部署に所属しているマネージャー・管理者に向けた機能です。"
                                : "部署マネジメントで分析対象となる部署が登録されていません。管理者設定より部署を登録してください。"
                        }
                        icon={<Building2 className="w-12 h-12 text-slate-200" />}
                    />
                ) : (
                    <div className="space-y-8 animate-in fade-in relative">
                        {deptLoading && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-3xl animate-in fade-in duration-200" style={{ minHeight: '400px' }}>
                                <div className="bg-white border border-slate-100 shadow-xl rounded-2xl px-6 py-4 flex items-center gap-3 animate-bounce">
                                    <div className="w-2.5 h-2.5 rounded-full bg-teal animate-ping" />
                                    <span className="text-xs font-black text-slate-700">部署データを読み込み中...</span>
                                </div>
                            </div>
                        )}

                        {/* 🚨 要注意シグナル（あれば表示） */}
                        {signals.length > 0 && (
                            <div className="space-y-2">
                                {signals.map((signal, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-3 px-5 py-4 rounded-2xl border text-sm font-bold ${
                                            signal.level === 'critical'
                                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                : 'bg-amber-50 border-amber-200 text-amber-700'
                                        }`}
                                    >
                                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                                            signal.level === 'critical' ? 'text-rose-500' : 'text-amber-500'
                                        }`} />
                                        <span>{signal.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 今月のボイスチェック回答状況バナー（機能②）：クリックで推移グラフを開閉 */}
                        {currentMonthScore && currentMonthScore.headcount > 0 && (
                            <div className={`rounded-3xl border shadow-sm overflow-hidden ${
                                currentMonthScore.respondentCount >= currentMonthScore.headcount
                                    ? 'bg-teal-50/50 border-teal-100'
                                    : 'bg-indigo-50/50 border-indigo-100'
                            }`}>
                                {/* ヘッダー行：クリックで開閉 */}
                                <button
                                    onClick={() => setShowResponseTrend(v => !v)}
                                    className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:opacity-80 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                                            currentMonthScore.respondentCount >= currentMonthScore.headcount
                                                ? 'bg-teal-100/50 text-teal'
                                                : 'bg-indigo-100/50 text-indigo-500'
                                        }`}>
                                            <Check className="w-4.5 h-4.5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black tracking-tight text-slate-500 uppercase">今月のボイスチェック回答状況</h3>
                                            <p className="text-sm font-black mt-1">
                                                {currentMonthScore.respondentCount >= currentMonthScore.headcount ? (
                                                    <span className="text-teal-700">✅ 今月は全員回答済み（{currentMonthScore.respondentCount} / {currentMonthScore.headcount} 名）</span>
                                                ) : (
                                                    <span className="text-indigo-900">回答数：<strong>{currentMonthScore.respondentCount} / {currentMonthScore.headcount} 名</strong>（{((currentMonthScore.respondentCount / currentMonthScore.headcount) * 100).toFixed(1)}%）</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 shrink-0">
                                        {showResponseTrend ? '推移を隠す ▲' : '推移を見る ▼'}
                                    </span>
                                </button>

                                {/* 📈 推移グラフ：カード内に展開 */}
                                {showResponseTrend && (
                                    <div className="px-6 pb-6 pt-2 border-t border-white/40">
                                        <ResponsiveContainer width="100%" height={180}>
                                            <ComposedChart data={deptScores.map(s => ({
                                                ...s,
                                                rate: s.headcount > 0 ? Math.round((s.respondentCount / s.headcount) * 100) : null,
                                            }))}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                                                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} fontWeight="bold" width={20} />
                                                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} fontWeight="bold" domain={[0, 100]} width={28} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
                                                    formatter={(value: any, name: any, props: any) => {
                                                        if (name === 'respondentCount') return [`${value} 人`, '回答数'];
                                                        if (name === 'rate') {
                                                            const hc = props.payload?.headcount;
                                                            if (hc === 0) return ['—', '回答率'];
                                                            return [`${value} %`, '回答率'];
                                                        }
                                                        return [value, name];
                                                    }}
                                                />
                                                <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} />
                                                <Bar yAxisId="left" dataKey="respondentCount" name="回答数" fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={20} />
                                                <Line yAxisId="right" type="monotone" dataKey="rate" name="回答率" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3, fill: '#14b8a6' }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 📥 経営方針インボックス */}
                        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 animate-in fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                        <Inbox className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-slate-800 tracking-tight">
                                            経営方針インボックス
                                        </h2>
                                        <p className="text-xs text-slate-400 font-bold">
                                            {userRole === 'manager'
                                                ? "自部署での実行プランに落とし込むためのワークスペース"
                                                : "今月の経営方針と各部署への落とし込みを確認できます"
                                            }
                                        </p>
                                    </div>
                                </div>
                                {userRole === 'manager' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 shrink-0 self-start sm:self-auto">
                                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                                        メモは本人のみ閲覧可
                                    </div>
                                )}
                            </div>

                            {/* 経営方針（原文・過去履歴）: 全ロールに表示 */}
                            <div className={userRole === 'manager' ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "space-y-6"}>
                                {/* 左カラム / 上部：経営方針（原文表示） */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <Bookmark className="w-3.5 h-3.5 text-amber-500" /> 今月の経営方針
                                        </h3>
                                        {currentFocus ? (
                                            <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/30 border border-amber-100 rounded-2xl p-6 space-y-3 relative overflow-hidden">
                                                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 bg-amber-500/5 rounded-full blur-xl" />
                                                <h4 className="text-sm font-black text-amber-900 leading-tight">
                                                    {currentFocus.title}
                                                </h4>
                                                <p className="text-xs text-amber-800/90 font-medium leading-relaxed whitespace-pre-wrap">
                                                    {currentFocus.content}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
                                                <p className="text-xs text-slate-400 font-bold">
                                                    経営層からの今月の課題はまだ登録されていません。
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 過去の方針（アコーディオン） */}
                                    {pastFocus.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">過去の方針</h3>
                                            <div className="space-y-2">
                                                {pastFocus.map(pf => (
                                                    <details key={pf.id} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                                                        <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-slate-50 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{pf.month}</span>
                                                                <span className="text-xs font-black text-slate-700 truncate max-w-[200px] sm:max-w-xs">{pf.title}</span>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                                                        </summary>
                                                        <div className="px-4 pb-4 pt-1 border-t border-slate-50 text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap bg-slate-50/50">
                                                            {pf.content}
                                                        </div>
                                                    </details>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 右カラム：マネージャーの落とし込みメモ（manager のみ表示） */}
                                {userRole === 'manager' && (
                                    <div className="flex flex-col justify-between space-y-6">
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                自部署への落とし込みメモ
                                            </h3>
                                            <div className="relative">
                                                <textarea
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    maxLength={2000}
                                                    placeholder="この方針を自部署でどう実行するか、メンバーにどう伝えるか、自由に書き留めてください"
                                                    rows={6}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none leading-relaxed"
                                                />
                                                <span className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-bold">
                                                    {note.length} / 2000
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-[10px] text-slate-400 font-bold leading-normal">
                                                    ※ このメモはあなた本人のみが閲覧できます（メンバー・他マネージャー・経営層には非公開です）
                                                </p>
                                                <button
                                                    onClick={handleSaveNote}
                                                    disabled={savingNote}
                                                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                                                >
                                                    {savingNote ? "保存中..." : "メモを保存"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* 思考のヒント（固定文言） */}
                                        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 relative overflow-hidden">
                                            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                                            <p className="text-xs font-black text-amber-700 mb-2 flex items-center gap-1.5">
                                                💭 考えるヒント
                                            </p>
                                            <ul className="text-xs text-amber-900/90 space-y-1.5 font-bold leading-relaxed">
                                                <li>・この方針は、自部署のどの業務に直結しますか？</li>
                                                <li>・チームの誰の声を聞くと、ヒントが得られそうですか？</li>
                                                <li>・先月のスコアの動きと関連はありますか？</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                

                        {/* ═══ 部署アクションの提案（経営方針インボックスの直後に配置） ═══ */}
                        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        <Rocket className="w-4 h-4 text-teal" />
                                        部署に届いたアクション提案
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        部署での実施を提案しています。状況に合わせて判断してください。
                                    </p>
                                </div>
                                {execActionHistory.length > 0 && (
                                    <button
                                        onClick={() => setShowExecHistory(v => !v)}
                                        className="text-[10px] font-black text-slate-400 hover:text-teal transition-colors flex items-center gap-1"
                                    >
                                        {showExecHistory ? "履歴を隠す" : `過去の履歴 (${execActionHistory.length}件)`}
                                    </button>
                                )}
                            </div>

                            {/* アクティブな委譲アクション */}
                            {execActions.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {execActions.map((action: any) => {
                                        const priorityMap: Record<string, { label: string; cls: string }> = {
                                            urgent: { label: "最優先", cls: "bg-rose-500 text-white" },
                                            high:   { label: "重要",   cls: "bg-amber-400 text-white" },
                                            normal: { label: "推奨",   cls: "bg-slate-400 text-white" },
                                        };
                                        const p = priorityMap[action.priority] || priorityMap.normal;
                                        const isKept = action.status === 'kept';
                                        return (
                                            <div key={action.id} className="px-6 py-5 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${p.cls}`}>
                                                        {p.label}
                                                    </span>
                                                    {isKept && (
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 shrink-0 mt-0.5">
                                                            ⏸ キープ中
                                                        </span>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-800">{action.title}</p>
                                                        {action.description && (
                                                            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{action.description}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-300 font-bold shrink-0">
                                                        {new Date(action.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                {/* 判断ボタン（未選択状態。いずれもホバーで色が出る） */}
                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleExecActionDecision(action.id, 'completed')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-500 border border-slate-200 text-[11px] font-black rounded-xl hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                                    >
                                                        <Check className="w-3 h-3" /> 完了
                                                    </button>
                                                    <button
                                                        onClick={() => handleExecActionDecision(action.id, 'kept')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-500 border border-slate-200 text-[11px] font-black rounded-xl hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                                    >
                                                        ⏸ キープ
                                                    </button>
                                                    <button
                                                        onClick={() => handleExecActionDecision(action.id, 'rejected')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-500 border border-slate-200 text-[11px] font-black rounded-xl hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" /> 不採用
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-6 py-8 text-center text-slate-400 text-xs font-medium">
                                    現在、経営層からの指示はありません
                                </div>
                            )}

                            {/* 判断済み履歴（折りたたみ） */}
                            {showExecHistory && execActionHistory.length > 0 && (
                                <div className="border-t border-slate-100 bg-slate-50/50">
                                    <div className="px-6 py-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            判断済み履歴
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {execActionHistory.map((action: any) => {
                                            const statusMap: Record<string, { label: string; cls: string }> = {
                                                completed: { label: "✅ 完了",  cls: "text-emerald-600 bg-emerald-50" },
                                                rejected:  { label: "❌ 不採用", cls: "text-rose-500 bg-rose-50" },
                                                kept:      { label: "⏸ キープ", cls: "text-amber-600 bg-amber-50" },
                                                accepted:  { label: "▶ 実行中", cls: "text-teal bg-teal/10" },
                                            };
                                            const s = statusMap[action.status] || { label: action.status, cls: "text-slate-400 bg-slate-100" };
                                            const date = action.archived_at ?? action.updated_at;
                                            return (
                                                <div key={action.id} className="px-6 py-3 flex items-center gap-3 group/hist">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${s.cls}`}>
                                                        {s.label}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-600 flex-1 truncate">{action.title}</span>
                                                    <span className="text-[10px] text-slate-300 font-bold shrink-0">
                                                        {date ? new Date(date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : "—"}
                                                    </span>
                                                    <button
                                                        onClick={() => handleReviveExecAction(action.id)}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-400 border border-slate-200 hover:text-teal hover:border-teal/30 hover:bg-teal/5 transition-all shrink-0"
                                                        title="このアクションを実行中に戻す"
                                                    >
                                                        <RefreshCcw size={11} />
                                                        復活
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* 🧠 ボイスチェックの声（AI要約） */}
                        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2 flex-wrap">
                                            ボイスチェックの声（AI要約）
                                            {summaryTargetLabel && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-50 text-teal border border-teal-100">
                                                    対象月: {summaryTargetLabel}
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-xs text-slate-400 font-bold">
                                            最新の回答がある月の自由回答から、個人が特定されない形で組織の状態をAI要約します
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 匿名ガード未通過の場合 */}
                            {currentMonthScore && !passesAnonymityGuard(currentMonthScore.respondentCount) ? (
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
                                    <p className="text-xs text-slate-400 font-bold">
                                        {summaryTargetLabel || "対象月"}は回答数が3名未満のため要約を生成できません。
                                    </p>
                                </div>
                            ) : aiSummary ? (
                                /* キャッシュあり（生成済み）の場合 */
                                <div className="space-y-6 animate-in fade-in">
                                    {/* 今月のトピック */}
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                            {formatYM(aiSummary.month) || "対象月"}の主要なトピック
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {aiSummary.topics && aiSummary.topics.length > 0 ? (
                                                aiSummary.topics.map((t, idx) => {
                                                    const sentimentColor = 
                                                        t.sentiment === 'positive' 
                                                            ? 'bg-teal-50 border-teal-200 text-teal' 
                                                            : t.sentiment === 'negative' 
                                                            ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                                            : 'bg-slate-50 border-slate-200 text-slate-600';
                                                    return (
                                                        <span 
                                                            key={idx} 
                                                            className={`text-xs font-black px-3.5 py-1.5 rounded-full border ${sentimentColor} flex items-center gap-1.5`}
                                                        >
                                                            {t.title}
                                                            <span className="text-[10px] font-bold opacity-60">({t.count}件)</span>
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-xs text-slate-400">トピックは抽出されませんでした。</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 要約詳細 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-teal-50/30 border border-teal-100 rounded-2xl p-5 space-y-2">
                                            <h4 className="text-xs font-black text-teal">ポジティブな声</h4>
                                            <p className="text-xs text-slate-700 font-bold leading-relaxed">
                                                {aiSummary.positive_summary || "—"}
                                            </p>
                                        </div>
                                        <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-5 space-y-2">
                                            <h4 className="text-xs font-black text-rose-700">課題・改善要望</h4>
                                            <p className="text-xs text-slate-700 font-bold leading-relaxed">
                                                {aiSummary.negative_summary || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 注目ヒント */}
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 relative overflow-hidden">
                                        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                                        <p className="text-xs font-black text-amber-700 mb-2 flex items-center gap-1.5">
                                            💡 マネージャーへの注目点
                                        </p>
                                        <p className="text-xs text-amber-900 font-bold leading-relaxed">
                                            {aiSummary.manager_hint || "—"}
                                        </p>
                                    </div>

                                    {/* 途中集計の注意（対象月がまだ全員分揃っていない場合） */}
                                    {isPartialSummaryMonth && (
                                        <div className="bg-amber-50/60 border border-amber-100 rounded-2xl px-4 py-3 text-[11px] font-bold text-amber-800 leading-relaxed">
                                            ⚠️ {summaryTargetLabel || "対象月"}のボイスチェックはまだ全員分揃っていません（{currentMonthScore!.respondentCount} / {currentMonthScore!.headcount} 名）。途中集計での要約です。回答が揃ってから「再生成」で更新できます。
                                        </div>
                                    )}

                                    {/* 再生成・生成時間表示 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                        <span className="text-[10px] text-slate-400 font-bold">
                                            対象月: {formatYM(aiSummary.month) || "—"} ／ 生成日時: {new Date(aiSummary.generated_at).toLocaleString('ja-JP')}
                                        </span>
                                        <button
                                            onClick={() => handleGenerateSummary(true)}
                                            disabled={summaryLoading}
                                            className="text-xs font-black text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                        >
                                            {summaryLoading ? "再生成中..." : "AI要約を再生成する"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* キャッシュなし・匿名ガード通過済みの場合 */
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                                    {isPartialSummaryMonth && (
                                        <div className="w-full bg-amber-50/60 border border-amber-100 rounded-2xl px-4 py-3 text-[11px] font-bold text-amber-800 leading-relaxed text-left">
                                            ⚠️ {summaryTargetLabel || "対象月"}のボイスチェックはまだ全員分揃っていません（{currentMonthScore!.respondentCount} / {currentMonthScore!.headcount} 名）。今生成すると途中集計の要約になります。回答が揃ってから生成・再生成するのがおすすめです。
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 font-medium max-w-md leading-relaxed">
                                        {summaryTargetLabel || "最新の回答がある月"}の従業員の自由回答を集約・分析し、AI要約を生成できます。
                                        個人を特定できないよう保護されたレポートが作成されます。
                                    </p>
                                    <button
                                        onClick={() => handleGenerateSummary(false)}
                                        disabled={summaryLoading}
                                        className="bg-teal hover:bg-teal-600 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        {summaryLoading ? "AI要約を生成中..." : "AIで要約を生成する"}
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* 📬 今月のAI提案アクション & ✅ アクションプラン（今月） */}
                        {aiSummary && (
                            <>
                                {/* 📬 今月のAI提案アクション */}
                                <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal">
                                                <Sparkles className="w-5 h-5 text-teal" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                                                    AIからの今月提案
                                                    {actionPlans.filter(p => p.source === 'ai_proposed' && p.status === 'proposed').length > 0 && (
                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 ml-1 text-[10px] font-black leading-none text-white bg-rose-500 rounded-full animate-pulse">
                                                            ● {actionPlans.filter(p => p.source === 'ai_proposed' && p.status === 'proposed').length}件
                                                        </span>
                                                    )}
                                                </h2>
                                                <p className="text-xs text-slate-400 font-bold">
                                                    ボイスチェックの要約に基づき、今月のアクションを提案します
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {actionPlans.filter(p => p.source === 'ai_proposed' && p.status === 'proposed').length === 0 ? (
                                        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 text-center">
                                            <p className="text-xs text-slate-400 font-bold">
                                                今月の提案はすべて確認済みです。
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {actionPlans
                                                .filter(p => p.source === 'ai_proposed' && p.status === 'proposed')
                                                .map(plan => (
                                                    <div 
                                                        key={plan.id}
                                                        className="bg-gradient-to-br from-teal-50/20 to-slate-50/40 border border-teal-100/60 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group overflow-hidden"
                                                    >
                                                        <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-12 h-12 bg-teal-500/5 rounded-full blur-lg group-hover:scale-150 transition-all duration-500" />
                                                        <div className="space-y-2">
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-base shrink-0 mt-0.5">💡</span>
                                                                <h4 className="text-xs font-black text-slate-800 leading-tight">
                                                                    {plan.title}
                                                                </h4>
                                                            </div>
                                                            {plan.description && (
                                                                <p className="text-xs text-slate-500 font-bold leading-relaxed pl-6">
                                                                    {plan.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        
                                                        {userRole === 'manager' && (
                                                            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100/50">
                                                                <button
                                                                    onClick={() => handleUpdateStatus(plan.id, 'dismissed')}
                                                                    className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 px-3 py-1.5 rounded-xl transition-all"
                                                                >
                                                                    <X className="w-3.5 h-3.5" /> 却下
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(plan.id, 'accepted')}
                                                                    className="flex items-center gap-1 text-[10px] font-black bg-teal hover:bg-teal-600 text-white px-3.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" /> 採用する
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </section>

                                {/* ✅ アクションプラン（今月） */}
                                <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-black text-slate-800 tracking-tight">
                                                    アクションプラン（今月）
                                                </h2>
                                                <p className="text-xs text-slate-400 font-bold">
                                                    今月フォーカスして実行する具体的なアクション一覧です
                                                </p>
                                            </div>
                                        </div>
                                        {userRole === 'manager' && !isAddingAction && (
                                            <button
                                                onClick={() => setIsAddingAction(true)}
                                                className="flex items-center gap-1 text-xs font-black bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
                                            >
                                                <Plus className="w-4 h-4" /> アクションを追加
                                            </button>
                                        )}
                                    </div>

                                    {/* 手動追加インラインフォーム */}
                                    {isAddingAction && (
                                        <form 
                                            onSubmit={handleAddAction}
                                            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-3 duration-200"
                                        >
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">タイトル（必須）</label>
                                                    <input 
                                                        type="text"
                                                        value={newTitle}
                                                        onChange={(e) => setNewTitle(e.target.value)}
                                                        maxLength={20}
                                                        placeholder="アクションのタイトル（20文字以内）"
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">説明（任意）</label>
                                                    <textarea 
                                                        value={newDescription}
                                                        onChange={(e) => setNewDescription(e.target.value)}
                                                        maxLength={60}
                                                        placeholder="具体的な手順や工夫（60文字以内）"
                                                        rows={2}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingAction(false);
                                                        setNewTitle("");
                                                        setNewDescription("");
                                                    }}
                                                    className="text-xs font-black text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl transition-all"
                                                >
                                                    キャンセル
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={actionSaving}
                                                    className="text-xs font-black bg-teal hover:bg-teal-600 text-white px-5 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                >
                                                    {actionSaving ? "保存中..." : "追加する"}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {actionPlans.filter(p => p.status !== 'proposed').length === 0 ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-2">
                                            <p className="text-xs text-slate-400 font-bold">
                                                今月のアクションプランはまだありません。
                                            </p>
                                            {userRole === 'manager' && (
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    「アクションを追加」または「AIからの今月提案」を採用して行動を開始しましょう
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {actionPlans
                                                .filter(p => p.status !== 'proposed')
                                                .map(plan => {
                                                    const isManual = plan.source === 'manual';
                                                    return (
                                                        <div 
                                                            key={plan.id}
                                                            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                                        >
                                                            <div className="space-y-2 max-w-xl">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    {!isManual && (
                                                                        <span className="text-[9px] font-black bg-gradient-to-r from-teal-500 to-indigo-500 text-white px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5 shadow-sm">
                                                                            <Sparkles className="w-2.5 h-2.5" /> AI提案
                                                                        </span>
                                                                    )}
                                                                    <h4 className="text-xs font-black text-slate-800 leading-snug">
                                                                        {plan.title}
                                                                    </h4>
                                                                </div>
                                                                {plan.description && (
                                                                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                                                        {plan.description}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                                                                {/* ステータス切替トグル（manager限定、それ以外は閲覧用バッジ表示） */}
                                                                {userRole === 'manager' ? (
                                                                    <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/50">
                                                                        {(['accepted', 'in_progress', 'done'] as const).map(st => {
                                                                            const isSelected = plan.status === st;
                                                                            const label = st === 'accepted' ? '予定' : st === 'in_progress' ? '実行中' : '完了';
                                                                            const colorClass = isSelected
                                                                                ? st === 'accepted'
                                                                                    ? 'bg-white text-slate-700 shadow-sm'
                                                                                    : st === 'in_progress'
                                                                                    ? 'bg-teal text-white shadow-sm'
                                                                                    : 'bg-indigo-500 text-white shadow-sm'
                                                                                : 'text-slate-400 hover:text-slate-600';
                                                                            
                                                                            return (
                                                                                <button
                                                                                    key={st}
                                                                                    type="button"
                                                                                    onClick={() => handleUpdateStatus(plan.id, st)}
                                                                                    className={`text-[10px] font-black px-3 py-1 rounded-lg transition-all ${colorClass}`}
                                                                                >
                                                                                    {label}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border ${
                                                                        plan.status === 'accepted' 
                                                                            ? 'bg-slate-50 text-slate-600 border-slate-200' 
                                                                            : plan.status === 'in_progress' 
                                                                            ? 'bg-teal-50 text-teal border-teal-200' 
                                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                                    }`}>
                                                                        {plan.status === 'accepted' ? '予定' : plan.status === 'in_progress' ? '実行中' : '完了'}
                                                                    </span>
                                                                )}

                                                                {/* 削除ボタン（managerのみ、且つ自分が所有するもの） */}
                                                                {userRole === 'manager' && (
                                                                    <button
                                                                        onClick={() => handleDeleteAction(plan.id)}
                                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                                        title="削除する"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}


                        {/* 📊 体温プロフィール */}
                        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-teal" /> 体温プロフィール（5テーマ）
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">直近3ヶ月のアンケート結果から部署のバランスと全社比較を確認します</p>
                            </div>

                            {dept3mResponsesCount >= 3 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight="bold" />
                                                <PolarRadiusAxis angle={30} domain={[0, 5]} tickCount={6} stroke="#cbd5e1" fontSize={10} />
                                                <Radar name="自部署" dataKey="dept" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} strokeWidth={2} />
                                                {company3mResponsesCount >= 3 && (
                                                    <Radar name="全社平均" dataKey="company" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="3 3" />
                                                )}
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700 }}
                                                    formatter={(value: any) => [`${value} / 5.00`]}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-6">
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">テーマ解説</h3>
                                        <div className="space-y-3">
                                            {radarData.map(r => (
                                                <div key={r.subject} className="flex justify-between items-start gap-4 text-xs">
                                                    <div>
                                                        <span className="font-bold text-slate-700">{r.subject}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="font-black text-teal">{r.dept !== null ? r.dept : "—"}</span>
                                                        <span className="text-slate-300">/</span>
                                                        <span className="text-slate-400 font-medium">全社: {company3mResponsesCount >= 3 && r.company !== null ? r.company : "—"}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
                                    <Info className="w-8 h-8 text-slate-400" />
                                    <h3 className="text-sm font-black text-slate-700">回答数が不足しているためプロフィール非表示</h3>
                                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                                        プライバシーと個人の匿名性を保護するため、直近3ヶ月の部署内の回答総数が3名未満の場合、体温プロフィールは表示されません。
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* 📊 今月の設問別スコア */}
                        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <ClipboardList className="w-4 h-4" /> 今月の設問別スコア
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">今月、どの問いに課題が出ているかを確認しましょう</p>
                            </div>

                            {currentMonthScore && passesAnonymityGuard(currentMonthScore.respondentCount) ? (
                                <div className="space-y-6">
                                    {questionScores.length === 0 ? (
                                        <p className="text-xs text-slate-400">設問データが登録されていません。</p>
                                    ) : (
                                        questionScores.map(qs => {
                                            const scoreVal = qs.avg !== null ? qs.avg : 0;
                                            // スコアに応じたカラーリング
                                            const isLow = scoreVal > 0 && scoreVal < 3.0;
                                            const isMid = scoreVal >= 3.0 && scoreVal < 4.0;
                                            const isHigh = scoreVal >= 4.0;

                                            return (
                                                <div key={qs.questionId} className="space-y-2 border-b border-slate-50 pb-4 last:border-none last:pb-0">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                        <span className="text-sm font-bold text-slate-700">{qs.text}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-black text-slate-800">{qs.avg !== null ? qs.avg.toFixed(2) : "—"}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">/ 5.00</span>
                                                        </div>
                                                    </div>

                                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500`}
                                                            style={{
                                                                width: `${(scoreVal / 5) * 100}%`,
                                                                backgroundColor: isLow ? '#f43f5e' : isMid ? '#f59e0b' : isHigh ? '#14b8a6' : '#cbd5e1'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
                                    <Info className="w-8 h-8 text-slate-400" />
                                    <h3 className="text-sm font-black text-slate-700">回答数が不足しているため詳細非表示</h3>
                                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                                        プライバシーと個人の匿名性を保護するため、今月の回答総数が3名未満の場合、設問ごとの詳細なスコアは一括してマスクされます。
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* 組織として話したいこと（この部署が関係するフィードバックのみ） */}
                        {relevantFeedback.length > 0 && (
                            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 space-y-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    組織として話したいこと
                                </span>
                                <div className="space-y-1">
                                    {relevantFeedback.map((f: any, i: number) => (
                                        <FeedbackItem
                                            key={i}
                                            from={f.from_dept || ""}
                                            to={f.to_dept || ""}
                                            text={f.text}
                                            type={["positive","warning","alert","info"].includes(f.type) ? f.type : "info"}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
