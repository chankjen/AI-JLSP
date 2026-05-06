'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import SignatureModal from '@/components/SignatureModal';

export default function CaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [showSigModal, setShowSigModal] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [commStatus, setCommStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchCaseDetails();
    checkSignature();
    // checkCommissioningStatus(); // Will implement specific check later
  }, [id]);

  const fetchCaseDetails = async () => {
    try {
      const res = await apiClient.get(`/cases/${id}`);
      setCaseData(res.data);
    } catch (err) {
      console.error('Failed to fetch case details:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkSignature = async () => {
    try {
      const res = await apiClient.get('/signatures/me');
      setHasSignature(!!res.data.signature);
    } catch (err) {
      console.error('Failed to check signature:', err);
    }
  };


  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-gray-500 font-medium italic">Loading Case File...</p>
      </div>
    </div>
  );

  if (!caseData?.case) return <div className="p-8 text-center text-red-500 font-bold">Error: Case not found or access denied.</div>;

  const { case: c, documents, hearings } = caseData;

  const handleIssueSummons = async () => {
    const email = prompt('Enter Defendant Email for E-Service:');
    const phone = prompt('Enter Defendant Phone for SMS Notification (Optional):');
    
    if (!email) return;

    try {
      const res = await apiClient.post(`/cases/${id}/issue-summons`, {
        defendantEmail: email,
        defendantPhone: phone
      });
      alert(res.data.message);
      fetchCaseDetails();
    } catch (err) {
      console.error('Failed to issue summons:', err);
      alert('Error issuing summons. Ensure you have proper permissions.');
    }
  };

  const handleDownloadAffidavit = async () => {
    if (!hasSignature) {
      setShowSigModal(true);
      return;
    }

    try {
      const response = await apiClient.get(`/cases/${id}/affidavit-of-service`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Affidavit_of_Service_${c.case_number}.html`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Could not generate affidavit. Ensure summons have been issued first.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <SignatureModal 
        isOpen={showSigModal} 
        onClose={() => setShowSigModal(false)} 
        onSuccess={() => {
          setHasSignature(true);
          handleDownloadAffidavit();
        }} 
      />
      {/* ── Breadcrumbs & Actions ── */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Link href="/dashboard/cases" className="hover:text-indigo-600 transition">Case Management</Link>
          <span>/</span>
          <span className="text-gray-900">{c.case_number}</span>
        </nav>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadAffidavit}
            className="px-4 py-2 border border-slate-900 text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-50 transition flex items-center gap-2"
          >
            📜 Download Affidavit 
            {commStatus === 'commissioned' ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">Sealed</span> : null}
          </button>
          {!commStatus && (
            <button 
              onClick={async () => {
                try {
                  await apiClient.post('/commissioning/request', { caseId: id, documentType: 'Affidavit of Service' });
                  alert('Document submitted to Commissioner for Oaths. You will be notified once sealed.');
                  setCommStatus('pending');
                } catch (err) { alert('Failed to submit for commissioning.'); }
              }}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition shadow-lg shadow-amber-100"
            >
              🏛️ Request Commissioning
            </button>
          )}
          <button 
            onClick={handleIssueSummons}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition shadow-lg shadow-slate-100"
          >
            📢 Issue Summons
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{c.title}</h1>
            <p className="text-indigo-600 font-mono font-bold uppercase tracking-widest text-xs">{c.case_number} · {c.case_type.replace('_', ' ')}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
            c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {c.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Presiding Court</p>
            <p className="text-sm font-bold text-gray-800">{c.court_name || 'Registry - Pending'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Judicial Officer</p>
            <p className="text-sm font-bold text-gray-800">{c.judge_name || 'Pending Assignment'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Filed</p>
            <p className="text-sm font-bold text-gray-800">{new Date(c.filed_date).toLocaleDateString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Mention</p>
            <p className="text-sm font-bold text-rose-600">{c.next_mention_date ? new Date(c.next_mention_date).toLocaleDateString() : 'TBD'}</p>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details & Parties */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-50 pb-2">Case Overview</h2>
            <p className="text-gray-600 text-sm leading-relaxed italic">
              {c.description || 'No detailed description provided for this case file.'}
            </p>
          </div>

          {/* Parties Involved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Plaintiff / Petitioner</h2>
              <p className="text-md font-bold text-gray-900">{c.plaintiff || 'Information Restricted'}</p>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Legal Counsel</p>
                <p className="text-xs font-semibold text-gray-700">Assigned State Counsel</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Defendant / Respondent</h2>
              <p className="text-md font-bold text-gray-900">{c.defendant || 'Information Restricted'}</p>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Legal Counsel</p>
                <p className="text-xs font-semibold text-gray-700">Pending Notification</p>
              </div>
            </div>
          </div>

          {/* Witnesses & Evidence */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Witnesses & Evidence</h2>
            {c.witnesses && c.witnesses.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {c.witnesses.map((w: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/30">
                    <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">{i+1}</span>
                    <span className="text-sm font-semibold text-gray-800">{w}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No witnesses listed for this case yet.</p>
            )}
          </div>

          {/* Verdicts & Rulings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 bg-gradient-to-br from-indigo-50/20 to-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              ⚖️ Verdicts & Judgments
            </h2>
            {c.verdicts && c.verdicts.length > 0 ? (
              <div className="space-y-3">
                {c.verdicts.map((v: string, i: number) => (
                  <div key={i} className="p-4 bg-white border border-indigo-100 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-800 font-medium italic">"{v}"</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase mt-2">Certified Court Ruling</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                <p className="text-sm text-gray-400 italic">Judgment Pending Final Submissions</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hearings & Docs */}
        <div className="space-y-8">
          
          {/* Hearings Schedule */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-md font-bold text-gray-900 mb-4">🗓️ Scheduled Hearings</h2>
            {hearings.length > 0 ? (
              <div className="space-y-3">
                {hearings.map((h: any) => (
                  <div key={h.id} className="p-3 rounded-xl border border-gray-50 bg-gray-50/30">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-gray-900">{h.hearing_type}</p>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">Confirmed</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">📅 {new Date(h.hearing_date).toLocaleDateString()} at {h.hearing_time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No hearings scheduled yet.</p>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-md font-bold text-gray-900 mb-4">📄 Filed Documents</h2>
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((d: any) => (
                  <div key={d.id} className="group flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-indigo-200 hover:bg-indigo-50/30 transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-700">{d.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase">{d.type} · {new Date(d.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-gray-300 group-hover:text-indigo-400">→</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No documents filed in this folder.</p>
            )}
          </div>

          {/* Compliance Badge */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white text-center">
            <div className="inline-block p-2 bg-indigo-500/20 rounded-full mb-3">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">DPA Compliant Folder</p>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              This case file is encrypted at rest. Access is logged as per DPA 2019 Sec 31. Data residency: Kenya (KE).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
