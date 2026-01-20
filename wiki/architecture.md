---
title: Architecture
type: concept
tags: [architecture, design, flow]
related:
  - "[[Commands]]"
  - "[[Agents]]"
  - "[[Configuration]]"
sources:
  - plugins/agent-wiki/
---

# Architecture

The agent-wiki plugin follows a command-agent-script architecture where user commands orchestrate specialized agents that produce wiki content, supported by utility scripts for serving and indexing.

## System Flow

### Initialization Flow (/agent-wiki:init)

```
1. User runs /agent-wiki:init
2. Command handler (commands/init.md) executes
3. Pre-flight: Check wiki/ doesn't exist
4. Create default wiki/.config.yml
5. Analyze codebase structure
6. Partition codebase for parallel exploration
7. Launch wiki-explorer agents (up to 4 concurrent)
8. Collect explorer outputs
9. Launch wiki-coordinator agent
10. Coordinator writes wiki pages
11. Run generate-llms.py
12. Report completion
```

### Update Flow (/agent-wiki:update)

```
1. User runs /agent-wiki:update (or auto-triggered)
2. Command handler (commands/update.md) executes
3. Pre-flight: Check wiki/ exists
4. Detect changes via git diff since wiki/.last-update
5. Map changed files to affected wiki pages via .index.json
6. Launch targeted wiki-explorer agents
7. Collect focused update outputs
8. Launch wiki-coordinator in update mode
9. Coordinator applies incremental updates
10. Regenerate llms.txt files
11. Update wiki/.last-update marker
```

## Component Responsibilities

### Commands Layer

Commands are markdown files with embedded instructions that Claude Code executes as slash commands.

| File | Command | Role |
|------|---------|------|
| `commands/init.md` | `/agent-wiki:init` | Orchestrates full wiki creation |
| `commands/update.md` | `/agent-wiki:update` | Orchestrates incremental updates |
| `commands/reorganize.md` | `/agent-wiki:reorganize` | Analyzes and restructures wiki |
| `commands/serve.md` | `/agent-wiki:serve` | Starts local web server |

### Agents Layer

Agents are specialized sub-agents launched by commands to perform focused tasks.

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| Wiki Explorer | Explore code partition | Directory list, context | Concept list, code refs |
| Wiki Coordinator | Synthesize findings | Explorer outputs | Wiki pages, index |

### Scripts Layer

Utility scripts that support wiki functionality.

| Script | Language | Purpose |
|--------|----------|---------|
| `generate-llms.py` | Python | Generate llms.txt index files |
| `serve.js` | Node.js | HTTP server with wikilink support |

### Data Layer

Generated files that comprise the wiki.

| File | Purpose |
|------|---------|
| `wiki/.config.yml` | Configuration settings |
| `wiki/.index.json` | Page metadata and source mapping |
| `wiki/.last-update` | Git commit hash of last update |
| `wiki/llms.txt` | AI-friendly page index |
| `wiki/llms-full.txt` | Complete content dump |
| `wiki/*.md` | Documentation pages |

## Key Design Decisions

### Parallel Exploration

The init command partitions the codebase and launches multiple explorer agents concurrently. This design:
- Reduces total exploration time
- Allows specialized focus per partition
- Requires coordination to merge findings

See `commands/init.md:49-84` for partitioning logic.

### Git-Based Change Detection

Updates use git to identify what changed:
- Compares current HEAD to `wiki/.last-update` commit
- Maps changed files to wiki pages via `source_map` in `.index.json`
- Only re-explores affected areas

See `commands/update.md:20-29` for change detection.

### Wikilink System

Pages connect via `[[wikilinks]]` resolved at render time:
1. Check exact title match
2. Check aliases in `.index.json`
3. Fall back to slugified filename

See `scripts/serve.js:121-127` for resolution logic.

## Extension Points

### Adding New Commands

1. Create `commands/your-command.md` with frontmatter
2. Command auto-registers via Claude Code plugin system
3. Follow existing command structure (pre-flight, process, output)

### Custom Exploration

Modify `agents/wiki-explorer.md` to:
- Change what constitutes a "concept"
- Adjust output format
- Add domain-specific analysis

### Alternative Outputs

The coordinator can be extended to generate:
- Different documentation formats
- API documentation
- Dependency graphs

## Related Concepts

- [[Commands]] - Detailed command documentation
- [[Agents]] - Agent instruction details
- [[Configuration]] - Customization options
