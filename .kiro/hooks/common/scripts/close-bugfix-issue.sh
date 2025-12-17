#!/bin/bash

# Close GitHub Issue and update bugfix documentation
# Usage: ./close-bugfix-issue.sh <issue-number>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Close Bugfix Issue ===${NC}\n"

# Check if issue number is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Issue number is required${NC}"
  echo "Usage: $0 <issue-number>"
  exit 1
fi

ISSUE_NUMBER=$1

# Get repository info
REPO_OWNER=$(git remote get-url origin | sed -n 's#.*/\([^/]*\)/\([^/]*\)\.git#\1#p')
REPO_NAME=$(git remote get-url origin | sed -n 's#.*/\([^/]*\)/\([^/]*\)\.git#\2#p')

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
  echo -e "${RED}Error: Could not determine repository owner/name${NC}"
  exit 1
fi

echo "Repository: $REPO_OWNER/$REPO_NAME"
echo "Issue: #$ISSUE_NUMBER"
echo ""

# Find bugfix file
BUGFIX_FILE=$(find .kiro/specs/bugfix -name "issue-${ISSUE_NUMBER}-*.md" | head -n 1)

if [ -z "$BUGFIX_FILE" ]; then
  echo -e "${RED}Error: Bugfix file not found for issue #${ISSUE_NUMBER}${NC}"
  exit 1
fi

echo "Bugfix file: $BUGFIX_FILE"
echo ""

# Get PR number (optional)
echo -e "${YELLOW}Enter PR number (press Enter to skip):${NC}"
read -r PR_NUMBER

# Get resolution summary
echo -e "\n${YELLOW}Enter resolution summary (press Ctrl+D when done):${NC}"
RESOLUTION=$(cat)

if [ -z "$RESOLUTION" ]; then
  RESOLUTION="Issue resolved"
fi

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)

# Update bugfix documentation
echo -e "\n${GREEN}Updating bugfix documentation...${NC}"

# Update Status line
sed -i '' "s/\*\*Status\*\*: Open/\*\*Status\*\*: Resolved/" "$BUGFIX_FILE"

# Add resolution section before the last line
if [ -n "$PR_NUMBER" ]; then
  PR_URL="https://github.com/$REPO_OWNER/$REPO_NAME/pull/$PR_NUMBER"
  RESOLUTION_SECTION="\n---\n\n## Resolution\n\n**Date**: ${CURRENT_DATE}\n**PR**: ${PR_URL}\n\n${RESOLUTION}\n"
else
  RESOLUTION_SECTION="\n---\n\n## Resolution\n\n**Date**: ${CURRENT_DATE}\n\n${RESOLUTION}\n"
fi

# Append resolution section to the end of file
echo -e "$RESOLUTION_SECTION" >> "$BUGFIX_FILE"

echo -e "${GREEN}✓ Updated bugfix documentation${NC}"

# Close GitHub Issue
echo -e "\n${GREEN}Closing GitHub Issue...${NC}"

if [ -n "$PR_NUMBER" ]; then
  CLOSE_COMMENT="Resolved in #${PR_NUMBER}\n\n${RESOLUTION}"
else
  CLOSE_COMMENT="${RESOLUTION}"
fi

gh issue close "$ISSUE_NUMBER" \
  --repo "$REPO_OWNER/$REPO_NAME" \
  --comment "$CLOSE_COMMENT"

echo -e "${GREEN}✓ Closed Issue #${ISSUE_NUMBER}${NC}"

# Summary
echo -e "\n${GREEN}=== Summary ===${NC}"
echo "Issue #$ISSUE_NUMBER has been closed"
echo "Bugfix file updated: $BUGFIX_FILE"
if [ -n "$PR_NUMBER" ]; then
  echo "PR: $PR_URL"
fi
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "1. Commit the updated bugfix file"
echo "2. Push changes to repository"
