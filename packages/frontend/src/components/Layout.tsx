import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ScanLine, Clock, Settings, Shield } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scan',      icon: ScanLine,        label: 'New Scan'  },
  { to: '/history',   icon: Clock,           label: 'History'   },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ── Top nav ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5" aria-label="AccessFix home">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Access<span className="text-blue-600">Fix</span>
            </span>
          </a>

          {/* Nav links */}
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-1 list-none m-0 p-0">
              {navItems.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* WCAG compliance badges */}
          <div className="hidden md:flex items-center gap-2" aria-label="WCAG compliance">
            <span className="level-aa">WCAG 2.1</span>
            <span className="level-a">WCAG 2.2</span>
          </div>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8" id="main-content">
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-slate-500 text-sm">
        AccessFix v1.0 &middot; WCAG 2.1 / 2.2 Accessibility Analyzer &middot; AI-Powered Remediation
      </footer>
    </div>
  );
}
