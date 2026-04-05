-- 052_update_plans_and_features.sql
-- プラン別機能制限の追加

-- =====================================================
-- 1. plans テーブルに新カラム追加
-- =====================================================
ALTER TABLE plans ADD COLUMN IF NOT EXISTS enable_second_axis BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS enable_slack BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS enable_labor_analytics BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS enable_pdf_export BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS ai_badge_frequency TEXT NOT NULL DEFAULT 'monthly';  -- 'monthly', 'weekly'
ALTER TABLE plans ADD COLUMN IF NOT EXISTS manual_ai_runs_per_month INT NOT NULL DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS extra_member_unit INT DEFAULT NULL;       -- 超過課金の単位人数
ALTER TABLE plans ADD COLUMN IF NOT EXISTS extra_member_price INT DEFAULT NULL;      -- 超過1単位あたり金額(円)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_duration_days INT DEFAULT NULL;     -- トライアル期間(日)

-- =====================================================
-- 2. plans データの更新 (確定案に基づく)
-- =====================================================

-- Free (トライアル: Standard相当)
UPDATE plans SET 
  max_departments = 99,                   -- 無制限
  max_kpis = 10, 
  max_headcount = 50,
  ai_analysis_frequency = 1, 
  ai_insight_depth = 'advanced',
  retention_period_months = 3,
  enable_second_axis = TRUE, 
  enable_slack = TRUE,
  enable_labor_analytics = FALSE, 
  enable_pdf_export = FALSE,
  ai_badge_frequency = 'monthly', 
  manual_ai_runs_per_month = 2,           -- Standard同等
  trial_duration_days = 70                -- 70日間限定
WHERE name = 'Free';

-- Team
UPDATE plans SET 
  max_departments = 3,                    -- 3部署制限
  max_kpis = 5, 
  max_headcount = 20,
  ai_analysis_frequency = 1, 
  ai_insight_depth = 'basic',
  retention_period_months = 6,
  enable_second_axis = FALSE, 
  enable_slack = FALSE,
  enable_labor_analytics = FALSE, 
  enable_pdf_export = FALSE,
  ai_badge_frequency = 'monthly', 
  manual_ai_runs_per_month = 1
WHERE name = 'Team';

-- Standard
UPDATE plans SET 
  max_departments = 99, 
  max_kpis = 10, 
  max_headcount = 50,
  ai_analysis_frequency = 1, 
  ai_insight_depth = 'advanced',
  retention_period_months = 12,
  enable_second_axis = TRUE, 
  enable_slack = TRUE,
  enable_labor_analytics = FALSE, 
  enable_pdf_export = FALSE,
  ai_badge_frequency = 'monthly', 
  manual_ai_runs_per_month = 2
WHERE name = 'Standard';

-- Pro
UPDATE plans SET 
  max_departments = 99, 
  max_kpis = 99, 
  max_headcount = 100,
  ai_analysis_frequency = 4, 
  ai_insight_depth = 'executive',
  retention_period_months = 36,
  enable_second_axis = TRUE, 
  enable_slack = TRUE,
  enable_labor_analytics = TRUE,          -- 人件費ROI標準搭載
  enable_pdf_export = TRUE,
  ai_badge_frequency = 'weekly',          -- 週次バッジ
  manual_ai_runs_per_month = 4,           -- 手動4回
  extra_member_unit = 100, 
  extra_member_price = 10000
WHERE name = 'Pro';

-- =====================================================
-- 3. companies テーブルにオプションフラグ追加
-- =====================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS addon_labor_analytics BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN companies.addon_labor_analytics IS '人件費・ROI分析オプションの有効化フラグ (Proプラン以外用)';
