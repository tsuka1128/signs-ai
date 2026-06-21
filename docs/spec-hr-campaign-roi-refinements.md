# 仕様書：施策ROIページ 改善6点（PR#207マージ後のフォローアップ）

> ステータス：設計・仕様（実装前 / Gates実装）
> 前提：PR#207「施策ROI」はmainにマージ済み（`3aaa10c`）。本件は**main起点の新規フォローアップPR1本**で6点を一括実装する。
> 主対象：`src/app/hr-strategy/campaigns/page.tsx`、計算は不変（`src/lib/logic/campaign-roi.ts`）、⑤のみ新規migration＋型。

---

## ① 誤字修正（測定範囲外の説明文）
- 場所：測定範囲外メッセージの説明文（grep目印：`13 ヶ月窓内` / `窓内`）。
- 現：「開始月を 13 ヶ月窓内（最新から 13 ヶ月以内）に指定し、…」
- 修正：**「開始月を直近13ヶ月以内に指定し、…」**（「窓内」削除・重複括弧整理）。

## ② 「改善幅 (Gross)」「純効果 (Net)」に [?] 解説ツールチップ
- 場所：詳細の指標比較テーブル見出し（grep目印：`改善幅 (Gross)` / `純効果 (Net)`）。
- 各見出しに小さな `?` ホバー解説を追加（既存の `?` ツールチップ実装＝`KpiSection`/`ScatterPlot` の `group-hover` パターンを流用、チカチカしない穏やかなトーン）：
  - **改善幅 (Gross)**：「対象組織の Before→After の単純な変化量。全社的な追い風/逆風も含む」
  - **純効果 (Net)**：「他部署（対照群）の同期間の変化を差し引いた、施策固有の純効果。DiD-lite（差分の差分）で全社トレンドを除去済み」

## ③ 組織マップの軌跡は「対象スコープのみ」のバブルに
- 場所：`scatterPlotData` 構築（grep目印：`組織マップ用のバブル軌跡データ` / `scatterPlotData`）。現状は `displayDepts` 全件を返し全部署のバブルが出る。
- 修正：**対象スコープ1件にフィルタ**してから渡す。
  - 部署指定：`list.filter(d => d.id === selectedCampaign.department_id)`
  - 軸指定：`displayAxes` から該当軸のみで構築（現状 displayDepts 固定なので軸施策だと誤表示。該当軸1件に）
  - 全社指定：従来どおり全件（または対象なしの注記）
- 結果：詳細の組織マップは**その施策の対象バブル1個＋その軌跡**だけ表示。

## ④ 施策リストの再編集
- 現状：登録(insert)／アーカイブ(status update)／削除 はあるが、**登録内容（施策名・カテゴリ・対象・開始月・投資額・メモ・⑤の改善KPI）の編集が無い**。
- 修正：
  - 登録モーダルを**追加/編集 兼用**にする（`editingId` state を持ち、開く時にフォームへ既存値をプリフィル）。
  - 各施策カード／詳細ヘッダーに「編集」ボタンを追加。
  - 送信時、`editingId` があれば `insert` ではなく `.update({...}).eq('id', editingId)`。成功トースト「施策を更新しました」。
  - RLSの update ポリシーは admin/executive/super_admin で既に許可済み（追加不要）。`updated_at` も更新。

## ⑤ 「改善すべきKPI」の任意指定（表示フォーカス専用）
- **新規migration**（既存migrationは不変）：`hr_campaigns` に列追加
  ```sql
  ALTER TABLE public.hr_campaigns
    ADD COLUMN IF NOT EXISTS target_kpi_id uuid REFERENCES public.kpi_definitions(id) ON DELETE SET NULL;
  ```
  - `supabase db push` 後 `supabase db pull` で差分ゼロ確認（CLAUDE.md厳守）。`src/types/database.ts` の `hr_campaigns` 型に `target_kpi_id` 追加。
- 登録/編集モーダルに「改善を狙うKPI（任意）」セレクト。**対象部署/軸のKPIに絞る**（全社時は全KPIまたは未選択可）。
- 詳細画面：`target_kpi_id` が指定されている場合、**そのKPI単体の Before→After を主役として強調表示**（指定が無ければ従来どおり）。
- **重要：見出し金額・DiD計算（`campaign-roi.ts`）は一切変更しない**。指定KPIは表示フォーカス専用（オーナー確定）。

## ⑥ 投資額入力のカンマ区切り表記
- 場所：登録/編集モーダルの投資額入力（grep目印：`formInvestedCost`）。
- 修正：入力値を**3桁カンマ区切り表示**（例 `1,000,000円`）。保存は数値に戻す（`Number(value.replace(/,/g, ''))`）。
- 表示側の見出し金額は `toLocaleString` 済みのため対象外（入力欄のみ）。

---

## スコープ / レビュー観点（Claude）
- ③：対象スコープ**1件のみ**になるか。軸施策で誤って部署バブルが出ないか。全社時の挙動。
- ④：編集時 `update` が走り `insert` にならないか。`editingId` のクリア漏れ（次の新規登録が編集扱いにならない）に注意。
- ⑤：**新規migrationで既存テーブル/列は不変**・`db pull` 差分ゼロ。型追加。**`campaign-roi.ts` の金額算出ロジックが不変**であること。指定KPIは表示のみ。対象スコープのKPIに絞れているか。
- ②：解説文言が正確（Gross=単純差/Net=DiD純効果）。配色穏やか。
- ⑥：保存値が数値（カンマ混入で `NaN`/文字列保存にならない）。
- 全体：tsc/eslintクリーン。本文13px方針・落ち着いた配色と整合。匿名性（個人名を出さない）。
