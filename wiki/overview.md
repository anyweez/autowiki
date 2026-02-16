---
title: autowiki
type: overview
tags: [claude-code, plugin, documentation, wiki, npm]
sources:
  - ./
  - plugins/autowiki/
---

# autowiki

Auto-generated wiki documentation for your codebase, built by AI agents and browsable by humans. The project has two parts: a **Claude Code plugin** that builds and maintains a wiki, and an **npm package** (`npx autowiki`) that serves it as a searchable website.

## Architecture

```
User Command (/autowiki:init, /autowiki:update, etc.)
         |
         v
+------------------+     +-------------------+
| Command Handler  | --> | Wiki Explorer(s)  |  (parallel exploration)
|  (commands/*.md) |     | (agents/wiki-     |
+------------------+     |  explorer.md)     |
         |               +-------------------+
         |                        |
         v                        v
+------------------+     +-------------------+
| Wiki Coordinator | <-- | Explorer Outputs  |
| (agents/wiki-    |     | (findings, refs)  |
|  coordinator.md) |     +-------------------+
+------------------+
         |
         v
+------------------+     +-------------------+
| Generated Wiki   | --> | npx autowiki      |
| (wiki/*.md)      |     | (bin/autowiki.js) |
+------------------+     | (lib/server.js)   |
                         +-------------------+
```

## Core Concepts

- [[Commands]] - Three user-invokable commands (init, update, reorganize)
- [[Agents]] - Wiki Explorer and Wiki Coordinator sub-agents
- [[Scripts]] - Node.js utilities for llms.txt generation and wiki serving
- [[Configuration]] - YAML config, data structures, and auto-update hooks

## Getting Started

### Install the Claude Code plugin

In Claude Code, run:

```
/plugins
```

Select **Add a marketplace**, then enter:

```
anyweez/autowiki
```

Then select **autowiki** from the marketplace to install it.

### Generate your wiki

```
/autowiki:init
```

Claude will explore your codebase and create a `wiki/` directory with structured documentation.

### Browse it

```bash
npx autowiki
```

Open http://localhost:3000 and you're in.

## Plugin Commands

| Command | Purpose |
|---------|---------|
| `/autowiki:init` | Bootstrap wiki from codebase |
| `/autowiki:update` | Update wiki after code changes |
| `/autowiki:reorganize` | Restructure wiki if needed |

## Web Server Options

```
npx autowiki [options]

  --port <number>     Port to listen on (default: 3000)
  --wiki-dir <path>   Wiki directory (default: auto-detect)
  --export            Export static HTML files
  --output <path>     Export directory (default: wiki-html/)
  --open              Open browser automatically
```

## Directory Structure

```
bin/
  autowiki.js              - CLI entry point for npx autowiki
lib/
  highlight.js             - Syntax highlighting for code blocks
  renderer.js              - Markdown rendering pipeline
  scanner.js               - Wiki page scanner and frontmatter parser
  server.js                - HTTP server with wikilink support
  template.js              - HTML template and styling
package.json               - npm package config (autowiki)

plugins/autowiki/
  .claude-plugin/
    plugin.json            - Plugin manifest
  agents/
    wiki-explorer.md       - [[Agents|Explorer agent]] instructions
    wiki-coordinator.md    - [[Agents|Coordinator agent]] instructions
  commands/
    init.md                - [[Commands|/autowiki:init]] command
    update.md              - [[Commands|/autowiki:update]] command
    reorganize.md          - [[Commands|/autowiki:reorganize]] command
    serve.md               - Deprecated, redirects to npx autowiki
  hooks/
    post-task.sh           - [[Configuration|Auto-update hook]]
  scripts/
    generate-llms.js       - [[Scripts|llms.txt generator]]
  package.json             - Plugin Node.js dependencies

.claude-plugin/
  marketplace.json         - Plugin distribution config
```

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (for the plugin)
- Node.js 16+ (for the web server)
