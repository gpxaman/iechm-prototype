import Icon from './components/Icon.jsx';
import Logo from './components/Logo.jsx';
import Reveal from './components/Reveal.jsx';
import Spark from './components/Spark.jsx';

const PLATFORM_URL = 'https://claude.ai/code/artifact/0eba6b64-eec5-4de7-8836-a911e8191522';

const PILLARS = [
  { num: '01 · DESIGN', icon: 'cube', title: 'Design', desc: "Describe what you're building in plain language. We turn it into a structured bill of materials — matched against a live network of components, or scoped as something new." },
  { num: '02 · ENGINEER', icon: 'gear', title: 'Engineer', desc: 'Our team validates feasibility, resolves tolerances and materials, and gets a pilot run production-ready before you ever commit to scale.' },
  { num: '03 · MANUFACTURE', icon: 'factory', title: 'Manufacture', desc: 'From a 50-unit pilot to a container of finished goods, the same partner carries your product through production, quality, and delivery.' },
];

const STEPS = [
  { n: '01', title: 'Concept', desc: "Tell us what you need or what you're building — text, a sketch, a photo, a spec sheet.", now: true },
  { n: '02', title: 'Design', desc: 'AI breaks it into requirements and matches what already exists in our network.' },
  { n: '03', title: 'Engineer', desc: "Our team resolves what's missing and confirms feasibility on custom parts." },
  { n: '04', title: 'Prototype', desc: 'A pilot run validates the design before you commit to full production.' },
  { n: '05', title: 'Manufacture', desc: 'Approved designs move into production across our manufacturing network.' },
  { n: '06', title: 'Deliver', desc: 'Finished goods land where you need them, tracked from floor to doorstep.' },
];

const MODES = [
  { icon: 'cart', title: 'Buy', desc: 'Search or describe what you need. See price, MOQ, and lead time up front — no supplier-hunting required.' },
  { icon: 'wrench', title: 'Build', desc: 'Describe your product to an AI sourcing assistant. It breaks your idea into requirements and matches components automatically.' },
  { icon: 'handshake', title: 'Earn', desc: 'Know someone who needs sourcing or manufacturing? Refer the deal, we handle the business, you earn commission.' },
];

const VALUES = [
  { icon: 'handshake', title: 'Trusted Partner', desc: 'One accountable relationship from first idea through delivery.' },
  { icon: 'bulb', title: 'Innovative Thinking', desc: 'AI-assisted sourcing that turns rough ideas into structured plans in minutes.' },
  { icon: 'medal', title: 'Engineering Excellence', desc: 'Every custom component is feasibility-checked before it reaches production.' },
  { icon: 'globe', title: 'Global Impact', desc: 'A manufacturing network built to take a pilot run to global scale.' },
];

export default function App() {
  return (
    <>
      <header>
        <div className="wrap navrow">
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Logo height={18} /></a>
          <nav className="navlinks">
            <a href="#what-we-do">What We Do</a>
            <a href="#process">Process</a>
            <a href="#platform">Platform</a>
            <a href="#values">Why IECHM</a>
          </nav>
          <div className="nav-cta">
            <a className="btn btn-line" href="#platform" style={{ padding: '11px 20px', fontSize: 13.5 }}>Platform</a>
            <a className="btn btn-accent" href={PLATFORM_URL} target="_blank" rel="noopener" style={{ padding: '11px 20px', fontSize: 13.5 }}>Get Started</a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-grid" />
          <Spark />
          <div className="wrap hero-inner">
            <div className="eyebrow"><span className="hazard" />Engineering the Next Frontier<span className="hazard" /></div>
            <h1>Tell us what you need.<br />We'll <em>design</em> it, <em>engineer</em> it, and build it.</h1>
            <p className="hero-sub">
              IECHM is an end-to-end engineering and manufacturing partner for founders building the future — from a first
              sketch to a container of finished product. Precision. Performance. Possibility.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-accent" href={PLATFORM_URL} target="_blank" rel="noopener">Explore the Platform →</a>
              <a className="btn btn-line" href="#platform">Become a Deal Partner</a>
            </div>
          </div>
          <div className="console-strip">
            <div className="console-row">
              <span><span className="dot" />SYSTEM STATUS</span>
              <span>DESIGN <b>&check;</b></span>
              <span>ENGINEER <b>&check;</b></span>
              <span>MANUFACTURE <b>&check;</b></span>
              <span>DELIVER <b>&check;</b></span>
            </div>
          </div>
        </section>

        <section className="section" id="what-we-do">
          <div className="wrap">
            <Reveal className="kicker-row">
              <h2>One partner, from<br />idea to inventory.</h2>
              <p>Most teams juggle a designer, a dozen supplier quotes, and a manufacturer who's never seen the other two. IECHM collapses that into a single relationship.</p>
            </Reveal>
            <div className="pillars">
              {PILLARS.map((p) => (
                <Reveal as="div" className="pillar" key={p.title}>
                  <span className="num">{p.num}</span>
                  <span className="ic"><Icon name={p.icon} size={22} /></span>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="process-wrap" id="process">
          <div className="wrap section">
            <Reveal className="kicker-row">
              <h2>How an idea becomes<br />a shipped product.</h2>
              <p>Every project moves through the same six stages — visible to you at every step, never a black box.</p>
            </Reveal>
            <div className="steps">
              {STEPS.map((s) => (
                <Reveal as="div" className={'step' + (s.now ? ' now' : '')} key={s.n}>
                  <div className="sdot">{s.n}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="platform">
          <div className="wrap">
            <Reveal as="div" className="platform">
              <div className="platform-inner">
                <div className="platform-head">
                  <h2>One account. Three ways to work.</h2>
                  <p>Buy what exists, build what you need, or bring us a deal — all inside a single account, all built on the same sourcing and manufacturing network.</p>
                </div>
                <div className="modes">
                  {MODES.map((m) => (
                    <div className="mode-card" key={m.title}>
                      <span className="ic"><Icon name={m.icon} size={22} /></span>
                      <h3>{m.title}</h3>
                      <p>{m.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="platform-cta">
                  <a className="btn btn-accent" href={PLATFORM_URL} target="_blank" rel="noopener">Open the Interactive Prototype →</a>
                  <span className="hint">A working mobile preview of the IECHM platform</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-tight" id="values">
          <div className="wrap">
            <Reveal className="kicker-row">
              <h2>Why founders choose IECHM.</h2>
              <p>The values behind every project we take on.</p>
            </Reveal>
            <div className="values">
              {VALUES.map((v) => (
                <Reveal as="div" className="value" key={v.title}>
                  <span className="ic"><Icon name={v.icon} size={22} /></span>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-band">
          <Reveal as="div" className="wrap cta-band-inner">
            <div className="eyebrow" style={{ color: 'var(--accent)' }}><span className="hazard" />Building What's Next<span className="hazard" /></div>
            <h2>Ready to build what's next?</h2>
            <p>Whether you're sourcing a single component or manufacturing your first ten thousand units, IECHM is the one partner you need.</p>
            <div className="hero-ctas">
              <a className="btn btn-accent" href={PLATFORM_URL} target="_blank" rel="noopener">Explore the Platform →</a>
              <a className="btn btn-line" href="mailto:hello@iechm.com">Talk to Our Team</a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <Logo height={20} />
              <p>Design &middot; Engineer &middot; Manufacture.<br />An end-to-end engineering and manufacturing partner for founders building the future.</p>
            </div>
            <div className="foot-cols">
              <div className="foot-col">
                <h4>Platform</h4>
                <a href="#what-we-do">What We Do</a>
                <a href="#process">Process</a>
                <a href="#platform">Buy / Build / Earn</a>
              </div>
              <div className="foot-col">
                <h4>Company</h4>
                <a href="#values">Why IECHM</a>
                <a href="mailto:hello@iechm.com">Contact</a>
              </div>
              <div className="foot-col">
                <h4>Get Started</h4>
                <a href={PLATFORM_URL} target="_blank" rel="noopener">Explore the Platform</a>
                <a href="#platform">Become a Deal Partner</a>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <span>&copy; 2026 IECHM Technology Private Limited</span>
            <span className="tag">Engineering the next frontier</span>
          </div>
        </div>
      </footer>
    </>
  );
}
