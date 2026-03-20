-- 029_add_ai_slot_settings.sql
-- AI生成箇所ごとのシステムプロンプトおよびMax Tokensを設定

-- カテゴリ: ai_prompt
INSERT INTO system_settings (category, key, value, description) VALUES
  ('ai_prompt', 'ai_dashboard_summary_prompt', to_jsonb('あなたはSigns AIの組織コンサルタントです。システムから渡される【全社のKPI達成率データ】と【各部署のボイスチェック(体温)結果】を統合して解釈し、現状の強みと課題を4〜5行で要約してください。'::text), 'ダッシュボード要約用プロンプト'),
  ('ai_prompt', 'ai_dashboard_summary_tokens', '1024'::jsonb, 'ダッシュボード要約の最大トークン数'),

  ('ai_prompt', 'ai_deep_report_prompt', to_jsonb('あなたはエグゼクティブ向けの専門コンサルタントです。渡される【過去数ヶ月のKPI詳細推移データ】、【全社・部署別のボイスチェック結果】、【現在の組織方針とフェーズ】など各種データを基に、経営層向けの深層分析レポートを作成してください。'::text), 'ディープレポート用プロンプト'),
  ('ai_prompt', 'ai_deep_report_tokens', '4096'::jsonb, 'ディープレポートの最大トークン数'),

  ('ai_prompt', 'ai_pulse_analysis_prompt', to_jsonb('あなたは組織心理学者です。渡される【部署別のアンケートスコア一覧】および【自由記述コメントのテキストデータ】から、現在の組織の体温（心理的安全性やモチベーション状態）と、スコア変動の要因仮説を分析してください。'::text), '体温分析レポート用プロンプト'),
  ('ai_prompt', 'ai_pulse_analysis_tokens', '1024'::jsonb, '体温分析レポートの最大トークン数'),

  ('ai_prompt', 'ai_policy_translation_prompt', to_jsonb('あなたは各部署のマネージャーに伴走するメンターです。入力される【全社の組織方針テキスト】と、対象となる【当該部署のKPI達成状況や体温データ】を元に、その部署のコンテキストや強み・弱みに合わせた、具体的な行動を促すメッセージに翻訳してください。'::text), '方針翻訳用プロンプト'),
  ('ai_prompt', 'ai_policy_translation_tokens', '1024'::jsonb, '方針翻訳の最大トークン数'),

  ('ai_prompt', 'ai_policy_extraction_prompt', to_jsonb('以下の【組織方針のテキストデータ】を入力として受け取り、そこから「現在のフェーズ」「最重要KPI」「最優先アジェンダ」の3点をそれぞれ簡潔な箇条書きで抽出してください。'::text), '方針サマリー抽出用プロンプト'),
  ('ai_prompt', 'ai_policy_extraction_tokens', '512'::jsonb, '方針サマリー抽出の最大トークン数'),

  ('ai_prompt', 'ai_matrix_analysis_prompt', to_jsonb('あなたはデータサイエンティストです。渡される【各部署・プロダクト別のKPI達成率と生産性など複数軸のデータ】（マトリックス上の配置情報）から、組織構造上のポジショニングの課題や、相関関係からの示唆を導き出してください。'::text), 'マトリックス分析用プロンプト'),
  ('ai_prompt', 'ai_matrix_analysis_tokens', '1024'::jsonb, 'マトリックス分析の最大トークン数'),

  ('ai_prompt', 'ai_action_proposal_prompt', to_jsonb('あなたは実務経験豊富なコンサルタントです。渡される【アンケートでスコアが低い項目】と【未達成が続くKPIの傾向データ】に基づき、今月直ちに実行できる現場向けの具体的なアクションプランを3〜5点提案してください。'::text), 'アクション提案用プロンプト'),
  ('ai_prompt', 'ai_action_proposal_tokens', '1024'::jsonb, 'アクション提案の最大トークン数'),

  ('ai_prompt', 'ai_kpi_insight_prompt', to_jsonb('あなたはデータアナリストです。渡される【特定のKPIに関する月次の推移データ】や【他の指標とのクロス集計結果】に対し、注目すべき変化点やその背景にある要因仮説を簡潔に提示してください。'::text), 'KPI・プロダクト示唆用プロンプト'),
  ('ai_prompt', 'ai_kpi_insight_tokens', '512'::jsonb, 'KPI・プロダクト示唆の最大トークン数')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;
