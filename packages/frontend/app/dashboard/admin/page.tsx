'use client';

export default function AdminPage() {
  const users = [
    {
      id: 1,
      name: 'John Mwangi',
      email: 'john.mwangi@judiciary.ke',
      role: 'JUDGE',
      status: 'active',
    },
    {
      id: 2,
      name: 'Jane Kipchoge',
      email: 'jane.kipchoge@kra.go.ke',
      role: 'KRA_OFFICER',
      status: 'active',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          ➕ Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Users" value="156" />
        <StatCard label="Active Sessions" value="23" />
        <StatCard label="System Health" value="99.8%" />
        <StatCard label="Last Backup" value="2h ago" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                <td className="px-6 py-4 text-sm">{user.role.replace(/_/g, ' ')}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Disable</button>
                </td>
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
