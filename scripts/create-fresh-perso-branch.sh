#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Creating fresh perso branch from latest main ==="
echo ""

cd "$PROJECT_ROOT"

if ! git diff-index --quiet HEAD --; then
  echo "Error: You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

echo "Fetching latest from origin..."
git fetch origin

echo ""
echo "Current branches:"
git branch -a | grep -E "(main|perso)" || true

echo ""
read -p "Create a new branch 'perso-fresh' from origin/main? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "Creating perso-fresh branch from origin/main..."
git checkout -b perso-fresh origin/main

echo ""
echo "Branch 'perso-fresh' created successfully!"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/apply-perso-patches.sh"
echo "2. Or manually apply patches: git am patches/*.patch"
echo "3. Or apply the complete diff: git apply patches/complete-diff.patch"
echo ""
echo "If you encounter conflicts, you can:"
echo "  - Resolve them manually"
echo "  - Use 'git apply --3way' for better conflict resolution"
echo "  - Cherry-pick specific commits from the original perso branch"
