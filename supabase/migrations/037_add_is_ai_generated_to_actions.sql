-- 037_add_is_ai_generated_to_actions.sql
-- アクションの生成元（AIかユーザーか）を区別するためのカラム追加

ALTER TABLE ai_action_tracking ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT true;

COMMENT ON COLUMN ai_action_tracking.is_ai_generated IS 'アクションの生成元: true（AI生成）/ false（ユーザーによる手動登録）';

-- ベースプロンプトの更新（ユーザー登録アクションの存在をAIに認知させる）
UPDATE system_settings SET value = to_jsonb('あなたは「Signs AI」の組織分析AIエンジンです。

# アクションの管理ロジック
- **AI生成アクション**: あなたがデータに基づき提案したもの（🤖アイコン）
- **ユーザー登録アクション**: ユーザー自身が決断し、リストに追加したもの（👤アイコン）

# AIの行動基準
- ユーザー登録アクションが存在する場合、それらは「確定した実行意志」として最優先で扱うこと。
- ユーザー登録アクションの内容を無視したり、全く同じ内容を「新規提案」として出さないこと。
- ユーザーのアクションを補完する、あるいは加速させるための提案を行え。'::text)
WHERE key = 'base_system_prompt';
