import { useState, useEffect } from "react";

const services = [
  {
    id: "01",
    title: "Immersive Web",
    subtitle: "For Artists & Musicians",
    description:
      "Websites that function as art, not brochures. Sound-reactive visuals, atmospheric design, and browser-as-gallery experiences for musicians, labels, and visual artists who refuse to look like everyone else.",
    cta: "Let's talk",
  },
  {
    id: "02",
    title: "Art Direction",
    subtitle: "Creative Strategy",
    description:
      "Visual identity, campaign direction, and brand strategy built on fifteen years of leading design at the intersection of fashion, art, and digital. The thinking behind the thing.",
    cta: "Let's talk",
  },
  {
    id: "03",
    title: "Web Design & Development",
    subtitle: "Broader Client Work",
    description:
      "Clean, responsive, functional websites for people who need a professional web presence built by someone who actually cares about craft. No templates. No shortcuts.",
    cta: "Let's talk",
  },
];

export default function ServicesPage({ onBack }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        .services-page {
          background: #fff;
          color: #000;
          min-height: 100vh;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          overflow-x: hidden;
        }
        .s-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 100px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 40px;
          background: #fff;
          z-index: 100;
        }
        .s-nav-name {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 20px;
          font-weight: normal;
          color: #000;
        }
        .s-nav-back {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 20px;
          font-weight: normal;
          color: #000;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .s-nav-back:hover { opacity: 0.5; }
        .s-hero {
          padding-top: 100px;
          padding-left: 40px;
          padding-right: 40px;
          padding-bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 45vh;
        }
        .s-hero-title {
          font-family: Helvetica, Arial, sans-serif;
          font-size: clamp(72px, 10vw, 150px);
          line-height: 1;
          font-weight: bold;
          color: #000;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .s-hero-title.loaded { opacity: 1; transform: translateY(0); }
        .s-hero-rule {
          width: 100%;
          height: 1px;
          background: #000;
          margin-top: 40px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
        }
        .s-hero-rule.loaded { transform: scaleX(1); }
        .s-services { padding: 0 40px; }
        .s-block {
          display: grid;
          grid-template-columns: 60px 1fr 1fr;
          padding: 60px 0;
          border-bottom: 1px solid #e0e0e0;
          position: relative;
          cursor: pointer;
          transition: opacity 0.3s ease;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.3s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .s-block.loaded { opacity: 1; transform: translateY(0); }
        .s-block:hover { opacity: 0.5; }
        .s-num {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 20px;
          font-weight: normal;
          color: #999;
          padding-top: 6px;
        }
        .s-left { padding-right: 60px; }
        .s-title {
          font-family: Helvetica, Arial, sans-serif;
          font-size: clamp(32px, 4.5vw, 64px);
          line-height: 1.1;
          font-weight: bold;
          color: #000;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .s-subtitle {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 20px;
          font-weight: normal;
          color: #999;
        }
        .s-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-top: 6px;
        }
        .s-desc {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 20px;
          font-weight: normal;
          line-height: 1.5;
          color: #000;
          max-width: 480px;
        }
        .s-cta {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 20px;
          font-weight: normal;
          color: #000;
          margin-top: 30px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .s-arrow {
          display: inline-block;
          width: 24px;
          height: 1px;
          background: currentColor;
          position: relative;
        }
        .s-arrow::after {
          content: '';
          position: absolute;
          right: 0; top: -3px;
          width: 8px; height: 8px;
          border-right: 1px solid currentColor;
          border-top: 1px solid currentColor;
          transform: rotate(45deg);
        }
        .s-footer {
          padding: 80px 40px 60px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .s-footer-email {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 20px;
          font-weight: normal;
          color: #000;
          text-decoration: none;
        }
        .s-footer-email:hover { opacity: 0.5; }
        .s-footer-mark {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 20px;
          font-weight: normal;
          color: #999;
        }
        @media (max-width: 768px) {
          .s-nav { padding: 0 24px; }
          .s-hero { padding-left: 24px; padding-right: 24px; }
          .s-services { padding: 0 24px; }
          .s-block {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 40px 0;
          }
          .s-left { padding-right: 0; }
          .s-right { padding-top: 0; }
          .s-desc { max-width: 100%; }
          .s-footer {
            padding: 60px 24px 40px;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>
      <div className="services-page">
        <nav className="s-nav">
          <span className="s-nav-name">Alex Taves</span>
          <button className="s-nav-back" onClick={onBack}>Back</button>
        </nav>

        <section className="s-hero">
          <h1 className={`s-hero-title ${loaded ? "loaded" : ""}`}>Services</h1>
          <div className={`s-hero-rule ${loaded ? "loaded" : ""}`} />
        </section>

        <section className="s-services">
          {services.map((service, i) => (
            <div
              key={service.id}
              className={`s-block ${loaded ? "loaded" : ""}`}
              style={{ transitionDelay: `${0.4 + i * 0.15}s` }}
            >
              <span className="s-num">{service.id}</span>
              <div className="s-left">
                <h2 className="s-title">{service.title}</h2>
                <span className="s-subtitle">{service.subtitle}</span>
              </div>
              <div className="s-right">
                <p className="s-desc">{service.description}</p>
                <span className="s-cta">
                  {service.cta}
                  <span className="s-arrow" />
                </span>
              </div>
            </div>
          ))}
        </section>

        <footer className="s-footer">
          <a href="mailto:hello@alextaves.com" className="s-footer-email">
            hello@alextaves.com
          </a>
          <span className="s-footer-mark">© 2026</span>
        </footer>
      </div>
    </>
  );
}
