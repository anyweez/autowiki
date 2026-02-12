#!/usr/bin/env node
'use strict';

/**
 * Bump the version across all package files in sync.
 *
 * Usage:
 *   node scripts/bump-version.js patch    # 1.2.1 -> 1.2.2
 *   node scripts/bump-version.js minor    # 1.2.1 -> 1.3.0
 *   node scripts/bump-version.js major    # 1.2.1 -> 2.0.0
 *   node scripts/bump-version.js 2.0.0    # set explicit version
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = [
  'package.json',
  'plugins/autowiki/package.json',
  'plugins/autowiki/.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function bumpVersion(current, type) {
  const parts = current.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error(`Invalid current version: ${current}`);
    process.exit(1);
  }

  switch (type) {
    case 'major': return `${parts[0] + 1}.0.0`;
    case 'minor': return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch': return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      // Treat as explicit version
      if (/^\d+\.\d+\.\d+$/.test(type)) return type;
      console.error(`Invalid bump type: ${type}`);
      console.error('Usage: node scripts/bump-version.js [major|minor|patch|X.Y.Z]');
      process.exit(1);
  }
}

// Parse args
const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/bump-version.js [major|minor|patch|X.Y.Z]');
  process.exit(1);
}

// Read current version from root package.json
const rootPkg = readJson(path.join(ROOT, 'package.json'));
const currentVersion = rootPkg.version;
const newVersion = bumpVersion(currentVersion, arg);

console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);
console.log('');

for (const relPath of FILES) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`  skip ${relPath} (not found)`);
    continue;
  }

  const data = readJson(filePath);
  let changed = false;

  // Update top-level version
  if (data.version) {
    data.version = newVersion;
    changed = true;
  }

  // Update nested plugin versions (marketplace.json)
  if (Array.isArray(data.plugins)) {
    for (const plugin of data.plugins) {
      if (plugin.version) {
        plugin.version = newVersion;
        changed = true;
      }
    }
  }

  if (changed) {
    writeJson(filePath, data);
    console.log(`  updated ${relPath}`);
  }
}

console.log('');
console.log(`Done! All files now at ${newVersion}`);
