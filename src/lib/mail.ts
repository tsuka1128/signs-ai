/**
 * Resend APIを使用したメール送信ライブラリ
 * 外部ライブラリに依存せず、fetch APIを使用して直接リクエストを送信します。
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

/**
 * メールを送信します
 */
export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.error("RESEND_API_KEY is not set in environment variables.");
        throw new Error("メール配信設定（API KEY）が未設定です。");
    }

    const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            from: from || "Signs AI <no-reply@signs-ai.jp>",
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Resend API Error:", data);
        throw new Error(data.message || "メールの送信に失敗しました。");
    }

    return data;
}

/**
 * 招待メールを送信します
 */
export async function sendInvitationEmail(email: string, companyName: string, inviteUrl: string) {
    return sendEmail({
        to: email,
        subject: `【${companyName}】Signs AI への招待`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
                <h1 style="font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 24px;">Signs AI へようこそ</h1>
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    ${companyName} の管理者より、組織分析プラットフォーム「Signs AI」への招待が届いています。
                </p>
                <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: bold; text-decoration: none;">招待を承諾して開始する</a>
                </div>
                <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
                    ※このメールに心当たりがない場合は、お手数ですが破棄してください。<br>
                    ※リンクの有効期限は7日間です。
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                    &copy; Signs AI
                </p>
            </div>
        `
    });
}
