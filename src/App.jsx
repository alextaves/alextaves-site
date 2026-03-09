import { useState, useRef } from 'react';
import './App.css';
import ServicesPage from './ServicesPage';

function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const audioRef = useRef(null);

  const toggleAudio = () => {
    if (audioOn) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setAudioOn(!audioOn);
  };

  if (showServices) {
    return <ServicesPage onBack={() => setShowServices(false)} />;
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
          <a href="https://demotape.alextaves.com" target="_blank" rel="noopener noreferrer" className="nav-link">Demo Tape</a>
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
            <a href="https://demotape.alextaves.com" target="_blank" rel="noopener noreferrer" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Demo Tape</a>
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
        <span>Alex Taves</span>
        <span>© {new Date().getFullYear()}</span>
        <span>Audio by Yoni Newman — featured in Oswin Journal</span>
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

      {/* Contact Modal */}
      {showContact && (
        <div className="modal-overlay" onClick={() => setShowContact(false)}>
          <div className="contact-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowContact(false)} className="modal-close">×</button>
            <form className="contact-form" action="https://formspree.io/f/xldkljpe" method="POST">
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
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
