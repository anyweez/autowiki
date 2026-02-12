'use strict';

const KEYWORDS = {
  js: new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
    'extends', 'import', 'export', 'default', 'from', 'async', 'await', 'try',
    'catch', 'throw', 'finally', 'typeof', 'instanceof', 'in', 'of', 'yield',
    'delete', 'void', 'null', 'undefined', 'true', 'false', 'super', 'static',
    'get', 'set', 'require', 'module',
  ]),
  py: new Set([
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break',
    'continue', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise',
    'with', 'yield', 'lambda', 'pass', 'del', 'and', 'or', 'not', 'in', 'is',
    'None', 'True', 'False', 'self', 'print', 'global', 'nonlocal', 'assert',
    'async', 'await',
  ]),
  sh: new Set([
    'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case',
    'esac', 'function', 'return', 'exit', 'echo', 'export', 'local', 'readonly',
    'declare', 'set', 'unset', 'source', 'true', 'false',
  ]),
};

const LANG_MAP = {
  javascript: 'js', js: 'js', jsx: 'js', ts: 'js', tsx: 'js',
  typescript: 'js', mjs: 'js', cjs: 'js',
  python: 'py', py: 'py',
  bash: 'sh', sh: 'sh', shell: 'sh', zsh: 'sh',
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(code, lang) {
  const escaped = escapeHtml(code);
  if (!lang) return escaped;

  const langKey = LANG_MAP[lang.toLowerCase()];
  if (!langKey) return escaped;

  const kw = KEYWORDS[langKey];
  const placeholders = [];

  // Build regex for strings and comments (language-aware)
  const parts = [];
  if (langKey === 'py' || langKey === 'sh') {
    parts.push('#.*$');
  } else {
    parts.push('\\/\\/.*$', '\\/\\*[\\s\\S]*?\\*\\/');
  }
  parts.push('"(?:[^"\\\\]|\\\\.)*"', "'(?:[^'\\\\]|\\\\.)*'");
  if (langKey === 'js') parts.push('`(?:[^`\\\\]|\\\\.)*`');

  const tokenRe = new RegExp('(' + parts.join('|') + ')', 'gm');

  let result = escaped;

  // Step 1: Extract strings and comments into placeholders
  result = result.replace(tokenRe, (m) => {
    const idx = placeholders.length;
    const isComment = m.startsWith('//') || m.startsWith('#') || m.startsWith('/*');
    const cls = isComment ? 'hl-cm' : 'hl-st';
    placeholders.push('<span class="' + cls + '">' + m + '</span>');
    return '\x00P' + idx + '\x00';
  });

  // Step 2: Highlight keywords
  result = result.replace(/\b([a-zA-Z_]\w*)\b/g, (m) => {
    return kw.has(m) ? '<span class="hl-kw">' + m + '</span>' : m;
  });

  // Step 3: Highlight numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-nu">$1</span>');

  // Step 4: Restore placeholders
  result = result.replace(/\x00P(\d+)\x00/g, (_, idx) => placeholders[parseInt(idx)]);

  return result;
}

module.exports = { highlight };
