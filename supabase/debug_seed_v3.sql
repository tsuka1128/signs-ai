-- =====================================================
-- 実行状況確認 & データ再投入スクリプト (v3)
-- =====================================================

DO $$
DECLARE
  comp_id UUID;
  comp_name TEXT;
  kpi_rec RECORD;
  rec_count INT;
  target_month_str TEXT;
  i INT;
  month_offset INT;
  base_date DATE := CURRENT_DATE;
BEGIN
  -- 1. 企業の特定
  SELECT id, name INTO comp_id, comp_name FROM companies WHERE short_id = 'F-260305-7C78';
  
  IF comp_id IS NULL THEN
    RAISE NOTICE '❌ ERROR: short_id F-260305-7C78 が見つかりませんでした。名前で検索します。';
    SELECT id, name INTO comp_id, comp_name FROM companies WHERE name LIKE '%TAION%' LIMIT 1;
  END IF;

  IF comp_id IS NULL THEN
    RAISE EXCEPTION '❌ FATAL: 企業を特定できませんでした。';
  END IF;

  RAISE NOTICE '✅ Target Company Found: % (%)', comp_name, comp_id;

  -- 2. KPI定義のリストアップ
  RAISE NOTICE '--- KPI Definitions ---';
  FOR kpi_rec IN SELECT id, name, is_main FROM kpi_definitions WHERE company_id = comp_id LOOP
    RAISE NOTICE ' - KPI Found: % (id: %, main: %)', kpi_rec.name, kpi_rec.id, kpi_rec.is_main;
  END LOOP;

  -- 3. データのクリーンアップ
  DELETE FROM kpi_records WHERE kpi_definition_id IN (SELECT id FROM kpi_definitions WHERE company_id = comp_id);
  GET DIAGNOSTICS rec_count = ROW_COUNT;
  RAISE NOTICE '✅ Deleted % existing kpi_records.', rec_count;

  -- 4. データの投入 (2ヶ月分に絞ってテスト的に実行)
  FOR i IN 0..5 LOOP -- ひとまず5ヶ月分
    month_offset := i;
    target_month_str := to_char(date_trunc('month', base_date) - (month_offset || ' month')::INTERVAL, 'YYYY-MM-01');
    
    FOR kpi_rec IN SELECT id, name FROM kpi_definitions WHERE company_id = comp_id LOOP
      INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value)
      VALUES (kpi_rec.id, target_month_str::DATE, 100 + floor(random() * 50), 100);
      
      RAISE NOTICE '   > Created % for %', target_month_str, kpi_rec.name;
    END LOOP;
  END LOOP;

  RAISE NOTICE '🚀 Execution finished successfully.';
END $$;
