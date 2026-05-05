'use client';

export default function CompliancePage() {
  const alerts = [
    {
      id: 1,
      severity: 'high',
      title: 'DPA Compliance Alert',
      description: '3 documents require review for data protection compliance',
      date: '2026-05-05',
    },
    {
      id: 2,
      severity: 'medium',
      title: 'Bias Detection',
      description: 'Automated review detected potential bias in AI recommendations',
      date: '2026-05-04',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Compliance & Audit</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Compliance Score" value="98%" color="green" />
        <StatCard label="Active Alerts" value="2" color="yellow" />
        <StatCard label="Recent Audits" value="5" color="blue" />
        <StatCard label="DPA Issues" value="0" color="green" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Alerts</h2>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Audit Trail</h2>
        <p className="text-gray-600">Immutable record of all AI-assisted actions and decisions</p>
        <button className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          View Full Audit Log
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClass = {
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    blue: 'bg-blue-100',
    red: 'bg-red-100',
  }[color] || 'bg-blue-100';

  return (
    <div className={`${colorClass} rounded-lg p-6`}>
      <p className="text-gray-700 text-sm">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const severityColor =
    alert.severity === 'high'
      ? 'bg-red-100 border-red-500'
      : alert.severity === 'medium'
        ? 'bg-yellow-100 border-yellow-500'
        : 'bg-blue-100 border-blue-500';

  return (
    <div className={`border-l-4 ${severityColor} p-4 rounded`}>
      <h3 className="font-bold text-gray-900">{alert.title}</h3>
      <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
      <p className="text-xs text-gray-600 mt-2">{alert.date}</p>
    </div>
  );
}
