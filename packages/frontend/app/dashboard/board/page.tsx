'use client';

export default function BoardPage() {
  const meetings = [
    {
      id: 'BOARD-2026-0001',
      date: '2026-05-15',
      time: '10:00 AM',
      title: 'Board Meeting - May 2026',
      attendees: 12,
      status: 'scheduled',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Board Services</h1>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
          📅 Schedule Meeting
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Upcoming Meetings" value="3" />
        <StatCard label="Action Items" value="7" />
        <StatCard label="Attendees" value="18" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Meetings</h2>
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{meeting.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    📅 {meeting.date} at {meeting.time}
                  </p>
                  <p className="text-sm text-gray-600">👥 {meeting.attendees} attendees</p>
                </div>
                <button className="text-indigo-600 hover:text-indigo-900 font-medium">View</button>
              </div>
            </div>
          ))}
        </div>
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
