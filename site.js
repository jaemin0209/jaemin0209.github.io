const scholarUrl =
  "https://scholar.google.com/citations?hl=ko&user=AnztMl4AAAAJ&view_op=list_works&sortby=pubdate";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const safeUrl = (value, fallback = "#") => {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? escapeHtml(url.href) : fallback;
  } catch {
    return fallback;
  }
};

const lines = (value) => escapeHtml(value).replaceAll("\n", "<br />");

function render(content) {
  const publications = (content.publications || [])
    .map(
      (publication, index) => `
        <li>
          <span class="publication-index">${String(index + 1).padStart(2, "0")}</span>
          <div class="publication-main">
            <div class="publication-meta"><span>${escapeHtml(publication.year)}</span><span>${escapeHtml(publication.note)}</span></div>
            <h3><a href="${safeUrl(publication.href)}" target="_blank" rel="noreferrer">${escapeHtml(publication.title)}</a></h3>
            <p>${escapeHtml(publication.authors)}</p>
            <p class="venue">${escapeHtml(publication.venue)}</p>
          </div>
          <span class="publication-arrow" aria-hidden="true">↗</span>
        </li>`,
    )
    .join("");

  const research = (content.researchAreas || [])
    .map(
      (area) => `
        <article class="research-card">
          <span class="card-number">${escapeHtml(area.number)}</span>
          <div><h3>${escapeHtml(area.title)}</h3><p>${escapeHtml(area.copy)}</p></div>
        </article>`,
    )
    .join("");

  const work = (content.workingProjects || [])
    .map(
      (project) => `
        <article>
          <p class="work-status">${escapeHtml(project.status)}</p>
          <h2>${escapeHtml(project.title)}</h2>
          <p class="working-copy">${escapeHtml(project.copy)}</p>
        </article>`,
    )
    .join("");

  const timeline = (content.timeline || [])
    .map(
      (item) => `
        <article>
          <span>${escapeHtml(item.period)}</span>
          <div><h3>${escapeHtml(item.institution)}</h3><p>${escapeHtml(item.detail)}</p></div>
        </article>`,
    )
    .join("");

  const awards = (content.awards || [])
    .map(
      (award) => `
        <article>
          <span>${escapeHtml(award.period)}</span>
          <div><h4>${escapeHtml(award.title)}</h4><p>${escapeHtml(award.organization)}</p></div>
        </article>`,
    )
    .join("");

  const skills = (content.skills || []).map((skill) => `<span>${escapeHtml(skill)}</span>`).join("");
  const email = escapeHtml(content.contactEmail || "");

  document.querySelector("#site").innerHTML = `
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="site-header">
      <a class="wordmark" href="#top" aria-label="${escapeHtml(content.name)}, home"><span>${escapeHtml(content.name)}</span></a>
      <nav aria-label="Main navigation">
        <a href="#about">About</a><a href="#research">Research</a><a href="#publications">Publications</a><a href="#cv">CV</a>
      </nav>
    </header>

    <div id="content">
      <section class="hero" id="top" aria-labelledby="hero-title">
        <div class="portrait-wrap reveal">
          <div class="portrait-frame"><img src="./jaemin-shin.jpg" alt="Portrait of Jaemin Shin" width="412" height="529" /></div>
          <div class="portrait-meta" aria-hidden="true"><span>${escapeHtml(content.location)}</span><span>${escapeHtml(content.coordinates)}</span></div>
        </div>
        <div class="hero-copy reveal reveal-delay">
          <p class="eyebrow">${escapeHtml(content.eyebrow)}</p>
          <h1 id="hero-title">${escapeHtml(content.name)}</h1>
          <p class="hero-thesis">${escapeHtml(content.heroThesis)}<em>${escapeHtml(content.heroAccent)}</em></p>
          <p class="hero-intro">${escapeHtml(content.heroIntro)}</p>
          <div class="hero-actions" aria-label="Contact and profiles">
            <a class="button button-primary" href="mailto:${email}">Email me <span aria-hidden="true">↗</span></a>
            <a class="button" href="${scholarUrl}" target="_blank" rel="noreferrer">Google Scholar <span aria-hidden="true">↗</span></a>
            <a class="button" href="#cv">View CV</a>
          </div>
        </div>
      </section>

      <section class="statement" id="about" aria-labelledby="about-title">
        <p class="section-kicker">About</p>
        <div class="statement-grid">
          <h2 id="about-title" class="preserve-lines">${lines(content.aboutTitle)}</h2>
          <div class="statement-copy"><p>${escapeHtml(content.aboutLead)}</p><p>${escapeHtml(content.aboutSupport)}</p></div>
        </div>
      </section>

      <section class="research-section" id="research" aria-labelledby="research-title">
        <div class="section-heading">
          <div><p class="section-kicker">Research focus</p><h2 id="research-title">Three connected lines of work</h2></div>
          <p class="section-note">Patient care → clinical question → data → better decision</p>
        </div>
        <div class="research-grid">${research}</div>
      </section>

      <section class="now-section" aria-labelledby="now-title">
        <div><p class="section-kicker">Now</p><h2 id="now-title">${escapeHtml(content.currentInstitution)}</h2></div>
        <div class="now-details">
          <div><span class="detail-label">Clinical training</span><strong>${escapeHtml(content.currentRole)}</strong><p>${escapeHtml(content.currentRolePeriod)}</p></div>
          <div><span class="detail-label">Graduate study</span><strong>${escapeHtml(content.currentStudy)}</strong><p>${escapeHtml(content.currentStudyPeriod)}</p></div>
        </div>
      </section>

      <section class="current-work-section" aria-label="Current projects and future direction">
        <article class="working-panel"><p class="section-kicker">Currently working on</p><div class="work-list">${work}</div></article>
        <article class="future-panel"><p class="section-kicker">Future direction</p><h2>${escapeHtml(content.futureTitle)}</h2><p>${escapeHtml(content.futureCopy)}</p></article>
      </section>

      <section class="publications-section" id="publications" aria-labelledby="publications-title">
        <div class="section-heading publication-heading">
          <div><p class="section-kicker">Selected publications</p><h2 id="publications-title">Work across stroke, memory, and imaging</h2></div>
          <a class="text-link" href="${scholarUrl}" target="_blank" rel="noreferrer">Full profile <span aria-hidden="true">↗</span></a>
        </div>
        <ol class="publication-list">${publications}</ol>
      </section>

      <section class="cv-section" id="cv" aria-labelledby="cv-title">
        <div class="section-heading">
          <div><p class="section-kicker">Curriculum vitae</p><h2 id="cv-title">Training & methods</h2></div>
        </div>
        <div class="cv-grid">
          <div class="timeline" aria-label="Education and clinical training">${timeline}</div>
          <div class="methods-panel"><p class="detail-label">Methods & tools</p><div class="skill-list">${skills}</div><p class="methods-copy">${escapeHtml(content.methodsCopy)}</p></div>
        </div>
        <div class="awards-block" aria-labelledby="awards-title">
          <div class="awards-heading"><p class="detail-label">Recognition</p><h3 id="awards-title">Awards &amp; Honors</h3></div>
          <div class="awards-list">${awards}</div>
        </div>
      </section>

      <section class="contact-section" aria-labelledby="contact-title">
        <p class="section-kicker">Contact</p><h2 id="contact-title">${escapeHtml(content.contactTitle)}</h2><a href="mailto:${email}">${email}</a>
      </section>
    </div>

    <footer><span>${escapeHtml(content.name)}</span><span>${escapeHtml(content.eyebrow)}</span><span>Updated August 2026</span></footer>`;
}

async function start() {
  try {
    const response = await fetch(`./content.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Content could not be loaded");
    render(await response.json());
  } catch (error) {
    document.querySelector("#site").innerHTML = `
      <section class="contact-section"><p class="section-kicker">Jaemin Shin</p><h1>Portfolio temporarily unavailable</h1><p>${escapeHtml(error.message)}</p></section>`;
  }
}

start();
