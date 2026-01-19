# /wiki:serve - Start Wiki Web Server

Start a local web server to browse the wiki in a browser.

## Pre-flight Checks

1. Verify `wiki/` directory exists
2. Check if Node.js is available
3. Check if dependencies are installed

## Process

### Step 1: Check Dependencies

```bash
# Check for node
if ! command -v node &> /dev/null; then
  echo "Node.js is required. Install from https://nodejs.org/"
  exit 1
fi

# Check if node_modules exists in plugin directory
PLUGIN_DIR="$(dirname "$(dirname "$0")")"
if [ ! -d "$PLUGIN_DIR/node_modules" ]; then
  echo "Installing dependencies..."
  cd "$PLUGIN_DIR" && npm install
fi
```

### Step 2: Start Server

```bash
node scripts/serve.js --wiki-dir ./wiki --port 3000
```

### Step 3: Report

```
Wiki server started!

Local: http://localhost:3000
Wiki:  http://localhost:3000/wiki/overview

Features:
- Wikilinks rendered as clickable links
- Syntax highlighting for code blocks
- Search across all pages (Ctrl+K)
- Dark mode support

Press Ctrl+C to stop the server.
```

## Server Features

The serve script provides:
- Markdown rendering with `markdown-it`
- Wikilink resolution via `markdown-it-wikilinks`
- Code syntax highlighting
- Simple search endpoint
- Auto-reload on file changes (optional)

## Alternative: Static Export

If user prefers static HTML:

```
Would you like to:
A) Start live server (default)
B) Export static HTML to wiki-html/
```

For static export:
```bash
node scripts/serve.js --export --output ./wiki-html
```
