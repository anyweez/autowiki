'use strict';

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const TYPE_ORDER = ['overview', 'concept', 'guide', 'reference'];
const TYPE_LABELS = {
  overview: 'Overview',
  concept: 'Concepts',
  guide: 'Guides',
  reference: 'Reference',
};

function groupPages(pages) {
  const groups = {};
  for (const page of pages) {
    const type = TYPE_ORDER.includes(page.type) ? page.type : 'reference';
    if (!groups[type]) groups[type] = [];
    groups[type].push(page);
  }
  return TYPE_ORDER.filter(t => groups[t]).map(t => ({
    label: TYPE_LABELS[t],
    type: t,
    pages: groups[t],
  }));
}

function renderRelated(related, titleToSlug, linkSuffix) {
  if (!related || !related.length) return '';

  const links = related.map(r => {
    const match = r.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (match) {
      const target = match[1];
      const display = match[2] || target;
      const slug = titleToSlug[target.toLowerCase()] || target.toLowerCase().replace(/\s+/g, '-');
      return '<a href="/' + slug + linkSuffix + '" class="related-link">' + escapeHtml(display) + '</a>';
    }
    return '<span>' + escapeHtml(r) + '</span>';
  });

  return `
      <div class="related-pages">
        <h3>Related Pages</h3>
        <div class="related-links">${links.join('')}</div>
      </div>`;
}

function renderSidebar(groups, currentSlug, linkSuffix) {
  let html = '';
  for (const group of groups) {
    html += '<div class="nav-group">';
    html += '<div class="nav-group-title">' + group.label + '</div>';
    for (const page of group.pages) {
      const active = page.slug === currentSlug ? ' active' : '';
      html += '<a href="/' + page.slug + linkSuffix + '" class="nav-link' + active + '">' + escapeHtml(page.title) + '</a>';
    }
    html += '</div>';
  }
  return html;
}

function renderPage({ title, type, tags, related, htmlBody, currentSlug, pages, searchIndex, wikiTitle, titleToSlug, exportMode }) {
  const linkSuffix = exportMode ? '.html' : '';
  const groups = groupPages(pages);
  const sidebar = renderSidebar(groups, currentSlug, linkSuffix);
  const relatedHtml = renderRelated(related, titleToSlug, linkSuffix);
  const tagsHtml = tags.length
    ? tags.map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join('')
    : '';
  const typeBadge = type ? '<span class="type-badge type-' + type + '">' + type + '</span>' : '';
  const searchJson = JSON.stringify(searchIndex).replace(/<\//g, '<\\/');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} - ${escapeHtml(wikiTitle)}</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #ffffff;
  --fg: #1e293b;
  --fg-secondary: #64748b;
  --sidebar-bg: #f8fafc;
  --sidebar-border: #e2e8f0;
  --link: #2563eb;
  --link-hover: #1d4ed8;
  --code-bg: #f1f5f9;
  --code-border: #e2e8f0;
  --border: #e2e8f0;
  --hover-bg: #f1f5f9;
  --active-bg: #e0e7ff;
  --active-text: #3730a3;
  --badge-overview: #059669;
  --badge-concept: #7c3aed;
  --badge-guide: #d97706;
  --badge-reference: #0891b2;
  --search-bg: #ffffff;
  --search-shadow: 0 4px 12px rgba(0,0,0,0.1);
  --hl-kw: #7c3aed;
  --hl-st: #059669;
  --hl-cm: #6b7280;
  --hl-nu: #d97706;
  --tag-bg: #f1f5f9;
  --tag-text: #475569;
  --related-bg: #f8fafc;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --fg: #e2e8f0;
    --fg-secondary: #94a3b8;
    --sidebar-bg: #1e293b;
    --sidebar-border: #334155;
    --link: #60a5fa;
    --link-hover: #93bbfd;
    --code-bg: #1e293b;
    --code-border: #334155;
    --border: #334155;
    --hover-bg: #334155;
    --active-bg: #312e81;
    --active-text: #a5b4fc;
    --badge-overview: #34d399;
    --badge-concept: #a78bfa;
    --badge-guide: #fbbf24;
    --badge-reference: #22d3ee;
    --search-bg: #1e293b;
    --search-shadow: 0 4px 12px rgba(0,0,0,0.4);
    --hl-kw: #a78bfa;
    --hl-st: #34d399;
    --hl-cm: #9ca3af;
    --hl-nu: #fbbf24;
    --tag-bg: #334155;
    --tag-text: #cbd5e1;
    --related-bg: #1e293b;
  }
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.7;
  min-height: 100vh;
}

.layout { display: flex; min-height: 100vh; }

/* Sidebar */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  padding: 1.5rem 0;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  overflow-y: auto;
  z-index: 100;
}

.sidebar-header {
  padding: 0 1.25rem 1.25rem;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 0.75rem;
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--fg);
  text-decoration: none;
  display: block;
  margin-bottom: 1rem;
}

.sidebar-title:hover { opacity: 0.8; }

/* Search */
.search-container { position: relative; }

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  padding-right: 3.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--fg);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: var(--link);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-kbd {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  color: var(--fg-secondary);
  background: var(--hover-bg);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  border: 1px solid var(--border);
  pointer-events: none;
}

.search-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--search-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: var(--search-shadow);
  max-height: 320px;
  overflow-y: auto;
  display: none;
  z-index: 200;
}

.search-results.open { display: block; }

.search-result {
  display: block;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
  color: var(--fg);
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
}

.search-result:last-child { border-bottom: none; }

.search-result:hover,
.search-result.focused { background: var(--hover-bg); }

.search-result-title { font-weight: 600; }

.search-result-type {
  font-size: 0.75rem;
  color: var(--fg-secondary);
  margin-left: 0.5rem;
}

.search-result-excerpt {
  font-size: 0.78rem;
  color: var(--fg-secondary);
  margin-top: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Navigation */
.nav-group { margin-bottom: 0.5rem; }

.nav-group-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fg-secondary);
  padding: 0.5rem 1.25rem 0.25rem;
}

.nav-link {
  display: block;
  padding: 0.3rem 1.25rem 0.3rem 1.75rem;
  color: var(--fg);
  text-decoration: none;
  font-size: 0.875rem;
  border-left: 2px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}

.nav-link:hover { background: var(--hover-bg); }

.nav-link.active {
  background: var(--active-bg);
  color: var(--active-text);
  border-left-color: var(--link);
  font-weight: 600;
}

/* Main Content */
.main {
  flex: 1;
  margin-left: 280px;
  padding: 2.5rem;
  max-width: calc(740px + 5rem);
}

.page-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  color: white;
}

.type-overview { background: var(--badge-overview); }
.type-concept { background: var(--badge-concept); }
.type-guide { background: var(--badge-guide); }
.type-reference { background: var(--badge-reference); }
.type-page { background: var(--fg-secondary); }

.tag {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  background: var(--tag-bg);
  color: var(--tag-text);
  border-radius: 4px;
}

/* Article */
article h1 { font-size: 1.875rem; margin-top: 0; margin-bottom: 1rem; line-height: 1.3; }
article h2 { font-size: 1.375rem; margin-top: 2.5rem; margin-bottom: 0.75rem; padding-bottom: 0.3rem; border-bottom: 1px solid var(--border); }
article h3 { font-size: 1.125rem; margin-top: 2rem; margin-bottom: 0.5rem; }
article h4 { font-size: 1rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
article p { margin-bottom: 1rem; }
article ul, article ol { margin-bottom: 1rem; padding-left: 1.5rem; }
article li { margin-bottom: 0.25rem; }
article li > ul, article li > ol { margin-bottom: 0; }
article a { color: var(--link); text-decoration: none; }
article a:hover { color: var(--link-hover); text-decoration: underline; }

article a.wikilink {
  text-decoration: none;
  border-bottom: 1px dashed var(--link);
  padding-bottom: 1px;
}

article a.wikilink:hover { border-bottom-style: solid; }

article code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.875em;
  background: var(--code-bg);
  padding: 0.15em 0.35em;
  border-radius: 4px;
  border: 1px solid var(--code-border);
}

article pre {
  background: var(--code-bg);
  border: 1px solid var(--code-border);
  border-radius: 6px;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  line-height: 1.5;
}

article pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8125rem;
}

.hl-kw { color: var(--hl-kw); font-weight: 600; }
.hl-st { color: var(--hl-st); }
.hl-cm { color: var(--hl-cm); font-style: italic; }
.hl-nu { color: var(--hl-nu); }

article table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

article th, article td {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  text-align: left;
}

article th { background: var(--code-bg); font-weight: 600; }

article blockquote {
  border-left: 3px solid var(--link);
  padding: 0.5rem 1rem;
  margin: 0 0 1rem;
  color: var(--fg-secondary);
  background: var(--code-bg);
  border-radius: 0 6px 6px 0;
}

article img { max-width: 100%; height: auto; }
article hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }

/* Related Pages */
.related-pages {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.related-pages h3 {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fg-secondary);
  margin-bottom: 0.75rem;
}

.related-links { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.related-link {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  background: var(--related-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--link);
  text-decoration: none;
  font-size: 0.875rem;
  transition: background 0.1s;
}

.related-link:hover { background: var(--hover-bg); }

/* Hamburger */
.hamburger {
  display: none;
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 300;
  background: var(--sidebar-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--fg);
  font-size: 1.25rem;
  line-height: 1;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 90;
}

@media (max-width: 768px) {
  .hamburger { display: flex; }
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar-overlay.open { display: block; }
  .main {
    margin-left: 0;
    padding: 1.5rem;
    padding-top: 4rem;
  }
}
</style>
</head>
<body>
  <button class="hamburger" id="hamburger" aria-label="Toggle navigation">&#9776;</button>
  <div class="sidebar-overlay" id="overlay"></div>
  <div class="layout">
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a href="/overview${linkSuffix}" class="sidebar-title">${escapeHtml(wikiTitle)}</a>
        <div class="search-container">
          <input type="text" class="search-input" id="searchInput" placeholder="Search pages..." autocomplete="off">
          <span class="search-kbd" id="searchKbd"></span>
          <div class="search-results" id="searchResults"></div>
        </div>
      </div>
      ${sidebar}
    </nav>
    <main class="main">
      <div class="page-meta">
        ${typeBadge}
        ${tagsHtml}
      </div>
      <article>
        ${htmlBody}
      </article>
      ${relatedHtml}
    </main>
  </div>
<script>
(function() {
  var SEARCH_INDEX = ${searchJson};
  var LINK_SUFFIX = '${linkSuffix}';
  var isMac = navigator.platform.indexOf('Mac') > -1;
  document.getElementById('searchKbd').textContent = isMac ? '\\u2318K' : 'Ctrl+K';

  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  var focusedIdx = -1;

  function score(query, entry) {
    var q = query.toLowerCase();
    var t = entry.t.toLowerCase();
    var x = entry.x.toLowerCase();
    var s = 0;
    if (t === q) s += 100;
    else if (t.startsWith(q)) s += 50;
    else if (t.indexOf(q) > -1) s += 30;
    var terms = q.split(/\\s+/);
    for (var i = 0; i < terms.length; i++) {
      if (terms[i] && t.indexOf(terms[i]) > -1) s += 20;
      if (terms[i] && x.indexOf(terms[i]) > -1) s += 5;
    }
    return s;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function search(query) {
    if (!query.trim()) { close(); return; }
    var scored = [];
    for (var i = 0; i < SEARCH_INDEX.length; i++) {
      var s = score(query, SEARCH_INDEX[i]);
      if (s > 0) scored.push({ entry: SEARCH_INDEX[i], score: s });
    }
    scored.sort(function(a, b) { return b.score - a.score; });
    var top = scored.slice(0, 8);
    if (top.length === 0) {
      results.innerHTML = '<div class="search-result"><span class="search-result-title">No results</span></div>';
      results.classList.add('open');
      focusedIdx = -1;
      return;
    }
    results.innerHTML = top.map(function(r, idx) {
      var excerpt = r.entry.x.length > 80 ? r.entry.x.slice(0, 80) + '...' : r.entry.x;
      return '<a href="/' + r.entry.s + LINK_SUFFIX + '" class="search-result" data-idx="' + idx + '">'
        + '<div><span class="search-result-title">' + esc(r.entry.t) + '</span>'
        + '<span class="search-result-type">' + r.entry.y + '</span></div>'
        + '<div class="search-result-excerpt">' + esc(excerpt) + '</div></a>';
    }).join('');
    results.classList.add('open');
    focusedIdx = -1;
  }

  function close() {
    results.classList.remove('open');
    focusedIdx = -1;
  }

  function updateFocus() {
    var items = results.querySelectorAll('.search-result[data-idx]');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('focused', i === focusedIdx);
    }
  }

  input.addEventListener('input', function() { search(this.value); });
  input.addEventListener('focus', function() { if (this.value.trim()) search(this.value); });

  input.addEventListener('keydown', function(e) {
    var items = results.querySelectorAll('.search-result[data-idx]');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedIdx = Math.min(focusedIdx + 1, items.length - 1);
      updateFocus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedIdx = Math.max(focusedIdx - 1, 0);
      updateFocus();
    } else if (e.key === 'Enter' && focusedIdx >= 0 && items[focusedIdx]) {
      e.preventDefault();
      items[focusedIdx].click();
    } else if (e.key === 'Escape') {
      close();
      input.blur();
    }
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-container')) close();
  });

  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  // Mobile hamburger
  var hamburger = document.getElementById('hamburger');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('overlay');

  hamburger.addEventListener('click', function() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay.addEventListener('click', function() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
})();
</script>
</body>
</html>`;
}

function render404(wikiTitle, pages, searchIndex, titleToSlug) {
  return renderPage({
    title: 'Page Not Found',
    type: '',
    tags: [],
    related: [],
    htmlBody: '<h1>Page Not Found</h1><p>The page you requested does not exist.</p><p><a href="/overview">Go to the home page</a></p>',
    currentSlug: '',
    pages,
    searchIndex,
    wikiTitle,
    titleToSlug: titleToSlug || {},
  });
}

module.exports = { renderPage, render404 };
