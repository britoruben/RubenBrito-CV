import { t, escHtml, escAttr, period } from './lib.mjs';
import { icon } from './icons.mjs';

const DASH = '–';
const SEP = ' · ';

/* ---------- fragments ---------- */

function bulletList(source, stack, locale, dl, cls, pad) {
  const bullets = t(source, locale, dl).slice();
  if (stack?.length) bullets.push(`Stack: ${stack.join(', ')}.`);
  const sp = ' '.repeat(pad);
  return `${sp}<ul class="${cls}">\n`
    + bullets.map((b) => `${sp}  <li>${escHtml(b)}</li>`).join('\n')
    + `\n${sp}</ul>`;
}

/**
 * A client engagement inside a consulting role. <details open> keeps the
 * content visible and printable with no JavaScript, while still letting the
 * reader collapse an engagement they do not care about.
 */
function engagementBlock(eng, locale, dl) {
  const tr = (v) => t(v, locale, dl);
  return `          <details class="engagement" open>
            <summary class="engagement-summary">
              <span class="engagement-client">${escHtml(eng.client)}</span>
              <span class="engagement-period">${escHtml(`${tr(eng.start)} ${DASH} ${tr(eng.end)}`)}</span>
            </summary>
${bulletList(eng.bullets, eng.stack, locale, dl, 'project-list engagement-list', 12)}
          </details>`;
}

function roleBlock(role, locale, dl, copy) {
  const tr = (v) => t(v, locale, dl);
  const note = role.note ? `\n      <div class="role-note">${escHtml(tr(role.note))}</div>` : '';
  const engagements = role.engagements?.length
    ? `\n      <div class="engagements">
        <div class="engagements-label">${escHtml(tr(copy.clientEngagements))}</div>
${role.engagements.map((e) => engagementBlock(e, locale, dl)).join('\n')}
      </div>`
    : '';
  return `    <article class="role-block" data-reveal>
      <div class="role-header">
        <h3 class="company">${escHtml(role.company)}</h3>
        <span class="position">${escHtml(tr(role.position))}</span>
        <span class="period">${escHtml(period(role, locale, { dash: DASH, separator: SEP, defaultLocale: dl }))}</span>
      </div>${note}
${bulletList(role.bullets, role.stack, locale, dl, 'project-list', 6)}${engagements}
    </article>`;
}

function eduBlock(edu, locale, dl) {
  const tr = (v) => t(v, locale, dl);
  return `    <div class="edu-block" data-reveal>
      <div class="edu-head">
        <span class="school">${escHtml(edu.school)}</span>
        <span class="period">${escHtml(`${edu.start} ${DASH} ${edu.end}`)}</span>
      </div>
      <div class="edu-sub">${escHtml(tr(edu.qualification))}</div>
      <div class="edu-extra">${escHtml(tr(edu.note))}</div>
    </div>`;
}

function skillCategory(group, locale, dl) {
  const tags = group.items.map((i) => `<li class="skill-tag">${escHtml(i)}</li>`).join('');
  return `      <div class="skill-category" data-reveal>
        <h3>${escHtml(t(group.category, locale, dl))}</h3>
        <ul class="skill-tags">
          ${tags}
        </ul>
      </div>`;
}

function sectionTitle(iconName, label) {
  return `<h2 class="section-title">${icon(iconName)} ${escHtml(label)}</h2>`;
}

/* ---------- document ---------- */

export function renderHtml(cv, locale = cv.meta.defaultLocale, pathPrefix = '') {
  const dl = cv.meta.defaultLocale;
  const tr = (v) => t(v, locale, dl);
  const { profile, meta, copy } = cv;
  const site = meta.siteUrl;
  const asset = (f) => `${pathPrefix}${f}`;
  const canonical = locale === dl ? site : `${site}${locale}/`;
  const photoUrl = `${site}${profile.photo.src}`;
  const ogImage = `${site}assets/og-image.png`;

  const localeHref = (loc) => (loc === dl ? (pathPrefix || './') : `${pathPrefix}${loc}/`);
  const langSwitch = meta.locales
    .map((loc) => {
      const current = loc === locale;
      return `        <a class="lang-option${current ? ' is-current' : ''}" href="${localeHref(loc)}" hreflang="${loc}"`
        + `${current ? ' aria-current="true"' : ''}>${loc.toUpperCase()}</a>`;
    })
    .join('\n');

  const alternates = meta.locales
    .map((loc) => `  <link rel="alternate" hreflang="${loc}" href="${loc === dl ? site : `${site}${loc}/`}" />`)
    .concat(`  <link rel="alternate" hreflang="x-default" href="${site}" />`)
    .join('\n');

  const roles = cv.experience.map((r) => roleBlock(r, locale, dl, copy)).join('\n\n');
  const edu = cv.education.map((e) => eduBlock(e, locale, dl)).join('\n\n');
  const skills = cv.skills.map((g) => skillCategory(g, locale, dl)).join('\n');
  const languages = cv.languages
    .map((l) => `        <li class="language-item"><span class="language-name">${escHtml(tr(l.name))}</span>`
      + `<span class="language-level">${escHtml(tr(l.level))}</span></li>`)
    .join('\n');
  const contextLine = tr(profile.contextLine)
    .map((part) => escHtml(part))
    .join(' <span class="dot" aria-hidden="true">&middot;</span> ');

  const knownDescriptions = Object.entries(cv.projects.knownDescriptions)
    .map(([k, v]) => `      '${k}': '${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`)
    .join(',\n');
  const jsStr = (v) => tr(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  return `<!DOCTYPE html>
<!--
  GENERATED FILE - do not edit by hand.
  Content lives in content/cv.json; the template in tools/render-html.mjs.
  Regenerate with: npm run build
-->
<html lang="${locale}" data-theme="light">
<head>
  <meta name="color-scheme" id="colorSchemeMeta" content="light dark" />
  <script>
    (function() {
      var saved = localStorage.getItem('theme');
      var theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
      var meta = document.getElementById('colorSchemeMeta');
      if (meta) meta.setAttribute('content', theme === 'dark' ? 'dark light' : 'light dark');
    })();
  </script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escAttr(tr(profile.metaDescription))}" />
  <meta name="author" content="${escAttr(profile.name)}" />
  <title>${escHtml(tr(profile.title))}</title>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escAttr(profile.name)}" />
  <meta property="og:description" content="${escAttr(tr(profile.metaDescription))}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escAttr(profile.name)} — ${escAttr(tr(profile.role))}" />
  <meta property="og:locale" content="${locale}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${ogImage}" />
  <meta name="theme-color" content="${meta.themeColor}" />
  <link rel="canonical" href="${canonical}" />
${alternates}

  <link rel="icon" type="image/png" sizes="32x32" href="${asset('assets/favicon-32.png')}" />
  <link rel="apple-touch-icon" sizes="180x180" href="${asset('assets/favicon-180.png')}" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="${asset('styles.css')}" />

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${profile.name}",
    "jobTitle": "${tr(profile.jobTitle)}",
    "url": "${site}",
    "image": "${photoUrl}",
    "email": "mailto:${profile.email}",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "${profile.addressLocality}",
      "addressCountry": "${profile.addressCountry}"
    },
    "sameAs": [
      "${profile.links.linkedin}",
      "${profile.links.github}"
    ]
  }
  </script>
</head>
<body>

<a href="#main-content" class="skip-link">${escHtml(tr(copy.skipLink))}</a>

<nav class="topnav">
  <div class="nav-inner">
    <a href="#top" class="nav-brand">${escHtml(profile.name)}</a>
    <div class="nav-links-wrap">
      <div class="nav-links">
        <a href="#about">${escHtml(tr(copy.navAbout))}</a>
        <a href="#experience">${escHtml(tr(copy.navExperience))}</a>
        <a href="#projects">${escHtml(tr(copy.navProjects))}</a>
        <a href="#skills">${escHtml(tr(copy.navSkills))}</a>
        <a href="#education">${escHtml(tr(copy.navEducation))}</a>
        <a href="#cv">${escHtml(tr(copy.navCv))}</a>
      </div>
    </div>
    <div class="nav-tools">
      <div class="lang-switch" role="group" aria-label="${escAttr(tr(copy.langLabel))}">
${langSwitch}
      </div>
      <button id="themeToggle" type="button" class="theme-toggle" aria-label="${escAttr(tr(copy.toggleTheme))}">
        ${icon('moon', 'icon-moon')}
        ${icon('sun', 'icon-sun')}
      </button>
    </div>
  </div>
</nav>

<header class="hero" id="top">
  <div class="hero-content">
    <img class="hero-photo" src="${asset(profile.photo.src)}" alt="${escAttr(tr(profile.photo.alt))}" width="${profile.photo.width}" height="${profile.photo.height}" />
    <div class="hero-text">
      <h1 class="name">${escHtml(profile.name)}</h1>
      <p class="role-label">${escHtml(tr(profile.role))}</p>
      <p class="hero-tagline">${escHtml(tr(profile.tagline))}</p>
      <div class="hero-accent" aria-hidden="true"></div>
      <p class="hero-context">${contextLine}</p>
      <div class="hero-actions">
        <a href="${asset('RubenBrito-CV.pdf')}" download class="btn btn-primary">${icon('download')} ${escHtml(tr(copy.downloadCv))}</a>
        <a href="${profile.links.linkedin}" target="_blank" rel="noopener" class="btn btn-secondary">${icon('linkedin')} LinkedIn</a>
        <a href="${profile.links.github}" target="_blank" rel="noopener" class="btn btn-secondary">${icon('github')} GitHub</a>
      </div>
    </div>
  </div>
</header>

<main class="content" id="main-content">

  <section id="about">
    ${sectionTitle('user', tr(cv.sections.about))}
    <p class="lead">
      ${escHtml(tr(cv.summary))}
    </p>
  </section>

  <section id="experience">
    ${sectionTitle('briefcase', tr(cv.sections.experience))}

${roles}
  </section>

  <section id="projects">
    ${sectionTitle('github', tr(cv.sections.projects))}
    <p class="section-note">${escHtml(tr(copy.projectsNote))}</p>

    <div id="projects-grid" class="projects-grid">
      <p class="projects-status">${escHtml(tr(copy.projectsLoading))}</p>
    </div>
    <noscript>
      <p class="projects-status">${escHtml(tr(copy.projectsError))}
        <a href="${profile.links.github}" target="_blank" rel="noopener">GitHub</a>.</p>
    </noscript>
  </section>

  <section id="skills">
    ${sectionTitle('code', tr(cv.sections.skills))}

    <div class="skills-grid">
${skills}
    </div>
  </section>

  <section id="education">
    ${sectionTitle('graduation', tr(cv.sections.education))}

${edu}

    <div class="languages-block" data-reveal>
      <h3 class="subsection-title">${icon('globe')} ${escHtml(tr(cv.sections.languages))}</h3>
      <ul class="language-list">
${languages}
      </ul>
    </div>
  </section>

  <section id="cv">
    ${sectionTitle('file', tr(cv.sections.cv))}

    <div class="cv-panel" data-reveal>
      <a class="cv-thumb" href="${asset('RubenBrito-CV.pdf')}" download aria-label="${escAttr(tr(copy.downloadCv))}">
        <img src="${asset('assets/cv-preview.png')}" alt="${escAttr(tr(copy.cvPreviewAlt))}" width="497" height="702" loading="lazy" />
      </a>
      <div class="cv-side">
        <p class="lead">${escHtml(tr(copy.contactLead))}</p>
        <div class="contact-buttons">
          <a href="${asset('RubenBrito-CV.pdf')}" download class="btn btn-primary">${icon('download')} ${escHtml(tr(copy.downloadCv))}</a>
          <a href="mailto:${profile.email}" class="btn btn-secondary">${icon('mail')} ${escHtml(tr(copy.sendEmail))}</a>
        </div>
        <ul class="contact-list">
          <li>${icon('mail')} <a href="mailto:${profile.email}">${escHtml(profile.email)}</a></li>
          <li>${icon('pin')} ${escHtml(tr(profile.location))}</li>
          <li>${icon('linkedin')} <a href="${profile.links.linkedin}" target="_blank" rel="noopener">LinkedIn</a></li>
          <li>${icon('github')} <a href="${profile.links.github}" target="_blank" rel="noopener">GitHub</a></li>
        </ul>
        <p class="cv-note">${escHtml(tr(copy.cvNote))}</p>
      </div>
    </div>
  </section>

</main>

<footer class="site-footer">
  <p>&copy; <span id="footerYear">2026</span> ${escHtml(profile.name)} &middot; ${escHtml(tr(copy.builtWith))} LaTeX + GitHub Actions</p>
</footer>

<a href="#top" id="backToTop" class="back-to-top" aria-label="${escAttr(tr(copy.backToTop))}">
  ${icon('arrowUp')}
</a>

<script>
  (function() {
    var yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  })();

  (function() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', document.documentElement.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
    btn.addEventListener('click', function() {
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
      var meta = document.getElementById('colorSchemeMeta');
      if (meta) meta.setAttribute('content', next === 'dark' ? 'dark light' : 'light dark');
    });
  })();

  // Keep anchor targets clear of the sticky nav, whatever height it actually is.
  (function() {
    var nav = document.querySelector('.topnav');
    if (!nav) return;
    function sync() {
      document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
    }
    sync();
    window.addEventListener('resize', sync);
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(nav);
  })();

  (function() {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
    if (!navLinks.length || !('IntersectionObserver' in window)) return;
    var sections = navLinks
      .map(function(link) { return document.getElementById(link.getAttribute('href').slice(1)); })
      .filter(Boolean);

    function setActive(id) {
      navLinks.forEach(function(link) {
        var isActive = link.getAttribute('href') === '#' + id;
        link.classList.toggle('active', isActive);
        if (isActive) { link.setAttribute('aria-current', 'true'); }
        else { link.removeAttribute('aria-current'); }
      });
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(function(section) { observer.observe(section); });
  })();

  (function() {
    var btn = document.getElementById('backToTop');
    var hero = document.getElementById('top');
    if (!btn || !hero || !('IntersectionObserver' in window)) return;
    var heroObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) { btn.classList.toggle('visible', !entry.isIntersecting); });
    }, { threshold: 0 });
    heroObserver.observe(hero);
  })();

  // Reveal on scroll. Elements start visible in CSS and are only hidden once
  // this runs, so the page is fully readable with JavaScript disabled.
  (function() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!items.length) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('reveal-ready');
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function(item) { observer.observe(item); });
  })();

  (function() {
    var GITHUB_USER = '${cv.projects.githubUser}';
    var MAX_REPOS = ${cv.projects.maxRepos};
    var REQUIRE_DESCRIPTION = ${cv.projects.requireDescription};
    var EXCLUDE = ${JSON.stringify(cv.projects.exclude)};
    var KNOWN_DESCRIPTIONS = {
${knownDescriptions}
    };

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str == null ? '' : str;
      return div.innerHTML;
    }

    function timeAgo(dateStr) {
      var days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
      if (days < 1) return 'today';
      if (days === 1) return '1 day ago';
      if (days < 30) return days + ' days ago';
      var months = Math.floor(days / 30);
      if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
      var years = Math.floor(months / 12);
      return years + (years === 1 ? ' year ago' : ' years ago');
    }

    function renderProjects(repos) {
      var grid = document.getElementById('projects-grid');
      if (!grid) return;
      if (!repos.length) {
        grid.innerHTML = '<p class="projects-status">${jsStr(copy.projectsEmpty)}</p>';
        return;
      }
      grid.innerHTML = repos.map(function(repo) {
        var desc = escapeHtml(KNOWN_DESCRIPTIONS[repo.name] || repo.description || '${jsStr(copy.noDescription)}');
        var lang = repo.language ? '<span class="project-stat">' + escapeHtml(repo.language) + '</span>' : '';
        var stars = repo.stargazers_count > 0
          ? '<span class="project-stat">${icon('star', 'icon-star')} ' + repo.stargazers_count + '</span>'
          : '';
        return '<a class="project-card" href="' + repo.html_url + '" target="_blank" rel="noopener">'
          + '<h3 class="project-card-title">' + escapeHtml(repo.name) + '</h3>'
          + '<p class="project-card-desc">' + desc + '</p>'
          + '<div class="project-card-meta">' + lang + stars
          + '<span class="project-stat">Updated ' + timeAgo(repo.pushed_at) + '</span></div>'
          + '</a>';
      }).join('');
    }

    fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?sort=pushed&per_page=30&type=owner')
      .then(function(res) {
        if (!res.ok) throw new Error('GitHub API error');
        return res.json();
      })
      .then(function(data) {
        var repos = data.filter(function(r) {
          if (r.fork || r.archived) return false;
          if (EXCLUDE.indexOf(r.name) !== -1) return false;
          // A repo with no description is almost always a scratch experiment;
          // a curated one always has it. Keeps the front page respectable
          // without any hand-maintained list.
          if (REQUIRE_DESCRIPTION && !r.description && !KNOWN_DESCRIPTIONS[r.name]) return false;
          return true;
        }).slice(0, MAX_REPOS);
        renderProjects(repos);
      })
      .catch(function() {
        var grid = document.getElementById('projects-grid');
        if (grid) {
          grid.innerHTML = '<p class="projects-status">${jsStr(copy.projectsError)} '
            + '<a href="https://github.com/' + GITHUB_USER + '" target="_blank" rel="noopener">GitHub</a>.</p>';
        }
      });
  })();
</script>

</body>
</html>
`;
}
