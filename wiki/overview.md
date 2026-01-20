---
title: Agent Wiki
type: overview
tags: [claude-code, plugin, documentation, wiki]
sources:
  - ./
  - plugins/agent-wiki/
---

# Agent Wiki

A Claude Code plugin that maintains an auto-updating wiki for agent context about how repository components work. The plugin enables AI agents to explore codebases, synthesize findings, and generate structured documentation that stays current with code changes.

## Architecture

```
User Command (/agent-wiki:init, /agent-wiki:update, etc.)
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
| Generated Wiki   | --> | Supporting Tools  |
| (wiki/*.md)      |     | - serve.js        |
+------------------+     | - generate-llms.py|
                         +-------------------+
```

## Core Concepts

- [[Commands]] - Four user-invokable commands (init, update, reorganize, serve)
- [[Agents]] - Wiki Explorer and Wiki Coordinator sub-agents
- [[Scripts]] - Python and Node.js utilities for llms.txt generation and wiki serving
- [[Configuration]] - YAML config, data structures, and auto-update hooks

## Getting Started

For agents working with this codebase:

1. Start with [[Architecture]] for system design
2. See [[Commands]] for the main entry points
3. Check [[Agents]] for the exploration and coordination system
4. Review [[Configuration]] for customization options

## Directory Structure

```
plugins/agent-wiki/
  .claude-plugin/
    plugin.json          - Plugin manifest
  agents/
    wiki-explorer.md     - [[Agents|Explorer agent]] instructions
    wiki-coordinator.md  - [[Agents|Coordinator agent]] instructions
  commands/
    init.md              - [[Commands|/agent-wiki:init]] command
    update.md            - [[Commands|/agent-wiki:update]] command
    reorganize.md        - [[Commands|/agent-wiki:reorganize]] command
    serve.md             - [[Commands|/agent-wiki:serve]] command
  hooks/
    post-task.sh         - [[Configuration|Auto-update hook]]
  scripts/
    generate-llms.py     - [[Scripts|llms.txt generator]]
    serve.js             - [[Scripts|Wiki web server]]
  package.json           - Node.js dependencies

.claude-plugin/
  marketplace.json       - Plugin distribution config
```

## Installation

Install via Claude Code:

```bash
/plugin marketplace add github:anyweez/agent-wiki
/plugin install agent-wiki@anyweez/agent-wiki
```

Or for local development:

```bash
claude --plugin-dir /path/to/agent-wiki
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `/agent-wiki:init` | Bootstrap wiki from codebase |
| `/agent-wiki:update` | Update wiki after code changes |
| `/agent-wiki:reorganize` | Restructure wiki if needed |
| `/agent-wiki:serve` | Browse wiki locally |
