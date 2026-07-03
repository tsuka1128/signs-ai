# 【調査依頼・修正依頼】招待フロー（メール＋パスワード新規登録）が機能していない

- **宛先**: ゲイツ（Gates / エンジニアリング）
- **依頼者**: 塚越（Claudeによる一次調査を添付）
- **起票日**: 2026-07-03
- **優先度**: 🟠 中〜高（招待経由でのオンボーディングに影響。ただしGoogle OAuth＋手動コピペの回避策は存在）
- **関連**: [PR #213](https://github.com/tsuka1128/signs-ai/pull/213)（別件：認証role不整合の修正）とは独立した不具合

---

## 1. 背景

PR #213 の実地検証（新規メール登録→確認→onboarding到達）の過程で、ユーザーから「招待された時の挙動は大丈夫か」と問われ、招待フローのコードを確認したところ、**メール＋パスワードでの新規登録には招待トークンを受け取る仕組みが一切存在しない**ことが判明した。

---

## 2. 確定している事実（コード確認済み・推測なし）

### ① 招待メールのリンク形式
招待リンクは URLフラグメント（`#token=`）で `/onboarding` を指している：
```
${getBaseURL()}/onboarding#token=${invitation.token}
```
（[src/app/api/invitations/route.ts:111](src/app/api/invitations/route.ts), [src/app/api/emails/invite/route.ts:23](src/app/api/emails/invite/route.ts)）

### ② `/onboarding` は未ログインだとmiddlewareで弾かれる
`src/middleware.ts:33` の `publicPrefixes` に `/onboarding` は含まれていない。未ログイン状態でこのリンクを踏むと、サーバー側で `/login?redirect=/onboarding&reason=session_expired` にリダイレクトされる。

このときブラウザの一般的な仕様上、リダイレクト先URLに独自のフラグメントが無い場合は元のフラグメント（`#token=xxx`）が引き継がれる可能性が高い（未検証・後述③参照）。

### ③ `login/page.tsx` はクエリパラメータの `token` しか読まない
```ts
const token = searchParams.get("token"); // クエリパラメータのみ。URLフラグメントは見ていない
if (token) setInviteCode(token);
```
（[src/app/login/page.tsx:39](src/app/login/page.tsx)）

`useSearchParams()`（next/navigation）はクエリ文字列のみを見るため、②で仮にフラグメントが生き残っていたとしても、招待コード欄は自動入力されない。

### ④ 【核心】`register/page.tsx` に招待トークンの受け取り口が一切ない
`src/app/register/page.tsx` を全文確認したが、`useSearchParams`・`window.location.hash`・招待コード入力欄のいずれも存在しない。`signUpWithEmail(email, password)` の呼び出しにも `redirectToOption` は渡されず、確認メールのリンクにトークンが乗ることもない（[src/app/register/page.tsx:40](src/app/register/page.tsx)）。

### ⑤ 結果として動く経路と動かない経路
| 経路 | 結果 |
|---|---|
| ログイン画面の「招待コード」欄に**手動でトークンをコピペ**→Googleでログイン | ✅ 動作する（`login/page.tsx:51-55` がOAuthコールバックURLに `?token=` を付与） |
| 招待メールのリンクを踏んで、そのまま**メール＋パスワードで新規登録**（`/register`） | 🔴 **招待に紐付かない**。確認完了後、onboardingは「招待の受諾」ではなく「新規に自分の会社を作る」パス（社名・部署・KPIを一から入力）に入ってしまう。招待された企業・部署・ロールの割り当てが失われる |

参考：`src/app/onboarding/page.tsx:142-158` 自体は、ハッシュ・クエリ両方からトークンを読む実装になっている（コメントに「既存メールリンク互換のためにクエリパラメータも確認」とあり、過去に同種の問題への場当たり対応をした形跡がある）。しかし**そもそも `/onboarding` に未ログインで到達できない**ため、この実装は活きていない。

---

## 3. 依頼したいこと

### A. 修正（優先）
`register.tsx` に、`login.tsx` と同様の招待トークン受け取り・伝搬の仕組みを追加する：

1. `useSearchParams()` に加えて `window.location.hash` からも `token` を読む（`onboarding/page.tsx:146-149` と同じロジックを流用可能）
2. 読み取ったトークンを `signUpWithEmail` の `redirectToOption` に反映し、確認メールのリンクにクエリパラメータとして乗せる：
   ```ts
   const redirectTo = token
     ? `${getBaseURL()}/auth/callback?token=${encodeURIComponent(token)}`
     : undefined;
   await signUpWithEmail(email, password, redirectTo);
   ```
3. `auth/callback/route.ts:41,52-54` は既に `token` クエリパラメータを読んで `/onboarding?token=...` に転送する実装があるため、②が入れば以降は既存経路でつながるはず（要確認）。

併せて、根本的な設計の脆さを解消するなら：
- 招待リンクの形式を `#token=`（フラグメント）から `?token=`（クエリパラメータ）に統一する（`api/invitations/route.ts:111`, `api/emails/invite/route.ts:23`）。クエリパラメータならmiddlewareのリダイレクト後も `redirect` パラメータ経由で確実に引き継げ、`register.tsx`/`login.tsx`双方で一貫して `searchParams.get("token")` だけで拾える。

### B. 検証してほしいこと
1. 実際に招待を発行し、**未ログイン状態で招待リンクをクリック**→`/login`にリダイレクトされた時点でURLに `#token=` が本当に残っているか（ブラウザのアドレスバーで確認）。これが②の「未検証」を確定させる
2. 修正後、招待リンク→メール＋パスワードで新規登録→確認→onboardingで正しく招待先企業・部署・ロールに紐付くことをE2Eで確認

---

## 4. スコープ外・補足
- **パスワード忘れ機能**（`forgot-password`→`password-update`）はコードレビュー済みで、今回のトリガーバグ・本件いずれとも無関係。構造的に問題なし（実地テストは未実施だが優先度低）。
- 本件はPR #213のトリガーバグとは独立した不具合。別PRとして対応してよい。

---

## 付録：参考ファイル
- `src/app/register/page.tsx`（← 修正対象）
- `src/app/login/page.tsx`（← 参考実装）
- `src/app/onboarding/page.tsx`（← ハッシュ読み取りの既存実装、参考）
- `src/app/auth/callback/route.ts`
- `src/middleware.ts`
- `src/app/api/invitations/route.ts` / `src/app/api/emails/invite/route.ts`（← 招待リンク生成箇所）
