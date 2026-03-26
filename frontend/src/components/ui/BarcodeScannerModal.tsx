import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export const BarcodeScannerModal: React.FC<Props> = ({ isOpen, onClose, onDetected }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen || !scannerRef.current) return;

    setIsInitializing(true);
    setError(null);

    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            width: { min: 640 },
            height: { min: 480 },
            facingMode: 'environment', // Rear camera
          },
        },
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
        numOfWorkers: 2,
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'codabar_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader',
          ],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          console.error('Quagga init error:', err);
          setError('Could not access camera. Please check permissions.');
          setIsInitializing(false);
          return;
        }
        setIsInitializing(false);
        Quagga.start();
      }
    );

    Quagga.onDetected((data) => {
      const code = data.codeResult.code;
      if (code) {
        onDetected(code);
        onClose();
      }
    });

    return () => {
      Quagga.stop();
      Quagga.offDetected();
    };
  }, [isOpen, onDetected, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Barcode Scanner</h2>
              <p className="text-sm text-slate-500">Scan equipment serial number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
          <div ref={scannerRef} className="w-full h-full [&>video]:absolute [&>video]:inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:w-full [&>canvas]:h-full" />
          
          {/* Overlay Graphics */}
          <div className="absolute inset-0 border-[40px] border-black/30 pointer-events-none flex items-center justify-center">
             <div className="w-64 h-32 border-2 border-indigo-500/80 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-scanLine" />
             </div>
          </div>

          {isInitializing && (
            <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-950/80 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Initializing camera...</span>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
              <p className="text-slate-900 dark:text-white font-semibold mb-2">{error}</p>
              <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Center the barcode within the box to scan automatically
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        .animate-scanLine {
          animation: scanLine 2s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
