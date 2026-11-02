"use client";

import { useRef, useState } from "react";
import { DisplayText } from "../components/display-text";
import { AnimatedEyeCursor, CodeRain, HeroRings, HybridPortrait, IntroPortrait, MagicRings } from "./portfolio-effects";
import { useTrajectoryReveal } from "./use-trajectory-reveal";

// Mídias e URLs só devem ser adicionadas após confirmação do conteúdo real.
const PROJECTS = [
  { name: "OulDesign", skill: "FRONT-END", tech: "HTML · CSS · JavaScript · Three.js" },
  { name: "Quick Filler", skill: "PYTHON / APIs", tech: "Python · FastAPI · OCR · Docker" },
  { name: "Project Pixel", skill: "NEXT.JS / TYPESCRIPT", tech: "Next.js · TypeScript · Tailwind CSS" },
];

function Hero() {
  const [introPlaying, setIntroPlaying] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  return <section className="hero" id="inicio" aria-labelledby="hero-title">
    <CodeRain active={introPlaying} />
    <div className="hero-visual">
      <p className="orbit-motto">SOLVE ET COAGULA</p>
      <div className="portrait-stage" ref={stageRef}><HeroRings stageRef={stageRef} enabled={introFinished} /><IntroPortrait onPlayingChange={setIntroPlaying} onFinishedChange={setIntroFinished} /></div>
      <p className="orbit-caption">EXPERIÊNCIA · CÓDIGO · TRANSFORMAÇÃO</p>
    </div>
    <div className="hero-copy">
      <p className="eyebrow">PORTFÓLIO · 2026</p>
      <h1 id="hero-title" className="chrome-title"><DisplayText>Rafael Amaral Silva</DisplayText></h1>
      <p className="job-title">Desenvolvedor de Software Júnior</p>
      <nav className="hero-actions" aria-label="Acessos principais">
        <a className="scroll-button" href="#projetos">Projetos</a><a className="scroll-button" href="#contato">Contato</a>
      </nav>
    </div>
    <a className="scroll-cue" href="#trajetoria" aria-label="Ir para trajetória">↓</a>
  </section>;
}

function Trajectory() {
  const sectionRef = useTrajectoryReveal();
  return <section className="trajectory section-pad" id="trajetoria" aria-labelledby="trajectory-title" ref={sectionRef}>
    <p className="section-index">01 · TRAJETÓRIA</p><h2 id="trajectory-title" className="sr-only">Trajetória</h2>
    <div className="trajectory-grid">
      <article className="trajectory-copy trajectory-solve" data-reveal="copy" data-reveal-order="0"><h3 className="chrome-title"><DisplayText>Solve</DisplayText></h3><p>O Serviço Social me ensinou a compreender pessoas, contextos e problemas reais. Questionar estruturas e reorganizar caminhos faz parte da minha forma de trabalhar.</p></article>
      <div className="rings-stage"><div className="trajectory-rings-reveal" data-reveal="rings" data-reveal-order="1"><MagicRings /></div><p data-reveal="phrase" data-reveal-order="2">Experiência humana + conhecimento + tecnologia</p></div>
      <article className="trajectory-copy trajectory-coagula" data-reveal="copy" data-reveal-order="3"><h3 className="chrome-title"><DisplayText>Coagula</DisplayText></h3><p>Na tecnologia, integro essa experiência ao desenvolvimento de interfaces, Python, APIs e automações com IA. Hoje estudo Análise e Desenvolvimento de Sistemas e construo projetos para atuar como Desenvolvedor de Software Júnior.</p></article>
    </div>
  </section>;
}

function Projects() {
  const [active, setActive] = useState(1);
  return <section className="projects section-pad" id="projetos" aria-labelledby="projects-title">
    <header className="section-heading"><p className="section-index">02 · PORTFÓLIO</p><h2 id="projects-title" className="chrome-title"><DisplayText>Projetos</DisplayText></h2><p>Competências demonstradas em projetos reais</p><span className="heading-divider" aria-hidden="true" /></header>
    <div className="skill-stage" id="project-skill" aria-live="polite" aria-atomic="true"><p className="skill-word chrome-title" key={active}><DisplayText>{PROJECTS[active].skill}</DisplayText></p></div>
    <div className="project-grid">{PROJECTS.map((project, index) =>
      <article className={`project-tile ${active === index ? "is-active" : ""}`} key={project.name} onPointerEnter={(event) => { if (event.pointerType === "mouse") setActive(index); }}>
        <div className="project-media" role="img" aria-label={`Mídia de ${project.name} ainda não disponível`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span></div>
        <h3><DisplayText>{project.name}</DisplayText></h3><div className="project-divider" aria-hidden="true" /><p>{project.tech}</p>
        <button type="button" className="project-select" aria-pressed={active === index} aria-controls="project-skill" onFocus={() => setActive(index)} onClick={() => setActive(index)} aria-label={`Destacar competência de ${project.name}`}>
          <span aria-hidden="true">{active === index ? "Em destaque" : "Destacar competência"}</span><span aria-hidden="true">↗</span>
        </button>
      </article>
    )}</div>
  </section>;
}

function Contact() {
  return <section className="contact section-pad" id="contato" aria-labelledby="contact-title">
    <p className="section-index">03 · CONTATO</p>
    <div className="contact-grid"><div className="contact-copy"><h2 id="contact-title" className="chrome-title"><DisplayText>Contato</DisplayText></h2><p>Conheça meus projetos e acompanhe minha trajetória profissional.</p><div className="contact-actions">
      <a className="scroll-button" href="https://www.linkedin.com/in/rafael-amaral-silva-dev/" target="_blank" rel="noreferrer">LinkedIn<span className="sr-only"> (abre em nova aba)</span></a>
      <a className="scroll-button" href="https://github.com/faelmorningstar" target="_blank" rel="noreferrer">GitHub<span className="sr-only"> (abre em nova aba)</span></a>
    </div></div><HybridPortrait /></div>
    <footer><span>Rafael Amaral Silva</span><span>Desenvolvedor de Software Júnior</span></footer>
  </section>;
}

export default function Home() {
  return <><a className="skip-link" href="#projetos">Pular para projetos</a><main><AnimatedEyeCursor /><Hero /><Trajectory /><Projects /><Contact /></main></>;
}
