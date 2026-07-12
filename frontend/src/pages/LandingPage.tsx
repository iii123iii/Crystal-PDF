import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './LandingPage.module.css'

const features = [
  {
    icon: '📄',
    title: 'Smart Document Management',
    description:
      'Upload, organise, and search through all your documents in one place. Supports PDF, Word, Excel, and more.',
  },
  {
    icon: '✏️',
    title: 'Rich Annotations',
    description:
      'Highlight, draw, and add text notes directly on documents. Collaborate with your team in real time.',
  },
  {
    icon: '🔒',
    title: 'Enterprise Security',
    description:
      'Role-based access control, audit logs, and end-to-end encryption keep your data safe at every step.',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description:
      'Optimised rendering pipeline means even 1000-page PDFs open instantly, on any device.',
  },
  {
    icon: '🌐',
    title: 'Works Everywhere',
    description:
      'Fully responsive — desktop, tablet, or phone. Native-quality experience in every modern browser.',
  },
  {
    icon: '🔗',
    title: 'Powerful Integrations',
    description:
      'Connect with Slack, Google Drive, Dropbox, and your existing tools via our open REST API.',
  },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Head of Legal, Acme Corp',
    avatar: 'SC',
    quote:
      'DocuFlow cut our contract review time in half. The annotation tools are genuinely brilliant.',
  },
  {
    name: 'Marcus Rivera',
    role: 'CTO, StartupXYZ',
    avatar: 'MR',
    quote:
      'We evaluated six document platforms. DocuFlow was the only one that worked perfectly on mobile out of the box.',
  },
  {
    name: 'Priya Nair',
    role: 'Operations Manager, GlobalCo',
    avatar: 'PN',
    quote:
      'The search is incredibly fast. I can find any document across thousands of files in seconds.',
  },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.page}>
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.navBrand}>
            <span className={styles.logo}>📋</span>
            <span className={styles.brandName}>DocuFlow</span>
          </div>

          {/* Hamburger – visible on mobile only */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className={menuOpen ? styles.barOpen1 : styles.bar} />
            <span className={menuOpen ? styles.barOpen2 : styles.bar} />
            <span className={menuOpen ? styles.barOpen3 : styles.bar} />
          </button>

          {/* Nav links */}
          <ul className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
            <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
            <li><a href="#testimonials" onClick={() => setMenuOpen(false)}>Testimonials</a></li>
            <li><a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a></li>
            <li>
              <Link to="/login" className={styles.navCta} onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>✨ Now with AI-powered search</span>
          <h1 className={styles.heroTitle}>
            Documents, <span className={styles.heroAccent}>reimagined</span>
            <br />for modern teams
          </h1>
          <p className={styles.heroSub}>
            Manage, annotate, and collaborate on every document your business needs — from any
            device, anywhere in the world.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/register" className={styles.btnPrimary}>
              Get started free
            </Link>
            <a href="#features" className={styles.btnSecondary}>
              See how it works
            </a>
          </div>
          <p className={styles.heroNote}>No credit card required · Free forever plan available</p>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.mockWindow}>
            <div className={styles.mockBar}>
              <span /><span /><span />
            </div>
            <div className={styles.mockBody}>
              <div className={styles.mockLine} style={{ width: '85%' }} />
              <div className={styles.mockLine} style={{ width: '60%' }} />
              <div className={styles.mockLine} style={{ width: '75%' }} />
              <div className={styles.mockHighlight} />
              <div className={styles.mockLine} style={{ width: '50%' }} />
              <div className={styles.mockLine} style={{ width: '90%' }} />
              <div className={styles.mockLine} style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Everything your team needs</h2>
          <p className={styles.sectionSub}>
            Powerful features that scale from solo freelancers to Fortune 500 enterprises.
          </p>
          <div className={styles.featuresGrid}>
            {features.map(f => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section id="testimonials" className={styles.testimonials}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Loved by teams worldwide</h2>
          <div className={styles.testimonialsGrid}>
            {testimonials.map(t => (
              <div key={t.name} className={styles.testimonialCard}>
                <p className={styles.testimonialQuote}>"{t.quote}"</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.avatar}>{t.avatar}</div>
                  <div>
                    <div className={styles.authorName}>{t.name}</div>
                    <div className={styles.authorRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className={styles.pricing}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
          <p className={styles.sectionSub}>Start free. Upgrade when you're ready.</p>
          <div className={styles.pricingGrid}>
            {/* Free */}
            <div className={styles.pricingCard}>
              <h3 className={styles.planName}>Free</h3>
              <div className={styles.planPrice}>$0<span>/mo</span></div>
              <ul className={styles.planFeatures}>
                <li>✓ Up to 50 documents</li>
                <li>✓ Basic annotations</li>
                <li>✓ 1 GB storage</li>
                <li>✓ Community support</li>
              </ul>
              <Link to="/register" className={styles.btnPlanFree}>Get started</Link>
            </div>
            {/* Pro */}
            <div className={`${styles.pricingCard} ${styles.pricingCardHighlight}`}>
              <span className={styles.popularBadge}>Most popular</span>
              <h3 className={styles.planName}>Pro</h3>
              <div className={styles.planPrice}>$12<span>/mo</span></div>
              <ul className={styles.planFeatures}>
                <li>✓ Unlimited documents</li>
                <li>✓ All annotation tools</li>
                <li>✓ 100 GB storage</li>
                <li>✓ Priority support</li>
                <li>✓ Team collaboration</li>
              </ul>
              <Link to="/register" className={styles.btnPlanPro}>Start free trial</Link>
            </div>
            {/* Enterprise */}
            <div className={styles.pricingCard}>
              <h3 className={styles.planName}>Enterprise</h3>
              <div className={styles.planPrice}>Custom</div>
              <ul className={styles.planFeatures}>
                <li>✓ Everything in Pro</li>
                <li>✓ SSO & SAML</li>
                <li>✓ Unlimited storage</li>
                <li>✓ Dedicated support</li>
                <li>✓ SLA guarantee</li>
              </ul>
              <a href="mailto:sales@docuflow.app" className={styles.btnPlanFree}>Contact sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaTitle}>Ready to transform how you work with documents?</h2>
          <p className={styles.ctaSub}>Join 10,000+ teams already using DocuFlow.</p>
          <Link to="/register" className={styles.btnPrimary}>
            Create your free account →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.logo}>📋</span>
            <span className={styles.brandName}>DocuFlow</span>
            <p className={styles.footerTagline}>Documents, reimagined.</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} DocuFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
