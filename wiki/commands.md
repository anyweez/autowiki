---
title: Commands
type: reference
tags: [commands, cli, usage]
related:
  - "[[Architecture]]"
  - "[[Agents]]"
  - "[[Configuration]]"
sources:
  - plugins/autowiki/commands/
---

# Commands

The autowiki plugin provides three user-invokable commands, each defined as a markdown file in `plugins/autowiki/commands/`. Commands are namespaced with the `autowiki:` prefix when installed as a plugin. A fourth command (`serve`) exists but is deprecated in favor of `npx autowiki`.

## /autowiki:init

**File**: `plugins/autowiki/commands/init.md`

Initializes a new wiki by exploring the codebase with parallel sub-agents.

### Process

1. **Pre-flight checks** - Verifies wiki/ doesn't already exist (`init.md:10-14`)
2. **Load/create configuration** - Creates `wiki/.config.yml` with defaults (`init.md:17-39`)
3. **Discover structure** - Analyzes top-level directories, module boundaries, entry points (`init.md:41-48`)
4. **Partition work** - Divides codebase into logical partitions for parallel exploration (`init.md:49-61`)
5. **Launch explorers** - Spawns wiki-explorer agents (up to 4 concurrent) (`init.md:63-84`)
6. **Coordinate** - Launches wiki-coordinator to synthesize findings (`init.md:86-101`)
7. **Generate index** - Runs `generate-llms.js` to create llms.txt files (`init.md:103-113`)

### Output

Creates the wiki directory structure:

```
wiki/
  .config.yml       - Configuration
  .index.json       - Page index
  llms.txt          - AI-friendly index
  llms-full.txt     - Full content dump
  overview.md       - Repository overview
  [concept].md      - Concept pages
```

### Usage

```
/autowiki:init
```

### Error Handling

- If wiki exists: Stops with message to use `/autowiki:update` or delete wiki/
- If exploration fails: Logs error, continues with other partitions
- If coordination fails: Saves raw outputs to `wiki/.raw/`

---

## /autowiki:update

**File**: `plugins/autowiki/commands/update.md`

Updates the wiki to reflect recent changes in the codebase.

### Process

1. **Pre-flight checks** - Verifies wiki/ exists (`update.md:10-12`)
2. **Detect changes** - Uses git diff against `wiki/.last-update` commit (`update.md:16-29`)
3. **Map to pages** - Consults `.index.json` source_map to find affected pages (`update.md:31-56`)
4. **Analyze impact** - Categorizes as minor/moderate/major (`update.md:58-64`)
5. **Launch explorers** - Targeted exploration of affected areas (`update.md:66-90`)
6. **Apply updates** - Coordinator applies incremental changes (`update.md:92-109`)
7. **Finalize** - Regenerates llms.txt, updates `.last-update` marker (`update.md:111-122`)

### Change Detection

```bash
# From update.md:20-29
LAST_UPDATE=$(cat wiki/.last-update 2>/dev/null || echo "")
if [ -z "$LAST_UPDATE" ]; then
  CHANGED_FILES=$(git diff --name-only HEAD~10)
else
  CHANGED_FILES=$(git diff --name-only $LAST_UPDATE HEAD)
fi
```

### Minimal Changes Mode

For trivial changes (only affects code references, not behavior):
- Skips full exploration
- Only updates line numbers in code references
- Quick validation that referenced files exist

See `update.md:131-137`.

### Usage

```
/autowiki:update
```

Or configure auto-update in `wiki/.config.yml`:
```yaml
auto_update: true
```

---

## /autowiki:reorganize

**File**: `plugins/autowiki/commands/reorganize.md`

Analyzes wiki structure and suggests/applies improvements.

### Process

1. **Analyze structure** - Gathers metrics per page (lines, sections, links, sources) (`reorganize.md:16-28`)
2. **Identify signals** - Checks for split, merge, or restructure indicators (`reorganize.md:30-51`)
3. **Generate recommendations** - Creates prioritized list of changes (`reorganize.md:53-87`)
4. **User decision** - Presents options (apply all, high-priority only, review each, skip) (`reorganize.md:89-108`)
5. **Apply changes** - Executes approved reorganizations (`reorganize.md:110-132`)
6. **Validate** - Verifies all wikilinks resolve, regenerates index (`reorganize.md:133-139`)

### Reorganization Signals

**Split signals** (page too large):
- Exceeds 500 lines
- More than 8 top-level sections
- Covers more than 10 source files
- Has "and" in title

**Merge signals** (pages too fragmented):
- Under 50 lines
- Only 1-2 incoming links
- Overlapping sources
- Always referenced together

**Restructure signals**:
- 20+ pages at root level
- Deep nesting with single-page directories
- Orphan pages

### Usage

```
/autowiki:reorganize
```

---

## /autowiki:serve (Deprecated)

**File**: `plugins/autowiki/commands/serve.md`

This command is deprecated. Use `npx autowiki` instead, which provides a better browsing experience with sidebar navigation, full-text search, dark mode, and syntax highlighting.

See [[Scripts]] for details on the npm-based web server.

---

## Command File Structure

All command files follow this structure:

```markdown
---
description: Brief description for /help
---

# /wiki:command - Title

Brief explanation.

## Pre-flight Checks
[Validation before execution]

## Process
[Step-by-step implementation]

## Output
[What gets created/modified]

## Error Handling
[Recovery procedures]
```

## Code References

- `plugins/autowiki/commands/init.md` - Init command definition
- `plugins/autowiki/commands/update.md` - Update command definition
- `plugins/autowiki/commands/reorganize.md` - Reorganize command definition
- `plugins/autowiki/commands/serve.md` - Serve command (deprecated)
