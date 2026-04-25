-- 異常検知アラートの閾値をカスタマイズ可能にするためのカラム追加
ALTER TABLE companies
ADD COLUMN anomaly_threshold_absolute INTEGER DEFAULT 60,
ADD COLUMN anomaly_threshold_drop INTEGER DEFAULT 10,
ADD COLUMN anomaly_threshold_gap INTEGER DEFAULT 20;

COMMENT ON COLUMN companies.anomaly_threshold_absolute IS '異常検知アラート：全社平均スコアの絶対値下限（デフォルト60）';
COMMENT ON COLUMN companies.anomaly_threshold_drop IS '異常検知アラート：前月比でのスコア下落幅（デフォルト10）';
COMMENT ON COLUMN companies.anomaly_threshold_gap IS '異常検知アラート：全社平均と部門別の乖離幅（デフォルト20）';
