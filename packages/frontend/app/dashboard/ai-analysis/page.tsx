'use client';

import React, { useRef } from 'react';
import { Bot, Shield, FileSearch, Scale, BarChart, FileText, Share2, Printer } from 'lucide-react';
import Chatbot from '@/components/Chatbot';

export default function AIAnalysisPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AI Case Analysis Report',
          text: 'Check out this legal analysis report from AI-JLSP.',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload the file
      alert(`File selected: ${file.name}`);
    }
  };
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600" />
            AI Case Analysis & Prediction
          </h1>
          <p className="text-gray-500 mt-2">
            Advanced multi-modal legal intelligence for case profiling and outcome simulation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            <Printer className="w-4 h-4" /> Export Report
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-md"
          >
            <Share2 className="w-4 h-4" /> Share Findings
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Case Information & File Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-indigo-600" />
              Evidence & Document Analysis
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={triggerFileInput}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">SCANNER ACTIVE</span>
                </div>
                <h3 className="mt-4 font-bold text-gray-900">Legal Documents</h3>
                <p className="text-xs text-gray-500 mt-1">Upload Pleadings, Affidavits, or Contracts for compliance check.</p>
              </div>

              <div 
                onClick={triggerFileInput}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <BarChart className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">PARSER READY</span>
                </div>
                <h3 className="mt-4 font-bold text-gray-900">Data Files (CSV/Excel)</h3>
                <p className="text-xs text-gray-500 mt-1">Analyze financial records, tax returns, or exhibit lists.</p>
              </div>

              <div 
                onClick={triggerFileInput}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-rose-300 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">AUDIT TRAIL</span>
                </div>
                <h3 className="mt-4 font-bold text-gray-900">Evidence Credibility</h3>
                <p className="text-xs text-gray-500 mt-1">Verify signatures, seals, and chain of custody integrity.</p>
              </div>

              <div 
                onClick={triggerFileInput}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-emerald-300 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Scale className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">COMPLIANCE</span>
                </div>
                <h3 className="mt-4 font-bold text-gray-900">Judgement Profiling</h3>
                <p className="text-xs text-gray-500 mt-1">Compare current case against historical High Court judgements.</p>
              </div>
            </div>

            <div 
              className="mt-8 p-6 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-400 transition-colors cursor-pointer"
              onClick={triggerFileInput}
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-900 font-bold">Drop files here or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PDF, CSV, MP3, MP4, JPEG, and Excel supported (Max 50MB)</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition shadow-lg"
              >
                Browse Files
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.csv,.xlsx,.xls,.txt,.png,.jpg,.jpeg,.mp3,.mp4"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4">Real-time Legal Objectivity</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Constitutional Alignment (Art 47)</span>
                </div>
                <span className="text-sm font-bold text-green-600">98% Match</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Procedural Compliance (Order 3)</span>
                </div>
                <span className="text-sm font-bold text-amber-600">72% Verify</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Evidence Admissibility (Sec 65)</span>
                </div>
                <span className="text-sm font-bold text-blue-600">85% Likely</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Predictive Analytics & Chatbot */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl shadow-xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart className="w-5 h-5 text-blue-400" />
                Outcome Prediction
              </h2>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-5xl font-extrabold">84.2</span>
                <span className="text-xl text-blue-300 font-medium mb-1">% Probability of Success</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-200">Confidence Interval</span>
                  <span className="font-bold">+/- 3.5%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: '84%' }}></div>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                  Prediction based on 1,420 similar cases in Kenya Law Reports (eKLR) and current evidence credibility score.
                </p>
              </div>
            </div>
            {/* Background design elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-4">Statutory Basis</h2>
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs font-bold text-indigo-700">Civil Procedure Rules 2010</p>
                <p className="text-[10px] text-indigo-600 mt-0.5">Order 1, Rule 10 - Joinder of parties</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                <p className="text-xs font-bold text-emerald-700">DPA 2019 Cap 411C</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Sec 25 - Data protection principles</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs font-bold text-amber-700">Tax Procedures Act</p>
                <p className="text-[10px] text-amber-600 mt-0.5">Sec 51 - Objection to assessments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
