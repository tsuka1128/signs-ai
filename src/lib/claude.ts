/**
 * Claude API (Anthropic) 連携用の共通ユーティリティ
 *
 * 管理画面（/admin/settings）の「AIコントロール」タブで設定された
 * モデル名・temperature・maxTokens を呼び出し側から受け取り、APIリクエストに反映する。
 */

/** デフォルト値の定数定義 */
// 現行世代の Sonnet。廃止済みモデル(claude-3-7-sonnet 等)や1世代前(claude-sonnet-4-5)からの移行先。
// より高精度が必要なら DB(system_settings.default_model) で claude-opus-4-8 を指定可能。
const DEFAULT_MODEL = "claude-sonnet-5";
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 1024;

/**
 * temperature/top_p/top_k を受け付けるのは旧世代モデルのみ。
 * 現行世代（Opus 4.7/4.8・Sonnet 5・Fable 5 等）は sampling パラメータが削除されており、
 * 送信すると 400 invalid_request_error になる。旧世代モデルにのみ temperature を送る。
 */
function modelAcceptsSampling(model: string): boolean {
    return /claude-3|claude-2|claude-sonnet-4-5|claude-sonnet-4-0|claude-opus-4-1|claude-opus-4-0|claude-haiku-4-5/.test(model);
}

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
        messages: [{ role: "user", content: prompt }],
    };

    // 旧世代モデルのみ temperature を付与（現行世代に送ると 400 になるため）
    if (modelAcceptsSampling(model)) {
        requestBody.temperature = temperature;
    }

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

    // 応答形状を検証してからテキストを取り出す。
    // stop_reason が "max_tokens" 等で content が空/形状変化した場合や tool_use ブロック混在時に
    // data.content[0].text を無条件参照するとクラッシュするため、text ブロックを明示的に探す。
    const textBlock = Array.isArray(data?.content)
        ? data.content.find((b: any) => b?.type === "text" && typeof b.text === "string")
        : null;

    if (!textBlock?.text) {
        throw new Error(
            `Claude API returned no text content (stop_reason: ${data?.stop_reason ?? "unknown"})`
        );
    }

    return textBlock.text as string;
}
