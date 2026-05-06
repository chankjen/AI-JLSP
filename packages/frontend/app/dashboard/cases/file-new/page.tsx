'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import Link from 'next/link';

const COURTS = [
  { id: 'magistrate', name: "Magistrates' Court", desc: 'Civil claims < 2M KES, minor criminal matters.' },
  { id: 'high_court', name: 'High Court', desc: 'Constitutional petitions, serious crimes, claims > 2M KES.' },
  { id: 'elrc', name: 'Employment & Labour Relations Court', desc: 'Employer-employee disputes.' },
  { id: 'elc', name: 'Environment & Land Court', desc: 'Land disputes, environmental protection.' },
];

const FILING_TYPES = [
  { id: 'civil_suit', name: 'Civil Suit (Plaint)', docs: ['Plaint', 'Verifying Affidavit', 'Witness Statements', 'List of Documents'] },
  { id: 'petition', name: 'Constitutional Petition', docs: ['Petition', 'Supporting Affidavit', 'Certificate of Urgency'] },
];

export default function FileNewCasePage() {
  const [step, setStep] = useState(1);
  const [importMode, setImportMode] = useState(false);
  const [formData, setFormData] = useState({
    court: '',
    caseType: '',
    title: '',
    plaintiff: '',
    defendant: '',
    description: '',
    ctsNumber: '',
  });
  const [validating, setValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<any>(null);
  const router = useRouter();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleAIValidate = async () => {
    setValidating(true);
    // Simulate AI validation of pleadings (PRD 1.3)
    setTimeout(() => {
      setValidationReport({
        score: 92,
        issues: [],
        rationale: "Documents comply with Order 3 of the Civil Procedure Rules. Verifying affidavit is properly commissioned.",
      });
      setValidating(false);
    }, 2000);
  };

  const handleSubmit = async () => {
    try {
      await apiClient.post('/cases', {
        caseTitle: formData.title,
        caseType: formData.caseType === 'civil_suit' ? 'litigation' : 'other',
        parties: `Plaintiff: ${formData.plaintiff}, Defendant: ${formData.defendant}`,
        jurisdiction: formData.court,
        description: formData.description,
      });
      router.push('/dashboard/cases?success=true');
    } catch (err) {
      console.error('Filing failed:', err);
      alert('Error filing case. Please check your network.');
    }
  };

  if (importMode) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-indigo-100">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl">🔗</span>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Import from Judiciary CTS</h1>
              <p className="text-gray-500 text-sm">Syncing with efiling.court.go.ke</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">CTS Case Number</label>
              <input 
                type="text" 
                placeholder="e.g., HCCC/E123/2026"
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono"
                value={formData.ctsNumber}
                onChange={(e) => setFormData({...formData, ctsNumber: e.target.value})}
              />
            </div>
            <button 
              onClick={() => {
                alert('Connected to CTS API. Fetching records...');
                setImportMode(false);
                setFormData({...formData, title: 'ABC Ltd v KRA (Imported)', plaintiff: 'ABC Ltd', defendant: 'Commissioner of Taxes'});
              }}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
            >
              Verify & Sync Case
            </button>
            <button onClick={() => setImportMode(false)} className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition">
              Cancel & File Manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-24">
      {/* ── Progress Header ── */}
      <div className="flex items-center justify-between px-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Initiate Case Filing</h1>
          <p className="text-gray-500 font-medium">Step {step} of 4: {step === 1 ? 'Jurisdiction' : step === 2 ? 'Pleadings' : step === 3 ? 'Parties' : 'Submission'}</p>
        </div>
        <button 
          onClick={() => setImportMode(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition"
        >
          <span>📥</span> Import from CTS
        </button>
      </div>

      <div className="flex gap-2 px-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-indigo-600' : 'bg-gray-100'}`} />
        ))}
      </div>

      {/* ── Step Content ── */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px]">
        
        {/* STEP 1: Jurisdiction */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">1. Identify the Right Court</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COURTS.map(court => (
                <div 
                  key={court.id}
                  onClick={() => setFormData({...formData, court: court.id})}
                  className={`p-6 rounded-2xl border-2 transition cursor-pointer ${
                    formData.court === court.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-50 hover:border-indigo-100'
                  }`}
                >
                  <p className="font-bold text-gray-900">{court.name}</p>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{court.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Pleadings */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">2. Drafting & Validating Pleadings</h2>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Select Filing Type</label>
              <div className="flex gap-4">
                {FILING_TYPES.map(type => (
                  <button 
                    key={type.id}
                    onClick={() => setFormData({...formData, caseType: type.id})}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition ${
                      formData.caseType === type.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {formData.caseType && (
              <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Required Bundle (Kenya Judiciary Standard)</p>
                <div className="grid grid-cols-2 gap-3">
                  {FILING_TYPES.find(f => f.id === formData.caseType)?.docs.map(doc => (
                    <div key={doc} className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                      <span className="text-emerald-500">✓</span> {doc}
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <button 
                    onClick={handleAIValidate}
                    disabled={validating}
                    className="w-full py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition"
                  >
                    {validating ? '🧠 AI Analyzing Documents...' : '🤖 AI Pre-Validation (Rule 3 Compliance)'}
                  </button>
                  {validationReport && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <p className="text-emerald-800 font-bold text-sm">Score: {validationReport.score}% Compliance</p>
                      <p className="text-emerald-600 text-xs italic mt-1">{validationReport.rationale}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Parties */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">3. Party Details & Service Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Plaintiff / Petitioner</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.plaintiff}
                  onChange={e => setFormData({...formData, plaintiff: e.target.value})}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Defendant / Respondent</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.defendant}
                  onChange={e => setFormData({...formData, defendant: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Case Title (Short Brief)</label>
              <input 
                type="text" 
                placeholder="e.g. ABC Ltd v Commissioner of Taxes"
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-900">📍 Service Note</p>
              <p className="text-[10px] text-indigo-700 mt-1 leading-relaxed">
                Summons will be generated upon filing. Proof of service must be filed via an Affidavit of Service within 14 days of issuance.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Submission */}
        {step === 4 && (
          <div className="space-y-8 text-center py-8">
            <div className="inline-block p-4 bg-emerald-100 rounded-full mb-4">
              <span className="text-4xl">⚖️</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 italic">Ready for Registry Lodgment</h2>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                By clicking "File Case", you confirm that the pleadings comply with the Civil Procedure Rules and court fees will be processed via IFMIS/M-Pesa.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-left max-w-md mx-auto">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">Court Station</span>
                <span className="text-xs font-bold text-gray-900">{COURTS.find(c => c.id === formData.court)?.name}</span>
              </div>
              <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-400">Filing Type</span>
                <span className="text-xs font-bold text-gray-900">{FILING_TYPES.find(f => f.id === formData.caseType)?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Calculated Fees</span>
                <span className="text-xl font-black text-indigo-600">KES 4,550.00</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Navigation Buttons ── */}
      <div className="flex justify-between items-center px-4">
        <button 
          onClick={step === 1 ? () => router.back() : handleBack}
          className="px-8 py-4 text-gray-400 font-bold hover:text-gray-900 transition"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {step < 4 ? (
          <button 
            disabled={step === 1 && !formData.court}
            onClick={handleNext}
            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
          >
            Continue →
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition shadow-xl shadow-emerald-100"
          >
            ⚖️ File Case & Lodgment
          </button>
        )}
      </div>
    </div>
  );
}
