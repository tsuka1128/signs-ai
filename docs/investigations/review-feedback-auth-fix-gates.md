# 【レビュー指摘】認証是正migration — Gates宛（条件付き承認）

- **レビュアー**: 塚越（Claude）
- **日付**: 2026-07-03
- **対象**: Gates提案の是正migration（`handle_new_auth_user` / `handle_auth_user_email_confirmed` の role修正＋トリガー再定義）
- **判定**: ✅ **条件付き承認（Approve with changes）** — SQL本体はOK。下記3点を反映のうえ着手可

---

## 是正SQLの評価：中身は正しい

- role を `'player'` に修正 → 制約 `('super_admin','admin','manager','executive','player','partner')` に合致。✓
- AFTER INSERT / AFTER UPDATE トリガーの `DROP IF EXISTS`→`CREATE` は冪等。✓
- 修正後の論理整合を確認済み（OAuth＝AFTER INSERTで`player`生成→onboardingで`admin`上書き／メール確認ON＝AFTER UPDATEで`player`挿入。いずれも制約違反なし）。

---

## 着手前に反映してほしい3点（必須）

### 🔴 1. ファイル名はタイムスタンプ形式に（`092_` はNG）
本番適用済みの最新は `20260621090000`（タイムスタンプ形式）。`092_...` はソート上 `092 < 20260306...` となり、**適用済み移行より過去に挿入される out-of-order migration** になって `supabase db push` の履歴不整合を招く。
→ **`20260703NNNNNN_fix_handle_new_auth_user_role.sql`** にすること。

### 🟠 2. これは「乖離の回復」でもある — 事後diff確認を必須に
`on_auth_user_created`（AFTER INSERT）は **064で作成、その後どのmigrationもDROPしていない**（全DROP TRIGGERをgrep確認済み）。にもかかわらず本番に存在しない＝**SQL Editorでの手動削除による乖離**（CLAUDE.md違反の痕跡、過去の "Database error saving new user" ホットフィックスと推測）。
→ 適用は **migrationファイル→`supabase db push`→`supabase db pull`（または `db diff`）で乖離ゼロを確認**まで。今回は元々乖離しているので**事後diff確認は必須**。PR説明に「手動削除された乖離を回復した」旨を記録すること（再発防止）。

### 🟡 3. 実被害の有無は本番「Confirm email」設定で確定 — 確認を添えて
現状の本番は経路で挙動が分かれる（AFTER INSERT欠損がOAuth破綻を隠している状態）：
- **OAuth**：今も動く（onboardingでプロフィール生成）
- **メール登録・確認OFF**：DBは通る／register画面が「メール確認待ち」で詰まる＝UX破綻のみ
- **メール登録・確認ON**：確認時にAFTER UPDATEで`member`挿入→**CHECK違反で確認失敗＝ここだけ真に破綻**

→ 是正と併せて **Authentication → Email の Confirm email 設定（ON/OFF）を確認・報告**してほしい。ONなら現在ユーザーが実際にブロックされている＝優先度最高。

---

## 別PRでフォロー（この是正migrationには含めない）
- 確認ONの場合：`register/page.tsx` の「メール確認待ち」UX修正（即ログイン→onboarding誘導 等）
- `docs/auth-flow.md:65-68` の「`/` はパブリック」記述の修正（実際は未ログインで `/login` にリダイレクト）

---

## 完了報告でレビューに欲しいもの
1. 新規migrationファイル（タイムスタンプ名）の全文
2. `supabase db push` 後の `supabase db pull` / `db diff` の結果（乖離ゼロの証跡）
3. 本番「Confirm email」設定の現状値
4. （可能なら）捨て垢での新規サインアップ実挙動テスト結果

これらが揃えば最終レビューします。
