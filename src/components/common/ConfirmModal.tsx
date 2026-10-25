import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, CheckCircle2, AlertOctagon, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'warning' | 'success';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  variant,
  isLoading = false,
}) => {
  const resolvedVariant = variant || (isDestructive ? 'danger' : 'warning');

  const iconClasses = {
    danger: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
  }[resolvedVariant];

  const buttonClasses = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  }[resolvedVariant];

  const IconComponent =
    resolvedVariant === 'success' ? CheckCircle2 : resolvedVariant === 'danger' ? AlertOctagon : AlertTriangle;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4 py-2">
        <div className={`p-3 rounded-full shrink-0 ${iconClasses}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-navy-800">
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 ${buttonClasses}`}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{confirmText}</span>
        </button>
      </div>
    </Modal>
  );
};
