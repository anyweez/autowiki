#!/bin/bash
# Post-task hook for automatic wiki updates
# This hook is called after agent tasks complete

set -e

# Configuration
WIKI_DIR="wiki"
CONFIG_FILE="$WIKI_DIR/.config.yml"

# Check if wiki exists
if [ ! -d "$WIKI_DIR" ]; then
    exit 0  # No wiki, nothing to do
fi

# Check if auto-update is enabled
if [ -f "$CONFIG_FILE" ]; then
    AUTO_UPDATE=$(grep -E "^auto_update:" "$CONFIG_FILE" | awk '{print $2}' || echo "true")
    if [ "$AUTO_UPDATE" = "false" ]; then
        exit 0  # Auto-update disabled
    fi
fi

# Check if there are relevant changes
LAST_UPDATE_FILE="$WIKI_DIR/.last-update"
if [ -f "$LAST_UPDATE_FILE" ]; then
    LAST_UPDATE=$(cat "$LAST_UPDATE_FILE")
    CHANGED_FILES=$(git diff --name-only "$LAST_UPDATE" HEAD 2>/dev/null || echo "")
else
    # No last update marker, check recent changes
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")
fi

# Filter out wiki directory itself and non-code files
RELEVANT_CHANGES=$(echo "$CHANGED_FILES" | grep -v "^wiki/" | grep -v "\.md$" | grep -v "\.txt$" || true)

if [ -z "$RELEVANT_CHANGES" ]; then
    exit 0  # No relevant code changes
fi

# Signal to Claude Code that wiki update is recommended
echo "WIKI_UPDATE_RECOMMENDED"
echo "Changed files since last wiki update:"
echo "$RELEVANT_CHANGES"
