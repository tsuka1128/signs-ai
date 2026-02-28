# Supabase RLS（Row Level Security）ポリシー一覧

Signs AI では、テナント間のデータ分離を **Row Level Security（RLS）** で実現しています。
全テーブルで RLS を有効にし、認証済みユーザーが自社のデータのみアクセスできるように制御します。

---

## 基本設計思想

```
認証済みユーザー (auth.uid())
  └─ users テーブルで company_id を取得
       └─ company_id が一致する行のみ参照・更新・削除が可能
```

> ⚠️ 新しいテーブルを追加する際は、必ず RLS を有効にしてポリシーを設定してください。
> RLS を有効にしてポリシーを設定しないと、**全データが全ユーザーに見える**状態になります。

---

## テーブル別ポリシー一覧

### 🏢 companies（企業）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `users_own_company` | ALL (読取・更新・削除) | `id` が自分の `company_id` と一致 |

```sql
CREATE POLICY "users_own_company" ON companies
  FOR ALL USING (
    id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );
```

---

### 🏬 departments（部署）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `users_own_company_departments` | ALL | `company_id` が自分の会社と一致 |

```sql
CREATE POLICY "users_own_company_departments" ON departments
  FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );
```

---

### 👤 users（ユーザー）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `users_can_read_own_profile` | SELECT | 自分のレコード (`id = auth.uid()`) のみ |
| `users_can_update_own_profile` | UPDATE | 自分のレコードのみ |

> ℹ️ ユーザーは**自分自身のプロフィールのみ**読み書きできます。
> 他ユーザーの情報は参照不可です（会社の管理者も同様）。

```sql
CREATE POLICY "users_can_read_own_profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_can_update_own_profile" ON users
  FOR UPDATE USING (id = auth.uid());
```

---

### 🎯 kpi_definitions（KPI定義）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `users_own_company_kpi_definitions` | ALL | `company_id` が自分の会社と一致 |

```sql
CREATE POLICY "users_own_company_kpi_definitions" ON kpi_definitions
  FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );
```

---

### 📊 kpi_records（KPI実績値）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `users_own_company_kpi_records` | ALL | 紐づく `kpi_definition` の `company_id` が自分の会社と一致 |

> ℹ️ `kpi_records` 自体には `company_id` がないため、`kpi_definitions` を経由して会社を特定します。

```sql
CREATE POLICY "users_own_company_kpi_records" ON kpi_records
  FOR ALL USING (
    kpi_definition_id IN (
      SELECT id FROM kpi_definitions
      WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    )
  );
```

---

### 💰 resource_records（リソース・人件費）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `users_own_company_resource_records` | ALL | `company_id` が自分の会社と一致 |

---

### 📝 survey_responses（アンケート回答）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `anyone_can_submit_survey` | INSERT | **認証不要**（匿名投稿） |
| `users_can_read_own_survey_responses` | SELECT | `company_id` が自分の会社と一致 |

> ⚠️ **セキュリティ設計上の意図**：アンケートは匿名性を保つため、投稿時に認証を要求しません。
> 閲覧は認証済みの自社ユーザーのみが可能です。

```sql
CREATE POLICY "anyone_can_submit_survey" ON survey_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_can_read_own_survey_responses" ON survey_responses
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );
```

---

### ✅ survey_answers（回答スコア）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `anyone_can_submit_survey_answers` | INSERT | **認証不要**（匿名投稿） |
| `users_can_read_own_survey_answers` | SELECT | 紐づく `survey_response` の `company_id` が自分の会社と一致 |

---

### 🧠 semantic_layers（経営方針）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `users_own_company_semantic_layers` | ALL | `company_id` が自分の会社と一致 |

---

### 🤖 ai_insights（AI診断結果）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `users_own_company_ai_insights` | ALL | `company_id` が自分の会社と一致 |

---

### ✅ action_items（アクション管理）

| ポリシー名 | 操作 | 条件 |
|---|---|---|
| `users_own_company_action_items` | ALL | `company_id` が自分の会社と一致 |

---

### 📋 plans / survey_questions（マスターデータ）

| テーブル | ポリシー名 | 操作 | 条件 |
|---|---|---|---|
| `plans` | `plans_public_read` | SELECT | 誰でも読取可（認証不要） |
| `survey_questions` | `survey_questions_public_read` | SELECT | 誰でも読取可（認証不要） |

> ℹ️ マスターデータは読み取り専用で全員に公開されています。
> 書き込みは Supabase の管理画面からのみ実施します。

---

## 新テーブル追加時のチェックリスト

新しいテーブルを追加する際は、以下を必ず実施してください：

- [ ] `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`
- [ ] `company_id` カラムがある場合 → `company_id IN (SELECT company_id FROM users WHERE id = auth.uid())` で絞り込むポリシーを追加
- [ ] `company_id` がない場合（他テーブル経由） → JOIN または サブクエリで `company_id` まで辿るポリシーを追加
- [ ] マスターデータの場合 → `FOR SELECT USING (true)` で読み取り公開
- [ ] マイグレーションファイルにポリシー SQL を記載

---

## 参考リンク

- [Supabase RLS ドキュメント](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [マイグレーションファイル](../supabase/migrations/001_initial_schema.sql)
