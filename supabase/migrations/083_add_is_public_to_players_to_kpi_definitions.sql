-- KPI定義に「全社員に公開」フラグを追加
ALTER TABLE kpi_definitions
ADD COLUMN is_public_to_players BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN kpi_definitions.is_public_to_players IS 'true の場合、プレイヤー向け画面（マイページ/組織の温度）で公開表示される';
