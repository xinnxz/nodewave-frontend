import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { QueryProvider } from '@/providers/query-provider';

export const metadata: Metadata = {
  title: 'NodeWave Deliverables Management System',
  description:
    'Operational backbone for managing multi-disciplinary project deliverables with RBAC/ABAC, DAG dependencies, and optimistic locking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <QueryProvider>
          <Navbar />
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
