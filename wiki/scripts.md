---
title: Scripts
type: reference
tags: [scripts, llms-txt, server, utilities, npm]
related:
  - "[[Commands]]"
  - "[[Architecture]]"
  - "[[Configuration]]"
sources:
  - plugins/autowiki/scripts/
  - bin/
  - lib/
---

# Scripts

autowiki includes a Node.js script for generating llms.txt files and an npm package for browsing the wiki locally. The web server has been moved out of the plugin and into the main npm package (`npx autowiki`).

## generate-llms.js

**File**: `plugins/autowiki/scripts/generate-llms.js`
**Language**: Node.js 16+
**Dependencies**: None (pure Node.js)

Generates `llms.txt` and `llms-full.txt` from wiki pages for AI discoverability.

### Usage

```bash
node scripts/generate-llms.js [--wiki-dir wiki/]
```

### Output Files

**llms.txt** - Index file with links to all wiki pages:
```
# Repository Wiki

> Agent-maintained documentation for understanding this codebase.

## Quick Start
This wiki is designed for AI agents...

## Overview
- [Overview](wiki/overview.md): Repository overview...

## Concepts
- [Authentication](wiki/authentication.md): Auth system...
```

**llms-full.txt** - Complete content dump:
```
# Repository Wiki - Complete Content

================================================================================

FILE: wiki/overview.md
----------------------------------------
[full page content]

================================================================================
```

### Key Functions

**`parseFrontmatter(content)`** (`generate-llms.js:27-99`)
- Extracts YAML frontmatter and body from markdown
- Inline implementation (no external YAML dependency)
- Returns object with `frontmatter` and `body`

**`getFirstParagraph(body)`** (`generate-llms.js:102-134`)
- Extracts first non-heading paragraph as description
- Truncates to 200 characters

**`collectWikiPages(dir, base)`** (`generate-llms.js:136-167`)
- Recursively collects all .md files
- Skips hidden files/directories
- Returns list of page metadata dicts

**`generateLlmsTxt(pages, wikiDirPath, repoName)`** (`generate-llms.js:195-242`)
- Groups pages by type (overview, concept, guide, reference)
- Generates formatted index content

**`generateLlmsFullTxt(pages, repoName)`** (`generate-llms.js:244-270`)
- Concatenates all page content
- Sorts with overview first, then alphabetically

**`getRepoName(wikiDirPath)`** (`generate-llms.js:169-193`)
- Attempts to determine repo name from package.json or pyproject.toml
- Falls back to directory name

### Integration

Called by commands after wiki generation/update:
```bash
node scripts/generate-llms.js
```

---

## Web Server (npx autowiki)

The wiki web server is distributed as the `autowiki` npm package. It replaces the previous plugin-based `/autowiki:serve` command.

### CLI Entry Point

**File**: `bin/autowiki.js`

Parses CLI arguments and starts the server or exports static HTML.

```bash
npx autowiki [options]

  --port <number>     Port to listen on (default: 3000)
  --wiki-dir <path>   Wiki directory (default: auto-detect from git root)
  --export            Export static HTML instead of starting server
  --output <path>     Output directory for export (default: wiki-html/)
  --open              Auto-open browser after starting server
  -h, --help          Show help message
```

Wiki directory auto-detection: Uses `git rev-parse --show-toplevel` to find the repo root, then looks for `wiki/` there. Falls back to `./wiki` in the current directory.

### Library Modules

**`lib/server.js`** - HTTP server with routing and static export
- `startServer(wikiDir, port, open)` - Starts the HTTP server
- `exportSite(wikiDir, outputDir)` - Generates static HTML files

**`lib/renderer.js`** - Markdown rendering pipeline
- Configures markdown-it with wikilink support
- Handles frontmatter extraction

**`lib/scanner.js`** - Wiki page scanner and frontmatter parser
- Scans wiki directory for pages
- Parses YAML frontmatter
- Builds title-to-path mappings for wikilink resolution

**`lib/highlight.js`** - Syntax highlighting for code blocks
- Language-aware code highlighting

**`lib/template.js`** - HTML template and styling
- Sidebar navigation with pages grouped by type
- Client-side search (Ctrl+K / Cmd+K)
- Dark mode support (CSS media query)
- Responsive layout

### Server Features

1. **Sidebar navigation** - Pages grouped by type (overview, concepts, guides, reference)
2. **Full-text search** - Client-side search triggered by Ctrl+K / Cmd+K
3. **Wikilink support** - Resolves `[[Page Name]]` syntax to proper links
4. **Dark mode** - CSS media query for `prefers-color-scheme: dark`
5. **Syntax highlighting** - Language-aware code block highlighting
6. **Static export** - Generate standalone HTML files with `--export`

### Wikilink Resolution

The scanner builds a title-to-path map from `.index.json`:

Resolution order:
1. Exact title match (case-insensitive)
2. Slug match
3. Alias match
4. Fall back to slugified target

### Export Mode

When `--export` flag is set:
1. Creates output directory
2. Recursively processes wiki directory
3. Renders each .md file to .html
4. Copies non-markdown files as-is
5. Generates index.html

### Routes

| Path | Response |
|------|----------|
| `/` | Redirects to `/overview` |
| `/overview` | Rendered overview.md |
| `/[page-name]` | Rendered [page-name].md |
| `/index` | Auto-generated page list |
| `/llms.txt` | Raw llms.txt content |
| `/.index.json` | Raw index JSON |

---

## Dependencies

**Root package.json** (npm package):
```json
{
  "dependencies": {
    "markdown-it": "^14.0.0",
    "markdown-it-wikilinks": "^1.2.0"
  }
}
```

**Plugin package.json** (`plugins/autowiki/package.json`):
```json
{
  "dependencies": {
    "markdown-it": "^14.0.0",
    "markdown-it-wikilinks": "^1.2.0"
  }
}
```

No Python dependencies are required.

## Code References

- `plugins/autowiki/scripts/generate-llms.js` - llms.txt generator (304 lines)
- `bin/autowiki.js` - CLI entry point (89 lines)
- `lib/server.js` - HTTP server
- `lib/renderer.js` - Markdown rendering
- `lib/scanner.js` - Page scanning and frontmatter
- `lib/highlight.js` - Code highlighting
- `lib/template.js` - HTML template and styles
