-- 036_add_action_priority_and_pending_review.sql
-- アクション優先度のユーザー編集機能と、次月の「検討中」ステータスへの移行ロジック
-- ① ai_action_tracking に priority カラムを追加
-- ② プロンプトに「キープ（来月以降）→ 次月：検討中（pending_review）」のロジックを注入

-- ============================================================
-- 1. 優先度カラムの追加
-- ============================================================
ALTER TABLE ai_action_tracking ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
  CHECK (priority IN ('urgent', 'high', 'normal'));

-- ステータスに 'under_review' (検討中) を追加
ALTER TABLE ai_action_tracking DROP CONSTRAINT IF EXISTS ai_action_tracking_status_check;
ALTER TABLE ai_action_tracking ADD CONSTRAINT ai_action_tracking_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'kept', 'under_review'));

COMMENT ON COLUMN ai_action_tracking.priority IS 'ユーザーまたはAIが決めた優先度: urgent（最優先）/ high（重要）/ normal（推奨）';
COMMENT ON COLUMN ai_action_tracking.status IS '実行ステータス: ... / kept（今月はキープ）/ under_review（前月から引き継がれた検討中施策）';


-- ============================================================
-- 2. ベースプロンプトの更新（ライフサイクル管理の精緻化）
-- ============================================================
UPDATE system_settings SET value = to_jsonb('あなたは「Signs AI」の組織分析AIエンジンです。

# アクションのライフサイクル管理（詳細）
1. **継続表示（文脈として維持）**
   - 「accepted（実行中）」: 進行中。次月も「実行中」として表示。
   - 「kept（キープ）」: 今月は保留。**次月の更新タイミングでは「under_review（検討中）」にステータスが移行する。**
   - 「under_review（検討中）」: 前月から引き継がれた検討中施策。今月こそ実行すべきか再評価する。

2. **終了・非表示（履歴としてのみ維持）**
   - 「completed（完了）」: 施策終了。次月のリストからは消える。
   - 「rejected（不採用）」: 拒否。次月のリストからは消える。

# 優先度の尊重
- ユーザーが手動で設定した「priority」が高いものは、今回の分析でも重点的に扱うこと。'::text)
WHERE key = 'base_system_prompt';


-- ============================================================
-- 3. アクション提案プロンプトの更新
-- ============================================================
UPDATE system_settings SET value = to_jsonb('# 月次アクション提案AI

## 提案の構成
- **新規提案**: 今月の課題に基づき、空白枠に対して提案。
- **検討中施策の再評価**: 前月「キープ」され、今月「検討中（under_review）」となった施策について、実行すべき根拠を強めて再提示する。
- **実行中施策のフォロー**: 進捗を確認。

## 優先度の決定
- 各提案に「最優先(urgent)」「重要(high)」「推奨(normal)」のいずれかを付与せよ。
- ユーザーが過去に優先度を上げたカテゴリや、下げたカテゴリを記憶し、好みを反映せよ。'::text)
WHERE key = 'ai_action_proposal_prompt';
