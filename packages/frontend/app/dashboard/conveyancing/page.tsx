'use client';

export default function ConveyancingPage() {
  const transactions = [
    {
      id: 'CONV-2026-0001',
      property: '123 Main Street, Nairobi',
      type: 'Sale',
      parties: 'John Doe to Jane Smith',
      status: 'title_verification',
      value: 'KES 8,500,000',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Conveyancing</h1>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          📝 New Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Active Transactions" value="8" />
        <StatCard label="Under Review" value="3" />
        <StatCard label="This Month" value="12" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{tx.id}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{tx.property}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{tx.type}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tx.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
