'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useAuth } from '@/lib/auth-store';
import apiClient from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, loginEmail?: string, loginPassword?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;

    try {
      const response = await apiClient.post('/auth/login', {
        email: targetEmail,
        password: targetPassword,
      });

      const { tokens, user } = response.data;
      
      login(tokens.accessToken, user);
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Frontend Login Error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginAs = (roleEmail: string, rolePassword: string = 'password123') => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    handleLogin(undefined, roleEmail, rolePassword);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI-JLSP</h1>
          <p className="text-gray-600 mt-2">Kenya Judiciary & KRA</p>
        </div>

        <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="your.email@judiciary.ke"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">New to AI-JLSP?</span>
            </div>
          </div>
          <Link href="/register" className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-500">
            Register here
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-300">
          <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-gray-900">
            Forgot your password?
          </Link>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => loginAs('advocate@demo.ke')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <span>⚖️</span> Advocate
            </button>
            <button 
              onClick={() => loginAs('tdr@demo.ke')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <span>📊</span> TDR Officer
            </button>
            <button 
              onClick={() => loginAs('litigation@demo.ke')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span>🏛️</span> Counsel
            </button>
            <button 
              onClick={() => loginAs('admin@demo.ke')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>⚙️</span> Admin
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-4 text-center italic">
            Password for all demo accounts: <span className="font-mono">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
