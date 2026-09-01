# Rubén Brito - CV

![Compile LaTeX to PDF](https://github.com/britoruben/RubenBrito-CV/actions/workflows/compile-latex.yml/badge.svg)

Personal homepage + LaTeX CV in one repo.

**Live site:** https://britoruben.github.io/RubenBrito-CV/

## Quick Start

All CV content lives in a single file, `content/cv.json`. The website and the
LaTeX CV are generated from it — **never edit `docs/index.html` or `main.tex` by
hand**, your changes will be overwritten on the next build.

1. Edit `content/cv.json`
2. Run `npm run build` — regenerates `docs/index.html` and `main.tex`
3. Commit both the source and the generated files
4. Push to `sandbox`, then open a pull request to `main`

```bash
npm run build
git add -A && git commit -m "Update CV" && git push
```

`npm run check` verifies the generated files are in sync with the content
source without writing anything, and `npm run check:links` verifies every
internal link and anchor resolves. CI runs both on every push and pull
request.

Styling (`docs/styles.css`) and page structure (`tools/render-html.mjs`) are
edited directly — only the *content* is generated.

## Structure

### Source (edit these)

- **content/cv.json** - single source of truth for all CV content
- **tools/render-html.mjs** - website template
- **tools/render-tex.mjs** - LaTeX body template
- **tools/preamble.tex** - LaTeX preamble, macros and page setup
- **tools/lib.mjs** - shared helpers (locale resolution, HTML/LaTeX escaping)
- **tools/build.mjs** - build entry point (`npm run build` / `npm run check`)
- **tools/icons.mjs** - inline SVG icons (no icon CDN)
- **tools/check-links.mjs** - internal link and anchor checker (`npm run check:links`)
- **docs/styles.css** - website styling (light/dark theme)
- **docs/assets/** - personal mark and favicons

### Generated (do not edit)

- **docs/index.html** - website in English, built from `content/cv.json`
- **docs/es/index.html** - Spanish version, same source
- **docs/robots.txt**, **docs/sitemap.xml** - built from the site URL in `content/cv.json`
- **main.tex** - LaTeX CV, built from `content/cv.json`
- **docs/RubenBrito-CV.pdf** - compiled by GitHub Actions from `main.tex`
- **docs/assets/cv-preview.png** - first page of the PDF, shown as a thumbnail on the site

### Workflows

- **.github/workflows/verify-build.yml** - fails if the generated files are out of sync with `content/cv.json`, or if an internal link or anchor is broken
- **.github/workflows/compile-latex.yml** - compiles the PDF and publishes it to `docs/` on every push to `main`
- **.github/workflows/pr-preview-pdf.yml** - compiles the PDF on pull requests to `main` and uploads it as a review artifact

## Localisation

The site is bilingual. English is served at the site root, Spanish at `/es/`,
with `hreflang` alternates and a per-locale canonical. Both come from the same
`content/cv.json`: text fields are keyed by locale and fall back to English
when a translation is missing, so a partial translation still builds.

The PDF is English only.

## Branches

Work happens on `sandbox` and reaches `main` through a pull request. `main` is
what GitHub Pages serves.

## Maintenance note: the PDF push token

`compile-latex.yml` pushes the compiled PDF back to `main` using
`secrets.PDF_PUSH_TOKEN`, a fine-grained PAT. It exists because the repository
ruleset requiring pull requests on `main` cannot be bypassed by the default
`GITHUB_TOKEN` - GitHub evaluates ruleset bypass against real actor identities,
not the ephemeral Actions token.

**This PAT expires.** When it does, the workflow fails with a push permission
error that does not mention expiry. Replacing it with a GitHub App installation
token (`actions/create-github-app-token`) added to the ruleset bypass list
would remove the expiry, at the cost of creating and installing an App.

## GitHub Pages Setup

1. Go to **Settings → Pages**
2. Under **Build and deployment → Source**, select **Deploy from a branch**
3. Branch: `main`, Folder: `/docs`
4. Save

Your site will be live at: `https://britoruben.github.io/RubenBrito-CV/`

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

Adapted from [ByungKwanLee-CV](https://github.com/ByungKwanLee/ByungKwanLee-CV)

## Acknowledgments

- Original CV template by Dubasi Pavan Kumar (MIT License)
- Workflow inspiration from ByungKwanLee-CV
