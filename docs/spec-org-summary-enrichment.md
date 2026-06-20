# 仕様書：組織サマリー強化 —「部署の今 × AIの読み」ハブ化

> ステータス：設計・仕様（実装前 / Gates実装）
> 対象：`src/components/dashboard/sections/OrganizationSection.tsx`、`src/components/dashboard/OrganizationCard.tsx`、`src/app/page.tsx`（reportセクション）
> 目的：弱い「組織サマリー」を再定義し、`部署別の診断メッセージ`(insights_by_dept) を統合。KPI推移との重複を解消し、reportを全社専用に純化する。
> 新規API・新規DB・新規AI出力は**不要**（既存 `aiContent.insights_by_dept` を使うだけ）。

---

## 背景：いまの問題（事実ベース）

1. **report に部署タブが残り「全社/部署」が再混在**
   以前の report 再設計で「report＝全社固定」にしたのに、その下に部署タブ式の `部署別の診断メッセージ`（AI方針翻訳）が残っており、直したはずの混在が再発している。粒度的にこれは「部署単位のAIコメント」なので、部署を並べる画面（＝組織サマリー）に置くのが正しい。

2. **組織サマリー と KPI推移 の重複**
   | 要素 | 組織サマリー | KPI推移 |
   |---|---|---|
   | 体温スコア | ✅カード内 | ✅テーブル列 |
   | KPI達成率 | ✅代表＋補助 | ✅詳細＋テーブル |
   | 部署別状態分類 | ✅リスクバッジ(体温) | ✅コンディション診断(体温×達成率) |
   組織サマリーは「部署カードを並べているだけ」で独自価値が薄く、カード下の観察コメントもルールベースの自動文で弱い。

## 役割の再定義（この変更後のIA）

| ページ | 役割（直交させる） |
|---|---|
| **組織サマリー (sec=org)** | **部署で見る**：部署スナップショット（体温/代表KPI/トレンド/状態）＋**AI部署診断**を一望する経営者の起点ページ |
| **KPI推移 (sec=kpi)** | **KPIで見る**：KPI軸・時系列（13ヶ月チャート、コンディション診断、目標健全性、声） |
| **AI組織診断 (sec=report)** | **全社で見る**：全社固定のサマリー＋5観点 deep_report＋リスク。部署別は一切持たない |

---

## ① 組織サマリーの各部署カードに AI部署診断を統合（核）

### 表示仕様
- 各部署カード（`OrganizationCard`）の下部（現在「💬 観察コメント」がある位置）に、**AI部署診断メッセージ**を表示する。
  - 出どころ：`aiContent.insights_by_dept[dept.id]`（`{ tone, text }`）
  - 表示：**toneバッジ**（落ち着いたteal系・チカチカ禁止）＋ **text**（100字程度）
  - 見出しは小さく「AI診断」など（"最新の通知" バッジは組織サマリーでは不要、控えめに）
- **フォールバック**：`insights_by_dept[dept.id].text` が無い場合は、**従来のルールベース観察コメント（`ObservationComment`）を維持表示**する。
  - つまり「AI診断があればAI診断、無ければ自動コメント」。空っぽにはしない。
  - AI未実行の部署に対し、空状態文（「AI分析を実行すると…」）で**置き換えてもよい**が、生成を委縮させない穏やかな文言にすること（既存の方針）。

### 実装メモ
- `OrganizationCard` に props 追加：`deptInsight?: { tone?: string; text?: string }`。
- `OrganizationSection` 側で各部署について `aiContent?.insights_by_dept?.[dept.id]` を引いて `deptInsight` として渡す。
  - **重要**：現在 `OrganizationCard` は `name/head/pulse/...` を受け取るが **dept.id を受け取っていない**。lookup は **OrganizationSection 側で行い**、結果(`deptInsight`)だけをカードに渡す（カードにidを増やす必要はない）。
- カード下部のレンダリングを「`deptInsight?.text` があればAIブロック / なければ `<ObservationComment .../>`」の分岐にする。
- AIブロックのトーンバッジは report 既存実装の配色を流用（`text-teal-600 / bg-teal-50 / border-teal-100`）。チカチカさせない。

### 第2軸（プロダクト等）カードの扱い
- `insights_by_dept` は**部署IDキーのみ**。軸別のAI診断は存在しない（`matrix_insight.axis` はマトリックス全体の俯瞰文で粒度が違うため流用しない）。
- よって**第2軸ビューのカードにはAI部署診断を出さない**（従来の観察コメントのまま）。これは仕様として正しい。

---

## ② report から部署別ブロックを撤去（全社専用化）

- `src/app/page.tsx` の report セクション内 **「B. 部署別の診断メッセージ」ブロック全体を削除**（`<hr>` 区切り＋見出し＋`TabBar`(deptOnlyTabs)＋部署選択時のAI方針翻訳カード一式、概ね現状の `{/* B. 部署別の診断メッセージ */}` から該当 `</div>` まで）。
- 削除後、report は「リスクバナー → キー指標サマリー → 全社固定 MainInsightCard → 5観点 deep_report」で完結（全社のみ）。
- 撤去に伴い **未使用化する import / 変数を除去**：
  - report 内でしか使っていない `deptOnlyTabs`、その生成ロジック、`TabBar`（他で使っていなければ）、`Lightbulb`（他で使っていなければ）。
  - **`tab` / `setTab` state は削除しない**（ダッシュボード全体の部署フィルタとして他セクションで使用）。撤去するのは report 内の表示ブロックのみ。
- `tsc --noEmit` と eslint(no-unused-vars) で未使用が残っていないこと。

---

## ③ ドキュメント整合（任意・軽微）

- `src/app/docs/dashboard-guide/page.tsx` / `docs/flow` 等に「report の部署タブで部署別メッセージが見られる」旨の記述があれば、「組織サマリーの各部署カードでAI診断が見られる」に文言修正。
- `src/components/dashboard/SemanticLayer.tsx` の「各部署へのAI方針翻訳」一覧は**変更不要**（別文脈のため据え置き）。

---

## スコープ

| 項目 | 対象 |
|---|---|
| 組織サマリー 部署カードに insights_by_dept 統合（tone＋text） | ✅ |
| AI診断なし時はルールベース観察コメントにフォールバック | ✅ |
| 第2軸カードはAI診断なし（仕様） | ✅ |
| report から部署別ブロック撤去＝全社専用化 | ✅ |
| 未使用 import/変数の除去（tab stateは残す） | ✅ |
| 新規API / DB / AI出力 | ❌ 不要 |
| 全社俯瞰ストリップ・第2軸ビュー・KPI推移 | 変更なし |

## レビュー観点（Claude）

- 組織サマリーの各部署カードに `insights_by_dept[dept.id]` の tone＋text が出るか。idの lookup が正しい部署と一致しているか。
- AI診断が無い部署でカードが空にならず、観察コメントにフォールバックするか。
- 第2軸カードにAI診断が出ていない（仕様通り）か。
- report から部署タブ／AI方針翻訳ブロックが**完全に**消え、全社固定で完結しているか（"全社/部署" の混在が解消）。
- `tab`/`setTab` が壊れていない（他セクションの部署フィルタが機能）か。未使用 import/変数なし、tsc/eslint クリーン。
- 配色がチカチカしない（toneバッジは穏やかなteal系）。
- 匿名性：insights_by_dept は個人名を含まない前提（analyze側で担保済み）だが、表示で新たに名前が出ないこと。
