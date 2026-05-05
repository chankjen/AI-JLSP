'use client';

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const caseId = params.id;

  // Mock case data
  const caseData = {
    id: caseId,
    title: 'ABC Corp v XYZ Ltd',
    status: 'active',
    filedDate: '2026-01-15',
    judge: 'Hon. Justice Smith',
    caseNumber: 'JLSP-2026-001234',
    parties: [
      { role: 'Claimant', name: 'ABC Corporation Limited' },
      { role: 'Defendant', name: 'XYZ Limited' },
    ],
    documents: [
      { id: 1, name: 'Plaint', date: '2026-01-15', status: 'validated' },
      { id: 2, name: 'Written Statement', date: '2026-02-01', status: 'validated' },
    ],
    hearings: [
      { date: '2026-02-15', time: '10:00 AM', type: 'Hearing on Merits' },
      { date: '2026-05-20', time: '2:00 PM', type: 'Next Hearing' },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{caseData.title}</h1>
          <p className="text-gray-600 mt-2">Case No: {caseData.caseNumber}</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          {caseData.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Case Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Case Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Filed Date</dt>
              <dd className="text-gray-900">{caseData.filedDate}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Judge</dt>
              <dd className="text-gray-900">{caseData.judge}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-gray-900 capitalize">{caseData.status}</dd>
            </div>
          </dl>
        </div>

        {/* Parties */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Parties</h2>
          <div className="space-y-4">
            {caseData.parties.map((party, idx) => (
              <div key={idx}>
                <p className="text-sm font-medium text-gray-500">{party.role}</p>
                <p className="text-gray-900">{party.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Documents</h2>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Document</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {caseData.documents.map((doc) => (
              <tr key={doc.id}>
                <td className="px-4 py-3 text-gray-900">{doc.name}</td>
                <td className="px-4 py-3 text-gray-600">{doc.date}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    {doc.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-indigo-600 hover:text-indigo-900 cursor-pointer">
                  View
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hearing Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Hearing Schedule</h2>
        <div className="space-y-4">
          {caseData.hearings.map((hearing, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900">{hearing.type}</p>
                  <p className="text-sm text-gray-600">
                    📅 {hearing.date} at {hearing.time}
                  </p>
                </div>
                <button className="text-indigo-600 hover:text-indigo-900">Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
