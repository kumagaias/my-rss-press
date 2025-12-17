#!/bin/bash

# Create GitHub Issue and bugfix documentation
# Usage: ./create-bugfix-issue.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Create Bugfix Issue ===${NC}\n"

# Get repository info
REPO_OWNER=$(git remote get-url origin | sed -n 's#.*/\([^/]*\)/\([^/]*\)\.git#\1#p')
REPO_NAME=$(git remote get-url origin | sed -n 's#.*/\([^/]*\)/\([^/]*\)\.git#\2#p')

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
  echo -e "${RED}Error: Could not determine repository owner/name${NC}"
  exit 1
fi

echo "Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Get issue title
echo -e "${YELLOW}Enter issue title:${NC}"
read -r TITLE

if [ -z "$TITLE" ]; then
  echo -e "${RED}Error: Title is required${NC}"
  exit 1
fi

# Get issue description
echo -e "\n${YELLOW}Enter issue description (press Ctrl+D when done):${NC}"
DESCRIPTION=$(cat)

if [ -z "$DESCRIPTION" ]; then
  echo -e "${RED}Error: Description is required${NC}"
  exit 1
fi

# Get severity
echo -e "\n${YELLOW}Select severity:${NC}"
echo "1) Low"
echo "2) Medium"
echo "3) High"
echo "4) Critical"
read -r SEVERITY_NUM

case $SEVERITY_NUM in
  1) SEVERITY="Low" ;;
  2) SEVERITY="Medium" ;;
  3) SEVERITY="High" ;;
  4) SEVERITY="Critical" ;;
  *) SEVERITY="Medium" ;;
esac

# Get component
echo -e "\n${YELLOW}Enter component (e.g., Backend API, Frontend, Infrastructure):${NC}"
read -r COMPONENT

if [ -z "$COMPONENT" ]; then
  COMPONENT="Unknown"
fi

# Create GitHub Issue
echo -e "\n${GREEN}Creating GitHub Issue...${NC}"
ISSUE_URL=$(gh issue create \
  --repo "$REPO_OWNER/$REPO_NAME" \
  --title "$TITLE" \
  --body "$DESCRIPTION" \
  --label "bug")

if [ -z "$ISSUE_URL" ]; then
  echo -e "${RED}Error: Failed to create GitHub Issue${NC}"
  exit 1
fi

# Extract issue number from URL
ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]*$')

echo -e "${GREEN}✓ Created Issue #$ISSUE_NUMBER${NC}"
echo "URL: $ISSUE_URL"

# Generate filename
TITLE_SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
FILENAME="issue-${ISSUE_NUMBER}-${TITLE_SLUG}.md"
FILEPATH=".kiro/specs/bugfix/$FILENAME"

# Create bugfix directory if it doesn't exist
mkdir -p .kiro/specs/bugfix

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)

# Create bugfix documentation
echo -e "\n${GREEN}Creating bugfix documentation...${NC}"

cat > "$FILEPATH" << EOF
# Bug Report #${ISSUE_NUMBER}: ${TITLE}

**Date**: ${CURRENT_DATE}
**Status**: Open
**Severity**: ${SEVERITY}
**Component**: ${COMPONENT}
**GitHub Issue**: ${ISSUE_URL}

---

## Summary

${DESCRIPTION}

## Error Details

\`\`\`
[Add error messages, stack traces, logs here]
\`\`\`

## Reproduction Steps

1. Step 1
2. Step 2
3. ...

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Affected Code

**Files**:
- \`[file path]\`

**Functions/Components**:
- \`[function/component name]\`

## Possible Causes

1. [Cause 1]
2. [Cause 2]
3. [Cause 3]

## Investigation Needed

- [ ] Check logs
- [ ] Review code
- [ ] Test edge cases
- [ ] Verify configuration

## Impact

- **User Experience**: [Impact on users]
- **Feature**: [Affected features]
- **Scope**: [How many users affected]

## Priority

**${SEVERITY}** - [Reason for priority]

## Next Steps

1. Create fix branch: \`fix/issue-${ISSUE_NUMBER}-${TITLE_SLUG}\`
2. Investigate root cause
3. Implement fix
4. Add tests
5. Create PR with \`Fixes #${ISSUE_NUMBER}\`

---

**Related Documentation**:
- GitHub Issue: ${ISSUE_URL}
EOF

echo -e "${GREEN}✓ Created bugfix documentation${NC}"
echo "File: $FILEPATH"

# Summary
echo -e "\n${GREEN}=== Summary ===${NC}"
echo "Issue Number: #$ISSUE_NUMBER"
echo "Issue URL: $ISSUE_URL"
echo "Bugfix File: $FILEPATH"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit $FILEPATH with detailed information"
echo "2. Create fix branch: git checkout -b fix/issue-${ISSUE_NUMBER}-${TITLE_SLUG}"
echo "3. Implement fix and test"
echo "4. Commit with: git commit -m 'fix: [description] (Fixes #${ISSUE_NUMBER})'"
echo "5. Create PR"
