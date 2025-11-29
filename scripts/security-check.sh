#!/bin/bash

# セキュリティチェックスクリプト
# Git commitやpush前に機密情報がないかチェック

set -e

echo "🔒 セキュリティチェックを開始..."

# gitleaksがインストールされているか確認
if ! command -v gitleaks &> /dev/null; then
    echo "⚠️  gitleaksがインストールされていません"
    echo "インストール方法:"
    echo "  macOS: brew install gitleaks"
    echo "  その他: https://github.com/gitleaks/gitleaks#installing"
    echo ""
    echo "代替として基本的なチェックを実行します..."
    
    # 基本的なパターンマッチング
    echo "🔍 AWS認証情報をチェック中..."
    if git grep -E "AKIA[0-9A-Z]{16}" -- ':!scripts/security-check.sh' 2>/dev/null; then
        echo "❌ AWSアクセスキーが見つかりました！"
        exit 1
    fi
    
    echo "🔍 秘密鍵をチェック中..."
    if git grep -E "-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----" 2>/dev/null; then
        echo "❌ 秘密鍵が見つかりました！"
        exit 1
    fi
    
    echo "🔍 パスワードやトークンをチェック中..."
    if git grep -iE "(password|secret|token|api_key|private_key)\s*[:=]\s*['\"][^'\"]{8,}" -- ':!package-lock.json' ':!*.md' ':!scripts/security-check.sh' 2>/dev/null; then
        echo "⚠️  パスワードやトークンの可能性がある文字列が見つかりました"
        echo "確認してください"
    fi
    
    echo "✅ 基本的なセキュリティチェック完了"
    exit 0
fi

# gitleaksを使用した詳細チェック
echo "� gitleaks中でスキャン中..."

# ステージングされたファイルをチェック
if gitleaks protect --staged --verbose --redact; then
    echo "✅ セキュリティチェック完了: 問題は見つかりませんでした"
else
    echo "❌ セキュリティチェック失敗: 機密情報が検出されました"
    echo ""
    echo "修正方法:"
    echo "1. 検出されたファイルから機密情報を削除"
    echo "2. 環境変数や設定ファイルに移動"
    echo "3. .gitignoreに追加（必要に応じて）"
    exit 1
fi
