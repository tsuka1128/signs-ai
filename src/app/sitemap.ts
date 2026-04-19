import { MetadataRoute } from 'next'

/**
 * サイトマップ生成 (sitemap.ts)
 * 検索エンジンにインデックスさせたい公開ページ（LP、ドキュメントなど）のみをリストアップします。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.signs-ai.jp'
  const now = new Date()

  return [
    {
      url: `${baseUrl}/marketing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/docs/action-guide`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // 必要に応じてLPの子ページや公開記事を追加
  ]
}
