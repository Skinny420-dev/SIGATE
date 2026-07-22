import type { Metadata } from 'next';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';

export const metadata: Metadata = {
  title: { template: '%s | Sistema Académico', default: 'Dashboard' },
};

import { Suspense } from 'react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Cargando panel...</div>}>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  );
}
