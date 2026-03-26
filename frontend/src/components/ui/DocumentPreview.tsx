import React, { useState } from 'react';
import { ExternalLink, Image as ImageIcon, FileText, Loader2, FileSpreadsheet, File } from 'lucide-react';

interface Props {
  url: string;
  format?: string;
  className?: string;
  isThumbnail?: boolean;
  onClick?: () => void;
}

export const DocumentPreview: React.FC<Props> = ({ url, format, className = '', isThumbnail = false, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Basic extension detection with format override
  // Remap legacy broken paths from old backend version
  let processedUrl = url || '';
  if (processedUrl.startsWith('/api/equipment/uploads/')) {
    processedUrl = processedUrl.replace('/api/equipment/uploads/', '/uploads/equipment/');
  }

  const lowerUrl = processedUrl.toLowerCase();
  const lowerFormat = (format || '').toLowerCase();
  
  const isImage = lowerFormat ? ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'].includes(lowerFormat) : /\.(jpeg|jpg|gif|png|webp|svg|avif)($|\?)/i.test(lowerUrl);
  const isPdf = lowerFormat === 'pdf' || /\.pdf($|\?)/i.test(lowerUrl);
  const isExcel = ['xls', 'xlsx', 'csv'].includes(lowerFormat) || /\.(xls|xlsx|csv)($|\?)/i.test(lowerUrl);
  const isWord = ['doc', 'docx'].includes(lowerFormat) || /\.(doc|docx)($|\?)/i.test(lowerUrl);
  const isDoc = isPdf || isExcel || isWord || ['ppt', 'pptx', 'txt'].includes(lowerFormat) || /\.(ppt|pptx|txt)($|\?)/i.test(lowerUrl);

  // Google Docs Viewer URL format
  const iframeUrl = isDoc ? `https://docs.google.com/viewer?url=${encodeURIComponent(processedUrl)}&embedded=true` : processedUrl;

  // Render Image
  if (isImage) {
    return (
      <div 
        className={`relative group overflow-hidden bg-slate-100 dark:bg-[#1c1c1e] flex items-center justify-center ${className} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        {!loaded && !error && <Loader2 className="absolute animate-spin text-[#86868b]" size={isThumbnail ? 16 : 32} />}
        {error ? (
          <ImageIcon className="text-[#86868b]" size={isThumbnail ? 16 : 32} />
        ) : (
          <img 
            src={processedUrl} 
            alt="Preview" 
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
      </div>
    );
  }

  // Render Thumbnail for Documents (No iframe)
  if (isThumbnail) {
    const Icon = isExcel ? FileSpreadsheet : isWord ? FileText : isPdf ? FileText : File;
    const colorClass = isExcel ? 'text-emerald-500' : isPdf ? 'text-rose-500' : isWord ? 'text-blue-500' : 'text-[#86868b]';
    return (
      <div 
        className={`relative flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1c1c1e] hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-all rounded-xl border border-[#d2d2d7] dark:border-[#303030] ${className} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        title={processedUrl}
      >
        <Icon size={24} className={colorClass} strokeWidth={1.5} />
        <span className={`text-[7px] font-black uppercase mt-1 px-1.5 py-0.5 rounded ${colorClass} bg-current/5`}>
          {lowerFormat || (isExcel ? 'EXCEL' : isPdf ? 'PDF' : isWord ? 'WORD' : 'DOC')}
        </span>
      </div>
    );
  }

  // Render Full Inline Iframe Document
  if (isDoc) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-slate-50 dark:bg-[#1c1c1e] group ${className}`}>
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#0066cc]" size={28} />
            <span className="text-[10px] font-black uppercase text-[#86868b] tracking-widest">Loading Document Viewer</span>
          </div>
        )}
        <iframe 
          src={iframeUrl} 
          className={`w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          title="Document Preview"
        />
        {/* Hover open-in-new-tab button */}
        <button 
          onClick={(e) => { e.stopPropagation(); window.open(processedUrl, '_blank'); }}
          className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-xl"
          title="Open in new tab"
        >
          <ExternalLink size={16} />
        </button>
      </div>
    );
  }

  // Fallback
  return (
    <a 
      href={processedUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`flex flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-[#1c1c1e] hover:bg-slate-200 dark:hover:bg-[#2c2c2e] transition-colors ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <FileText size={32} className="text-[#86868b]" />
      <span className="text-[10px] uppercase font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Open File</span>
    </a>
  );
};
