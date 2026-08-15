# Rubén Brito - CV

![Compile LaTeX to PDF](https://github.com/britoruben/RubenBrito-CV/actions/workflows/compile-latex.yml/badge.svg)

Personal homepage + LaTeX CV in one repo.

**Live site:** https://britoruben.github.io/RubenBrito-CV/

## Quick Start

1. Edit `main.tex` for the LaTeX CV content
2. Edit `docs/index.html` / `docs/styles.css` for the website
3. Push to `main` — a GitHub Actions workflow compiles `main.tex` and commits the PDF to `docs/RubenBrito-CV.pdf` automatically
4. Opening a pull request against `main` that touches `main.tex` triggers a second workflow that compiles the PDF and uploads it as a downloadable build artifact, so it can be reviewed before merging

```bash
git add -A && git commit -m "Update CV" && git push
```

## Structure

- **main.tex** - CV in LaTeX format (compiled to PDF by GitHub Actions)
- **docs/index.html** - Personal website/portfolio, including a "Public Projects" section that fetches repos live from the GitHub API
- **docs/styles.css** - Website styling (light/dark theme)
- **docs/assets/** - Profile photo and favicon
- **.github/workflows/compile-latex.yml** - Compiles the PDF and publishes it to `docs/` on every push to `main`
- **.github/workflows/pr-preview-pdf.yml** - Compiles the PDF on pull requests to `main` and uploads it as a review artifact

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
