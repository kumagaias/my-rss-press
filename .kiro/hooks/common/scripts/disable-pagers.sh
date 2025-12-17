#!/bin/bash
# Disable CLI pagers to prevent command interruption
# This script is executed by Kiro agent hook on session start

export AWS_PAGER=""
export GIT_PAGER=""

echo "✅ CLI pagers disabled (AWS_PAGER, GIT_PAGER)"
