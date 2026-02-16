# autowiki

Auto-generated wiki documentation for codebases, built as a Claude Code plugin with an npm-based web viewer.

## Project Structure

- `bin/` - CLI entry point (`autowiki.js`)
- `lib/` - Core JS modules (server, scanner, renderer, highlight, template)
- `plugins/autowiki/` - Claude Code plugin
  - `agents/` - Wiki explorer and coordinator agent definitions
  - `commands/` - Skill definitions (init, update, reorganize, serve)
  - `hooks/` - Post-task auto-update hook
  - `scripts/` - Utilities (generate-llms.js)
- `scripts/` - Build utilities (bump-version.js)

## Development

Pure JavaScript (CommonJS), no build step, no TypeScript. Runs on Node.js 16+.

```bash
npm install          # install dependencies
npx autowiki         # run the wiki web server locally
```

Version bumps: `node scripts/bump-version.js` (updates both `package.json` and `plugins/autowiki/package.json`).

## Plugin System

Commands are markdown files in `plugins/autowiki/commands/` that provide instructions to Claude. Agents in `plugins/autowiki/agents/` are sub-agents (wiki-explorer, wiki-coordinator) that handle codebase exploration and wiki generation. The post-task hook in `plugins/autowiki/hooks/` triggers auto-updates after Claude Code tasks.

## Wiki

The project maintains an auto-generated wiki in `wiki/`. The index is at `wiki/llms.txt`. When making significant changes to the codebase, update the wiki by running the `/autowiki:update` skill.

## Wiki Format

Pages are markdown with YAML frontmatter (title, type, tags, related, sources). Types: `overview`, `concept`, `guide`, `reference`. Pages link via `[[wikilinks]]` and track source files in frontmatter for incremental updates. The wiki index lives in `wiki/.index.json`.

## Code Conventions

- CommonJS modules (`require`/`module.exports`)
- 2-space indentation
- Lowercase filenames with hyphens for markdown, plain lowercase for JS
