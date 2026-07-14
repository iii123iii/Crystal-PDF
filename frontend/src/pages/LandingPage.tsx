import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Scissors,
  Shield,
  Minimize2,
  ScanText,
  Image,
  Merge,
  ArrowRight,
  Upload,
  Wand2,
  Download,
  Gem,
  Pen,
  FileOutput,
  Menu,
  X,
  FileText,
  Check,
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
  { num: '02', icon: Wand2, title: 'Process', body: 'Pick a tool: merge, split, compress, protect, annotate, convert, and more.' },
  { num: '03', icon: Download, title: 'Download', body: 'Every operation creates a new file. Your originals are never modified.' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#050e18] text-slate-200 relative overflow-x-clip">
      {/* ── CSS ─────────────────────────────────────────────── */}
      <style>{`
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
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
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

        /* Feature card */
        .tool-card {
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.05);
          transition: border-color .25s ease, background-color .25s ease, transform .25s ease;
        }
        .tool-card:hover {
          background: rgba(255,255,255,.04);
          border-color: rgba(59,130,246,.25);
          transform: translateY(-2px);
        }

        /* Gem logo glow */
        .gem-glow {
          filter: drop-shadow(0 0 8px rgba(59,130,246,.4));
        }

        /* Product mock window */
        .mock-window {
          background: linear-gradient(180deg, rgba(15,23,42,.9), rgba(8,15,30,.95));
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          box-shadow: 0 24px 64px rgba(0,0,0,.5), 0 0 0 1px rgba(59,130,246,.06);
        }
        .mock-sidebar-item {
          transition: background-color .2s ease;
        }
        .mock-sidebar-item:hover {
          background: rgba(59,130,246,.08);
        }
        .mock-page {
          background: #f8fafc;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,.15);
        }
        .mock-line {
          height: 6px;
          border-radius: 2px;
          background: #cbd5e1;
        }
        .mock-line.short { width: 40%; }
        .mock-line.medium { width: 65%; }
        .mock-line.long { width: 85%; }

        .pulse-dot {
          animation: pulse-soft 2.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-reveal, .anim-fade { animation: none; }
          .pulse-dot { animation: none; }
        }
      `}</style>

      {/* ── Ambient glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] rounded-full bg-blue-500/[.04] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] rounded-full bg-indigo-500/[.03] blur-[100px]" />
      </div>

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#050e18]/80 border-b border-white/[.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <Gem size={22} className="text-blue-400 gem-glow" strokeWidth={1.5} />
            <span className="font-display font-semibold text-white text-lg tracking-tight">
              Crystal<span className="text-blue-400">PDF</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#tools" className="text-sm text-slate-400 hover:text-white transition-colors">Tools</a>
            <a href="#how" className="text-sm text-slate-400 hover:text-white transition-colors">How it works</a>
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link
              to="/register"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Get started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 -mr-2 text-slate-300 hover:text-white transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu sheet */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[.04] bg-[#050e18]/95 backdrop-blur-xl">
            <div className="px-4 py-4 flex flex-col gap-1">
              <a
                href="#tools"
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-slate-300 hover:bg-white/[.04] hover:text-white transition-colors min-h-[44px]"
              >
                Tools
              </a>
              <a
                href="#how"
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-slate-300 hover:bg-white/[.04] hover:text-white transition-colors min-h-[44px]"
              >
                How it works
              </a>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-3 py-3 rounded-lg text-slate-300 hover:bg-white/[.04] hover:text-white transition-colors min-h-[44px]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center px-3 py-3 mt-2 rounded-lg text-white bg-blue-600 hover:bg-blue-500 font-medium transition-colors min-h-[44px]"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 anim-reveal">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-dot" />
              <span className="text-xs font-medium text-blue-300 tracking-wide">Free, in-browser, no upload limits</span>
            </div>

            <h1 className="font-display font-semibold tracking-tight leading-[1.08] text-white anim-reveal anim-d1"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              Every PDF tool you need,
              <br className="hidden sm:block" />
              <span className="text-blue-400"> in one place.</span>
            </h1>

            <p className="mt-5 text-slate-400 leading-relaxed anim-reveal anim-d2 max-w-lg"
               style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
              Merge, split, compress, protect, OCR, and convert your documents.
              All processing runs in your browser. Your files never leave your device.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 anim-reveal anim-d3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors min-h-[48px] whitespace-nowrap"
              >
                Start free
                <ArrowRight size={18} />
              </Link>
              <a
                href="#tools"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[.03] text-slate-200 font-medium transition-colors min-h-[48px] whitespace-nowrap"
              >
                Explore tools
              </a>
            </div>
          </div>

          {/* Right: product mock — CSS-built PDF workspace */}
          <div className="anim-fade anim-d4 relative">
            <div className="mock-window p-3 sm:p-4 mx-auto max-w-md lg:max-w-none">
              {/* Window title bar */}
              <div className="flex items-center gap-2 pb-3 border-b border-white/[.06]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[11px] text-slate-500 font-mono">crystal-pdf · workspace</span>
                </div>
                <Gem size={14} className="text-blue-400/60" />
              </div>

              {/* Workspace body: sidebar + document */}
              <div className="flex gap-3 mt-3" style={{ minHeight: '280px' }}>
                {/* Sidebar */}
                <div className="hidden sm:flex flex-col gap-1 w-32 shrink-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 px-2 pb-1">Tools</div>
                  {[
                    { icon: Merge, label: 'Merge', active: true },
                    { icon: Scissors, label: 'Split' },
                    { icon: Minimize2, label: 'Compress' },
                    { icon: Shield, label: 'Protect' },
                    { icon: ScanText, label: 'OCR' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`mock-sidebar-item flex items-center gap-2 px-2 py-2 rounded-md text-xs ${item.active ? 'bg-blue-500/10 text-blue-300' : 'text-slate-400'}`}
                    >
                      <item.icon size={13} strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Document preview */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                  {/* File tab */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/[.03] border border-white/[.05]">
                    <FileText size={14} className="text-blue-400 shrink-0" />
                    <span className="text-xs text-slate-300 truncate">quarterly_report.pdf</span>
                    <span className="ml-auto text-[10px] text-slate-600 shrink-0">2.4 MB</span>
                  </div>

                  {/* Page preview */}
                  <div className="mock-page p-4 sm:p-6 flex flex-col gap-2.5 flex-1">
                    <div className="mock-line long" style={{ height: '8px', background: '#1e293b' }} />
                    <div className="mock-line short mt-1" style={{ height: '4px', background: '#94a3b8' }} />
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="mock-line long" />
                      <div className="mock-line medium" />
                      <div className="mock-line long" />
                      <div className="mock-line short" />
                      <div className="mock-line medium" />
                      <div className="mock-line long" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <div className="flex-1 h-12 rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <Image size={16} className="text-slate-300" />
                      </div>
                      <div className="flex-1 h-12 rounded border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <Check size={16} className="text-green-400" />
                      </div>
                    </div>
                    <div className="mt-1 flex flex-col gap-1.5">
                      <div className="mock-line medium" />
                      <div className="mock-line short" />
                    </div>
                  </div>

                  {/* Status bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-600 px-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                      Ready
                    </span>
                    <span>Page 1 of 12</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating accent glow behind mock */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-blue-500/[.06] blur-3xl" aria-hidden />
          </div>
        </div>
      </section>

      {/* ── Tools grid ─────────────────────────────────────── */}
      <section id="tools" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Section header */}
        <div className="max-w-lg mb-10 sm:mb-14">
          <p className="text-xs font-medium tracking-[.15em] uppercase text-blue-400 mb-3">
            Tools
          </p>
          <h2 className="font-display font-semibold tracking-tight text-white"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>
            Eight tools, one workspace
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Everything you need to work with PDFs, without installing anything.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {tools.map((t) => (
            <div
              key={t.name}
              className="tool-card rounded-xl p-4 sm:p-5 flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <t.icon size={18} className="text-blue-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm sm:text-base">{t.name}</h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-snug">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center max-w-lg mx-auto mb-12 sm:mb-16">
          <p className="text-xs font-medium tracking-[.15em] uppercase text-blue-400 mb-3">
            How it works
          </p>
          <h2 className="font-display font-semibold tracking-tight text-white"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>
            Three steps, that's it
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 sm:gap-6">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center text-center md:items-start md:text-left">
              {/* Number + icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <s.icon size={20} className="text-blue-400" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-xs text-slate-600">{s.num}</span>
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="rounded-2xl border border-white/[.06] bg-gradient-to-b from-blue-500/[.06] to-transparent p-8 sm:p-12 text-center">
          <h2 className="font-display font-semibold tracking-tight text-white"
              style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>
            Start working with your PDFs today
          </h2>
          <p className="mt-3 text-slate-400 max-w-md mx-auto text-sm sm:text-base">
            No credit card, no install, no file size limits.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 mt-6 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors min-h-[48px] whitespace-nowrap"
          >
            Get started free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Gem size={18} className="text-blue-400/60" strokeWidth={1.5} />
            <span className="font-display font-medium text-slate-300 text-sm">
              Crystal<span className="text-blue-400/60">PDF</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 text-center sm:text-right">
            All processing happens in your browser. Your files never leave your device.
          </p>
        </div>
      </footer>
    </div>
  )
}