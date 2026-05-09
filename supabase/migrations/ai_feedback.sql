-- ai_feedback テーブル作成
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_month TEXT NOT NULL,
    target_field TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('accurate', 'inaccurate', 'partial')),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- get_my_company_id() 関数を利用してセキュアに分離
CREATE POLICY "ai_feedback_select" ON ai_feedback
    FOR SELECT USING (company_id = get_my_company_id());

CREATE POLICY "ai_feedback_insert" ON ai_feedback
    FOR INSERT WITH CHECK (company_id = get_my_company_id());
