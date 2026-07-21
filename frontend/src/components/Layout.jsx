import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navLinkClass = ({ isActive }) =>
  `px-3 py-1.5 text-sm font-medium rounded transition-colors ${
    isActive ? 'bg-forest text-paper' : 'text-ink/80 hover:bg-ink/5'
  }`;

export default function Layout({ children }) {
  const { admin, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-rule bg-card">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/dashboard')} className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-600 text-forestDark">Attend</span>
              <span className="font-mono text-xs tracking-widest text-brick uppercase">QR</span>
            </button>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" end className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/generate-qr" className={navLinkClass}>Generate QR</NavLink>
              <NavLink to="/edit-attendance" className={navLinkClass}>Edit Attendance</NavLink>
              <NavLink to="/reports" className={navLinkClass}>Reports</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/students')}
              className="px-3 py-1.5 text-sm font-medium rounded border border-forest text-forestDark hover:bg-forest hover:text-paper transition-colors"
            >
              View Students
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => navigate('/admins')}
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
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}