// Route: /vaultpedia/ian-buchanan
// Notes:
// - Plain React + normal CSS (no Tailwind). See CSS at bottom; save as:
//   site/src/pages/vaultpedia/IanBuchanan.css
// - Includes: responsive YouTube embeds, left TOC, breadcrumbs, dark-mode friendly styles.
// - Drop-in ready for Vite/React. Ensure your router points this path to <IanBuchanan />.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import "./IanBuchanan.css";

function askKnow(msg) {
  window.dispatchEvent(new CustomEvent("know.ask", { detail: { msg } }));
}

const prompts = {
  biography:
    "Give a concise, sourced profile of Ian Buchanan (education, appointments, key focus areas) and cite authoritative sources.",
  work:
    "Summarize Ian Buchanan’s major editorial projects and explain their significance in Deleuze & Guattari studies, with citations.",
  "selected-publications":
    "From Buchanan’s selected publications, which are most cited for assemblage and schizoanalysis? Provide brief notes and citations.",
  "reception-influence":
    "How has Buchanan’s work been received? Outline influence and debates among Deleuzian scholars (e.g., Massumi, Braidotti), with citations.",
  "conceptual-contributions":
    "Explain Buchanan’s treatment of assemblage and schizoanalysis, comparing to Deleuze & Guattari and Massumi. Include citations.",
  "selected-talks":
    "List 2–3 takeaways from Buchanan’s recorded talks on assemblage/schizoanalysis and point to original video timestamps if possible.",
  references:
    "Provide a consolidated reference block (APA/Chicago) for the sources listed on this page with stable links."
};

const sections = [
  { id: "biography", label: "1. Biography" },
  { id: "work", label: "2. Work & Editorial Projects" },
  { id: "selected-publications", label: "3. Selected Publications" },
  { id: "reception-influence", label: "4. Reception & Influence" },
  { id: "conceptual-contributions", label: "5. Conceptual Contributions" },
  { id: "selected-talks", label: "6. Selected Talks & YouTube" },
  { id: "references", label: "7. References" },
];

function useActiveSection(sectionIds) {
  const [active, setActive] = useState(sectionIds[0]);
  const observer = useRef(null);

  useEffect(() => {
    const opts = { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0.0 };
    const cb = (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    };
    observer.current = new IntersectionObserver(cb, opts);
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.current.observe(el);
    });
    return () => observer.current && observer.current.disconnect();
  }, [sectionIds]);
  return active;
}

function Breadcrumbs() {
  return (
    <nav aria-label="Breadcrumb" className="ib-breadcrumbs">
      <ol>
        <li><a href="/">Vault</a></li>
        <li><a href="/vaultpedia">VaultPedia</a></li>
        <li aria-current="page">Ian Buchanan</li>
      </ol>
    </nav>
  );
}

function TOC({ sections }) {
  const ids = useMemo(() => sections.map((s) => s.id), [sections]);
  const active = useActiveSection(ids);

  return (
    <aside className="ib-toc" aria-label="Table of contents">
      <div className="ib-toc-title">Contents</div>
      <ul>
        {sections.map((s) => (
          <li key={s.id} className={active === s.id ? "active" : undefined}>
            <a href={`#${s.id}`}>{s.label}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function ResponsiveYouTube({ id, title }) {
  return (
    <div className="yt-wrap">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export default function IanBuchanan() {
  const talks = [
    { id: "S59XUHQHUr0", title: "Ian Buchanan – Assemblage Theory (Machinic Unconscious Happy Hour)" },
    { id: "x7hkNUtIUsk", title: "What were we THINKING??? Affect and Assemblage (ISCIA Seminar)" },
    { id: "jh9xUfHMzeU", title: "Deleuze & Guattari’s Differential Method" },
    { id: "JZhKlkaNOeI", title: "Schizoanalysis and Method I (Actual Virtual Journal)" },
    { id: "vfSJcUR3DhE", title: "Schizoanalysis and Method II (Actual Virtual Journal)" },
    { id: "MSKpw8CukV8", title: "Complexity and Assemblage Theory (ISCIA Complexity Seminar)" },
    { id: "GLc6M01Fl_k", title: "Ocean or Oubliette (NCHU, Taichung)" },
    { id: "6P4DT1cJkCE", title: "Assemblage Theory as the Engine that Drives Schizoanalysis (Buchanan channel)" },
  ];

  return (
    <div className="ib-page">
      <Helmet>
        <meta
          property="og:image"
          content="https://your-app.vercel.app/api/og/ian-buchanan"
        />
        <meta
          name="twitter:image"
          content="https://your-app.vercel.app/api/og/ian-buchanan"
        />
      </Helmet>
      <Breadcrumbs />

      <header className="ib-header">
        <h1>VaultPedia: Ian Buchanan</h1>
        <p className="ib-subtitle">
          A curated, expanded “Wikipedia‑style” entry inside the Ian Buchanan Vault: biography, works, reception,
          conceptual contributions, and selected talks.
        </p>
      </header>

      <div className="ib-layout">
        <TOC sections={sections} />

        <main className="ib-content">
          {/* 1. Biography */}
          <section id="biography" className="ib-section">
            <h2>1. Biography</h2>
            <div className="ib-actions">
              <button type="button" onClick={() => askKnow(prompts["biography"])}>Ask Know about this section</button>
            </div>
            <ul>
              <li><strong>Name</strong>: Ian Buchanan</li>
              <li>
                <strong>Birthplace</strong>: Rural Western Australia (grew up in the suburbs of Perth) (<a href="#ref1">Wikipedia</a>)
              </li>
              <li>
                <strong>Education</strong>: BA and PhD in English and Comparative Literature from Murdoch University; PhD thesis titled
                <em> Heterology: Towards a Transcendental Empiricist Approach to Cultural Studies</em> (1995) (<a href="#ref1">Wikipedia</a>)
              </li>
              <li>
                <strong>Academic Position</strong>: Since 2011, Professor of Critical Theory and Cultural Studies at the University of Wollongong (<a href="#ref1">Wikipedia</a>)
              </li>
            </ul>
          </section>

          {/* 2. Work & Editorial Projects */}
          <section id="work" className="ib-section">
            <h2>2. Work &amp; Editorial Projects</h2>
            <div className="ib-actions">
              <button type="button" onClick={() => askKnow(prompts["work"])}>Ask Know about this section</button>
            </div>
            <p>
              Edited special issues of <em>Social Semiotics</em> (Vol. 7:2, 1997) and <em>South Atlantic Quarterly</em> (Vol. 93:3, 1997);
              the latter issue was reprinted as the book <em>A Deleuzian Century?</em> (<a href="#ref1">Wikipedia</a>).
            </p>
          </section>

          {/* 3. Selected Publications */}
          <section id="selected-publications" className="ib-section">
            <h2>3. Selected Publications</h2>
            <div className="ib-actions">
              <button type="button" onClick={() => askKnow(prompts["selected-publications"])}>Ask Know about this section</button>
            </div>

            <h3>Authored Books</h3>
            <ul>
              <li><em>Michel de Certeau: Cultural Theorist</em> (2000) (<a href="#ref1">Wikipedia</a>)</li>
              <li><em>Deleuzism: A Metacommentary</em> (2000) (<a href="#ref1">Wikipedia</a>)</li>
              <li><em>Fredric Jameson: Live Theory</em> (2006) (<a href="#ref1">Wikipedia</a>)</li>
              <li><em>Deleuze and Guattari’s Anti‑Oedipus: A Reader’s Guide</em> (2008) (<a href="#ref1">Wikipedia</a>)</li>
              <li><em>Assemblage Theory and Method: An Introduction and Guide</em> (2020) (<a href="#ref1">Wikipedia</a>)</li>
              <li><em>The Incomplete Project of Schizoanalysis: Collected Essays on Deleuze and Guattari</em> (2021) (<a href="#ref1">Wikipedia</a>)</li>
            </ul>

            <h3>Edited Volumes</h3>
            <p className="ib-note">(Skeleton here—can be fleshed out later with titles like “Deleuze and Literature,” “Deleuze and Politics,” etc.)</p>

            <h3>Selected Articles</h3>
            <ul>
              <li><strong>1997</strong>: “The Problem of the Body in Deleuze and Guattari, or, What Can a Body Do?” (<em>Body &amp; Society</em>)</li>
              <li><strong>2015</strong>: “Assemblage Theory and Its Discontents” (<em>Deleuze Studies</em>)</li>
              <li><strong>2017</strong>: “Assemblage Theory, or, the Future of an Illusion” (<em>Deleuze Studies</em>)</li>
              <li><strong>1995</strong>: PhD Thesis—<em>Heterology: Towards a Transcendental Empiricist Approach to Cultural Studies</em></li>
            </ul>
            <p className="ib-note">(All citations to be added as needed.)</p>
          </section>

          {/* 4. Reception & Influence */}
          <section id="reception-influence" className="ib-section">
            <h2>4. Reception &amp; Influence</h2>
            <div className="ib-actions">
              <button type="button" onClick={() => askKnow(prompts["reception-influence"])}>Ask Know about this section</button>
            </div>
            <ul>
              <li>
                <strong>Accessibility of Deleuze &amp; Guattari</strong>: <em>Deleuze and Guattari’s Anti‑Oedipus: A Reader’s Guide</em> has been
                praised as “a highly readable and engaging guide” that models a form of <em>practical Deleuzism</em>, clarifying complex,
                baroque philosophical arguments (<a href="#ref1">Wikipedia</a>).
              </li>
              <li>
                <strong>Film Theory</strong>: The edited volume <em>Deleuze and the Schizoanalysis of Cinema</em> (2011) extends schizoanalysis into film studies (<a href="#ref1">Wikipedia</a>).
              </li>
            </ul>
            <p className="ib-note">(We can expand this section with reviewer quotes, citation counts, and scholarly positioning.)</p>
          </section>

          {/* 5. Conceptual Contributions */}
          <section id="conceptual-contributions" className="ib-section">
            <h2>5. Conceptual Contributions</h2>
            <div className="ib-actions">
              <button type="button" onClick={() => askKnow(prompts["conceptual-contributions"])}>Ask Know about this section</button>
            </div>
            <ul>
              <li>
                <strong>Assemblage Theory</strong>: Buchanan’s work develops empirical and methodological applications of assemblage theory; deriving research methods from Deleuze &amp; Guattari’s concept of assemblage (<a href="#ref2">UOW profile</a>).
              </li>
              <li>
                <strong>Schizoanalysis</strong>: Extends schizoanalysis across cultural and cinematic studies in both analytic essays and edited collections.
              </li>
            </ul>
            <p className="ib-note">(Future: add conceptual maps—assemblage↔method flows; schizoanalysis in culture.)</p>
          </section>

          {/* 6. Selected Talks */}
          <section id="selected-talks" className="ib-section">
            <h2>6. Selected Talks &amp; YouTube Resources</h2>
            <div className="ib-actions">
              <button type="button" onClick={() => askKnow(prompts["selected-talks"])}>Ask Know about this section</button>
            </div>
            <p>
              Below is a selection of talks featuring Ian Buchanan. For more, see his YouTube channel (<a href="https://www.youtube.com/@ianbuchanan3199" target="_blank" rel="noreferrer noopener">@ianbuchanan3199</a>).
            </p>
            <div className="yt-grid">
              {talks.map((t) => (
                <figure key={t.id} className="yt-card">
                  <ResponsiveYouTube id={t.id} title={t.title} />
                  <figcaption>{t.title}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* 7. References */}
          <section id="references" className="ib-section">
            <h2>7. References</h2>
            <div className="ib-actions">
              <button type="button" onClick={() => askKnow(prompts["references"])}>Ask Know about this section</button>
            </div>
            <ol className="ib-refs">
              <li id="ref1">
                <a href="https://en.wikipedia.org/wiki/Ian_Buchanan_(academic)" target="_blank" rel="noreferrer noopener">Ian Buchanan (academic) – Wikipedia</a>
              </li>
              <li id="ref2">
                <a href="https://scholars.uow.edu.au/ian-buchanan" target="_blank" rel="noreferrer noopener">Ian Buchanan | University of Wollongong – Profile</a>
              </li>
              <li>
                <a href="https://www.youtube.com/watch?v=S59XUHQHUr0" target="_blank" rel="noreferrer noopener">Assemblage Theory (Machinic Unconscious Happy Hour)</a>
              </li>
              <li>
                <a href="https://www.youtube.com/watch?v=x7hkNUtIUsk" target="_blank" rel="noreferrer noopener">What were we THINKING??? Affect and Assemblage (ISCIA)</a>
              </li>
              <li>
                <a href="https://www.youtube.com/watch?v=jh9xUfHMzeU" target="_blank" rel="noreferrer noopener">Deleuze &amp; Guattari’s Differential Method</a>
              </li>
              <li>
                <a href="https://www.youtube.com/watch?v=JZhKlkaNOeI" target="_blank" rel="noreferrer noopener">Schizoanalysis and Method I</a>
              </li>
              <li>
                <a href="https://www.youtube.com/watch?v=vfSJcUR3DhE" target="_blank" rel="noreferrer noopener">Schizoanalysis and Method II</a>
              </li>
              <li>
                <a href="https://www.youtube.com/watch?v=MSKpw8CukV8" target="_blank" rel="noreferrer noopener">Complexity and Assemblage Theory (ISCIA Complexity Seminar)</a>
              </li>
              <li>
                <a href="https://www.youtube.com/watch?v=GLc6M01Fl_k" target="_blank" rel="noreferrer noopener">Ocean or Oubliette (NCHU, Taichung)</a>
              </li>
              <li>
                <a href="https://www.youtube.com/@ianbuchanan3199" target="_blank" rel="noreferrer noopener">Ian Buchanan – YouTube channel</a>
              </li>
              <li>
                <a href="https://ro.uow.edu.au/articles/journal_contribution/Ocean_or_Oubliette_/27732696" target="_blank" rel="noreferrer noopener">“Ocean or Oubliette?” – Tamkang Review (2018)</a>
              </li>
            </ol>
          </section>

          <footer className="ib-footer">
            <p>
              This internal page is a curated, extended profile for research and teaching in the Ian Buchanan Vault. Sources include
              Wikipedia, UOW, and public talks.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

