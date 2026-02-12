'use strict';

const fs = require('fs');
const path = require('path');

function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { frontmatter: {}, body: content };
  }

  const lines = content.split('\n');
  let endLine = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endLine = i;
      break;
    }
  }

  if (endLine === -1) {
    return { frontmatter: {}, body: content };
  }

  const yamlLines = lines.slice(1, endLine);
  const body = lines.slice(endLine + 1).join('\n').trim();
  const frontmatter = {};
  let currentKey = null;
  let arrayMode = false;

  for (const line of yamlLines) {
    // Multi-line array item: "  - value"
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && currentKey && arrayMode) {
      if (!Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey] = [];
      }
      let val = arrayItem[1].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      frontmatter[currentKey].push(val);
      continue;
    }

    // Key: value pair
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      let value = kv[2].trim();

      if (!value) {
        arrayMode = true;
        frontmatter[currentKey] = [];
        continue;
      }

      arrayMode = false;

      // Inline array: [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[currentKey] = value.slice(1, -1)
          .split(',')
          .map(s => {
            s = s.trim();
            if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
              s = s.slice(1, -1);
            }
            return s;
          })
          .filter(Boolean);
        continue;
      }

      // Scalar value
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[currentKey] = value;
    }
  }

  return { frontmatter, body };
}

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, d) => d || t)
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/\|[^|\n]+/g, '')
    .replace(/[-=]{3,}/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scanWikiDir(wikiDir) {
  const pages = [];
  const titleToSlug = {};

  // Try to load .index.json for aliases
  let indexData = null;
  const indexPath = path.join(wikiDir, '.index.json');
  if (fs.existsSync(indexPath)) {
    try {
      indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Scan directory recursively
  function scan(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath, prefix + entry.name + '/');
      } else if (entry.name.endsWith('.md')) {
        const slug = prefix + entry.name.replace(/\.md$/, '');
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { frontmatter, body } = parseFrontmatter(content);
        const title = frontmatter.title || slug;
        const type = frontmatter.type || 'page';
        const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
        const related = Array.isArray(frontmatter.related) ? frontmatter.related : [];
        const excerpt = stripMarkdown(body).slice(0, 300);

        pages.push({ slug, title, type, tags, related, excerpt });

        // Build title-to-slug map
        titleToSlug[title.toLowerCase()] = slug;
        titleToSlug[slug.toLowerCase()] = slug;

        // Add aliases from index
        if (indexData && indexData.pages && indexData.pages[slug]) {
          const aliases = indexData.pages[slug].aliases || [];
          for (const alias of aliases) {
            titleToSlug[alias.toLowerCase()] = slug;
          }
        }
      }
    }
  }

  scan(wikiDir, '');

  // Sort pages: overview first, then alphabetically by title
  pages.sort((a, b) => {
    if (a.type === 'overview') return -1;
    if (b.type === 'overview') return 1;
    return a.title.localeCompare(b.title);
  });

  // Build search index
  const searchIndex = pages.map(p => ({
    s: p.slug,
    t: p.title,
    y: p.type,
    x: p.excerpt,
  }));

  // Determine wiki title (from overview page or fallback)
  const overviewPage = pages.find(p => p.type === 'overview');
  const wikiTitle = overviewPage ? overviewPage.title : 'Wiki';

  return { pages, titleToSlug, searchIndex, wikiTitle };
}

module.exports = { scanWikiDir, parseFrontmatter };
