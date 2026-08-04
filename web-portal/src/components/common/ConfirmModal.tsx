import React from 'react';
import { AlertTriangle, Trash2, X, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar Operación',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#161D27] border border-slate-200 dark:border-[#212A38] rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200 text-left">
        {/* Top Gradient Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          variant === 'danger'
            ? 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500'
            : variant === 'warning'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
        }`} />

        {/* Close button top right */}
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 p-1 rounded-lg transition-colors cursor-pointer"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with circular icon */}
        <div className="flex items-start space-x-4 pt-1">
          <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center border shadow-xs ${
            variant === 'danger'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400'
              : variant === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-600 dark:text-amber-400'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400'
          }`}>
            {variant === 'danger' ? (
              <Trash2 className="w-5 h-5 animate-pulse" />
            ) : variant === 'warning' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <HelpCircle className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-2 pr-4 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              {title}
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#212A38] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#303B4E] bg-slate-50 dark:bg-[#0D1117] hover:bg-slate-100 dark:hover:bg-[#212A38] text-slate-700 dark:text-gray-200 text-xs font-bold transition-all shadow-2xs cursor-pointer order-2 sm:order-1"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer order-1 sm:order-2 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-500/20'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-500/20'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20'
            }`}
          >
            {variant === 'danger' && <Trash2 className="w-4 h-4 shrink-0" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
