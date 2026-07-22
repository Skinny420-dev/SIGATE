import type { Metadata } from 'next';
import { PlacementTestRegistration } from '@/features/english/components/PlacementTestRegistration';
import { EnglishEnrollmentGrid } from '@/features/english/components/EnglishEnrollmentGrid';
import styles from './InglesPage.module.css';

export const metadata: Metadata = { 
  title: 'Centro de Inglés YEC' 
};

export default function InglesPage() {
  return (
    <div className={styles.layout}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>Centro de Idiomas YEC</h2>
        </div>
      </div>

      <PlacementTestRegistration />
      <EnglishEnrollmentGrid />
    </div>
  );
}
