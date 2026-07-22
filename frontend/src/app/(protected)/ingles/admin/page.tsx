import type { Metadata } from 'next';
import { ExcelUploader } from '@/features/english/components/ExcelUploader';
import styles from './AdminInglesPage.module.css';

export const metadata: Metadata = { 
  title: 'Admin YEC | Carga Masiva' 
};

export default function AdminInglesPage() {
  return (
    <div className={styles.layout}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.adminBadge}>Acceso Restringido - Coordinación</span>
          <h2 className={styles.title}>Centro de Inglés YEC</h2>
          <p className={styles.subtitle}>
            Panel administrativo para la carga masiva de resultados de Pruebas de Ubicación.
          </p>
        </div>
      </div>

      <ExcelUploader />
    </div>
  );
}
