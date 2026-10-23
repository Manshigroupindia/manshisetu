import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  primaryActionLabel?: string;
  onAction?: () => void;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  primaryActionLabel,
  onAction,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) => {
  const primaryLabel = primaryActionLabel || actionText;
  const handlePrimary = onPrimaryAction || onAction;

  return (
    <div
      className={`w-full py-14 px-6 text-center flex flex-col items-center justify-center bg-white/60 dark:bg-navy-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-navy-700/80 transition-all ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-navy-800 dark:to-navy-800/60 border border-slate-200 dark:border-navy-700 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-xs">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6 font-normal">
        {description}
      </p>
      {(primaryLabel || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryLabel && handlePrimary && (
            <button
              type="button"
              onClick={handlePrimary}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors"
            >
              {primaryLabel}
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-xl transition-colors"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
