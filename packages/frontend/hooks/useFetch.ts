import { useCallback } from 'react';

interface FetchOptions extends RequestInit {
  baseURL?: string;
}

export function useFetch() {
  const fetch = useCallback(async (url: string, options: FetchOptions = {}) => {
    const { baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', ...fetchOptions } = options;

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    const headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
      const response = await fetch(`${baseURL}${url}`, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  return { fetch };
}
