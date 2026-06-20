# 仕様書：ボイスチェックの声（部署AI要約）の強化

> ステータス：設計・仕様（実装前）
> 対象：`src/app/api/ai/dept-summary/route.ts`（AI生成）、`src/app/dept/page.tsx`（表示）、`dept_ai_summaries`（カラム追加）、`src/types/database.ts`
> 目的：「ボイスチェックの声（AI要約）」が薄いので、入力と出力を厚くして分析の質・量を上げる。

## 現状が薄い原因（コードで確認済み）
1. **入力が自由コメントのみ**：`free_comment` / `cross_dept_feedback` だけ渡しており、設問別スコア・低スコア・体温・全社比などの**定量情報を渡していない** → 表面的要約しか出せない。
2. **プロンプトが極端に短い**：positive 50字／negative 50字／manager_hint 40字。
3. **`maxTokens: 512`** で頭打ち。
4. 課題が明示的に無いと `negative_summary` が空（「—」）になる。

## 強化方針（確定：入力強化＋新セクション追加）

### A. 入力を厚く（`dept-summary/route.ts`）
プロンプトに自由コメントに加えて、その部署・対象月の**定量コンテキスト**を渡す：
- **設問別スコア**（設問テキスト＋平均）と**低スコア項目**（3.0未満）
- **部署の体温平均**
- **全社平均との差**（設問別 or 体温の全社比。`/dept` 既存ロジックや company answers を再利用）
- **前月比**（可能なら前月の体温/設問平均との差）
- ※ これらは route 内で survey_answers を取得して算出（dept・company・前月）。既存の匿名ガード（3名以上）は維持。

### B. 出力を厚く（プロンプト＋スキーマ）
- `positive_summary` / `negative_summary`：50字制限を撤廃し、**2〜3文・具体的に**。
- `negative_summary`：明示的な不満が無くても、**低スコア項目から潜在リスクを示唆**（空「—」にしない）。
- **新フィールド `deep_dive`（深掘り分析：背景と示唆）**：声と数字を統合し「なぜこうなっているか／今後何が起きそうか」を**3〜5文**で。
- `topics`：3〜5 → **5〜7件**。
- `manager_hint`：今月の注目点を**2〜3点**（箇条書き的でも可）に拡張。
- `maxTokens`：512 → **約2000**。

### C. DB・型・UI
- **migration**：`dept_ai_summaries` に `deep_dive text`（nullable）を追加（`ALTER TABLE ... ADD COLUMN deep_dive text;`、冪等に `IF NOT EXISTS`）。
- **型**：`src/types/database.ts` の `dept_ai_summaries` Row に `deep_dive: string | null` を追加。
- **UI**（`dept/page.tsx` の AI要約ブロック）：
  - 「深掘り分析（背景と示唆）」セクションを新規表示（`deep_dive`）。`null`（旧キャッシュ）のときは非表示。
  - ポジ／課題が長文になるのでレイアウト調整（折返し・余白）。

## 既存キャッシュとの互換
- 既存の `dept_ai_summaries` 行には `deep_dive` が無い（null）→ UIは非表示。
- PR#183 の **force 再生成**で最新版（厚い分析）に更新できる。プロンプト刷新後に再生成すれば新フィールドが埋まる。

## スコープ
| 項目 | 対象 |
|---|---|
| 入力に定量コンテキスト追加（設問別/低スコア/体温/全社比/前月比） | ✅ |
| 出力拡張（長文化・潜在リスク・deep_dive・topics増・maxTokens増） | ✅ |
| `deep_dive` カラム追加（migration）＋型＋UI | ✅ |
| 匿名ガード（3名以上） | 維持 |
| 全社AI分析（analyze）side | ❌ 対象外（dept-summaryのみ） |

## 注意・レビュー観点
- **匿名性**：定量を足しても個人特定につながらないこと（3名ガード維持、個人名・特定業務を出さない指示をプロンプトに明記）。
- 全社比・前月比の算出が**同月・全社横断**で正しいか（トレーリングと混同しない）。
- `maxTokens` 増による生成時間・コスト増は許容範囲か（手動生成なので可）。
- 旧キャッシュ（deep_dive=null）でUIが壊れないか。
- `system_settings` のプロンプト変更に該当する場合は CLAUDE.md に従いPR説明に記載（本件は route 内のコード文字列なら不要、stored prompt変更時は記載）。
- migration 後 `supabase db push`／`db pull` 差分ゼロ確認（CLAUDE.md）。
