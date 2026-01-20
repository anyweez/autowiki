---
title: Commands
type: reference
tags: [commands, cli, usage]
related:
  - "[[Architecture]]"
  - "[[Agents]]"
  - "[[Configuration]]"
sources:
  - plugins/agent-wiki/commands/
---

# Commands

The agent-wiki plugin provides four user-invokable commands, each defined as a markdown file in `plugins/agent-wiki/commands/`. Commands are namespaced with the `agent-wiki:` prefix when installed as a plugin.

## /agent-wiki:init

**File**: `plugins/agent-wiki/commands/init.md`

Initializes a new wiki by exploring the codebase with parallel sub-agents.

### Process

1. **Pre-flight checks** - Verifies wiki/ doesn't already exist (`init.md:10-14`)
2. **Load/create configuration** - Creates `wiki/.config.yml` with defaults (`init.md:17-39`)
3. **Discover structure** - Analyzes top-level directories, module boundaries, entry points (`init.md:41-48`)
4. **Partition work** - Divides codebase into logical partitions for parallel exploration (`init.md:49-61`)
5. **Launch explorers** - Spawns wiki-explorer agents (up to 4 concurrent) (`init.md:63-84`)
6. **Coordinate** - Launches wiki-coordinator to synthesize findings (`init.md:86-101`)
7. **Generate index** - Runs `generate-llms.py` to create llms.txt files (`init.md:103-113`)

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
/agent-wiki:init
```

### Error Handling

- If wiki exists: Stops with message to use `/agent-wiki:update` or delete wiki/
- If exploration fails: Logs error, continues with other partitions
- If coordination fails: Saves raw outputs to `wiki/.raw/`

---

## /agent-wiki:update

**File**: `plugins/agent-wiki/commands/update.md`

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
/agent-wiki:update
```

Or configure auto-update in `wiki/.config.yml`:
```yaml
auto_update: true
```

---

## /agent-wiki:reorganize

**File**: `plugins/agent-wiki/commands/reorganize.md`

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
/agent-wiki:reorganize
```

---

## /agent-wiki:serve

**File**: `plugins/agent-wiki/commands/serve.md`

Starts a local web server to browse the wiki in a browser.

### Process

1. **Check dependencies** - Verifies Node.js and npm packages (`serve.md:17-32`)
2. **Start server** - Runs `scripts/serve.js` (`serve.md:34-38`)
3. **Report** - Outputs URL and available features (`serve.md:40-55`)

### Server Features

- Markdown rendering with `markdown-it`
- Wikilink resolution via `markdown-it-wikilinks`
- Code syntax highlighting
- Search across all pages
- Dark mode support (CSS media query)

### Static Export Mode

For generating static HTML:

```bash
node scripts/serve.js --export --output ./wiki-html
```

### Usage

```
/agent-wiki:serve
```

Then open http://localhost:3000 in browser.

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

- `plugins/agent-wiki/commands/init.md` - Init command definition
- `plugins/agent-wiki/commands/update.md` - Update command definition
- `plugins/agent-wiki/commands/reorganize.md` - Reorganize command definition
- `plugins/agent-wiki/commands/serve.md` - Serve command definition
