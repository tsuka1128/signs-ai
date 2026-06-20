export const runtime = "nodejs";
export const maxDuration = 300; // Vercel Pro: 最大300秒

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateAIInsight } from "@/lib/claude";
import { getSystemSettings } from "@/lib/settings-server";

/**
 * 部署ごとのボイスチェック自由回答をAI要約するAPIエンドポイント
 * 
 * @route POST /api/ai/dept-summary
 */
export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. 認証確認
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. ユーザーのプロフィール取得（ロール確認）
        const { data: profile } = await supabase
            .from("users")
            .select("company_id, role")
            .eq("id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 });
        }

        // playerロールは権限なし (403)
        if (profile.role === "player") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const companyId = profile.company_id;
        if (!companyId) {
            return NextResponse.json({ error: "No company associated with this user" }, { status: 400 });
        }

        // リクエストボディのバリデーション
        const { department_id, month, force } = await req.json();
        if (!department_id || !month) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        // 4. キャッシュ確認：同部署 × 同月が既に生成されていれば即返却
        //    ただし force=true（再生成）の場合はキャッシュを無視して作り直す（回答が増えた後の更新用）
        if (!force) {
            const { data: cachedSummary } = await supabase
                .from('dept_ai_summaries')
                .select('*')
                .eq('department_id', department_id)
                .eq('month', month)
                .maybeSingle();

            if (cachedSummary) {
                return NextResponse.json(cachedSummary);
            }
        }

        // 5. survey_responses から今月・該当部署の free_comment / cross_dept_feedback を取得
        // 5. survey_responses から今月・該当部署の free_comment / cross_dept_feedback を取得
        const { data: responses, error: responseErr } = await supabase
            .from('survey_responses')
            .select('id, free_comment, cross_dept_feedback, fingerprint')
            .eq('company_id', companyId)
            .eq('department_id', department_id)
            .eq('recorded_month', month);

        if (responseErr) throw responseErr;

        // 6. 匿名ガード：回答者数（survey_responses の行数）が3人未満の場合は400エラー
        const respondentCount = (responses || []).length;
        if (respondentCount < 3) {
            return NextResponse.json({ error: "INSUFFICIENT_RESPONSES" }, { status: 400 });
        }

        // コメントテキストをフィルタリングして結合
        const commentsList: string[] = [];
        (responses || []).forEach(r => {
            if (r.free_comment && r.free_comment.trim()) {
                commentsList.push(r.free_comment.trim());
            }
            if (r.cross_dept_feedback && r.cross_dept_feedback.trim()) {
                commentsList.push(r.cross_dept_feedback.trim());
            }
        });

        const n = commentsList.length;
        const commentsText = commentsList.map((c, i) => `【コメント ${i + 1}】\n${c}`).join("\n\n");

        // 定量データの取得と計算
        // A. 設問一覧の取得
        const { data: questions, error: questionErr } = await supabase
            .from('survey_questions')
            .select('id, text, category, sort_order')
            .or(`company_id.is.null,company_id.eq.${companyId}`)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (questionErr) throw questionErr;

        // B. 部署の当月回答スコア取得と平均算出
        const responseIds = (responses || []).map(r => r.id);
        const { data: answers, error: answerErr } = responseIds.length > 0
            ? await supabase
                .from('survey_answers')
                .select('question_id, score')
                .in('response_id', responseIds)
            : { data: [], error: null };

        if (answerErr) throw answerErr;

        const deptScoresMap: Record<string, number[]> = {};
        const deptAllScores: number[] = [];
        (answers || []).forEach(a => {
            if (!a.question_id || a.score === null) return;
            if (!deptScoresMap[a.question_id]) deptScoresMap[a.question_id] = [];
            deptScoresMap[a.question_id].push(a.score);
            deptAllScores.push(a.score);
        });

        // 部署体温平均
        const deptPulse = deptAllScores.length > 0
            ? Number((deptAllScores.reduce((s, v) => s + v, 0) / deptAllScores.length).toFixed(2))
            : null;

        // C. 全社の当月データ取得（全社平均との比較用）
        const { data: compRes, error: compResErr } = await supabase
            .from('survey_responses')
            .select('id, fingerprint')
            .eq('company_id', companyId)
            .eq('recorded_month', month);

        if (compResErr) throw compResErr;

        // 全社の匿名ガード（回答者数が3名以上）
        const uniqueCompUserIds = new Set((compRes || []).map(r => r.fingerprint || r.id).filter(Boolean));
        const compRespondentCount = uniqueCompUserIds.size;
        
        let companyPulse: number | null = null;
        const companyScoresMap: Record<string, number> = {};

        if (compRespondentCount >= 3) {
            const compResIds = (compRes || []).map(r => r.id);
            const { data: compAns, error: compAnsErr } = compResIds.length > 0
                ? await supabase
                    .from('survey_answers')
                    .select('question_id, score')
                    .in('response_id', compResIds)
                : { data: [], error: null };

            if (compAnsErr) throw compAnsErr;

            const compScoresLists: Record<string, number[]> = {};
            const compAllScores: number[] = [];
            (compAns || []).forEach(a => {
                if (!a.question_id || a.score === null) return;
                if (!compScoresLists[a.question_id]) compScoresLists[a.question_id] = [];
                compScoresLists[a.question_id].push(a.score);
                compAllScores.push(a.score);
            });

            if (compAllScores.length > 0) {
                companyPulse = Number((compAllScores.reduce((s, v) => s + v, 0) / compAllScores.length).toFixed(2));
            }

            Object.entries(compScoresLists).forEach(([qId, list]) => {
                if (list.length > 0) {
                    companyScoresMap[qId] = Number((list.reduce((s, v) => s + v, 0) / list.length).toFixed(2));
                }
            });
        }

        // D. 部署の前月データ取得（前月比用）
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr);
        const mVal = parseInt(monthStr);
        const prevYear = mVal === 1 ? year - 1 : year;
        const prevMonthVal = mVal === 1 ? 12 : mVal - 1;
        const previousMonth = `${prevYear}-${prevMonthVal.toString().padStart(2, '0')}`;

        const { data: prevRes, error: prevResErr } = await supabase
            .from('survey_responses')
            .select('id')
            .eq('company_id', companyId)
            .eq('department_id', department_id)
            .eq('recorded_month', previousMonth);

        if (prevResErr) throw prevResErr;

        const prevRespondentCount = (prevRes || []).length;
        let prevPulse: number | null = null;
        const prevScoresMap: Record<string, number> = {};

        if (prevRespondentCount >= 3) {
            const prevResIds = (prevRes || []).map(r => r.id);
            const { data: prevAns, error: prevAnsErr } = prevResIds.length > 0
                ? await supabase
                    .from('survey_answers')
                    .select('question_id, score')
                    .in('response_id', prevResIds)
                : { data: [], error: null };

            if (prevAnsErr) throw prevAnsErr;

            const prevScoresLists: Record<string, number[]> = {};
            const prevAllScores: number[] = [];
            (prevAns || []).forEach(a => {
                if (!a.question_id || a.score === null) return;
                if (!prevScoresLists[a.question_id]) prevScoresLists[a.question_id] = [];
                prevScoresLists[a.question_id].push(a.score);
                prevAllScores.push(a.score);
            });

            if (prevAllScores.length > 0) {
                prevPulse = Number((prevAllScores.reduce((s, v) => s + v, 0) / prevAllScores.length).toFixed(2));
            }

            Object.entries(prevScoresLists).forEach(([qId, list]) => {
                if (list.length > 0) {
                    prevScoresMap[qId] = Number((list.reduce((s, v) => s + v, 0) / list.length).toFixed(2));
                }
            });
        }

        // 定量コンテキストテキストの構築
        let quantitativeContext = `【定量データ（当月）】
部署の当月回答者数: ${respondentCount}名
部署の総合体温（Pulse平均スコア）: ${deptPulse !== null ? `${deptPulse} / 5.0` : "データなし"}`;

        if (deptPulse !== null) {
            const diffCompText = companyPulse !== null 
                ? ` (全社平均比: ${(deptPulse - companyPulse) >= 0 ? `+${(deptPulse - companyPulse).toFixed(2)}` : (deptPulse - companyPulse).toFixed(2)})`
                : "";
            const diffPrevText = prevPulse !== null
                ? ` (前月比: ${(deptPulse - prevPulse) >= 0 ? `+${(deptPulse - prevPulse).toFixed(2)}` : (deptPulse - prevPulse).toFixed(2)})`
                : "";
            quantitativeContext += `${diffCompText}${diffPrevText}`;
        }

        quantitativeContext += `\n\n【設問別スコア（当月）】\n`;
        const lowScoreQuestions: string[] = [];

        (questions || []).forEach(q => {
            const qScores = deptScoresMap[q.id] || [];
            const qAvg = qScores.length > 0 
                ? Number((qScores.reduce((s, v) => s + v, 0) / qScores.length).toFixed(2))
                : null;
            
            if (qAvg !== null) {
                if (qAvg < 3.0) {
                    lowScoreQuestions.push(`「${q.text}」: ${qAvg.toFixed(2)}`);
                }
                
                let qText = `- 「${q.text}」: 部署平均 ${qAvg.toFixed(2)} / 5.0`;
                const cAvg = companyScoresMap[q.id];
                const pAvg = prevScoresMap[q.id];

                if (cAvg !== undefined) {
                    qText += ` (全社平均: ${cAvg.toFixed(2)})`;
                }
                if (pAvg !== undefined) {
                    qText += ` (前月平均: ${pAvg.toFixed(2)})`;
                }
                quantitativeContext += `${qText}\n`;
            } else {
                quantitativeContext += `- 「${q.text}」: データなし\n`;
            }
        });

        if (lowScoreQuestions.length > 0) {
            quantitativeContext += `\n【低スコア項目（3.0未満）】\n` + lowScoreQuestions.map(item => `- ${item}`).join('\n') + `\n`;
        } else {
            quantitativeContext += `\n【低スコア項目（3.0未満）】\nなし\n`;
        }

        // 7. コメントテキストと定量データを結合してプロンプト生成
        // システムプロンプト
        const systemPrompt = `あなたは組織サーベイの分析専門家です。
従業員の自由回答（テキスト）と、部署および全社のアンケート定量データ（スコア）を統合的に分析し、個人が特定されない形で組織の状態に関する深いインサイトを抽出してください。
出力はJSON形式のみで返してください（Markdownコードブロック不要）。`;

        // ユーザープロンプト
        const prompt = `以下は今月の従業員アンケートの回答データ（匿名、${respondentCount}名分）です。

${quantitativeContext}

【従業員の自由コメント】
${commentsText}

次のJSON形式で返してください：
{
  "topics": [
    { "title": "トピック名（10文字以内）", "sentiment": "positive|negative|neutral", "count": 出現数の目安 }
  ],
  "positive_summary": "ポジティブな声の要約（2〜3文で、具体的な要因や従業員のエンゲージメント要因に触れながら記述してください）",
  "negative_summary": "課題・改善要望・懸念事項の要約（2〜3文で、具体的なボトルネックや課題に触れながら記述してください。自由回答に明示的な不満が少ない場合でも、低スコア項目や全社平均を下回る項目から読み取れる潜在的なリスクや組織の温度感を考慮して潜在的リスクを示唆してください）",
  "deep_dive": "深掘り分析：背景と示唆（自由コメントと定量スコアを突き合わせ、なぜこのような結果になっているか、今後どのような組織リスク（離職、生産性低下など）が懸念されるか、またどのように改善すべきかという深い洞察を、論理的かつ具体的に3〜5文で論述してください）",
  "manager_hint": "マネージャーが今月注目・実践すべき注目点（2〜3点の具体的な改善ヒントやフィードバックのアクションプランを箇条書き的に提示してください）"
}

注意：
- topics は5〜7件に増やして記述すること
- 個人が特定できる情報（個人名や特定の業務詳細）は一切含めないこと。定量データを記述内で用いる際は個人が特定されないように一般的な表現で徹底すること。
- コメントがない場合でも、定量スコアから示唆される組織状態に基づき、該当項目を適切に記述すること（空文字や「なし」「—」等の空欄にしない）。`;

        // 8. Claude API 呼び出し
        const sysSettings = await getSystemSettings();
        let aiResultRaw: string;

        try {
            aiResultRaw = await generateAIInsight(prompt, {
                systemPrompt,
                model: sysSettings['default_model'] || 'claude-sonnet-4-5',
                apiKey: sysSettings['anthropic_api_key'] || sysSettings['claude_api_key'],
                maxTokens: 2000,
                temperature: 0.3,
            });
        } catch (apiError: any) {
            console.error("[Claude API Error]:", apiError);
            return NextResponse.json({ error: "AI要約の生成に失敗しました（外部APIエラー）" }, { status: 500 });
        }

        // 9. レスポンスをパースしてDBにupsertキャッシュ保存
        let aiResult: any;
        try {
            const cleanJson = aiResultRaw.replace(/```json\n?|\n?```/g, "").trim();
            aiResult = JSON.parse(cleanJson);
        } catch (jsonError) {
            console.error("[AI JSON Parse Error]:", jsonError, "Raw Data:", aiResultRaw);
            return NextResponse.json({ error: "AIの回答を解析できませんでした" }, { status: 500 });
        }

        const { data: upsertedData, error: upsertErr } = await supabase
            .from('dept_ai_summaries')
            .upsert({
                company_id: companyId,
                department_id: department_id,
                month: month,
                topics: aiResult.topics || [],
                positive_summary: aiResult.positive_summary || "",
                negative_summary: aiResult.negative_summary || "",
                manager_hint: aiResult.manager_hint || "",
                deep_dive: aiResult.deep_dive || "",
                generated_at: new Date().toISOString()
            }, {
                onConflict: 'department_id,month'
            })
            .select()
            .single();

        if (upsertErr) {
            console.error("[Database Save Error]:", upsertErr);
            return NextResponse.json({ error: "要約のキャッシュ保存に失敗しました" }, { status: 500 });
        }

        // 10. 結果を返却
        return NextResponse.json(upsertedData);

    } catch (error: any) {
        console.error("[dept-summary API Route Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
