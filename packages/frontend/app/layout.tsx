import type { Metadata } from 'next';
import { AuthProvider } from './providers';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import Chatbot from '@/components/Chatbot';
import ActivityMonitor from '@/components/ActivityMonitor';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI-JLSP | Kenya Judiciary & KRA',
  description: 'AI-Enhanced Judicial & Legal Services Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1">
              <Header />
              {children}
            </main>
          </div>
          <Chatbot />
          <ActivityMonitor />
        </AuthProvider>
      </body>
    </html>
  );
}
