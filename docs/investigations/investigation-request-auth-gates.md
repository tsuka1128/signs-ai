# 【調査依頼】新規ユーザー認証の内部矛盾 — 本番DB実体の確定

- **宛先**: ゲイツ（Gates / エンジニアリング）
- **依頼者**: 塚越（Claudeによる一次調査を添付）
- **起票日**: 2026-07-03
- **優先度**: 🔴 高（"新規ユーザーがサインアップできない"可能性。既存ユーザーは無影響）
- **対象**: Signs AI 本番 Supabase（project-ref: `vefupudpxsmxvuwxhhbo`）

---

## 1. 背景・目的

ホーム刷新PR([#212](https://github.com/tsuka1128/signs-ai/pull/212))のレビューに関連し、認証フローの健全性を精査した結果、**マイグレーション内部に自己矛盾**が見つかった。新規ユーザーのサインアップ可否に直結するため、**本番DBの実体がマイグレーション通りか（＝乖離が無いか）を確定したい**。

CLAUDE.md の方針上、本番の DDL 変更は禁止で乖離の温床になり得るため、「migrationファイルの記述」と「本番の実際の関数・制約定義」が一致しているかを客観確認するのが本依頼の主眼。

---

## 2. すでに確定していること（一次調査・要再確認不要）

コード／migration の突き合わせで確定済み：

1. **`role='member'` を挿入するトリガーが最終状態**
   - `064` がトリガー新規作成（role=`member`）
   - `066` がトリガーを role=`player` に修正 ＋ `users_role_check` 制約を追加：
     `CHECK (role IN ('super_admin','admin','executive','manager','player','partner'))`
     （[066:14](supabase/migrations/066_normalize_roles_and_notify_settings.sql), [066:97](supabase/migrations/066_normalize_roles_and_notify_settings.sql)）
   - `075` が同じ許可セットで制約を再定義
   - ⚠️ **`081` がトリガーを role=`member` に逆戻り**させ、UPDATE用の第2トリガーも `member` を挿入（[081:12,26](supabase/migrations/081_update_handle_new_auth_user_for_email_confirm.sql)）
   - `082` は別トリガー追加のみ → **`081` の `member` が最終形**

2. **`member` は `users_role_check` の許可セットに含まれない**
   → migration通りに本番適用されているなら、**新規 auth ユーザー作成時にトリガーの INSERT が CHECK 制約違反で例外 → auth ユーザー作成ごと失敗**（Supabase典型症状: "Database error saving new user"）。
   影響は**新規ユーザー限定**。既存ユーザーは `AFTER INSERT` が走らず（ON CONFLICT DO NOTHING以前に新規行が無い）無影響。

3. **`supabase migration list`（本番接続・実行済み）で 081・082 は Remote 適用済みを確認済み**
   → 「migrationは流れている」ことは確定。**残る不確定は"SQL Editor等での事後改変による乖離が無いか"のみ。**

### 一次調査で"確定した別の矛盾"（本件とは別、参考）
- **ドキュメント誤り**: `docs/auth-flow.md:65-68` は「`/` はパブリック」と記載だが、`middleware.ts:33` の `publicPrefixes` に `/` は無い → 未ログインで `/` は `/login` にリダイレクト（再現確認済み）。ドキュメント修正が必要。
- **メール確認UXの不整合**: `config.toml:226` は `enable_confirmations = false`（※ローカルのみの設定）だが `register/page.tsx:90-106` は「メール確認してください／Waiting...」を表示。本番の確認設定次第で"来ないメールを待つ画面で詰む"。→ 下記④で本番設定を要確認。
- **onboarding**: ロールバックは実装済み（`api/onboarding/route.ts:20-34`）。ただし真のトランザクションではなく補償削除で、`SUPABASE_SERVICE_ROLE_KEY` 未設定時はゾンビ企業が残る。

---

## 3. ゲイツに実施してほしいこと

> 塚越ローカル環境では **Docker未インストール & DBパスワード未保管**のため、`supabase db diff/pull/dump`（Docker必須）が全て実行不可でした。以下は Docker もしくは本番DB権限を持つ環境で実施をお願いします。

### ① 本番の実体 vs migration の乖離検出（CLIパス・Docker必要）
```bash
cd signs-ai
supabase db diff --linked --schema public   # 差分が出れば本番が乖離している
# もしくは
supabase db pull --schema public            # 生成される remote_schema.sql を確認（不要ならcommitしない）
```
- **期待**: 差分なし（＝本番＝migration＝`member`トリガー＋制約が生きている＝バグ確定）
- **差分あり**: 誰かが SQL Editor でトリガー/制約を改変した乖離。中身を確認。

### ② 本番の実定義を直接確認（ダッシュボード SQL Editor・読み取りのみ／DDLは実行しない）
以下は**すべて SELECT（読み取り専用）**。CLAUDE.md が禁じる ALTER/DDL は含みません。

```sql
-- (a) プロフィール生成トリガー関数の実体（role に何を入れているか）
SELECT pg_get_functiondef('public.handle_new_auth_user'::regprocedure);
SELECT pg_get_functiondef('public.handle_auth_user_email_confirmed'::regprocedure);

-- (b) role の CHECK 制約の実体
SELECT conname, pg_get_constraintdef(oid)
FROM   pg_constraint
WHERE  conrelid = 'public.users'::regclass AND contype = 'c';

-- (c) auth.users 上のトリガー有無・有効状態
SELECT tgname, tgenabled, tgrelid::regclass
FROM   pg_trigger
WHERE  tgrelid = 'auth.users'::regclass AND NOT tgisinternal;

-- (d) 既存ユーザーに 'member' 等の不正ロールが残っていないか
SELECT role, count(*) FROM public.users GROUP BY role ORDER BY 2 DESC;
```

### ③ （任意・確証が欲しい場合）本番での新規サインアップ実挙動テスト
- 使い捨てGoogleアカウント or 捨てメールで**実際に新規サインアップ**し、"Database error saving new user" 等が出るか観察。
- 出た場合 → バグ確定。テストで作られた auth ユーザーは後で削除。

### ④ ダッシュボードでしか分からない設定（本件の周辺確認）
- **Authentication → Providers/Email**: `Confirm email`（メール確認）の **ON/OFF**
- **Authentication → URL Configuration**: Redirect URLs に本番ドメイン（`https://signs-ai.jp` 等）が入っているか
- **Authentication → Email Templates（Confirm signup）**: リンクが `...?code=...` 形式か `...token_hash=...&type=signup` 形式か
  - `token_hash` 形式だと `auth/callback/route.ts:18` が `code` しか処理せず `no_code` で弾く恐れ

---

## 4. 判定ツリー（結果→結論）

| ①/②の結果 | 結論 | 対応 |
|---|---|---|
| 乖離なし＝本番トリガーが `member` を挿入 & 制約が `member` を禁止 | **新規サインアップ不可（確定）** | 是正migration（トリガーを`player`へ）を最優先で作成・push |
| 本番トリガーは `player`（＝SQL Editorで事後修正済み） | 動作はするが**migrationと本番が乖離** | migrationを本番実体に合わせて是正（081を打ち消す新規migration） |
| 制約が本番に存在しない | 動作はするが `member`（無効ロール）で一時作成→onboardingで`admin`上書き | 制約を正しく適用 or トリガーを`player`へ。整合を回復 |

④の結果：
- 確認 **OFF** なら → register画面の「メール確認して」UIを"即ログイン→onboarding誘導"に修正
- 確認 **ON** なら → メールテンプレートのリンク形式と callback の整合を確認

---

## 5. 報告してほしいフォーマット（Notion/PRコメント）
- ①差分の有無（あれば全文）
- ②(a)(b)(c)(d) の出力そのまま
- ④の4設定の現状値
- 総合判定（上表のどれに該当するか）

これが揃えば、是正migration（案：`092_fix_handle_new_auth_user_role.sql` でトリガーの role を `player` に戻す）を確定して着手できます。

---

## 付録：参考ファイル
- `supabase/migrations/081_update_handle_new_auth_user_for_email_confirm.sql`（← 原因）
- `supabase/migrations/066_normalize_roles_and_notify_settings.sql`（← 制約とplayer修正）
- `supabase/migrations/075_add_manager_role.sql`
- `src/app/auth/callback/route.ts` / `src/lib/auth.ts` / `src/app/register/page.tsx`
- `src/middleware.ts` / `docs/auth-flow.md`
