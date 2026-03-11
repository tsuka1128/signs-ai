-- =====================================================
-- 企業 F-260305-7C78 向けダイナミックデータ生成スクリプト (v5)
-- 特徴:
-- 1. 部署ごとに異なる体温トレンド（改善・悪化・波）を設定
    -- 営業部: 徐々に改善 (3.2 -> 4.5)
    -- マーケティング: 徐々に悪化 (4.3 -> 2.7)
    -- 経企・人事: 安定 (3.5固定)
    -- エンジニア: 急落からのV字回復 (4.0 -> 2.0 -> 4.2)
-- 2. 第2軸（エリア）にも同様のトレンドを付与
-- =====================================================

DO $$
DECLARE
  comp_id UUID;
  dept_rec RECORD;
  axis_rec RECORD;
  base_date DATE := CURRENT_DATE;
  target_date DATE;
  target_month_str TEXT;
  i INT;
  month_offset INT;
  resp_id UUID;
  base_score NUMERIC;
  trend_type TEXT;
  comment_text TEXT;
BEGIN
  -- 1. 企業特定
  SELECT id INTO comp_id FROM companies WHERE short_id = 'F-260305-7C78';
  IF comp_id IS NULL THEN 
    RAISE EXCEPTION '対象企業が見つかりませんでした。short_id: F-260305-7C78'; 
  END IF;

  RAISE NOTICE '🚀 Starting dynamic data generation (v5) for F-260305-7C78';

  -- 既存の回答データのみをクリーンアップ（KPIや人数設定は維持）
  DELETE FROM survey_responses WHERE company_id = comp_id;

  -- 2. 過去13ヶ月分をループ生成
  FOR i IN 0..12 LOOP
    month_offset := 12 - i;
    target_date := (date_trunc('month', base_date) - (month_offset || ' month')::INTERVAL)::DATE;
    target_month_str := to_char(target_date, 'YYYY-MM-01');

    -- A. 部署別アンケート
    FOR dept_rec IN SELECT id, name FROM departments WHERE company_id = comp_id LOOP
      -- トレンド算出
      IF dept_rec.name LIKE '%営業%' THEN
        base_score := 3.0 + (i::NUMERIC / 12.0) * 1.5; -- 改善傾向
        comment_text := CASE WHEN i < 6 THEN 'プロセス改善が必要。' ELSE 'チームの連携が非常にスムーズ。' END;
      ELSIF dept_rec.name LIKE '%マーケティング%' THEN
        base_score := 4.2 - (i::NUMERIC / 12.0) * 1.5; -- 悪化傾向
        comment_text := CASE WHEN i < 6 THEN '順調です。' ELSE 'リソース不足が深刻。' END;
      ELSIF dept_rec.name LIKE '%エンジニア%' THEN
        -- 波 (V字回復)
        base_score := CASE 
          WHEN i < 6 THEN 4.0 - (i::NUMERIC / 6.0) * 2.0 -- 急落 (4 -> 2)
          ELSE 2.0 + ((i - 6)::NUMERIC / 6.0) * 2.2      -- V字回復 (2 -> 4.2)
        END;
        comment_text := CASE WHEN i BETWEEN 5 AND 7 THEN 'プロジェクトの混乱。' ELSE '開発効率が向上。' END;
      ELSE
        base_score := 3.5 + (random() * 0.4 - 0.2); -- 安定
        comment_text := '現状維持。';
      END IF;

      -- 回答生成 (月2件想定)
      FOR j IN 1..2 LOOP
        INSERT INTO survey_responses (company_id, department_id, recorded_month, submitted_at, free_comment)
        VALUES (comp_id, dept_rec.id, target_month_str::DATE, (target_date + (random() * 26 || ' day')::INTERVAL), comment_text)
        RETURNING id INTO resp_id;

        INSERT INTO survey_answers (response_id, question_id, score)
        SELECT resp_id, id, GREATEST(1, LEAST(5, ROUND(base_score + random() * 1.0 - 0.5))) FROM survey_questions;
      END LOOP;
    END LOOP;

    -- B. 第2軸別アンケート (エリア)
    FOR axis_rec IN SELECT id, name FROM kpi_axes WHERE company_id = comp_id LOOP
      -- トレンド算出 (エリアごとに適当に変える)
      IF axis_rec.name LIKE '%東京%' THEN
          base_score := 3.8 + (sin(i::NUMERIC / 2.0) * 0.5); -- 波
      ELSIF axis_rec.name LIKE '%大阪%' THEN
          base_score := 2.5 + (i::NUMERIC / 12.0) * 1.8; -- 大幅改善
      ELSE
          base_score := 3.4 + (random() * 0.6 - 0.3); -- 安定
      END IF;

      FOR j IN 1..2 LOOP
        INSERT INTO survey_responses (company_id, axis_id, recorded_month, submitted_at, free_comment)
        VALUES (comp_id, axis_rec.id, target_month_str::DATE, (target_date + (random() * 26 || ' day')::INTERVAL), 'エリア拠点からの声。')
        RETURNING id INTO resp_id;

        INSERT INTO survey_answers (response_id, question_id, score)
        SELECT resp_id, id, GREATEST(1, LEAST(5, ROUND(base_score + random() * 1.0 - 0.5))) FROM survey_questions;
      END LOOP;
    END LOOP;

  END LOOP;
  
  RAISE NOTICE '✅ SUCCESS: ダイナミックな体温推移データを生成しました。';
END $$;
