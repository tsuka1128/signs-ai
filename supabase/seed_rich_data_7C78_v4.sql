-- =====================================================
-- 企業 F-260305-7C78 向けリッチデータ生成スクリプト (v4 - 最終完成版)
-- 特徴:
-- 1. 過去13ヶ月（1年分）をフルカバー
-- 2. 全ての数値を ROUND() で整数化
-- 3. 第2軸（プロダクト・拠点）にもアンケート回答を紐付け
-- 4. 人数推移 (resource_records) を正確に生成
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

  -- 【重要】制約の修正: 第2軸のみの回答を許容するため NOT NULL 制約を解除
  ALTER TABLE survey_responses ALTER COLUMN department_id DROP NOT NULL;

  RAISE NOTICE '🚀 Starting final data generation (v4) for % (%)', comp_name, comp_id;

  -- 2. 既存データのクリーンアップ
  DELETE FROM kpi_records kr WHERE kpi_definition_id IN (SELECT id FROM kpi_definitions WHERE company_id = comp_id);
  DELETE FROM resource_records WHERE company_id = comp_id;
  DELETE FROM survey_responses WHERE company_id = comp_id;

  -- 3. 過去13ヶ月分をループ生成
  FOR i IN 0..12 LOOP
    month_offset := 12 - i;
    target_date := (date_trunc('month', base_date) - (month_offset || ' month')::INTERVAL)::DATE;
    target_month_str := to_char(target_date, 'YYYY-MM-01');

    -- A. 部署ごとの人数推移 (徐々に増加トレンド)
    FOR dept_rec IN SELECT id, headcount FROM departments WHERE company_id = comp_id LOOP
      base_headcount := GREATEST(1, dept_rec.headcount - (month_offset / 3) + floor(random() * 3 - 1));
      INSERT INTO resource_records (company_id, department_id, recorded_month, head_count, labor_cost)
      VALUES (comp_id, dept_rec.id, target_month_str::DATE, base_headcount, base_headcount * 550000 + floor(random() * 500000));
    END LOOP;

    -- B. 第2軸（エリア・プロダクト等）の人数推移
    FOR axis_rec IN SELECT id, headcount FROM kpi_axes WHERE company_id = comp_id LOOP
      base_headcount := GREATEST(1, axis_rec.headcount - (month_offset / 4) + floor(random() * 2 - 1));
      INSERT INTO resource_records (company_id, axis_id, recorded_month, head_count)
      VALUES (comp_id, axis_rec.id, target_month_str::DATE, base_headcount);
    END LOOP;

    -- C. 全ての KPI に対して実績 & 目標を生成 (ROUND適用)
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

    -- D. アンケート（組織体温）の生成
    -- 1. 部署別の回答者
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
            '部署での業務は順調です。'
          ) RETURNING id INTO resp_id;

          INSERT INTO survey_answers (response_id, question_id, score)
          SELECT resp_id, id, GREATEST(1, LEAST(5, base_score + floor(random() * 2 - 0.5))) FROM survey_questions;
        END;
      END LOOP;
    END LOOP;

    -- 2. 第2軸別の回答者 (これを追加しないと第2軸バブルの色が変わらない)
    FOR axis_rec IN SELECT id FROM kpi_axes WHERE company_id = comp_id LOOP
      FOR j IN 1..2 LOOP 
        DECLARE
          resp_id UUID;
          base_score INT := floor(3 + random() * 2); 
        BEGIN
          INSERT INTO survey_responses (company_id, axis_id, recorded_month, submitted_at, free_comment)
          VALUES (
            comp_id, axis_rec.id, target_month_str::DATE, 
            (target_date + (random() * 26 || ' day')::INTERVAL),
            'プロダクト開発・運営面でのフィードバックです。'
          ) RETURNING id INTO resp_id;

          INSERT INTO survey_answers (response_id, question_id, score)
          SELECT resp_id, id, GREATEST(1, LEAST(5, base_score + floor(random() * 2 - 0.5))) FROM survey_questions;
        END;
      END LOOP;
    END LOOP;

  END LOOP;
  
  RAISE NOTICE '✅ SUCCESS: 整数化・第2軸完全対応の 13ヶ月分データを生成しました。';
END $$;
