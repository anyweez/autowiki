<p align="center">
  <img src="static/agent-wiki.png" alt="autowiki" width="400">
</p>

<h1 align="center">autowiki</h1>

<p align="center">
  Auto-generated wiki documentation for your codebase, built by AI agents and browsable by humans.
  <br><br>
  <a href="https://www.npmjs.com/package/autowiki"><img src="https://img.shields.io/npm/v/autowiki" alt="npm version"></a>
</p>

---

## How It Works

**autowiki** has two parts that work together:

1. **A Claude Code plugin** that builds and maintains a wiki for your repo. Run `/autowiki:init` and Claude explores your codebase, identifies key concepts, and writes structured markdown documentation in a `wiki/` directory. The wiki updates incrementally as your code changes — no need to regenerate from scratch.

2. **An npm package** (`npx autowiki`) that serves the wiki as a polished, searchable website. Dark mode, sidebar navigation, full-text search, wikilinks between pages — all running locally with zero configuration.

The generated wiki is immediately useful for AI agents as raw markdown (plus `llms.txt`), and just as useful for humans via the web UI.

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

### Add to your CLAUDE.md

Add this to your project's `CLAUDE.md` so Claude keeps the wiki up to date as you work:

```markdown
## Wiki

The project maintains an auto-generated wiki in `wiki/`. The index is at `wiki/llms.txt`. When making significant changes to the codebase, update the wiki by running the `/autowiki:update` skill.
```

### Browse it

```bash
npx autowiki
```

Open http://localhost:3000 and you're in.

## Plugin Commands

| Command | Description |
|---------|-------------|
| `/autowiki:init` | Generate a wiki from scratch by exploring the codebase |
| `/autowiki:update` | Update the wiki to reflect recent code changes |
| `/autowiki:reorganize` | Analyze wiki structure and suggest improvements |

The wiki also auto-updates after Claude Code tasks complete. Disable this in `wiki/.config.yml`:

```yaml
auto_update: false
```

## Web Server Options

```
npx autowiki [options]

  --port <number>     Port to listen on (default: 3000)
  --wiki-dir <path>   Wiki directory (default: auto-detect)
  --export            Export static HTML files
  --output <path>     Export directory (default: wiki-html/)
  --open              Open browser automatically
```

## Wiki Format

Pages are markdown files with YAML frontmatter, organized by type:

```
wiki/
├── overview.md       # Repository overview
├── concepts/         # Architecture, design patterns
├── guides/           # How-to documentation
└── reference/        # API and config reference
```

Pages link to each other with `[[wikilinks]]` and track which source files they document, so the wiki knows what to update when code changes.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (for the plugin)
- Node.js 16+ (for the web server)

## License

Apache 2
