import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/shared/ui/ToastProvider';

export const metadata: Metadata = {
  title: {
    template: '%s | Sistema Institucional',
    default: 'Sistema Institucional',
  },
  description: 'Plataforma de gestión académica: matrículas, prácticas pre-profesionales, inglés y titulación.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
