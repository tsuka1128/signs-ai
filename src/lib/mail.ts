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
 * HTML特殊文字をエスケープする。
 * companyName は会社登録時のユーザー入力なので、そのまま埋め込むと
 * メールHTMLへのインジェクション（リンク偽装・レイアウト破壊）を許してしまう（T-TECH-5）。
 */
function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
    ));
}

/**
 * 招待メールを送信します
 */
export async function sendInvitationEmail(email: string, companyName: string, inviteUrl: string) {
    const safeCompany = escapeHtml(companyName);
    // href はURLなので " のエスケープで属性を閉じられないようにする（生成元は自前だが二重防御）
    const safeUrl = escapeHtml(inviteUrl);
    const teal = "#38B2AC";

    return sendEmail({
        to: email,
        // 件名の先頭に会社名を置き、迷惑メール判定・視認性を上げる
        subject: `${safeCompany}｜Signs AI 組織分析への招待`,
        html: `
            <div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #334155;">
                <!-- ブランドロゴ（テキストロゴ＋tealアクセント） -->
                <div style="margin-bottom: 28px;">
                    <span style="font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">Signs</span><span style="font-size: 22px; font-weight: 900; color: ${teal}; letter-spacing: -0.02em;"> AI</span>
                    <div style="height: 3px; width: 40px; background: ${teal}; border-radius: 999px; margin-top: 6px;"></div>
                </div>

                <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 20px;">組織分析プラットフォームへの招待</h1>
                <p style="font-size: 15px; line-height: 1.7; margin-bottom: 28px;">
                    <strong style="color:#0f172a;">${safeCompany}</strong> の管理者より、組織の体温を可視化するSaaS「Signs AI」への招待が届いています。下のボタンから参加手続きを進めてください。
                </p>
                <div style="text-align: center; margin-bottom: 28px;">
                    <a href="${safeUrl}" style="display: inline-block; background-color: ${teal}; color: #ffffff; padding: 15px 36px; border-radius: 999px; font-weight: bold; font-size: 15px; text-decoration: none;">招待を承諾して開始する</a>
                </div>
                <p style="font-size: 13px; color: #64748b; line-height: 1.7;">
                    ※このメールに心当たりがない場合は、お手数ですが破棄してください。<br>
                    ※リンクの有効期限は7日間です。
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                    組織に、体温を。 &nbsp;/&nbsp; &copy; Signs AI
                </p>
            </div>
        `
    });
}
