ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS anomaly_alert_enabled BOOLEAN NOT NULL DEFAULT true;
