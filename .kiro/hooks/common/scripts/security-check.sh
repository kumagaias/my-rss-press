#!/bin/bash

# Security check script
# Check for sensitive information before Git commit or push

set -e

echo "🔒 Starting security check..."

# Check if gitleaks is installed
if ! command -v gitleaks &> /dev/null; then
    echo "⚠️  gitleaks is not installed"
    echo "Installation instructions:"
    echo "  macOS: brew install gitleaks"
    echo "  Linux: https://github.com/gitleaks/gitleaks#installing"
    echo "  Windows: https://github.com/gitleaks/gitleaks#installing"
    echo ""
    echo "Running basic checks as fallback..."
    
    # Basic pattern matching
    echo "🔍 Checking for AWS credentials..."
    if git grep -E "AKIA[0-9A-Z]{16}" -- ':!.kiro/hooks/common/scripts/security-check.sh' 2>/dev/null; then
        echo "❌ AWS access key found!"
        exit 1
    fi
    
    echo "🔍 Checking for private keys..."
    if git grep -E "-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----" 2>/dev/null; then
        echo "❌ Private key found!"
        exit 1
    fi
    
    echo "🔍 Checking for passwords and tokens..."
    if git grep -iE "(password|secret|token|api_key|private_key)\s*[:=]\s*['\"][^'\"]{8,}" -- ':!package-lock.json' ':!*.md' ':!.kiro/hooks/common/scripts/security-check.sh' 2>/dev/null; then
        echo "⚠️  Potential password or token found"
        echo "Please review"
    fi
    
    echo "✅ Basic security check complete"
    exit 0
fi

# Detailed check using gitleaks
echo "🔍 Scanning with gitleaks..."

# Check staged files
if gitleaks protect --staged --verbose --redact; then
    echo "✅ Staged files check complete"
else
    echo "❌ Security check failed: Sensitive information detected"
    echo ""
    echo "How to fix:"
    echo "1. Remove sensitive information from detected files"
    echo "2. Move to environment variables or config files"
    echo "3. Add to .gitignore (if needed)"
    exit 1
fi

# Additional: Check latest commit (before push)
echo "🔍 Checking latest commit..."
if gitleaks detect --log-opts="-1" --verbose --redact; then
    echo "✅ Security check complete: No issues found"
else
    echo "❌ Sensitive information detected in latest commit"
    echo ""
    echo "How to fix:"
    echo "1. git reset HEAD~1 to undo commit"
    echo "2. Remove sensitive information"
    echo "3. Commit again"
    exit 1
fi
