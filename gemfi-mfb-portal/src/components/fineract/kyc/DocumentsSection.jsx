import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Eye, Loader2 } from 'lucide-react';
import { kycApi, kycUpload } from '@/lib/kycApi';
import { useToast } from '@/components/ui/use-toast';
import KycCard from './KycCard';
import KycStatusBadge from './KycStatusBadge';
import UploadZone from './UploadZone';

const DOC_TYPES = [
  'National ID Card', 'NIN Slip', 'International Passport', 'Driver\'s Licence',
  'Voter Card', 'Utility Bill', 'Proof of Address', 'Employment Letter', 'Other',
];

export default function DocumentsSection({ clientId, documents: initialDocs, onChanged }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState(initialDocs || []);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { setDocs(initialDocs || []); }, [initialDocs]);

  const handleUpload = async (file, onProgress) => {
    setUploading(true);
    try {
      const res = await kycUpload(`/customers/${clientId}/documents`, file, 'file', {
        documentType: docType,
        documentNumber: docNumber,
        expiryDate,
      }, onProgress);
      // Upload response only carries { documentId } — build a local
      // representation from what was actually submitted rather than
      // fields the API never returns.
      const newDoc = {
        documentId: res?.data?.documentId,
        documentType: docType,
        documentNumber: docNumber,
        uploadDate: new Date().toISOString(),
        status: 'pending',
      };
      setDocs(prev => [...prev, newDoc]);
      setDocNumber(''); setExpiryDate('');
      toast({ title: 'Document uploaded' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      throw err;
    } finally { setUploading(false); }
  };

  const handleDelete = async (docId) => {
    setDeleting(docId);
    try {
      await kycApi(`/documents/${docId}`, { method: 'DELETE' });
      setDocs(prev => prev.filter(d => d.documentId !== docId));
      toast({ title: 'Document deleted' });
      onChanged?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setDeleting(null); }
  };

  const handleDownload = async (docId) => {
    try {
      const blob = await kycApi(`/documents/${docId}/download`, { isFile: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `document-${docId}`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <KycCard title="Documents" icon={FileText}>
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={docType} onChange={e => setDocType(e.target.value)} className="h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="text" placeholder="Document Number" value={docNumber} onChange={e => setDocNumber(e.target.value)} className="h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm" />
          <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm" />
        </div>
        <UploadZone label="Upload Document" accept="all" onUpload={handleUpload} />
      </div>

      {uploading && <div className="flex items-center gap-2 text-xs text-slate-400 mb-3"><Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Uploading…</div>}

      {docs.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No documents uploaded yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map(doc => (
            <div key={doc.documentId} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <FileText className="w-8 h-8 text-slate-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{doc.documentType || 'Document'}</p>
                <p className="text-xs text-slate-500">{doc.documentNumber || '—'} · {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : '—'}</p>
                <KycStatusBadge status={doc.status || 'pending'} />
              </div>
              <div className="flex gap-1">
                {doc.url && <button onClick={() => window.open(doc.url, '_blank')} className="p-1.5 text-slate-400 hover:text-white"><Eye className="w-3.5 h-3.5" /></button>}
                <button onClick={() => handleDownload(doc.documentId)} className="p-1.5 text-slate-400 hover:text-white"><Download className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(doc.documentId)} disabled={deleting === doc.documentId} className="p-1.5 text-rose-400 hover:text-rose-300">
                  {deleting === doc.documentId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </KycCard>
  );
}