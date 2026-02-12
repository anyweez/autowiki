---
description: Start a local web server to browse the wiki
---

# /wiki:serve (Deprecated)

> **This command is deprecated.** Use `npx autowiki` instead for a better experience.

## Usage

Run from your project root:

```bash
npx autowiki
```

Options:
- `--port <number>` - Port to listen on (default: 3000)
- `--wiki-dir <path>` - Wiki directory (default: auto-detect from git root)
- `--export` - Export static HTML instead of starting server
- `--output <path>` - Output directory for export (default: wiki-html/)
- `--open` - Auto-open browser after starting server

## Features

- Sidebar navigation with pages grouped by type
- Client-side search (Ctrl+K / Cmd+K)
- Dark mode support
- Syntax highlighting for code blocks
- Wikilink resolution
- Live reload on file changes
- Static HTML export
