/**
 * Claude API (Anthropic) 連携用の共通ユーティリティ
 *
 * 管理画面（/admin/settings）の「AIコントロール」タブで設定された
 * モデル名・temperature・maxTokens を呼び出し側から受け取り、APIリクエストに反映する。
 */

import { createClient } from "@supabase/supabase-js";
import { calcCostUsd } from "./token-pricing";

/** デフォルト値の定数定義 */
const DEFAULT_MODEL = "claude-3-7-sonnet-20250219";
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 1024;

interface GenerateOptions {
    /** システムプロンプト（ベースプロンプト + スロット別プロンプトを結合して渡す） */
    systemPrompt?: string;
    /** 最大出力トークン数 */
    maxTokens?: number;
    /** 使用するClaudeモデル名（DB設定値 default_model を渡す） */
    model?: string;
    /** Temperature（0.0〜1.0、低いほど安定した出力） */
    temperature?: number;
    /** APIキー（DBから取得した値を渡す用） */
    apiKey?: string;
    /** タイムアウト制御用のSignal */
    signal?: AbortSignal;
    /** エージェント名（メタデータ） */
    agentName?: string;
    /** 呼び出し目的（メタデータ） */
    purpose?: string;
    /** 対象企業ID（メタデータ） */
    companyId?: string;
}

/**
 * Claude APIを呼び出してAI分析テキストを生成する
 *
 * @param prompt - ユーザープロンプト（データコンテキスト + 分析指示）
 * @param options - システムプロンプト、モデル、temperature等の設定
 * @returns 生成されたテキスト
 * @throws CLAUDE_API_KEY未設定時、またはAPI呼び出し失敗時にエラーをスロー
 */
export async function generateAIInsight(prompt: string, options?: GenerateOptions) {
    const {
        systemPrompt,
        maxTokens = DEFAULT_MAX_TOKENS,
        model = DEFAULT_MODEL,
        temperature = DEFAULT_TEMPERATURE,
        apiKey: explicitKey,
    } = options || {};

    const apiKey = explicitKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY or CLAUDE_API_KEY is not set");
    }

    const requestBody: any = {
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: "user", content: prompt }],
    };

    if (systemPrompt) {
        requestBody.system = systemPrompt;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: options?.signal,
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // トークン使用量を非同期でロギング (fire-and-forget、レイテンシ影響ゼロ)
    if (data.usage) {
        logTokenUsage({
            companyId: options?.companyId,
            agentName: options?.agentName ?? 'system',
            purpose: options?.purpose ?? 'unknown',
            model,
            inputTokens: data.usage.input_tokens || 0,
            outputTokens: data.usage.output_tokens || 0,
            costUsd: calcCostUsd(model, data.usage.input_tokens || 0, data.usage.output_tokens || 0),
        }).catch(console.error);
    }

    return data.content[0].text;
}

// =====================================================
// トークン使用実績の自動ロギングユーティリティ (サービスロール使用)
// =====================================================
let supabaseAdmin: any = null;

function getSupabaseAdmin() {
    if (supabaseAdmin) return supabaseAdmin;
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        return null;
    }

    supabaseAdmin = createClient(url, key);
    return supabaseAdmin;
}

interface LogTokenUsageParams {
    companyId?: string;
    agentName: string;
    purpose: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
}

async function logTokenUsage(params: LogTokenUsageParams) {
    const admin = getSupabaseAdmin();
    if (!admin) {
        console.warn("logTokenUsage skipped: Supabase admin client not initialized (check env vars)");
        return;
    }

    const { error } = await admin.from("ai_usage_logs").insert({
        company_id: params.companyId ?? null,
        agent_name: params.agentName,
        purpose: params.purpose,
        model: params.model,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        cost_usd: params.costUsd
    });

    if (error) {
        console.error("logTokenUsage error:", error);
    }
}
