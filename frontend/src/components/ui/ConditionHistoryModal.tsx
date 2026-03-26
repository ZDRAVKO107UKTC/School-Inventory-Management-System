import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle, AlertTriangle, Wrench, Star, ArchiveX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEquipmentConditionHistory } from '@/services/inventoryService';

interface ConditionLog {
  id: number;
  condition: 'new' | 'good' | 'fair' | 'damaged';
  notes?: string;
  recorded_at?: string;
  created_at?: string;
  user?: { username: string };
  request?: { id: number };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: number;
  equipmentName: string;
  token: string;
}

const conditionConfig = {
  new: {
    label: 'Brand New',
    icon: Star,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    border: 'border-blue-200 dark:border-blue-800',
  },
  good: {
    label: 'Good',
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  fair: {
    label: 'Fair / Used',
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-amber-200 dark:border-amber-800',
  },
  damaged: {
    label: 'Damaged',
    icon: Wrench,
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    border: 'border-rose-200 dark:border-rose-800',
  },
};

export const ConditionHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  equipmentId,
  equipmentName,
  token,
}) => {
  const [logs, setLogs] = useState<ConditionLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;
    const fetch = async () => {
      setLoading(true);
      const res = await getEquipmentConditionHistory(token, equipmentId);
      setLoading(false);
      if (res.success && res.data) setLogs(res.data as ConditionLog[]);
      else setLogs([]);
    };
    fetch();
  }, [isOpen, equipmentId, token]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown date';
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xl"
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1d1d1f] sm:rounded-[32px] rounded-t-[32px] shadow-2xl border border-[#d2d2d7] dark:border-[#303030] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-[#f5f5f7] dark:border-[#303030]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Clock size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-[#1d1d1f] dark:text-white">
                    Condition History
                  </h3>
                  <p className="text-[10px] text-[#86868b] font-medium truncate max-w-[200px]">{equipmentName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} className="text-[#86868b]" />
              </button>
            </div>

            {/* Timeline */}
            <div className="px-8 py-6 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-40 gap-3">
                  <ArchiveX size={36} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-center">
                    No condition logs recorded yet.
                  </p>
                  <p className="text-[9px] text-[#86868b] text-center leading-relaxed max-w-[200px]">
                    Logs are created when equipment is returned with a condition rating.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[#d2d2d7] dark:bg-[#303030]" />

                  <div className="space-y-4">
                    {logs.map((log, i) => {
                      const config = conditionConfig[log.condition] || conditionConfig.good;
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={log.id || i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-4 relative"
                        >
                          {/* Dot */}
                          <div className={`w-10 h-10 shrink-0 rounded-full ${config.bg} ${config.border} border-2 flex items-center justify-center z-10`}>
                            <Icon size={16} className={config.text} />
                          </div>

                          {/* Content */}
                          <div className={`flex-1 p-4 rounded-2xl ${config.bg} border ${config.border}`}>
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${config.text}`}>
                                {config.label}
                              </span>
                              <span className="text-[9px] text-[#86868b] font-semibold">
                                {formatDate(log.recorded_at || log.created_at)}
                              </span>
                            </div>
                            {log.user?.username && (
                              <p className="text-[10px] font-bold text-[#1d1d1f] dark:text-white mb-1">
                                Returned by: <span className="text-[#0066cc]">{log.user.username}</span>
                              </p>
                            )}
                            {log.notes && (
                              <p className="text-[10px] text-[#86868b] italic leading-relaxed">
                                "{log.notes}"
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 pt-2">
              <p className="text-center text-[9px] text-[#86868b]">
                {logs.length} condition {logs.length === 1 ? 'record' : 'records'} found
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConditionHistoryModal;
