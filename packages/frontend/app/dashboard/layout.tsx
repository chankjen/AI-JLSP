'use client';

import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Chatbot from '@/components/Chatbot';

// ── Role-specific nav items ──────────────────────────────────────
const NAV_BY_ROLE: Record<string, { href: string; label: string; icon: string }[]> = {
  advocate: [
    { href: '/dashboard/advocate', label: 'Home', icon: '🏠' },
    { href: '/dashboard/cases', label: 'My Cases', icon: '📋' },
    { href: '/dashboard/research', label: 'Legal Research', icon: '🔍' },
    { href: '/dashboard/conveyancing', label: 'Conveyancing', icon: '📑' },
    { href: '/dashboard/compliance', label: 'Compliance', icon: '✅' },
    { href: '/dashboard/ai-analysis', label: 'AI Intelligence', icon: '🤖' },
  ],
  tdr_officer: [
    { href: '/dashboard/tdr-officer', label: 'Home', icon: '🏠' },
    { href: '/dashboard/tdr', label: 'TDR Queue', icon: '📥' },
    { href: '/dashboard/cases', label: 'Cases', icon: '📋' },
    { href: '/dashboard/compliance', label: 'Compliance', icon: '📊' },
    { href: '/dashboard/ai-analysis', label: 'AI Intelligence', icon: '🤖' },
  ],
  litigation_counsel: [
    { href: '/dashboard/litigation-counsel', label: 'Home', icon: '🏠' },
    { href: '/dashboard/cases', label: 'Case Management', icon: '⚖️' },
    { href: '/dashboard/research', label: 'Precedent Search', icon: '📚' },
    { href: '/dashboard/tdr', label: 'TDR Appeals', icon: '💼' },
    { href: '/dashboard/compliance', label: 'Audit Trail', icon: '🔒' },
    { href: '/dashboard/ai-analysis', label: 'AI Intelligence', icon: '🤖' },
  ],
  board_secretary: [
    { href: '/dashboard/board-secretary', label: 'Home', icon: '🏠' },
    { href: '/dashboard/board', label: 'Board Services', icon: '👥' },
    { href: '/dashboard/cases', label: 'Cases', icon: '📋' },
    { href: '/dashboard/compliance', label: 'Compliance', icon: '✅' },
    { href: '/dashboard/ai-analysis', label: 'AI Intelligence', icon: '🤖' },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Admin Panel', icon: '⚙️' },
    { href: '/dashboard/cases', label: 'Cases', icon: '📋' },
    { href: '/dashboard/tdr', label: 'TDR', icon: '💼' },
    { href: '/dashboard/compliance', label: 'Compliance', icon: '📊' },
    { href: '/dashboard/ai-analysis', label: 'AI Intelligence', icon: '🤖' },
  ],
  dpo: [
    { href: '/dashboard/compliance', label: 'DPA Compliance', icon: '🔒' },
    { href: '/dashboard/cases', label: 'Cases', icon: '📋' },
    { href: '/dashboard/ai-analysis', label: 'AI Intelligence', icon: '🤖' },
  ],
  citizen: [
    { href: '/dashboard/cases/file-new', label: 'File a Case', icon: '📝' },
    { href: '/dashboard/cases', label: 'My Cases', icon: '📋' },
    { href: '/dashboard/research', label: 'Legal Aid', icon: '🔍' },
    { href: '/dashboard/ai-analysis', label: 'AI Intelligence', icon: '🤖' },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  advocate: 'bg-indigo-600',
  tdr_officer: 'bg-rose-600',
  litigation_counsel: 'bg-slate-800',
  board_secretary: 'bg-emerald-700',
  admin: 'bg-gray-900',
  dpo: 'bg-teal-700',
  citizen: 'bg-blue-600',
};

const ROLE_LABELS: Record<string, string> = {
  advocate: 'Advocate',
  tdr_officer: 'TDR Officer · KRA',
  litigation_counsel: 'Litigation Counsel · Judiciary',
  board_secretary: 'Board Secretary',
  admin: 'System Administrator',
  dpo: 'Data Protection Officer',
  citizen: 'Citizen',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = NAV_BY_ROLE[user.role] ?? NAV_BY_ROLE.citizen;
  const roleColor = ROLE_COLORS[user.role] ?? 'bg-indigo-600';
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left: menu + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-lg font-extrabold text-gray-900 tracking-tight">AI-JLSP</span>
            <span className="hidden sm:inline text-xs text-gray-400">Kenya Judiciary &amp; KRA</span>
          </div>

          {/* Right: user info + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white ${roleColor}`}>
              {roleLabel}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Sign out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
            {/* Role badge */}
            <div className={`${roleColor} px-4 py-3`}>
              <p className="text-white text-xs font-bold uppercase tracking-wider">{roleLabel}</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? `${roleColor} text-white shadow-sm`
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                AI-JLSP v1.0 · DPA Cap 411C compliant<br />
                Constitution Arts 31, 47, 48, 50, 159
              </p>
            </div>
          </aside>
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      {/* Global AI Chatbot */}
      <Chatbot />
    </div>
  );
}
