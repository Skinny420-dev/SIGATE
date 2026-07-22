import { useState } from 'react';
import { useEnrollmentWizard } from '../../hooks/useEnrollmentWizard';
import { UploadCloud, FileText, CheckCircle2, ChevronRight, Check, Award, Contact, Loader2 } from 'lucide-react';

export function StepDocuments() {
  const { 
    fichaEstudiantilUrl, certificadoNoAdeudarUrl, certificadoMatriculaUrl,
    uploadFichaEstudiantil, uploadCertificadoNoAdeudar, uploadCertificadoMatricula,
    nextStep 
  } = useEnrollmentWizard();

  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [field]: true }));
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setter(data.url); // Guardamos la url real para ver el PDF
      } else {
        alert(data.error || 'Error al subir el archivo.');
      }
    } catch {
      alert('Error de conexión al subir el archivo.');
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const canContinue = fichaEstudiantilUrl && certificadoNoAdeudarUrl && certificadoMatriculaUrl;

  return (
    <div className="am-docs-card" style={{ background: 'white', padding: '1.75rem 2rem', borderRadius: '16px', border: '1px solid #e8edf3', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem', color: '#0f172a', letterSpacing: '-0.02em' }}>Carga de Documentos (Fase A)</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Sube los documentos habilitantes obligatorios. Estos serán verificados posteriormente por las autoridades de la institución en la Fase B.
          </p>
        </div>
      </div>

      <div className="am-docs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        
        {/* Documento 1: Ficha Estudiantil */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc', transition: 'all 0.2s', boxShadow: fichaEstudiantilUrl ? '0 4px 14px rgba(16, 185, 129, 0.05)' : 'none', borderColor: fichaEstudiantilUrl ? '#6ee7b7' : '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Contact size={14} />
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>1. Ficha Estudiantil</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.4, flex: 1 }}>Descarga, completa con tus datos, firma con esfero azul y sube el archivo escaneado.</p>
          
          {!fichaEstudiantilUrl ? (
            <label 
              style={{ border: '2px dashed #cbd5e1', padding: '1.25rem', textAlign: 'center', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'block', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.background = '#eef2ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}
            >
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => handleRealUpload(e, 'ficha', uploadFichaEstudiantil)} />
              {uploading['ficha'] ? (
                <Loader2 style={{ margin: '0 auto 0.5rem', color: '#6366f1', animation: 'spin 1s linear infinite' }} size={20} />
              ) : (
                <UploadCloud style={{ margin: '0 auto 0.5rem', color: '#6366f1' }} size={20} />
              )}
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.2rem' }}>Subir archivo</p>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>PDF o Imagen (Max. 5MB)</p>
            </label>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <CheckCircle2 color="#16a34a" size={18} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fichaEstudiantilUrl}</div>
              </div>
            </div>
          )}
        </div>

        {/* Documento 2: Certificado de No Adeudar */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc', transition: 'all 0.2s', boxShadow: certificadoNoAdeudarUrl ? '0 4px 14px rgba(16, 185, 129, 0.05)' : 'none', borderColor: certificadoNoAdeudarUrl ? '#6ee7b7' : '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={14} />
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>2. Cert. No Adeudar</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.4, flex: 1 }}>Sube el Certificado actualizado, descargado desde el portal oficial del sistema SIAU.</p>
          
          {!certificadoNoAdeudarUrl ? (
            <label 
              style={{ border: '2px dashed #cbd5e1', padding: '1.25rem', textAlign: 'center', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'block', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#fcd34d'; e.currentTarget.style.background = '#fffbeb'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}
            >
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => handleRealUpload(e, 'siau', uploadCertificadoNoAdeudar)} />
              {uploading['siau'] ? (
                <Loader2 style={{ margin: '0 auto 0.5rem', color: '#f59e0b', animation: 'spin 1s linear infinite' }} size={20} />
              ) : (
                <UploadCloud style={{ margin: '0 auto 0.5rem', color: '#f59e0b' }} size={20} />
              )}
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706', marginBottom: '0.2rem' }}>Subir archivo</p>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>Certificado SIAU</p>
            </label>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <CheckCircle2 color="#16a34a" size={18} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{certificadoNoAdeudarUrl}</div>
              </div>
            </div>
          )}
        </div>

        {/* Documento 3: Certificado de Matrícula */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc', transition: 'all 0.2s', boxShadow: certificadoMatriculaUrl ? '0 4px 14px rgba(16, 185, 129, 0.05)' : 'none', borderColor: certificadoMatriculaUrl ? '#6ee7b7' : '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '6px', background: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={14} />
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>3. Cert. Matrícula</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.4, flex: 1 }}>Comprobante de matrícula oficial que avala tu continuidad académica.</p>
          
          {!certificadoMatriculaUrl ? (
            <label 
              style={{ border: '2px dashed #cbd5e1', padding: '1.25rem', textAlign: 'center', borderRadius: '8px', background: 'white', cursor: 'pointer', display: 'block', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f472b6'; e.currentTarget.style.background = '#fce7f3'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}
            >
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => handleRealUpload(e, 'matricula', uploadCertificadoMatricula)} />
              {uploading['matricula'] ? (
                <Loader2 style={{ margin: '0 auto 0.5rem', color: '#db2777', animation: 'spin 1s linear infinite' }} size={20} />
              ) : (
                <UploadCloud style={{ margin: '0 auto 0.5rem', color: '#db2777' }} size={20} />
              )}
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#db2777', marginBottom: '0.2rem' }}>Subir archivo</p>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>PDF Oficial</p>
            </label>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <CheckCircle2 color="#16a34a" size={18} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{certificadoMatriculaUrl}</div>
              </div>
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', paddingTop: '1.25rem', borderTop: '1px solid #e8edf3' }}>
        <button 
          onClick={nextStep} 
          disabled={!canContinue}
          style={{
            background: canContinue ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : '#e2e8f0',
            color: canContinue ? 'white' : '#94a3b8', 
            border: 'none', 
            padding: '0.8rem 2rem',
            borderRadius: '10px', 
            fontSize: '0.95rem', 
            fontWeight: 800,
            cursor: canContinue ? 'pointer' : 'not-allowed', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            boxShadow: canContinue ? '0 4px 14px rgba(79, 70, 229, 0.4)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          {canContinue && <Check size={16} />}
          Continuar a Selección de Materias 
          {canContinue && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
