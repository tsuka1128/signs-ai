# 仕様書：人事戦略 新規ページ「施策ROI（人事施策の振り返り）」

> ステータス：設計・仕様（実装前 / Gates実装）
> 対象：新規 `supabase/migrations/`、新規 `src/app/hr-strategy/campaigns/page.tsx`（または /hr-strategy 内タブ）、新規 `src/lib/logic/campaign-roi.ts`、`src/components/layout/Sidebar.tsx`、必要に応じ `src/hooks/useDashboardData.ts`（既存配列の再利用）
> 目的：人事施策を**キャンペーン登録**し、その**開始月を起点にBefore→Afterの変化（生産性・KPI・体温・人件費・売上）をデータで可視化**、**創出価値を金額換算**して「この施策の成果は◯◯万円」と数字的根拠で報告できる、人事戦略の新しい価値を届ける。
> 方針確定（オーナー）：見出し金額＝**生産性効率インパクト**／**売上インパクトは is_revenue（売上・利益）KPIがある対象のみ表示・未登録は非表示**／**離職回避チャネルはv1では含めない**／信頼性は**DiD-lite（対象−対照群）＋トレンド比較**で担保。

---

## 1. 使える既存データ（部署/軸×月・直近13ヶ月）
`useDashboardData` の `displayDepts`/`displayAxes` が既に保持：
- `kpiAchHistory` / `kpiAchHistoryFilled`（KPI達成率%・欠損キャリーフォワード済＝PR#202）
- `productivityHistory` / `productivityHistoryFilled`（生産性＝達成率×体温/3.0）
- `pulseHistory`（体温0-5）
- `headHistory`（人数 head_count）
- 人件費：`totalLaborCost`（月次）/ `resource_records.labor_cost`（部署・軸×月）
- 売上：`kpi_definitions.is_revenue=true` の KPI を `kpi_records.value` で月次取得（対象部署/軸に紐づくもの）
- 月インデックス：`last13Months`（index 12 = 最新月、YYYY-MM-01）

> v1は**ライブ計算**（スナップショット表なし）。測定は直近13ヶ月窓に限る（それ以前開始の施策は「測定期間外」と表示）。

---

## 2. データモデル（新規テーブル `hr_campaigns`）

新規 migration を `supabase/migrations/` に作成（**SQL Editor直接変更は禁止**＝CLAUDE.md）。

```sql
CREATE TABLE IF NOT EXISTS public.hr_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text,                         -- 'hiring'|'placement'|'system'|'development'|'culture'|'other'
    department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL, -- NULL かつ axis_id NULL = 全社
    axis_id uuid REFERENCES public.kpi_axes(id) ON DELETE SET NULL,
    launched_at date NOT NULL,             -- 施策開始月 YYYY-MM-01
    invested_cost numeric,                 -- 任意：投資額(円)。ROI%・回収期間の算出に使用
    roi_assumptions jsonb NOT NULL DEFAULT '{}'::jsonb, -- {lagMonths, windowMonths, salesAttribution}
    memo text,
    status text NOT NULL DEFAULT 'active', -- 'active'|'archived'
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_campaigns ENABLE ROW LEVEL SECURITY;

-- SELECT: 同一会社メンバー全員
CREATE POLICY "hr_campaigns_select" ON public.hr_campaigns
  FOR SELECT USING (company_id = get_my_company_id());

-- INSERT / UPDATE / DELETE は経営層のみ（※Postgresは1ポリシー1アクション。まとめ書き不可）
CREATE POLICY "hr_campaigns_insert" ON public.hr_campaigns
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','executive','super_admin')
  );
CREATE POLICY "hr_campaigns_update" ON public.hr_campaigns
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','executive','super_admin')
  ) WITH CHECK (
    company_id = get_my_company_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','executive','super_admin')
  );
CREATE POLICY "hr_campaigns_delete" ON public.hr_campaigns
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin','executive','super_admin')
  );

CREATE INDEX IF NOT EXISTS idx_hr_campaigns_company ON public.hr_campaigns(company_id);
```
- 適用は `supabase db push`、その後 `supabase db pull` で差分ゼロ確認（CLAUDE.md厳守）。
- `src/types/database.ts` に `hr_campaigns` 型を追加。

> 注：v1で `campaign_roi_snapshots` は**作らない**（ライブ計算で足りる）。13ヶ月超の長期測定が必要になった段階で追加検討。

---

## 3. 金額換算ロジック（新規 `src/lib/logic/campaign-roi.ts`・純関数）

### 3.1 測定ウィンドウ
- `lagMonths`（効果発現ラグ・既定1）：開始直後の m=launchIdx..launchIdx+lag-1 は効果集計から除外。
- `windowMonths`（既定3）：Before窓。
- `launchIdx` = `last13Months` 内で `launched_at` に一致する月の index。範囲外なら「測定期間外」。
- **Before窓** = index `[launchIdx-windowMonths .. launchIdx-1]` の平均（Filled配列使用）。
- **After（効果）期間** = index `[launchIdx+lagMonths .. 12]`（最新まで）。`After平均` はこの期間平均。
- 効果月数 `effectMonths` = After期間の月数。`effectMonths < 1` の場合は「効果測定にはあと N ヶ月」ステート（金額は出さない）。

### 3.2 対象スコープの集計
- 部署指定：`displayDepts` の該当1件。
- 軸指定：`displayAxes` の該当1件。
- 全社（department_id・axis_id 共にNULL）：`displayDepts` を**人数加重平均**（率系＝head加重平均、人件費・人数＝合計）で集計した系列を用いる。

### 3.3 チャネル①：生産性効率インパクト（見出し金額・最堅牢）
- 生産性 P_m = `productivityHistoryFilled[m]`。
- 各 After月 m について `ratio_m = P_m / P_before − 1`（P_before = Before窓平均）。
- 月次効率価値 `v_m = laborCost_m × ratio_m`（laborCost_m = その月の対象人件費・円）。
- **総効率価値（gross）= Σ_{m∈After} v_m**。
- 見出しは **DiD-lite ネット** を採用（3.5）。

### 3.4 チャネル②：売上インパクト（is_revenue KPIがある対象のみ・無ければ非表示）
- 対象スコープに紐づく `is_revenue=true` KPI の月次実績合計 `R_m`（既存の dept/axis 紐付けロジックに準拠）。該当KPIが0件なら**このチャネルを描画しない**。
- `R_before` = Before窓平均。各After月 `inc_m = (R_m − R_before) × salesAttribution`（`salesAttribution` 既定1.0、画面で調整可・「相関であり厳密な因果ではない」と明示）。
- **売上インパクト = Σ_{m∈After} inc_m**（DiDネット適用可）。
- ラベル：「売上・利益への寄与（参考）」。見出しには使わない（オーナー方針）。

### 3.5 信頼性：DiD-lite（差分の差分）
- 対照群 = **全社平均から対象を除いた系列**（部署指定時は他部署の人数加重平均、全社指定時は…対照なし＝gross表示）。
- 各指標の `ratio`（生産性・KPI達成率・体温・売上）について `net = target_ratio − control_ratio`。
- **見出しの効率価値は net ratio を使用**：`v_m = laborCost_m × net_ratio_m`。
- 画面に gross / net 両方を出し、「全社トレンドを差し引いた純効果＝net」と注記。
- 補助として「直近KPI vs その前3ヶ月」のトレンド差（既存の考え方）を Before→After のトレンド線として可視化。

### 3.6 ROI%・回収期間（invested_cost があるとき）
- `ROI% = (見出し創出価値 − invested_cost) / invested_cost × 100`
- `回収期間(月) = invested_cost / (見出し創出価値 / effectMonths)`（月次創出ペースで割る）

---

## 4. ページ / UX

### ルート・ナビ
- 新規 `/hr-strategy/campaigns`（または `/hr-strategy` 内タブ）。**PROゲート**（既存 `/hr-strategy` と同様 `usePlanFeatures`/`PlanGate`）＋ロールガード（admin/executive/super_admin、それ以外は `/` へ）。
- `Sidebar.tsx` の「人事戦略」PROセクションにサブリンク「施策ROI」を追加（既存 `/hr-strategy` リンクの隣）。

### 一覧
- 施策カード：タイトル / カテゴリバッジ / 対象（全社・部署名・軸名）/ 開始月 / **見出し創出価値¥（net効率価値）** / ROI%（cost時）/ ステータス。
- 「施策を登録」ボタン、空状態（やさしい誘導文・登録を促す）。

### 登録/編集モーダル
- 施策名（必須）/ カテゴリ / 対象（全社・部署・軸の選択）/ 開始月（YYYY-MM）/ 投資額（任意・円）/ メモ。
- roi_assumptions（lag/window/salesAttribution）は詳細画面の前提スライダーで調整・保存。

### 詳細
- **ヘッダー金額**：見出し創出価値¥（net効率価値）＋ ROI%・回収期間（cost時）。「DiDで全社トレンド除去済み」バッジ。
- **Before→After 比較カード**：生産性 / KPI達成率 / 体温 / 人件費 /（売上：該当時のみ）。各 Before値・After値・Δ・**netΔ**。
- **スパークライン**：各指標の13ヶ月推移に**開始月マーカー（縦線）**とBefore/After平均線。
- **バブル軌跡**：組織マップ上で施策前→後に対象がどう動いたか（既存 `ScatterPlot`/`getDotColor`/`getMovementDirection` 資産を再利用。v1で重ければv1.5でも可）。
- **金額内訳＋前提スライダー**：①効率（＝見出し）②売上（該当時）。lag/window/salesAttribution を動かすと即再計算（保存可）。
- **測定不足ステート**：開始から lag+1ヶ月未満／launchIdxが13ヶ月窓外なら、金額の代わりに「効果測定にはあとNヶ月」を表示。
- **注記**：相関であり厳密な因果ではない旨、DiDで全社トレンドを除去している旨、売上は参考値である旨。

---

## 5. スコープ / スコープ外

| 項目 | v1 |
|---|---|
| `hr_campaigns` テーブル＋RLS＋型 | ✅ |
| 施策の登録/編集/アーカイブ | ✅ |
| 効率インパクト（見出し・DiD net） | ✅ |
| 売上インパクト（is_revenue対象のみ・無は非表示） | ✅ |
| Before→After比較・スパークライン・前提スライダー・ROI%/回収期間 | ✅ |
| バブル軌跡（既存マトリックス再利用） | ✅（重ければv1.5） |
| 離職回避コストチャネル | ❌（v1除外・将来追加可） |
| 13ヶ月超の長期測定（snapshot表） | ❌（将来） |
| AIによる施策効果の文章解説 | ❌（将来。hr_strategyとは別） |

---

## 6. レビュー観点（Claude）

- **DB乖離防止**：migrationファイルで作成・`db push`／`db pull`差分ゼロ。SQL Editor直変更なし。RLSは select=全員、insert/update/delete=admin/executive/super_admin の**個別ポリシー**（まとめ書きしていない）。`kpi_axes` を正しく参照。
- **計算の正しさ**：Before窓/ラグ/After窓の index 範囲が正確か。Filled配列（PR#202）を使い欠損で破綻しないか。全社スコープの人数加重集計が妥当か。
- **DiD**：対照群＝対象を除く他部署の加重平均で、net = target − control になっているか。全社スコープ時に対照が無いケースの扱い（grossにフォールバック）が明示されているか。
- **売上チャネル**：is_revenue KPIが対象に紐づく時のみ描画。未登録で非表示・エラーにならないか。見出しには売上を使っていないか（効率がheadline）。
- **見出し金額**：net効率価値＝Σ(laborCost_m × netRatio_m)。離職回避を含めていないか。
- **測定不足ステート**：launchIdx窓外／effectMonths<1 で金額を出さず案内表示か。
- **ガード**：PROゲート＋ロール（admin/executive/super_admin）。プレイヤー/マネージャーはアクセス不可。
- **匿名性**：体温は集計値のみ。個人特定情報を出さない（既存 anonymity 方針）。
- tsc/eslint クリーン。配色・トーンは既存（チカチカしない・本文13px方針と整合）。

---

## 7. 提供価値（このページの狙い）
「人事施策はやったが、振り返りを**数字的根拠**で語れない」を解消。施策タイミングを起点に、**実際に使った人件費に根ざした効率インパクトを金額化**し、DiDで全社トレンドを除いた**純効果**として「この施策は◯◯万円の価値を生んだ」と経営に報告できる。売上KPIがある部署では売上寄与も参考表示。**人事戦略の成果を金額で報告できる**という新しい価値を届ける。
