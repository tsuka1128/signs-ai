-- 064: ユーザープロフィール自動生成トリガー
-- Auth にユーザーが作成された直後、public.users にもレコードを作成し、データの不整合を防止します。

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''),
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- トリガーの作成（既存がある場合は再作成）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
