'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Info, X } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ActivityMonitor() {
  const pathname = usePathname();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const lastActionRef = useRef<string>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredOnPathRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // Record click actions globally
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        lastActionRef.current = `clicked button ${target.innerText || target.title || 'unknown'}`;
        resetTimer();
      } else if (target.tagName === 'A' || target.closest('a')) {
        lastActionRef.current = `clicked link ${target.innerText || 'unknown'}`;
        resetTimer();
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const triggerProactiveGuidance = async () => {
    if (hasTriggeredOnPathRef.current[pathname]) return; // Only trigger once per path
    
    try {
      const response = await apiClient.post('/ai/chatbot/proactive-guidance', {
        pathname: pathname,
        last_action: lastActionRef.current
      });
      
      if (response.data && response.data.guidance) {
        setToastMessage(response.data.guidance);
        setIsVisible(true);
        hasTriggeredOnPathRef.current[pathname] = true;
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 10000);
      }
    } catch (err) {
      console.error('Failed to fetch proactive guidance', err);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Wait 15 seconds of inactivity before suggesting guidance
    timerRef.current = setTimeout(() => {
      triggerProactiveGuidance();
    }, 15000);
  };

  useEffect(() => {
    lastActionRef.current = 'navigated to page';
    resetTimer();
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!isVisible || !toastMessage) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm">
      <div className="bg-white border border-blue-100 rounded-xl shadow-xl overflow-hidden flex">
        <div className="bg-blue-600 w-2 flex-shrink-0" />
        <div className="p-4 flex items-start flex-1 gap-3">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600 flex-shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">AI Guidance</h4>
            <p className="text-sm text-gray-600 leading-snug">{toastMessage}</p>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
