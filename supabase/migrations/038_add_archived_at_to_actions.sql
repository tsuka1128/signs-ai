-- アクションのアーカイブ日時を記録するカラムを追加
ALTER TABLE ai_action_tracking ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ステータスが完了(completed)または不採用(rejected)に更新された際に archived_at を自動でセットするトリガー
CREATE OR REPLACE FUNCTION set_archived_at()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'completed' OR NEW.status = 'rejected') AND (OLD.status != 'completed' AND OLD.status != 'rejected') THEN
        NEW.archived_at = CURRENT_TIMESTAMP;
    ELSIF (NEW.status != 'completed' AND NEW.status != 'rejected') THEN
        NEW.archived_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_archived_at ON ai_action_tracking;
CREATE TRIGGER tr_set_archived_at
BEFORE UPDATE ON ai_action_tracking
FOR EACH ROW
EXECUTE FUNCTION set_archived_at();
