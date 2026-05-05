'use client';

import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
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

  const getDashboardLink = () => {
    const roleLinks: Record<string, string> = {
      JUDGE: '/dashboard/judicial',
      LEGAL_OFFICER: '/dashboard/legal',
      KRA_OFFICER: '/dashboard/tdr',
      CONVEYANCER: '/dashboard/conveyancing',
      BOARD_SECRETARY: '/dashboard/board',
      SUPER_ADMIN: '/dashboard/admin',
    };
    return roleLinks[user.role] || '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href={getDashboardLink()} className="text-xl font-bold text-indigo-600">
              AI-JLSP
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {user.firstName} {user.lastName}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user.role.replace(/_/g, ' ')}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white shadow-lg">
            <nav className="px-4 py-8 space-y-2">
              <NavLink href="/dashboard" label="Dashboard" icon="🏠" />
              <NavLink href="/dashboard/cases" label="Cases" icon="📋" />
              <NavLink href="/dashboard/research" label="Legal Research" icon="📚" />
              <NavLink href="/dashboard/tdr" label="Tax Disputes" icon="💼" />
              <NavLink href="/dashboard/conveyancing" label="Conveyancing" icon="🏠" />
              <NavLink href="/dashboard/board" label="Board Services" icon="👥" />
              <NavLink href="/dashboard/compliance" label="Compliance" icon="✓" />
              {user.role === 'SUPER_ADMIN' && (
                <NavLink href="/dashboard/admin" label="Administration" icon="⚙️" />
              )}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="block px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 font-medium">
      <span className="mr-2">{icon}</span>
      {label}
    </Link>
  );
}
