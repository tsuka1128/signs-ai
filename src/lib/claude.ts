/**
 * Claude API (Anthropic) 連携用の共通ユーティリティ
 */
export async function generateAIInsight(prompt: string) {
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
        throw new Error("CLAUDE_API_KEY is not set");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    const data = await response.json();
    return data.content[0].text;
}
