import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import Footer from './Footer.jsx';

const navLinkClass = ({ isActive }) =>
  `px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap ${
    isActive ? 'glass-btn bg-forestGlass text-white' : 'text-ink/80 hover:bg-white/20'
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `block w-full px-3 py-2.5 text-sm font-medium rounded transition-colors ${
    isActive ? 'glass-btn bg-forestGlass text-white' : 'text-ink/80 hover:bg-white/20'
  }`;

export default function Layout({ children }) {
  const { admin, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function go(path) {
    setMenuOpen(false);
    navigate(path);
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <header className="border-b border-rule bg-card relative z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => go('/dashboard')} className="flex items-center gap-2">
              <Logo iconSize={32} textSize="text-base" showSubtitle={false} />
            </button>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" end className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/generate-qr" className={navLinkClass}>Generate QR</NavLink>
              <NavLink to="/edit-attendance" className={navLinkClass}>Edit Attendance</NavLink>
              <NavLink to="/reports" className={navLinkClass}>Reports</NavLink>
            </nav>
          </div>

          {/* Desktop right-side actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => go('/students')}
              className="px-3 py-1.5 text-sm font-medium rounded border border-forest text-forestDark hover:bg-forest hover:text-paper transition-colors"
            >
              View Students
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => go('/admins')}
                className="px-3 py-1.5 text-sm font-medium rounded border border-forest text-forestDark hover:bg-forest hover:text-paper transition-colors"
              >
                Manage Admin
              </button>
            )}
            <span className="hidden sm:inline text-xs font-mono text-ink/50">{admin?.name}</span>
            <button
              onClick={logout}
              className="text-xs font-mono text-ink/50 hover:text-brick transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 text-ink/80"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown panel */}
        {menuOpen && (
          <div className="md:hidden border-t border-rule bg-card px-4 py-3 space-y-1">
            <NavLink to="/dashboard" end className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/generate-qr" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
              Generate QR
            </NavLink>
            <NavLink to="/edit-attendance" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
              Edit Attendance
            </NavLink>
            <NavLink to="/reports" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
              Reports
            </NavLink>
            <button
              onClick={() => go('/students')}
              className="block w-full text-left px-3 py-2.5 text-sm font-medium rounded border border-forest text-forestDark"
            >
              View Students
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => go('/admins')}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium rounded border border-forest text-forestDark"
              >
                Manage Admin
              </button>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-rule mt-2">
              <span className="text-xs font-mono text-ink/50">{admin?.name}</span>
              <button
                onClick={logout}
                className="text-xs font-mono text-ink/50 hover:text-brick transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}