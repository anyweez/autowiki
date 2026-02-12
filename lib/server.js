'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { scanWikiDir, parseFrontmatter } = require('./scanner');
const { createRenderer } = require('./renderer');
const { renderPage, render404 } = require('./template');

function startServer(wikiDir, port, autoOpen) {
  let scanResult = scanWikiDir(wikiDir);
  let renderer = createRenderer(scanResult.titleToSlug);
  const pageCache = new Map();

  // Watch for file changes
  try {
    fs.watch(wikiDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.md')) {
        pageCache.clear();
        scanResult = scanWikiDir(wikiDir);
        renderer = createRenderer(scanResult.titleToSlug);
      }
    });
  } catch (e) {
    // fs.watch may not be available on all platforms
  }

  function buildPage(slug) {
    if (pageCache.has(slug)) return pageCache.get(slug);

    const filePath = path.join(wikiDir, slug + '.md');
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    const htmlBody = renderer.render(body);
    const title = frontmatter.title || slug;
    const type = frontmatter.type || 'page';
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    const related = Array.isArray(frontmatter.related) ? frontmatter.related : [];

    const html = renderPage({
      title,
      type,
      tags,
      related,
      htmlBody,
      currentSlug: slug,
      pages: scanResult.pages,
      searchIndex: scanResult.searchIndex,
      wikiTitle: scanResult.wikiTitle,
      titleToSlug: scanResult.titleToSlug,
    });

    pageCache.set(slug, html);
    return html;
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    let pathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '');

    // Default to overview
    if (!pathname) pathname = 'overview';

    // Ignore favicon requests
    if (pathname === 'favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Serve static files (llms.txt, llms-full.txt, etc.)
    const staticPath = path.join(wikiDir, pathname);
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile() && !pathname.endsWith('.md')) {
      const ext = path.extname(pathname);
      const types = { '.txt': 'text/plain', '.json': 'application/json', '.xml': 'text/xml' };
      res.writeHead(200, { 'Content-Type': (types[ext] || 'text/plain') + '; charset=utf-8' });
      res.end(fs.readFileSync(staticPath, 'utf-8'));
      return;
    }

    // Render wiki page
    const html = buildPage(pathname);
    if (html) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(render404(scanResult.wikiTitle, scanResult.pages, scanResult.searchIndex, scanResult.titleToSlug));
    }
  });

  server.listen(port, () => {
    console.log('');
    console.log(`  Wiki server running at http://localhost:${port}`);
    console.log(`  Wiki directory: ${wikiDir}`);
    console.log(`  Pages: ${scanResult.pages.length}`);
    console.log('');
    console.log('  Press Ctrl+C to stop');
    console.log('');

    if (autoOpen) {
      const cmd = process.platform === 'darwin' ? 'open'
        : process.platform === 'win32' ? 'start' : 'xdg-open';
      require('child_process').exec(`${cmd} http://localhost:${port}`);
    }
  });
}

function exportSite(wikiDir, outputDir) {
  const scanResult = scanWikiDir(wikiDir);
  const renderer = createRenderer(scanResult.titleToSlug);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Exporting wiki to ${outputDir}...`);

  for (const page of scanResult.pages) {
    const filePath = path.join(wikiDir, page.slug + '.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    const htmlBody = renderer.render(body);

    const html = renderPage({
      title: page.title,
      type: page.type,
      tags: page.tags,
      related: page.related,
      htmlBody,
      currentSlug: page.slug,
      pages: scanResult.pages,
      searchIndex: scanResult.searchIndex,
      wikiTitle: scanResult.wikiTitle,
      titleToSlug: scanResult.titleToSlug,
      exportMode: true,
    });

    const outPath = path.join(outputDir, page.slug + '.html');
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outPath, html);
    console.log(`  ${page.slug}.html`);
  }

  // Copy static files
  const staticFiles = ['llms.txt', 'llms-full.txt'];
  for (const file of staticFiles) {
    const src = path.join(wikiDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outputDir, file));
      console.log(`  ${file}`);
    }
  }

  // Create index.html redirect
  fs.writeFileSync(
    path.join(outputDir, 'index.html'),
    '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=overview.html"></head></html>\n'
  );
  console.log('  index.html');
  console.log('');
  console.log('Export complete!');
}

module.exports = { startServer, exportSite };
