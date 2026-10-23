import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  WifiOff,
  MapPinOff,
  Lock,
  X,
  Info,
} from 'lucide-react';
import { GeoErrorDetails } from '../../utils/geoUtils';

interface LocationErrorBannerProps {
  error: GeoErrorDetails;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  locatingMessage?: string;
}

export const LocationErrorBanner: React.FC<LocationErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  locatingMessage,
}) => {
  // Select context-appropriate icon
  const getIcon = () => {
    switch (error.kind) {
      case 'PERMISSION_DENIED':
        return <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
      case 'INSECURE_CONTEXT':
        return <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
      case 'TIMEOUT':
        return <WifiOff className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />;
      case 'POSITION_UNAVAILABLE':
        return <MapPinOff className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />;
    }
  };

  const isWarningOnly = error.kind === 'PERMISSION_DENIED' || error.kind === 'INSECURE_CONTEXT';

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all animate-in fade-in duration-200 shadow-sm ${
        isWarningOnly
          ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
          : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {getIcon()}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm tracking-tight">{error.title}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isWarningOnly
                    ? 'bg-amber-200/70 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                    : 'bg-rose-200/70 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                }`}
              >
                {error.kind.replace('_', ' ')}
              </span>
            </div>

            <p className="text-xs font-medium opacity-90 leading-relaxed">{error.message}</p>

            {/* Actionable Guidance Card */}
            {error.guidance && (
              <div
                className={`mt-2 p-2.5 rounded-xl border text-[11px] font-semibold flex items-start gap-2 ${
                  isWarningOnly
                    ? 'bg-amber-100/60 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50 text-amber-950 dark:text-amber-100'
                    : 'bg-rose-100/60 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50 text-rose-950 dark:text-rose-100'
                }`}
              >
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80" />
                <span>{error.guidance}</span>
              </div>
            )}

            {isRetrying && locatingMessage && (
              <div className="flex items-center gap-2 pt-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{locatingMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-1 sm:pt-0">
          {error.canRetry && onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60 ${
                isWarningOnly
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying...' : 'Retry Location'}</span>
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
