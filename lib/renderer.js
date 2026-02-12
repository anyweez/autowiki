'use strict';

const { highlight } = require('./highlight');

function createRenderer(titleToSlug) {
  let MarkdownIt;
  try {
    MarkdownIt = require('markdown-it');
  } catch (e) {
    console.error('Error: markdown-it is required. Run: npm install');
    process.exit(1);
  }

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(str, lang) {
      return highlight(str, lang);
    },
  });

  // Try to load wikilinks plugin
  try {
    const wikilinks = require('markdown-it-wikilinks')({
      baseURL: '/',
      relativeBaseURL: '',
      makeAllLinksAbsolute: true,
      uriSuffix: '',
      htmlAttributes: { class: 'wikilink' },
      generatePageNameFromLabel(label) {
        const lower = label.toLowerCase();
        if (titleToSlug[lower]) return titleToSlug[lower];
        return lower.replace(/\s+/g, '-');
      },
    });
    md.use(wikilinks);
  } catch (e) {
    // Wikilinks plugin not available
  }

  return {
    render(markdown) {
      return md.render(markdown);
    },
  };
}

module.exports = { createRenderer };
