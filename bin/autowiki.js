#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse CLI arguments
const args = process.argv.slice(2);
const opts = {
  port: 3000,
  wikiDir: null,
  export: false,
  output: 'wiki-html',
  open: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--port':
      opts.port = parseInt(args[++i], 10);
      if (isNaN(opts.port)) {
        console.error('Error: --port requires a number');
        process.exit(1);
      }
      break;
    case '--wiki-dir':
      opts.wikiDir = args[++i];
      break;
    case '--export':
      opts.export = true;
      break;
    case '--output':
      opts.output = args[++i];
      break;
    case '--open':
      opts.open = true;
      break;
    case '--help':
    case '-h':
      console.log(`Usage: autowiki [options]

Options:
  --port <number>     Port to listen on (default: 3000)
  --wiki-dir <path>   Wiki directory (default: auto-detect from git root)
  --export            Export static HTML instead of starting server
  --output <path>     Output directory for export (default: wiki-html/)
  --open              Auto-open browser after starting server
  -h, --help          Show this help message
`);
      process.exit(0);
    default:
      console.error(`Unknown option: ${args[i]}`);
      process.exit(1);
  }
}

// Auto-detect wiki directory
if (!opts.wikiDir) {
  let root;
  try {
    root = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    root = process.cwd();
  }
  opts.wikiDir = path.join(root, 'wiki');
}

// Resolve to absolute path
opts.wikiDir = path.resolve(opts.wikiDir);

// Verify wiki directory exists
if (!fs.existsSync(opts.wikiDir)) {
  console.error(`Error: Wiki directory not found: ${opts.wikiDir}`);
  console.error('Run this command from a repo with a wiki/ directory, or use --wiki-dir');
  process.exit(1);
}

// Start server or export
if (opts.export) {
  const { exportSite } = require('../lib/server');
  exportSite(opts.wikiDir, path.resolve(opts.output));
} else {
  const { startServer } = require('../lib/server');
  startServer(opts.wikiDir, opts.port, opts.open);
}
