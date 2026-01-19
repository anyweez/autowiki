#!/usr/bin/env node
/**
 * Simple wiki server with wikilink support
 *
 * Usage:
 *   node scripts/serve.js [--wiki-dir wiki/] [--port 3000]
 *   node scripts/serve.js --export --output wiki-html/
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Check for markdown-it
let md;
try {
    const MarkdownIt = require('markdown-it');
    md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
    });

    // Try to load wikilinks plugin
    try {
        const wikilinks = require('markdown-it-wikilinks')({
            baseURL: '/',
            relativeBaseURL: './',
            makeAllLinksAbsolute: false,
            uriSuffix: '',
            htmlAttributes: {
                class: 'wikilink'
            },
            generatePageNameFromLabel: (label) => {
                return label.toLowerCase().replace(/\s+/g, '-');
            }
        });
        md.use(wikilinks);
    } catch (e) {
        console.log('Note: markdown-it-wikilinks not installed, wikilinks will render as plain text');
    }
} catch (e) {
    console.error('Error: markdown-it is required. Run: npm install markdown-it markdown-it-wikilinks');
    process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
let wikiDir = 'wiki';
let port = 3000;
let exportMode = false;
let outputDir = 'wiki-html';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--wiki-dir' && args[i + 1]) {
        wikiDir = args[++i];
    } else if (args[i] === '--port' && args[i + 1]) {
        port = parseInt(args[++i], 10);
    } else if (args[i] === '--export') {
        exportMode = true;
    } else if (args[i] === '--output' && args[i + 1]) {
        outputDir = args[++i];
    }
}

// Load wiki index
let wikiIndex = { pages: {} };
const indexPath = path.join(wikiDir, '.index.json');
if (fs.existsSync(indexPath)) {
    try {
        wikiIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch (e) {
        console.log('Warning: Could not load wiki index');
    }
}

// Build title to path map for wikilink resolution
const titleToPath = {};
for (const [slug, page] of Object.entries(wikiIndex.pages || {})) {
    titleToPath[page.title.toLowerCase()] = slug;
    titleToPath[slug] = slug;
    for (const alias of (page.aliases || [])) {
        titleToPath[alias.toLowerCase()] = slug;
    }
}

// Parse frontmatter
function parseFrontmatter(content) {
    if (!content.startsWith('---')) {
        return { frontmatter: {}, body: content };
    }
    const parts = content.split('---');
    if (parts.length < 3) {
        return { frontmatter: {}, body: content };
    }

    // Simple YAML parsing for frontmatter
    const frontmatter = {};
    const yamlLines = parts[1].trim().split('\n');
    for (const line of yamlLines) {
        const match = line.match(/^(\w+):\s*(.+)?$/);
        if (match) {
            let value = match[2] || '';
            // Handle arrays
            if (value.startsWith('[')) {
                try {
                    value = JSON.parse(value.replace(/'/g, '"'));
                } catch (e) {
                    value = value;
                }
            }
            frontmatter[match[1]] = value;
        }
    }

    return { frontmatter, body: parts.slice(2).join('---').trim() };
}

// Resolve wikilinks in content
function resolveWikilinks(content) {
    return content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, display) => {
        const slug = titleToPath[target.toLowerCase()] || target.toLowerCase().replace(/\s+/g, '-');
        const text = display || target;
        return `<a href="/${slug}" class="wikilink">${text}</a>`;
    });
}

// Render markdown page to HTML
function renderPage(pagePath) {
    const fullPath = path.join(wikiDir, pagePath + '.md');

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    // Resolve wikilinks before markdown rendering
    const resolvedBody = resolveWikilinks(body);
    const htmlBody = md.render(resolvedBody);

    const title = frontmatter.title || pagePath;
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    const related = Array.isArray(frontmatter.related) ? frontmatter.related : [];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Wiki</title>
    <style>
        :root {
            --bg: #ffffff;
            --fg: #1a1a1a;
            --link: #0066cc;
            --code-bg: #f5f5f5;
            --border: #e0e0e0;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #1a1a1a;
                --fg: #e0e0e0;
                --link: #6699ff;
                --code-bg: #2a2a2a;
                --border: #404040;
            }
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: var(--bg);
            color: var(--fg);
        }
        a { color: var(--link); }
        a.wikilink {
            text-decoration: none;
            border-bottom: 1px dashed var(--link);
        }
        a.wikilink:hover {
            border-bottom-style: solid;
        }
        code {
            background: var(--code-bg);
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
        }
        pre {
            background: var(--code-bg);
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }
        pre code {
            padding: 0;
            background: none;
        }
        .meta {
            font-size: 0.85em;
            color: #666;
            border-bottom: 1px solid var(--border);
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }
        .tags span {
            background: var(--code-bg);
            padding: 0.2em 0.5em;
            border-radius: 3px;
            margin-right: 0.5em;
        }
        nav {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border);
        }
        h1, h2, h3 { margin-top: 2rem; }
        h1:first-child { margin-top: 0; }
    </style>
</head>
<body>
    <nav>
        <a href="/overview">Home</a> |
        <a href="/llms.txt">llms.txt</a>
    </nav>
    <div class="meta">
        ${tags.length ? `<div class="tags">Tags: ${tags.map(t => `<span>${t}</span>`).join('')}</div>` : ''}
    </div>
    <article>
        ${htmlBody}
    </article>
</body>
</html>`;
}

// List all pages
function renderIndex() {
    const pages = [];

    function scanDir(dir, prefix = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;

            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                scanDir(fullPath, prefix + entry.name + '/');
            } else if (entry.name.endsWith('.md')) {
                const slug = prefix + entry.name.replace('.md', '');
                const content = fs.readFileSync(fullPath, 'utf-8');
                const { frontmatter } = parseFrontmatter(content);
                pages.push({
                    slug,
                    title: frontmatter.title || slug,
                    type: frontmatter.type || 'page'
                });
            }
        }
    }

    scanDir(wikiDir);

    const pageList = pages
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(p => `<li><a href="/${p.slug}">${p.title}</a> <small>(${p.type})</small></li>`)
        .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Wiki Index</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
        ul { list-style: none; padding: 0; }
        li { margin: 0.5rem 0; }
        small { color: #666; }
    </style>
</head>
<body>
    <h1>Wiki Pages</h1>
    <ul>${pageList}</ul>
</body>
</html>`;
}

// Export mode
if (exportMode) {
    console.log(`Exporting wiki to ${outputDir}...`);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    function exportDir(srcDir, destDir, prefix = '') {
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;

            const srcPath = path.join(srcDir, entry.name);

            if (entry.isDirectory()) {
                const newDestDir = path.join(destDir, entry.name);
                if (!fs.existsSync(newDestDir)) {
                    fs.mkdirSync(newDestDir, { recursive: true });
                }
                exportDir(srcPath, newDestDir, prefix + entry.name + '/');
            } else if (entry.name.endsWith('.md')) {
                const slug = prefix + entry.name.replace('.md', '');
                const html = renderPage(slug);
                if (html) {
                    const destPath = path.join(destDir, entry.name.replace('.md', '.html'));
                    fs.writeFileSync(destPath, html);
                    console.log(`  ${slug}.html`);
                }
            } else {
                // Copy non-markdown files as-is
                const destPath = path.join(destDir, entry.name);
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    exportDir(wikiDir, outputDir);

    // Write index
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderIndex());
    console.log('  index.html');

    console.log('Export complete!');
    process.exit(0);
}

// Server mode
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    let pathname = url.pathname;

    // Remove leading slash
    if (pathname.startsWith('/')) {
        pathname = pathname.slice(1);
    }

    // Default to overview
    if (!pathname || pathname === '') {
        pathname = 'overview';
    }

    // Handle static files (llms.txt, etc.)
    const staticPath = path.join(wikiDir, pathname);
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
        const content = fs.readFileSync(staticPath, 'utf-8');
        const ext = path.extname(pathname);
        const contentType = ext === '.txt' ? 'text/plain' :
                           ext === '.json' ? 'application/json' :
                           'text/plain';
        res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
        res.end(content);
        return;
    }

    // Handle index page
    if (pathname === 'index' || pathname === '_index') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderIndex());
        return;
    }

    // Handle wiki pages
    const html = renderPage(pathname);
    if (html) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Page not found');
    }
});

server.listen(port, () => {
    console.log(`Wiki server running at http://localhost:${port}`);
    console.log(`Wiki directory: ${wikiDir}`);
    console.log('');
    console.log('Pages:');
    console.log(`  http://localhost:${port}/overview`);
    console.log(`  http://localhost:${port}/index (page list)`);
    console.log(`  http://localhost:${port}/llms.txt`);
    console.log('');
    console.log('Press Ctrl+C to stop');
});
