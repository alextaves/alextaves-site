import { useState, useRef } from 'react';
import './App.css';
import ServicesPage from './ServicesPage';

function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showDemoTape, setShowDemoTape] = useState(false);
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDemoOpen, setMobileDemoOpen] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const audioRef = useRef(null);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    await fetch('https://formspree.io/f/xldkljpe', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    form.reset();
    setFormSent(true);
  };

  const toggleAudio = () => {
    if (audioOn) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setAudioOn(!audioOn);
  };

  if (showServices) {
    return <ServicesPage onBack={() => setShowServices(false)} onContact={() => { setShowServices(false); setShowContact(true); }} />;
  }

  return (
    <div className="app">

      {/* Hamburger - mobile only */}
      <button
        className="hamburger"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <span /><span /><span />
      </button>

      {/* Header */}
      <header className="header">
        <span className="nav-link">Alex Taves</span>
        <button className="nav-link audio-btn" onClick={toggleAudio}>Audio {audioOn ? 'ON' : 'OFF'}</button>
        <nav className="nav">
          <div
            className="nav-dropdown-wrap"
            onMouseEnter={() => setShowDemoDropdown(true)}
            onMouseLeave={() => setShowDemoDropdown(false)}
          >
            <button className="nav-link nav-dropdown-trigger">
              Demo Tape <span className={`dropdown-arrow${showDemoDropdown ? ' open' : ''}`}>›</span>
            </button>
            {showDemoDropdown && (
              <div className="nav-dropdown-menu">
                <button className="nav-dropdown-item" onClick={() => { setShowDemoDropdown(false); setShowDemoTape(true); }}>About Demotape</button>
                <a href="https://demotape.alextaves.com" target="_blank" rel="noopener noreferrer" className="nav-dropdown-item">Demo Tape 1</a>
                <a href="https://demotape2.alextaves.com" target="_blank" rel="noopener noreferrer" className="nav-dropdown-item">Demo Tape 2</a>
              </div>
            )}
          </div>
          <a href="https://oswinjournal.com" target="_blank" rel="noopener noreferrer" className="nav-link">The Oswin Journal</a>
          <button onClick={() => setShowAbout(true)} className="nav-link">About</button>
          <button onClick={() => setShowServices(true)} className="nav-link">Work with ME</button>
          <button onClick={() => setShowContact(true)} className="nav-link">Contact</button>
          <a href="https://alextaves.com/archive" target="_blank" rel="noopener noreferrer" className="nav-link">Archive</a>
        </nav>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
          <nav className="mobile-menu-nav">
            <button className="mobile-menu-link mobile-menu-dropdown-trigger" onClick={() => setMobileDemoOpen(o => !o)}>
              Demo Tape <span className={`dropdown-arrow${mobileDemoOpen ? ' open' : ''}`}>›</span>
            </button>
            {mobileDemoOpen && (
              <div className="mobile-menu-sub">
                <a href="https://demotape.alextaves.com" target="_blank" rel="noopener noreferrer" className="mobile-menu-sublink" onClick={() => setMobileMenuOpen(false)}>Demo Tape 1</a>
                <a href="https://demotape2.alextaves.com" target="_blank" rel="noopener noreferrer" className="mobile-menu-sublink" onClick={() => setMobileMenuOpen(false)}>Demo Tape 2</a>
                <button className="mobile-menu-sublink" onClick={() => { setMobileMenuOpen(false); setMobileDemoOpen(false); setShowDemoTape(true); }}>About Demotape</button>
              </div>
            )}
            <a href="https://oswinjournal.com" target="_blank" rel="noopener noreferrer" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>The Oswin Journal</a>
            <button onClick={() => { setShowAbout(true); setMobileMenuOpen(false); }} className="mobile-menu-link">About</button>
            <button onClick={() => { setShowServices(true); setMobileMenuOpen(false); }} className="mobile-menu-link">Work with ME</button>
            <button onClick={() => { setShowContact(true); setMobileMenuOpen(false); }} className="mobile-menu-link">Contact</button>
            <a href="https://alextaves.com/archive" target="_blank" rel="noopener noreferrer" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Archive</a>
          </nav>
        </div>
      )}

      {/* Section 1: Demo Video */}
      <section className="section-demo">
        <video className="vid desktop" src="/videos/showreel2_3.mp4" autoPlay muted loop playsInline />
        <video className="vid tablet" src="/videos/tablet_2.mp4" autoPlay muted loop playsInline />
        <video className="vid mobile" src="/videos/mobileshowreel.mp4" autoPlay muted loop playsInline />
      </section>

      <div className="section-break" />

      {/* Section 2: Text + Substack */}
      <section className="section-text">
        <p className="body-text">
          IT WAS ONE OF THOSE CASUAL KNIFE FIGHTS. EFFORT WAS MADE, YES, BUT IT WAS RELAXED EFFORT. MUCH LIKE DRIVING - ONE WRONG MOVE AND YOU COULD DIE, BUT NONETHELESS, IT CAN BE RELAXING. KNIFE FIGHTS, FROM TIME TO TIME, CAN DO THIS FOR ME TOO. DON'T GET ME WRONG, I'VE BEEN IN KNIFE FIGHTS THAT WERE TERRIFYING. THIS PARTICULAR ONE WASN'T. IT WAS VERY CASUAL.
        </p>
        <a href="https://oswinjournal.substack.com/" target="_blank" rel="noopener noreferrer" className="text-link">
          Visit my Substack
        </a>
      </section>

      <div className="section-break" />

      {/* Section 3: Oswin Video + Audio */}
      <section className="section-oswin">
        <div className="oswin-video-wrap">
          <video className="vid desktop" src="/videos/desktop_preRace2.mp4" autoPlay muted loop playsInline />
          <video className="vid tablet" src="/videos/tablet_zoom.mp4" autoPlay muted loop playsInline />
          <video className="vid mobile" src="/videos/phone_PreRace.mp4" autoPlay muted loop playsInline />
        </div>
        <audio ref={audioRef} src="/audio/automobile.mp3" loop />
        <div className="oswin-bar">
          <a href="https://oswinjournal.com" target="_blank" rel="noopener noreferrer" className="text-link">
            Visit Oswin Journal — Collaborative space of paired visuals with audio
          </a>
        </div>
      </section>

      <div className="section-break" />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-col footer-col--wide">
          <span className="footer-heading">ABOUT</span>
          <span className="footer-divider">—</span>
          <p className="footer-body">Creative Director. Artist. Web Developer. Melbourne via Toronto and Sydney. Building things for people who make things.</p>
        </div>
        <div className="footer-col">
          <span className="footer-heading">CONTACT</span>
          <span className="footer-divider">—</span>
          <button className="footer-link" onClick={() => setShowContact(true)}>Email me</button>
          <div className="footer-bottom-row">
            <span className="footer-copy">All copyright {new Date().getFullYear()}</span>
          </div>
        </div>
        <div className="footer-col">
          <span className="footer-heading">FOLLOW</span>
          <span className="footer-divider">—</span>
          <a href="https://www.instagram.com/more_flowers_please/" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
          <a href="https://alextaves.substack.com/" target="_blank" rel="noopener noreferrer" className="footer-link">Substack</a>
          <div className="footer-bottom-row">
            <button className="footer-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top</button>
          </div>
        </div>
      </footer>

      {/* About Modal */}
      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAbout(false)} className="modal-close">×</button>
            <h2 className="about-heading">ME</h2>
            <div className="about-text">
              <p>Alex Taves is a creative based in Melbourne. His career has been non-linear, starting as a junior designer with Joseph Mimran, then becoming lead graphic designer for Joe Fresh when there were only 11 on the team. When he left 12 years later, there were over 200.</p>
              <p>A turning point came when he started Oswald Gallery & Goods in Hamilton, Ontario. Within six months, it caught the attention of The New York Times as one of five places to visit, and drew interest from artists internationally.</p>
              <p>That instinct of pairing visual and audio, treating them as equals, carried through to The Oswin Journal, a web-based experience that picks up where Oswald's left off, and now into Demotape, a platform he's building for independent musicians who want more than a link in a bio. It gives them an immersive web presence with integrated merch. Somewhere between a record sleeve and a storefront.</p>
              <p>For three years he was on faculty at Whitehouse Institute of Design in Sydney and Melbourne, teaching fashion/styling workshops, fashion illustration and digital design. That time in the classroom sharpened how he thinks about experience design. How people actually take things in, what holds attention, and what doesn't.</p>
            </div>
            <div className="about-links">
              <a href="https://www.instagram.com/more_flowers_please/" target="_blank" rel="noopener noreferrer" className="about-link">Instagram</a>
              <a href="https://alextaves.substack.com/" target="_blank" rel="noopener noreferrer" className="about-link">Substack</a>
            </div>
          </div>
        </div>
      )}

      {/* DemoTape Modal */}
      {showDemoTape && (
        <div className="modal-overlay" onClick={() => setShowDemoTape(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDemoTape(false)} className="modal-close">×</button>
            <h2 className="about-heading">DemoTape</h2>
            <div className="about-text">
              <p>DemoTape gives independent musicians something that doesn't exist yet: a single web presence that works like an album, a gallery, a store, and a gig calendar all at once. Installable on your phone. Yours to run.</p>
              <p>The backend runs on Sanity.io, which means you manage your own content. New tracks, new visuals, show dates. You update it. No waiting on anyone.</p>
              <p>It's in prototype right now. Early builds are live. If you want in, <button className="about-link about-link--orange" style={{display:'inline', padding:0}} onClick={() => { setShowDemoTape(false); setShowContact(true); }}>reach out</button>.</p>
            </div>
            <div className="about-links">
              <a href="https://demotape.alextaves.com" target="_blank" rel="noopener noreferrer" className="about-link about-link--orange" onClick={() => setShowDemoTape(false)}>Visit DemoTape</a>
              <a href="https://demotape2.alextaves.com" target="_blank" rel="noopener noreferrer" className="about-link about-link--orange" onClick={() => setShowDemoTape(false)}>Visit DemoTape 2</a>
              <button className="about-link about-link--orange" onClick={() => { setShowDemoTape(false); setShowContact(true); }}>Let's talk</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div className="modal-overlay" onClick={() => { setShowContact(false); setFormSent(false); }}>
          <div className="contact-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowContact(false); setFormSent(false); }} className="modal-close">×</button>
            {formSent ? (
              <div className="form-success">
                <p>Sent successfully.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-field">
                  <label className="form-label">NAME:</label>
                  <input type="text" name="name" className="form-input" required />
                </div>
                <div className="form-field">
                  <label className="form-label">EMAIL:</label>
                  <input type="email" name="email" className="form-input" required />
                </div>
                <div className="form-field">
                  <label className="form-label">MESSAGE:</label>
                  <textarea name="message" className="form-textarea" rows="5" required />
                </div>
                <button type="submit" className="form-submit">SEND</button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
