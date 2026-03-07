-- =====================================================
-- 企業 F-260305-7C78 向けリッチデータ生成スクリプト
-- 過去12ヶ月分の KPI、第2軸、人数推移、アンケート回答を生成
-- =====================================================

DO $$
DECLARE
  comp_id UUID;
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
  fluctuation INT;
BEGIN
  -- 1. 企業UUIDを取得
  SELECT id INTO comp_id FROM companies WHERE short_id = 'F-260305-7C78';
  
  IF comp_id IS NULL THEN
    RAISE EXCEPTION 'Company F-260305-7C78 not found.';
  END IF;

  -- 2. 既存の履歴データを一旦クリア（上書きのため）
  DELETE FROM kpi_records WHERE kpi_definition_id IN (SELECT id FROM kpi_definitions WHERE company_id = comp_id);
  DELETE FROM resource_records WHERE company_id = comp_id;
  DELETE FROM survey_responses WHERE company_id = comp_id;

  -- 3. 過去12ヶ月分のデータを生成
  FOR i IN 0..12 LOOP
    month_offset := 12 - i;
    target_month := to_char(base_date - (month_offset || ' month')::INTERVAL, 'YYYY-MM');
    
    -- A. 部署ごとの人数推移 (徐々に増える傾向)
    FOR dept_rec IN SELECT id, headcount FROM departments WHERE company_id = comp_id LOOP
      base_headcount := dept_rec.headcount;
      -- 過去に遡るほど人数が少ない傾向（毎月0.5人ずつ増える計算のランダム）
      fluctuation := floor(random() * 3 - 1); -- -1, 0, 1
      base_headcount := GREATEST(1, base_headcount - (month_offset / 2) + fluctuation);
      
      INSERT INTO resource_records (company_id, department_id, recorded_month, head_count, labor_cost)
      VALUES (comp_id, dept_rec.id, target_month, base_headcount, base_headcount * 550000 + (random() * 500000));
    END LOOP;

    -- B. 第2軸（エリア等）ごとの人数推移
    FOR axis_rec IN SELECT id, headcount FROM kpi_axes WHERE company_id = comp_id LOOP
      base_headcount := axis_rec.headcount;
      base_headcount := GREATEST(1, base_headcount - (month_offset / 3) + floor(random() * 2 - 1));
      
      INSERT INTO resource_records (company_id, axis_id, recorded_month, head_count)
      VALUES (comp_id, axis_rec.id, target_month, base_headcount);
    END LOOP;

    -- C. KPI実績値 (季節性やトレンドを付与)
    FOR kpi_rec IN SELECT id, target_default, name FROM kpi_definitions WHERE company_id = comp_id LOOP
      rand_target := COALESCE(kpi_rec.target_default, 100);
      
      -- 実績値の生成ロジック：
      -- 基本は達成率 80%-115%
      -- 特定の月（12月など）は少し高め、特定の月は低めなどのノイズ
      rand_val := rand_target * (0.85 + random() * 0.3); 
      
      -- 全社・部署平均データ
      INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value)
      VALUES (kpi_rec.id, target_month, rand_val, rand_target);

      -- 第2軸ごとのKPI
      FOR axis_rec IN SELECT id FROM kpi_axes WHERE company_id = comp_id LOOP
        -- 各拠点ごとのバラツキを大きめに
        rand_val := (rand_target / 4) * (0.6 + random() * 0.8);
        INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value, axis_id)
        VALUES (kpi_rec.id, target_month, rand_val, rand_target / 4, axis_rec.id);
      END LOOP;
    END LOOP;

    -- D. アンケート回答 (リッチなコメント付き)
    FOR dept_rec IN SELECT id, name FROM departments WHERE company_id = comp_id LOOP
      -- 各部署 2~5名の回答
      FOR j IN 1..(2 + floor(random() * 4)) LOOP
        DECLARE
          resp_id UUID;
          q_rec RECORD;
          comment TEXT;
          pulse_level FLOAT := 2.5 + random() * 2.5; -- 2.5 ~ 5.0
        BEGIN
          comment := CASE 
            WHEN pulse_level > 4.2 THEN 'チームの連携が非常にスムーズで、顧客への価値提供に集中できています。'
            WHEN pulse_level > 3.5 THEN '少し忙しいですが、手応えを感じています。'
            WHEN pulse_level < 3.0 THEN '承認プロセスが長く、スピード感が落ちていると感じます。改善が必要です。'
            ELSE '概ね順調ですが、中長期的な方針についてもっと共有が欲しいです。'
          END;

          INSERT INTO survey_responses (company_id, department_id, recorded_month, submitted_at, free_comment)
          VALUES (comp_id, dept_rec.id, target_month, (base_date - (month_offset || ' month')::INTERVAL + (random() * 27 || ' day')::INTERVAL), comment)
          RETURNING id INTO resp_id;

          FOR q_rec IN SELECT id FROM survey_questions LOOP
            INSERT INTO survey_answers (response_id, question_id, score)
            VALUES (resp_id, q_rec.id, GREATEST(1, LEAST(5, floor(pulse_level + random() - 0.5))));
          END LOOP;
        END;
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Rich history data generated for F-260305-7C78';
END $$;
