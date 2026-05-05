'use client';

export default function CasesPage() {
  const cases = [
    {
      id: 'JLSP-2026-001234',
      title: 'ABC Corp v XYZ Ltd',
      status: 'active',
      filedDate: '2026-01-15',
      nextHearing: '2026-05-20',
      judge: 'Hon. Justice Smith',
    },
    {
      id: 'JLSP-2026-001235',
      title: 'Estate of John Doe',
      status: 'pending_validation',
      filedDate: '2026-04-30',
      nextHearing: '-',
      judge: 'Pending Assignment',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          📝 File New Case
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Case ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Filed Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Next Hearing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Judge</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cases.map((caseItem) => (
              <tr key={caseItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{caseItem.id}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{caseItem.title}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      caseItem.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {caseItem.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{caseItem.filedDate}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{caseItem.nextHearing}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{caseItem.judge}</td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-indigo-600 hover:text-indigo-900">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
