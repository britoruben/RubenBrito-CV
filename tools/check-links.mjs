#!/usr/bin/env node
/**
 * Link checker for the generated pages.
 *
 * The site is generated, so a template bug can break every link at once and
 * still look fine in a diff. Internal targets are authoritative: a relative
 * path that does not resolve to a file, or a #fragment with no matching id,
 * fails the run.
 *
 * External links are only checked with --external, and never fail the run:
 * sites bot-block CI runners (LinkedIn answers 999, GitHub sometimes 403),
 * so treating them as errors would mean a check that cries wolf.
 *
 * Usage:
 *   node tools/check-links.mjs             internal links only
 *   node tools/check-links.mjs --external  also probe external URLs (warn only)
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkExternal = process.argv.includes('--external');

const PAGES = ['docs/index.html', 'docs/es/index.html'];

/** Strip <script> and <style> bodies: they contain runtime-built URLs
 *  (e.g. 'href="' + repo.html_url + '"') that are not real links. */
function stripCode(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
}

function attrValues(html, attr) {
  const re = new RegExp(`\\s${attr}\\s*=\\s*"([^"]*)"`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

function idsIn(html) {
  return new Set(attrValues(html, 'id'));
}

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { method, redirect: 'follow', signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) return { ok: true, status: res.status };
      if (method === 'GET') return { ok: false, status: res.status };
    } catch (err) {
      if (method === 'GET') return { ok: false, status: err.name === 'AbortError' ? 'timeout' : 'unreachable' };
    }
  }
  return { ok: false, status: 'unknown' };
}

const errors = [];
const warnings = [];
let checked = 0;

for (const page of PAGES) {
  const abs = resolve(root, page);
  if (!existsSync(abs)) {
    errors.push(`${page}: page missing - run \`npm run build\``);
    continue;
  }
  const raw = readFileSync(abs, 'utf8');
  const html = stripCode(raw);
  const ids = idsIn(raw);
  const pageDir = dirname(abs);
  const targets = [...attrValues(html, 'href'), ...attrValues(html, 'src')];

  for (const target of targets) {
    if (!target || target.startsWith('data:') || target.startsWith('mailto:')) continue;
    checked++;

    if (target.startsWith('#')) {
      const id = target.slice(1);
      if (id && !ids.has(id)) errors.push(`${page}: anchor ${target} has no matching id`);
      continue;
    }

    if (/^https?:\/\//i.test(target)) {
      if (!checkExternal) continue;
      const { ok, status } = await probe(target);
      if (!ok) warnings.push(`${page}: ${target} -> ${status}`);
      continue;
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue; // other schemes

    const [path] = target.split(/[?#]/);
    const candidate = path.endsWith('/') ? join(pageDir, path, 'index.html') : join(pageDir, path);
    if (!existsSync(candidate)) errors.push(`${page}: ${target} does not resolve (${candidate.replace(root + '/', '')})`);
  }
}

console.log(`Checked ${checked} links across ${PAGES.length} pages.`);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} broken internal link(s).`);
  process.exit(1);
}
console.log(warnings.length ? `\nOK (${warnings.length} external warning(s), not fatal).` : '\nOK.');
