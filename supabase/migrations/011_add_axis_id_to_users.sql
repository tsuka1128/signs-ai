-- =====================================================
-- Signs AI — ユーザーへの第2軸（axis_id）紐付け追加
-- =====================================================

-- 1. users テーブルに axis_id カラムを追加
-- ※ 特定の軸（ブランド・エリア等）に属するユーザーを識別するために使用します
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES public.kpi_axes(id) ON DELETE SET NULL;

-- 2. インデックスの追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_users_axis_id ON public.users(axis_id);

-- 3. RLS の更新（必要に応じて）
-- 既存の "users_own_company" や "users_can_read_own_profile" でカバーされているため、
-- 基本的な参照には追加のポリシーは不要ですが、axis_id を含む更新を許可することを確認
