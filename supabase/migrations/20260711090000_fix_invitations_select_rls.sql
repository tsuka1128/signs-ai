-- 既存の SELECT ポリシーを削除し、新規登録後のオンボーディング画面（ログイン状態かつcompany_idがnull）でも
-- 招待トークンのメールアドレスが自分のものと一致すれば招待レコードをSELECTできるようにRLSを修正。
DROP POLICY IF EXISTS invitations_select ON invitations;

CREATE POLICY invitations_select ON invitations
    FOR SELECT
    USING (
        (company_id = get_my_company_id())
        OR (auth.role() = 'anon'::text)
        OR (email = (auth.jwt() ->> 'email'::text))
    );
