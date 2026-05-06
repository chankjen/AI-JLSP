'use client';

import { useRef, useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SignatureModal({ isOpen, onClose, onSuccess }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const save = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const signature = canvasRef.current.toDataURL('image/png');
      await apiClient.post('/signatures', { signature });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Save signature failed:', err);
      alert('Failed to save signature.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight italic">Capture Digital Signature</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Law Society of Kenya Standard</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-xl font-bold">×</button>
        </div>
        
        <div className="p-8">
          <div className="relative group">
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="border-2 border-dashed border-gray-200 rounded-2xl cursor-crosshair bg-gray-50/30 group-hover:border-indigo-200 transition touch-none mx-auto block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
              <span className="text-4xl font-black text-gray-900 tracking-widest uppercase rotate-[-15deg]">SIGN HERE</span>
            </div>
          </div>
          
          <div className="flex gap-4 mt-8">
            <button 
              onClick={clear}
              className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 transition text-sm uppercase tracking-widest"
            >
              Clear Canvas
            </button>
            <button 
              onClick={save}
              disabled={saving}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50 uppercase tracking-widest text-sm"
            >
              {saving ? 'Encrypting...' : '💾 Secure & Save'}
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-slate-900 text-white text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">🔒 AES-256 Bit Encrypted Storage</p>
        </div>
      </div>
    </div>
  );
}
