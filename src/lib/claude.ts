/**
 * Claude API (Anthropic) 連携用の共通ユーティリティ
 *
 * 管理画面（/admin/settings）の「AIコントロール」タブで設定された
 * モデル名・temperature・maxTokens を呼び出し側から受け取り、APIリクエストに反映する。
 */

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
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
        throw new Error("CLAUDE_API_KEY is not set");
    }

    const {
        systemPrompt,
        maxTokens = DEFAULT_MAX_TOKENS,
        model = DEFAULT_MODEL,
        temperature = DEFAULT_TEMPERATURE,
    } = options || {};

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
    return data.content[0].text;
}
