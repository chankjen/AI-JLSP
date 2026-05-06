'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-store';
import apiClient from '@/lib/api-client';

// ============================================================
// Litigation Counsel Dashboard — Baha's role-specific landing page
// PRD: Case progression, judicial oversight, AI approval,
//      evidence management, Constitution Art 159 (expeditious justice)
// ============================================================

const stats = [
  { label: 'Cases Managed', value: '67', delta: '12 in trial phase', icon: '⚖️', color: 'from-slate-600 to-gray-800' },
  { label: 'Hearings This Week', value: '8', delta: 'Next: Tomorrow 10AM', icon: '🗓️', color: 'from-blue-500 to-cyan-600' },
  { label: 'AI Reviews Pending', value: '5', delta: 'Require approval', icon: '🤖', color: 'from-violet-500 to-purple-600' },
  { label: 'Avg. Resolution', value: '42d', delta: 'vs 68d benchmark', icon: '📉', color: 'from-emerald-500 to-teal-600' },
];

const caseList = [
  { ref: 'JUD-2026-003311', title: 'Republic v Otieno & 3 Others', division: 'Criminal Div.', stage: 'Trial — Day 4', nextAction: 'Cross-examination', urgency: 'high' },
  { ref: 'JUD-2026-003289', title: 'Wambui v National Housing Corp.', division: 'Civil Div.', stage: 'Written Submissions', nextAction: 'File by 9 May', urgency: 'medium' },
  { ref: 'JUD-2026-003201', title: 'ABC Bank v Kariuki (Recovery)', division: 'Commercial Div.', stage: 'Judgment Pending', nextAction: 'Judgment delivery', urgency: 'low' },
  { ref: 'JUD-2026-003155', title: 'TDR Appeal — Meridian Freight', division: 'Tax Appeal Tribunal', stage: 'Hearing Scheduled', nextAction: '14 May 2026', urgency: 'medium' },
];

const hearingSchedule = [
  { time: '10:00 AM', title: 'Republic v Otieno', court: 'Court 4A', type: 'Criminal Trial' },
  { time: '02:30 PM', title: 'Wambui v NHC', court: 'Court 2', type: 'Civil — Mention' },
  { time: '04:00 PM', title: 'AI Review — Meridian Freight docs', court: 'Chambers', type: 'AI Approval Required' },
];

const aiPendingReviews = [
  { doc: 'Meridian Freight Objection Analysis', model: 'Legal-BERT-KE', confidence: '74%', recommendation: 'Invalid — grounds insufficient', action: 'Override / Approve' },
  { doc: 'Wambui Pleading Structure Check', model: 'Document Validator', confidence: '89%', recommendation: 'Valid — minor corrections noted', action: 'Approve' },
];

const quickActions = [
  { href: '/dashboard/cases', label: 'Case Management', icon: '⚖️', desc: 'Full litigation oversight workspace' },
  { href: '/dashboard/research', label: 'Precedent Search', icon: '📚', desc: 'Semantic search — Kenyan case law' },
  { href: '/dashboard/tdr', label: 'TDR Appeals', icon: '📊', desc: 'Tax tribunal case oversight' },
  { href: '/dashboard/compliance', label: 'Audit Trail', icon: '🔒', desc: '90-day audit log visibility' },
];

const urgencyStyles: Record<string, string> = {
  high: 'border-l-4 border-red-500 bg-red-50',
  medium: 'border-l-4 border-amber-400 bg-amber-50',
  low: 'border-l-4 border-green-400 bg-green-50',
};

export default function LitigationCounselDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await apiClient.get('/cases');
        setCases(res.data.cases || []);
      } catch (err) {
        console.error('Failed to fetch cases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const handleCaseClick = (id: string) => {
    router.push(`/dashboard/cases/${id}`);
  };

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-gray-900 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              ⚖️ Litigation Counsel — Judiciary of Kenya
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-1">Good day, {user?.firstName}!</h1>
          <p className="text-slate-300 text-lg">Judicial Case Management &amp; AI Oversight Console</p>
          <p className="text-slate-400 text-xs mt-2">
            Constitution Art 159 (Expeditious Justice) · Art 50 (Fair Hearing) · Art 160 (Judicial Independence) · DPA Cap 411C
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

        {/* Cases */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">⚖️ Active Cases</h2>
              <Link href="/dashboard/cases" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                View all →
              </Link>
            </div>
            
            {loading ? (
              <div className="py-10 text-center text-gray-400 text-sm italic">Retrieving case files...</div>
            ) : cases.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm italic">No active litigation cases assigned.</div>
            ) : (
              <div className="space-y-3">
                {cases.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => handleCaseClick(c.id)}
                    className={`flex items-start gap-4 p-4 rounded-lg border-l-4 border-slate-400 bg-slate-50 cursor-pointer hover:bg-slate-100 transition group`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-slate-900">{c.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.case_number} · {c.jurisdiction}</p>
                      <div className="flex gap-3 mt-1.5 flex-wrap">
                        <span className="text-[10px] bg-white text-emerald-700 rounded-full px-2 py-0.5 font-black uppercase border border-emerald-100 shadow-sm">{c.status}</span>
                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-widest">📅 Updated {new Date(c.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* AI Reviews Requiring Approval */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🤖 AI Reviews — Awaiting Approval</h2>
            <p className="text-xs text-gray-400 italic mb-4">
              ⚠️ AI outputs are Non-Binding Advisory. Your approval is required before any action. [AI-JLSP PRD Sec 7 | Constitution Art 160]
            </p>
            <div className="space-y-3">
              {aiPendingReviews.map((r) => (
                <div key={r.doc} className="flex items-center gap-4 p-4 rounded-lg border border-violet-100 bg-violet-50/30">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{r.doc}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Model: {r.model} · Confidence: {r.confidence}</p>
                    <p className="text-xs font-medium text-violet-700 mt-1">AI Recommendation: {r.recommendation}</p>
                  </div>
                  <button className="shrink-0 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg transition">
                    {r.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Today's Hearing Schedule */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🗓️ Today&apos;s Schedule</h2>
            <div className="space-y-3">
              {hearingSchedule.map((h, i) => (
                <div key={i} className="flex gap-4 items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                  <div className="text-center shrink-0 w-16">
                    <p className="text-sm font-bold text-slate-800">{h.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{h.title}</p>
                    <p className="text-xs text-gray-500">{h.court} · {h.type}</p>
                  </div>
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
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-slate-400 hover:bg-slate-50 transition group"
                >
                  <span className="text-xl shrink-0">{a.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-slate-800">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Judicial Independence Notice */}
          <div className="rounded-xl bg-slate-800 text-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300 mb-2">⚖️ Judicial Independence</p>
            <p className="text-xs text-slate-400">
              All AI recommendations on this platform are Non-Binding Advisory. Final judicial determinations rest solely with the presiding officer. <br />
              <span className="text-slate-500">Constitution Art 160 · AI-JLSP PRD Sec 7 · DPA Cap 411C Sec 31</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

