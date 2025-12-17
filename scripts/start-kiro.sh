#!/bin/bash
# Kiro startup wrapper script
# This script loads environment variables from .env before starting Kiro

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Load .env if it exists
if [ -f .env ]; then
  echo "✅ Loading environment variables from .env..."
  set -a
  source .env
  set +a
  echo "✅ Environment variables loaded"
else
  echo "⚠️  .env file not found in $PROJECT_ROOT"
  echo "   MCP servers requiring environment variables may not work correctly"
fi

# Start Kiro
echo "🚀 Starting Kiro..."
open -a "Kiro"
