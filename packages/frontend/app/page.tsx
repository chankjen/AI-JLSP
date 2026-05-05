'use client';

import { useAuth } from '@/lib/auth-store';

export default function HomePage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          AI-Enhanced Judicial & Legal Services Platform
        </h1>
        <p className="text-xl text-blue-100 mb-8">
          Accelerating justice through intelligent automation and ethical AI
        </p>
        <div className="space-x-4">
          <a
            href="/login"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-100"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="inline-block px-8 py-3 border-2 border-white text-white rounded-lg font-bold hover:bg-white hover:bg-opacity-10"
          >
            Register
          </a>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="⚖️"
            title="Case Management"
            description="File, track, and manage cases with AI-assisted routing and scheduling"
          />
          <FeatureCard
            icon="📚"
            title="Legal Research"
            description="Semantic search through statutes, cases, and precedents"
          />
          <FeatureCard
            icon="💼"
            title="Tax Dispute Resolution"
            description="Streamlined TDR workflows with predictive analytics"
          />
          <FeatureCard
            icon="🏠"
            title="Conveyancing"
            description="Automated property transaction review and compliance"
          />
          <FeatureCard
            icon="👥"
            title="Board Services"
            description="Meeting management with automated transcription"
          />
          <FeatureCard
            icon="✓"
            title="Compliance"
            description="Real-time DPA and constitutional compliance monitoring"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
