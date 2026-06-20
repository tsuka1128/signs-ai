# 仕様書：組織マップ 軌跡・移動矢印・バブル位置の整合修正（キャリーフォワード）

> ステータス：設計・仕様（実装前 / Gates実装）
> 対象：`src/hooks/useDashboardData.ts`、`src/types/dashboard.ts`、`src/components/dashboard/ScatterPlot.tsx`、`src/components/dashboard/sections/MatrixSection.tsx`
> 目的：マトリックスの**軌跡線・移動矢印・バブル位置が別々の基準値**を使っていて整合せず、(1)軌跡がバブルに着地せず下に突き刺さる、(2)当月データが無いだけの部署が誤って「↓悪化」になる、という不具合を解消する。
> 方針：オーナー確認済み＝**キャリーフォワード**（データが無い月は直近の既知値を引き継ぐ）。

---

## 不具合の根本原因（確認済み）

バブルの位置と、軌跡・矢印が**異なる値**を参照している：

| 要素 | 参照値 | 欠損月の扱い |
|---|---|---|
| バブルのY（KPI達成率） | `d.kpiAch`＝**最新KPI月**の値（`useDashboardData` L521、`latestKpiMonth`/staleフォールバック） | 直近の既知値 |
| バブルのY（生産性） | `prodAtMonth`（`MatrixSection` L88-98、pulse=0月は直近をスキャン） | 直近の既知値 |
| 軌跡の各点・終点 | `kpiAchHistory[i]` / `productivityHistory[i]`（`ScatterPlot` L176-178） | **0（欠損＝0）** |
| 移動矢印 ↑↓→ | `kpiAchHistory[targetIdx]` vs `[targetIdx-1]`（`getMovementDirection` L55-60） | **0（欠損＝0）** |

→ 当月（index12）にKPIレコードが無い部署は `kpiAchHistory[12]=0`。
- 軌跡の終点が cy(0)=最下部へ → バブル（最新値で上に描画）から外れて下に伸びる。全バブルがX（人数）同値だと縦軌跡が重なり「1本の線が全部署を貫く」ように見える。
- 矢印は `current=0, prev=先月の実値` → 大きなマイナス → **誤「↓悪化」**。

**重要**：`kpiAchHistory`/`productivityHistory` は **KpiSection（13ヶ月達成率テーブル）・calcKpiSetHealth（`v>0`で有効月判定）・LagCorrelationChart・hr-strategy・AxisComparisonSection** でも使われており、**欠損=0 を前提**にしている。よって**元配列は絶対に書き換えない**。

---

## 修正方針：マトリックス専用の「補完済み配列」を別フィールドで追加

生成時（`useDashboardData`）には **KPIレコード件数 `c`** があり、`c===0`（欠損）と `c>0 && avg===0`（本当の0%）を**区別できる**。これを使って、元配列はそのままに、キャリーフォワード済みの新フィールドを追加する。

### ① `src/hooks/useDashboardData.ts` — 補完済み配列を生成

部署（dept）・第2軸（axis）の**両方**に、以下2フィールドを追加する。

- `kpiAchHistoryFilled: number[]`
- `productivityHistoryFilled: number[]`

生成ルール（13ヶ月を左→右に走査）：
1. 各月の生値と「データ有無フラグ」を求める。
   - KPI：その月の `c`（達成率を集計できたKPI件数）が `c>0` なら **データ有り**＝生値、`c===0` なら **欠損**。
   - 生産性：同じく KPI の `c>0` を「データ有り」とみなす（生産性は KPI×体温由来のため）。
2. `lastKnown` を保持。**データ有りの月**＝生値を採用し `lastKnown` を更新。**欠損の月**＝`lastKnown` を採用（＝前月コピー）。
3. **先頭（まだ一度もデータが無い区間）**は `lastKnown` 未確定なので `0` のまま（無理に後方補完しない）。

実装メモ：
- 既存の `kpiAchHistory`/`productivityHistory` の `.map(...)` 内で `c` を計算済み（dept: L552-568 / L588-610、axis: L746-770）。これらと**同じ集計**を使い、`{ value, hasData: c>0 }` の配列を一旦作ってから、上記キャリーフォワードを適用して `*Filled` を作るのが安全。
- 既存配列（`kpiAchHistory`/`productivityHistory`）は**変更しない**（他コンポーネントの欠損=0前提を守る）。
- dept と axis で同じヘルパ関数（例：`carryForward(values: {value:number; hasData:boolean}[]): number[]`）を共有してよい。

### ② `src/types/dashboard.ts` — 型に追加

```ts
kpiAchHistoryFilled?: number[];
productivityHistoryFilled?: number[];
```

### ③ `src/components/dashboard/ScatterPlot.tsx` — 軌跡・矢印を補完済みに統一

- **軌跡の値**（L176-178）：
  - `yAxisMode==="kpi"` → `(d as any).kpiAchHistoryFilled?.[i] ?? (d as any).kpiAchHistory?.[i] ?? 0`
  - `productivity` → `(d as any).productivityHistoryFilled?.[i] ?? (d as any).productivityHistory?.[i] ?? 0`
- **軌跡のスキップ条件**（L181）は現状維持：`pulse===0 || head===0` の月は引き続きスキップ（リソース/回答が無い月は点を打たない）。Y値だけを補完する。
- **`getMovementDirection`**（L55-60）：`kpiAchHistory`/`productivityHistory` を `*Filled` に置換（`?? d.kpiAch` / `?? d.productivity` のフォールバックは残す）。
  - これにより「当月欠損で前月実値あり」のとき current=prev=直近既知値 → **差分0 → →（維持）**になり、誤「↓悪化」が消える。

### ④ `src/components/dashboard/sections/MatrixSection.tsx` — バブルYを月対応＋補完済みに

`deptScatterData`（L84-115）・`axisScatterData`（L130-）で、**選択タイムラプス月 `targetIdx` の補完済み値**をバブルに渡す：

- 生産性：`productivity: d.productivityHistoryFilled?.[targetIdx] ?? prodAtMonth`（既存の pulse スキャンは残してフォールバックにしてよい）。
- **KPI達成率（現状バグ：月対応していない）**：新たに `kpiAch: d.kpiAchHistoryFilled?.[targetIdx] ?? d.kpiAch` を渡す。
  - 現状 `deptScatterData` は `kpiAch` を上書きしないため、**KPIモードではタイムラプスを変えてもバブルYが動かない**。これも本修正で月対応にする。
- ねらい：**バブルY（targetIdx）＝軌跡終点（targetIdx）＝矢印の current（targetIdx）** が同一配列・同一indexになり、軌跡がバブルに着地し、矢印・色・位置が一致する。

---

## スコープ

| 項目 | 対象 |
|---|---|
| `*HistoryFilled`（dept/axis）を生成（元配列は不変） | ✅ |
| 型に2フィールド追加 | ✅ |
| 軌跡・移動矢印を Filled に統一 | ✅ |
| バブルYを targetIdx 月対応＋Filled に（KPIモードの月非対応バグも解消） | ✅ |
| 軌跡のスキップ条件（pulse/head===0） | 現状維持 |
| 既存 `kpiAchHistory`/`productivityHistory` と他コンポーネント | 変更なし |

## スコープ外（既知の軽微・別件）

- **X（人数）軸の不整合**：`headHistory[targetIdx]===0` の月はバブルが `masterHeadcount` にフォールバックする一方、軌跡はその月をスキップするため、リソース未登録月で終点XがわずかにずれうるN。今回の報告（Y/軌跡が下に刺さる）とは別問題のため本スコープ外（必要なら別途）。

## レビュー観点（Claude）

- `kpiAchHistory`/`productivityHistory`（元配列）が**一切変更されていない**こと（KpiSectionの13ヶ月テーブル・calcKpiSetHealth・LagCorrelation・hr-strategy・AxisComparison が無影響）。
- `*Filled` のキャリーフォワードが「**欠損(c=0)のみ前月コピー / 本当の0%(c>0)は0のまま**」になっているか（c による区別）。先頭の未確定区間は0のままか。
- KPIモード・生産性モードの**両方**で、軌跡の終点がバブルに着地するか。タイムラプス（現在/1m/3m/6m/1年）を変えても整合するか。
- 当月データが無いだけの部署が **↓悪化 → →維持** に変わるか（誤判定の解消）。実際に悪化した部署は ↓ のままか。
- dept マトリックス・axis マトリックスの両方で機能するか。
- tsc/eslint クリーン。配色・アニメ（900ms ease）は不変。
