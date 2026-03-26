import React from 'react';

interface DashboardActionModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
  input?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}

export const DashboardActionModal: React.FC<DashboardActionModalProps> = ({
  open,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  input,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-md p-4" onClick={onCancel}>
      <div
        className="w-full max-w-[460px] rounded-[18px] border border-[#2f5fbf]/45 bg-gradient-to-br from-[#171a23]/98 via-[#1b1f2c]/97 to-[#141721]/98 text-[#e8edf8] shadow-[0_20px_65px_-35px_rgba(45,105,255,0.7)] p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h3 className="text-3xl leading-none font-black tracking-[0.11em] uppercase text-[#dbe2f0]">{title}</h3>
          <p className="mt-2 text-[15px] leading-snug text-[#9eb0d1] max-w-[95%]">{message}</p>
        </div>

        {input && (
          <input
            value={input.value}
            onChange={(e) => input.onChange(e.target.value)}
            placeholder={input.placeholder}
            className="w-full h-11 rounded-xl px-3.5 bg-[#101520]/90 border border-[#3f4e70] text-[17px] text-[#f4f7ff] placeholder:text-[#7f8eb2] focus:outline-none focus:ring-2 focus:ring-[#2f79ff]/45"
            autoFocus
          />
        )}

        <div className="h-px bg-[#3f4e70] my-5" />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="h-11 rounded-xl bg-[#191c24] text-[#e5ebf7] font-bold text-[16px] tracking-wide transition-transform hover:scale-[1.01]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`h-11 rounded-xl font-bold text-[16px] tracking-wide text-white transition-transform hover:scale-[1.01] ${
              variant === 'danger' ? 'bg-[#ff3b30]' : 'bg-[#1f8bff]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
