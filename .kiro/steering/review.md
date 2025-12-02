# コードレビュー対応ガイド

## 概要

このドキュメントは、GitHub Copilot Pull Request Reviewerなどからよく指摘される項目と、その対応方針をまとめたものです。

---

## 対応すべき指摘

### 1. エラーメッセージの改善

**指摘例:**
```
Generic error messages make debugging difficult.
```

**対応:**
- HTTPステータスコードを含める
- 具体的なエラー内容を記載

```typescript
// ❌ Bad
throw new Error('Failed to fetch data');

// ✅ Good
throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
```

---

### 2. useEffect依存配列の不足

**指摘例:**
```
Missing dependency in useEffect.
```

**対応:**
- 使用する変数・関数をすべて依存配列に含める
- 関数は`useCallback`でラップ

```typescript
// ❌ Bad
useEffect(() => {
  fetchData();
}, []);

// ✅ Good
const fetchData = useCallback(async () => {
  // ...
}, [dependency]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

### 3. ハードコードされたテキスト

**指摘例:**
```
Hardcoded English text that should be localized.
```

**対応:**
- `lib/i18n.ts`に翻訳を追加
- `t.translationKey`を使用

```typescript
// ❌ Bad
<p>No data found</p>

// ✅ Good
<p>{t.noDataFound}</p>
```

---

### 4. URL解析エラーの未処理

**指摘例:**
```
Potential URL parsing error not handled.
```

**対応:**
- `lib/utils.ts`の`getHostnameFromUrl`を使用

```typescript
// ❌ Bad
const hostname = new URL(url).hostname;

// ✅ Good
const hostname = getHostnameFromUrl(url);
```

---

### 5. 入力バリデーションの不足

**指摘例:**
```
Missing input validation for API parameters.
```

**対応:**
- 関数の先頭でバリデーション
- 明確なエラーメッセージ

```typescript
// ✅ Good
export async function generateNewspaper(feedUrls: string[]) {
  if (!feedUrls || feedUrls.length === 0) {
    throw new Error('At least one feed URL is required');
  }
  if (feedUrls.length > 10) {
    throw new Error('Maximum 10 feed URLs allowed');
  }
  // ...
}
```

---

### 6. 空配列・空データのハンドリング

**指摘例:**
```
Missing error handling for empty array.
```

**対応:**
- 関数呼び出し前にチェック
- 適切なフォールバックUI

```typescript
// ✅ Good
if (!articles || articles.length === 0) {
  return <div>{t.noArticles}</div>;
}
const layout = calculateLayout(articles);
```

---

### 7. アクセシビリティ（alt属性）

**指摘例:**
```
Missing alt text for images could impact accessibility.
```

**対応:**
- alt属性に必ずフォールバックを設定

```typescript
// ❌ Bad
<img src={url} alt={title} />

// ✅ Good
<img src={url} alt={title || 'Article image'} />
```

---

### 8. パフォーマンス最適化

**指摘例:**
```
Inefficient array operation inside render.
```

**対応:**
- `useMemo`でMapを作成してO(1)ルックアップ

```typescript
// ✅ Good
const suggestionMap = useMemo(
  () => new Map(suggestions.map(s => [s.url, s])),
  [suggestions]
);

// レンダー内
const suggestion = suggestionMap.get(url);
```

---

## 対応不要な指摘

### 1. Nitpick（細かい指摘）

**指摘例:**
```
[nitpick] Inconsistent timeout values in test configuration.
```

**判断:**
- `[nitpick]`タグがついている場合は対応不要
- 機能に影響しない細かい指摘

---

### 2. 未使用変数（意図的な場合）

**指摘例:**
```
Unused variable t.
```

**判断:**
- 将来使用予定の場合は対応不要
- 本当に不要なら削除

---

### 3. 安定したオブジェクトの依存配列

**指摘例:**
```
Missing router dependency in useEffect.
```

**判断:**
- `router`、`searchParams`などNext.jsの安定したオブジェクトは省略可能
- ただし、明示的に含めても問題ない

---

## 判断が必要な指摘

### 1. コードの重複

**指摘例:**
```
Duplicated error handling logic.
```

**判断基準:**
- 3回以上の重複 → ユーティリティ関数に抽出
- 2回以下 → そのまま（過度な抽象化を避ける）

---

### 2. 型定義の重複

**指摘例:**
```
Duplicate type definitions.
```

**判断基準:**
- 同じプロジェクト内 → `types/index.ts`に統一
- 異なるパッケージ間 → 各パッケージで定義（依存を避ける）

---

## 対応の優先順位

1. **High**: セキュリティ、エラーハンドリング、アクセシビリティ
2. **Medium**: パフォーマンス、型の一貫性、i18n
3. **Low**: コードの重複、nitpick

---

## 参考

- [tech-common.md](./tech-common.md) - 汎用的なベストプラクティス
- [tech.md](./tech.md) - プロジェクト固有の技術詳細
