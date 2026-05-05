'use client';

export default function LegalResearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Legal Research</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Box */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Semantic Search</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search statutes, cases, precedents..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
              🔍 Search
            </button>
          </div>

          <div className="mt-8">
            <h3 className="font-bold text-gray-900 mb-4">Recent Searches</h3>
            <div className="space-y-2">
              {['Contract law remedies', 'Land Act amendments', 'Tax procedure deadlines'].map((search) => (
                <button
                  key={search}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded text-gray-700"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Resources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Resources</h2>
          <div className="space-y-3">
            <ResourceCard title="eKLR" icon="📖" />
            <ResourceCard title="Case Law" icon="⚖️" />
            <ResourceCard title="Legislation" icon="📜" />
            <ResourceCard title="Practice Directions" icon="📋" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ title, icon }: { title: string; icon: string }) {
  return (
    <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
      <span className="text-lg mr-2">{icon}</span>
      <span className="font-medium text-gray-900">{title}</span>
    </button>
  );
}
