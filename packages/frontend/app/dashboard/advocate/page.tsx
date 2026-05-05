'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-store';

// ============================================================
// Advocate Dashboard — Kenny's role-specific landing page
// PRD: Case management, document validation, legal research,
//      conveyancing, AI assistant access
// ============================================================

const stats = [
  { label: 'Active Cases', value: '14', delta: '+2 this week', icon: '📋', color: 'from-blue-500 to-blue-600' },
  { label: 'Pending Actions', value: '3', delta: '1 deadline today', icon: '⏰', color: 'from-amber-400 to-orange-500' },
  { label: 'AI Validations', value: '27', delta: '94% pass rate', icon: '🤖', color: 'from-purple-500 to-indigo-600' },
  { label: 'Docs Uploaded', value: '89', delta: 'This month', icon: '📄', color: 'from-emerald-500 to-teal-600' },
];

const recentCases = [
  { ref: 'JLSP-2026-001234', title: 'ABC Ltd v Commissioner of Domestic Taxes', status: 'Active', statusColor: 'bg-green-100 text-green-800', court: 'High Court – Commercial Div.' },
  { ref: 'JLSP-2026-000987', title: 'Mwangi v National Land Commission', status: 'Pending Hearing', statusColor: 'bg-yellow-100 text-yellow-800', court: 'Environment & Land Court' },
  { ref: 'JLSP-2026-000845', title: 'Estate of Kamau (Conveyancing)', status: 'Draft', statusColor: 'bg-gray-100 text-gray-700', court: 'Registry' },
];

const deadlines = [
  { task: 'File Replying Affidavit', case: 'JLSP-2026-001234', due: 'Today', urgency: 'critical' },
  { task: 'Submit Conveyancing Bundle', case: 'JLSP-2026-000845', due: 'In 3 days', urgency: 'warning' },
  { task: 'Review AI Validation Report', case: 'JLSP-2026-000987', due: 'In 7 days', urgency: 'info' },
];

const quickActions = [
  { href: '/dashboard/cases/file-new', label: 'File New Case', icon: '📝', desc: 'eFiling with AI pre-validation' },
  { href: '/dashboard/research', label: 'Legal Research', icon: '🔍', desc: 'Semantic search — Kenyan statutes' },
  { href: '/dashboard/conveyancing', label: 'Conveyancing', icon: '🏠', desc: 'Title verification, deed drafting' },
  { href: '/dashboard/cases', label: 'View All Cases', icon: '📋', desc: 'Full case management workspace' },
];

export default function AdvocateDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              ⚖️ Advocate / Legal Practitioner
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1">Good day, {user?.firstName}!</h1>
          <p className="text-blue-100 text-lg">
            AI-Enhanced Judicial &amp; Legal Services Platform — Kenya Judiciary &amp; KRA
          </p>
          <p className="text-blue-200 text-xs mt-2">
            Constitution Art 48 (Access to Justice) · DPA Cap 411C · Civil Procedure Rules 2010
          </p>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -right-8 -bottom-12 h-40 w-40 rounded-full bg-white/5" />
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow p-5">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full bg-gradient-to-br ${s.color} opacity-10`} />
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.delta}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Cases */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">My Cases</h2>
            <Link href="/dashboard/cases" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentCases.map((c) => (
              <div key={c.ref} className="flex items-start justify-between p-4 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition cursor-pointer">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.ref} · {c.court}</p>
                </div>
                <span className={`ml-4 shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.statusColor}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">⏰ Deadlines</h2>
            <div className="space-y-3">
              {deadlines.map((d) => (
                <div key={d.task} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                  d.urgency === 'critical' ? 'border-red-500 bg-red-50'
                  : d.urgency === 'warning' ? 'border-amber-400 bg-amber-50'
                  : 'border-blue-400 bg-blue-50'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{d.task}</p>
                    <p className="text-xs text-gray-500 truncate">{d.case}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold ${
                    d.urgency === 'critical' ? 'text-red-600'
                    : d.urgency === 'warning' ? 'text-amber-600'
                    : 'text-blue-600'
                  }`}>{d.due}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-400 hover:bg-indigo-50 transition group"
                >
                  <span className="text-xl shrink-0">{a.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Advisory Banner ── */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex gap-4 items-start">
        <span className="text-2xl shrink-0">🤖</span>
        <div>
          <p className="font-semibold text-indigo-900">AI Document Validation Ready</p>
          <p className="text-sm text-indigo-700 mt-1">
            Upload any pleading or contract for instant AI-powered structural analysis against Civil Procedure Rules 2010 and Contract Law patterns.
          </p>
          <p className="text-xs text-indigo-400 mt-2 italic">
            ⚠️ Non-Binding Advisory — All AI outputs require advocate review before filing. [AI-JLSP PRD Sec 7]
          </p>
        </div>
        <Link href="/dashboard/cases/file-new" className="ml-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          Validate →
        </Link>
      </div>
    </div>
  );
}
