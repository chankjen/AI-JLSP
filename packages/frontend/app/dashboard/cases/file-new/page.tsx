'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

export default function FileCasePage() {
  const [formData, setFormData] = useState({
    caseTitle: '',
    caseType: '',
    parties: '',
    jurisdiction: '',
    description: '',
  });

  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      // Submit form
      console.log('Submitting:', formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">File New Case</h1>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
          1
        </div>
        <div className="w-12 h-1 bg-gray-300 mx-2"></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
          2
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 ? (
          <Card title="Case Information" description="Provide basic details about the case">
            <div className="space-y-6">
              <Input
                label="Case Title"
                name="caseTitle"
                value={formData.caseTitle}
                onChange={handleChange}
                placeholder="e.g., ABC Corp v XYZ Ltd"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
                <select
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select case type</option>
                  <option value="civil">Civil</option>
                  <option value="commercial">Commercial</option>
                  <option value="criminal">Criminal</option>
                  <option value="family">Family</option>
                  <option value="labor">Labor</option>
                  <option value="environmental">Environmental</option>
                </select>
              </div>

              <Input
                label="Parties"
                name="parties"
                value={formData.parties}
                onChange={handleChange}
                placeholder="e.g., Claimant: ABC Corp, Defendant: XYZ Ltd"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                <select
                  name="jurisdiction"
                  value={formData.jurisdiction}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select jurisdiction</option>
                  <option value="nairobi">Nairobi</option>
                  <option value="mombasa">Mombasa</option>
                  <option value="kisumu">Kisumu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleChange(e as any)}
                  placeholder="Brief description of the case"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Upload Documents" description="Upload case documents for validation">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-gray-600 mb-4">Drag and drop documents or click to browse</p>
              <input
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <Button variant="secondary">Select Documents</Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">Accepted formats: PDF, DOC, DOCX, TXT</p>
          </Card>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button variant="primary" type="submit">
            {step === 2 ? 'File Case' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}
