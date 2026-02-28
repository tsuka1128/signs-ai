# 外部サービス設定ガイド

Signs AI が依存する外部サービスの設定箇所と変更手順をまとめます。

---

## 1. Supabase

**用途:** 認証（Google OAuth）・データベース・Row Level Security

### 設定画面へのアクセス

| 設定 | URL |
|---|---|
| ダッシュボード TOP | https://supabase.com/dashboard/project/vefupudpxsmxvuwxhhbo |
| テーブルエディタ | https://supabase.com/dashboard/project/vefupudpxsmxvuwxhhbo/editor |
| 認証設定 | https://supabase.com/dashboard/project/vefupudpxsmxvuwxhhbo/auth/providers |
| Redirect URLs | https://supabase.com/dashboard/project/vefupudpxsmxvuwxhhbo/auth/url-configuration |
| RLS ポリシー | https://supabase.com/dashboard/project/vefupudpxsmxvuwxhhbo/auth/policies |
| API キー | https://supabase.com/dashboard/project/vefupudpxsmxvuwxhhbo/settings/api |
| SQL エディタ | https://supabase.com/dashboard/project/vefupudpxsmxvuwxhhbo/sql |

### 変更が必要なケース

| ケース | 変更箇所 |
|---|---|
| 新しいドメインで本番デプロイ | Redirect URLs に `https://<新ドメイン>/auth/callback` を追加 |
| API キーの再発行 | API キー画面から再生成 → Vercel 環境変数を更新 → Redeploy |
| テーブル・RLS の変更 | SQL エディタでマイグレーション実行 |

---

## 2. Google Cloud Console

**用途:** Google OAuth 2.0 認証

### 設定画面へのアクセス

| 設定 | URL |
|---|---|
| OAuth クライアント設定 | https://console.cloud.google.com/apis/credentials/oauthclient/884101511390-0171nu8bsf9np85m2r4b5fd9rlaberkn.apps.googleusercontent.com |
| 認証情報一覧 | https://console.cloud.google.com/apis/credentials |

### 変更が必要なケース

| ケース | 変更箇所 |
|---|---|
| 新しいドメインで本番デプロイ | **承認済みのリダイレクト URI** に `https://<新ドメイン>/auth/callback` を追加 |
| クライアントシークレットの再発行 | OAuth クライアント画面から「シークレットをリセット」→ `.env.local` と Vercel 環境変数を更新 |

---

## 3. Vercel

**用途:** Next.js アプリのホスティング・CI/CD

### 設定画面へのアクセス

| 設定 | 手順 |
|---|---|
| プロジェクト TOP | Vercel ダッシュボード → `signs-ai` プロジェクト |
| 環境変数 | プロジェクト → Settings → Environment Variables |
| ドメイン設定 | プロジェクト → Settings → Domains |
| デプロイ履歴 | プロジェクト → Deployments |

### 環境変数一覧

| Key | 説明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL（`.co` ドメイン）|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon（公開）キー |

> ⚠️ 環境変数を追加・変更した後は必ず **Redeploy** が必要です。

### GitHub 連携

- `main` ブランチへのプッシュで自動デプロイ
- リポジトリ: https://github.com/tsuka1128/signs-ai

---

## 4. GitHub

**用途:** ソースコード管理・Vercel との CI/CD 連携

| 項目 | 内容 |
|---|---|
| リポジトリ | https://github.com/tsuka1128/signs-ai |
| デフォルトブランチ | `main` |
| 自動デプロイ | `main` へのプッシュで Vercel が自動ビルド |

---

## 設定変更時のチェックリスト

新しい本番ドメインを追加する場合は以下をすべて実施してください：

- [ ] **Supabase** → Redirect URLs に `https://<新ドメイン>/auth/callback` を追加
- [ ] **Google Cloud** → 承認済みリダイレクト URI に `https://<新ドメイン>/auth/callback` を追加
- [ ] **Vercel** → カスタムドメインを Settings → Domains で設定
- [ ] ブラウザの**シークレットウィンドウ**でログインテストを実施
