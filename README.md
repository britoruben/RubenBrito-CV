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
source without writing anything; CI runs it on every push and pull request.

Styling (`docs/styles.css`) and page structure (`build/render-html.mjs`) are
edited directly — only the *content* is generated.

## Structure

### Source (edit these)

- **content/cv.json** - single source of truth for all CV content
- **build/render-html.mjs** - website template
- **build/render-tex.mjs** - LaTeX body template
- **build/preamble.tex** - LaTeX preamble, macros and page setup
- **build/lib.mjs** - shared helpers (locale resolution, HTML/LaTeX escaping)
- **build/build.mjs** - build entry point (`npm run build` / `npm run check`)
- **docs/styles.css** - website styling (light/dark theme)
- **docs/assets/** - personal mark and favicons

### Generated (do not edit)

- **docs/index.html** - website, built from `content/cv.json`
- **main.tex** - LaTeX CV, built from `content/cv.json`
- **docs/RubenBrito-CV.pdf** - compiled by GitHub Actions from `main.tex`

### Workflows

- **.github/workflows/verify-build.yml** - fails if the generated files are out of sync with `content/cv.json`
- **.github/workflows/compile-latex.yml** - compiles the PDF and publishes it to `docs/` on every push to `main`
- **.github/workflows/pr-preview-pdf.yml** - compiles the PDF on pull requests to `main` and uploads it as a review artifact

## Branches

Work happens on `sandbox` and reaches `main` through a pull request. `main` is
what GitHub Pages serves.

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
