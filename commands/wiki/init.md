# /wiki:init - Initialize Agent Wiki

Initialize a new wiki for this repository by exploring the codebase and creating documentation pages.

## Pre-flight Checks

Before starting, verify:
1. Check if `wiki/` directory already exists
2. If it exists, stop and inform the user: "Wiki already exists. Use `/wiki` to update or delete `wiki/` to reinitialize."

## Process

### Step 1: Load Configuration

Check for existing configuration at `wiki/.config.yml`. If not present, create with defaults:

```yaml
# Agent Wiki Configuration
auto_update: true  # Automatically update wiki after agent tasks
page_granularity: concept  # concept | directory | module

# Paths to exclude from wiki generation
exclude:
  - node_modules/
  - .git/
  - dist/
  - build/
  - "*.min.js"
  - "*.lock"

# Custom concept mappings (optional)
# concepts:
#   authentication: [src/auth/, src/middleware/auth*]
#   database: [src/db/, src/models/]
```

### Step 2: Discover Codebase Structure

Analyze the repository to identify:
1. **Top-level directories** - Major code divisions
2. **Module boundaries** - Look for `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `setup.py`, etc.
3. **Entry points** - Main files, index files, CLI entry points
4. **Key patterns** - Identify frameworks, architectures (MVC, microservices, etc.)

### Step 3: Partition Work for Sub-Agents

Divide the codebase into logical partitions for parallel exploration. Each partition should:
- Respect module boundaries
- Be roughly equal in complexity
- Have clear ownership (no overlap)

Example partitioning for a typical web app:
- Partition 1: Backend API routes and controllers
- Partition 2: Database models and data layer
- Partition 3: Frontend components and UI
- Partition 4: Shared utilities, config, and infrastructure

### Step 4: Launch Wiki Explorer Agents

For each partition, launch a `wiki-explorer` agent with:
```
Task wiki-explorer: Explore [partition name]

Partition: [list of directories/files]
Context: [brief description of what this partition likely contains]

Instructions:
1. Read and understand the code in your partition
2. Identify key concepts, components, and patterns
3. Document relationships and dependencies
4. Note any cross-partition dependencies for the coordinator

Output format:
- List of discovered concepts with descriptions
- Suggested wiki page structure
- Key code references (file:line)
- Cross-references to other partitions
```

Launch agents in parallel (up to 4 concurrent agents).

### Step 5: Coordinate and Write Wiki

Once all explorer agents complete, launch `wiki-coordinator` agent:
```
Task wiki-coordinator: Create initial wiki

Explorer outputs: [collected outputs from all explorers]

Instructions:
1. Synthesize findings from all explorers
2. Resolve cross-partition dependencies
3. Create wiki page structure
4. Write all wiki pages with proper frontmatter and wikilinks
5. Generate llms.txt and llms-full.txt
6. Create wiki/.index.json for fast lookups
```

### Step 6: Generate Index Files

After wiki pages are written, run the llms.txt generation:
```bash
python scripts/generate-llms.py
```

This creates:
- `wiki/llms.txt` - Index with links to all pages
- `wiki/llms-full.txt` - Full concatenated content

## Output Structure

```
wiki/
├── .config.yml           # Configuration
├── .index.json           # Page index for fast lookups
├── llms.txt              # AI-friendly index
├── llms-full.txt         # Full content dump
├── overview.md           # Repository overview (always created)
├── architecture.md       # System architecture
├── [concept-pages].md    # One per identified concept
└── [subdirs]/            # Sub-pages for complex concepts
    └── [detail-pages].md
```

## Wiki Page Format

Each page follows this structure:

```markdown
---
title: Page Title
type: concept | guide | reference | overview
tags: [relevant, tags]
related:
  - "[[Other Page]]"
  - "[[Another Page]]"
sources:
  - src/path/to/relevant/code/
  - src/specific/file.ts
---

# Page Title

Brief description of this concept.

## Overview

What this component/concept does and why it exists.

## Key Components

### Component Name
Description with code references like `src/file.ts:42`.

## How It Works

Detailed explanation of behavior, data flow, etc.

## Related Concepts

- [[Other Concept]] - How it relates
- [[Another Concept]] - Connection explanation

## Code References

Key files and locations:
- `src/main/entry.ts` - Entry point
- `src/handlers/` - Request handlers
```

## Error Handling

- If exploration fails for a partition, log the error and continue with others
- If coordinator fails, save raw explorer outputs to `wiki/.raw/` for manual recovery
- Always create at least `wiki/overview.md` even if exploration is incomplete

## Success Message

When complete, inform the user:
```
Wiki initialized successfully!
- Created X pages covering Y concepts
- Run `/wiki:serve` to browse locally
- Wiki will auto-update after tasks (disable in wiki/.config.yml)
```
