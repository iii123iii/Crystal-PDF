import { Link } from 'react-router-dom'
import {
  Scissors,
  Shield,
  Minimize2,
  ScanText,
  Image,
  Merge,
  ArrowRight,
  Layers,
  Upload,
  Wand2,
  Download,
  Gem,
  Pen,
  FileOutput,
} from 'lucide-react'

const tools = [
  { icon: Merge, name: 'Merge', desc: 'Combine multiple documents into one' },
  { icon: Scissors, name: 'Split', desc: 'Extract pages or divide by range' },
  { icon: Minimize2, name: 'Compress', desc: 'Shrink file size, keep quality' },
  { icon: Shield, name: 'Protect', desc: 'Encrypt with password protection' },
  { icon: ScanText, name: 'OCR', desc: 'Extract text from scanned pages' },
  { icon: Image, name: 'Convert', desc: 'PDF to image, image to PDF' },
  { icon: Pen, name: 'Annotate', desc: 'Draw, highlight, and add text' },
  { icon: FileOutput, name: 'Export', desc: 'Word, image, and format tools' },
]

const steps = [
  { num: '01', icon: Upload, title: 'Upload', body: 'Drop any PDF into your workspace. Stored securely under your account.' },
  { num: '02', icon: Wand2, title: 'Process', body: 'Pick a tool — merge, split, compress, protect, annotate, convert, and more.' },
  { num: '03', icon: Download, title: 'Download', body: 'Every operation creates a new file. Your originals are never modified.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050e18] text-slate-200 relative">
      {/* ── CSS ─────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&display=swap');

        @keyframes reveal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .anim-reveal { animation: reveal .8s cubic-bezier(.16,1,.3,1) both; }
        .anim-d1 { animation-delay: .08s; }
        .anim-d2 { animation-delay: .16s; }
        .anim-d3 { animation-delay: .24s; }
        .anim-d4 { animation-delay: .36s; }
        .anim-fade { animation: fade .6s ease both; }

        /* Dot grid texture */
        .dot-grid {
          background-image: radial-gradient(rgba(148,163,184,.07) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Crystal prism */
        .prism {
          width: 340px;
          height: 340px;
          position: relative;
        }
        .prism::before {
          content: '';
          position: absolute;
          inset: 0;
          background: conic-gradient(
            from 160deg,
            rgba(45,98,255,.18),
            rgba(96,165,250,.12),
            rgba(56,189,248,.08),
            rgba(45,98,255,.04),
            rgba(96,165,250,.14),
            rgba(45,98,255,.18)
          );
          clip-path: polygon(50% 4%, 93% 28%, 93% 72%, 50% 96%, 7% 72%, 7% 28%);
          animation: rotate-slow 40s linear infinite;
        }
        .prism::after {
          content: '';
          position: absolute;
          inset: 30px;
          background: conic-gradient(
            from 220deg,
            rgba(96,165,250,.1),
            transparent,
            rgba(56,189,248,.06),
            transparent,
            rgba(96,165,250,.1)
          );
          clip-path: polygon(50% 6%, 91% 29%, 91% 71%, 50% 94%, 9% 71%, 9% 29%);
          animation: rotate-slow 60s linear infinite reverse;
        }

        /* Feature card */
        .tool-card {
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.05);
          transition: all .25s ease;
        }
        .tool-card:hover {
          background: rgba(255,255,255,.04);
          border-color: rgba(96,165,250,.18);
          transform: translateY(-2px);
          box-shadow: 0 16px 48px -12px rgba(0,0,0,.5), 0 0 0 1px rgba(96,165,250,.08);
        }

        /* Step connector dash */
        .step-connector {
          width: 100%;
          height: 1px;
          background: repeating-linear-gradient(
            90deg,
            rgba(96,165,250,.2) 0px,
            rgba(96,165,250,.2) 6px,
            transparent 6px,
            transparent 12px
          );
        }
      `}</style>

      {/* ── Ambient glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(45,98,255,.1) 0%, transparent 65%)' }} />
        <div className="absolute top-[55%] -right-[10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,.05) 0%, transparent 65%)' }} />
      </div>

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[.04]"
        style={{ background: 'rgba(5,14,24,.75)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-blue-400 flex items-center justify-center
                            shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
              <Gem size={14} className="text-white" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Crystal<span className="text-blue-400">PDF</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login"
              className="text-sm text-slate-400 hover:text-white px-4 py-2 transition-colors">
              Sign in
            </Link>
            <Link to="/register"
              className="text-sm font-medium text-blue-300 bg-brand-500/15 hover:bg-brand-500/25
                         border border-brand-500/25 hover:border-brand-500/40
                         px-4 py-2 rounded-lg transition-all">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6
                          pt-20 pb-24 md:pt-32 md:pb-36
                          grid md:grid-cols-[1fr,auto] items-center gap-12">
        {/* Text column */}
        <div className="max-w-2xl">
          <h1 className="font-display font-semibold tracking-tight leading-[1.1]
                         text-[clamp(2.2rem,5.5vw,4.8rem)] text-white anim-reveal">
            Every<br className="hidden sm:block" /> PDF tool<br className="hidden sm:block" /> you'll ever{' '}
            <em className="not-italic text-blue-400">need.</em>
          </h1>

          <p className="mt-7 text-[clamp(1rem,1.8vw,1.2rem)] leading-relaxed
                        text-slate-400 max-w-md anim-reveal anim-d2">
            Merge, split, compress, protect, convert, and annotate&nbsp;&mdash;
            from one elegant workspace. No subscriptions, no upload limits.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 anim-reveal anim-d3">
            <Link to="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-medium
                         text-white bg-gradient-to-b from-brand-500 to-brand-600
                         shadow-[0_2px_24px_rgba(45,98,255,.35)]
                         hover:shadow-[0_4px_32px_rgba(45,98,255,.5)]
                         hover:-translate-y-px active:translate-y-0 transition-all">
              Start for free <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-medium
                         text-slate-300 border border-white/10 hover:border-white/20
                         hover:bg-white/[.03] transition-all">
              Sign in to workspace
            </Link>
          </div>
        </div>

        {/* Crystal visual */}
        <div className="hidden md:flex items-center justify-center anim-fade anim-d4">
          <div className="prism">
            {/* Inner facets */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Layers size={48} className="text-blue-400/30" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools grid ─────────────────────────────────────── */}
      <section className="relative z-10 dot-grid">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          {/* Section header */}
          <div className="max-w-lg mb-14">
            <p className="text-xs font-medium tracking-[.15em] uppercase text-brand-400 mb-4">
              Toolkit
            </p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold
                           tracking-tight leading-[1.05] text-white">
              Everything in<br className="hidden sm:block" /> one workspace
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed text-[15px]">
              Every operation produces a new file — your originals stay untouched.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tools.map((t) => (
              <div key={t.name} className="tool-card rounded-2xl p-5 cursor-default group">
                <div className="w-10 h-10 rounded-xl bg-blue-400/[.08] border border-blue-400/[.12]
                                flex items-center justify-center mb-4
                                group-hover:bg-blue-400/[.12] group-hover:border-blue-400/[.2]
                                transition-colors">
                  <t.icon size={18} className="text-blue-400" strokeWidth={1.8} />
                </div>
                <p className="text-[15px] font-semibold text-white tracking-tight mb-1">
                  {t.name}
                </p>
                <p className="text-[13px] text-slate-500 leading-snug">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="relative z-10 border-t border-white/[.04]">
        <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center max-w-lg mx-auto mb-16">
            <p className="text-xs font-medium tracking-[.15em] uppercase text-brand-400 mb-4">
              How it works
            </p>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold
                           tracking-tight leading-[1.05] text-white">
              Three steps, that's it
            </h2>
          </div>

          <div className="flex flex-col gap-0">
            {steps.map((s, i) => (
              <div key={s.num}>
                {/* Step row */}
                <div className="flex items-start gap-5">
                  {/* Left: number + icon */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center
                                    bg-brand-500/10 border border-brand-500/20 shrink-0">
                      <s.icon size={20} className="text-blue-400" strokeWidth={1.6} />
                    </div>
                  </div>

                  {/* Right: text */}
                  <div className="pt-1">
                    <p className="text-xs font-medium text-brand-400/60 tracking-wider mb-1">
                      Step {s.num}
                    </p>
                    <h3 className="text-base font-semibold text-white tracking-tight mb-1.5">
                      {s.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                      {s.body}
                    </p>
                  </div>
                </div>

                {/* Connector between steps */}
                {i < steps.length - 1 && (
                  <div className="flex items-stretch gap-5 py-1">
                    <div className="w-12 flex justify-center shrink-0">
                      <div className="w-px h-8 bg-gradient-to-b from-brand-500/20 to-transparent" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-white/[.04]">
        <div className="max-w-6xl mx-auto px-6 py-28 md:py-36 text-center">
          {/* Soft top glow */}
          <div className="absolute inset-x-0 top-0 h-64 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 50% 100% at 50% 0%, rgba(45,98,255,.06), transparent)' }} />

          <p className="text-sm text-slate-500 mb-4 relative">
            Free to use. No credit card required.
          </p>
          <h2 className="font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold
                         tracking-tight leading-[.95] text-white mb-10 relative">
            Start working with<br />
            your PDFs today.
          </h2>
          <div className="relative flex flex-wrap justify-center gap-3">
            <Link to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-medium
                         text-white bg-gradient-to-b from-brand-500 to-brand-600
                         shadow-[0_2px_24px_rgba(45,98,255,.35)]
                         hover:shadow-[0_4px_32px_rgba(45,98,255,.5)]
                         hover:-translate-y-px transition-all">
              Create free account <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-medium
                         text-slate-400 hover:text-slate-200 transition-colors">
              or sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[.04]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-4">
          <span className="font-display text-sm font-semibold text-slate-600">
            Crystal<span className="text-blue-400/50">PDF</span>
          </span>
          <p className="text-xs text-slate-700">
            Secure, server-side processing. Your files never leave your account.
          </p>
        </div>
      </footer>
    </div>
  )
}
