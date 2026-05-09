確認完了です。

---

**PR #70 レビュー結果：CHANGES REQUESTED（要修正2件）**

---

### 🚨 BLOCKER①：`realActionItems` を interface から誤削除

`useDashboardData.ts` の diff：

```diff
-    realActionItems: ActionItem[];
     realUsers: any[];
+    realCustomQuestions: any[];
```

`realActionItems: ActionItem[]` が `DashboardState` interface から消えているが、初期値と `setState` では今も使われている。TypeScript エラーになりビルドが壊れる。

修正：この行の削除を取り消す（`realCustomQuestions` の追加と `realActionItems` の削除は無関係なので、`realActionItems` は残す）：

```ts
interface DashboardState {
    // ...
    realAiInsights: AiInsight[];
    realActionItems: ActionItem[];   // ← 復活させる
    realUsers: any[];
    realCustomQuestions: any[];
}
```

---

### 🚨 BLOCKER②：`curData` が未定義

`SurveySection.tsx` の追加コード：

```tsx
score={curData.customScores?.[i] ?? 0}
```

`curData` という変数はコンポーネント内に存在しない（main の `SurveySection.tsx` に `curData` の定義なし）。props の名前は `data` なので、実行時に `ReferenceError` になる。

修正：

```tsx
score={data.customScores?.[i] ?? 0}
```

---

### ✅ 問題なし

- `String(a.question_id) === String(cq.id)` の型安全な比較 ✓
- `state.realCustomQuestions` を useMemo 依存配列に追加済み ✓
- サブタイトルの動的カウント `questions.length + customQuestions.length` ✓
- カスタム設問ゼロ時は非表示（既存ユーザー影響なし） ✓
- `customScores` の return・型定義への追加 ✓

2点修正して再プッシュしてください。