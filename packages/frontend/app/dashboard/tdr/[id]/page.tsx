'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import Link from 'next/link';

export default function TDRDetailPage() {
  const { id } = useParams();
  const [tdr, setTdr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [modeling, setModeling] = useState(false);
  const [settlementPct, setSettlementPct] = useState(50);
  const [scenario, setScenario] = useState<any>(null);

  useEffect(() => {
    fetchTDR();
  }, [id]);

  const fetchTDR = async () => {
    try {
      const res = await apiClient.get(`/tdr/${id}`);
      setTdr(res.data.tdr);
    } catch (err) {
      console.error('Failed to fetch TDR:', err);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    setValidating(true);
    try {
      const res = await apiClient.post(`/tdr/${id}/validate`);
      setTdr(res.data.tdr);
      alert('AI Validation Complete: ' + res.data.validation.rationale);
    } catch (err) {
      alert('Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const runScenarioModel = async () => {
    setModeling(true);
    try {
      const res = await apiClient.post(`/tdr/${id}/scenario-model`, { settlementPercentage: settlementPct });
      setScenario(res.data.scenario);
    } catch (err) {
      alert('Scenario modeling failed');
    } finally {
      setModeling(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Tax Dispute Data...</div>;
  if (!tdr) return <div className="p-8 text-center">Dispute not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tdr.objection_id}</h1>
          <p className="text-gray-500">{tdr.taxpayer_name} · Tax Year {tdr.tax_year}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={runValidation}
            disabled={validating}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
          >
            {validating ? '⌛ Validating...' : '🤖 AI Validity Check'}
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
            📤 Push to e-Filing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Grounds */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-4">Objection Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 uppercase text-[10px] font-bold">Amount Disputed</p>
                <p className="text-xl font-bold text-gray-900">KES {parseFloat(tdr.amount_disputed).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 uppercase text-[10px] font-bold">Current Status</p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 capitalize">
                  {tdr.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-gray-500 uppercase text-[10px] font-bold mb-2">Grounds for Objection</p>
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg italic">
                "{tdr.description}"
              </p>
            </div>
          </div>

          {/* AI Insights Section */}
          {tdr.ai_rationale && (
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤖</span>
                <h2 className="text-lg font-bold text-indigo-900">AI Triage Insights</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-indigo-400 uppercase">Validity Probability</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex-1 h-3 bg-indigo-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-1000" 
                        style={{ width: `${tdr.validity_score}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-indigo-700">{tdr.validity_score}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-400 uppercase">Legal Rationale</p>
                  <p className="text-sm text-indigo-800 mt-1 leading-relaxed">
                    {tdr.ai_rationale}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scenario Modeling & Integration */}
        <div className="space-y-6">
          {/* iTax Integration Box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-md font-bold mb-4 flex items-center gap-2">
              📊 iTax Real-time Data
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax PIN</span>
                <span className="font-mono font-bold">A00****123Z</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Undisputed Paid?</span>
                <span className="text-green-600 font-bold">✅ Yes (Sec 51(3))</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Assessment</span>
                <span>Oct 20, 2023</span>
              </div>
            </div>
          </div>

          {/* Settlement Scenario Modeler */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-md font-bold mb-4 flex items-center gap-2">
              📉 Settlement Modeler
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Proposed Settlement %</label>
                <input 
                  type="range" min="10" max="90" step="5"
                  value={settlementPct}
                  onChange={(e) => setSettlementPct(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10%</span>
                  <span className="font-bold text-rose-600">{settlementPct}%</span>
                  <span>90%</span>
                </div>
              </div>
              
              <button 
                onClick={runScenarioModel}
                disabled={modeling}
                className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
              >
                {modeling ? '⌛ Calculating...' : 'Generate Impact Model'}
              </button>

              {scenario && (
                <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-rose-600">Immediate Revenue (IFMIS)</span>
                    <span className="font-bold">KES {scenario.projected_immediate_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-rose-600">Net Economic Benefit</span>
                    <span className="font-bold text-emerald-600">KES {scenario.net_economic_benefit.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-rose-400 italic text-center mt-2 font-medium uppercase tracking-tighter">
                    Automatically reported to IFMIS Revenue Dashboard
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
