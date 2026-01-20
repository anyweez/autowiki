---
title: Configuration
type: reference
tags: [configuration, settings, hooks, auto-update]
related:
  - "[[Commands]]"
  - "[[Architecture]]"
sources:
  - wiki/.config.yml
  - plugins/agent-wiki/hooks/
  - plugins/agent-wiki/.claude-plugin/
  - .claude-plugin/
---

# Configuration

The agent-wiki plugin uses several configuration files and data structures to control behavior, enable auto-updates, and support plugin distribution.

## Wiki Configuration

**File**: `wiki/.config.yml`
**Created by**: `/agent-wiki:init`

Controls wiki generation and update behavior.

### Default Configuration

From `wiki/.config.yml`:
```yaml
# Agent Wiki Configuration
# This file controls wiki behavior and is created by /wiki:init

# Automatically update wiki after agent tasks complete
# Set to false for manual-only updates via /wiki
auto_update: true

# How to organize wiki pages
# - concept: One page per identified concept (recommended)
# - directory: Mirror source directory structure
# - module: One page per detected module (package.json, etc.)
page_granularity: concept

# Paths to exclude from wiki exploration
# Supports glob patterns
exclude:
  - node_modules/
  - .git/
  - dist/
  - build/
  - coverage/
  - "*.min.js"
  - "*.lock"
  - "*.map"

# Maximum pages at wiki root before suggesting subdirectories
max_root_pages: 15

# Custom concept mappings (optional)
# Use this to group specific paths under named concepts
# concepts:
#   authentication:
#     - src/auth/
#     - src/middleware/auth*
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auto_update` | boolean | `true` | Enable automatic wiki updates after tasks |
| `page_granularity` | string | `concept` | Page organization strategy |
| `exclude` | list | (see above) | Glob patterns to exclude from exploration |
| `max_root_pages` | integer | `15` | Max pages before subdirectory suggestion |
| `concepts` | object | (none) | Custom path-to-concept mappings |

### Page Granularity Options

- **concept** - One page per identified concept (recommended). Explorer agents identify logical units of functionality.
- **directory** - Mirror source directory structure. Each significant directory gets a page.
- **module** - One page per detected module boundary (package.json, go.mod, etc.)

---

## Wiki Index

**File**: `wiki/.index.json`
**Created by**: Wiki Coordinator agent

JSON index mapping pages to sources for fast lookups and change detection.

### Structure

```json
{
  "version": 1,
  "generated": "2024-01-19T12:00:00Z",
  "pages": {
    "overview": {
      "path": "wiki/overview.md",
      "title": "Repository Name",
      "type": "overview",
      "aliases": [],
      "sources": ["./"],
      "links_to": ["architecture", "commands"],
      "linked_from": []
    },
    "concept-name": {
      "path": "wiki/concept-name.md",
      "title": "Concept Name",
      "type": "concept",
      "aliases": ["alt-name"],
      "sources": ["src/concept/"],
      "links_to": ["other-concept"],
      "linked_from": ["overview"]
    }
  },
  "source_map": {
    "src/concept/": ["concept-name"],
    "src/concept/specific.ts": ["concept-name", "other-concept"]
  }
}
```

### Fields

**Root level**:
- `version` - Index format version
- `generated` - ISO timestamp of generation
- `pages` - Map of slug to page metadata
- `source_map` - Map of source paths to page slugs

**Page metadata**:
- `path` - Relative path to markdown file
- `title` - Human-readable title
- `type` - Page type (overview, concept, guide, reference)
- `aliases` - Alternative names for wikilink resolution
- `sources` - Source files/directories this page documents
- `links_to` - Outgoing wikilinks
- `linked_from` - Incoming wikilinks

### Usage

The index is used by:
- **Update command** - Maps changed files to affected pages (`commands/update.md:34-50`)
- **serve.js** - Resolves wikilinks (`scripts/serve.js:68-86`)
- **Reorganize command** - Analyzes structure (`commands/reorganize.md:12-13`)

---

## Post-Task Hook

**File**: `plugins/agent-wiki/hooks/post-task.sh`
**Triggered by**: Claude Code after SubagentStop events

Detects if wiki updates are recommended after agent tasks complete.

### Behavior

From `hooks/post-task.sh`:

```bash
#!/bin/bash
set -e

WIKI_DIR="wiki"
CONFIG_FILE="$WIKI_DIR/.config.yml"

# Check if wiki exists
if [ ! -d "$WIKI_DIR" ]; then
    exit 0  # No wiki, nothing to do
fi

# Check if auto-update is enabled
if [ -f "$CONFIG_FILE" ]; then
    AUTO_UPDATE=$(grep -E "^auto_update:" "$CONFIG_FILE" | awk '{print $2}')
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
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")
fi

# Filter out wiki and non-code files
RELEVANT_CHANGES=$(echo "$CHANGED_FILES" | grep -v "^wiki/" | grep -v "\.md$" | grep -v "\.txt$" || true)

if [ -z "$RELEVANT_CHANGES" ]; then
    exit 0  # No relevant code changes
fi

# Signal to Claude Code
echo "WIKI_UPDATE_RECOMMENDED"
echo "Changed files since last wiki update:"
echo "$RELEVANT_CHANGES"
```

### Logic Flow

1. Check wiki/ directory exists
2. Check `auto_update: true` in config
3. Compare current HEAD to `wiki/.last-update`
4. Filter to relevant code changes (excluding wiki/, .md, .txt)
5. If changes exist, output `WIKI_UPDATE_RECOMMENDED`

---

## Plugin Manifest

**File**: `plugins/agent-wiki/.claude-plugin/plugin.json`

Registers the plugin with Claude Code.

```json
{
  "name": "agent-wiki",
  "description": "Maintains an auto-updating wiki for agent context about how repository components work",
  "version": "1.0.2",
  "author": {
    "name": "Luke Segars"
  }
}
```

---

## Marketplace Configuration

**File**: `.claude-plugin/marketplace.json`

Enables plugin distribution via Claude Code marketplace system.

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "agent-wiki-marketplace",
  "version": "1.0.0",
  "description": "Local marketplace for agent-wiki plugin",
  "owner": {
    "name": "Luke Segars",
    "email": "luke@example.com"
  },
  "plugins": [
    {
      "name": "agent-wiki",
      "description": "Maintains an auto-updating wiki for agent context",
      "version": "1.0.2",
      "author": {
        "name": "Luke Segars"
      },
      "source": "./plugins/agent-wiki",
      "category": "productivity"
    }
  ]
}
```

### Installation Methods

**From GitHub marketplace**:
```bash
/plugin marketplace add github:anyweez/agent-wiki
/plugin install agent-wiki@anyweez/agent-wiki
```

**From local directory**:
```bash
/plugin marketplace add /path/to/agent-wiki
/plugin install agent-wiki@agent-wiki-marketplace
```

**Direct plugin load**:
```bash
claude --plugin-dir /path/to/agent-wiki
```

---

## Last Update Marker

**File**: `wiki/.last-update`
**Updated by**: Update command

Contains the git commit hash of the last wiki update.

```
a1b2c3d4e5f6...
```

Used by:
- `commands/update.md` - Determines what changed since last update
- `hooks/post-task.sh` - Checks for relevant changes

Updated after successful wiki update:
```bash
git rev-parse HEAD > wiki/.last-update
```

## Code References

- `wiki/.config.yml` - Wiki configuration (35 lines)
- `plugins/agent-wiki/hooks/post-task.sh` - Post-task hook (45 lines)
- `plugins/agent-wiki/.claude-plugin/plugin.json` - Plugin manifest
- `.claude-plugin/marketplace.json` - Marketplace config
