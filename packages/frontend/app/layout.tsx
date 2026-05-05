import type { Metadata } from 'next';
import { AuthProvider } from './providers';
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
