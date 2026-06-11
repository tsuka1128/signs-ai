# 仕様書：部署マネジメント – ボイスチェック回答状況の可視化と通知

> ステータス：**改訂2（分母の定義を訂正）**
> 前提方針：**匿名性を維持する（人数だけを扱い、個人は特定しない）**
> 関連画面：`src/app/dept/page.tsx`

## ⚠️ 改訂2：分母（対象人数）の定義を訂正（最重要）

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
| 部署人数（分母）| **`departments.headcount`（手入力の想定人数）**（改訂2） | ~~`users` を count~~ は誤り。匿名・未ログイン回答のため `users` には一般社員が載らない。既存 `src/app/voice-check/page.tsx:282` と同じく `departments.headcount` を使う |
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
