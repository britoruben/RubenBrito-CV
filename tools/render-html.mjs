import { t, escHtml, escAttr, period } from './lib.mjs';
import { icon } from './icons.mjs';

const DASH = '–';
const SEP = ' · ';

/* ---------- fragments ---------- */

/**
 * A technology name (from a role/engagement `stack` array or a `skills[].items`
 * entry) reduced to a build-time slug. This is the join key that lets the same
 * technology, however it is written, be filtered together wherever it appears
 * on the page. Different strings for what is conceptually the same technology
 * (e.g. "Kafka" vs "Kafka (MSK & on-premise)") deliberately stay distinct — the
 * slug is derived, never a hand-authored synonym table.
 */
function slugifyTech(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function techTag(name) {
  return `<button type="button" class="tech-tag" data-tech="${escAttr(slugifyTech(name))}" aria-pressed="false">${escHtml(name)}</button>`;
}

/**
 * A 4-digit year pulled from an experience entry's `start` (a plain string
 * like "Nov 2019", or a locale object resolving to one). No date is invented
 * or adjusted here — this only ever surfaces a year already present in
 * content/cv.json, for the timeline's year markers.
 */
function yearOf(value, locale, dl) {
  const resolved = t(value, locale, dl);
  const match = /\d{4}/.exec(resolved);
  return match ? match[0] : '';
}

function bulletList(source, stack, locale, dl, cls, pad, primaryIdx, copy) {
  const tr = (v) => t(v, locale, dl);
  const bullets = t(source, locale, dl).slice();
  const primary = new Set(primaryIdx || []);
  const sp = ' '.repeat(pad);
  const items = bullets.map((b, i) => `${sp}  <li${primary.has(i) ? '' : ' class="is-secondary"'}>${escHtml(b)}</li>`);
  if (stack?.length) {
    items.push(`${sp}  <li class="is-secondary">${escHtml(tr(copy.stackLabel))}: ${stack.map(techTag).join(', ')}.</li>`);
  }
  return `${sp}<ul class="${cls}">\n`
    + items.join('\n')
    + `\n${sp}</ul>`;
}

/**
 * A client engagement inside a consulting role. <details open> keeps the
 * content visible and printable with no JavaScript, while still letting the
 * reader collapse an engagement they do not care about.
 */
function engagementBlock(eng, locale, dl, copy, keyBullets) {
  const tr = (v) => t(v, locale, dl);
  const highlightClass = eng.highlight ? ' is-highlight' : '';
  const highlightLabel = eng.highlight
    ? `\n              <span class="engagement-highlight-label">${escHtml(tr(copy.signatureWork))}</span>`
    : '';
  return `          <details class="engagement${highlightClass}" open>
            <summary class="engagement-summary">
              <span class="engagement-client">${escHtml(eng.client)}</span>
              <span class="engagement-period">${escHtml(`${tr(eng.start)} ${DASH} ${tr(eng.end)}`)}</span>${highlightLabel}${icon('chevronDown', 'engagement-chevron')}
            </summary>
${bulletList(eng.bullets, eng.stack, locale, dl, 'project-list engagement-list', 12, keyBullets?.[eng.client], copy)}
          </details>`;
}

function roleBlock(role, locale, dl, copy, keyBullets) {
  const tr = (v) => t(v, locale, dl);
  const year = yearOf(role.start, locale, dl);
  const note = role.note ? `\n      <div class="role-note">${escHtml(tr(role.note))}</div>` : '';
  const engagements = role.engagements?.length
    ? `\n      <div class="engagements">
        <div class="engagements-label">${escHtml(tr(copy.clientEngagements))}</div>
${role.engagements.map((e) => engagementBlock(e, locale, dl, copy, keyBullets)).join('\n')}
      </div>`
    : '';
  return `    <article class="role-block" data-reveal>
      <div class="role-header">
        <span class="role-year">${escHtml(year)}</span>
        <h3 class="company">${escHtml(role.company)}</h3>
        <span class="position">${escHtml(tr(role.position))}</span>
        <span class="period">${escHtml(period(role, locale, { dash: DASH, separator: SEP, defaultLocale: dl }))}</span>
      </div>${note}
${bulletList(role.bullets, role.stack, locale, dl, 'project-list', 6, keyBullets?.[role.company], copy)}${engagements}
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

function skillCategory(group, locale, dl, skillTiers) {
  const isCore = (i) => skillTiers.core.includes(i);
  const isHistory = (i) => skillTiers.history.includes(i);
  const ordered = [
    ...group.items.filter(isCore),
    ...group.items.filter((i) => !isCore(i) && !isHistory(i)),
    ...group.items.filter(isHistory),
  ];
  const tags = ordered.map((i) => {
    const cls = isCore(i) ? ' is-core' : isHistory(i) ? ' is-history' : '';
    return `<li><button type="button" class="skill-tag${cls}" data-tech="${escAttr(slugifyTech(i))}" aria-pressed="false">${escHtml(i)}</button></li>`;
  }).join('');
  return `      <div class="skill-category" data-reveal>
        <h3>${escHtml(t(group.category, locale, dl))}</h3>
        <ul class="skill-tags">
          ${tags}
        </ul>
      </div>`;
}

function sectionTitle(iconName, label) {
  return `<h2 class="section-title" data-reveal-word>${icon(iconName)} ${escHtml(label)}</h2>`;
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

  const roles = cv.experience.map((r) => roleBlock(r, locale, dl, copy, cv.keyBullets)).join('\n\n');
  const densityGroupLabel = `${tr(copy.densityDetailed)} / ${tr(copy.densityConcise)}`;
  const edu = cv.education.map((e) => eduBlock(e, locale, dl)).join('\n\n');
  const skills = cv.skills.map((g) => skillCategory(g, locale, dl, cv.skillTiers)).join('\n');
  const languages = cv.languages
    .map((l) => `        <li class="language-item"><span class="language-name">${escHtml(tr(l.name))}</span>`
      + `<span class="language-level">${escHtml(tr(l.level))}</span></li>`)
    .join('\n');

  const knownDescriptions = Object.entries(cv.projects.knownDescriptions)
    .map(([k, v]) => `      '${k}': '${tr(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`)
    .join(',\n');
  const jsStr = (v) => tr(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const escJs = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const otherLocale = locale === 'en' ? 'es' : 'en';
  const langSuggestGo = escJs(t(copy.langSuggestGo, otherLocale, dl));
  const langSuggestDismiss = escJs(t(copy.langSuggestDismiss, otherLocale, dl));
  const langSuggestText = escJs(t(otherLocale === 'es' ? copy.langSuggestEs : copy.langSuggestEn, otherLocale, dl));

  // Command palette: every command reuses copy or content already approved
  // and rendered elsewhere on this same page — no new user-facing wording is
  // invented here. `</script` is neutralised so the JSON can never prematurely
  // close the inline <script> block below.
  const paletteCommands = JSON.stringify([
    { id: 'about', icon: icon('user'), label: tr(copy.navAbout), action: 'jump', target: '#about' },
    { id: 'experience', icon: icon('briefcase'), label: tr(copy.navExperience), action: 'jump', target: '#experience' },
    { id: 'projects', icon: icon('github'), label: tr(copy.navProjects), action: 'jump', target: '#projects' },
    { id: 'skills', icon: icon('code'), label: tr(copy.navSkills), action: 'jump', target: '#skills' },
    { id: 'education', icon: icon('graduation'), label: tr(copy.navEducation), action: 'jump', target: '#education' },
    { id: 'cv', icon: icon('file'), label: tr(copy.navCv), action: 'jump', target: '#cv' },
    { id: 'lang', icon: icon('globe'), label: `${tr(copy.langSuggestGo)}${SEP}${otherLocale.toUpperCase()}`, action: 'lang', href: localeHref(otherLocale) },
    { id: 'theme', icon: icon('moon', 'icon-moon') + icon('sun', 'icon-sun'), label: tr(copy.toggleTheme), action: 'theme' },
    { id: 'pdf', icon: icon('download'), label: tr(copy.downloadCv), action: 'pdf' },
    { id: 'email', icon: icon('mail'), label: profile.email, action: 'email', value: profile.email },
    { id: 'linkedin', icon: icon('linkedin'), label: 'LinkedIn', action: 'open', href: profile.links.linkedin },
    { id: 'github', icon: icon('github'), label: 'GitHub', action: 'open', href: profile.links.github },
  ]).replace(/</g, '\\u003c');

  // Terminal mode: fed entirely from data already rendered elsewhere on this
  // same page — no sentence here is written fresh. whoami reuses the hero's
  // own name/role/positioning; experience reuses each role's (and client
  // engagement's) already-approved bullets and stack; skills reuses the
  // skills grid's category/items pairs; contact reuses the CV section's own
  // links. `</script` is neutralised the same way paletteCommands is.
  const terminalData = JSON.stringify({
    whoami: [profile.name, tr(profile.role), tr(profile.positioning)],
    experience: cv.experience.map((role) => ({
      company: role.company,
      position: tr(role.position),
      period: period(role, locale, { dash: DASH, separator: SEP, defaultLocale: dl }),
      bullets: t(role.bullets, locale, dl),
      stack: role.stack || [],
      engagements: (role.engagements || []).map((eng) => ({
        client: eng.client,
        period: `${tr(eng.start)} ${DASH} ${tr(eng.end)}`,
        bullets: t(eng.bullets, locale, dl),
        stack: eng.stack || [],
      })),
    })),
    skills: cv.skills.map((g) => ({ category: tr(g.category), items: g.items })),
    projectsNote: tr(copy.projectsNote),
    githubUrl: profile.links.github,
    contact: {
      email: profile.email,
      location: tr(profile.location),
      linkedin: profile.links.linkedin,
      github: profile.links.github,
    },
  }).replace(/</g, '\\u003c');

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
  <meta name="theme-color" content="${meta.themeColor.light}" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="${meta.themeColor.dark}" media="(prefers-color-scheme: dark)" />
  <link rel="canonical" href="${canonical}" />
${alternates}

  <link rel="icon" type="image/png" sizes="32x32" href="${asset('assets/favicon-32.png')}" />
  <link rel="apple-touch-icon" sizes="180x180" href="${asset('assets/favicon-180.png')}" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

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
  <canvas class="hero-ambient" aria-hidden="true"></canvas>
  <div class="hero-content">
    <img class="hero-photo" src="${asset(profile.photo.src)}" alt="${escAttr(tr(profile.photo.alt))}" width="${profile.photo.width}" height="${profile.photo.height}" />
    <div class="hero-text">
      <h1 class="name">${escHtml(profile.name)}</h1>
      <p class="role-label">${escHtml(tr(profile.role))}</p>
      <div class="hero-accent" aria-hidden="true"></div>
      <p class="hero-positioning">${escHtml(tr(profile.positioning))}</p>
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
    <div class="density-toggle" role="group" aria-label="${escAttr(densityGroupLabel)}">
      <button type="button" class="density-option" data-density="detailed" aria-pressed="true">${escHtml(tr(copy.densityDetailed))}</button>
      <button type="button" class="density-option" data-density="concise" aria-pressed="false">${escHtml(tr(copy.densityConcise))}</button>
    </div>

    <div class="timeline">
      <div class="timeline-rail" aria-hidden="true"></div>
      <div class="timeline-progress" aria-hidden="true"></div>
${roles}
    </div>
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
          <button type="button" id="printCvBtn" class="btn btn-tertiary">${escHtml(tr(copy.printPage))}</button>
        </div>
        <ul class="contact-list">
          <li>${icon('mail')} <a href="mailto:${profile.email}">${escHtml(profile.email)}</a></li>
          <li class="contact-location">${icon('pin')} ${escHtml(tr(profile.location))}</li>
          <li>${icon('linkedin')} <a href="${profile.links.linkedin}" target="_blank" rel="noopener">LinkedIn</a></li>
          <li>${icon('github')} <a href="${profile.links.github}" target="_blank" rel="noopener">GitHub</a></li>
        </ul>
        <p class="cv-note">${escHtml(tr(copy.cvNote))}</p>
        <p class="cv-note">${escHtml(tr(copy.dataFormatsLead))} <a href="${asset('cv.json')}">${escHtml(tr(copy.dataFormatJson))}</a> · <a href="${asset('cv.txt')}">${escHtml(tr(copy.dataFormatTxt))}</a></p>
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

<button type="button" id="clearTechFilter" class="clear-filter" hidden>${escHtml(tr(copy.clearFilter))}</button>

<script>
  (function() {
    try {
      console.log('%c  ^   ^\\n / \\\\ / \\\\', 'color:#7A5B2E;font-family:monospace;');
      console.log('This entire site and its PDF are generated from a single content/cv.json.');
      console.log('https://github.com/britoruben/RubenBrito-CV');
    } catch (e) {}
  })();

  (function() {
    var yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  })();

  (function() {
    var btn = document.getElementById('printCvBtn');
    if (!btn) return;
    btn.addEventListener('click', function() { window.print(); });
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
    var langLinks = Array.prototype.slice.call(document.querySelectorAll('.lang-option'));
    if (!langLinks.length) return;
    langLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        var hash = window.location.hash;
        if (!hash) return;
        var href = link.getAttribute('href');
        if (href.indexOf('#') !== -1) return;
        link.setAttribute('href', href + hash);
      });
    });
  })();

  (function() {
    try {
      var otherLocale = '${otherLocale}';
      var nav = navigator.language || navigator.userLanguage || '';
      if (nav.toLowerCase().indexOf(otherLocale) !== 0) return;
      var KEY = 'langSuggestDismissed';
      if (localStorage.getItem(KEY) === otherLocale) return;
      var banner = document.createElement('div');
      banner.className = 'lang-suggest';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', '${langSuggestGo}');
      var text = document.createElement('span');
      text.textContent = '${langSuggestText}';
      var actions = document.createElement('div');
      actions.className = 'lang-suggest-actions';
      var go = document.createElement('a');
      go.className = 'lang-suggest-go';
      go.href = '${localeHref(otherLocale)}';
      go.textContent = '${langSuggestGo}';
      var dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'lang-suggest-dismiss';
      dismiss.textContent = '${langSuggestDismiss}';
      dismiss.addEventListener('click', function() {
        try { localStorage.setItem(KEY, otherLocale); } catch (e) {}
        banner.remove();
      });
      actions.appendChild(go);
      actions.appendChild(dismiss);
      banner.appendChild(text);
      banner.appendChild(actions);
      document.querySelector('.topnav').insertAdjacentElement('afterend', banner);
    } catch (e) {}
  })();

  (function() {
    try {
      var contactList = document.querySelector('.contact-list');
      var locationLi = document.querySelector('.contact-list .contact-location');
      if (!contactList || !locationLi) return;

      var localTimeLabel = '${jsStr(copy.localTime)}';
      var locale = '${locale}';
      var interval = null;

      function updateLocalTime() {
        var dtf = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
          timeZone: 'Europe/Madrid',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        var timeStr = dtf.format(new Date());
        var timeSpan = document.getElementById('localTimeValue');
        if (timeSpan) timeSpan.textContent = timeStr;
      }

      function startInterval() {
        if (interval) return;
        updateLocalTime();
        interval = setInterval(updateLocalTime, 60000);
      }

      function stopInterval() {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }

      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          stopInterval();
        } else {
          startInterval();
        }
      });

      var li = document.createElement('li');
      var span = document.createElement('span');
      span.id = 'localTimeValue';
      li.appendChild(span);
      var label = document.createElement('span');
      label.textContent = ' ' + localTimeLabel;
      li.appendChild(label);
      locationLi.parentNode.insertBefore(li, locationLi.nextSibling);

      startInterval();
    } catch (e) {}
  })();

  // Reflects the current view in the URL (?view=, ?tech=) via replaceState, so
  // it never adds to the back-stack. Shared by the density toggle and the
  // technology filter below. Both reads and writes fail silently: the URL is
  // a convenience layer only, never a requirement.
  function updateQueryParam(key, value) {
    try {
      var url = new URL(window.location.href);
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function readQueryParam(key) {
    try {
      return new URLSearchParams(window.location.search).get(key);
    } catch (e) {
      return null;
    }
  }

  (function() {
    var group = document.querySelector('.density-toggle');
    var section = document.getElementById('experience');
    if (!group || !section) return;
    var buttons = Array.prototype.slice.call(group.querySelectorAll('.density-option'));
    if (!buttons.length) return;
    var KEY = 'densityView';

    function setView(view, persist) {
      var concise = view === 'concise';
      section.classList.toggle('is-concise', concise);
      var secondary = Array.prototype.slice.call(section.querySelectorAll('.is-secondary'));
      secondary.forEach(function(li) {
        // A collapsed bullet can contain technology-filter buttons (the
        // "Stack: ..." line). Pull them out of the tab order while hidden so
        // a keyboard user never lands on an invisible control.
        var techButtons = Array.prototype.slice.call(li.querySelectorAll('[data-tech]'));
        if (concise) {
          li.setAttribute('aria-hidden', 'true');
          techButtons.forEach(function(b) { b.setAttribute('tabindex', '-1'); });
        } else {
          li.removeAttribute('aria-hidden');
          techButtons.forEach(function(b) { b.removeAttribute('tabindex'); });
        }
      });
      buttons.forEach(function(btn) {
        var active = btn.getAttribute('data-density') === view;
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (persist) {
        try { localStorage.setItem(KEY, view); } catch (e) {}
      }
      updateQueryParam('view', concise ? 'concise' : null);
    }

    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        setView(btn.getAttribute('data-density'), true);
      });
    });

    var urlView = readQueryParam('view');
    if (urlView === 'concise' || urlView === 'detailed') {
      setView(urlView, false);
    } else {
      try {
        var saved = localStorage.getItem(KEY);
        if (saved === 'concise' || saved === 'detailed') setView(saved, false);
      } catch (e) {}
    }
  })();

  // Technology filter: clicking a skill pill or a "Stack: ..." entry marks
  // every matching [data-tech] element across the page and dims (not
  // removes) the role blocks, client engagements and skill categories that
  // do not mention it. A second click on the same technology, the Clear
  // filter button, or Escape all clear it.
  (function() {
    var techEls = Array.prototype.slice.call(document.querySelectorAll('[data-tech]'));
    if (!techEls.length) return;
    var clearBtn = document.getElementById('clearTechFilter');
    var SCOPES = '.role-block, .engagement, .skill-category';
    var activeSlug = null;

    function applyFilter(slug, persistUrl) {
      activeSlug = slug || null;
      techEls.forEach(function(el) {
        var match = !!activeSlug && el.getAttribute('data-tech') === activeSlug;
        el.setAttribute('aria-pressed', match ? 'true' : 'false');
        el.classList.toggle('tech-match', match);
      });
      var scopes = Array.prototype.slice.call(document.querySelectorAll(SCOPES));
      scopes.forEach(function(scope) {
        var dim = !!activeSlug && !scope.querySelector('[data-tech="' + activeSlug + '"]');
        scope.classList.toggle('is-dimmed', dim);
      });
      document.body.classList.toggle('tech-filter-active', !!activeSlug);
      if (clearBtn) clearBtn.hidden = !activeSlug;
      if (persistUrl) updateQueryParam('tech', activeSlug);
    }

    techEls.forEach(function(el) {
      el.addEventListener('click', function() {
        var slug = el.getAttribute('data-tech');
        applyFilter(activeSlug === slug ? null : slug, true);
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function() { applyFilter(null, true); });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && activeSlug) applyFilter(null, true);
    });

    var urlTech = readQueryParam('tech');
    if (urlTech && techEls.some(function(el) { return el.getAttribute('data-tech') === urlTech; })) {
      applyFilter(urlTech, false);
    }
  })();

  // Command palette. Every command reuses a destination or an action already
  // reachable elsewhere on the page (the nav links, the theme toggle, the PDF
  // download, the contact links) — nothing here states anything new. Entirely
  // JS-created: with JavaScript disabled neither the trigger nor the dialog
  // exist in the DOM, so nothing renders and nothing breaks.
  (function() {
    var COMMANDS = ${paletteCommands};
    var navTools = document.querySelector('.nav-tools');
    if (!navTools || !COMMANDS.length) return;

    var PLACEHOLDER = '${jsStr(copy.palettePlaceholder)}';
    var HINT = '${jsStr(copy.paletteHint)}';
    var EMPTY = '${jsStr(copy.paletteEmpty)}';
    var COPIED = '${jsStr(copy.paletteCopied)}';

    var status = document.createElement('span');
    status.className = 'sr-only';
    status.setAttribute('aria-live', 'polite');
    document.body.appendChild(status);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'palette-trigger';
    trigger.setAttribute('aria-label', HINT);
    trigger.innerHTML = '<kbd>Ctrl</kbd><kbd>K</kbd>';
    navTools.insertBefore(trigger, navTools.firstChild);

    var overlay = null;
    var input = null;
    var list = null;
    var filtered = COMMANDS;
    var activeIndex = 0;
    var opener = null;

    function runCommand(cmd) {
      if (cmd.action === 'jump') {
        window.location.hash = cmd.target;
      } else if (cmd.action === 'theme') {
        var themeBtn = document.getElementById('themeToggle');
        if (themeBtn) themeBtn.click();
      } else if (cmd.action === 'pdf') {
        var pdfLink = document.querySelector('a[download]');
        if (pdfLink) pdfLink.click();
      } else if (cmd.action === 'email') {
        try {
          navigator.clipboard.writeText(cmd.value).then(function() {
            status.textContent = COPIED;
          }).catch(function() {});
        } catch (e) {}
      } else if (cmd.action === 'lang') {
        var hash = window.location.hash;
        var href = cmd.href;
        if (hash && href.indexOf('#') === -1) href += hash;
        window.location.href = href;
      } else if (cmd.action === 'open') {
        window.open(cmd.href, '_blank', 'noopener');
      }
      closePalette();
    }

    function renderList() {
      list.innerHTML = '';
      if (!filtered.length) {
        var empty = document.createElement('li');
        empty.className = 'palette-empty';
        empty.textContent = EMPTY;
        list.appendChild(empty);
        input.removeAttribute('aria-activedescendant');
        return;
      }
      filtered.forEach(function(cmd, i) {
        var li = document.createElement('li');
        li.id = 'palette-opt-' + cmd.id;
        li.setAttribute('role', 'option');
        li.className = 'palette-option' + (i === activeIndex ? ' is-active' : '');
        li.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
        var iconWrap = document.createElement('span');
        iconWrap.className = 'palette-option-icon';
        iconWrap.innerHTML = cmd.icon; // trusted, build-time SVG from icons.mjs
        var labelSpan = document.createElement('span');
        labelSpan.textContent = cmd.label;
        li.appendChild(iconWrap);
        li.appendChild(labelSpan);
        li.addEventListener('mousedown', function(e) {
          e.preventDefault();
          runCommand(cmd);
        });
        list.appendChild(li);
      });
      input.setAttribute('aria-activedescendant', 'palette-opt-' + filtered[activeIndex].id);
    }

    function setActive(i) {
      if (!filtered.length) return;
      activeIndex = (i + filtered.length) % filtered.length;
      renderList();
    }

    function filterCommands(query) {
      var q = query.trim().toLowerCase();
      filtered = q ? COMMANDS.filter(function(c) { return c.label.toLowerCase().indexOf(q) !== -1; }) : COMMANDS;
      activeIndex = 0;
      renderList();
    }

    function openPalette() {
      if (overlay) return;
      opener = document.activeElement;

      overlay = document.createElement('div');
      overlay.className = 'palette-overlay';
      overlay.addEventListener('mousedown', function(e) {
        if (e.target === overlay) closePalette();
      });

      var dialog = document.createElement('div');
      dialog.className = 'palette';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', PLACEHOLDER);

      input = document.createElement('input');
      input.type = 'text';
      input.className = 'palette-input';
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-expanded', 'true');
      input.setAttribute('aria-controls', 'paletteList');
      input.setAttribute('aria-autocomplete', 'list');
      input.placeholder = PLACEHOLDER;
      input.addEventListener('input', function() { filterCommands(input.value); });

      list = document.createElement('ul');
      list.id = 'paletteList';
      list.className = 'palette-list';
      list.setAttribute('role', 'listbox');

      dialog.appendChild(input);
      dialog.appendChild(list);
      overlay.appendChild(dialog);

      dialog.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closePalette();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActive(activeIndex + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive(activeIndex - 1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filtered[activeIndex]) runCommand(filtered[activeIndex]);
        } else if (e.key === 'Tab') {
          // The input is the only focusable control while the dialog is
          // open, so trapping focus is just refusing to let it leave.
          e.preventDefault();
        }
      });

      document.body.appendChild(overlay);
      filterCommands('');
      input.focus();
    }

    function closePalette() {
      if (!overlay) return;
      overlay.remove();
      overlay = null;
      input = null;
      list = null;
      if (opener && typeof opener.focus === 'function') opener.focus();
      opener = null;
    }

    trigger.addEventListener('click', function() {
      if (overlay) closePalette();
      else openPalette();
    });

    document.addEventListener('keydown', function(e) {
      var key = e.key ? e.key.toLowerCase() : '';
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        if (overlay) closePalette();
        else openPalette();
      }
    });
  })();

  // Terminal mode: a small console overlay layered over the normal page,
  // never replacing it as the entry point. Entirely JS-created, like the
  // command palette above — with JavaScript disabled neither the trigger nor
  // the dialog exist in the DOM, so nothing renders and nothing breaks.
  // Every command's output is read from DATA, computed at generation time
  // from the exact same content/cv.json fields the rest of the page renders
  // — this never states a fact the page does not already state.
  (function() {
    var navTools = document.querySelector('.nav-tools');
    if (!navTools) return;

    var DATA = ${terminalData};
    var COMMANDS = ['help', 'whoami', 'experience', 'skills', 'projects', 'cv', 'contact', 'clear', 'exit'];
    var OPEN_LABEL = '${jsStr(copy.terminalOpen)}';
    var HINT = '${jsStr(copy.terminalHint)}';
    var UNKNOWN = '${jsStr(copy.terminalUnknown)}';
    var CLOSE_LABEL = '${jsStr(copy.terminalClose)}';
    var CV_LABEL = '${jsStr(copy.downloadCv)}';
    var STACK_LABEL = '${jsStr(copy.stackLabel)}';
    var EMAIL_LABEL = '${jsStr(copy.emailLabel)}';
    var LOCATION_LABEL = '${jsStr(copy.locationLabel)}';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'terminal-trigger';
    trigger.setAttribute('aria-label', OPEN_LABEL);
    trigger.innerHTML = '<kbd>~</kbd>';
    navTools.appendChild(trigger);

    var overlay = null;
    var output = null;
    var input = null;
    var closeBtn = null;
    var opener = null;
    var history = [];
    var histIndex = 0;

    function isEditable(el) {
      if (!el) return false;
      var tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    }

    function scrollOutput() {
      output.scrollTop = output.scrollHeight;
    }

    function printLine(text) {
      var line = document.createElement('div');
      line.className = 'terminal-line';
      line.textContent = text;
      output.appendChild(line);
    }

    function printEcho(raw) {
      var line = document.createElement('div');
      line.className = 'terminal-line terminal-line-echo';
      var p = document.createElement('span');
      p.className = 'terminal-prompt-inline';
      p.setAttribute('aria-hidden', 'true');
      p.textContent = '> ';
      line.appendChild(p);
      line.appendChild(document.createTextNode(raw));
      output.appendChild(line);
    }

    function runCommand(raw) {
      printEcho(raw);
      var cmd = raw.trim();
      if (cmd) {
        history.push(raw);
        histIndex = history.length;
      }
      var key = cmd.toLowerCase();
      if (!cmd) {
        // empty line: nothing to run
      } else if (key === 'help') {
        printLine(COMMANDS.join(', '));
      } else if (key === 'whoami') {
        DATA.whoami.forEach(function(line) { printLine(line); });
      } else if (key === 'experience') {
        DATA.experience.forEach(function(role, i) {
          if (i > 0) printLine('');
          printLine(role.company + ' - ' + role.position + ' (' + role.period + ')');
          role.bullets.forEach(function(b) { printLine('- ' + b); });
          if (role.stack.length) printLine(STACK_LABEL + ': ' + role.stack.join(', '));
          role.engagements.forEach(function(eng) {
            printLine('  ' + eng.client + ' (' + eng.period + ')');
            eng.bullets.forEach(function(b) { printLine('  - ' + b); });
            if (eng.stack.length) printLine('  ' + STACK_LABEL + ': ' + eng.stack.join(', '));
          });
        });
      } else if (key === 'skills') {
        DATA.skills.forEach(function(g) { printLine(g.category + ': ' + g.items.join(', ')); });
      } else if (key === 'projects') {
        printLine(DATA.projectsNote);
        printLine(DATA.githubUrl);
      } else if (key === 'cv') {
        printLine(CV_LABEL);
        var pdfLink = document.querySelector('a[download]');
        if (pdfLink) pdfLink.click();
      } else if (key === 'contact') {
        printLine(EMAIL_LABEL + ': ' + DATA.contact.email);
        printLine(LOCATION_LABEL + ': ' + DATA.contact.location);
        printLine('LinkedIn: ' + DATA.contact.linkedin);
        printLine('GitHub: ' + DATA.contact.github);
      } else if (key === 'clear') {
        output.innerHTML = '';
      } else if (key === 'exit') {
        closeTerminal();
        return;
      } else {
        printLine(UNKNOWN);
      }
      scrollOutput();
    }

    function openTerminal() {
      if (overlay) return;
      opener = document.activeElement;

      overlay = document.createElement('div');
      overlay.className = 'terminal-overlay';
      overlay.addEventListener('mousedown', function(e) {
        if (e.target === overlay) closeTerminal();
      });

      var dialog = document.createElement('div');
      dialog.className = 'terminal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', OPEN_LABEL);

      var header = document.createElement('div');
      header.className = 'terminal-header';
      var title = document.createElement('span');
      title.className = 'terminal-title';
      title.textContent = OPEN_LABEL;
      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'terminal-close';
      closeBtn.setAttribute('aria-label', CLOSE_LABEL);
      closeBtn.textContent = String.fromCharCode(215);
      closeBtn.addEventListener('click', closeTerminal);
      header.appendChild(title);
      header.appendChild(closeBtn);

      output = document.createElement('div');
      output.className = 'terminal-output';
      output.setAttribute('role', 'log');
      output.setAttribute('aria-live', 'polite');

      var inputRow = document.createElement('div');
      inputRow.className = 'terminal-input-row';
      var promptEl = document.createElement('span');
      promptEl.className = 'terminal-prompt-inline';
      promptEl.setAttribute('aria-hidden', 'true');
      promptEl.textContent = '>';
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'terminal-input';
      input.setAttribute('aria-label', OPEN_LABEL);
      input.placeholder = HINT;
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('spellcheck', 'false');
      inputRow.appendChild(promptEl);
      inputRow.appendChild(input);

      dialog.appendChild(header);
      dialog.appendChild(output);
      dialog.appendChild(inputRow);
      overlay.appendChild(dialog);

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var val = input.value;
          input.value = '';
          runCommand(val);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (histIndex > 0) {
            histIndex -= 1;
            input.value = history[histIndex];
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (histIndex < history.length - 1) {
            histIndex += 1;
            input.value = history[histIndex];
          } else {
            histIndex = history.length;
            input.value = '';
          }
        }
      });

      dialog.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeTerminal();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          if (document.activeElement === input) closeBtn.focus();
          else input.focus();
        }
      });

      document.body.appendChild(overlay);
      input.focus();
    }

    function closeTerminal() {
      if (!overlay) return;
      overlay.remove();
      overlay = null;
      output = null;
      input = null;
      closeBtn = null;
      if (opener && typeof opener.focus === 'function') opener.focus();
      opener = null;
    }

    trigger.addEventListener('click', function() {
      if (overlay) closeTerminal();
      else openTerminal();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === '~' && !isEditable(e.target)) {
        e.preventDefault();
        if (overlay) closeTerminal();
        else openTerminal();
      }
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

  // Ambient contour-line background for the hero only: canvas 2D, no
  // library. .hero provides the positioning context and clipped overflow;
  // this layer sits behind .hero-content and never receives pointer events.
  // The canvas ships empty in the generated markup, so with JavaScript
  // disabled — or if anything here bails out early — the hero looks exactly
  // as it does without this script.
  (function() {
    var hero = document.getElementById('top');
    var canvas = hero ? hero.querySelector('.hero-ambient') : null;
    if (!hero || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var LINE_COUNT = 10;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var width = 0;
    var height = 0;
    var elapsed = 0;
    var lastTime = null;
    var rafId = null;

    // Subtle pointer-reactive parallax: driftX/driftY ease toward whatever
    // the pointer last set as a target while over .hero, and ease back to 0
    // on mouseleave. Only frame() ever advances them, so with reduced motion
    // (frame() never runs) they stay at 0 and draw() below is a no-op change
    // from before this feature existed.
    var DRIFT_MAX = 14; // px of offset at the hero's edge, desktop scale
    var DRIFT_EASE = 0.06;
    var driftX = 0;
    var driftY = 0;
    var driftTargetX = 0;
    var driftTargetY = 0;

    var lines = [];
    for (var i = 0; i < LINE_COUNT; i++) {
      lines.push({
        baseY: (i + 0.5) / LINE_COUNT,
        amp1: 10 + (i % 4) * 6,
        freq1: 0.006 + (i % 3) * 0.0018,
        phase1: i * 0.9,
        speed1: 0.00002 + (i % 5) * 0.000006,
        amp2: 5 + (i % 3) * 4,
        freq2: 0.014 + (i % 4) * 0.003,
        phase2: i * 1.7,
        speed2: -0.000015 - (i % 4) * 0.000005
      });
    }

    // Resolved from the current theme rather than read from the CSS custom
    // property, so a stalled/backgrounded-tab redraw or a toggle mid-loop
    // never has to touch the DOM more than the one click listener below.
    function strokeRgb() {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? '79, 192, 174' : '14, 79, 73';
    }

    function draw(t) {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      var rgb = strokeRgb();
      var step = 6;
      lines.forEach(function(line, idx) {
        var alpha = 0.05 + (idx % 3) * 0.02;
        ctx.beginPath();
        for (var x = 0; x <= width; x += step) {
          var y = line.baseY * height
            + Math.sin(x * line.freq1 + line.phase1 + t * line.speed1 + driftX * 0.01) * line.amp1
            + Math.sin(x * line.freq2 + line.phase2 + t * line.speed2 - driftX * 0.008) * line.amp2
            + driftY * (0.4 + (idx % 3) * 0.3);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(' + rgb + ', ' + alpha + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(elapsed);
    }

    function frame(now) {
      if (lastTime === null) lastTime = now;
      var dt = Math.min(now - lastTime, 100);
      lastTime = now;
      elapsed += dt;
      driftX += (driftTargetX - driftX) * DRIFT_EASE;
      driftY += (driftTargetY - driftY) * DRIFT_EASE;
      draw(elapsed);
      rafId = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (reduced || rafId !== null) return;
      lastTime = null;
      rafId = requestAnimationFrame(frame);
    }

    function stopLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    var heroVisible = true;
    var pageVisible = !document.hidden;

    function sync() {
      if (reduced) return;
      if (heroVisible && pageVisible) startLoop(); else stopLoop();
    }

    resize();

    if ('ResizeObserver' in window) {
      new ResizeObserver(resize).observe(hero);
    } else {
      window.addEventListener('resize', resize);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) { heroVisible = entry.isIntersecting; });
        sync();
      }, { threshold: 0 }).observe(hero);
    }

    document.addEventListener('visibilitychange', function() {
      pageVisible = !document.hidden;
      sync();
    });

    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', function() { draw(elapsed); });

    // "The page notices you": the lines drift very slightly toward the
    // pointer while it's over the hero, and ease back to rest on leave.
    // Scoped to .hero rather than window, so it never fires on touch
    // devices (no mousemove there) and never fights the resize/visibility
    // pause logic above -- driftX/driftY simply stop advancing whenever
    // frame() isn't running.
    hero.addEventListener('mousemove', function(e) {
      var rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      var ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      driftTargetX = nx * DRIFT_MAX;
      driftTargetY = ny * DRIFT_MAX;
    });
    hero.addEventListener('mouseleave', function() {
      driftTargetX = 0;
      driftTargetY = 0;
    });

    // Reduced motion: draw the single deterministic frame at t=0 above (via
    // resize()) and never start the rAF loop — sync() short-circuits before
    // startLoop() in every path, including this initial call.
    sync();
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

  // Motion base: one shared IntersectionObserver drives both the
  // element-group reveal ([data-reveal], its direct children staggered) and
  // the per-word heading reveal ([data-reveal-word], the name and every
  // section title). Elements start fully visible in CSS and are only hidden
  // once this runs — with motion allowed and JavaScript on — so a no-JS or
  // reduced-motion reader sees every word and every child immediately, in
  // document order, exactly as before.
  (function() {
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    var headings = Array.prototype.slice.call(document.querySelectorAll('[data-reveal-word]'));
    if (!groups.length && !headings.length) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('reveal-ready');

    var MAX_STAGGER = 6;

    // Splits only the TEXT nodes of a heading into per-word spans, leaving any
    // element node (a section's icon) untouched and in its original position.
    // The heading's full original text becomes its aria-label, so the
    // accessible name and reading order are exactly what they were before the
    // split — if that guarantee ever looked shaky for some future heading
    // shape, the fix is to skip splitting it, not to ship a broken name.
    function splitHeadingWords(el) {
      var original = el.textContent.trim();
      if (!original) return;
      var frag = document.createDocumentFragment();
      var wordIndex = 0;
      Array.prototype.slice.call(el.childNodes).forEach(function(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent.split(/(\\s+)/).forEach(function(part) {
            if (!part) return;
            if (!part.trim()) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            var span = document.createElement('span');
            span.className = 'word-reveal';
            span.setAttribute('aria-hidden', 'true');
            span.style.setProperty('--i', Math.min(wordIndex, 10));
            span.textContent = part;
            frag.appendChild(span);
            wordIndex += 1;
          });
        } else {
          frag.appendChild(node);
        }
      });
      el.setAttribute('aria-label', original);
      el.textContent = '';
      el.appendChild(frag);
    }

    function stageChildren(el) {
      Array.prototype.slice.call(el.children).forEach(function(child, i) {
        child.style.setProperty('--stagger-i', Math.min(i, MAX_STAGGER));
      });
    }

    groups.forEach(stageChildren);
    headings.forEach(splitHeadingWords);

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    groups.forEach(function(item) { observer.observe(item); });
    headings.forEach(function(item) { observer.observe(item); });
  })();

  // Experience timeline: the rail and each role's dot/year marker are plain
  // CSS and markup, so they read the same with JavaScript disabled. This
  // IIFE only drives the extra progress fill, a compositor-only scaleY
  // transform kept in sync with scroll position by one shared, rAF-throttled
  // listener — it never touches a layout property.
  (function() {
    var timeline = document.querySelector('.timeline');
    var fill = timeline ? timeline.querySelector('.timeline-progress') : null;
    var roleBlocks = timeline ? Array.prototype.slice.call(timeline.querySelectorAll('.role-block')) : [];
    if (!timeline || !fill || roleBlocks.length < 2) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var lineStart = 0;
    var lineEnd = 0;
    var ticking = false;

    // Matches the CSS inset on .timeline-rail/.timeline-progress (top: 8px,
    // bottom: 8px) exactly, so the fill overlays the rail pixel-for-pixel
    // rather than needing separate per-dot geometry.
    function measure() {
      var rect = timeline.getBoundingClientRect();
      var top = rect.top + window.pageYOffset;
      lineStart = top + 8;
      lineEnd = top + rect.height - 8;
    }

    function update() {
      ticking = false;
      var anchor = window.pageYOffset + window.innerHeight * 0.5;
      var range = lineEnd - lineStart;
      var p = range > 0 ? (anchor - lineStart) / range : 0;
      p = Math.min(1, Math.max(0, p));
      fill.style.transform = 'scaleY(' + p + ')';
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    function onResize() {
      measure();
      update();
    }

    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // Also catches role-block height changes from the density toggle
    // collapsing/expanding secondary bullets, without any extra wiring.
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(timeline);
  })();

  // These live at script scope (not inside either IIFE below) because
  // timeAgo() is called from two separate, sibling IIFEs (the projects
  // loader and the build-status loader) — var-scoping them inside just one
  // would leave the other unable to see them and throw a ReferenceError.
  var TIME_AGO_TODAY = '${jsStr(copy.timeAgoToday)}';
  var TIME_AGO_ONE_DAY = '${jsStr(copy.timeAgoOneDay)}';
  var TIME_AGO_DAYS = '${jsStr(copy.timeAgoDays)}';
  var TIME_AGO_ONE_MONTH = '${jsStr(copy.timeAgoOneMonth)}';
  var TIME_AGO_MONTHS = '${jsStr(copy.timeAgoMonths)}';
  var TIME_AGO_ONE_YEAR = '${jsStr(copy.timeAgoOneYear)}';
  var TIME_AGO_YEARS = '${jsStr(copy.timeAgoYears)}';

  function timeAgo(dateStr) {
    var days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days < 1) return TIME_AGO_TODAY;
    if (days === 1) return TIME_AGO_ONE_DAY;
    if (days < 30) return TIME_AGO_DAYS.replace('{n}', days);
    var months = Math.floor(days / 30);
    if (months < 12) return months === 1 ? TIME_AGO_ONE_MONTH : TIME_AGO_MONTHS.replace('{n}', months);
    var years = Math.floor(months / 12);
    return years === 1 ? TIME_AGO_ONE_YEAR : TIME_AGO_YEARS.replace('{n}', years);
  }

  (function() {
    var GITHUB_USER = '${cv.projects.githubUser}';
    var MAX_REPOS = ${cv.projects.maxRepos};
    var REQUIRE_DESCRIPTION = ${cv.projects.requireDescription};
    var EXCLUDE = ${JSON.stringify(cv.projects.exclude)};
    var KNOWN_DESCRIPTIONS = {
${knownDescriptions}
    };
    var PROJECT_UPDATED_LABEL = '${jsStr(copy.projectUpdated)}';

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str == null ? '' : str;
      return div.innerHTML;
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
          + '<span class="project-stat">' + PROJECT_UPDATED_LABEL + ' ' + timeAgo(repo.pushed_at) + '</span></div>'
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

  (function() {
    var API_URL = 'https://api.github.com/repos/britoruben/RubenBrito-CV/actions/workflows/compile-latex.yml/runs?per_page=1&status=success';
    fetch(API_URL)
      .then(function(res) {
        if (!res.ok) throw new Error('build status unavailable');
        return res.json();
      })
      .then(function(data) {
        var run = data && data.workflow_runs && data.workflow_runs[0];
        if (!run || !run.conclusion || !run.html_url || !run.updated_at) return;
        var note = document.querySelector('.cv-note');
        if (!note || !note.parentNode) return;
        var p = document.createElement('p');
        p.className = 'build-status';
        var a = document.createElement('a');
        a.href = run.html_url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = '${jsStr(copy.buildStatusLabel)}' + ' — ' + run.conclusion + ', ' + timeAgo(run.updated_at);
        p.appendChild(a);
        note.parentNode.insertBefore(p, note.nextSibling);
      })
      .catch(function() { /* progressive enhancement: render nothing on failure */ });
  })();
</script>

</body>
</html>
`;
}
