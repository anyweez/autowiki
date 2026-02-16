---
title: Agents
type: concept
tags: [agents, exploration, coordination, sub-agents]
related:
  - "[[Commands]]"
  - "[[Architecture]]"
sources:
  - plugins/autowiki/agents/
---

# Agents

The autowiki plugin uses two specialized sub-agents to explore codebases and synthesize documentation. These agents are defined as markdown instruction files that Claude Code launches as Task sub-agents.

## Wiki Explorer Agent

**File**: `plugins/autowiki/agents/wiki-explorer.md`

The explorer agent analyzes assigned code partitions and produces structured findings for the coordinator.

### Role

From `wiki-explorer.md:6-11`:
- Understand what components exist and what they do
- How they work internally
- How they relate to other parts of the codebase
- Key patterns, conventions, and architectural decisions

### Input

Explorers receive:
```
Partition: [list of directories/files to explore]
Context: [brief description of expected contents]
Existing wiki pages: [list of current pages, if updating]
```

### Exploration Process

1. **Survey the partition** - List files, identify entry points, note conventions (`wiki-explorer.md:29-34`)
2. **Read key files** - Prioritize entry points, types, core implementation, config, tests (`wiki-explorer.md:36-42`)
3. **Identify concepts** - Find coherent units of functionality (`wiki-explorer.md:44-50`)
4. **Document relationships** - Dependencies, dependents, data flow (`wiki-explorer.md:52-58`)
5. **Capture code references** - Specific file paths with line numbers (`wiki-explorer.md:60-66`)

### Output Format

```markdown
# Exploration Report: [Partition Name]

## Summary
Brief overview of partition contents and role.

## Discovered Concepts

### Concept: [Name]
**Description**: What this concept is and does
**Type**: feature | service | utility | integration | pattern
**Key Files**:
- `path/to/file.ts` - Primary implementation

**Behavior**:
- How it works
- Key algorithms or patterns

**Dependencies**:
- Uses [[Other Concept]] for X

**Code References**:
- Main entry: `src/feature/index.ts:1`
- Core logic: `src/feature/handler.ts:25-80`

---

## Cross-Partition Dependencies
[Concepts that depend on or are depended upon by other partitions]

## Suggested Wiki Structure
[How to organize wiki pages for this partition]

## Open Questions
[Things that need clarification]
```

### Guidelines

**Do**:
- Read actual code, don't guess from filenames
- Follow imports to understand dependencies
- Note patterns that appear repeatedly
- Include line numbers for key locations

**Don't**:
- Explore outside assigned partition
- Make assumptions about unread code
- Document obvious/trivial things
- Include non-architectural implementation details

See `wiki-explorer.md:126-138`.

---

## Wiki Coordinator Agent

**File**: `plugins/autowiki/agents/wiki-coordinator.md`

The coordinator synthesizes explorer findings into cohesive wiki documentation.

### Role

From `wiki-coordinator.md:6-12`:
1. Synthesize findings into coherent wiki pages
2. Resolve cross-partition dependencies
3. Create consistent page structure
4. Ensure all wikilinks are valid
5. Generate supporting index files

### Input

Coordinators receive:
```
Mode: init | update
Explorer outputs: [collected reports from all explorers]
Existing wiki: [current pages and structure, if updating]
Config: [wiki/.config.yml contents]
```

### Init Mode Process

1. **Consolidate concepts** - Merge findings, resolve naming conflicts, identify gaps (`wiki-coordinator.md:28-33`)
2. **Design page structure** - Create hierarchy respecting max_root_pages limit (`wiki-coordinator.md:35-52`)
3. **Write pages** - Generate complete content with frontmatter (`wiki-coordinator.md:54-102`)
4. **Create overview** - Special entry point page (`wiki-coordinator.md:104-150`)
5. **Build index** - Generate `.index.json` with metadata (`wiki-coordinator.md:152-185`)
6. **Validate** - Check all wikilinks resolve, no orphans (`wiki-coordinator.md:187-193`)

### Update Mode Process

1. **Identify changes** - Categorize as update/create/delete/rename (`wiki-coordinator.md:197-203`)
2. **Apply updates** - Preserve structure, update affected sections (`wiki-coordinator.md:205-225`)
3. **Update index** - Regenerate `.index.json` (`wiki-coordinator.md:227-229`)
4. **Validate** - Same as init mode (`wiki-coordinator.md:231-232`)

### Page Structure Rules

From `wiki-coordinator.md:48-51`:
- No more than 15 pages at root level
- Create subdirectory if topic has 3+ related concepts
- Every page must have at least one incoming link

### Writing Guidelines

**Voice and Style** (`wiki-coordinator.md:245-249`):
- Write for AI agents as primary audience
- Be precise and unambiguous
- Include concrete code references
- Avoid marketing language or fluff

**Content Priorities** (`wiki-coordinator.md:251-255`):
1. What does this do? (purpose)
2. How does it work? (mechanism)
3. Where is it? (code locations)
4. How does it connect? (relationships)

**Code References** (`wiki-coordinator.md:257-260`):
- Good: `src/auth/middleware.ts:42`
- Bad: "in the auth middleware"

### Output

1. All wiki page contents (as file writes)
2. The `.index.json` content
3. Summary of pages created/updated/deleted
4. Any warnings (broken links, orphan pages)

---

## Agent Communication Pattern

```
Command
   |
   +-- launches --> Explorer 1 (partition A)
   |                    |
   +-- launches --> Explorer 2 (partition B)
   |                    |
   +-- launches --> Explorer 3 (partition C)
   |                    |
   +-- waits for all ----+
   |
   +-- collects outputs
   |
   +-- launches --> Coordinator
                        |
                    writes wiki pages
```

## Code References

- `plugins/autowiki/agents/wiki-explorer.md` - Explorer instructions
- `plugins/autowiki/agents/wiki-coordinator.md` - Coordinator instructions
