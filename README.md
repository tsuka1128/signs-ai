# Signs AI

組織の「体温」を可視化するダッシュボードアプリ。KPIと現場の声を組み合わせ、AIが経営者向けに組織状態を分析・提案します。

## 技術スタック

- **フレームワーク:** Next.js 16 (App Router)
- **認証 / DB:** Supabase (Google OAuth)
- **デプロイ:** Vercel
- **スタイリング:** Tailwind CSS

---

## ローカル開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/tsuka1128/signs-ai.git
cd signs-ai
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` を作成し、以下を記載：

```env
# Supabase 接続情報（.co ドメインに注意）
NEXT_PUBLIC_SUPABASE_URL=https://vefupudpxsmxvuwxhhbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase の anon key>

# Google OAuth（Supabase Auth 経由で使用）
GOOGLE_CLIENT_ID=<Google Cloud Console の クライアントID>
GOOGLE_CLIENT_SECRET=<Google Cloud Console の クライアントシークレット>
```

> ⚠️ `.env.local` は `.gitignore` に含まれています。絶対にコミットしないでください。

### 3. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセスできます。

---

## 本番環境へのデプロイ手順

### ① Vercel への環境変数の追加

Vercel ダッシュボード → `signs-ai` プロジェクト → **Settings** → **Environment Variables** で以下を登録：

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vefupudpxsmxvuwxhhbo.supabase.co`（`.co` に注意） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon key |

登録後、最新の Deployment を **Redeploy** する。

---

### ② Supabase の Redirect URL 設定

[Supabase ダッシュボード → Authentication → URL Configuration](https://supabase.com/dashboard/project/vefupudpxsmxvuwxhhbo/auth/url-configuration) を開き、**Redirect URLs** に以下を追加：

```
https://signs-ai.vercel.app/auth/callback
http://localhost:3000/auth/callback  ← ローカル開発用（既存）
```

---

### ③ Google Cloud Console の OAuth 設定

[Google Cloud Console → OAuth 2.0 クライアント](https://console.cloud.google.com/apis/credentials/oauthclient/884101511390-0171nu8bsf9np85m2r4b5fd9rlaberkn.apps.googleusercontent.com) を開き、**承認済みのリダイレクト URI** に以下を追加：

```
https://signs-ai.vercel.app/auth/callback
http://localhost:3000/auth/callback  ← ローカル開発用（既存）
```

---

### ④ GitHub → Vercel 自動デプロイ

`main` ブランチへのプッシュで Vercel が自動デプロイします。

```bash
git add -A
git commit -m "feat: ..."
git push origin main
```

---

## 主な画面一覧

| URL | 説明 |
|---|---|
| `/` | ダッシュボード（メイン画面） |
| `/login` | ログイン画面（Google OAuth） |
| `/onboarding` | 初回セットアップ（企業・部署・KPI登録） |
| `/settings` | 組織情報管理（企業・部署・KPI の編集） |
| `/kpi` | 毎月のKPI入力 |
| `/form` | 匿名アンケート回答 |
| `/marketing` | マーケティング LP |

---

## 注意事項

- Supabase URL は **`.supabase.co`**（`.com` ではない）
- 環境変数追加後は必ず **Redeploy** すること
- `signs-ai.vercel.app` でログインするには上記 ②③ の設定が必要
