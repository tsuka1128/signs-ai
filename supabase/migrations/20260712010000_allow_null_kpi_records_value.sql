-- 20260712010000_allow_null_kpi_records_value.sql
--
-- 背景: KPI入力画面(/kpi)で「目標だけ入力して実績は未入力」のセルを保存すると、
-- value カラムが NOT NULL のため実績側が Number("" || 0) = 0 として保存されていた。
-- これにより「目標は立てたが実績はまだ無い」当月・未来月が「達成率0%」として
-- 集計・グラフに伝播し、経営者に偽の急落として見えてしまっていた。
--
-- 対策: value を NULL 許容にし、「未入力」と「実績0」を区別できるようにする。

ALTER TABLE kpi_records ALTER COLUMN value DROP NOT NULL;
COMMENT ON COLUMN kpi_records.value IS '当月の実績値。NULL は「まだ実績が入力されていない」ことを示し、0（実績ゼロ）とは区別される。';
