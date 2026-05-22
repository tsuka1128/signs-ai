-- =====================================================
-- F-260307-F2B8 向け：ボイスチェック（アンケート）回答状況の確認 & ダミー追加
-- =====================================================

-- ────────────────────────────────────────
-- 【STEP 1】現状確認クエリ
--   以下を Supabase SQL Editor で実行して確認
-- ────────────────────────────────────────

/*
-- 企業の存在確認
SELECT id, name, short_id
FROM companies
WHERE short_id = 'F-260307-F2B8';

-- 部署一覧の確認
SELECT d.id, d.name, d.headcount
FROM departments d
JOIN companies c ON c.id = d.company_id
WHERE c.short_id = 'F-260307-F2B8';

-- 直近6ヶ月の月別・部署別 回答件数の確認
-- ※ recorded_month は TEXT 型のため ::TEXT でキャストして比較
SELECT
  sr.recorded_month,
  d.name AS dept_name,
  COUNT(*) AS response_count
FROM survey_responses sr
JOIN departments d ON d.id = sr.department_id
JOIN companies c ON c.id = sr.company_id
WHERE c.short_id = 'F-260307-F2B8'
  AND sr.recorded_month::DATE >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')::DATE
GROUP BY sr.recorded_month, d.name
ORDER BY sr.recorded_month DESC, d.name;
*/


-- ────────────────────────────────────────
-- 【STEP 2】ダミー回答追加（匿名ガード 3名以上を確保）
--   部署アンケートを「今月含む直近6ヶ月 × 各部署5名」で追加
--   既存データは削除しないので ON CONFLICT は不要
-- ────────────────────────────────────────

DO $$
DECLARE
  comp_id          UUID;
  dept_rec         RECORD;
  resp_id          UUID;
  q_rec            RECORD;
  target_date      DATE;
  target_month_str TEXT;
  i                INT;
  j                INT;
  base_score       NUMERIC;
BEGIN
  -- ① 企業特定
  SELECT id INTO comp_id FROM companies WHERE short_id = 'F-260307-F2B8';
  IF comp_id IS NULL THEN
    RAISE EXCEPTION '対象企業が見つかりません: F-260307-F2B8';
  END IF;

  RAISE NOTICE '🚀 ダミー回答追加開始 (comp_id: %)', comp_id;

  -- ② 過去6ヶ月ループ (i=0: 5ヶ月前, i=5: 今月)
  FOR i IN 0..5 LOOP
    target_date      := (date_trunc('month', CURRENT_DATE) - ((5 - i) || ' month')::INTERVAL)::DATE;
    target_month_str := to_char(target_date, 'YYYY-MM-01');

    RAISE NOTICE '📅 %', target_month_str;

    -- ③ 各部署に5名分の回答をINSERT
    FOR dept_rec IN
      SELECT id, name
      FROM departments
      WHERE company_id = comp_id
    LOOP
      -- 部署・月によってベーススコアを変化させリアリティを出す
      base_score := CASE
        WHEN dept_rec.name LIKE '%営業%' OR dept_rec.name LIKE '%Sales%' THEN
          3.2 + (i::NUMERIC / 5.0) * 0.5 + (random() * 0.4 - 0.2)
        WHEN dept_rec.name LIKE '%開発%' OR dept_rec.name LIKE '%エンジニア%' THEN
          3.5 + (random() * 0.6 - 0.3)
        WHEN dept_rec.name LIKE '%マーケ%' OR dept_rec.name LIKE '%Marketing%' THEN
          3.0 + (i::NUMERIC / 5.0) * 0.6 + (random() * 0.5 - 0.25)
        WHEN dept_rec.name LIKE '%CS%' OR dept_rec.name LIKE '%カスタマー%' THEN
          3.8 + (i::NUMERIC / 5.0) * 0.3 + (random() * 0.3 - 0.15)
        ELSE
          3.4 + (i::NUMERIC / 5.0) * 0.4 + (random() * 0.4 - 0.2)
      END;
      base_score := GREATEST(1.5, LEAST(5.0, base_score));

      -- 1部署あたり5名分ループ
      FOR j IN 1..5 LOOP
        INSERT INTO survey_responses
          (company_id, department_id, recorded_month, submitted_at)
        VALUES (
          comp_id,
          dept_rec.id,
          target_month_str::DATE,
          target_date + ((j * 3 + FLOOR(random() * 5))::TEXT || ' day')::INTERVAL
        )
        RETURNING id INTO resp_id;

        -- 全設問にスコアを投入（company_id フィルタ付き）
        INSERT INTO survey_answers (response_id, question_id, score)
        SELECT
          resp_id,
          sq.id,
          GREATEST(1, LEAST(5,
            ROUND(base_score + (random() * 1.0 - 0.5))::INT
          ))
        FROM survey_questions sq
        WHERE sq.company_id = comp_id;

      END LOOP; -- j (5名)
    END LOOP; -- dept_rec
  END LOOP; -- i (6ヶ月)

  RAISE NOTICE '✅ 完了: F-260307-F2B8 の直近6ヶ月 × 各部署5名分の回答を追加しました';
END $$;
