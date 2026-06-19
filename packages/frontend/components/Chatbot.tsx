'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, FileText, BarChart2, CheckCircle, TrendingUp, X, Maximize2, Minimize2, Paperclip as AttachmentIcon, Globe, Mic, Video, Image as ImageIcon, Briefcase } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Jambo! I am your AI-JLSP Legal Assistant. How can I help you today? I can analyze documents, predict case outcomes, and check legal compliance.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const queryText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Intercept e-Filing requests
    if (queryText.toLowerCase().includes('fetch my cases') || queryText.toLowerCase() === 'fetch cases') {
      try {
        const response = await apiClient.post('/ai/chatbot/fetch-cases', {});
        const data = response.data;
        
        let content = "I've successfully connected to the e-Filing system and retrieved your recent cases:\n\n";
        data.cases.forEach((c: any) => {
          content += `**${c.caseNumber}**: ${c.title} (${c.court}) - Status: **${c.status}** (Filed: ${c.dateFiled})\n`;
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
          data: { efiling_sync: true }
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('e-Filing error:', error);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, I encountered an error connecting to the e-Filing system.",
          timestamp: new Date()
        }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    try {
      const response = await apiClient.post('/ai/chatbot/query', { query: queryText });
      const data = response.data;
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm processing your request.",
        timestamp: new Date(),
        data: data.data || data.results || data.summary
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Uploaded file: ${file.name}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // In a real app, you'd send the file. For now, we'll simulate the analysis.
    setTimeout(async () => {
      try {
        const response = await apiClient.post('/ai/chatbot/analyze-file', { 
          file_content: "Mock content from " + file.name,
          file_type: file.name.split('.').pop() || 'txt'
        });

        const data = response.data;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've analyzed **${file.name}**. Here are the findings:`,
          timestamp: new Date(),
          data: data
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('File analysis error:', error);
      } finally {
        setIsTyping(false);
      }
    }, 1000);
  };

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all transform hover:scale-110 z-50 animate-bounce"
      >
        <TrendingUp className="text-white w-8 h-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[450px] h-[650px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden z-50 transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none">AI-JLSP Legal Bot</h3>
            <span className="text-xs text-blue-100 flex items-center mt-1">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Always active • Art 47 Compliant
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded">
            <Minimize2 className="w-5 h-5" />
          </button>
          <button className="p-1 hover:bg-white/10 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              <div className="text-sm prose prose-sm max-w-none">
                {m.content}
              </div>
              
              {m.data && (
                <div className="mt-3 space-y-2">
                  {/* Render analysis data if present */}
                  {m.data.credibility_score && (
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Credibility Score</div>
                      <div className="flex items-center justify-between">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${m.data.credibility_score * 100}%` }}></div>
                        </div>
                        <span className="text-xs font-bold">{(m.data.credibility_score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                  {m.data.compliance && (
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <div className="text-xs font-semibold text-blue-700 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Legal Compliance
                      </div>
                      <p className="text-xs mt-1 text-blue-900">{m.data.compliance.is_compliant ? 'Compliant with statutory requirements.' : 'Issues detected.'}</p>
                    </div>
                  )}
                  {m.data.probability_win && (
                    <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                      <div className="text-xs font-semibold text-indigo-700 flex items-center">
                        <BarChart2 className="w-3 h-3 mr-1" /> Win Probability
                      </div>
                      <p className="text-xs font-bold text-indigo-900 mt-1">{(m.data.probability_win * 100).toFixed(1)}% Chance of Success</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className={`text-[10px] mt-2 ${m.role === 'user' ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex space-x-1 items-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Upload Documents">
            <FileText className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="External URL">
            <Globe className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Audio Recording">
            <Mic className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Video Analysis">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Photos/OCR">
            <ImageIcon className="w-5 h-5" />
          </button>
          <button 
            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors" 
            title="Fetch e-Filing Cases"
            onClick={() => {
              setInput('Fetch my cases');
              // Optionally trigger send directly
            }}
          >
            <Briefcase className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
            accept=".pdf,.csv,.xlsx,.xls,.txt,.png,.jpg,.jpeg"
          />
        </div>
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Describe your case or ask for legal advice..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 resize-none max-h-32 min-h-[50px] text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Powered by Legal-BERT-KE. Non-binding advisory only.
        </p>
      </div>
    </div>
  );
}
