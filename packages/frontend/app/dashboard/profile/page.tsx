'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    lsk_number: '',
    firm_name: '',
    professional_address: '',
    advocate_phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/profile/me');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await apiClient.put('/profile/me', profile);
      setMessage('✅ Professional profile updated successfully.');
    } catch (err) {
      setMessage('❌ Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold italic text-gray-400">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight italic underline decoration-indigo-500 underline-offset-8">Professional Credentials</h1>
        <p className="text-gray-400 text-xs mt-4 font-bold uppercase tracking-widest">Verify & Manage your Legal Identity</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
            <input 
              type="text" 
              value={profile.first_name}
              onChange={(e) => setProfile({...profile, first_name: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
            <input 
              type="text" 
              value={profile.last_name}
              onChange={(e) => setProfile({...profile, last_name: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">LSK Admission Number</label>
            <input 
              type="text" 
              placeholder="e.g. P.105/..."
              value={profile.lsk_number}
              onChange={(e) => setProfile({...profile, lsk_number: e.target.value})}
              className="w-full px-6 py-4 bg-indigo-50/30 border-2 border-indigo-100/50 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-700 placeholder-indigo-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Firm Name</label>
            <input 
              type="text" 
              value={profile.firm_name}
              onChange={(e) => setProfile({...profile, firm_name: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Official Phone</label>
            <input 
              type="text" 
              value={profile.advocate_phone}
              onChange={(e) => setProfile({...profile, advocate_phone: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address (ReadOnly)</label>
            <input 
              type="text" 
              value={profile.email}
              disabled
              className="w-full px-6 py-4 bg-gray-100 border-none rounded-2xl text-gray-400 font-bold cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Professional Chambers Address</label>
          <textarea 
            value={profile.professional_address}
            onChange={(e) => setProfile({...profile, professional_address: e.target.value})}
            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900 h-32 resize-none"
            placeholder="Full physical address for service of process..."
          />
        </div>

        <div className="pt-6 flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{message}</p>
          <button 
            type="submit"
            disabled={saving}
            className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            {saving ? 'Synchronizing...' : 'Save Credentials'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
           <h3 className="text-sm font-black uppercase tracking-widest mb-2">Digital Signature</h3>
           <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-6 opacity-80">Your signature is used to execute Affidavits and Skeletal Arguments automatically.</p>
           <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition">Update Signature</button>
        </div>
        <div className="p-8 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-100">
           <h3 className="text-sm font-black uppercase tracking-widest mb-2">LSK Verification</h3>
           <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">Status: <span className="text-emerald-400 font-black">ACTIVE</span> · Verified via LSK Portal API</p>
           <button className="px-6 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition">Refresh Status</button>
        </div>
      </div>
    </div>
  );
}
