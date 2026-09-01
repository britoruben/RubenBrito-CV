import { t, escHtml, escAttr, period } from './lib.mjs';

const DASH = '-';
const SEP = ' · ';

function bulletList(source, stack, locale, defaultLocale, cls, pad) {
  const bullets = t(source, locale, defaultLocale).slice();
  if (stack?.length) bullets.push(`Stack: ${stack.join(', ')}.`);
  const sp = ' '.repeat(pad);
  return `${sp}<ul class="${cls}">\n`
    + bullets.map((b) => `${sp}  <li>${escHtml(b)}</li>`).join('\n')
    + `\n${sp}</ul>`;
}

function engagementBlock(eng, locale, defaultLocale, label) {
  const tr = (v) => t(v, locale, defaultLocale);
  return `        <div class="engagement">
          <div class="engagement-head">
            <span class="engagement-client">${escHtml(eng.client)}</span>
            <span class="engagement-period">${escHtml(`${tr(eng.start)} ${DASH} ${tr(eng.end)}`)}</span>
          </div>
${bulletList(eng.bullets, eng.stack, locale, defaultLocale, 'project-list engagement-list', 10)}
        </div>`;
}

function roleBlock(role, locale, defaultLocale, copy) {
  const tr = (v) => t(v, locale, defaultLocale);
  const note = role.note
    ? `\n      <div class="role-note">${escHtml(tr(role.note))}</div>`
    : '';
  const engagements = role.engagements?.length
    ? `\n      <div class="engagements">
        <div class="engagements-label">${escHtml(tr(copy.clientEngagements))}</div>
${role.engagements.map((e) => engagementBlock(e, locale, defaultLocale)).join('\n')}
      </div>`
    : '';
  return `    <div class="role-block">
      <div class="role-header">
        <span class="company">${escHtml(role.company)}</span>
        <span class="dot-sep" aria-hidden="true"></span>
        <span class="position">${escHtml(tr(role.position))}</span>
        <span class="period">${escHtml(period(role, locale, { dash: DASH, separator: SEP, defaultLocale }))}</span>
      </div>${note}
${bulletList(role.bullets, role.stack, locale, defaultLocale, 'project-list', 6)}${engagements}
    </div>`;
}

function eduBlock(edu, locale, defaultLocale) {
  const tr = (v) => t(v, locale, defaultLocale);
  return `    <div class="edu-block">
      <div class="edu-head">
        <span class="school">${escHtml(edu.school)}</span>
        <span class="period">${escHtml(`${edu.start} ${DASH} ${edu.end}`)}</span>
      </div>
      <div class="edu-sub">${escHtml(tr(edu.qualification))}</div>
      <div class="edu-extra">${escHtml(tr(edu.note))}</div>
    </div>`;
}

function skillCategory(group, locale, defaultLocale) {
  const tags = group.items
    .map((item) => `<li class="skill-tag">${escHtml(item)}</li>`)
    .join('');
  return `      <div class="skill-category">
        <h3>${escHtml(t(group.category, locale, defaultLocale))}</h3>
        <ul class="skill-tags">
          ${tags}
        </ul>
      </div>`;
}

export function renderHtml(cv, locale = cv.meta.defaultLocale) {
  const dl = cv.meta.defaultLocale;
  const tr = (v) => t(v, locale, dl);
  const { profile, meta, copy } = cv;
  const site = meta.siteUrl;
  const photoUrl = `${site}${profile.photo.src.replace(/^assets\//, 'assets/')}`;

  const roles = cv.experience
    .map((r) => roleBlock(r, locale, dl, copy))
    .join('\n\n    <div class="dashed-divider"></div>\n\n');

  const edu = cv.education
    .map((e) => eduBlock(e, locale, dl))
    .join('\n\n    <div class="dashed-divider"></div>\n\n');

  const skills = cv.skills.map((g) => skillCategory(g, locale, dl)).join('\n');

  const languages = cv.languages
    .map((l) => `      <li class="language-item"><span class="language-name">${escHtml(tr(l.name))}</span><span class="language-level">${escHtml(tr(l.level))}</span></li>`)
    .join('\n');

  const knownDescriptions = Object.entries(cv.projects.knownDescriptions)
    .map(([k, v]) => `      '${k}': '${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`)
    .join(',\n');

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
  <meta property="og:url" content="${site}" />
  <meta property="og:image" content="${photoUrl}" />
  <meta property="og:image:width" content="240" />
  <meta property="og:image:height" content="240" />
  <meta name="twitter:card" content="summary" />
  <meta name="theme-color" content="${meta.themeColor}" />
  <link rel="canonical" href="${site}" />

  <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="assets/favicon-180.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

  <link rel="stylesheet" href="styles.css" />

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

<!-- Navigation -->
<nav class="topnav">
  <div class="nav-inner">
    <a href="#top" class="nav-brand">${escHtml(profile.name)}</a>
    <div class="nav-links-wrap">
      <div class="nav-links">
        <a href="#about">${escHtml(tr(copy.navAbout))}</a>
        <a href="#experience">${escHtml(tr(copy.navExperience))}</a>
        <a href="#skills">${escHtml(tr(copy.navSkills))}</a>
        <a href="#education">${escHtml(tr(copy.navEducation))}</a>
        <a href="#languages">${escHtml(tr(cv.sections.languages))}</a>
        <a href="#contact">${escHtml(tr(copy.navContact))}</a>
        <a href="#projects">${escHtml(tr(copy.navProjects))}</a>
      </div>
    </div>
    <button id="themeToggle" type="button" class="theme-toggle" aria-label="${escAttr(tr(copy.toggleTheme))}" title="Toggle theme">
      <i aria-hidden="true" class="fa-solid fa-moon icon-moon"></i>
      <i aria-hidden="true" class="fa-solid fa-sun icon-sun"></i>
    </button>
  </div>
</nav>

<!-- Hero Section -->
<header class="hero" id="top">
  <div class="hero-content">
    <img class="hero-photo" src="${profile.photo.src}" alt="${escAttr(tr(profile.photo.alt))}" width="${profile.photo.width}" height="${profile.photo.height}" />
    <div class="hero-text">
      <h1 class="name">${escHtml(profile.name)}</h1>
      <div class="subtitle">${escHtml(tr(profile.role))}</div>
      <p class="hero-tagline">${escHtml(tr(profile.tagline))}</p>
      <div class="hero-accent" aria-hidden="true"></div>

      <p class="hero-context">${tr(profile.contextLine).map((part) => escHtml(part)).join(' <span class="dot" aria-hidden="true">&middot;</span> ')}</p>

      <div class="contact-row">
        <a href="mailto:${profile.email}"><i aria-hidden="true" class="fa-solid fa-envelope"></i> ${escHtml(profile.email)}</a>
        <span class="dot" aria-hidden="true">&middot;</span>
        <span><i aria-hidden="true" class="fa-solid fa-location-dot"></i> ${escHtml(tr(profile.location))}</span>
      </div>
      <div class="contact-row">
        <a href="${profile.links.linkedin}" target="_blank" rel="noopener"><i aria-hidden="true" class="fa-brands fa-linkedin"></i> LinkedIn</a>
        <span class="dot" aria-hidden="true">&middot;</span>
        <a href="${profile.links.github}" target="_blank" rel="noopener"><i aria-hidden="true" class="fa-brands fa-github"></i> GitHub</a>
        <span class="dot" aria-hidden="true">&middot;</span>
        <a href="#cv" class="cv-link"><i aria-hidden="true" class="fa-solid fa-file-pdf"></i> ${escHtml(tr(copy.viewCv))}</a>
      </div>
    </div>
  </div>
</header>

<main class="content" id="main-content">

  <!-- About Section -->
  <section id="about">
    <h2 class="section-title"><i aria-hidden="true" class="fa-solid fa-user"></i> ${escHtml(tr(cv.sections.about))}</h2>
    <p class="lead">
      ${escHtml(tr(cv.summary))}
    </p>
  </section>

  <!-- Experience Section -->
  <section id="experience">
    <h2 class="section-title"><i aria-hidden="true" class="fa-solid fa-briefcase"></i> ${escHtml(tr(cv.sections.experience))}</h2>

${roles}
  </section>

  <!-- Skills Section -->
  <section id="skills">
    <h2 class="section-title"><i aria-hidden="true" class="fa-solid fa-code"></i> ${escHtml(tr(cv.sections.skills))}</h2>

    <div class="skills-grid">
${skills}
    </div>
  </section>

  <!-- Education Section -->
  <section id="education">
    <h2 class="section-title"><i aria-hidden="true" class="fa-solid fa-graduation-cap"></i> ${escHtml(tr(cv.sections.education))}</h2>

${edu}
  </section>

  <!-- Languages Section -->
  <section id="languages">
    <h2 class="section-title"><i aria-hidden="true" class="fa-solid fa-language"></i> ${escHtml(tr(cv.sections.languages))}</h2>
    <ul class="language-list">
${languages}
    </ul>
  </section>

  <!-- Contact Section -->
  <section id="contact">
    <h2 class="section-title"><i aria-hidden="true" class="fa-solid fa-envelope"></i> ${escHtml(tr(cv.sections.contact))}</h2>
    <p class="lead">
      ${escHtml(tr(copy.contactLead))}
    </p>
    <div class="contact-buttons">
      <a href="mailto:${profile.email}" class="btn btn-primary">
        <i aria-hidden="true" class="fa-solid fa-envelope"></i> ${escHtml(tr(copy.sendEmail))}
      </a>
      <a href="${profile.links.linkedin}" target="_blank" rel="noopener" class="btn btn-secondary">
        <i aria-hidden="true" class="fa-brands fa-linkedin"></i> LinkedIn
      </a>
      <a href="${profile.links.github}" target="_blank" rel="noopener" class="btn btn-secondary">
        <i aria-hidden="true" class="fa-brands fa-github"></i> GitHub
      </a>
    </div>
  </section>

  <!-- CV Download Section -->
  <section id="cv">
    <h2 class="section-title"><i aria-hidden="true" class="fa-solid fa-file-pdf"></i> ${escHtml(tr(cv.sections.cv))}</h2>
    <p class="lead">${escHtml(tr(copy.cvLead))}</p>
    <a href="RubenBrito-CV.pdf" download class="btn btn-primary">
      <i aria-hidden="true" class="fa-solid fa-download"></i> ${escHtml(tr(copy.downloadCv))}
    </a>
    <p class="cv-note">${escHtml(tr(copy.cvNote))}</p>
  </section>

  <!-- Projects Section -->
  <section id="projects">
    <h2 class="section-title"><i aria-hidden="true" class="fa-brands fa-github"></i> ${escHtml(tr(cv.sections.projects))}</h2>
    <p class="section-note">${escHtml(tr(copy.projectsNote))}</p>

    <div id="projects-grid" class="projects-grid">
      <p class="projects-status">${escHtml(tr(copy.projectsLoading))}</p>
    </div>
  </section>

</main>

<footer class="site-footer">
  <p>&copy; <span id="footerYear">2026</span> ${escHtml(profile.name)} &middot; ${escHtml(tr(copy.builtWith))} <a href="https://pages.github.com/" target="_blank" rel="noopener">GitHub Pages</a></p>
</footer>

<a href="#top" id="backToTop" class="back-to-top" aria-label="${escAttr(tr(copy.backToTop))}">
  <i aria-hidden="true" class="fa-solid fa-arrow-up"></i>
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
        if (isActive) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(function(section) { observer.observe(section); });
  })();

  (function() {
    var btn = document.getElementById('backToTop');
    var hero = document.getElementById('top');
    if (!btn || !hero || !('IntersectionObserver' in window)) return;

    var heroObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        btn.classList.toggle('visible', !entry.isIntersecting);
      });
    }, { threshold: 0 });

    heroObserver.observe(hero);
  })();

  (function() {
    var GITHUB_USER = '${cv.projects.githubUser}';
    var MAX_REPOS = ${cv.projects.maxRepos};
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
        grid.innerHTML = '<p class="projects-status">${tr(copy.projectsEmpty)}</p>';
        return;
      }
      grid.innerHTML = repos.map(function(repo) {
        var desc = escapeHtml(KNOWN_DESCRIPTIONS[repo.name] || repo.description || '${tr(copy.noDescription)}');
        var lang = repo.language ? '<span class="project-stat">' + escapeHtml(repo.language) + '</span>' : '';
        var stars = repo.stargazers_count > 0
          ? '<span class="project-stat"><i aria-hidden="true" class="fa-solid fa-star"></i> ' + repo.stargazers_count + '</span>'
          : '';
        return '<a class="project-card" href="' + repo.html_url + '" target="_blank" rel="noopener">'
          + '<h3 class="project-card-title">' + escapeHtml(repo.name) + '</h3>'
          + '<p class="project-card-desc">' + desc + '</p>'
          + '<div class="project-card-meta">' + lang + stars
          + '<span class="project-stat">Updated ' + timeAgo(repo.pushed_at) + '</span></div>'
          + '</a>';
      }).join('');
    }

    fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?sort=pushed&per_page=10&type=owner')
      .then(function(res) {
        if (!res.ok) throw new Error('GitHub API error');
        return res.json();
      })
      .then(function(data) {
        var repos = data.filter(function(r) { return !r.fork; }).slice(0, MAX_REPOS);
        renderProjects(repos);
      })
      .catch(function() {
        var grid = document.getElementById('projects-grid');
        if (grid) {
          grid.innerHTML = '<p class="projects-status">${tr(copy.projectsError).replace(/'/g, "\\'")} '
            + '<a href="https://github.com/' + GITHUB_USER + '" target="_blank" rel="noopener">GitHub</a>.</p>';
        }
      });
  })();
</script>

</body>
</html>
`;
}
