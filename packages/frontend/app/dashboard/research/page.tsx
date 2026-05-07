'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';

export default function LegalResearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [translationText, setTranslationText] = useState('');
  const [translated, setTranslated] = useState('');
  const [translating, setTranslating] = useState(false);
  const [compareSelection, setCompareSelection] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [comparing, setComparing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const LAW_FILTERS = [
    { id: 'all', name: 'All Laws', icon: '🌐' },
    { id: 'constitution', name: 'Constitution', icon: '🇰🇪' },
    { id: 'penal_code', name: 'Penal Code', icon: '⚖️' },
    { id: 'dpa', name: 'DPA 2019', icon: '🔒' },
    { id: 'tax_law', name: 'Tax Law', icon: '📊' },
    { id: 'regional_law', name: 'Regional (AU/EAC)', icon: '🌍' },
    { id: 'international_law', name: 'International', icon: '🇺🇳' },
  ];

  const handleSearch = async (reset = true) => {
    if (!query) return;
    const targetPage = reset ? 1 : page + 1;
    if (reset) {
        setResults([]);
        setLoading(true);
    }
    
    try {
      const res = await apiClient.get('/research/search', { 
        params: { 
            query, 
            type: selectedType === 'all' ? undefined : selectedType,
            page: targetPage
        } 
      });
      
      const newResults = res.data.results || [];
      setResults(prev => reset ? newResults : [...prev, ...newResults]);
      setHasMore(res.data.hasMore);
      setPage(targetPage);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!translationText) return;
    setTranslating(true);
    try {
      const res = await apiClient.post('/portal/translate', { text: translationText });
      setTranslated(res.data.translated_text);
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setTranslating(false);
    }
  };

  const handleCompare = async () => {
    if (compareSelection.length !== 2) return;
    setComparing(true);
    try {
      const res = await apiClient.post('/research/compare', {
        docId1: compareSelection[0].id,
        docId2: compareSelection[1].id
      });
      setComparison(res.data);
    } catch (err) {
      console.error('Comparison failed:', err);
    } finally {
      setComparing(false);
    }
  };

  const addToCompare = (doc: any) => {
    if (compareSelection.length >= 2) {
      setCompareSelection([compareSelection[1], doc]);
    } else {
      setCompareSelection([...compareSelection, doc]);
    }
  };

  const [draft, setDraft] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);

  const handleDraftArgument = async () => {
    if (!comparison) return;
    setDrafting(true);
    try {
      const res = await apiClient.post('/research/draft-argument', {
        doc1: compareSelection[0],
        doc2: compareSelection[1],
        comparison
      });
      setDraft(res.data.draft);
    } catch (err) {
      console.error('Drafting failed:', err);
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comparison Drawer */}
      {compareSelection.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-6 z-50 shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex gap-4">
              {compareSelection.map((doc, idx) => (
                <div key={idx} className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-3 border border-white/5">
                  <span className="text-xs font-bold truncate max-w-[150px]">{doc.title}</span>
                  <button onClick={() => setCompareSelection(compareSelection.filter(d => d.id !== doc.id))} className="text-red-400 font-bold hover:text-red-300">×</button>
                </div>
              ))}
              {compareSelection.length < 2 && (
                <div className="px-4 py-2 border-2 border-dashed border-white/10 rounded-xl text-xs text-white/40 flex items-center italic">
                  Select another authority to compare...
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setCompareSelection([])}
                className="px-6 py-2 text-white/50 font-bold hover:text-white transition uppercase text-xs tracking-widest"
              >
                Clear
              </button>
              <button 
                disabled={compareSelection.length < 2 || comparing}
                onClick={handleCompare}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-500/20 uppercase text-xs tracking-widest"
              >
                {comparing ? 'Analyzing Jurisprudence...' : '🚀 Compare Side-by-Side'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {comparison && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <div>
                <h2 className="text-2xl font-black text-gray-900 italic tracking-tight underline decoration-indigo-500 underline-offset-8">Precedent Comparative Analysis</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">Legal-BERT Cross-Jurisdictional Engine</p>
              </div>
              <div className="flex gap-4">
                {!draft && (
                  <button 
                    onClick={handleDraftArgument}
                    disabled={drafting}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition disabled:opacity-50"
                  >
                    {drafting ? '📝 Drafting...' : '✍️ Draft Skeletal Argument'}
                  </button>
                )}
                <button onClick={() => { setComparison(null); setDraft(null); }} className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition font-bold">×</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {draft ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">AI-Generated Skeletal Argument</h3>
                    <button className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition">💾 Download PDF</button>
                  </div>
                  <div className="bg-gray-50 rounded-[2rem] p-10 border border-gray-100 shadow-inner overflow-x-auto">
                    <div dangerouslySetInnerHTML={{ __html: draft }} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 inline-block rounded">Authority A</p>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{compareSelection[0]?.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed italic">"{compareSelection[0]?.content_snippet}"</p>
                    </div>
                    <div className="space-y-4 border-l border-gray-100 pl-10">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 inline-block rounded">Authority B</p>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{compareSelection[1]?.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed italic">"{compareSelection[1]?.content_snippet}"</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-3">
                        <span className="h-2 w-2 bg-indigo-400 rounded-full animate-pulse"></span>
                        AI Analytical Findings
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">⚖️ Points of Convergence</p>
                          <ul className="space-y-2">
                            {comparison.similarities.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-gray-300 font-medium flex gap-3 italic">
                                <span className="text-indigo-400">✓</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">⚠️ Points of Divergence</p>
                          <ul className="space-y-2">
                            {comparison.differences.map((d: string, i: number) => (
                              <li key={i} className="text-sm text-gray-300 font-medium flex gap-3 italic">
                                <span className="text-rose-400">!</span> {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-10 p-6 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">🏛️ Legal Hierarchy & Application</p>
                        <p className="text-sm text-gray-100 font-medium leading-relaxed italic">
                          {comparison.legal_weight}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-center">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Confidential Judicial Research Output · Generated via AI-JLSP Engine</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight italic underline decoration-indigo-500 underline-offset-8">Legal Research Hub</h1>
          <p className="text-gray-400 text-xs mt-3 font-bold uppercase tracking-widest">Universal Legal Intelligence Engine</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Legal-BERT-KE Active
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {LAW_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedType(f.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 border-2 ${
              selectedType === f.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200'
            }`}
          >
            <span>{f.icon}</span> {f.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Box */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/30 p-10 border border-indigo-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <span className="text-[10px] font-black text-white bg-indigo-600 px-3 py-1 rounded-full shadow-lg animate-pulse">
                    JURISPRUDENCE ENGINE v3.0
                </span>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl">🔍</span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Semantic Law Search</h2>
            </div>
            
            <div className="flex gap-4 p-2 bg-gray-50 rounded-3xl border border-gray-100">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(true)}
                placeholder="Search legal topics (e.g. data protection, fair trial, tax objection)..."
                className="flex-1 bg-transparent px-6 py-4 outline-none text-gray-900 font-medium placeholder-gray-400"
              />
              <button
                onClick={() => handleSearch(true)}
                disabled={loading}
                className="px-10 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                {loading ? '🧠' : 'Search Intelligence'}
              </button>
            </div>

            {results.length > 0 && (
              <div className="mt-10 space-y-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Top Authorities Found</h3>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded tracking-widest">
                        {results.some(r => r.id.startsWith('web_')) ? '🌍 LIVE WEB SEARCH ACTIVE' : '📜 INDEXED RECORDS ONLY'}
                    </span>
                </div>
                
                <div className="space-y-5 max-h-[1000px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {results.map((res, idx) => (
                    <div key={idx} className="p-6 rounded-2xl border-2 border-gray-50 hover:border-indigo-500 hover:bg-indigo-50/20 transition group cursor-pointer bg-white relative">
                        <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                {res.id.startsWith('web_') ? '🌐' : '⚖️'}
                            </span>
                            <div className="flex flex-col">
                                <h4 className="font-black text-gray-900 group-hover:text-indigo-700 leading-tight">
                                    {res.title}
                                </h4>
                                {res.id.startsWith('web_') && (
                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter mt-1">Found via Internet Search</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 shadow-sm">RELEVANCE: {(res.score * 100).toFixed(1)}%</span>
                            <button 
                            onClick={(e) => { e.stopPropagation(); addToCompare(res); }}
                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition ${
                                compareSelection.some(d => d.id === res.id) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-indigo-600 hover:text-white'
                            }`}
                            >
                            {compareSelection.some(d => d.id === res.id) ? '✓ Added' : '+ Compare'}
                            </button>
                        </div>
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4 pl-11">
                        "{res.content_snippet}"
                        </p>
                        <div className="mt-3 flex gap-4 pl-11">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">{res.type.replace('_', ' ')}</span>
                        {!res.id.startsWith('web_') && (
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border-l-2 border-emerald-500 pl-2">Binding Precedent</span>
                        )}
                        </div>
                    </div>
                    ))}
                </div>

                {hasMore && (
                    <div className="pt-8 flex flex-col items-center gap-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic animate-pulse">More results available on the next page...</p>
                        <button 
                            onClick={() => handleSearch(false)}
                            disabled={loading}
                            className="px-10 py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black hover:bg-indigo-600 hover:text-white transition shadow-xl shadow-indigo-100 uppercase text-xs tracking-[0.2em]"
                        >
                            {loading ? '🧠 Searching...' : 'View Next Page (10+ More)'}
                        </button>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Translation & Resources */}
        <div className="space-y-6">
          {/* Swahili Translation Tool */}
          <div className="bg-slate-900 rounded-3xl shadow-xl p-8 text-white">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3">
              <span className="text-2xl">🌍</span> Swahili Legal Aide
            </h2>
            <div className="space-y-4">
              <textarea
                value={translationText}
                onChange={(e) => setTranslationText(e.target.value)}
                placeholder="Enter complex legal jargon to simplify in Swahili..."
                className="w-full px-4 py-4 bg-white/10 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-32 resize-none placeholder-gray-500 font-medium"
              />
              <button 
                onClick={handleTranslate}
                disabled={translating}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {translating ? 'Analyzing...' : 'Simplify to Swahili'}
              </button>
              {translated && (
                <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-3 text-center tracking-widest">Tafsiri ya Kiswahili</p>
                  <p className="text-sm text-gray-300 leading-relaxed italic text-center font-medium">
                    "{translated}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Repositories</h2>
            <div className="grid grid-cols-2 gap-4">
              <ResourceCard title="Kenya Law" icon="🇰🇪" />
              <ResourceCard title="African Union" icon="🌍" />
              <ResourceCard title="UN Treaties" icon="🇺🇳" />
              <ResourceCard title="Penal Code" icon="⚖️" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ title, icon }: { title: string; icon: string }) {
  return (
    <button className="w-full text-left p-4 border border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition group">
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{title}</span>
    </button>
  );
}

