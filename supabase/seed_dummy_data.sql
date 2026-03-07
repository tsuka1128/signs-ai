-- =====================================================
-- 指定された企業のダミーデータ生成スクリプト
-- 対象企業ID: cb203010-b3b1-4407-aee4-f3046182053d
-- =====================================================

DO $$
DECLARE
  comp_id UUID := 'cb203010-b3b1-4407-aee4-f3046182053d';
  target_month TEXT;
  dept_rec RECORD;
  axis_rec RECORD;
  kpi_rec RECORD;
  base_date DATE := CURRENT_DATE;
  i INT;
  rand_val NUMERIC;
  rand_target NUMERIC;
  rand_pulse NUMERIC;
BEGIN
  -- 過去12ヶ月分ループ
  FOR i IN 0..12 LOOP
    target_month := to_char(base_date - (i || ' month')::INTERVAL, 'YYYY-MM');
    
    -- 1. 部署ごとの人数履歴 (resource_records)
    FOR dept_rec IN SELECT id, headcount FROM departments WHERE company_id = comp_id LOOP
      INSERT INTO resource_records (company_id, department_id, recorded_month, head_count, labor_cost)
      VALUES (
        comp_id, 
        dept_rec.id, 
        target_month, 
        dept_rec.headcount + floor(random() * 5 - 2), -- ±2名の変動
        (dept_rec.headcount * 500000) + floor(random() * 1000000) -- ダミー人件費
      )
      ON CONFLICT ON CONSTRAINT resource_records_composite_key DO UPDATE 
      SET head_count = EXCLUDED.head_count, labor_cost = EXCLUDED.labor_cost;
    END LOOP;

    -- 2. 第2軸ごとの人数履歴 (resource_records)
    FOR axis_rec IN SELECT id, headcount FROM kpi_axes WHERE company_id = comp_id LOOP
      INSERT INTO resource_records (company_id, axis_id, recorded_month, head_count)
      VALUES (
        comp_id, 
        axis_rec.id, 
        target_month, 
        axis_rec.headcount + floor(random() * 3 - 1)
      )
      ON CONFLICT ON CONSTRAINT resource_records_composite_key DO UPDATE 
      SET head_count = EXCLUDED.head_count;
    END LOOP;

    -- 3. KPI実績値 (kpi_records)
    FOR kpi_rec IN SELECT id, target_default FROM kpi_definitions WHERE company_id = comp_id LOOP
      rand_target := COALESCE(kpi_rec.target_default, 100);
      rand_val := rand_target * (0.7 + random() * 0.5); -- 達成率 70% ~ 120%
      
      -- 部署全体のデータ (axis_id IS NULL)
      INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value, axis_id)
      VALUES (kpi_rec.id, target_month, rand_val, rand_target, NULL)
      ON CONFLICT ON CONSTRAINT kpi_records_composite_key DO UPDATE
      SET value = EXCLUDED.value, target_value = EXCLUDED.target_value;

      -- 各軸ごとのデータ
      FOR axis_rec IN SELECT id FROM kpi_axes WHERE company_id = comp_id LOOP
         rand_val := (rand_target / 3) * (0.6 + random() * 0.8);
         INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value, axis_id)
         VALUES (kpi_rec.id, target_month, rand_val, rand_target / 3, axis_rec.id)
         ON CONFLICT ON CONSTRAINT kpi_records_composite_key DO UPDATE
         SET value = EXCLUDED.value, target_value = EXCLUDED.target_value;
      END LOOP;
    END LOOP;

    -- 4. アンケート回答 & スコア (survey_responses & survey_answers)
    -- 各部署につき毎月数名の回答をシミュレート
    FOR dept_rec IN SELECT id FROM departments WHERE company_id = comp_id LOOP
      FOR j IN 1..3 LOOP -- 各部署3名
        DECLARE
          resp_id UUID;
          q_rec RECORD;
        BEGIN
          INSERT INTO survey_responses (company_id, department_id, recorded_month, submitted_at)
          VALUES (comp_id, dept_rec.id, target_month, (base_date - (i || ' month')::INTERVAL + (random() * 25 || ' day')::INTERVAL))
          RETURNING id INTO resp_id;

          FOR q_rec IN SELECT id FROM survey_questions LOOP
            INSERT INTO survey_answers (response_id, question_id, score)
            VALUES (resp_id, q_rec.id, floor(random() * 3 + 2.5)); -- 2~5のスコア
          END LOOP;
        END;
      END LOOP;
    END LOOP;

  END LOOP;
END $$;
