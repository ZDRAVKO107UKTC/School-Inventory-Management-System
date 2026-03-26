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
        className={`relative w-full p-8 flex flex-col items-center justify-center border-2 border-dashed rounded-[20px] transition-all duration-300 ${
          isDragging 
            ? 'border-[#0066cc] bg-blue-50/80 dark:bg-blue-500/10 shadow-lg shadow-[#0066cc]/20' 
            : error 
            ? 'border-rose-400 bg-rose-50/80 dark:bg-rose-500/10' 
            : 'border-[#d2d2d7] dark:border-[#303030] bg-white/30 dark:bg-black/20 hover:border-[#0066cc] hover:bg-blue-50/40 dark:hover:bg-blue-500/5 hover:shadow-md'
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
            <motion.div key="uploading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-[#0066cc]/30 border-t-[#0066cc] rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.5px] text-[#0066cc]">Uploading...</p>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center gap-3 text-center pointer-events-none">
              <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-full">
                <AlertCircle size={24} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.5px] text-rose-600 dark:text-rose-400 mb-1">Upload Failed</p>
                <p className="text-[9px] font-medium text-rose-500/80">{error}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setError(null);
                }} 
                className="mt-2 px-4 py-2 bg-white dark:bg-[#2c2c2e] border border-rose-200 dark:border-rose-500/30 rounded-[10px] shadow-sm text-[10px] font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 uppercase z-10 pointer-events-auto transition-all active:scale-95 tracking-[0.5px]"
              >
                Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center gap-3 pointer-events-none text-center">
              <div className={`p-3 rounded-full transition-all ${isDragging ? 'bg-[#0066cc]/10' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                <UploadCloud size={32} className={`transition-colors ${isDragging ? 'text-[#0066cc]' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`} />
              </div>
              <div>
                <p className="text-[11px] font-black text-[#1d1d1f] dark:text-[#f5f5f7] uppercase tracking-[0.5px] mb-1">
                  {isDragging ? 'Drop your file here' : 'Drag & Drop or'}
                </p>
                {!isDragging && (
                  <button 
                    onClick={(e) => e.preventDefault()}
                    className="text-[11px] font-black text-[#0066cc] uppercase tracking-[0.5px] hover:text-blue-600 pointer-events-auto transition-colors"
                  >
                    Click to Browse
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold mt-1">
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
