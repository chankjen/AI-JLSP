'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const loadUser = useAuth((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return <>{children}</>;
}
