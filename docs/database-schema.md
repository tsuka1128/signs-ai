# Signs AI - 想定データベース（DB）構成案

現在のデモ（ダッシュボード、マトリックス、KPI、アンケート、アクション、セマンティックレイヤー）の挙動から逆算した、本番想定のデータベース（RDB: PostgreSQLやMySQLを想定）のテーブル構成案です。

マルチテナント（複数企業が利用するSaaS）を前提とし、コアとなる概念ごとに整理しています。

---

## 🏢 1. テナント・組織基盤 (Tenant & Organization)
SaaSとしての契約企業情報と、その企業内の組織ツリーを管理します。

*   **`companies` (企業・テナント)**
    *   `id` (PK)
    *   `name` (企業名)
    *   `plan` (契約プラン: Organization / Partner 等)
*   **`departments` (部署)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `name` (部署名: 例 "営業部")
    *   `parent_id` (階層構造用)
*   **`products` (プロダクト)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `name` (プロダクト名: 例 "プロダクトA")
    *   `department_id` (管轄部署がある場合)
*   **`users` (従業員・ユーザー)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `department_id` (FK)
    *   `role` (権限: 経営層, 管理者, マネージャー, 現場)
    *   `name`, `email`

## 📊 2. 業績・リソースデータ (Metrics & Resources)
マトリックス（縦軸・横軸・円サイズ）やKPIダッシュボードを描画するための定量データです。時系列（月次・週次）で蓄積します。

*   **`kpi_definitions` (KPI定義)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `target_type` (対象: Department or Product)
    *   `target_id` (対象ID)
    *   `name` (例: "MRR", "解約率")
    *   `unit` (単位: "万円", "%")
*   **`kpi_records` (KPI実績値)**
    *   `id` (PK)
    *   `kpi_definition_id` (FK)
    *   `recorded_month` (対象年月)
    *   `value` (実績値)
    *   `target_value` (月次目標値)
*   **`resource_records` (リソースと生産性データ)**
    *   `id` (PK)
    *   `target_type` (対象: Department or Product)
    *   `target_id`
    *   `recorded_month` (対象年月)
    *   `head_count` (人数/工数)
    *   `productivity_score` (一人当たり生産性: MRR÷人数などで算出、または独自指標)

## 🗣️ 3. 体温・アンケートデータ (Pulse & Survey)
11個の質問に対する現場の回答（情緒的データ）を管理します。

*   **`survey_questions` (設問マスター)**
    *   `id` (PK)
    *   `text` ("今の仕事にワクワクしていますか？"等)
    *   `hint` (添え書き)
    *   `category` (分類タグ)
*   **`survey_responses` (アンケート回答実績)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `user_id` (FK: 匿名化・集計用)
    *   `recorded_month` (対象年月)
*   **`survey_answers` (各設問のスコア)**
    *   `id` (PK)
    *   `response_id` (FK)
    *   `question_id` (FK)
    *   `score` (1〜5点)
*   *(View)* **`monthly_pulse_scores` (体温スコア集計ビュー)**
    *   部署別・プロダクト別に `survey_answers` を集計し、マトリックスやダッシュボードの「体温（Pulse）」や「天気（Weather）」を出力するView（またはバッチ処理テーブル）。

## 🧠 4. AI・コンテキスト基盤 (AI & Context Layer)
AIがただの一般論ではなく、「その会社固有の事情」を踏まえて診断するためのデータです。

*   **`semantic_layers` (経営方針・地雷ワード等)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `content` (自由記述のMarkdownやJSONテキスト)
    *   `valid_from`, `valid_to` (適用期間)
*   **`ai_insights` (AI生成レポート履歴)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `target_type` (対象: Company, Department, Product)
    *   `target_id`
    *   `audience_role` (誰向けか: 経営層, 現場など)
    *   `recorded_month`
    *   `content` (AIが生成した140文字の診断結果)

## 📌 5. 改善アクション管理 (Action Items)
AIの提言や、人間が設定したTo-Do（今月のアクション）を管理します。

*   **`action_items` (アクション)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `department_id` (FK: 実行責任部署)
    *   `priority` (緊急, 今月中, 継続)
    *   `title`
    *   `description`
    *   `owner_id` (責任者ユーザーID)
    *   `status` (未着手, 進行中, 完了)
    *   `due_date`

---

## 📈 システムアーキテクチャ上のポイント
*   **時系列データ（Snapshot）の重要性**: 「先月と比べて体温がどう変わったか」がプロダクトの肝になるため、ユーザーの所属部署やKPI目標値が変わっても過去データが崩れないよう、月次のスナップショット（Snapshot）としてデータを保存する設計が必要です。
*   **集計とAI推論の分離**: KPIやアンケートスコアの「集計（SQLの得意領域）」と、それをもとにした「テキスト生成・分析（LLMの得意領域）」を分離させます。月末などにバッチ処理で `ai_insights` にレポートを保存（キャッシュ）しておき、画面表示時は即座に読み込む（同期遅延を防ぐ）設計が現実的です。
