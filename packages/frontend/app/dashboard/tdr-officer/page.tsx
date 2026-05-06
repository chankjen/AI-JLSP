'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-store';
import apiClient from '@/lib/api-client';

// ============================================================
// TDR Officer Dashboard — Alicia's role-specific landing page
// PRD: Tax dispute objections, ADR, TPA Sec 51(3), AI triage,
//      14-day timers, KRA iTax integration
// ============================================================

const stats = [
  { label: 'Objection Queue', value: '38', delta: '6 unassigned', icon: '📥', color: 'from-red-500 to-rose-600' },
  { label: 'ADR In Progress', value: '11', delta: '2 reach deadline', icon: '🤝', color: 'from-amber-400 to-orange-500' },
  { label: 'Resolved This Month', value: '24', delta: '↑ 12% vs prior', icon: '✅', color: 'from-emerald-500 to-teal-600' },
  { label: 'AI Validity Score', value: '91%', delta: 'Avg. objections', icon: '🤖', color: 'from-purple-500 to-indigo-600' },
];

const objectionQueue = [
  { ref: 'TDR-2026-004521', taxpayer: 'Savanna Holdings Ltd', amount: 'KES 18.4M', grounds: 'Withholding Tax Assessment', daysLeft: 2, status: 'Pending Review', statusColor: 'bg-red-100 text-red-800' },
  { ref: 'TDR-2026-004488', taxpayer: 'Kamau Wanjiku (Self)', amount: 'KES 340K', grounds: 'PAYE Dispute', daysLeft: 7, status: 'AI Validated', statusColor: 'bg-green-100 text-green-800' },
  { ref: 'TDR-2026-004401', taxpayer: 'Meridian Freight Co.', amount: 'KES 5.2M', grounds: 'VAT Refund Rejection', daysLeft: 14, status: 'ADR Offered', statusColor: 'bg-blue-100 text-blue-800' },
  { ref: 'TDR-2026-004377', taxpayer: 'Nafuu Traders Ltd', amount: 'KES 1.1M', grounds: 'Import Duty Classification', daysLeft: 9, status: 'Pending Review', statusColor: 'bg-yellow-100 text-yellow-800' },
];

const adrPipeline = [
  { ref: 'ADR-2026-0021', parties: 'KRA v Savanna Holdings', mediator: 'Hon. A. Otieno', nextSession: '2026-05-08', progress: 60 },
  { ref: 'ADR-2026-0019', parties: 'KRA v Meridian Freight', mediator: 'Ms. F. Kimani', nextSession: '2026-05-12', progress: 30 },
];

const quickActions = [
  { href: '/dashboard/tdr/new-objection', label: 'Process Objection', icon: '📋', desc: 'TPA Sec 51(3) auto-check + 14-day timer' },
  { href: '/dashboard/tdr/adr', label: 'ADR Management', icon: '🤝', desc: 'Mediation, arbitration scheduling' },
  { href: '/dashboard/tdr/validate', label: 'AI Validity Check', icon: '🤖', desc: 'TDR document pre-screening' },
  { href: '/dashboard/compliance', label: 'Compliance Report', icon: '📊', desc: 'DPA audit trail & KPIs' },
];

export default function TDROfficerDashboard() {
  const { user } = useAuth();
  const [objections, setObjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObjections = async () => {
      try {
        const res = await apiClient.get('/tdr');
        setObjections(res.data.tdrDisputes || []);
      } catch (err) {
        console.error('Failed to fetch objections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchObjections();
  }, []);

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              💼 TDR Officer — KRA Tax Dispute Resolution
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1">Welcome, {user?.firstName}!</h1>
          <p className="text-orange-100 text-lg">Tax Dispute Resolution Command Centre</p>
          <p className="text-orange-200 text-xs mt-2">
            Tax Procedures Act Sec 51(3) · KRA Act Cap 469 · Constitution Art 47 (Fair Admin)
          </p>
        </div>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -right-8 -bottom-12 h-40 w-40 rounded-full bg-white/5" />
      </div>

      {/* ── Stats ── */}
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

        {/* Objection Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">📥 Objection Queue</h2>
            <Link href="/dashboard/tdr" className="text-sm text-rose-600 hover:text-rose-800 font-medium">
              View all →
            </Link>
          </div>
          
          {loading ? (
            <div className="py-10 text-center text-gray-400 text-sm italic">Loading objections...</div>
          ) : objections.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm italic">No active objections in queue.</div>
          ) : (
            <div className="space-y-3">
              {objections.map((o) => (
                <Link 
                  key={o.id} 
                  href={`/dashboard/tdr/${o.id}`}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{o.taxpayer_name}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-800 capitalize`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{o.objection_id} · Year {o.tax_year}</p>
                    <p className="text-xs font-bold text-gray-700 mt-1">KES {parseFloat(o.amount_disputed).toLocaleString()}</p>
                  </div>
                  <div className="shrink-0 text-center rounded-lg px-3 py-2 bg-gray-100">
                    <p className="text-xl font-extrabold text-gray-700">{o.validity_score || '?'}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Score</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* ADR Pipeline */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🤝 ADR Pipeline</h2>
            <div className="space-y-4">
              {adrPipeline.map((adr) => (
                <div key={adr.ref} className="p-3 rounded-lg border border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{adr.parties}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{adr.ref} · Mediator: {adr.mediator}</p>
                  <p className="text-xs text-gray-500">Next session: {adr.nextSession}</p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all"
                      style={{ width: `${adr.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{adr.progress}% resolved</p>
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
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-rose-400 hover:bg-rose-50 transition group"
                >
                  <span className="text-xl shrink-0">{a.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-rose-700">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Compliance Notice ── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-4 items-start">
        <span className="text-2xl shrink-0">⚠️</span>
        <div className="flex-1">
          <p className="font-semibold text-amber-900">14-Day Statutory Window Reminder</p>
          <p className="text-sm text-amber-700 mt-1">
            {objections.length} active objections in queue. TPA Sec 51(3) requires a decision or extension before expiry to avoid deemed allowance.
          </p>
          <p className="text-xs text-amber-400 mt-2 italic">
            ⚠️ AI triage outputs are Non-Binding Advisory only. Final TDR decisions require officer sign-off. [AI-JLSP PRD Sec 7 | TPA Sec 51]
          </p>
        </div>
      </div>
    </div>
  );
}

