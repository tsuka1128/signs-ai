-- 081: ユーザープロフィール自動生成トリガーの修正（メール確認対応）
-- Supabase の Email Confirmations 有効化に伴い、メール確認前にプロフィールが作成されないよう修正。
-- INSERT時（OAuthなど）とUPDATE時（メール確認完了）の両方をサポート。

-- ① INSERT トリガー関数を更新（メール確認不要のケース：OAuth等に対応）
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- 確認済み（OAuthや即時確認）の場合のみ作成
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.users (id, email, display_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''), 'member')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ② メール確認完了時（UPDATE）にプロフィールを作成するトリガーを追加
CREATE OR REPLACE FUNCTION public.handle_auth_user_email_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- email_confirmed_at が NULL → 値 に変わった瞬間のみ実行
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.users (id, email, display_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''), 'member')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_email_confirmed();
