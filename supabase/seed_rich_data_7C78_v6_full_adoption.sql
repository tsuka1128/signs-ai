-- =====================================================
-- 企業 F-260305-7C78 向けダミーデータ生成 (v6)
-- コンセプト: Signs AI を1年間フル活用してきた組織
--
-- 【ストーリー】
-- 2025年春から Signs AI を導入。当初はいくつかの部署で
-- 体温低下・KPI未達が発生。Signs AI のインサイトとアクション
-- アイテム機能を活用しながら、組織全体で改善に取り組んだ結果、
-- 2026年5月現在、全部署・全拠点で体温・KPIともに過去最高水準。
--
-- 【部署別トレンド】
-- 営業部:    KPI未達期の低迷→ 1on1強化インサイトで右肩上がり
-- CS部:      一貫して高スコア（全社モデルケース）
-- マーケ:    リソース不足で急落→ 採用強化で回復途上→ 復活
-- 開発部:    大型PJ炎上でV字底→ V字回復→ 現在最高スコア
-- バックオフィス: 安定高水準、緩やかに改善
--
-- 【拠点別トレンド（第2軸）】
-- 東京本社:  常に高水準・リード拠点
-- 大阪支社:  低迷からのスタートアップ的急成長
-- 福岡支社:  安定したコアチーム
-- 名古屋支社: 立ち上げ期からの着実成長
-- =====================================================

DO $$
DECLARE
  comp_id    UUID;
  dept_rec   RECORD;
  axis_rec   RECORD;
  kpi_rec    RECORD;
  base_date  DATE    := CURRENT_DATE;  -- 2026-05-02
  target_date      DATE;
  target_month_str TEXT;
  i INT; j INT;
  month_offset INT;
  resp_id    UUID;
  base_score NUMERIC;
  comment_text TEXT;
  val     NUMERIC;
  tgt     NUMERIC;
  base_hc INT;
  axis_count BIGINT;
BEGIN
  -- ① 企業特定
  SELECT id INTO comp_id FROM companies WHERE short_id = 'F-260305-7C78';
  IF comp_id IS NULL THEN
    RAISE EXCEPTION '対象企業が見つかりません: F-260305-7C78';
  END IF;
  SELECT COUNT(*) INTO axis_count FROM kpi_axes WHERE company_id = comp_id;

  RAISE NOTICE '🚀 v6 Signs AI フル活用データ生成開始 (comp_id: %)', comp_id;

  -- ② 既存データをクリア（マスタ設定は維持）
  DELETE FROM survey_responses WHERE company_id = comp_id;
  DELETE FROM kpi_records
    WHERE kpi_definition_id IN (SELECT id FROM kpi_definitions WHERE company_id = comp_id);
  DELETE FROM resource_records WHERE company_id = comp_id;

  -- ③ 過去13ヶ月ループ (i=0: 2025-05, i=12: 2026-05)
  FOR i IN 0..12 LOOP
    month_offset    := 12 - i;
    target_date     := (date_trunc('month', base_date) - (month_offset || ' month')::INTERVAL)::DATE;
    target_month_str := to_char(target_date, 'YYYY-MM-01');

    RAISE NOTICE '📅 %  (i=%, offset=%)', target_month_str, i, month_offset;

    -- ─────────────────────────────
    -- A. リソース記録（人員・人件費）
    -- ─────────────────────────────
    FOR dept_rec IN
      SELECT id, name, COALESCE(headcount, 5) AS headcount
      FROM departments WHERE company_id = comp_id
    LOOP
      -- 部署ごとに採用ペースが異なる（Signs AI活用で適切採用）
      base_hc := CASE
        WHEN dept_rec.name LIKE '%マーケ%' OR dept_rec.name LIKE '%Marketing%' THEN
          -- マーケは7ヶ月前から急速採用
          CASE WHEN i >= 6
            THEN GREATEST(2, dept_rec.headcount - (month_offset / 3) + (i / 4))
            ELSE GREATEST(2, dept_rec.headcount - (month_offset / 2))
          END
        WHEN dept_rec.name LIKE '%開発%' OR dept_rec.name LIKE '%エンジニア%' THEN
          GREATEST(3, dept_rec.headcount - (month_offset / 3) + FLOOR(random() * 2)::INT)
        ELSE
          GREATEST(2, dept_rec.headcount - (month_offset / 4) + FLOOR(random() * 2 - 1)::INT)
      END;

      INSERT INTO resource_records (company_id, department_id, recorded_month, head_count, labor_cost)
      VALUES (
        comp_id, dept_rec.id, target_month_str::DATE,
        base_hc,
        base_hc * (620000 + FLOOR(random() * 180000)::INT)
      );
    END LOOP;

    -- 第2軸の人員
    FOR axis_rec IN
      SELECT id, name, COALESCE(headcount, 5) AS headcount
      FROM kpi_axes WHERE company_id = comp_id
    LOOP
      base_hc := GREATEST(2, axis_rec.headcount - (month_offset / 4) + FLOOR(random() * 2 - 1)::INT);
      INSERT INTO resource_records (company_id, axis_id, recorded_month, head_count)
      VALUES (comp_id, axis_rec.id, target_month_str::DATE, base_hc);
    END LOOP;

    -- ─────────────────────────────
    -- B. KPI 実績データ
    -- ─────────────────────────────
    FOR kpi_rec IN
      SELECT id, name, COALESCE(target_default, 100) AS target_default
      FROM kpi_definitions WHERE company_id = comp_id
    LOOP
      -- 目標値: 1年間で約20%成長
      tgt := ROUND(kpi_rec.target_default * (0.85 + (i::NUMERIC / 12.0) * 0.20));

      -- 達成率トレンド: 前半〜中盤は苦戦 → Signs AI効果で後半ブレイクスルー
      val := CASE
        WHEN i < 4  THEN ROUND(tgt * (0.76 + random() * 0.16))  -- 前半: 76-92%
        WHEN i < 8  THEN ROUND(tgt * (0.88 + random() * 0.17))  -- 中盤: 88-105%
        ELSE             ROUND(tgt * (0.97 + random() * 0.18))  -- 後半: 97-115%
      END;

      -- 全社レコード（department_id=NULL, axis_id=NULL）
      INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value)
      VALUES (kpi_rec.id, target_month_str::DATE, val, tgt);

      -- 第2軸別レコード
      FOR axis_rec IN SELECT id, name FROM kpi_axes WHERE company_id = comp_id LOOP
        DECLARE
          ax_tgt NUMERIC;
          ax_val NUMERIC;
        BEGIN
          ax_tgt := ROUND(tgt::NUMERIC / GREATEST(axis_count, 1));
          ax_val := CASE
            WHEN axis_rec.name LIKE '%東京%' THEN
              ROUND(ax_tgt * (1.08 + random() * 0.12))           -- 東京: 常にトップ
            WHEN axis_rec.name LIKE '%大阪%' THEN
              ROUND(ax_tgt * (0.72 + (i::NUMERIC / 12.0) * 0.38 + random() * 0.10)) -- 大阪: 急成長
            WHEN axis_rec.name LIKE '%名古屋%' THEN
              ROUND(ax_tgt * (0.68 + (i::NUMERIC / 12.0) * 0.32 + random() * 0.10)) -- 名古屋: 成長途上
            ELSE
              ROUND(ax_tgt * (0.90 + random() * 0.16))           -- 福岡等: 安定
          END;

          INSERT INTO kpi_records (kpi_definition_id, recorded_month, value, target_value, axis_id)
          VALUES (kpi_rec.id, target_month_str::DATE, ax_val, ax_tgt, axis_rec.id);
        END;
      END LOOP;
    END LOOP;

    -- ─────────────────────────────
    -- C. アンケート（部署別）
    -- 月4件／部署 → 高回答率でフル活用感を演出
    -- ─────────────────────────────
    FOR dept_rec IN SELECT id, name FROM departments WHERE company_id = comp_id LOOP

      -- 部署トレンド
      base_score := CASE

        WHEN dept_rec.name LIKE '%CS%' OR dept_rec.name LIKE '%カスタマー%' THEN
          -- CS: 一貫して高水準。サービス文化が根付いたモデル部署
          3.9 + (i::NUMERIC / 12.0) * 0.35 + (random() * 0.3 - 0.15)

        WHEN dept_rec.name LIKE '%営業%' OR dept_rec.name LIKE '%Sales%' THEN
          -- 営業: 最初の3ヶ月は KPI プレッシャーで低迷
          --        Signs AI 「1on1 頻度不足」指摘後に改善一直線
          CASE
            WHEN i < 3  THEN 2.5 + random() * 0.5
            WHEN i < 7  THEN 2.9 + (i - 2)::NUMERIC / 5.0 * 0.9 + random() * 0.3
            ELSE             3.8 + (i - 6)::NUMERIC / 6.0 * 0.45 + random() * 0.25
          END

        WHEN dept_rec.name LIKE '%マーケ%' OR dept_rec.name LIKE '%Marketing%' THEN
          -- マーケ: リソース不足・長期消耗 → 採用+体制整備 → 復活
          CASE
            WHEN i < 5  THEN 2.3 + random() * 0.5
            WHEN i < 9  THEN 2.6 + (i - 4)::NUMERIC / 4.0 * 0.8 + random() * 0.3
            ELSE             3.5 + (i - 8)::NUMERIC / 4.0 * 0.6 + random() * 0.3
          END

        WHEN dept_rec.name LIKE '%開発%' OR dept_rec.name LIKE '%エンジニア%'
              OR dept_rec.name LIKE '%Dev%' OR dept_rec.name LIKE '%Engineer%' THEN
          -- 開発: 大型PJで炎上（i=4〜6）→ V字回復 → 今が最高潮
          CASE
            WHEN i < 4  THEN 3.6 + random() * 0.4
            WHEN i < 7  THEN 1.9 + random() * 0.6       -- 炎上期（最低）
            WHEN i < 10 THEN 2.6 + (i - 6)::NUMERIC / 3.0 * 1.4 + random() * 0.3
            ELSE             4.1 + (i - 9)::NUMERIC / 3.0 * 0.4 + random() * 0.3
          END

        ELSE
          -- バックオフィス等: 安定した高水準
          3.6 + (i::NUMERIC / 12.0) * 0.25 + (random() * 0.4 - 0.2)
      END;

      base_score := GREATEST(1.2, LEAST(5.0, base_score));

      -- コメント（Signs AI フル活用らしいリアルな声）
      comment_text := CASE
        WHEN dept_rec.name LIKE '%CS%' THEN
          CASE
            WHEN i >= 10 THEN 'Signs AI のスコアが上がっているのを体感しています。チームの心理的安全性が高い。'
            WHEN i >= 6  THEN 'アクションアイテムの進捗が可視化されて動きやすくなりました。'
            ELSE              'お客様対応の品質維持に全員で取り組んでいます。'
          END
        WHEN dept_rec.name LIKE '%営業%' THEN
          CASE
            WHEN i < 3  THEN 'KPI達成のプレッシャーが強く、メンバーの消耗が心配です。'
            WHEN i < 7  THEN 'Signs AI のインサイトを参考に 1on1 を強化。少しずつ変わってきた気がします。'
            ELSE              '体温とKPIが両立できるようになってきました。チームの雰囲気が別物です。'
          END
        WHEN dept_rec.name LIKE '%マーケ%' THEN
          CASE
            WHEN i < 5  THEN '業務量に対して人手が足りず、消耗感があります。早急な採用が必要。'
            WHEN i < 9  THEN '採用が進み始め、少しずつ余裕が出てきています。'
            ELSE              '新メンバーも馴染んで、チームのクリエイティビティが戻ってきました。'
          END
        WHEN dept_rec.name LIKE '%開発%' OR dept_rec.name LIKE '%エンジニア%' THEN
          CASE
            WHEN i >= 4 AND i < 7 THEN '連続リリースで疲弊しています。休暇取得の仕組みを整えてほしい。'
            WHEN i >= 7 AND i < 10 THEN 'Signs AI が指摘した集中作業時間の問題に管理職が動いてくれました。'
            ELSE                        'チームの自律性が高まり、毎日の仕事にやりがいを感じています。'
          END
        ELSE
          CASE
            WHEN i >= 10 THEN 'Signs AI のダッシュボードが経営との対話ツールとして機能しています。'
            WHEN i >= 6  THEN 'データを見ながら改善策を議論できるようになりました。'
            ELSE              'バックオフィスとして会社全体を支える仕事にやりがいを感じています。'
          END
      END;

      -- 1ヶ月あたり4件（高回答率）
      FOR j IN 1..4 LOOP
        INSERT INTO survey_responses
          (company_id, department_id, recorded_month, submitted_at, free_comment)
        VALUES (
          comp_id, dept_rec.id, target_month_str::DATE,
          (target_date + ((j * 5 + FLOOR(random() * 4))::TEXT || ' day')::INTERVAL),
          comment_text
        ) RETURNING id INTO resp_id;

        INSERT INTO survey_answers (response_id, question_id, score)
        SELECT resp_id, sq.id,
          GREATEST(1, LEAST(5, ROUND(base_score + (random() * 1.2 - 0.6))::INT))
        FROM survey_questions sq;
      END LOOP;
    END LOOP;

    -- ─────────────────────────────
    -- D. アンケート（第2軸別）
    -- 月3件／軸
    -- ─────────────────────────────
    FOR axis_rec IN SELECT id, name FROM kpi_axes WHERE company_id = comp_id LOOP

      base_score := CASE
        WHEN axis_rec.name LIKE '%東京%' THEN
          3.9 + (i::NUMERIC / 12.0) * 0.30 + (random() * 0.4 - 0.2)
        WHEN axis_rec.name LIKE '%大阪%' THEN
          CASE WHEN i < 4
            THEN 2.7 + random() * 0.5
            ELSE 3.0 + (i - 3)::NUMERIC / 9.0 * 1.4 + random() * 0.3
          END
        WHEN axis_rec.name LIKE '%名古屋%' THEN
          2.4 + (i::NUMERIC / 12.0) * 1.6 + random() * 0.4
        ELSE  -- 福岡等
          3.5 + (random() * 0.5 - 0.15)
      END;

      base_score := GREATEST(1.2, LEAST(5.0, base_score));

      FOR j IN 1..3 LOOP
        INSERT INTO survey_responses
          (company_id, axis_id, recorded_month, submitted_at, free_comment)
        VALUES (
          comp_id, axis_rec.id, target_month_str::DATE,
          (target_date + ((j * 7 + FLOOR(random() * 5))::TEXT || ' day')::INTERVAL),
          CASE
            WHEN axis_rec.name LIKE '%東京%'   THEN '本社チームの連携は良好。リモートとオフィスのバランスも取れています。'
            WHEN axis_rec.name LIKE '%大阪%'   THEN '関西チームの熱量は高い！Signs AI で数値が見えるとモチベーションが上がります。'
            WHEN axis_rec.name LIKE '%福岡%'   THEN '福岡チームとして着実に成果を積み重ねています。'
            WHEN axis_rec.name LIKE '%名古屋%' THEN '立ち上げ期を乗り越え、チームとしての一体感が出てきました。'
            ELSE                                    '拠点からのフィードバックです。'
          END
        ) RETURNING id INTO resp_id;

        INSERT INTO survey_answers (response_id, question_id, score)
        SELECT resp_id, sq.id,
          GREATEST(1, LEAST(5, ROUND(base_score + (random() * 1.0 - 0.5))::INT))
        FROM survey_questions sq;
      END LOOP;
    END LOOP;

  END LOOP; -- 月ループ終了

  RAISE NOTICE '✅ v6 完了: Signs AI フル活用 13ヶ月（〜2026-05）データ生成完了';
  RAISE NOTICE '   部署アンケート: 4件/月  |  拠点アンケート: 3件/月';
  RAISE NOTICE '   KPI: 全社 + 拠点別  |  リソース: 部署 + 拠点別';
END $$;
