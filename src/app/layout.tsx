import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { QueryProvider } from '@/providers/query-provider';

export const metadata: Metadata = {
  title: 'NodeWave Deliverables Management System',
  description:
    'Operational backbone for managing multi-disciplinary project deliverables with RBAC/ABAC, DAG dependencies, and optimistic locking.',
  icons: {
    icon: '/project-3d-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-indigo-500/20">
        <QueryProvider>
          <Navbar />
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
