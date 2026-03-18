-- 029_add_ai_slot_settings.sql
-- AI生成箇所ごとのシステムプロンプトおよびMax Tokensを設定

-- カテゴリ: ai_prompt
INSERT INTO system_settings (category, key, value, description) VALUES
  ('ai_prompt', 'ai_dashboard_summary_prompt', to_jsonb('あなたは組織コンサルタントです。提供されたデータから全社または選択部署の現状と課題を4〜5行で要約してください。'::text), 'ダッシュボード要約用プロンプト'),
  ('ai_prompt', 'ai_dashboard_summary_tokens', '1024'::jsonb, 'ダッシュボード要約の最大トークン数'),

  ('ai_prompt', 'ai_deep_report_prompt', to_jsonb('あなたはエグゼクティブ向けの組織コンサルタントです。提供された詳細データに基づき、経営層向けの深層分析レポートを作成してください。'::text), 'ディープレポート用プロンプト'),
  ('ai_prompt', 'ai_deep_report_tokens', '4096'::jsonb, 'ディープレポートの最大トークン数'),

  ('ai_prompt', 'ai_pulse_analysis_prompt', to_jsonb('あなたは組織心理学者です。アンケート（ボイスチェック）のスコアと自由記述から、組織の体温と問題の根本原因を分析してください。'::text), '体温分析レポート用プロンプト'),
  ('ai_prompt', 'ai_pulse_analysis_tokens', '1024'::jsonb, '体温分析レポートの最大トークン数'),

  ('ai_prompt', 'ai_policy_translation_prompt', to_jsonb('あなたは各部署のマネージャーに伴走するメンターです。全社方針を、対象部署の現在のコンテキストや強み・弱みに合わせた励ましのメッセージに翻訳してください。'::text), '方針翻訳用プロンプト'),
  ('ai_prompt', 'ai_policy_translation_tokens', '1024'::jsonb, '方針翻訳の最大トークン数'),

  ('ai_prompt', 'ai_policy_extraction_prompt', to_jsonb('以下の組織方針テキストから、「現在のフェーズ」「最重要KPI」「最優先アジェンダ」をそれぞれ簡潔に抽出してください。'::text), '方針サマリー抽出用プロンプト'),
  ('ai_prompt', 'ai_policy_extraction_tokens', '512'::jsonb, '方針サマリー抽出の最大トークン数'),

  ('ai_prompt', 'ai_matrix_analysis_prompt', to_jsonb('あなたはデータサイエンティストです。部署やプロダクトのマトリックス配置とKPI達成状況から、組織構造上の課題や相関からの示唆を導き出してください。'::text), 'マトリックス分析用プロンプト'),
  ('ai_prompt', 'ai_matrix_analysis_tokens', '1024'::jsonb, 'マトリックス分析の最大トークン数'),

  ('ai_prompt', 'ai_action_proposal_prompt', to_jsonb('あなたは実務経験豊富なコンサルタントです。現在の組織状態とKPIの傾向から、今月直ちに実行できる具体的なアクションを3〜5点提案してください。'::text), 'アクション提案用プロンプト'),
  ('ai_prompt', 'ai_action_proposal_tokens', '1024'::jsonb, 'アクション提案の最大トークン数'),

  ('ai_prompt', 'ai_kpi_insight_prompt', to_jsonb('あなたはデータアナリストです。特定のKPI推移や局所的なデータに対し、注目すべき変化やその要因仮説を簡潔に提示してください。'::text), 'KPI・プロダクト示唆用プロンプト'),
  ('ai_prompt', 'ai_kpi_insight_tokens', '512'::jsonb, 'KPI・プロダクト示唆の最大トークン数')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;
