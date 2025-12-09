# リファクタリング: エラーメッセージの一元管理

## 概要

現在、エラーメッセージがコード内に直書きされているため、管理が困難です。エラーメッセージを専用のファイルで一元管理し、保守性と拡張性を向上させます。

## 現状の問題

1. **エラーメッセージが散在**
   - コード内に直接文字列が書かれている
   - 同じエラーメッセージが複数箇所に重複
   - 変更時に複数箇所を修正する必要がある

2. **多言語対応が困難**
   - 将来的に多言語対応する際に大規模な変更が必要
   - エラーメッセージの翻訳が困難

3. **一貫性の欠如**
   - エラーメッセージの形式が統一されていない
   - エラーコードの命名規則が不明確

## 目標

1. **エラーメッセージの一元管理**
   - すべてのエラーメッセージを専用ファイルで管理
   - エラーコードとメッセージの対応を明確化

2. **保守性の向上**
   - エラーメッセージの変更が容易
   - 重複を排除

3. **将来の多言語対応の準備**
   - 翻訳ファイルの追加が容易な構造

## 実装方針

### 1. エラーメッセージファイルの作成

**バックエンド:**
```typescript
// backend/src/constants/errorMessages.ts
export const ERROR_MESSAGES = {
  // Date validation errors
  FUTURE_DATE: 'Future newspapers are not available',
  DATE_TOO_OLD: 'Newspapers older than 7 days are not available',
  INVALID_DATE: 'Invalid date format. Use YYYY-MM-DD',
  
  // Article errors
  INSUFFICIENT_ARTICLES: 'Insufficient articles for this date',
  NO_FEEDS_SELECTED: 'At least one feed must be selected',
  
  // Generation errors
  GENERATION_FAILED: 'Failed to generate newspaper',
  SUMMARY_GENERATION_FAILED: 'Failed to generate summary',
  
  // Database errors
  NEWSPAPER_NOT_FOUND: 'Newspaper not found',
  SAVE_FAILED: 'Failed to save newspaper',
  
  // Generic errors
  INTERNAL_ERROR: 'Internal server error',
  INVALID_REQUEST: 'Invalid request',
} as const;

export const ERROR_CODES = {
  FUTURE_DATE: 'FUTURE_DATE',
  DATE_TOO_OLD: 'DATE_TOO_OLD',
  INVALID_DATE: 'INVALID_DATE',
  INSUFFICIENT_ARTICLES: 'INSUFFICIENT_ARTICLES',
  NO_FEEDS_SELECTED: 'NO_FEEDS_SELECTED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  SUMMARY_GENERATION_FAILED: 'SUMMARY_GENERATION_FAILED',
  NEWSPAPER_NOT_FOUND: 'NEWSPAPER_NOT_FOUND',
  SAVE_FAILED: 'SAVE_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
```

**フロントエンド:**
```typescript
// frontend/lib/errorMessages.ts
export const ERROR_MESSAGES = {
  // Date navigation errors
  FUTURE_DATE: 'Future newspapers are not available',
  DATE_TOO_OLD: 'Newspapers older than 7 days are not available',
  INVALID_DATE: 'Invalid date format',
  
  // Search errors
  NO_RESULTS: 'No results found',
  NO_NEWSPAPERS: 'No newspapers found',
  
  // Generation errors
  GENERATION_FAILED: 'Failed to generate newspaper',
  NO_FEEDS_SELECTED: 'Please select at least one feed',
  
  // Network errors
  NETWORK_ERROR: 'Network error. Please try again',
  TIMEOUT: 'Request timed out. Please try again',
  
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
```

### 2. エラークラスの作成

```typescript
// backend/src/errors/AppError.ts
import { ERROR_MESSAGES, ERROR_CODES, ErrorCode } from '../constants/errorMessages';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(errorCode: ErrorCode, statusCode: number = 400) {
    super(ERROR_MESSAGES[errorCode]);
    this.code = ERROR_CODES[errorCode];
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

// 使用例
throw new AppError('FUTURE_DATE', 400);
throw new AppError('NEWSPAPER_NOT_FOUND', 404);
throw new AppError('INTERNAL_ERROR', 500);
```

### 3. 既存コードの置き換え

**Before:**
```typescript
if (targetDate > today) {
  return { valid: false, error: 'Future newspapers are not available' };
}
```

**After:**
```typescript
import { ERROR_MESSAGES } from '../constants/errorMessages';

if (targetDate > today) {
  return { valid: false, error: ERROR_MESSAGES.FUTURE_DATE };
}
```

または

```typescript
import { AppError } from '../errors/AppError';

if (targetDate > today) {
  throw new AppError('FUTURE_DATE', 400);
}
```

### 4. 将来の多言語対応

```typescript
// backend/src/constants/errorMessages.ja.ts (将来)
export const ERROR_MESSAGES_JA = {
  FUTURE_DATE: '未来の新聞は利用できません',
  DATE_TOO_OLD: '7日より古い新聞は利用できません',
  INVALID_DATE: '無効な日付形式です。YYYY-MM-DD を使用してください',
  // ...
} as const;

// 言語に応じてメッセージを切り替え
function getErrorMessage(code: ErrorCode, locale: 'en' | 'ja'): string {
  return locale === 'ja' ? ERROR_MESSAGES_JA[code] : ERROR_MESSAGES[code];
}
```

## 実装タスク

### Phase 1: ファイル作成
- [ ] `backend/src/constants/errorMessages.ts` を作成
- [ ] `backend/src/errors/AppError.ts` を作成
- [ ] `frontend/lib/errorMessages.ts` を作成

### Phase 2: バックエンドの置き換え
- [ ] 日付検証のエラーメッセージを置き換え
- [ ] 記事取得のエラーメッセージを置き換え
- [ ] 新聞生成のエラーメッセージを置き換え
- [ ] データベース操作のエラーメッセージを置き換え

### Phase 3: フロントエンドの置き換え
- [ ] 日付ナビゲーションのエラーメッセージを置き換え
- [ ] 検索のエラーメッセージを置き換え
- [ ] 新聞生成のエラーメッセージを置き換え

### Phase 4: テスト
- [ ] エラーメッセージが正しく表示されることを確認
- [ ] エラーコードが正しく返されることを確認

## メリット

1. **保守性の向上**
   - エラーメッセージの変更が 1 箇所で完結
   - 重複の排除

2. **一貫性の確保**
   - すべてのエラーメッセージが統一された形式
   - エラーコードの命名規則が明確

3. **将来の拡張性**
   - 多言語対応が容易
   - 新しいエラーメッセージの追加が簡単

4. **デバッグの容易化**
   - エラーコードで検索しやすい
   - エラーの発生箇所を特定しやすい

## 注意事項

1. **既存コードとの互換性**
   - 段階的に置き換えを進める
   - 既存の動作を壊さないように注意

2. **エラーメッセージの英語統一**
   - すべてのエラーメッセージは英語で記述
   - UI での表示時に翻訳（将来）

3. **エラーコードの命名規則**
   - UPPER_SNAKE_CASE を使用
   - 意味が明確な名前を付ける
