// Shared helpers for the content renderers.

/**
 * Resolve a localised value. Content fields are either a plain string (locale
 * independent, e.g. a company name) or an object keyed by locale. Missing
 * translations fall back to the default locale so a half-translated file still
 * builds.
 */
export function t(value, locale, defaultLocale = 'en') {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[locale] ?? value[defaultLocale] ?? '';
}

export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape for a double-quoted HTML attribute. */
export function escAttr(str) {
  return escHtml(str).replace(/"/g, '&quot;');
}

const TEX_SPECIALS = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  '$': '\\$',
  '#': '\\#',
  '_': '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

/**
 * Escape for LaTeX and normalise typographic dashes. En and em dashes are
 * written as literal characters in cv.json; LaTeX spells both as `--`, which is
 * what the existing CV uses throughout.
 */
export function escTex(str) {
  return String(str)
    .replace(/[\\&%$#_{}~^]/g, (c) => TEX_SPECIALS[c])
    .replace(/[—–]/g, '--');
}

/** Join a role's start/end into the string each target expects. */
export function period(entry, locale, { dash, separator, defaultLocale }) {
  const start = t(entry.start, locale, defaultLocale);
  const end = t(entry.end, locale, defaultLocale);
  const location = t(entry.location, locale, defaultLocale);
  const range = `${start} ${dash} ${end}`;
  return location ? `${range}${separator}${location}` : range;
}

export function indent(lines, spaces) {
  const pad = ' '.repeat(spaces);
  return lines.map((line) => (line === '' ? '' : pad + line)).join('\n');
}
