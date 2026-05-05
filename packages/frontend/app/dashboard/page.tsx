'use client';

import { useAuth } from '@/lib/auth-store';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const quickStats = [
    { label: 'Active Cases', value: '124', icon: '📋' },
    { label: 'Pending Actions', value: '12', icon: '⚠️' },
    { label: 'Compliance Score', value: '98%', icon: '✓' },
    { label: 'Documents Processed', value: '1,234', icon: '📄' },
  ];

  const recentActivity = [
    { type: 'case_filed', description: 'Case JLSP-2026-001234 filed', timestamp: '2 hours ago' },
    { type: 'tdr_submitted', description: 'TDR Objection submitted', timestamp: '4 hours ago' },
    { type: 'document_validated', description: 'Contract reviewed and approved', timestamp: '1 day ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
        <p className="text-blue-100">AI-Enhanced Judicial & Legal Services Platform</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-gray-600 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                <div className="text-2xl">📌</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickActionButton href="/dashboard/cases/new" label="File New Case" icon="📝" />
            <QuickActionButton href="/dashboard/research" label="Legal Research" icon="🔍" />
            <QuickActionButton href="/dashboard/tdr" label="TDR Objection" icon="📊" />
            <QuickActionButton href="/dashboard/conveyancing" label="New Conveyance" icon="📑" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <div className="flex">
          <div className="text-yellow-600 mr-3">⚠️</div>
          <div>
            <h3 className="font-medium text-yellow-800">Compliance Alert</h3>
            <p className="text-sm text-yellow-700 mt-1">3 documents require review for DPA compliance</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="block w-full px-4 py-3 text-left rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition"
    >
      <span className="text-lg mr-2">{icon}</span>
      <span className="font-medium text-gray-900">{label}</span>
    </Link>
  );
}
