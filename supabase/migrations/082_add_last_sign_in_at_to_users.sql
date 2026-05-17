-- public.users に last_sign_in_at カラムを追加
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- auth.users の last_sign_in_at が更新されたときに public.users を同期するトリガー関数
CREATE OR REPLACE FUNCTION public.sync_last_sign_in_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
    UPDATE public.users
    SET last_sign_in_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_last_sign_in_at();
