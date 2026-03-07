-- =====================================================
-- 企業 F-260305-7C78 向けリッチデータ生成スクリプト (v3 - 13ヶ月フル版)
-- 全ての KPI、部署、第2軸に対して、過去1年分（13ヶ月）の実績と目標を生成します。
-- =====================================================

DO $$
DECLARE
  comp_id UUID;
  comp_name TEXT;
  dept_rec RECORD;
  kpi_rec RECORD;
  axis_rec RECORD;
  base_date DATE := CURRENT_DATE;
  target_date DATE;
  target_month_str TEXT;
  i INT;
  month_offset INT;
  val NUMERIC;
  target NUMERIC;
  base_headcount INT;
BEGIN
  -- 1. 企業特定
  SELECT id, name INTO comp_id, comp_name FROM companies WHERE short_id = 'F-260305-7C78';
  IF comp_id IS NULL THEN 
    RAISE EXCEPTION '対象企業が見つかりませんでした。short_id: F-260305-7C78'; 
  END IF;

  RAISE NOTICE '🚀 Starting data generation for % (%)', comp_name, comp_id;

  -- 2. 既存データのクリーンアップ (この企業に関連するもののみ)
  DELETE FROM kpi_records kr WHERE kpi_definition_id IN (SELECT id FROM kpi_definitions WHERE company_id = comp_id);
  DELETE FROM resource_records WHERE company_id = comp_id;
  DELETE FROM survey_responses WHERE company_id = comp_id;

  -- 3. 過去13ヶ月分 (i=0が現在、12が1年前) を生成
  FOR i IN 0..12 LOOP
    month_offset := 12 - i;
    target_date := (date_trunc('month', base_date) - (month_offset || ' month')::INTERVAL)::DATE;
    target_month_str := to_char(target_date, 'YYYY-MM-01');

    -- A. 部署ごとの人数推移 (徐々に増えていくトレンド)
    FOR dept_rec IN SELECT id, headcount FROM departments WHERE company_id = comp_id LOOP
      base_headcount := GREATEST(1, dept_rec.headcount - (month_offset / 3) + floor(random() * 3 - 1));
      INSERT INTO resource_records (company_id, department_id, recorded_month, head_count, labor_cost)
      VALUES (comp_id, dept_rec.id, target_month_str::DATE, base_headcount, base_headcount * 550000 + (random() * 500000));
    END LOOP;

    -- B. 第2軸の人数推移
    FOR axis_rec IN SELECT id, headcount FROM kpi_axes WHERE company_id = comp_id LOOP
      base_headcount := GREATEST(1, axis_rec.headcount - (month_offset / 4) + floor(random() * 2 - 1));
      INSERT INTO resource_records (company_id, axis_id, recorded_month, head_count)
      VALUES (comp_id, axis_rec.id, target_month_str::DATE, base_headcount);
    END LOOP;

    -- C. 全ての KPI 実績 & 目標
    FOR kpi_rec IN SELECT id, target_default, name FROM kpi_definitions WHERE company_id = comp_id LOOP
      target := ROUND(COALESCE(kpi_rec.target_default, 100) * (0.9 + random() * 0.2));
      val := ROUND(target * (0.8 + random() * 0.35)); -- 達成率 80%~115%

      -- メイン（全社・部署平均）
      INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value)
      VALUES (kpi_rec.id, target_month_str::DATE, val, target);

      -- 第2軸（拠点等）
      FOR axis_rec IN SELECT id FROM kpi_axes WHERE company_id = comp_id LOOP
        INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value, axis_id)
        VALUES (kpi_rec.id, target_month_str::DATE, ROUND((val / 3.0) * (0.7 + random() * 0.6)), ROUND(target / 3.0), axis_rec.id);
      END LOOP;
    END LOOP;

    -- D. アンケート（組織体温）
    FOR dept_rec IN SELECT id FROM departments WHERE company_id = comp_id LOOP
      FOR j IN 1..2 LOOP 
        DECLARE
          resp_id UUID;
          base_score INT := floor(3 + random() * 2); 
        BEGIN
          INSERT INTO survey_responses (company_id, department_id, recorded_month, submitted_at, free_comment)
          VALUES (
            comp_id, dept_rec.id, target_month_str::DATE, 
            (target_date + (random() * 26 || ' day')::INTERVAL),
            CASE 
              WHEN base_score >= 4 THEN 'チームの雰囲気が良く、今期の目標に全員が集中できています。'
              WHEN base_score = 3 THEN '少し業務が立て込んでいますが、周囲と協力して進めています。'
              ELSE 'リソース配分に課題を感じており、上長に相談が必要です。'
            END
          ) RETURNING id INTO resp_id;

          INSERT INTO survey_answers (response_id, question_id, score)
          SELECT resp_id, id, GREATEST(1, LEAST(5, base_score + floor(random() * 2 - 0.5))) FROM survey_questions;
        END;
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ SUCCESS: 13ヶ月分の詳細なダミーデータ（KPI / 人数 / アンケート）を生成しました。';
END $$;
