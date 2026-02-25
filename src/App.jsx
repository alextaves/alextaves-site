import { useState } from 'react';
import './App.css';

function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showFullStory, setShowFullStory] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app">
      {/* Hamburger Menu Button - Mobile Only */}
      <button
        className={`hamburger ${mobileMenuOpen || showAbout || showContact ? 'menu-open' : ''}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Top Navigation - Desktop Only */}
      <nav className="nav">
        <button
          onClick={() => setShowAbout(true)}
          className="nav-link"
        >
          About
        </button>
        <button
          onClick={() => setShowContact(true)}
          className="nav-link"
        >
          Contact
        </button>
        <a
          href="https://oswinjournal.com"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
        >
          The Oswin Journal
        </a>
        <a
          href="https://alextaves.com/archive"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
        >
          Work
        </a>
      </nav>

      {/* Mobile Menu - Full Screen */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <button
            className="mobile-menu-close"
            onClick={() => setMobileMenuOpen(false)}
          >
            ×
          </button>
          <nav className="mobile-menu-nav">
            <button
              onClick={() => {
                setShowAbout(true);
                setMobileMenuOpen(false);
              }}
              className="mobile-menu-link"
            >
              About
            </button>
            <button
              onClick={() => {
                setShowContact(true);
                setMobileMenuOpen(false);
              }}
              className="mobile-menu-link"
            >
              Contact
            </button>
            <a
              href="https://oswinjournal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-menu-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              The Oswin Journal
            </a>
            <a
              href="https://alextaves.com/archive"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-menu-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Work
            </a>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="content">
        {/* Headline */}
        <h1 className="headline">
          IT WAS ONE OF<br />
          THOSE CASUAL<br />
          KNIFE FIGHTS.
        </h1>

        {/* Body Text */}
        <p className="body-text">
          IT WAS ONE OF THOSE CASUAL KNIFE FIGHTS. EFFORT WAS MADE, YES, BUT IT WAS RELAXED EFFORT. MUCH LIKE DRIVING - ONE WRONG MOVE AND YOU COULD DIE, BUT NONETHELESS, IT CAN BE RELAXING. KNIFE FIGHTS, FROM TIME TO TIME, CAN DO THIS FOR ME TOO. DON'T GET ME WRONG, I'VE BEEN IN KNIFE FIGHTS THAT WERE TERRIFYING. THIS PARTICULAR ONE WASN'T. IT WAS VERY CASUAL.
        </p>

        {/* Extended Story - shown when "Finish Story Here" is clicked */}
        {showFullStory && (
          <div className="extended-story">
            <p className="body-text">
              WAS OUR AIM TO KILL? MAYBE NOT KILL, BUT TO AT LEAST INJURE ENOUGH THAT THEY MAY NEVER WALK AGAIN OR USE THE WASHROOM PROPERLY. KILL IF IT CAME TO IT, FOR SURE.
            </p>
            <p className="body-text">
              HE TOOK A SWING WITH HIS FOUR-INCH BLADE AND IT NEARLY HIT MY FACE. I NOTICED HIS TECHNIQUE WAS RATHER MONTREAL STYLE; THAT BEING SCRAPPY YET CIRCUS LIKE. I MOVED MY HEAD GENTLY TO THE LEFT. YOU COULD TELL IT WAS A WELL-MADE KNIFE - I'D SAY THE HANDLE WAS CEDAR, POSSIBLY HAND-CARVED. IT HAD A LOVELY AROMA. I BURN A LOT OF CEDAR INCENSE AT HOME; IT RELAXES ME. HIS COLOGNE WAS TOM FORD OUD WOOD - EXCELLENT CHOICE FOR A KNIFE FIGHT, SUBTLE YET MEMORABLE. HE SEEMED TO HAVE GOOD TASTE. TOO BAD SOMEONE MIGHT DIE RIGHT NOW.
            </p>
            <p className="body-text">
              I GRABBED HIS WELL-CONDITIONED AND STYLED HAIR - THE KIND OF PRECISION CUT YOU ONLY GET AT THOSE APPOINTMENT-ONLY BARBERSHOPS - AND ATTEMPTED TO KNIFE HIS TEMPLE, BUT HE PUSHED ME BACK AND I FELL. THE LAWN WAS THAT PERFECT LENGTH AND LUSH. WHOEVER IS TAKING CARE OF THIS LAWN UNDERSTANDS THE RIGHT AMOUNT OF WATERING AND HAS A CLEAR SENSE OF HOW MUCH NITROGEN TO USE. TOO MUCH MAKES THE LAWN GO YELLOW AND LOOK BURNT. THIS LAWN, WAS LUXURIOUS. IT HAD THAT DEEP SUMMER GRASS CLIPPING SMELL, MIXED WITH THE EARTHY UNDERTONES OF RECENT IRRIGATION. THROUGH THE CAREFULLY SPACED JAPANESE MAPLES, THE SKY WAS A PARTICULAR SHADE OF AZURE YOU ONLY GET IN LATE AUGUST. I MUST SAY THERE WAS A LOT OF AIR TRAVEL THAT DAY - LOTS OF JET STREAMS CRISS-CROSSING LIKE AN AMATEUR'S KNIFE WORK.
            </p>
            <p className="body-text">
              HE CAME RUNNING AT ME, KNIFE POINTED AT MY FACE AS IF TO JUMP ON ME AND STAB MY FACE OFF. HIS BRUNELLO CUCINELLI LINEN SHIRT MOVED BEAUTIFULLY WITH EACH THRUST - BREATHING WITH HIS MOVEMENTS LIKE GOOD FABRIC SHOULD. I NOTICED HIS NICE ARMS, CLEARLY THE RESULT OF A CAREFULLY BALANCED REGIME OF CALISTHENICS AND LIGHT WEIGHTS. WOW, HE SMELLS GOOD AND HAS NICE ARMS. HE'S THE FULL PACKAGE... I ROLLED OUT OF THE WAY, CAREFUL NOT TO STAIN MY OWN SHIRT - IT WAS MY FAVORITE JIL SANDER. MY PHONE BEEPED AND I TOOK A SECOND TO CHECK WHO IT WAS. I HAD A LITTLE TIME - HE HAD FUMBLED TO THE GROUND AND SEEMED TO BE TRYING TO RUB DIRT OFF HIS KNEES. THEY WERE NICE JEANS - RAW JAPANESE DENIM, PROBABLY MOMOTARO GIVEN THE SUBTLE DETAILING. I'LL GIVE HIM A SECOND. I CAN QUICKLY CHECK MY MESSAGES.
            </p>
            <p className="body-text">
              THE FIGHT CONTINUED...
            </p>
            <p className="body-text">
              HE STABBED ME IN THE STOMACH. IT DID HURT QUITE A BIT, BUT I MADE IT TO THE HOSPITAL PROMPTLY AND ALL IS GOOD. MY DRINK PLANS THAT EVENING WERE CANCELLED BUT WE RESCHEDULED. I HEARD LATER HE ALSO HAD TO CANCEL HIS PLANS - SOMETHING ABOUT GETTING BLOOD ON HIS SHIRT AND HE HAD NO BACK UP.
            </p>
          </div>
        )}

        {/* Action Links */}
        <div className="action-links">
          <button
            onClick={() => setShowFullStory(!showFullStory)}
            className="action-link"
          >
            {showFullStory ? 'Hide Story' : 'Finish Story Here'}
          </button>
          <a
            href="https://alextaves.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="action-link"
          >
            Read On Substack
          </a>
        </div>

        {/* Copyright */}
        <div className="copyright">
          © the oswin journal 2025
        </div>
      </main>

      {/* About Modal */}
      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowAbout(false)}
              className="modal-close"
            >
              ×
            </button>

            <h2 className="about-heading">ME</h2>

            <div className="about-text">
              <p>Alex Taves is a creative based in Melbourne. His career has been non-linear—starting as a junior designer with Joseph Mimran, then becoming lead graphic designer for Joe Fresh when there were only 11 on the team. When he left 12 years later, there were over 200.</p>

              <p>A turning point came when he started Oswald Gallery & Goods in Hamilton, Ontario. Within six months, it caught the attention of The New York Times as one of five places to visit, and drew interest from artists internationally.</p>

              <p>His focus has since shifted to The Oswin Journal—a web-based visual and audio experience that picks up where Oswald's left off. For Alex, visual and audio sit on equal footing, each enhancing the other.</p>

              <p>For the past three years he's been on faculty at Whitehouse Institute of Design in Sydney and Melbourne. Teaching led him deeper into how people actually learn, and he's currently completing a graduate certificate in Learning Design at QUT.</p>
            </div>

            <div className="about-links">
              <a href="https://www.instagram.com/more_flowers_please/" target="_blank" rel="noopener noreferrer" className="about-link">Instagram</a>
              <a href="https://alextaves.substack.com/" target="_blank" rel="noopener noreferrer" className="about-link">Substack</a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="about-link">Tiktok</a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="about-link">Twitter</a>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div className="modal-overlay" onClick={() => setShowContact(false)}>
          <div className="contact-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowContact(false)}
              className="modal-close"
            >
              ×
            </button>

            <form
              className="contact-form"
              action="https://formspree.io/f/xldkljpe"
              method="POST"
            >
              <div className="form-field">
                <label className="form-label">NAME:</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder=""
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">EMAIL:</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder=""
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">MESSAGE:</label>
                <textarea
                  name="message"
                  className="form-textarea"
                  rows="5"
                  placeholder=""
                  required
                />
              </div>

              <button type="submit" className="form-submit">
                SEND
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
