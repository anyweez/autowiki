---
title: Architecture
type: concept
tags: [architecture, design, flow]
related:
  - "[[Commands]]"
  - "[[Agents]]"
  - "[[Configuration]]"
sources:
  - plugins/autowiki/
  - bin/
  - lib/
---

# Architecture

autowiki has two main components: a **Claude Code plugin** (`plugins/autowiki/`) that generates and maintains wiki content, and an **npm package** (`bin/` + `lib/`) that serves the wiki as a website. The plugin follows a command-agent-script architecture where user commands orchestrate specialized agents that produce wiki content, supported by utility scripts for indexing.

## System Flow

### Initialization Flow (/autowiki:init)

```
1. User runs /autowiki:init
2. Command handler (commands/init.md) executes
3. Pre-flight: Check wiki/ doesn't exist
4. Create default wiki/.config.yml
5. Analyze codebase structure
6. Partition codebase for parallel exploration
7. Launch wiki-explorer agents (up to 4 concurrent)
8. Collect explorer outputs
9. Launch wiki-coordinator agent
10. Coordinator writes wiki pages
11. Run generate-llms.js
12. Report completion
```

### Update Flow (/autowiki:update)

```
1. User runs /autowiki:update (or auto-triggered)
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
| `commands/init.md` | `/autowiki:init` | Orchestrates full wiki creation |
| `commands/update.md` | `/autowiki:update` | Orchestrates incremental updates |
| `commands/reorganize.md` | `/autowiki:reorganize` | Analyzes and restructures wiki |
| `commands/serve.md` | `/autowiki:serve` | Deprecated, redirects to `npx autowiki` |

### Agents Layer

Agents are specialized sub-agents launched by commands to perform focused tasks.

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| Wiki Explorer | Explore code partition | Directory list, context | Concept list, code refs |
| Wiki Coordinator | Synthesize findings | Explorer outputs | Wiki pages, index |

### npm Package (Web Server)

The web server is distributed as an npm package for browsing wikis locally.

| File | Purpose |
|------|---------|
| `bin/autowiki.js` | CLI entry point, argument parsing, wiki directory auto-detection |
| `lib/server.js` | HTTP server with routing, wikilink resolution, static export |
| `lib/renderer.js` | Markdown rendering pipeline |
| `lib/scanner.js` | Wiki page scanner and frontmatter parser |
| `lib/highlight.js` | Syntax highlighting for code blocks |
| `lib/template.js` | HTML template with sidebar, search, dark mode styling |

### Scripts Layer

Utility scripts that support wiki functionality.

| Script | Language | Purpose |
|--------|----------|---------|
| `generate-llms.js` | Node.js | Generate llms.txt index files |

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

### Two-Part Distribution

The project is split into a Claude Code plugin (for wiki generation) and an npm package (for wiki viewing). This allows:
- Wiki generation to happen within Claude Code's agent framework
- Wiki browsing to work independently via `npx autowiki` with zero configuration
- The generated markdown to be useful on its own (for AI agents via `llms.txt`)

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

See `lib/scanner.js` for resolution logic.

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
