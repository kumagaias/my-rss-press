#!/bin/bash

# セキュリティチェックスクリプト
# Git commitやpush前に機密情報がないかチェック

set -e

echo "🔒 セキュリティチェックを開始..."

# gitleaksがインストールされているか確認
if ! command -v gitleaks &> /dev/null; then
    echo "❌ gitleaksがインストールされていません"
    echo ""
    echo "インストール方法:"
    echo "  macOS: brew install gitleaks"
    echo "  Linux: https://github.com/gitleaks/gitleaks#installing"
    echo "  Windows: https://github.com/gitleaks/gitleaks#installing"
    echo ""
    echo "gitleaksは必須ツールです。インストール後に再実行してください。"
    exit 1
fi

# gitleaksを使用した詳細チェック
echo "🔍 gitleaksでスキャン中..."

# ステージングされたファイルをチェック
if gitleaks protect --staged --verbose --redact; then
    echo "✅ ステージングファイルのチェック完了"
else
    echo "❌ セキュリティチェック失敗: 機密情報が検出されました"
    echo ""
    echo "修正方法:"
    echo "1. 検出されたファイルから機密情報を削除"
    echo "2. 環境変数や設定ファイルに移動"
    echo "3. .gitignoreに追加（必要に応じて）"
    exit 1
fi

# 追加: 最新のコミットもチェック（push前）
echo "🔍 最新のコミットをチェック中..."
if gitleaks detect --log-opts="-1" --verbose --redact; then
    echo "✅ セキュリティチェック完了: 問題は見つかりませんでした"
else
    echo "❌ 最新のコミットに機密情報が検出されました"
    echo ""
    echo "修正方法:"
    echo "1. git reset HEAD~1 でコミットを取り消し"
    echo "2. 機密情報を削除"
    echo "3. 再度コミット"
    exit 1
fi
