# API エンドポイント仕様

Signs AI の内部 API（Next.js API Routes）の仕様書です。

---

## エンドポイント一覧

| Method | Path | 認証 | 概要 |
|---|---|---|---|
| `POST` | `/api/onboarding` | 必須 | 企業・部署・KPI・経営方針を一括登録 |

---

## POST `/api/onboarding`

初回オンボーディング時に呼び出されるエンドポイント。
企業・部署・KPI・セマンティックレイヤー（経営方針）を一括で Supabase に保存します。

### 認証

- **必須**: Supabase セッション（Cookie）
- 未認証の場合 → `401 Unauthorized`

### リクエストボディ

```json
{
  "companyName": "株式会社サンプル",
  "departments": [
    { "name": "営業部", "headcount": 10 },
    { "name": "マーケティング部", "headcount": 5 }
  ],
  "kpis": [
    {
      "name": "MRR",
      "unit": "円",
      "target_default": "1000000",
      "owner_dept_index": 0,
      "sort_order": 0
    },
    {
      "name": "有効リード",
      "unit": "件",
      "target_default": "300",
      "owner_dept_index": 1,
      "sort_order": 1
    }
  ],
  "semanticContent": "今期は新規顧客獲得を最優先とし..."
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `companyName` | `string` | ✅ | 企業名（空白不可） |
| `departments` | `array` | ✅ | 部署リスト（1件以上） |
| `departments[].name` | `string` | ✅ | 部署名 |
| `departments[].headcount` | `number` | — | 在籍人数（省略時 0） |
| `kpis` | `array` | ✅ | KPI定義リスト（1件以上） |
| `kpis[].name` | `string` | ✅ | KPI名 |
| `kpis[].unit` | `string` | — | 単位（例: 円, 件, %） |
| `kpis[].target_default` | `string` | — | デフォルト目標値（数値の文字列） |
| `kpis[].owner_dept_index` | `number \| null` | — | 主担当部署のインデックス（`departments` 配列の添字） |
| `kpis[].sort_order` | `number` | — | 表示順 |
| `semanticContent` | `string` | — | 経営方針テキスト（省略時は保存しない） |

### レスポンス

#### 成功 `200 OK`

```json
{
  "success": true,
  "companyId": "uuid-of-created-company"
}
```

#### バリデーションエラー `400 Bad Request`

```json
{ "message": "企業名は必須です" }
```

#### 認証エラー `401 Unauthorized`

```json
{ "message": "認証が必要です" }
```

#### サーバーエラー `500 Internal Server Error`

```json
{ "message": "部署の作成に失敗しました: ..." }
```

### 処理フロー

```
1. 認証確認（auth.getUser()）
2. Free プランの ID を取得
3. companies テーブルに企業を INSERT
4. users テーブルにユーザーを UPSERT（RLS を通すため）
5. departments テーブルに部署を一括 INSERT
6. kpi_definitions テーブルに KPI を INSERT（owner_dept_index → 実際の UUID に変換）
7. semanticContent がある場合に semantic_layers に INSERT
```

> ⚠️ いずれかのステップが失敗した場合、エラーメッセージを `500` で返します。
> 現時点ではトランザクションによるロールバックは実装されていません。

---

## 今後追加予定の API

| Method | Path | 概要 |
|---|---|---|
| `POST` | `/api/kpi-records` | 月次 KPI 実績値の保存 |
| `GET` | `/api/insights` | AI 診断結果の取得 |
| `POST` | `/api/survey` | アンケート回答の送信 |
