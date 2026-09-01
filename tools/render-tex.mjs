import { readFileSync } from 'node:fs';
import { t, escTex, period } from './lib.mjs';

const DASH = '--';
const SEP = ', ';

const SECTION_ICONS = {
  summary: '\\faUser',
  experience: '\\faBriefcase',
  education: '\\faGraduationCap',
  skills: '\\faCode',
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function sectionHead(key, title) {
  return `\\phantomsection\\pdfbookmark[1]{${title}}{sec:${slug(title)}}
\\section{${SECTION_ICONS[key]}~~\\MakeUppercase{${title}}}
\\vspace{-0.4mm}`;
}

function badges(stack) {
  return stack.map((s) => `\\venuebadge{${escTex(s)}}`).join(' ');
}

function roleEntry(role, locale, dl, isLast) {
  const tr = (v) => t(v, locale, dl);
  const items = tr(role.bullets).map((b) => `      \\item ${escTex(b)}`);
  if (role.stack?.length) items.push(`      \\item ${badges(role.stack)}`);
  const divider = isLast ? '' : '\n      \\entryDivider';
  return `  \\begin{samepage}
  \\resumeSubheading
      {${escTex(role.company)}}{${escTex(tr(role.position))}}{${escTex(period(role, locale, { dash: DASH, separator: SEP, defaultLocale: dl }))}}
      \\resumeItemListStart
${items.join('\n')}
      \\resumeItemListEnd
      \\end{samepage}${divider}`;
}

function eduEntry(edu, locale, dl) {
  const tr = (v) => t(v, locale, dl);
  return `\\begin{samepage}
\\resumeEduheading
{${escTex(edu.school)}}{}
{${escTex(tr(edu.qualification))}}{${escTex(`${edu.start} ${DASH} ${edu.end}`)}}
\\resumeItemListStart
\\item ${escTex(tr(edu.note))}
\\resumeItemListEnd
\\end{samepage}`;
}

export function renderTex(cv, locale = cv.meta.defaultLocale, preamblePath) {
  const dl = cv.meta.defaultLocale;
  const tr = (v) => t(v, locale, dl);
  const { profile } = cv;
  const S = cv.pdf.sections;

  const preamble = readFileSync(preamblePath, 'utf8')
    .replace('{{PDF_TITLE}}', tr(profile.title))
    .replace('{{PDF_AUTHOR}}', profile.name)
    .replace('{{PDF_SUBJECT}}', cv.pdf.subject)
    .replace('{{PDF_KEYWORDS}}', cv.pdf.keywords)
    .replace('{{PDF_LANG}}', locale === 'es' ? 'es-ES' : 'en-US');

  const roles = cv.experience
    .map((r, i) => roleEntry(r, locale, dl, i === cv.experience.length - 1))
    .join('\n\n');

  const edu = cv.education.map((e) => eduEntry(e, locale, dl)).join('\n\n');

  const skills = cv.skills
    .map((g) => `\\resumeItem{${escTex(t(g.category, locale, dl))}}{${escTex(g.items.join(', '))}}`)
    .join('\n');

  return `% GENERATED FILE - do not edit by hand.
% Content lives in content/cv.json; the preamble in tools/preamble.tex.
% Regenerate with: npm run build
${preamble}

% Header
\\begin{center}
    {\\Huge\\textbf{\\color{primaryColor}${escTex(profile.name)}}}
\\end{center}
\\vspace{-4mm}

\\begin{center}
    {\\small\\color{mutedGray}${escTex(tr(profile.pdfHeadline))}}
\\end{center}
\\vspace{-3mm}

\\begin{center}
    \\small{
    \\accIcon{\\faEnvelope}{Email:}~\\href{mailto:${profile.email}}{${escTex(profile.email)}}~$\\cdot$~\\accIcon{\\faMapMarker}{Location:}~${escTex(tr(profile.location))}
    }
\\end{center}
\\vspace{-3mm}

\\begin{center}
    \\small{
    \\accIcon{\\faLinkedin}{LinkedIn:}~\\href{${profile.links.linkedin}}{LinkedIn}~$\\cdot$~\\accIcon{\\faGithub}{GitHub:}~\\href{${profile.links.github}}{GitHub}~$\\cdot$~\\accIcon{\\faGlobe}{Portfolio:}~\\href{${cv.meta.siteUrl}}{Portfolio}
    }
\\end{center}

\\vspace{-3mm}

${sectionHead('summary', tr(S.summary))}
${escTex(tr(cv.summary))}
\\vspace{-4mm}

${sectionHead('experience', tr(S.experience))}
  \\resumeSubHeadingListStart

${roles}

  \\resumeSubHeadingListEnd
\\vspace{-6mm}

${sectionHead('education', tr(S.education))}
\\resumeSubHeadingListStart

${edu}

\\resumeSubHeadingListEnd
\\vspace{-6mm}

${sectionHead('skills', tr(S.skills))}
\\resumeSubHeadingListStart
${skills}
\\resumeSubHeadingListEnd

\\end{document}
`;
}
