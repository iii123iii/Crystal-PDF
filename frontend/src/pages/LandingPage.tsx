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
    <div className="min-h-screen bg-[#050e18] text-slate-200 relative overflow-x-hidden">
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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }

        .anim-reveal { animation: reveal .7s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade   { animation: fade   .9s ease both; }

        .anim-d1 { animation-delay: .08s; }
        .anim-d2 { animation-delay: .16s; }
        .anim-d3 { animation-delay: .24s; }
        .anim-d4 { animation-delay: .36s; }

        .prism {
          width: min(280px, 80vw);
          height: min(280px, 80vw);
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,.08);
          background: linear-gradient(135deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.01) 100%);
          backdrop-filter: blur(16px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,.04) inset,
            0 24px 64px -16px rgba(0,0,0,.6),
            0 0 80px -20px rgba(45,98,255,.2);
          animation: float 6s ease-in-out infinite;
        }

        /* Dot grid texture */
        .dot-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Tool card hover */
        .tool-card {
          transition: all .2s cubic-bezier(.16,1,.3,1);
          border: 1px solid rgba(255,255,255,.05);
          background: rgba(255,255,255,.015);
        }
        .tool-card:hover {
          border-color: rgba(45,98,255,.3);
          background: rgba(45,98,255,.04);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px -8px rgba(0,0,0,.4);
        }
      `}</style>

      {/* ── Background accents ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top center glow */}
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[min(900px,100vw)] h-[min(900px,100vw)] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(45,98,255,.08) 0%, transparent 70%)' }} />
        {/* Subtle mid-page highlight */}
        <div className="absolute top-[55%] -right-[10%] w-[min(500px,80vw)] h-[min(500px,80vw)] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,.04) 0%, transparent 60%)' }} />
      </div>

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[.04]"
        style={{ background: 'rgba(5,14,24,.8)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-blue-400 flex items-center justify-center
                            shadow-[0_0_16px_rgba(45,98,255,.4)] group-hover:shadow-[0_0_24px_rgba(45,98,255,.6)]
                            transition-shadow">
              <Gem size={14} className="text-white" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Crystal<span className="text-blue-400">PDF</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link to="/login"
              className="text-xs sm:text-sm text-slate-400 hover:text-white px-2.5 sm:px-4 py-2 transition-colors">
              Sign in
            </Link>
            <Link to="/register"
              className="text-xs sm:text-sm font-medium text-blue-300 bg-brand-500/15 hover:bg-brand-500/25
                         border border-brand-500/25 hover:border-brand-500/40
                         px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6
                          pt-14 pb-20 sm:pt-20 sm:pb-24 md:pt-32 md:pb-36
                          grid md:grid-cols-[1fr,auto] items-center gap-8 sm:gap-12">
        {/* Text column */}
        <div className="max-w-2xl text-center md:text-left">
          <h1 className="font-display font-semibold tracking-tight leading-[1.1]
                         text-[clamp(2.1rem,7vw,4.8rem)] text-white anim-reveal">
            Every<br className="hidden sm:block" /> PDF tool<br className="hidden sm:block" /> you'll ever{' '}
            <em className="not-italic text-blue-400">need.</em>
          </h1>

          <p className="mt-5 sm:mt-7 text-[clamp(0.95rem,2vw,1.2rem)] leading-relaxed
                        text-slate-400 max-w-md mx-auto md:mx-0 anim-reveal anim-d2">
            Merge, split, compress, protect, convert, and annotate&nbsp;&mdash;
            from one elegant workspace. No subscriptions, no upload limits.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-3 anim-reveal anim-d3">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-medium
                         text-white bg-gradient-to-b from-brand-500 to-brand-600
                         shadow-[0_2px_24px_rgba(45,98,255,.35)]
                         hover:shadow-[0_4px_32px_rgba(45,98,255,.5)]
                         hover:-translate-y-px active:translate-y-0 transition-all w-full sm:w-auto">
              Start for free <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-medium
                         text-slate-300 border border-white/10 hover:border-white/20
                         hover:bg-white/[.03] transition-all w-full sm:w-auto">
              Sign in to workspace
            </Link>
          </div>
        </div>

        {/* Crystal visual */}
        <div className="flex items-center justify-center anim-fade anim-d4 mt-6 md:mt-0">
          <div className="prism flex items-center justify-center">
            {/* Inner facets */}
            <div className="flex items-center justify-center">
              <Layers size={48} className="text-blue-400/30" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools grid ─────────────────────────────────────── */}
      <section className="relative z-10 dot-grid">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32">
          {/* Section header */}
          <div className="max-w-lg mb-10 sm:mb-14 text-center md:text-left mx-auto md:mx-0">
            <p className="text-xs font-medium tracking-[.15em] uppercase text-brand-400 mb-3 sm:mb-4">
              Toolkit
            </p>
            <h2 className="font-display text-[clamp(1.8rem,5vw,3.5rem)] font-semibold
                           tracking-tight leading-[1.05] text-white">
              Everything in<br className="hidden sm:block" /> one workspace
            </h2>
            <p className="mt-3 sm:mt-4 text-slate-500 leading-relaxed text-sm sm:text-[15px]">
              Every operation produces a new file — your originals stay untouched.
            </p>
          </div>

          {/* Grid: 1 col on xs, 2 cols on mobile, 4 cols on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {tools.map((t) => (
              <div key={t.name} className="tool-card rounded-2xl p-4 sm:p-5 cursor-default group flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-400/[.08] border border-blue-400/[.12]
                                  flex items-center justify-center mb-3 sm:mb-4
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="relative z-10 border-t border-white/[.04]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32">
          <div className="text-center max-w-lg mx-auto mb-12 sm:mb-16">
            <p className="text-xs font-medium tracking-[.15em] uppercase text-brand-400 mb-3 sm:mb-4">
              How it works
            </p>
            <h2 className="font-display text-[clamp(1.8rem,5vw,3.5rem)] font-semibold
                           tracking-tight leading-[1.05] text-white">
              Three steps, that's it
            </h2>
          </div>

          <div className="flex flex-col gap-0">
            {steps.map((s, i) => (
              <div key={s.num}>
                {/* Step row */}
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Left: number + icon */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
                                    bg-brand-500/10 border border-brand-500/20 shrink-0">
                      <s.icon size={18} className="text-blue-400 sm:w-5 sm:h-5" strokeWidth={1.6} />
                    </div>
                  </div>

                  {/* Right: text */}
                  <div className="pt-0.5 sm:pt-1">
                    <p className="text-xs font-medium text-brand-400/60 tracking-wider mb-1">
                      Step {s.num}
                    </p>
                    <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight mb-1 sm:mb-1.5">
                      {s.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
                      {s.body}
                    </p>
                  </div>
                </div>

                {/* Connector between steps */}
                {i < steps.length - 1 && (
                  <div className="flex items-stretch gap-4 sm:gap-5 py-1">
                    <div className="w-10 sm:w-12 flex justify-center shrink-0">
                      <div className="w-px h-6 sm:h-8 bg-gradient-to-b from-brand-500/20 to-transparent" />
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 md:py-36 text-center">
          {/* Soft top glow */}
          <div className="absolute inset-x-0 top-0 h-64 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 50% 100% at 50% 0%, rgba(45,98,255,.06), transparent)' }} />

          <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4 relative">
            Free to use. No credit card required.
          </p>
          <h2 className="font-display text-[clamp(2rem,6vw,4.5rem)] font-semibold
                         tracking-tight leading-[1.05] sm:leading-[.95] text-white mb-8 sm:mb-10 relative">
            Start working with<br />
            your PDFs today.
          </h2>
          <div className="relative flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 max-w-md mx-auto sm:max-w-none">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-xl text-[15px] font-medium
                         text-white bg-gradient-to-b from-brand-500 to-brand-600
                         shadow-[0_2px_24px_rgba(45,98,255,.35)]
                         hover:shadow-[0_4px_32px_rgba(45,98,255,.5)]
                         hover:-translate-y-px transition-all">
              Create free account <ArrowRight size={15} strokeWidth={2.2} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-xl text-[15px] font-medium
                         text-slate-400 hover:text-slate-200 transition-colors">
              or sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-3 sm:gap-4">
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
