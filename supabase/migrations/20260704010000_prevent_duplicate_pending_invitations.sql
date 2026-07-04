-- 招待の重複防止：同一会社・同一メールで status='pending' の招待は1件のみに制限する。
--
-- 背景：invitations の一意制約は UNIQUE(token) のみで、token は毎回ランダムなため
-- 同一メール宛ての pending 招待が無制限に作成できた。Supabase障害時の再送や
-- 送信ボタンの連打で、同一メンバーの招待レコードが重複して並ぶ不具合が発生した。

-- ① 既存の pending 重複を解消：各 (company_id, email) で最古(created_at 最小)の1件だけ残す
DELETE FROM invitations a
USING invitations b
WHERE a.status = 'pending'
  AND b.status = 'pending'
  AND a.company_id = b.company_id
  AND a.email = b.email
  AND a.created_at > b.created_at;

-- ② created_at が同値のタイブレーク（id が大きい方を削除）
DELETE FROM invitations a
USING invitations b
WHERE a.status = 'pending'
  AND b.status = 'pending'
  AND a.company_id = b.company_id
  AND a.email = b.email
  AND a.created_at = b.created_at
  AND a.id > b.id;

-- ③ pending のみを対象にした部分一意インデックス
--    （accepted/expired/cancelled になれば同じメールに再招待できる）
CREATE UNIQUE INDEX IF NOT EXISTS uniq_invitations_pending_company_email
  ON invitations (company_id, email)
  WHERE status = 'pending';
