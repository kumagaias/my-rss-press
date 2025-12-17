#!/bin/bash

# Setup Git Hooks
# Create symbolic links from .husky to .kiro/hooks/common/.husky for version control
# This script should be run once when setting up the project

set -e

echo "🔧 Setting up Git hooks..."

# Remove existing .husky directory or symlink
if [ -e .husky ]; then
  echo "📁 Removing existing .husky..."
  rm -rf .husky
fi

# Create symbolic link
ln -s .kiro/hooks/common/.husky .husky

echo "✅ Git hooks symbolic link created"
echo "   Source: .kiro/hooks/common/.husky"
echo "   Link: .husky"
echo ""
echo "Git hooks are now active:"
echo "  - pre-commit: Security checks (gitleaks)"
echo "  - pre-push: Security checks (gitleaks)"
