---
title: Scripts
type: reference
tags: [scripts, llms-txt, server, utilities]
related:
  - "[[Commands]]"
  - "[[Architecture]]"
  - "[[Configuration]]"
sources:
  - plugins/agent-wiki/scripts/
---

# Scripts

The agent-wiki plugin includes two utility scripts: a Python script for generating llms.txt files and a Node.js HTTP server for browsing the wiki locally.

## generate-llms.py

**File**: `plugins/agent-wiki/scripts/generate-llms.py`
**Language**: Python 3.8+
**Dependencies**: PyYAML

Generates `llms.txt` and `llms-full.txt` from wiki pages for AI discoverability.

### Usage

```bash
python scripts/generate-llms.py [--wiki-dir wiki/]
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

**`parse_frontmatter(content)`** (`generate-llms.py:21-36`)
- Extracts YAML frontmatter and body from markdown
- Returns tuple of (dict, str)

**`get_first_paragraph(body)`** (`generate-llms.py:39-73`)
- Extracts first non-heading paragraph as description
- Truncates to 200 characters

**`collect_wiki_pages(wiki_dir)`** (`generate-llms.py:76-110`)
- Recursively collects all .md files
- Skips hidden files/directories
- Returns list of page metadata dicts

**`generate_llms_txt(pages, wiki_dir, repo_name)`** (`generate-llms.py:113-174`)
- Groups pages by type (overview, concept, guide, reference)
- Generates formatted index content

**`generate_llms_full_txt(pages, repo_name)`** (`generate-llms.py:177-204`)
- Concatenates all page content
- Sorts with overview first, then alphabetically

**`get_repo_name(wiki_dir)`** (`generate-llms.py:207-231`)
- Attempts to determine repo name from package.json or pyproject.toml
- Falls back to directory name

### Integration

Called by commands after wiki generation/update:
```bash
python scripts/generate-llms.py
```

See `commands/init.md:106-108` and `commands/update.md:114-116`.

---

## serve.js

**File**: `plugins/agent-wiki/scripts/serve.js`
**Language**: Node.js 16+
**Dependencies**: markdown-it, markdown-it-wikilinks

HTTP server for browsing the wiki with rendered markdown and wikilink support.

### Usage

**Server mode** (default):
```bash
node scripts/serve.js [--wiki-dir wiki/] [--port 3000]
```

**Export mode** (static HTML):
```bash
node scripts/serve.js --export --output wiki-html/
```

### Server Features

1. **Markdown rendering** - Uses markdown-it with HTML, linkify, and typographer enabled (`serve.js:18-23`)
2. **Wikilink support** - Resolves `[[Page Name]]` syntax to proper links (`serve.js:27-39`)
3. **Dark mode** - CSS media query for `prefers-color-scheme: dark` (`serve.js:162-170`)
4. **Page index** - Auto-generated list at `/index` (`serve.js:242-290`)
5. **Static file serving** - Serves llms.txt, .index.json directly (`serve.js:355-366`)

### Key Functions

**`parseFrontmatter(content)`** (`serve.js:89-118`)
- Simple YAML parsing for page frontmatter
- Handles title, tags, type fields

**`resolveWikilinks(content)`** (`serve.js:121-127`)
- Converts `[[Target]]` or `[[Target|display]]` to HTML links
- Uses titleToPath map built from .index.json

**`renderPage(pagePath)`** (`serve.js:130-239`)
- Loads markdown file, parses frontmatter
- Resolves wikilinks, renders to HTML
- Returns complete HTML document with styling

**`renderIndex()`** (`serve.js:242-290`)
- Scans wiki directory recursively
- Generates HTML page listing all wiki pages

### Wikilink Resolution

From `serve.js:79-86`:
```javascript
const titleToPath = {};
for (const [slug, page] of Object.entries(wikiIndex.pages || {})) {
    titleToPath[page.title.toLowerCase()] = slug;
    titleToPath[slug] = slug;
    for (const alias of (page.aliases || [])) {
        titleToPath[alias.toLowerCase()] = slug;
    }
}
```

Resolution order:
1. Exact title match (case-insensitive)
2. Slug match
3. Alias match
4. Fall back to slugified target

### Export Mode

When `--export` flag is set (`serve.js:293-338`):
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

### Styling

Inline CSS with CSS custom properties for theming (`serve.js:154-224`):
- Light mode: white background, dark text
- Dark mode: dark background, light text
- Wikilinks styled with dashed underline

---

## Dependencies

**package.json** (`plugins/agent-wiki/package.json`):
```json
{
  "dependencies": {
    "markdown-it": "^14.0.0",
    "markdown-it-wikilinks": "^1.2.0"
  }
}
```

**Python requirements**:
- Python 3.8+
- PyYAML (`pip install pyyaml`)

## Code References

- `plugins/agent-wiki/scripts/generate-llms.py` - llms.txt generator (275 lines)
- `plugins/agent-wiki/scripts/serve.js` - Wiki server (397 lines)
- `plugins/agent-wiki/package.json` - Node.js dependencies
