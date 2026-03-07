-- kpi_axes テーブルに所属人数カラムを追加
ALTER TABLE kpi_axes ADD COLUMN IF NOT EXISTS headcount INT NOT NULL DEFAULT 0;

-- companies テーブルに第2軸の円サイズ決定用KPIの参照カラムを追加
ALTER TABLE companies ADD COLUMN IF NOT EXISTS secondary_axis_size_kpi_id UUID REFERENCES kpi_definitions(id) ON DELETE SET NULL;
