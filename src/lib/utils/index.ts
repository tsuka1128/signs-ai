import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export * from './date';

/**
 * Tailwind クラス結合ユーティリティ
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * ユーザー入力テキストの単純なサニタイジング
 * HTMLタグを無害化（エスケープ）します。
 */
export function sanitizeText(text: string): string {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * ベースURLを取得するユーティリティ
 * 本番、プレビュー、ローカル開発環境のそれぞれで適切なURLを返します。
 */
export const getBaseURL = () => {
    // クライアントサイドでの実行
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // サーバーサイドでの実行
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // 本番環境URL
        (process?.env?.NEXT_PUBLIC_VERCEL_ENV === 'production' && process?.env?.NEXT_PUBLIC_VERCEL_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : null) ??
        'https://signs-ai.jp'; // 最終フォールバックを本番ドメインに

    // 末尾の記号をトリミング
    return url.replace(/\/$/, '');
};

/**
 * パスワードの強度バリデーション
 * @param password 検証対象のパスワード
 * @returns エラーメッセージ（問題ない場合は null）
 */
export function validatePassword(password: string): string | null {
    if (password.length < 8) return "パスワードは8文字以上で入力してください。";
    if (!/[A-Z]/.test(password)) return "大文字を1文字以上含めてください。";
    if (!/[a-z]/.test(password)) return "小文字を1文字以上含めてください。";
    if (!/[0-9]/.test(password)) return "数字を1文字以上含めてください。";
    return null;
}
