'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-store';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  const services = [
    {
      title: 'Intelligent Case Management',
      subtitle: 'eFiling & AI Triage',
      description: 'Streamlined case filing with Art 47-compliant AI triage and priority scoring.',
      icon: '⚖️',
      color: 'from-blue-500 to-indigo-600',
      href: '/dashboard/cases',
    },
    {
      title: 'AI Legal Research',
      subtitle: 'Knowledge Management',
      description: 'Semantic search through Kenyan statutes and case law with Legal-BERT-KE.',
      icon: '🔍',
      color: 'from-emerald-500 to-teal-600',
      href: '/dashboard/research',
    },
    {
      title: 'Conveyancing',
      subtitle: 'Property Transactions',
      description: 'Automated document verification and compliance checks for property law.',
      icon: '🏠',
      color: 'from-orange-500 to-red-600',
      href: '/dashboard/conveyancing',
    },
    {
      title: 'Litigation Support',
      subtitle: 'Evidence & Precedents',
      description: 'AI-driven analysis of exhibits and automated precedent discovery.',
      icon: '📋',
      color: 'from-purple-500 to-pink-600',
      href: '/dashboard/litigation',
    },
    {
      title: 'Tax Dispute Resolution',
      subtitle: 'TDR & TPA Compliance',
      description: 'Automated validation of tax objections per TPA Sec 51 requirements.',
      icon: '📊',
      color: 'from-cyan-500 to-blue-600',
      href: '/dashboard/tdr',
    },
    {
      title: 'Board & Governance',
      subtitle: 'Corporate Services',
      description: 'Intelligent meeting management, agenda prioritization, and minute extraction.',
      icon: '👥',
      color: 'from-amber-500 to-orange-600',
      href: '/dashboard/board',
    },
    {
      title: 'Operations & Admin',
      subtitle: 'Workflow Automation',
      description: 'Internal judicial workflows and administrative automation.',
      icon: '⚙️',
      color: 'from-slate-500 to-gray-600',
      href: '/dashboard/operations',
    },
    {
      title: 'Compliance & Audit',
      subtitle: 'DPA & Art 10 Engine',
      description: 'Real-time monitoring of data protection and constitutional values.',
      icon: '🛡️',
      color: 'from-rose-500 to-red-600',
      href: '/dashboard/compliance',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium animate-pulse">Initializing AI-JLSP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Premium Navbar */}
      <nav className="fixed w-full z-50 glass border-b border-white/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              A
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">AI-JLSP</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="#services" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">Services</Link>
            <Link href="#about" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">About</Link>
            {user ? (
              <Link href="/dashboard" className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition premium-shadow">
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Sign In</Link>
                <Link href="/register" className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition premium-shadow">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/hero.png" 
            alt="AI-JLSP Hero" 
            fill 
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/0 via-slate-50/80 to-slate-50"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2 animate-ping"></span>
              Pioneering Ethical AI in Kenyan Justice
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-8">
              Transforming <span className="text-gradient">Justice</span> Through Intelligence
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
              The AI-Enhanced Judicial & Legal Services Platform (AI-JLSP) leverages advanced machine learning to accelerate case resolution, ensure transparency, and uphold the rule of law.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href={user ? "/dashboard" : "/register"} className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all hover:scale-105 premium-shadow flex items-center justify-center">
                Get Started
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
              </Link>
              <Link href="#services" className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg border border-slate-200 hover:border-indigo-600 transition-all flex items-center justify-center">
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services" className="py-24 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Core AI Components</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Our platform integrates specialized AI agents to handle the full spectrum of judicial and legal requirements with precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, idx) => (
              <Link 
                key={idx} 
                href={service.href}
                className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-2xl hover-lift relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${service.color} opacity-5 group-hover:opacity-10 transition-opacity rounded-bl-full`}></div>
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} text-white flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{service.subtitle}</p>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{service.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {service.description}
                </p>
                
                <div className="flex items-center text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Launch Component
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Article 10 Commitment */}
      <section className="py-20 px-6 bg-indigo-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block p-3 rounded-2xl bg-white/10 mb-8 backdrop-blur-sm">
            <span className="text-3xl">🇰🇪</span>
          </div>
          <h2 className="text-3xl font-bold mb-6">Our Constitutional Commitment</h2>
          <p className="text-xl text-indigo-100 mb-12 italic leading-relaxed">
            &quot;The AI-JLSP is built upon the foundational values of Article 10: Democracy, Rule of Law, Social Justice, and Human Rights. Our AI systems are audited daily for fairness and transparency.&quot;
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Inclusion', 'Integrity', 'Transparency', 'Accountability'].map((val, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">
                {val}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-950 text-slate-400 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <div className="w-8 h-8 bg-indigo-600/50 rounded-lg flex items-center justify-center text-white font-bold text-lg border border-indigo-500/30">
              A
            </div>
            <span className="text-lg font-bold tracking-tight text-white">AI-JLSP</span>
          </div>
          <div className="flex space-x-8 text-sm">
            <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition">DPA Compliance</Link>
            <Link href="#" className="hover:text-white transition">Contact Support</Link>
          </div>
          <div className="mt-8 md:mt-0 text-xs">
            &copy; 2026 Legal Technology & Product Engineering Division. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
