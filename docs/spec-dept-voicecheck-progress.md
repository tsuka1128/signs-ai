# 仕様書：部署マネジメント – ボイスチェック回答状況の可視化と通知

> ステータス：**改訂3（分母を月次実績人数に切替）**
> 前提方針：**匿名性を維持する（人数だけを扱い、個人は特定しない）**
> 関連画面：`src/app/dept/page.tsx`

## ⚠️ 改訂3：分母を「月次実績人数（resource_records.head_count）」に切替（最新・最重要）

**改訂2では `departments.headcount`（想定人数・単一値）を分母にしたが、月次の実績人数 `resource_records.head_count` に切り替える。**

### 背景：「人数」の入力欄が2か所あり連動していない（コードで確認済み）
| | 設定ページ「想定人数」 | 人件費・人数入力ページ（`/labor`） |
|---|---|---|
| 保存先 | `departments.headcount`（単一値） | `resource_records.head_count`（**月次・13ヶ月の時系列**） |
| 形式 | — | `recorded_month` = **YYYY-MM-01**、`axis_id IS NULL` が部署基本データ |
| 本来の用途 | AI分析の `master_headcount`・計画基準値（`api/ai/analyze/route.ts:264`）、既存admin画面 | ダッシュボードの人件費ROI・一人当たり単価などの月次分析 |
| 同期 | **`/labor`保存では更新されない**。CSVインポート時のみ最新月→headcountへ一方向コピー（`CSVImportModal.tsx:231`） | — |

→ 2つは連動せず、放置すると `departments.headcount`（想定人数）が陳腐化する。一方 `resource_records` は**月ごとの実人数**を持ち、分析で使うためこまめに更新されやすい。回答率の分母として月次実績の方が正確。

### 改訂3の変更内容（実装）
1. **回答率の分母を月次実績人数に切替**：分母を、その月の `resource_records.head_count`（`department_id` 一致、`axis_id IS NULL`、`recorded_month = {YYYY-MM}-01`）に変更。
   - `src/app/dept/page.tsx`：推移グラフの各月（過去6ヶ月）で、**その月の** head_count を分母にする（月ごとに正確な回答率）。
   - `src/app/api/cron/voice-check-digest/route.ts`：**当月の** head_count を分母にする。
   - **一貫性**：既存の経営層向け画面 `src/app/voice-check/page.tsx:282-312` も `departments.headcount` → 月次 `resource_records.head_count` に統一する（2画面で回答率が食い違わないように）。
2. **月形式の変換**：`survey_responses.recorded_month`（**YYYY-MM**）⇔ `resource_records.recorded_month`（**YYYY-MM-01**）。突合時に変換する。
3. **当月は前月のコピーで分母を出す（計算時のみ・確定方針）**：回答率の分母を出すとき、**当月の `head_count` が無い／0なら、直近の入力済み月（前月→さらに前月…）の head_count をコピーして使う**（read-time copy-forward）。
   - **`resource_records` のデータ自体は書き換えない**（seed・保存はしない）。あくまで分母を算出するときだけ前月値を借りてくる。
   - これにより `/labor` を当月開いていなくても、前月に人数が入っていれば回答率・完了判定・リマインドが正しく動く（人件費入力までの無反応を防ぐ）。
   - 実装は **共通ヘルパー**（例：`resolveHeadcount(departmentId, ym): number`）に切り出し、`dept/page.tsx`・`cron/route.ts`・`voice-check/page.tsx` の3か所から呼ぶ（ロジック重複・食い違い防止）。
   - 探索範囲は取得済みの過去13ヶ月内で十分。どの月にも実績が無ければ分母0として率・完了判定・リマインドを出さない（改訂2のガード踏襲）。
   - 影響範囲：ダッシュボードの人件費ROIやAIの `master_headcount` には**影響しない**（それらは実データを参照し続ける）。コピーは回答率算出の内部だけ。
4. **`departments.headcount`（想定人数）は撤去しない**：AI分析の `master_headcount` や既存admin画面で使われる**別概念（計画基準値）**として残す。ただし改訂2で付けたラベル「想定人数（ボイスチェックの回答率算出に使用）」は誤りになるため、**「AI分析・計画用の基準人数」**等に修正し、回答率は `/labor` の月次実績ベースである旨を明記する。
   - これで「回答率の元になる人数入力は実質 `/labor` の1か所」に集約され、想定人数は計画値として別管理、という整理になる。

### 留意（実装時に確認）
- `resource_records` の部署基本データが `axis_id IS NULL` で合っているか（`kpi_records` と同じ規約か）を実データで確認する。第2軸（`axis_id` 指定）の人数を二重計上しないこと。
- carry-forward の探索範囲（直近何ヶ月遡るか）を決める。実装上は「取得済みの過去13ヶ月のうち、当該月以前で head_count>0 の最新値」で十分。

---

## ⚠️ 改訂2：分母（対象人数）の定義を訂正（※改訂3で月次実績へ再変更。経緯として残置）

**初版で分母を `users`（アカウント数）と定義したのは誤り。`departments.headcount`（手入力の想定人数）に変更する。**

### 理由（コードで確認済み）
ボイスチェックは **未ログイン・匿名**で回答する設計：
- 投稿は `/form?c={short_id}` から誰でも可能（`survey_responses` の RLS は `INSERT WITH CHECK (true)`、`migration 010`）
- `survey_responses.user_id` は **常に NULL**（`src/app/form/page.tsx:164` で入れていない）
- `users` テーブルに載るのは**招待を受けてログインした人だけ**（admin/executive/manager）。**一般社員はアカウントを持たず `users` に存在しない**

→ 「回答する母集団（匿名・一般社員）」と「`users` の母集団（経営層・マネージャー）」は別物。`users` カウントを分母にすると回答率も全員完了判定も破綻する。
- 例：アカウント0名の部署に匿名で5人回答 → `headcount=0` で完了判定もリマインドも出ない／UIは「5 / 0 名」
- 例：アカウント1名（マネージャーのみ）の部署 → 匿名1人回答で即「全員完了」誤判定

### 正しい分母
既存の経営層向けボイスチェック画面（`src/app/voice-check/page.tsx:282`）が既に採用している **`departments.headcount`（管理者が手入力する想定人数）** を分母に統一する。

### この訂正に伴う追加作業（実装必須）
1. **分母の差し替え**：`src/app/dept/page.tsx` と `src/app/api/cron/voice-check-digest/route.ts` の両方で、`users` カウント取得 → `departments.headcount` 参照に変更
2. **headcount 編集UIの追加**：`src/components/settings/DepartmentsTab.tsx` に `departments.headcount`（想定人数）を編集・保存できる入力欄を追加（現状はオンボーディング時しか入らない）
3. **誤解ラベルの修正**：`DepartmentsTab.tsx:51` の「※ 各部署の人数は…アカウント数と自動的に連動しています。」を、想定人数の手入力である旨に修正。現状 `:80` で表示している `users.filter().length`（アカウント数）の扱いも整理する
4. **headcount 未設定（0）時のガード**：分母が0の部署は回答率・完了判定・リマインドを出さない（誤検知防止）。UIバナーも非表示にする

---

## 1. 背景・ゴール

部署マネジメント画面で、以下を実現したい。

1. **回答数の推移**：部署人数（分母）に対する月次ボイスチェック回答数・回答率の推移を見られる
2. **未完了アナウンス**：まだ全員が回答していないとき「あと N 人未回答です。リマインドを」と部署マネージャーに促す
3. **完了通知**：部署全員が回答完了したら経営層／マネージャーへ通知する

## 2. 大前提：匿名性ガード（厳守）

`survey_responses.user_id` は `null` になり得る匿名設計。本仕様では **「誰が答えたか／誰が未回答か」を一切扱わない**。

- 扱うのは **回答“数”** のみ（`respondentCount`）
- 未回答者の特定・個人宛プッシュは**やらない**（別フェーズ／別方針）
- 既存の匿名ガード（回答者数が少数のとき内容を伏せる、`src/app/dept/page.tsx:714` 付近）と整合させる

> ⚠️ 実装時の注意：「あと N 人」を出すとき、N が極端に小さい（例：残り1人）と、誰が未回答か推測されかねない。**閾値ロジックは回答“率/数”の表示に留め、個人を示唆する文言は出さない。**

## 3. データの土台（既存）

| 用途 | 取得元 | 備考 |
|---|---|---|
| 月次回答数 | `survey_responses`（`company_id, department_id, recorded_month`）| `recorded_month` は **YYYY-MM** 形式 |
| 月次スコア | `survey_answers`（`response_id, score`）| 既存集計あり |
| 部署人数（分母）| **`resource_records.head_count`（月次実績人数）**（改訂3） | ~~`users` を count~~（初版・誤）→ ~~`departments.headcount`~~（改訂2）→ 月次実績へ。`department_id` 一致・`axis_id IS NULL`・`recorded_month = {YYYY-MM}-01`。当月未入力なら直近月を繰り越し |
| 通知配信 | `notifications` テーブル + `createNotification()`（`src/lib/notifications.ts`）| サーバー専用・サービスロール |

既に `src/app/dept/page.tsx:240` 付近で過去6ヶ月分の `{ month, label, avg, respondentCount }` を `deptScores[]` に取得済み。**①のデータはほぼ揃っており、UIが無いだけ。**

## 4. 機能①：回答数・回答率の推移グラフ

### データ
- 既存 `deptScores[]`（過去6ヶ月）に **分母（想定人数）** を足す。
- 分母の取り方（改訂2）：当該部署の **`departments.headcount`** を取得し、`headcount` として保持。`users` カウントは使わない。
  - 注意：過去月の人数は厳密には変動しうるが、本フェーズは**現在の headcount を全月共通の分母**とする（簡易）。将来、月次スナップショットが必要なら別テーブル化を検討。

### 計算
```
回答率(%) = respondentCount / headcount * 100   // headcount=0 のときは "—"（率・完了判定とも出さない）
```

### UI（`src/app/dept/page.tsx`）
- 既存スコアセクション付近に「回答状況の推移」カードを追加
- 棒グラフ or 折れ線で、月別の **回答数（実数）** と **回答率（%）** を表示
- 各月ラベルは既存 `label`（"6月" 等）を流用
- 匿名ガード：回答数が閾値未満の月は数値のみ（内容スコアは伏せる）を踏襲

### DB変更
- テーブル変更は不要（`departments.headcount` カラムは既存）。ただし設定画面に headcount 編集UIの追加が必要（改訂2の追加作業2）

## 5. 機能②：未完了アナウンス（部署マネージャー向け）

### 表示
- 部署マネジメント画面の上部に、当月の進捗バナーを出す。
  - 例：「今月のボイスチェック：**7 / 12 人** 回答（残り 5 人）」
  - 全員完了なら「✅ 今月は全員回答済み」
- これは**画面内アナウンスのみ**（個人特定なし）。Push/メール等の外部送信は本フェーズ対象外。

### 判定ロジック
```
当月 = 今日の YYYY-MM
respondentCount = survey_responses の当月件数（当該部署）
headcount = users 件数（当該部署）
未完了 = respondentCount < headcount
```

### DB変更
- **不要**

## 6. 機能③：全員完了で通知 ＋ ②の未完了リマインドも同バッチで

**確定方針：週1回のバッチ（cron）で全部署を走査し、当該部署マネージャーへ通知する。**
②（未完了アナウンス）も同じ週次バッチで一緒に処理する（画面内バナーは別途 §5 のとおり常時表示）。

### 6.1 バッチが毎週やること（全社・全部署ループ）
当月（今日の YYYY-MM）について、部署ごとに `respondentCount`（`survey_responses` 件数）と `headcount`（`users` 件数）を算出し、

- **完了（`respondentCount >= headcount` かつ headcount > 0）** → 当該部署マネージャーへ「完了」通知（③）
- **未完了（`respondentCount < headcount`）** → 当該部署マネージャーへ「リマインド」通知（②のPush版）。本文は率/数のみ（個人を示唆しない）

### 6.2 cron 基盤（新規構築が必要）
現状 `vercel.json` に `crons` 設定は無い → 新規追加が必要。

- `vercel.json` に Vercel Cron を追加（例：毎週月曜 09:00 JST = `0 0 * * 1` UTC）
  ```json
  "crons": [
    { "path": "/api/cron/voice-check-digest", "schedule": "0 0 * * 1" }
  ]
  ```
- 新規保護ルート `src/app/api/cron/voice-check-digest/route.ts` を作成
  - `Authorization: Bearer ${CRON_SECRET}` を検証（Vercel Cron は自動付与）。それ以外は 401
  - サービスロール（`SUPABASE_SERVICE_ROLE_KEY`）で全社横断クエリ
  - `src/lib/notifications.ts` の `createNotification()` を流用
- 環境変数 `CRON_SECRET` を Vercel に追加

> 補足：Vercel Hobby プランは cron が日1回制限。**週1回なので問題なし**。複数 cron が必要になったらプラン確認。

### 6.3 通知作成（宛先＝当該部署マネージャー）
```ts
// 完了通知（③）
await createNotification({
  companyId,
  type: "voice_check_completed",        // 新type（§6.4）
  title: "ボイスチェック完了",
  body: `${deptName}は今月のボイスチェックが全員回答済みです（${headcount}名）`,
  targetRole: "manager",                // 当該部署マネージャー
  targetDepartmentId: deptId,
  link: `/dept?dept=${deptId}`,
});

// 未完了リマインド（②Push版）
await createNotification({
  companyId,
  type: "survey_deadline_reminder",     // 既存type流用
  title: "ボイスチェック リマインド",
  body: `${deptName}の今月の回答は ${respondentCount}/${headcount} 名です。メンバーへの声かけをお願いします`,
  targetRole: "manager",
  targetDepartmentId: deptId,
  link: `/dept?dept=${deptId}`,
});
```

### 6.4 重複防止（週次バッチでは必須）
週1回走るため、**完了済みの部署に毎週「完了」通知を送らない**仕組みが必要。

- 送信前に `notifications` を「同一 `company_id` + `target_department_id` + `type` + 当月（`created_at` が当月）」で存在チェックし、あれば skip
- リマインド（②）は毎週送ってよい（週次の催促として自然）。ただし完了済み部署にはリマインドを送らない

### DB変更
- 新 type `voice_check_completed` を `NotificationType`（`src/lib/notifications.ts:21`）に追加（テーブルは text なので migration 不要）
- `database-schema.md` / 型定義の更新は必要
- cron 用の新規 API ルート + `vercel.json` 更新 + `CRON_SECRET` 設定

## 7. スコープ整理

| 項目 | 本フェーズ | 備考 |
|---|---|---|
| ① 推移グラフ | ✅ やる | DB変更なし |
| ② 画面内アナウンス | ✅ やる | DB変更なし・個人特定なし |
| ② 未完了リマインド通知（Push版）| ✅ やる | 週次バッチ・宛先=当該部署マネージャー |
| ③ 完了通知 | ✅ やる | 週次バッチ・新type追加・宛先=当該部署マネージャー |
| 週次cron基盤 | ✅ 新規構築 | vercel.json + 保護ルート + CRON_SECRET |
| 個人宛プッシュ / 未回答者特定 | ❌ やらない | 匿名維持方針のため別フェーズ |
| 外部Push/メール送信 | ❌ やらない | 通知は `notifications` 内のみ |
| 過去月の正確な人数スナップショット | ❌ やらない | 現在人数を分母に簡易化 |

## 8. 決定事項 / 残課題

### 確定済み
1. ✅ **③のトリガー**：週1回のバッチ（Vercel Cron）
2. ✅ **③の宛先**：当該部署マネージャー（`targetRole: "manager"` + `targetDepartmentId`）
3. ✅ **③の通知 type**：新 `voice_check_completed` を追加
4. ✅ **②のPushリマインド**：同じ週次バッチで当該部署マネージャーへ（既存 `survey_deadline_reminder` 流用）

### 実装時に詰める軽微な点
- 週次 cron の実行曜日・時刻（暫定：毎週月曜 09:00 JST）
- ②の文言で「残り N 人」を出すか率(%)だけか（N=1 のとき個人推測リスク → **率/数の併記に留め、個人を示唆しない**）
- `manager` ロールが当該部署に複数いる場合、全員に届く挙動でよいか（`target_department_id` 指定で部署内 manager 全員に配信される想定）

## 9. レビュー観点メモ（実装時チェック）

- [ ] 部署人数の分母が `users` 集計に統一されているか（`headcount` カラムを誤用していないか）
- [ ] `recorded_month` が **YYYY-MM**（survey系）で扱われているか（kpi系の YYYY-MM-01 と混同しない）
- [ ] 通知の重複作成防止（同一部署・同一月で1回のみ）が効いているか
- [ ] RLS：`notifications` は `get_my_company_id()` ベースのポリシーが効いているか（新クエリ追加時）
- [ ] 匿名ガード：少人数部署で個人が推測される文言・数値が出ていないか
