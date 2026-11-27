import { lazy, Suspense, useEffect } from 'react';
import { about, experience, profile, projects, skills } from '../data/portfolio';
const HeroPlayground = lazy(() => import('../components/HeroPlayground'));

const links = [
  ['GitHub', profile.github],
  ['LinkedIn', 'https://in.linkedin.com/in/inkersal-mahendran'],
  ['LeetCode', profile.leetcode],
];

function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

    const onPointerMove = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      document.documentElement.style.setProperty('--pointer-x', `${x}`);
      document.documentElement.style.setProperty('--pointer-y', `${y}`);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return <main>
    <header className="topbar"><a className="wordmark" href="#home">IM<span>.</span></a><nav aria-label="Main navigation"><a href="#about">About</a><a href="#experience">Experience</a><a href="#projects">Work</a><a href="#contact">Contact</a><a href="/drive">Drive the 3D world</a></nav><a className="nav-cta" href={`mailto:${profile.email}`}>Let&apos;s talk <span>↗</span></a></header>
    <section className="hero wrap" id="home"><div className="hero-copy"><p className="eyebrow hero-eyebrow"><span className="status-dot"/> CURRENTLY BUILDING AT PLANYS</p><h1 className="hero-title">Building digital<br/>things with <span>purpose.</span></h1><p className="hero-description">I&apos;m {profile.name}, a full-stack engineer turning thoughtful ideas into dependable products and delightful experiences.</p><div className="hero-actions"><a className="button button-dark" href="#projects">Explore my work <span>↘</span></a><a className="text-link" href={`mailto:${profile.email}`}>Get in touch <span>↗</span></a></div><div className="hero-meta"><span>{profile.location.toUpperCase()}</span><span>{profile.tagline.toUpperCase()}</span></div></div><div className="hero-art" aria-label="Interactive Three.js geometric playground"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-disc"><span>IM</span></div><Suspense fallback={null}><HeroPlayground/></Suspense><div className="art-star">*</div><div className="art-note">DESIGN<br/>x<br/>ENGINEERING</div><div className="art-index">01 - 04</div><div className="art-cross cross-one">+</div><div className="art-cross cross-two">+</div></div><a className="scroll-cue" href="#about"><span/> SCROLL TO EXPLORE</a></section>
    <section className="intro section-pad" id="about"><div className="wrap intro-grid"><p className="eyebrow reveal">A LITTLE INTRODUCTION</p><div className="reveal reveal-delay"><h2>Good work lives at the intersection of <span>curiosity</span> and craft.</h2>{about.slice(0, 2).map((item) => <p className="body-copy" key={item.id}>{item}</p>)}<div className="social-links">{links.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}</div></div></div></section>
    <section className="experience section-pad" id="experience"><div className="wrap"><div className="section-heading reveal"><p className="eyebrow">THE PATH SO FAR</p><h2>Experience<span>.</span></h2><p className="section-aside">A few chapters in building useful things with good people.</p></div><div className="timeline">{experience.map((item, i) => <article className={`timeline-row reveal reveal-delay-${i % 3}`} key={item.id}><div className="timeline-date">{item.duration}</div><div className="timeline-content"><h3>{item.role}</h3><p className="company">{item.company}</p><p>{item.contribution}</p></div><span className="timeline-mark">↗</span></article>)}</div></div></section>
    <section className="projects section-pad" id="projects"><div className="wrap"><div className="section-heading reveal"><p className="eyebrow">SELECTED PROJECTS</p><h2>Things I&apos;ve made<span>.</span></h2><p className="section-aside">A selection of ideas brought to life with code.</p></div><div className="project-grid">{projects.map((project, i) => <article className={`project-card project-${i % 4} reveal reveal-delay-${i % 3}`} key={project.id}><div className="project-visual"><span className="project-number">0{i + 1}</span><span className="project-glyph">{['*', 'CMD', 'o', '*'][i % 4]}</span><a href={project.link || '#contact'} target={project.link ? '_blank' : undefined} rel="noreferrer" aria-label={`View ${project.title}`}>↗</a><span className="project-label">FEATURED PROJECT</span></div><div className="project-info"><div><h3>{project.title}</h3><p>{project.tech}</p></div><span>0{i + 1}</span></div></article>)}</div></div></section>
    <section className="stack section-pad"><div className="wrap stack-layout"><div className="reveal"><p className="eyebrow">TOOLS OF THE TRADE</p><h2>My tech<br/>toolkit<span>.</span></h2></div><div className="stack-list">{skills.slice(0, 5).map((item, i) => <div className={`stack-row reveal reveal-delay-${i % 3}`} key={item.id}><span>0{i + 1}</span><h3>{item.category}</h3><p>{item.skills}</p></div>)}</div></div></section>
    <section className="contact section-pad" id="contact"><div className="wrap contact-inner reveal"><p className="eyebrow">HAVE A GOOD ONE IN MIND?</p><h2>Let&apos;s make<br/>something <span>matter.</span></h2><a className="contact-link" href={`mailto:${profile.email}`}>{profile.email} <span>↗</span></a><div className="contact-foot"><span>CURRENTLY BUILDING AT PLANYS</span><span>{profile.location.toUpperCase()} | WORKING WORLDWIDE</span></div></div></section>
    <footer className="footer"><a className="wordmark" href="#home">IM<span>.</span></a><span>Designed & built with intention.</span><a href={profile.resume} target="_blank" rel="noreferrer">VIEW RESUME ↗</a><span>(c) {new Date().getFullYear()} {profile.name.toUpperCase()}</span></footer>
  </main>;
}

export default Home;
