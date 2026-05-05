import React from 'react';

interface ValueMetric {
  label: string;
  value: string | number;
  status: 'optimal' | 'warning' | 'critical';
  description: string;
}

export default function NationalValuesCard() {
  const values: ValueMetric[] = [
    {
      label: 'Transparency',
      value: '94%',
      status: 'optimal',
      description: 'AI decisions with human-readable rationale',
    },
    {
      label: 'Accountability',
      value: 'Verified',
      status: 'optimal',
      description: 'Immutable audit trail hash chain integrity',
    },
    {
      label: 'Inclusiveness',
      value: '88%',
      status: 'optimal',
      description: 'Multilingual and accessibility support coverage',
    },
    {
      label: 'Rule of Law',
      value: '100%',
      status: 'optimal',
      description: 'Statutory deadline compliance (TPA/Civil Rules)',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <span className="mr-2">🇰🇪</span> National Values & Principles (Art 10)
        </h2>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded uppercase">
          Compliant
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {values.map((v, i) => (
          <div key={i} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm font-semibold text-gray-700">{v.label}</p>
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                v.status === 'optimal' ? 'bg-green-500' : 
                v.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{v.value}</p>
            <p className="text-xs text-gray-500 mt-1">{v.description}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800 flex items-center">
          View Detailed Compliance Report →
        </button>
      </div>
    </div>
  );
}
