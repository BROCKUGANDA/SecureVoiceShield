#!/usr/bin/env bash
# Autopromotion: dev -> staging -> main
# Usage: bash scripts/autopromote.sh [dev|staging]
set -e

SOURCE="${1:-dev}"
case "$SOURCE" in
  dev) TARGET="staging" ;;
  staging) TARGET="main" ;;
  *) echo "Usage: $0 [dev|staging]"; exit 1 ;;
esac

echo "Promoting $SOURCE -> $TARGET"

# Ensure we're on the source branch and up to date
git checkout "$SOURCE"
git pull origin "$SOURCE"

# Create promotion branch
PROMO_BRANCH="auto-promote/${SOURCE}-to-${TARGET}"
git checkout -b "$PROMO_BRANCH" 2>/dev/null || git checkout "$PROMO_BRANCH"

# Merge source into target via PR/MR
git push origin "$PROMO_BRANCH"

echo "Promotion branch '$PROMO_BRANCH' pushed."
echo "Create a PR/MR from '$PROMO_BRANCH' to '$TARGET' to complete promotion."
echo "Or use: gh pr create --base $TARGET --head $PROMO_BRANCH --title 'Auto-promote: $SOURCE -> $TARGET'"