#!/usr/bin/env node
/**
 * Generates docs/index.html and main.tex from content/cv.json.
 *
 * Usage:
 *   node tools/build.mjs           write the generated files
 *   node tools/build.mjs --check   fail if the committed files are stale
 *
 * The generated files are committed so GitHub Pages can serve /docs directly
 * and the LaTeX workflow can compile main.tex without a build step.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderHtml } from './render-html.mjs';
import { renderTex } from './render-tex.mjs';
import { t, period } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const p = (...parts) => resolve(root, ...parts);

const check = process.argv.includes('--check');
const cv = JSON.parse(readFileSync(p('content/cv.json'), 'utf8'));
const cvRaw = readFileSync(p('content/cv.json'), 'utf8');

// The default locale is served at the site root; every other locale gets a
// subdirectory, which needs `../` in front of every relative asset path.
const outputs = [
  ...cv.meta.locales.map((locale) => {
    const isDefault = locale === cv.meta.defaultLocale;
    return {
      file: isDefault ? 'docs/index.html' : `docs/${locale}/index.html`,
      content: renderHtml(cv, locale, isDefault ? '' : '../'),
    };
  }),
  { file: 'main.tex', content: renderTex(cv, cv.meta.defaultLocale, p('tools/preamble.tex')) },
  { file: 'docs/robots.txt', content: renderRobots(cv) },
  { file: 'docs/sitemap.xml', content: renderSitemap(cv) },
  { file: 'docs/cv.json', content: cvRaw },
  { file: 'docs/cv.txt', content: renderCvTxt(cv) },
];

function renderRobots({ meta }) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${meta.siteUrl}sitemap.xml\n`;
}

function renderSitemap({ meta }) {
  const today = '2026-09-01';
  const urls = meta.locales.map((locale) => {
    const loc = locale === meta.defaultLocale ? meta.siteUrl : `${meta.siteUrl}${locale}/`;
    const alts = meta.locales
      .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${l === meta.defaultLocale ? meta.siteUrl : `${meta.siteUrl}${l}/`}"/>`)
      .join('\n');
    return `  <url>\n    <loc>${loc}</loc>\n${alts}\n    <lastmod>${today}</lastmod>\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`
    + `${urls}\n</urlset>\n`;
}

function wrap80(text, width = 80) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line.length + 1 + w.length) > width) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

function renderCvTxt(cv) {
  const loc = 'en';
  const dl = cv.meta.defaultLocale;
  const tr = (v) => t(v, loc, dl);
  const lines = [];
  lines.push(cv.profile.name);
  lines.push(tr(cv.profile.role));
  lines.push(tr(cv.profile.location));
  lines.push('');
  lines.push(`Email: ${cv.profile.email}`);
  lines.push(`LinkedIn: ${cv.profile.links.linkedin}`);
  lines.push(`GitHub: ${cv.profile.links.github}`);
  lines.push('');
  lines.push('SUMMARY');
  lines.push(wrap80(tr(cv.summary)));
  lines.push('');
  lines.push('WORK EXPERIENCE');
  for (const role of cv.experience) {
    lines.push('');
    lines.push(`${role.company} - ${tr(role.position)}`);
    lines.push(period(role, loc, { dash: '-', separator: ' | ', defaultLocale: dl }));
    for (const b of t(role.bullets, loc, dl)) lines.push(`- ${wrap80(b, 78)}`);
    if (role.engagements) {
      for (const eng of role.engagements) {
        lines.push('');
        lines.push(`  Client: ${eng.client} (${tr(eng.start)} - ${tr(eng.end)})`);
        for (const b of t(eng.bullets, loc, dl)) lines.push(`  - ${wrap80(b, 76)}`);
      }
    }
  }
  lines.push('');
  lines.push('EDUCATION');
  for (const edu of cv.education) {
    lines.push('');
    lines.push(`${edu.school} (${edu.start} - ${edu.end})`);
    lines.push(tr(edu.qualification));
  }
  lines.push('');
  lines.push('LANGUAGES');
  for (const l of cv.languages) lines.push(`${tr(l.name)}: ${tr(l.level)}`);
  lines.push('');
  lines.push('SKILLS');
  for (const g of cv.skills) lines.push(wrap80(`${tr(g.category)}: ${g.items.join(', ')}`));
  return lines.join('\n') + '\n';
}

let stale = 0;
for (const { file, content } of outputs) {
  if (check) {
    let current = '';
    try {
      current = readFileSync(p(file), 'utf8');
    } catch {
      /* missing counts as stale */
    }
    if (current !== content) {
      console.error(`✗ ${file} is out of date — run \`npm run build\` and commit the result`);
      stale++;
    } else {
      console.log(`✓ ${file}`);
    }
  } else {
    mkdirSync(dirname(p(file)), { recursive: true });
    writeFileSync(p(file), content);
    console.log(`✓ wrote ${file}`);
  }
}

if (check && stale) process.exit(1);
if (check) console.log('\nAll generated files are up to date.');
