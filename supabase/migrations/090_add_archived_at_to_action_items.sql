-- action_items テーブルに archived_at カラムを追加
ALTER TABLE action_items ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ステータスが完了(completed)または不採用(rejected)に更新された際に archived_at を自動でセットするトリガー
-- ※ set_archived_at() 関数は migration 038 で ai_action_tracking 向けに作成済みだが、
--   action_items テーブルにも同じトリガーを適用する
DROP TRIGGER IF EXISTS tr_set_archived_at_action_items ON action_items;
CREATE TRIGGER tr_set_archived_at_action_items
BEFORE UPDATE ON action_items
FOR EACH ROW
EXECUTE FUNCTION set_archived_at();
