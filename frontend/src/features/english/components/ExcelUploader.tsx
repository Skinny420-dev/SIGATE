'use client';

import { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/shared/ui/Button/Button';
import { useEnglishStore } from '../hooks/useEnglishStore';
import styles from './ExcelUploader.module.css';

export function ExcelUploader() {
  const { processExcelBatch } = useEnglishStore();
  const [isDragging, setIsDragging] = useState(false);
  const [fileState, setFileState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

  const handleSimulateUpload = () => {
    setFileState('PROCESSING');
    
    // Simulamos que el Excel tiene 150 estudiantes y a nuestro usuario de demo le tocó "A1.2"
    setTimeout(() => {
      processExcelBatch('A1.2');
      setFileState('SUCCESS');
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Carga Masiva de Pruebas de Ubicación</h3>
        <p className={styles.subtitle}>
          Sube el archivo Excel provisto por el sistema de evaluación. El sistema leerá las cédulas y asignará automáticamente el nivel autorizado a cientos de estudiantes en segundos.
        </p>
      </div>

      {fileState === 'IDLE' && (
        <div 
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleSimulateUpload(); }}
          onClick={handleSimulateUpload}
        >
          <UploadCloud size={40} className={styles.uploadIcon} />
          <p className={styles.dropText}>Arrastra el archivo <span>.xlsx</span> aquí o haz clic</p>
          <span className={styles.dropSubtext}>Formato requerido: Cédula | Nombre | Nivel Obtenido</span>
        </div>
      )}

      {fileState === 'PROCESSING' && (
        <div className={styles.processingState}>
          <FileSpreadsheet size={32} className={styles.processingIcon} />
          <div className={styles.spinner} />
          <p className={styles.processingText}>Leyendo filas y cruzando datos con la base estudiantil...</p>
        </div>
      )}

      {fileState === 'SUCCESS' && (
        <div className={styles.successState}>
          <div className={styles.successHeader}>
            <CheckCircle2 size={48} className={styles.successIcon} />
            <h4>¡Carga Completada con Éxito!</h4>
          </div>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <Users size={20} />
              <div>
                <span className={styles.statValue}>150</span>
                <span className={styles.statLabel}>Estudiantes Procesados</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <CheckCircle2 size={20} className={styles.successColor} />
              <div>
                <span className={styles.statValue}>150</span>
                <span className={styles.statLabel}>Niveles Asignados</span>
              </div>
            </div>
          </div>

          <div className={styles.actionBox}>
            <p>Los estudiantes ya pueden ingresar al módulo y matricularse en sus niveles correspondientes de forma automática.</p>
            <Button variant="outline" onClick={() => setFileState('IDLE')}>Cargar otro archivo</Button>
          </div>
        </div>
      )}
    </div>
  );
}
