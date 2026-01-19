#!/usr/bin/env python3
"""
Generate llms.txt and llms-full.txt from wiki pages.

llms.txt - Index file with links to all wiki pages
llms-full.txt - Complete content dump for AI context

Usage:
    python scripts/generate-llms.py [--wiki-dir wiki/]
"""

import argparse
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional
import yaml


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and body from markdown content."""
    if not content.startswith('---'):
        return {}, content

    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content

    try:
        frontmatter = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        frontmatter = {}

    body = parts[2].strip()
    return frontmatter, body


def get_first_paragraph(body: str) -> str:
    """Extract the first non-heading paragraph as description."""
    lines = body.split('\n')
    paragraph_lines = []
    in_paragraph = False

    for line in lines:
        stripped = line.strip()

        # Skip headings and empty lines before first paragraph
        if stripped.startswith('#'):
            if in_paragraph:
                break
            continue

        if not stripped:
            if in_paragraph:
                break
            continue

        # Skip code blocks
        if stripped.startswith('```'):
            if in_paragraph:
                break
            continue

        in_paragraph = True
        paragraph_lines.append(stripped)

    description = ' '.join(paragraph_lines)
    # Truncate if too long
    if len(description) > 200:
        description = description[:197] + '...'

    return description


def collect_wiki_pages(wiki_dir: Path) -> List[Dict]:
    """Collect all wiki pages with metadata."""
    pages = []

    for md_file in wiki_dir.rglob('*.md'):
        # Skip hidden files and directories
        if any(part.startswith('.') for part in md_file.parts):
            continue

        rel_path = md_file.relative_to(wiki_dir)

        try:
            content = md_file.read_text(encoding='utf-8')
        except Exception as e:
            print(f"Warning: Could not read {md_file}: {e}")
            continue

        frontmatter, body = parse_frontmatter(content)

        title = frontmatter.get('title', md_file.stem.replace('-', ' ').title())
        page_type = frontmatter.get('type', 'concept')
        tags = frontmatter.get('tags', [])
        description = get_first_paragraph(body)

        pages.append({
            'path': str(rel_path),
            'title': title,
            'type': page_type,
            'tags': tags,
            'description': description,
            'content': content,
            'frontmatter': frontmatter
        })

    return pages


def generate_llms_txt(pages: List[Dict], wiki_dir: Path, repo_name: str) -> str:
    """Generate llms.txt index content."""
    lines = [
        f"# {repo_name} Wiki",
        "",
        "> Agent-maintained documentation for understanding this codebase.",
        "",
        "## Quick Start",
        "",
        "This wiki is designed for AI agents working with this codebase. Start with the overview page for a high-level understanding, then explore specific concepts as needed.",
        "",
    ]

    # Group pages by type
    by_type: Dict[str, List[Dict]] = {}
    for page in pages:
        page_type = page['type']
        if page_type not in by_type:
            by_type[page_type] = []
        by_type[page_type].append(page)

    # Order: overview first, then concepts, guides, references
    type_order = ['overview', 'concept', 'guide', 'reference']
    type_labels = {
        'overview': 'Overview',
        'concept': 'Concepts',
        'guide': 'Guides',
        'reference': 'Reference'
    }

    for page_type in type_order:
        if page_type not in by_type:
            continue

        type_pages = sorted(by_type[page_type], key=lambda p: p['title'])
        label = type_labels.get(page_type, page_type.title())

        lines.append(f"## {label}")
        lines.append("")

        for page in type_pages:
            desc = page['description'] or "No description available."
            lines.append(f"- [{page['title']}](wiki/{page['path']}): {desc}")

        lines.append("")

    # Any remaining types
    for page_type, type_pages in by_type.items():
        if page_type in type_order:
            continue

        type_pages = sorted(type_pages, key=lambda p: p['title'])
        lines.append(f"## {page_type.title()}")
        lines.append("")

        for page in type_pages:
            desc = page['description'] or "No description available."
            lines.append(f"- [{page['title']}](wiki/{page['path']}): {desc}")

        lines.append("")

    return '\n'.join(lines)


def generate_llms_full_txt(pages: List[Dict], repo_name: str) -> str:
    """Generate llms-full.txt with complete wiki content."""
    lines = [
        f"# {repo_name} Wiki - Complete Content",
        "",
        "This file contains the complete content of all wiki pages for AI context.",
        "",
        "=" * 80,
        ""
    ]

    # Sort pages: overview first, then alphabetically
    def sort_key(page):
        if page['type'] == 'overview':
            return (0, page['title'])
        return (1, page['title'])

    sorted_pages = sorted(pages, key=sort_key)

    for page in sorted_pages:
        lines.append(f"FILE: wiki/{page['path']}")
        lines.append("-" * 40)
        lines.append(page['content'])
        lines.append("")
        lines.append("=" * 80)
        lines.append("")

    return '\n'.join(lines)


def get_repo_name(wiki_dir: Path) -> str:
    """Try to determine repository name."""
    # Check for package.json
    package_json = wiki_dir.parent / 'package.json'
    if package_json.exists():
        try:
            data = json.loads(package_json.read_text())
            if 'name' in data:
                return data['name']
        except:
            pass

    # Check for pyproject.toml
    pyproject = wiki_dir.parent / 'pyproject.toml'
    if pyproject.exists():
        try:
            content = pyproject.read_text()
            match = re.search(r'name\s*=\s*["\']([^"\']+)["\']', content)
            if match:
                return match.group(1)
        except:
            pass

    # Fall back to directory name
    return wiki_dir.parent.name


def main():
    parser = argparse.ArgumentParser(description='Generate llms.txt files from wiki')
    parser.add_argument('--wiki-dir', default='wiki', help='Path to wiki directory')
    args = parser.parse_args()

    wiki_dir = Path(args.wiki_dir)

    if not wiki_dir.exists():
        print(f"Error: Wiki directory '{wiki_dir}' does not exist")
        return 1

    print(f"Scanning wiki directory: {wiki_dir}")
    pages = collect_wiki_pages(wiki_dir)

    if not pages:
        print("Warning: No wiki pages found")
        return 1

    print(f"Found {len(pages)} wiki pages")

    repo_name = get_repo_name(wiki_dir)
    print(f"Repository name: {repo_name}")

    # Generate llms.txt
    llms_txt = generate_llms_txt(pages, wiki_dir, repo_name)
    llms_path = wiki_dir / 'llms.txt'
    llms_path.write_text(llms_txt, encoding='utf-8')
    print(f"Generated: {llms_path}")

    # Generate llms-full.txt
    llms_full_txt = generate_llms_full_txt(pages, repo_name)
    llms_full_path = wiki_dir / 'llms-full.txt'
    llms_full_path.write_text(llms_full_txt, encoding='utf-8')
    print(f"Generated: {llms_full_path}")

    print("Done!")
    return 0


if __name__ == '__main__':
    exit(main())
