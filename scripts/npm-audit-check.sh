#!/bin/bash

# npm audit check script
# Checks for npm vulnerabilities and fails if medium or higher severity found

set -e

echo "🔍 npm脆弱性チェックを開始..."

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to check vulnerabilities in a directory
check_vulnerabilities() {
  local dir=$1
  local name=$2
  
  if [ ! -d "$dir" ]; then
    echo "⚠️  $name ディレクトリが見つかりません: $dir"
    return 0
  fi
  
  if [ ! -f "$dir/package.json" ]; then
    echo "⚠️  $name に package.json が見つかりません"
    return 0
  fi
  
  echo ""
  echo "📦 $name の脆弱性をチェック中..."
  cd "$dir"
  
  # Run npm audit and capture output
  if ! audit_output=$(npm audit --json 2>&1); then
    # Parse JSON output
    if command -v jq &> /dev/null; then
      # Use jq if available
      critical=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.critical // 0')
      high=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.high // 0')
      moderate=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.moderate // 0')
      low=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.low // 0')
    else
      # Fallback: parse manually
      critical=$(echo "$audit_output" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")
      high=$(echo "$audit_output" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")
      moderate=$(echo "$audit_output" | grep -o '"moderate":[0-9]*' | grep -o '[0-9]*' || echo "0")
      low=$(echo "$audit_output" | grep -o '"low":[0-9]*' | grep -o '[0-9]*' || echo "0")
    fi
    
    # Display results
    if [ "$critical" -gt 0 ] || [ "$high" -gt 0 ] || [ "$moderate" -gt 0 ]; then
      echo -e "${RED}❌ $name に脆弱性が見つかりました:${NC}"
      [ "$critical" -gt 0 ] && echo -e "  ${RED}Critical: $critical${NC}"
      [ "$high" -gt 0 ] && echo -e "  ${RED}High: $high${NC}"
      [ "$moderate" -gt 0 ] && echo -e "  ${YELLOW}Moderate: $moderate${NC}"
      [ "$low" -gt 0 ] && echo -e "  Low: $low"
      echo ""
      echo -e "${YELLOW}修正方法:${NC}"
      echo "  cd $dir"
      echo "  npm audit fix"
      echo "  # または破壊的変更を含む修正:"
      echo "  npm audit fix --force"
      echo ""
      cd - > /dev/null
      return 1
    elif [ "$low" -gt 0 ]; then
      echo -e "${YELLOW}⚠️  $name に低レベルの脆弱性が見つかりました: $low${NC}"
      echo "  (Low レベルは警告のみ、プッシュは許可されます)"
    else
      echo -e "${GREEN}✅ $name: 脆弱性は見つかりませんでした${NC}"
    fi
  else
    echo -e "${GREEN}✅ $name: 脆弱性は見つかりませんでした${NC}"
  fi
  
  cd - > /dev/null
  return 0
}

# Check root directory
ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

has_vulnerabilities=0

# Check frontend
if ! check_vulnerabilities "frontend" "Frontend"; then
  has_vulnerabilities=1
fi

# Check backend
if ! check_vulnerabilities "backend" "Backend"; then
  has_vulnerabilities=1
fi

# Check root (if package.json exists)
if [ -f "package.json" ]; then
  if ! check_vulnerabilities "." "Root"; then
    has_vulnerabilities=1
  fi
fi

echo ""
if [ $has_vulnerabilities -eq 1 ]; then
  echo -e "${RED}❌ Medium以上の脆弱性が見つかりました。修正してから再度プッシュしてください。${NC}"
  exit 1
else
  echo -e "${GREEN}✅ npm脆弱性チェック完了: 問題は見つかりませんでした${NC}"
  exit 0
fi
