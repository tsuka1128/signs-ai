/**
 * Claude API (Anthropic) 連携用の共通ユーティリティ
 */
export async function generateAIInsight(prompt: string, options?: { systemPrompt?: string; maxTokens?: number }) {
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
        throw new Error("CLAUDE_API_KEY is not set");
    }

    const { systemPrompt, maxTokens = 1024 } = options || {};

    const requestBody: any = {
        model: "claude-3-5-sonnet-20240620",
        max_tokens: maxTokens,
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
