import React, { useEffect, useState } from 'react';
import { FilePlus, Trash2, Calendar, FileType, Search, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentPreview } from '@/components/ui/DocumentPreview';
import { FileUploader } from '@/components/ui/FileUploader';
import { getAllDocuments, deleteDocument, uploadGlobalDocument, GlobalDocument } from '@/services/documentService';
import { Button } from '@/components/ui/Button';

interface Props {
  token: string;
  isAdmin: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/** Resolve a document URL — Cloudinary URLs are absolute, but local fallbacks start with /uploads */
const resolveDocUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

export const GlobalDocuments: React.FC<Props> = ({ token, isAdmin }) => {
  const [documents, setDocuments] = useState<GlobalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Policies', 'Manuals', 'Forms'];

  const fetchDocs = async () => {
    setLoading(true);
    const res = await getAllDocuments(token, selectedCategory === 'All' ? undefined : selectedCategory);
    setLoading(false);
    if (res.success && res.data) {
      setDocuments(res.data);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [token, selectedCategory]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    const res = await deleteDocument(token, id);
    if (res.success) {
      setDocuments(prev => prev.filter(d => d.id !== id));
    } else {
      alert(res.error || 'Failed to delete document');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white">Document Vault</h3>
          <p className="text-xs text-[#86868b]">Centralized storage for school policies, manuals, and guidelines.</p>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload document"
            aria-label="Upload document"
            className="group h-11 w-11 min-w-[44px] rounded-[14px] border border-[#d2d2d7]/75 dark:border-[#3a3a3c]/85 bg-white/35 dark:bg-white/[0.06] backdrop-blur-md text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/55 dark:hover:bg-white/[0.11] hover:border-[#0066cc]/50 dark:hover:border-[#7aa8ff]/45 hover:text-[#0066cc] dark:hover:text-[#9fc0ff] shadow-[0_6px_18px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_22px_rgba(0,0,0,0.35)] active:scale-95 transition-all flex items-center justify-center"
          >
            <FilePlus size={17} className="shrink-0 transition-transform group-hover:scale-110" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
          <input 
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1c1c1e] border border-[#d2d2d7] dark:border-[#303030] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] focus:ring-2 focus:ring-[#0066cc]/20 outline-none transition-all"
          />
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full px-2 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-center whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-md' 
                  : 'bg-white dark:bg-[#1c1c1e] border-[#d2d2d7] dark:border-[#303030] text-[#86868b] hover:border-[#86868b]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={doc.id}
              className="group bg-white dark:bg-[#1c1c1e] border border-[#d2d2d7] dark:border-[#303030] rounded-[24px] p-4 hover:shadow-xl hover:border-[#0066cc]/30 transition-all cursor-pointer"
              onClick={() => window.open(resolveDocUrl(doc.url), '_blank')}
            >
              <div className="flex items-center gap-5">
                <DocumentPreview 
                  url={resolveDocUrl(doc.url)} 
                  format={doc.format}
                  isThumbnail 
                  className="w-16 h-16 rounded-2xl flex-shrink-0 shadow-sm bg-white dark:bg-[#2c2c2e]" 
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#0066cc] bg-[#0066cc]/5 px-2 py-0.5 rounded-full">
                      {doc.category}
                    </span>
                    <span className="text-[9px] font-bold text-[#86868b] uppercase tracking-tighter">
                      {doc.format} • {doc.size}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-[#1d1d1f] dark:text-white truncate" title={doc.name}>
                    {doc.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#86868b] mt-1">
                    <Calendar size={12} className="opacity-40" />
                    <span>Added {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pr-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(resolveDocUrl(doc.url), '_blank'); }}
                    className="w-10 h-10 flex items-center justify-center bg-[#f5f5f7] dark:bg-[#2c2c2e] hover:bg-[#0066cc] hover:text-white text-[#86868b] rounded-full transition-all"
                  >
                    <ExternalLink size={16} />
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      className="w-10 h-10 flex items-center justify-center bg-[#f5f5f7] dark:bg-[#2c2c2e] hover:bg-rose-500 hover:text-white text-[#86868b] rounded-full transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )) : !loading && (
            <div className="col-span-full py-24 bg-[#f5f5f7] dark:bg-[#1c1c1e] border border-dashed border-[#d2d2d7] dark:border-[#303030] rounded-[40px] flex flex-col items-center justify-center opacity-40">
              <FileType size={48} className="mb-4 text-[#86868b]" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1d1d1f] dark:text-white">Vault Empty</p>
              <p className="text-[10px] mt-2 font-medium text-center px-8">No documents match your filters or search term.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsUploadModalOpen(false)} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative w-full max-w-md bg-white dark:bg-[#1d1d1f] rounded-[32px] shadow-2xl overflow-hidden p-8 border border-[#d2d2d7] dark:border-[#303030]"
            >
              <h3 className="text-xl font-bold mb-2">Upload Document</h3>
              <p className="text-xs text-[#86868b] mb-6">Select a file to add to the school vault.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[#86868b] ml-1 mb-1.5 block">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.filter(c => c !== 'All').map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedCategory === cat 
                            ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-lg shadow-[#0066cc]/20' 
                            : 'bg-[#f5f5f7] dark:bg-[#2c2c2e] border-[#d2d2d7] dark:border-[#38383a] text-[#86868b] dark:text-[#f5f5f7]/60 hover:border-[#86868b]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <FileUploader 
                    token={token}
                    onUploadSuccess={() => {
                      setIsUploadModalOpen(false);
                      fetchDocs();
                    }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt"
                    hintText="PDF, Word, Excel, PowerPoint"
                    uploadFn={(t, f) => uploadGlobalDocument(t, f, f.name, selectedCategory === 'All' ? 'General' : selectedCategory)}
                  />
                </div>
              </div>

              <div className="mt-8">
                <Button 
                  variant="secondary"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="w-full h-12 text-[10px] font-black uppercase tracking-widest"
                >
                  Close Vault
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
