# Signs AI - 想定データベース（DB）構成案

現在のデモ（ダッシュボード、マトリックス、KPI、アンケート、アクション、セマンティックレイヤー）の挙動から逆算した、本番想定のデータベース（RDB: PostgreSQLやMySQLを想定）のテーブル構成案です。

マルチテナント（複数企業が利用するSaaS）を前提とし、コアとなる概念ごとに整理しています。

---

## 🏢 1. テナント・組織基盤 (Tenant & Organization)
SaaSとしての契約企業情報と、その企業内の組織ツリーを管理します。

*   **`plans` (プラン定義)**
    *   `id` (PK)
    *   `name` (プラン名: "Free", "Team", "Standard", "Pro")
    *   `max_departments` (最大部署数)
    *   `max_kpis` (最大KPI登録数)
    *   `max_headcount` (最大管理対象人数)
    *   `ai_analysis_frequency` (AI診断の実行回数/月。例: 1回, 4回, 無制限)
    *   `ai_insight_depth` (AI診断の深度: "basic", "advanced", "executive")
    *   `retention_period_months` (データ保存・閲覧期間)
    *   `max_managed_companies` (Partner向け: 管理可能社数)
*   **`companies` (企業・テナント)**
    *   `id` (PK)
    *   `plan_id` (FK: plans.id)
    *   `name` (企業名)
    *   `status` (有効, 停止, トライアル等)
*   **`departments` (部署)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `name` (部署名: 例 "営業部")
    *   `parent_id` (階層構造用)
    *   `headcount` (現在の在籍人数)
*   **`products` (プロダクト)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `name` (プロダクト名: 例 "プロダクトA")
    *   `department_id` (管轄部署がある場合)
*   **`users` (従業員・ユーザー)**
    *   `id` (PK)
    *   `company_id` (FK / null: パートナーの場合)
    *   `department_id` (FK)
    *   `role` (権限: 経営層, 管理者, マネージャー, 現場, **パートナー**)
    *   `name`, `email`
*   **`partner_access_control` (外部パートナーアクセス管理)**
    *   `id` (PK)
    *   `user_id` (FK: Partnerロールのユーザー)
    *   `company_id` (FK: アクセスを許可する企業)
    *   `permissions` (閲覧範囲の定義)

## 📊 2. 業績・リソースデータ (Metrics & Resources)
マトリックス（縦軸・横軸・円サイズ）やKPIダッシュボードを描画するための定量データです。時系列（月次・週次）で蓄積します。

*   **`kpi_definitions` (KPI定義)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `target_type` (対象: Department or Product)
    *   `target_id` (対象ID)
    *   `name` (例: "MRR", "解約率")
    *   `unit` (単位: "万円", "%")
    *   `owner_dept_id` (FK: 主担当部署)
    *   `target_default` (デフォルト目標値 / null)
    *   `sort_order` (表示順序)
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
    *   `labor_cost` (人件費総額/月)
    *   `budget` (予算/月)
    *   `productivity_score` (一人当たり生産性、またはROIスコア)

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
    *   `department_id` (FK: 部署属性のみ保持)
    *   `recorded_month` (対象年月)
    *   `bottleneck_tags` (ボトルネック選択。カンマ区切り)
    *   `cross_dept_feedback` (他部署フィードバック。自由記述)
    *   `free_comment` (本音コメント。自由記述)
    *   `related_kpi` (関連KPI名。プルダウン選択)
    *   *(Note: PIIを完全に排除するため、user_idは保持せず、セッション単位のハッシュ値等で重複回答を制御)*
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
    *   `recorded_month` (分析対象月: 2026-02)
    *   `analysis_date` (実際にAIが診断を実行した日付: 2026-02-28)
    *   `overall_weather` (天気アイコン: ☀️ / ☁️ / ☔️)
    *   `trend_arrow` (推移矢印: ↑ / ↓ / →)
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

## 🔌 6. 外部連携 (Integrations)
外部サービス（Slack, CRM, SmartHR等）との接続情報と、データのマッピングを管理します。

*   **`integrations` (外部サービス接続設定)**
    *   `id` (PK)
    *   `company_id` (FK)
    *   `service_type` (例: "slack", "salesforce", "hubspot", "smarthr")
    *   `credentials` (JSON: APIキー、OAuthトークン、Webhook URL等の秘匿情報参照)
    *   `settings` (JSON: 同期頻度、通知フラグ等の設定)
    *   `last_sync_at` (timestamp)
*   **`integration_mappings` (データ紐付け定義)**
    *   `id` (PK)
    *   `integration_id` (FK)
    *   `local_target_type` (例: "kpi", "resource", "user")
    *   `local_target_id` (FK: kpi_definition_id 等)
    *   `external_field_id` (外部サービス側の項目名・API識別子)
    *   `sync_direction` (例: "import" [CRM等から取得], "export" [Slack通知等])

---

## 📈 システムアーキテクチャ上のポイント
*   **時系列データ（Snapshot）の重要性**: 「先月と比べて体温がどう変わったか」がプロダクトの肝になるため、ユーザーの所属部署やKPI目標値が変わっても過去データが崩れないよう、月次のスナップショット（Snapshot）としてデータを保存する設計が必要です。
*   **集計とAI推論の分離（バッチ実行モデル）**: KPIやアンケートスコアの「集計（SQLの得意領域）」と、それをもとにした「AI診断（LLMの得意領域）」を分離させます。
    *   **診断実行のタイミング**: ユーザーの閲覧ごとにAIを動かすのではなく、月次（または週次）の集計ボタン押下時に一括生成し、`ai_insights` に保存（キャッシュ）。
    *   **分析日の保持**: `analysis_date` を記録することで、「当時どのタイミングのデータを見て診断されたか」を明確にします。
    *   **プランによる実行制御**: `ai_analysis_frequency` に基づき、下位プランは月1回の締め日のみ、上位プランは週次や随時での再診断を許可する設計です。
*   **VC/パートナー向け「総帥」ビュー**: `Role: Partner` は、許可された複数の `company_id` を横断的に集計・閲覧できる。これにより投資先の健全性を「天気」で一括管理可能。
*   **人件費に基づくROI可視化**: マトリックスの縦軸を「1人あたり生産性」から「人件費ROI（利益÷人件費）」に切り替えることで、資本効率の観点での経営判断をサポート。
*   **プランベースの機能アクティベーション**: `plans` テーブルで定義された上限値に基づき、APIレベルでデータの書き込み（バリデーション）やAIのプロンプト強度を制御。企業が成長するにつれてアップセルを促す構造を持たせる。
*   **外部連携の「ハブ」化**: 直接各サービスと密結合するのではなく、`integrations` の設定に基づき、中間プログラムがデータを整形して `kpi_records` や `resource_records` に書き込む。これにより、手入力とAPI自動取得をKPIごとに使い分けられる柔軟性を持たせる。
