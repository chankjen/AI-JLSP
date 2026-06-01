'use client';

import { useState, useCallback, useRef } from 'react';
import { useForm } from '@/hooks/useForm';
import { useFetch } from '@/hooks/useFetch';
import { Card, Button, Input, Select, Table } from '@/components/ui';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Toast } from '@/components/Toast';
import { Upload, Search, Zap } from 'lucide-react';

interface JudgmentRecord {
  judgment_id: string;
  case_number: string;
  judge_name: string;
  judgment_date: string;
  outcome: string;
  source_system: string;
  validation_status: 'pending' | 'valid' | 'invalid';
}

interface SearchResult {
  case_number: string;
  similarity_score: number;
  judge_name: string;
  legal_issues: string[];
}

export function JudgmentPortal() {
  const [activeTab, setActiveTab] = useState<'search' | 'upload' | 'bulk'>('search');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [judgments, setJudgments] = useState<JudgmentRecord[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [bulkStatus, setBulkStatus] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { values: searchValues, handleChange: handleSearchChange, handleSubmit: handleSearchSubmit } = useForm({
    initialValues: {
      query: '',
      source: ''
    },
    onSubmit: handleSearch
  });

  const { values: uploadValues, handleChange: handleUploadChange, handleSubmit: handleUploadSubmit } = useForm({
    initialValues: {
      case_number: '',
      judge_name: '',
      judgment_date: '',
      source: 'manual',
      legal_issues: ''
    },
    onSubmit: handleUploadJudgment
  });

  const { data: fetchData, loading: fetchLoading, error: fetchError } = useFetch();

  async function handleSearch(values: any) {
    try {
      const response = await fetch(`/api/judgments/search?q=${encodeURIComponent(values.query)}&limit=10`);
      if (!response.ok) throw new Error('Search failed');

      const result = await response.json();
      setSearchResults(result.data.results || []);

      if (result.data.total_results === 0) {
        setToastMessage('ℹ️ No judgments found matching your search');
      } else {
        setToastMessage(`✅ Found ${result.data.total_results} matching judgments`);
      }
      setShowToast(true);
    } catch (err) {
      setToastMessage(`❌ Search failed: ${(err as Error).message}`);
      setShowToast(true);
    }
  }

  async function handleUploadJudgment(values: any) {
    try {
      const response = await fetch('/api/judgments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_number: values.case_number,
          judge_name: values.judge_name,
          judgment_date: values.judgment_date,
          source: values.source,
          legal_issues: values.legal_issues.split(',').map((i: string) => i.trim()),
          parties: [
            { role: 'plaintiff', name: 'Plaintiff' },
            { role: 'defendant', name: 'Defendant' }
          ]
        })
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      setToastMessage('✅ Judgment imported successfully! Queued for AI processing');
      setShowToast(true);

      // Reset form
      handleUploadChange({ target: { name: 'case_number', value: '' } } as any);
      handleUploadChange({ target: { name: 'judge_name', value: '' } } as any);
      handleUploadChange({ target: { name: 'judgment_date', value: '' } } as any);
    } catch (err) {
      setToastMessage(`❌ Upload failed: ${(err as Error).message}`);
      setShowToast(true);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Extract case number from filename (e.g., "HCCA_123_2024.pdf")
      const caseNumber = file.name.split('.')[0].toUpperCase();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('case_number', caseNumber);
      formData.append('source', 'manual');

      const response = await fetch('/api/judgments/import-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('PDF upload failed');

      setToastMessage(`✅ PDF uploaded: ${caseNumber}. Extracting metadata...`);
      setShowToast(true);
    } catch (err) {
      setToastMessage(`❌ PDF upload failed: ${(err as Error).message}`);
      setShowToast(true);
    }
  }

  async function handleBulkImport(source: string) {
    try {
      const response = await fetch('/api/judgments/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, limit: 100 })
      });

      if (!response.ok) throw new Error('Bulk import failed');

      const result = await response.json();
      setBulkStatus({
        batch_id: result.data.batch_id,
        source,
        status: 'in_progress'
      });

      setToastMessage(`🔄 Bulk import started from ${source}. This may take a few minutes...`);
      setShowToast(true);
    } catch (err) {
      setToastMessage(`❌ Bulk import failed: ${(err as Error).message}`);
      setShowToast(true);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Judgment Portal</h1>
        <p className="text-gray-600">Search, upload, and manage judicial decisions</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'search'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Search className="inline mr-2 w-4 h-4" />
          Search Judgments
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'upload'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="inline mr-2 w-4 h-4" />
          Upload Judgment
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'bulk'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Zap className="inline mr-2 w-4 h-4" />
          Bulk Import
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <Card title="Semantic Search" className="max-w-2xl">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <Input
                  label="Search Query"
                  name="query"
                  placeholder="e.g., 'validity of tax assessment' or 'breach of contract'"
                  value={searchValues.query}
                  onChange={handleSearchChange}
                  required
                />

                <Select
                  label="Filter by Source"
                  name="source"
                  value={searchValues.source}
                  onChange={handleSearchChange}
                  options={[
                    { value: '', label: 'All Sources' },
                    { value: 'kenyalawreports', label: 'Kenya Law Reports' },
                    { value: 'cts', label: 'CTS E-Judiciary' },
                    { value: 'manual', label: 'Manual Uploads' }
                  ]}
                />

                <Button type="submit" variant="primary">
                  Search Judgments
                </Button>
              </form>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card title="Search Results" className="max-w-4xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Case Number</th>
                        <th className="text-left py-2 px-4">Judge</th>
                        <th className="text-center py-2 px-4">Similarity</th>
                        <th className="text-left py-2 px-4">Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((result, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 font-mono text-blue-600">{result.case_number}</td>
                          <td className="py-2 px-4">{result.judge_name || '—'}</td>
                          <td className="py-2 px-4 text-center">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              {(result.similarity_score * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            {result.legal_issues?.slice(0, 2).join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <Card title="Upload New Judgment" className="max-w-2xl">
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <Input
                  label="Case Number"
                  name="case_number"
                  placeholder="e.g., HCCA 123/2024"
                  value={uploadValues.case_number}
                  onChange={handleUploadChange}
                  required
                />

                <Input
                  label="Judge Name"
                  name="judge_name"
                  placeholder="e.g., Justice John Smith"
                  value={uploadValues.judge_name}
                  onChange={handleUploadChange}
                />

                <Input
                  label="Judgment Date"
                  name="judgment_date"
                  type="date"
                  value={uploadValues.judgment_date}
                  onChange={handleUploadChange}
                  required
                />

                <Select
                  label="Source"
                  name="source"
                  value={uploadValues.source}
                  onChange={handleUploadChange}
                  options={[
                    { value: 'manual', label: 'Manual Entry' },
                    { value: 'magistrate', label: 'Magistrate Court' },
                    { value: 'kenyalawreports', label: 'Kenya Law Reports' }
                  ]}
                />

                <Input
                  label="Legal Issues (comma-separated)"
                  name="legal_issues"
                  placeholder="e.g., Contract validity, Damages calculation"
                  value={uploadValues.legal_issues}
                  onChange={handleUploadChange}
                />

                <Button type="submit" variant="primary">
                  Import Judgment
                </Button>
              </form>
            </Card>

            {/* PDF Upload */}
            <Card title="Upload PDF Judgment" className="max-w-2xl">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Drag and drop your PDF here, or click to select
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select PDF
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                ⓘ PDF filename should be your case number (e.g., HCCA_123_2024.pdf)
              </p>
            </Card>
          </div>
        )}

        {/* BULK IMPORT TAB */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <Card title="Bulk Import from Source" className="max-w-2xl">
              <p className="text-gray-600 mb-6">
                Import up to 100 judgments at a time from authorized sources.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleBulkImport('kenyalawreports')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <h3 className="font-bold text-lg mb-2">Kenya Law Reports</h3>
                  <p className="text-sm text-gray-600">Import latest published judgments</p>
                </button>

                <button
                  onClick={() => handleBulkImport('cts')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <h3 className="font-bold text-lg mb-2">CTS E-Judiciary</h3>
                  <p className="text-sm text-gray-600">Sync recent court decisions</p>
                </button>
              </div>

              {bulkStatus && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">
                    <strong>Status:</strong> {bulkStatus.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    Batch ID: <code>{bulkStatus.batch_id}</code>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Check your email for completion notification
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
