#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PATCHES_DIR="$PROJECT_ROOT/patches"

echo "=== Applying perso branch patches to current branch ==="
echo ""

if [ ! -d "$PATCHES_DIR" ]; then
  echo "Error: patches directory not found at $PATCHES_DIR"
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

read -p "This will apply patches from the perso branch. Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "Applying individual commit patches..."
cd "$PROJECT_ROOT"

FAILED_PATCHES=()
SUCCESSFUL_PATCHES=()

for patch in "$PATCHES_DIR"/0*.patch; do
  if [ -f "$patch" ]; then
    PATCH_NAME=$(basename "$patch")
    echo "Applying $PATCH_NAME..."
    
    if git apply --check "$patch" 2>/dev/null; then
      if git apply "$patch"; then
        SUCCESSFUL_PATCHES+=("$PATCH_NAME")
        echo "  ✓ Applied successfully"
      else
        FAILED_PATCHES+=("$PATCH_NAME")
        echo "  ✗ Failed to apply"
      fi
    else
      FAILED_PATCHES+=("$PATCH_NAME")
      echo "  ✗ Would conflict - skipping"
    fi
    echo ""
  fi
done

echo ""
echo "=== Summary ==="
echo "Successfully applied: ${#SUCCESSFUL_PATCHES[@]} patches"
echo "Failed/Skipped: ${#FAILED_PATCHES[@]} patches"

if [ ${#FAILED_PATCHES[@]} -gt 0 ]; then
  echo ""
  echo "Failed patches:"
  for patch in "${FAILED_PATCHES[@]}"; do
    echo "  - $patch"
  done
  echo ""
  echo "You can try applying the complete diff manually:"
  echo "  git apply patches/complete-diff.patch"
  echo ""
  echo "Or review conflicts and apply patches individually with:"
  echo "  git apply --3way patches/<patch-file>"
fi
