---
title: Configuration
type: reference
tags: [configuration, settings, hooks, auto-update]
related:
  - "[[Commands]]"
  - "[[Architecture]]"
sources:
  - wiki/.config.yml
  - plugins/autowiki/hooks/
  - plugins/autowiki/.claude-plugin/
  - .claude-plugin/
---

# Configuration

The autowiki plugin uses several configuration files and data structures to control behavior, enable auto-updates, and support plugin distribution.

## Wiki Configuration

**File**: `wiki/.config.yml`
**Created by**: `/autowiki:init`

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
  "generated": "2026-01-19T00:00:00Z",
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
- **Web server** - Resolves wikilinks (`lib/scanner.js`)
- **Reorganize command** - Analyzes structure (`commands/reorganize.md:12-13`)

---

## Post-Task Hook

**File**: `plugins/autowiki/hooks/post-task.sh`
**Triggered by**: Claude Code after SubagentStop events
**Configured in**: `plugins/autowiki/hooks/hooks.json`

Detects if wiki updates are recommended after agent tasks complete.

### Hook Registration

From `hooks/hooks.json`:
```json
{
  "description": "Wiki auto-update hooks",
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/post-task.sh"
          }
        ]
      }
    ]
  }
}
```

### Behavior

From `hooks/post-task.sh`:

1. Check wiki/ directory exists
2. Check `auto_update: true` in config
3. Compare current HEAD to `wiki/.last-update`
4. Filter to relevant code changes (excluding wiki/, .md, .txt)
5. If changes exist, output `WIKI_UPDATE_RECOMMENDED`

---

## Plugin Manifest

**File**: `plugins/autowiki/.claude-plugin/plugin.json`

Registers the plugin with Claude Code.

```json
{
  "name": "autowiki",
  "description": "Maintains an auto-updating wiki for agent context about how repository components work",
  "version": "1.2.4",
  "author": {
    "name": "anyweez"
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
  "name": "autowiki",
  "version": "1.2.4",
  "description": "Auto-updating wiki for agent context",
  "owner": {
    "name": "anyweez"
  },
  "plugins": [
    {
      "name": "autowiki",
      "description": "Maintains an auto-updating wiki for agent context",
      "version": "1.2.4",
      "author": {
        "name": "anyweez"
      },
      "source": "./plugins/autowiki",
      "category": "productivity"
    }
  ]
}
```

### Installation

In Claude Code, run:

```
/plugins
```

Select **Add a marketplace**, then enter:

```
anyweez/autowiki
```

Then select **autowiki** from the marketplace to install it.

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

- `wiki/.config.yml` - Wiki configuration
- `plugins/autowiki/hooks/hooks.json` - Hook registration
- `plugins/autowiki/hooks/post-task.sh` - Post-task hook
- `plugins/autowiki/.claude-plugin/plugin.json` - Plugin manifest
- `.claude-plugin/marketplace.json` - Marketplace config
