# Signs AI

組織の「体温」を可視化するダッシュボードアプリ。KPIと現場の声を組み合わせ、AIが経営者向けに組織状態を分析・提案します。

## 1. 核心的な設計思想 (Core Philosophy)

SignsAIは、Gallup社の「State of the Global Workplace」レポートが提唱する**「エンゲージメント（体温）が経営KPIを左右する」**という構造的課題を解決するためのプロダクトです。

- **KPI × 体温のクロス分析**: 業績（数字）と組織状態（感情）を分離せず、一つのダッシュボードで統合管理します。
- **マネージャーへの意思決定支援**: チームのエンゲージメント分散の70%を決定づけるマネージャーに対し、AIが「今、何をすべきか」を断言します。
- **予兆（Signs）管理**: 問題が顕在化する前の微かな変化を捉え、先行指標による組織運営を可能にします。

詳細な設計思想と理論的根拠については、[docs/PHILOSOPHY.md](docs/PHILOSOPHY.md) を参照してください。

## 2. 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **認証 / DB**: Supabase (PostgreSQL, Auth, RLS)
- **AI**: Claude API (Anthropic)
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel

## 3. 画面・機能一覧

### 3-1. 主な画面一覧

| URL | 説明 |
|---|---|
| `/` | トップダッシュボード（KPI×体温分析、AI診断） |
| `/login` | ログイン |
| `/register` | 新規登録 |
| `/forgot-password` | パスワードリセット申請 |
| `/password-update` | パスワード更新 |
| `/onboarding` | 初回セットアップ（企業・部署・KPI登録） |
| `/kpi` | KPI入力画面 |
| `/form` | 匿名アンケート回答 |
| `/survey` | アンケート管理（管理者向け） |
| `/voice-check` | ボイスチェック |
| `/settings` | 企業・プロフィール設定 |
| `/marketing` | マーケティングLP |
| `/privacy` | プライバシーポリシー |
| `/terms` | 利用規約 |
| `/docs` | ドキュメントハブ |
| `/admin` | システム管理者ダッシュボード（Antigravity社内用） |

### 3-2. インフラ・連携

| URL | 役割 |
|---|---|
| `/auth/callback` | OAuth連携リダイレクト処理 |

---

## 4. 開発環境のセットアップ

### 4-1. リポジトリのクローンとインストール

```bash
git clone https://github.com/tsuka1128/signs-ai.git
cd signs-ai
npm install
```

### 4-2. 環境変数の設定

`.env.local` を作成し、以下の項目を設定してください。

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Anthropic (Claude API)
ANTHROPIC_API_KEY=<your-claude-api-key>

# Google Cloud (Service Account for Sheets API)
GOOGLE_SERVICE_ACCOUNT_EMAIL=<your-service-account-email>
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4-3. Google OAuth の設定（任意）

Googleログインを有効にする場合は、[Google Cloud Console](https://console.cloud.google.com/apis/credentials) で OAuth 2.0 クライアント ID を作成し、リダイレクト URI に `http://localhost:3000/auth/callback` を追加してください。

---

## 5. デプロイ手順

1. 変更をステージング（ファイル/ディレクトリを明示すること）
   ```bash
   git add <変更したファイルを明示>
   ```
2. コミット
   ```bash
   git commit -m "feat: ..."
   ```
3. GitHub へプッシュ
   ```bash
   git push origin <branch-name>
   ```
4. Vercel でデプロイ状況を確認

---

## 6. ドキュメント

詳細な仕様については `docs/` ディレクトリ内の各ファイルを参照してください。

- [PHILOSOPHY.md](docs/PHILOSOPHY.md): 設計思想と理論的根拠
- [signs-ai-requirements.md](docs/signs-ai-requirements.md): MVP 要件定義書
- [database-schema.md](docs/database-schema.md): データベース設計
- [rls-policies.md](docs/rls-policies.md): セキュリティ（行レベル分離）設計
