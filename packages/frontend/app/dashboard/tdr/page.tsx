'use client';

export default function TDRPage() {
  const objections = [
    {
      id: 'TDR-2026-0001',
      taxpayer: 'ABC Manufacturing Ltd',
      status: 'under_review',
      amountDisputed: 'KES 2,500,000',
      filed: '2026-04-15',
      deadline: '2026-05-29',
    },
    {
      id: 'TDR-2026-0002',
      taxpayer: 'XYZ Traders',
      status: 'awaiting_response',
      amountDisputed: 'KES 750,000',
      filed: '2026-03-20',
      deadline: '2026-05-04',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tax Dispute Resolution</h1>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          📊 New Objection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Objections" value="12" trend="↑ 2 this month" />
        <StatCard label="Under Review" value="5" trend="3 awaiting response" />
        <StatCard label="Total Amount" value="KES 5.2M" trend="Across all cases" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Taxpayer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Filed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {objections.map((obj) => (
              <tr key={obj.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{obj.id}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{obj.taxpayer}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {obj.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{obj.amountDisputed}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{obj.filed}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{obj.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-sm text-gray-500 mt-2">{trend}</p>
    </div>
  );
}
