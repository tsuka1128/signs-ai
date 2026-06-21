-- 施策ROI（hr_campaigns）に、改善目標とするKPI定義IDを任意で紐付けられるようカラムを追加します。
ALTER TABLE public.hr_campaigns
  ADD COLUMN IF NOT EXISTS target_kpi_id uuid REFERENCES public.kpi_definitions(id) ON DELETE SET NULL;
