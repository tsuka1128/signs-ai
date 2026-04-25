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
