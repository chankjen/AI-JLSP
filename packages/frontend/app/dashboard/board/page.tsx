'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function BoardPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prioritizing, setPrioritizing] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await apiClient.get('/board/meetings');
      setMeetings(res.data.meetings || []);
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritize = async (meetingId: string) => {
    setPrioritizing(true);
    try {
      const res = await apiClient.post(`/board/meetings/${meetingId}/prioritize`);
      alert('AI Agenda Prioritization Complete. Action items extracted.');
      fetchMeetings();
    } catch (err) {
      alert('Prioritization failed');
    } finally {
      setPrioritizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Board & Secretariat</h1>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">
          📅 Schedule New Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Active Boards" value="4" color="indigo" />
        <StatCard label="Pending Action Items" value="21" color="amber" />
        <StatCard label="Completed Minutes" value="156" color="emerald" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Upcoming Board Sessions</h2>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Next 30 Days</span>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-gray-400 italic">Fetching board schedule...</div>
        ) : meetings.length === 0 ? (
          <div className="p-10 text-center text-gray-400 italic text-sm">No upcoming meetings found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="p-6 hover:bg-indigo-50/20 transition group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition">{meeting.title}</h3>
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                        {meeting.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">📅 {new Date(meeting.meeting_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">🕒 {meeting.meeting_time}</span>
                      <span className="flex items-center gap-1">👥 {Object.keys(meeting.attendees || {}).length} Members</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handlePrioritize(meeting.id)}
                      disabled={prioritizing}
                      className="flex-1 md:flex-none px-4 py-2 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-50 transition disabled:opacity-50"
                    >
                      {prioritizing ? '...' : '🤖 AI Prioritize'}
                    </button>
                    <button className="flex-1 md:flex-none px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition">
                      View Details
                    </button>
                  </div>
                </div>
                {meeting.ai_rationale && (
                  <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1 tracking-wider">AI Prioritization Rationale</p>
                    <p className="text-xs text-indigo-800 leading-relaxed italic">"{meeting.ai_rationale}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: any = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  };

  return (
    <div className={`rounded-2xl shadow-sm border p-6 ${colors[color]}`}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-4xl font-black mt-2">{value}</p>
    </div>
  );
}

