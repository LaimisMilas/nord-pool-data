#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm command not found. Ensure Node.js is installed and npm is on the PATH." >&2
  exit 1
fi

export ENTSOE_TOKEN="ee208fd8-a340-4257-be31-94233a3a4fe8"

npm run today
