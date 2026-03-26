import React, { useCallback, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadEquipmentFile } from '@/services/inventoryService';
import type { ApiResult } from '@/types/auth';

interface Props {
  token: string;
  onUploadSuccess: (url: string) => void;
  className?: string;
  accept?: string;
  hintText?: string;
  uploadFn?: (token: string, file: File) => Promise<ApiResult<any>>;
}

export const FileUploader: React.FC<Props> = ({ 
  token, 
  onUploadSuccess, 
  className = "",
  accept = "image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  hintText = "Supports Images, PDF, Word, Excel",
  uploadFn = uploadEquipmentFile
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [token, onUploadSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setUploading(true);

    const res = await uploadFn(token, selectedFile);
    setUploading(false);

    if (res.success && res.data) {
      onUploadSuccess(res.data.url);
    } else {
      setError(res.error || 'Upload failed');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full p-6 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all ${
          isDragging ? 'border-[#0066cc] bg-[#0066cc]/5' : error ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-[#d2d2d7] dark:border-[#303030] hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <input 
          type="file" 
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={uploading}
        />
        
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#0066cc]">Uploading...</p>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 text-center pointer-events-none">
              <AlertCircle size={28} className="text-red-500 mb-1" />
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Upload Failed</p>
              <p className="text-[9px] font-medium text-red-400">{error}</p>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setError(null);
                }} 
                className="mt-2 px-3 py-1 bg-white border border-red-200 rounded-lg shadow-sm text-[10px] font-black text-red-600 hover:bg-red-50 uppercase z-10 pointer-events-auto transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 pointer-events-none text-center">
              <UploadCloud size={32} className={`mb-2 transition-colors ${isDragging ? 'text-[#0066cc]' : 'text-[#86868b]'}`} />
              <p className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Drag & drop a file here, or click to browse
              </p>
              <p className="text-[9px] text-[#86868b] uppercase tracking-wider font-semibold">
                {hintText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FileUploader;
