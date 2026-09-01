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

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const p = (...parts) => resolve(root, ...parts);

const check = process.argv.includes('--check');
const cv = JSON.parse(readFileSync(p('content/cv.json'), 'utf8'));

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
];

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
