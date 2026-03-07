-- =====================================================
-- 企業 F-260305-7C78 向けリッチデータ生成スクリプト (修正版)
-- 日付形式を YYYY-MM-01 に統一
-- =====================================================

DO $$
DECLARE
  comp_id UUID;
  comp_name TEXT;
  target_month TEXT;
  dept_rec RECORD;
  axis_rec RECORD;
  kpi_rec RECORD;
  base_date DATE := CURRENT_DATE;
  i INT;
  month_offset INT;
  rand_val NUMERIC;
  rand_target NUMERIC;
  base_headcount INT;
BEGIN
  -- 1. 企業UUIDを取得
  SELECT id, name INTO comp_id, comp_name FROM companies WHERE short_id = 'F-260305-7C78';
  
  IF comp_id IS NULL THEN
    -- short_id がまだ設定されていない可能性を考慮し、名前でも探す（デモ用）
    SELECT id, name INTO comp_id, comp_name FROM companies WHERE name LIKE '%TAION%' LIMIT 1;
  END IF;

  IF comp_id IS NULL THEN
    RAISE EXCEPTION '対象の企業が見つかりませんでした。short_id または名前を確認してください。';
  END IF;

  RAISE NOTICE 'Target Company: % (%)', comp_name, comp_id;

  -- 2. 既存の履歴データをクリア
  DELETE FROM kpi_records WHERE kpi_definition_id IN (SELECT id FROM kpi_definitions WHERE company_id = comp_id);
  DELETE FROM resource_records WHERE company_id = comp_id;
  DELETE FROM survey_responses WHERE company_id = comp_id;

  -- 3. 過去13ヶ月分 (今月 + 12ヶ月) 生成
  FOR i IN 0..12 LOOP
    month_offset := 12 - i;
    -- フォーマットを YYYY-MM-01 に変更（フロントエンドの期待値に合わせる）
    target_month := to_char(base_date - (month_offset || ' month')::INTERVAL, 'YYYY-MM') || '-01';
    
    -- A. 部署ごとの人数推移
    FOR dept_rec IN SELECT id, headcount FROM departments WHERE company_id = comp_id LOOP
      base_headcount := GREATEST(1, dept_rec.headcount - (month_offset / 3) + floor(random() * 3 - 1));
      
      INSERT INTO resource_records (company_id, department_id, recorded_month, head_count, labor_cost)
      VALUES (comp_id, dept_rec.id, target_month, base_headcount, base_headcount * 550000 + (random() * 500000));
    END LOOP;

    -- B. 第2軸
    FOR axis_rec IN SELECT id, headcount FROM kpi_axes WHERE company_id = comp_id LOOP
      base_headcount := GREATEST(1, axis_rec.headcount - (month_offset / 4) + floor(random() * 2 - 1));
      INSERT INTO resource_records (company_id, axis_id, recorded_month, head_count)
      VALUES (comp_id, axis_rec.id, target_month, base_headcount);
    END LOOP;

    -- C. KPI実績値
    FOR kpi_rec IN SELECT id, target_default, name FROM kpi_definitions WHERE company_id = comp_id LOOP
      rand_target := COALESCE(kpi_rec.target_default, 100);
      rand_val := rand_target * (0.8 + random() * 0.4); 
      
      -- 全社・部署平均データ
      INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value)
      VALUES (kpi_rec.id, target_month, rand_val, rand_target);

      -- 第2軸ごと
      FOR axis_rec IN SELECT id FROM kpi_axes WHERE company_id = comp_id LOOP
        INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value, axis_id)
        VALUES (kpi_rec.id, target_month, (rand_val / 3) * (0.5 + random()), rand_target / 3, axis_rec.id);
      END LOOP;
    END LOOP;

    -- D. アンケート回答
    FOR dept_rec IN SELECT id FROM departments WHERE company_id = comp_id LOOP
      FOR j IN 1..3 LOOP
        DECLARE
          resp_id UUID;
          pulse_level FLOAT := 3.0 + random() * 2.0;
        BEGIN
          INSERT INTO survey_responses (company_id, department_id, recorded_month, submitted_at, free_comment)
          VALUES (comp_id, dept_rec.id, target_month, (base_date - (month_offset || ' month')::INTERVAL + (random() * 27 || ' day')::INTERVAL), '組織環境の継続的な改善を希望します。')
          RETURNING id INTO resp_id;

          INSERT INTO survey_answers (response_id, question_id, score)
          SELECT resp_id, id, floor(pulse_level + random() - 0.5) FROM survey_questions;
        END;
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Success: History data generated with YYYY-MM-01 format.';
END $$;
