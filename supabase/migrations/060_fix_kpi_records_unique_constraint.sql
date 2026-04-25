-- KPI実績テーブルの一意性制約を更新し、第2軸(axis_id)を考慮できるようにする
-- これにより、同じ部署・同じ月のKPIでも、基本軸と第2軸で別の値を保存できるようになります。

-- 既存の制約（axis_idが含まれていないもの）を削除
ALTER TABLE kpi_records DROP CONSTRAINT IF EXISTS kpi_records_kpi_month_dept_unique;

-- 新しい複合ユニーク制約を追加（KPI定義、月、部署、軸の組み合わせで一意にする）
-- NULLS NOT DISTINCT を使うことで、axis_id が NULL の場合も重複判定が正しく行われます（PG15以降）
ALTER TABLE kpi_records ADD CONSTRAINT kpi_records_full_unique UNIQUE NULLS NOT DISTINCT (kpi_definition_id, recorded_month, department_id, axis_id);

