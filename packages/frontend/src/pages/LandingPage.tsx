import { useNavigate } from 'react-router-dom';
import {
  Shield, Globe, Brain, BarChart3, ArrowRight,
  CheckCircle, Code, FileText, ScanLine,
} from 'lucide-react';

const features = [
  { icon: Globe,     title: 'Puppeteer Rendering',  desc: 'Scans JavaScript-heavy SPAs (React, Vue, Angular) via headless Chromium — not just static HTML.' },
  { icon: Shield,    title: 'WCAG 2.1/2.2 Engine',  desc: '10+ modular rules covering Perceivable, Operable, Understandable and Robust principles.' },
  { icon: Brain,     title: 'AI Fix Generation',    desc: 'Before/after HTML remediation powered by OpenAI or Claude with a rule-based fallback.' },
  { icon: BarChart3, title: 'Scoring Engine',        desc: 'Weighted 0–100 score with per-principle breakdown and severity-based grade (A–F).' },
  { icon: Code,      title: 'Developer Focused',    desc: 'Precise CSS selectors, HTML snippets, and step-by-step fix instructions for every violation.' },
  { icon: FileText,  title: 'Report Export',        desc: 'Export to JSON, CSV, or self-contained HTML reports for sharing and compliance.' },
];

const wcagRules = [
  'Missing Alt Text', 'Form Labels', 'Page Title', 'HTML Lang',
  'Heading Hierarchy', 'Button Names', 'Skip Navigation',
  'Duplicate IDs', 'ARIA Attributes', 'Color Contrast',
];

const grades = [
  { grade: 'A', range: '90–100', bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700' },
  { grade: 'B', range: '75–89',  bg: 'bg-lime-50',   border: 'border-lime-200',  text: 'text-lime-700'  },
  { grade: 'C', range: '60–74',  bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700' },
  { grade: 'D', range: '40–59',  bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-700'},
  { grade: 'F', range: '0–39',   bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700'   },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg text-slate-900">
              Access<span className="text-blue-600">Fix</span>
            </span>
          </div>
          <button
            onClick={() => navigate('/scan')}
            className="btn-primary"
            aria-label="Start a free accessibility scan"
          >
            Start Free Scan <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-slate-200 pt-20 pb-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-8">
            <ScanLine className="w-3.5 h-3.5" aria-hidden="true" />
            WCAG 2.1 &amp; 2.2 · AI-Powered Remediation
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            Fix Web Accessibility<br />
            <span className="text-blue-600">Instantly</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            AccessFix scans any website with headless Chromium, detects WCAG violations across
            10+ rule categories, scores your accessibility 0–100, and generates AI-powered HTML
            fix suggestions — in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/scan')} className="btn-primary text-base px-6 py-3">
              <ScanLine className="w-5 h-5" aria-hidden="true" />
              Scan a Website Free
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary text-base px-6 py-3">
              <BarChart3 className="w-5 h-5" aria-hidden="true" />
              View Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ── WCAG Rules covered ───────────────────────────────── */}
      <section className="py-10 border-b border-slate-200 bg-white" aria-label="WCAG rules covered">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Rules Covered
            </span>
            {wcagRules.map((r) => (
              <span key={r} className="flex items-center gap-1.5 text-sm text-slate-600">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="py-20 px-8 bg-slate-50" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="text-3xl font-bold text-slate-900 mb-3">
              Everything you need for accessibility
            </h2>
            <p className="text-slate-600 text-base max-w-2xl mx-auto">
              A professional-grade platform built for developers, QA engineers, and accessibility auditors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:border-blue-200 transition-colors duration-150">
                <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Score grades ─────────────────────────────────────── */}
      <section className="py-16 px-8 bg-white border-y border-slate-200" aria-labelledby="grades-heading">
        <div className="max-w-4xl mx-auto text-center">
          <h2 id="grades-heading" className="text-2xl font-bold text-slate-900 mb-8">
            Accessibility Score Grades
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {grades.map(({ grade, range, bg, border, text }) => (
              <div
                key={grade}
                className={`${bg} ${border} border rounded-lg p-6 text-center`}
              >
                <div className={`text-4xl font-black ${text}`}>{grade}</div>
                <div className="text-xs text-slate-500 mt-2">{range} / 100</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-20 px-8 text-center bg-blue-600" aria-labelledby="cta-heading">
        <div className="max-w-2xl mx-auto">
          <h2 id="cta-heading" className="text-3xl font-bold text-white mb-4">
            Ready to fix accessibility?
          </h2>
          <p className="text-blue-100 mb-8 text-base">
            Enter any URL and get a full WCAG report with AI-powered fixes in under 30 seconds.
          </p>
          <button
            onClick={() => navigate('/scan')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-semibold text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-150 shadow-sm text-base"
          >
            <ScanLine className="w-5 h-5" aria-hidden="true" />
            Start Scanning Now
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 px-8 py-5 text-center text-slate-500 text-sm">
        AccessFix v1.0 &middot; AI-Assisted WCAG 2.1/2.2 Accessibility Analyzer &middot; Academic Research Project
      </footer>
    </div>
  );
}
