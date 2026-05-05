'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';

const ROLE_LANDING: Record<string, string> = {
  advocate: '/dashboard/advocate',
  tdr_officer: '/dashboard/tdr-officer',
  litigation_counsel: '/dashboard/litigation-counsel',
  board_secretary: '/dashboard/board-secretary',
  admin: '/dashboard/admin',
  dpo: '/dashboard/compliance',
  citizen: '/dashboard/citizen',
};

export default function DashboardIndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      const landing = ROLE_LANDING[user.role] ?? '/dashboard/advocate';
      router.replace(landing);
    }
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-gray-600 text-lg font-medium">Loading your workspace…</p>
      </div>
    </div>
  );
}
