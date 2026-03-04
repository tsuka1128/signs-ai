/**
 * ベースURLを取得するユーティリティ
 * 
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
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // VercelのデプロイURL
        'http://localhost:3000';

    // プロトコルの補完
    url = url.includes('http') ? url : `https://${url}`;

    // 末尾の記号をトリミング
    return url.replace(/\/$/, '');
};
