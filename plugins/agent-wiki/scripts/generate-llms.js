#!/usr/bin/env node
'use strict';

/**
 * Generate llms.txt and llms-full.txt from wiki pages.
 *
 * llms.txt - Index file with links to all wiki pages
 * llms-full.txt - Complete content dump for AI context
 *
 * Usage:
 *   node scripts/generate-llms.js [--wiki-dir wiki/]
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
let wikiDir = 'wiki';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--wiki-dir' && args[i + 1]) {
    wikiDir = args[++i];
  }
}

// Reuse the scanner's frontmatter parser if available, otherwise inline a minimal one
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

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[currentKey] = value;
    }
  }

  return { frontmatter, body };
}

function getFirstParagraph(body) {
  const lines = body.split('\n');
  const paragraphLines = [];
  let inParagraph = false;

  for (const line of lines) {
    const stripped = line.trim();

    if (stripped.startsWith('#')) {
      if (inParagraph) break;
      continue;
    }

    if (!stripped) {
      if (inParagraph) break;
      continue;
    }

    if (stripped.startsWith('```')) {
      if (inParagraph) break;
      continue;
    }

    inParagraph = true;
    paragraphLines.push(stripped);
  }

  let description = paragraphLines.join(' ');
  if (description.length > 200) {
    description = description.slice(0, 197) + '...';
  }
  return description;
}

function collectWikiPages(dir, base) {
  const pages = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      pages.push(...collectWikiPages(fullPath, base));
    } else if (entry.name.endsWith('.md')) {
      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf-8');
      } catch (e) {
        console.log(`Warning: Could not read ${fullPath}: ${e.message}`);
        continue;
      }

      const { frontmatter, body } = parseFrontmatter(content);
      const relPath = path.relative(base, fullPath);
      const title = frontmatter.title || entry.name.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const type = frontmatter.type || 'concept';
      const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
      const description = getFirstParagraph(body);

      pages.push({ path: relPath, title, type, tags, description, content });
    }
  }

  return pages;
}

function getRepoName(wikiDirPath) {
  const parentDir = path.dirname(path.resolve(wikiDirPath));

  // Check package.json
  const pkgPath = path.join(parentDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (data.name) return data.name;
    } catch (e) { /* ignore */ }
  }

  // Check pyproject.toml
  const pyprojectPath = path.join(parentDir, 'pyproject.toml');
  if (fs.existsSync(pyprojectPath)) {
    try {
      const content = fs.readFileSync(pyprojectPath, 'utf-8');
      const match = content.match(/name\s*=\s*["']([^"']+)["']/);
      if (match) return match[1];
    } catch (e) { /* ignore */ }
  }

  // Fall back to directory name
  return path.basename(parentDir);
}

function generateLlmsTxt(pages, wikiDirPath, repoName) {
  const lines = [
    `# ${repoName} Wiki`,
    '',
    '> Agent-maintained documentation for understanding this codebase.',
    '',
    '## Quick Start',
    '',
    'This wiki is designed for AI agents working with this codebase. Start with the overview page for a high-level understanding, then explore specific concepts as needed.',
    '',
  ];

  const byType = {};
  for (const page of pages) {
    if (!byType[page.type]) byType[page.type] = [];
    byType[page.type].push(page);
  }

  const typeOrder = ['overview', 'concept', 'guide', 'reference'];
  const typeLabels = { overview: 'Overview', concept: 'Concepts', guide: 'Guides', reference: 'Reference' };

  for (const type of typeOrder) {
    if (!byType[type]) continue;
    const typePages = byType[type].sort((a, b) => a.title.localeCompare(b.title));
    lines.push(`## ${typeLabels[type] || type}`);
    lines.push('');
    for (const page of typePages) {
      const desc = page.description || 'No description available.';
      lines.push(`- [${page.title}](wiki/${page.path}): ${desc}`);
    }
    lines.push('');
  }

  // Any remaining types
  for (const [type, typePages] of Object.entries(byType)) {
    if (typeOrder.includes(type)) continue;
    typePages.sort((a, b) => a.title.localeCompare(b.title));
    lines.push(`## ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    lines.push('');
    for (const page of typePages) {
      const desc = page.description || 'No description available.';
      lines.push(`- [${page.title}](wiki/${page.path}): ${desc}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateLlmsFullTxt(pages, repoName) {
  const lines = [
    `# ${repoName} Wiki - Complete Content`,
    '',
    'This file contains the complete content of all wiki pages for AI context.',
    '',
    '='.repeat(80),
    '',
  ];

  const sorted = pages.slice().sort((a, b) => {
    if (a.type === 'overview') return -1;
    if (b.type === 'overview') return 1;
    return a.title.localeCompare(b.title);
  });

  for (const page of sorted) {
    lines.push(`FILE: wiki/${page.path}`);
    lines.push('-'.repeat(40));
    lines.push(page.content);
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('');
  }

  return lines.join('\n');
}

// Main
const resolvedDir = path.resolve(wikiDir);

if (!fs.existsSync(resolvedDir)) {
  console.error(`Error: Wiki directory '${wikiDir}' does not exist`);
  process.exit(1);
}

console.log(`Scanning wiki directory: ${wikiDir}`);
const pages = collectWikiPages(resolvedDir, resolvedDir);

if (pages.length === 0) {
  console.error('Warning: No wiki pages found');
  process.exit(1);
}

console.log(`Found ${pages.length} wiki pages`);

const repoName = getRepoName(resolvedDir);
console.log(`Repository name: ${repoName}`);

const llmsTxt = generateLlmsTxt(pages, resolvedDir, repoName);
const llmsPath = path.join(resolvedDir, 'llms.txt');
fs.writeFileSync(llmsPath, llmsTxt, 'utf-8');
console.log(`Generated: ${llmsPath}`);

const llmsFullTxt = generateLlmsFullTxt(pages, repoName);
const llmsFullPath = path.join(resolvedDir, 'llms-full.txt');
fs.writeFileSync(llmsFullPath, llmsFullTxt, 'utf-8');
console.log(`Generated: ${llmsFullPath}`);

console.log('Done!');
