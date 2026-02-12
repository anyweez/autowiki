---
description: Update the wiki to reflect recent changes
---

# /wiki - Update Agent Wiki

Update the wiki to reflect recent changes in the codebase.

## Pre-flight Checks

1. Verify `wiki/` directory exists. If not, inform user: "No wiki found. Run `/wiki:init` first."
2. Load configuration from `wiki/.config.yml`

## Process

### Step 1: Detect Changes

Determine what has changed since the last wiki update:

```bash
# Get last wiki update commit (stored in wiki/.last-update)
LAST_UPDATE=$(cat wiki/.last-update 2>/dev/null || echo "")

# If no last update, get changes from last 24 hours or last 10 commits
if [ -z "$LAST_UPDATE" ]; then
  CHANGED_FILES=$(git diff --name-only HEAD~10 2>/dev/null || git ls-files)
else
  CHANGED_FILES=$(git diff --name-only $LAST_UPDATE HEAD)
fi
```

### Step 2: Map Changes to Wiki Pages

Using `wiki/.index.json`, identify which wiki pages cover the changed files:

```json
{
  "pages": {
    "authentication": {
      "path": "wiki/authentication.md",
      "sources": ["src/auth/", "src/middleware/auth.ts"],
      "title": "Authentication System",
      "aliases": ["auth", "login"]
    }
  },
  "source_map": {
    "src/auth/": ["authentication"],
    "src/middleware/auth.ts": ["authentication", "middleware"]
  }
}
```

For each changed file:
1. Look up in `source_map` to find affected wiki pages
2. If no mapping exists, flag for potential new page creation

### Step 3: Analyze Change Impact

For each affected wiki page, determine update scope:

- **Minor**: Comments, formatting, small refactors → Update code references only
- **Moderate**: New functions, modified behavior → Update relevant sections
- **Major**: New features, architectural changes → May need page restructure or new pages

### Step 4: Launch Targeted Explorer Agents

For each affected area, launch a focused `wiki-explorer` agent:

```
Task wiki-explorer: Update analysis for [concept]

Changed files:
- src/auth/login.ts (modified)
- src/auth/oauth.ts (new file)

Current wiki page: [contents of wiki/authentication.md]

Instructions:
1. Analyze the changes in context of existing documentation
2. Identify what needs to be updated, added, or removed
3. Note any new concepts that warrant separate pages
4. Check if existing wikilinks are still valid

Output:
- Updated content for affected sections
- New sections to add
- Sections to remove or modify
- Suggested new pages (if any)
- Updated code references
```

### Step 5: Coordinate Updates

Launch `wiki-coordinator` agent to apply updates:

```
Task wiki-coordinator: Apply wiki updates

Updates from explorers: [collected outputs]
Existing wiki structure: [current .index.json]

Instructions:
1. Apply updates to affected pages
2. Create any new pages identified
3. Update wikilinks if pages were renamed/moved
4. Update .index.json with any changes
5. Verify all wikilinks resolve correctly
6. Regenerate llms.txt files
```

### Step 6: Finalize

1. Run llms.txt generation script:
   ```bash
   python scripts/generate-llms.py
   ```

2. Update last-update marker:
   ```bash
   git rev-parse HEAD > wiki/.last-update
   ```

## Handling New Concepts

If explorers identify concepts not covered by existing pages:

1. **Small addition**: Add a section to the most relevant existing page
2. **Significant concept**: Create a new page with proper frontmatter
3. **Cross-cutting concern**: Consider if reorganization is needed (suggest `/wiki:reorganize`)

## Minimal Changes Mode

If changes are trivial (only affects code references, not behavior):
- Skip full exploration
- Only update line numbers in code references
- Quick validation that referenced files still exist

## Output

When complete, report:
```
Wiki updated!
- Updated: [list of modified pages]
- Created: [list of new pages, if any]
- Removed: [list of removed pages, if any]

Run `npx autowiki` to browse or `/wiki:reorganize` to restructure.
```

## Error Recovery

If update fails partway through:
1. Changes are written to `wiki/.pending/` first
2. Only moved to final location on success
3. If failure, inform user: "Update failed. Partial changes in wiki/.pending/"
