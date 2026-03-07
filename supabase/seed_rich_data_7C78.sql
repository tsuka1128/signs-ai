-- =====================================================
-- 不要な企業データの整理スクリプト
-- 指定された2つの SignsAI ID 以外をすべて削除します。
-- =====================================================

DO $$
DECLARE
  keep_ids TEXT[] := ARRAY['F-260305-7C78', 'F-260228-0912'];
BEGIN
  -- 1. 指定外の企業を削除（ON DELETE CASCADE により関連データも削除されます）
  DELETE FROM companies 
  WHERE short_id NOT IN (SELECT unnest(keep_ids)) 
     OR short_id IS NULL;

  -- 2. 会社に紐付かなくなった（company_id が NULL になった）ユーザーも削除
  -- ※ ただし、管理上の安全のため、一旦コメントアウトまたは別処理にすることを推奨します。
  -- DELETE FROM users WHERE company_id IS NULL;

  RAISE NOTICE 'Cleanup complete. Kept IDs: %', keep_ids;
END $$;
