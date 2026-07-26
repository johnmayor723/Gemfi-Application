import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Loader2, X, FileText, Image as ImageIcon, RefreshCw } from 'lucide-react';

const ACCEPTED_IMAGES = ['jpg', 'jpeg', 'png', 'webp'];
const ACCEPTED_DOCS = ['pdf', 'docx'];
const ALL_ACCEPTED = [...ACCEPTED_IMAGES, ...ACCEPTED_DOCS];

export default function UploadZone({ onUpload, label = 'Upload File', accept = 'all', compact = false }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const inputRef = useRef(null);

  const allowed = accept === 'images' ? ACCEPTED_IMAGES : accept === 'docs' ? ACCEPTED_DOCS : ALL_ACCEPTED;

  const handleFile = useCallback(async (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Unsupported format. Allowed: ${allowed.join(', ')}`);
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);
    setPreviewFile(file);
    try {
      await onUpload(file, (p) => setProgress(p));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [allowed, onUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const isImage = previewFile && ACCEPTED_IMAGES.includes(previewFile.name.split('.').pop()?.toLowerCase());
  const previewUrl = previewFile ? URL.createObjectURL(previewFile) : null;

  if (compact) {
    return (
      <div>
        <input ref={inputRef} type="file" className="hidden" accept={`.${allowed.join(',.')}`} onChange={handleSelect} />
        {uploading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Uploading… {progress}%</span>
            <div className="w-20 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white">
            <UploadCloud className="w-3.5 h-3.5" /> {label}
          </button>
        )}
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" className="hidden" accept={`.${allowed.join(',.')}`} onChange={handleSelect} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-sm text-slate-300">Uploading… {progress}%</span>
            <div className="w-full max-w-xs h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : previewUrl && isImage ? (
          <div className="relative inline-block">
            <img src={previewUrl} alt="Preview" className="max-h-40 rounded-lg" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="w-8 h-8 text-slate-500" />
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-xs text-slate-600">Drag & drop or click to browse · {allowed.join(', ')}</p>
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 mt-2 text-xs text-rose-400">
          <X className="w-3.5 h-3.5" />
          {error}
          <button onClick={() => inputRef.current?.click()} className="ml-2 inline-flex items-center gap-1 text-emerald-400 hover:underline">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
}