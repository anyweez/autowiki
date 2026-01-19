# /wiki:reorganize - Evaluate and Reorganize Wiki Structure

Analyze the current wiki structure and reorganize if beneficial.

## Pre-flight Checks

1. Verify `wiki/` directory exists
2. Load current structure from `wiki/.index.json`

## Process

### Step 1: Analyze Current Structure

Gather metrics about the wiki:

```
For each page:
- Line count
- Number of sections (## headings)
- Number of wikilinks (outgoing)
- Number of incoming links (from other pages)
- Number of source files covered
- Last modified date
```

### Step 2: Identify Reorganization Signals

Check for these indicators that reorganization may help:

**Split signals** (page too large/complex):
- Page exceeds 500 lines
- Page has more than 8 top-level sections
- Page covers more than 10 source files
- Page has "and" in the title (covering multiple concepts)

**Merge signals** (pages too fragmented):
- Pages under 50 lines
- Pages with only 1-2 incoming links
- Multiple pages covering overlapping sources
- Pages that are always referenced together

**Restructure signals** (hierarchy issues):
- Flat structure with 20+ pages at root level
- Deep nesting (3+ levels) with single-page directories
- Orphan pages (no incoming links)
- Circular reference chains

### Step 3: Generate Recommendations

Based on analysis, generate specific recommendations:

```markdown
## Reorganization Analysis

### Current State
- Total pages: 24
- Average page size: 180 lines
- Orphan pages: 2
- Oversized pages: 1

### Recommendations

#### 1. Split: authentication.md (HIGH priority)
Current: 650 lines, 12 sections
Suggested split:
- authentication/overview.md - Core auth concepts
- authentication/oauth.md - OAuth implementation
- authentication/jwt.md - Token handling
- authentication/middleware.md - Auth middleware

#### 2. Merge: utils-strings.md + utils-formatting.md (LOW priority)
Both under 40 lines, always referenced together
Suggested: Combine into utilities.md

#### 3. Archive: legacy-api.md (MEDIUM priority)
No incoming links, sources deleted
Suggested: Move to wiki/.archive/ or delete

### No Action Needed
The following were analyzed but don't require changes:
- database.md - 280 lines, well-structured
- api-routes.md - 150 lines, appropriate scope
```

### Step 4: User Decision Point

Present recommendations and ask:

```
Reorganization analysis complete.

Found 3 recommendations:
1. [HIGH] Split authentication.md into 4 pages
2. [LOW] Merge utils-strings.md + utils-formatting.md
3. [MEDIUM] Archive legacy-api.md

Options:
A) Apply all recommendations
B) Apply high-priority only
C) Review each individually
D) Skip reorganization

What would you like to do?
```

### Step 5: Apply Changes (if approved)

For approved changes:

**Splitting a page:**
1. Create new directory if needed
2. Create new pages with proper frontmatter
3. Distribute content to appropriate pages
4. Update original page to be an overview with links
5. Update all incoming wikilinks to point to new locations
6. Update .index.json

**Merging pages:**
1. Combine content with clear section separation
2. Preserve all incoming wikilinks (redirect or update)
3. Delete merged pages
4. Update .index.json

**Archiving:**
1. Move to wiki/.archive/ with date prefix
2. Remove from .index.json
3. Update any remaining links (convert to plain text or remove)

### Step 6: Validate and Finalize

After reorganization:
1. Verify all wikilinks resolve
2. Check no orphan pages created
3. Regenerate llms.txt files
4. Update .index.json

## Output

```
Reorganization complete!

Changes applied:
- Split authentication.md into 4 pages
- Merged 2 utility pages into utilities.md
- Archived 1 obsolete page

All wikilinks validated.
Run `/wiki:serve` to browse the updated structure.
```

## No Changes Needed

If analysis finds no issues:

```
Wiki structure analyzed - no reorganization needed.

Current state is healthy:
- 18 pages, average 150 lines
- No oversized or undersized pages
- No orphan pages
- Link structure is well-connected

No action taken.
```
