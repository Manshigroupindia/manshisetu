import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Briefcase,
  Receipt,
  CreditCard,
  Calendar,
  Sparkles,
  CheckCheck,
  Trash2,
  Radio,
  Wifi,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationType } from '../../types';

interface NotificationDropdownProps {
  className?: string;
}

/**
 * Format relative time (e.g., "Just now", "5m ago", "2h ago", "Yesterday")
 */
function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Recently';
  }
}

/**
 * Map notification type to icon and styling
 */
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'duty_on':
    case 'attendance_duty_on':
      return {
        icon: MapPin,
        bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
      };
    case 'duty_off':
    case 'attendance_duty_off':
      return {
        icon: Clock,
        bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
      };
    case 'task_assigned':
    case 'task_updated':
      return {
        icon: Briefcase,
        bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
      };
    case 'task_completed':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
      };
    case 'expense_submitted':
    case 'expense_request':
      return {
        icon: Receipt,
        bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
      };
    case 'expense_approved':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
      };
    case 'expense_rejected':
      return {
        icon: AlertTriangle,
        bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
      };
    case 'salary_processed':
    case 'salary_paid':
    case 'salary_advance_requested':
    case 'salary_advance_request':
    case 'salary_advance_approved':
    case 'salary_advance_rejected':
      return {
        icon: CreditCard,
        bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
      };
    case 'holiday_added':
    case 'event_added':
    case 'event_scheduled':
      return {
        icon: Calendar,
        bg: 'bg-teal-100 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300',
      };
    case 'notice_published':
    default:
      return {
        icon: Sparkles,
        bg: 'bg-brand-100 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300',
      };
  }
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const {
    notifications,
    unreadNotificationCount,
    notificationWsStatus,
    webNotificationPermission,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    requestWebNotificationPermission,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications =
    activeTab === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors border border-slate-200 dark:border-navy-700/80 cursor-pointer"
        aria-label="Open notifications menu"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-navy-900 animate-pulse">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 py-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 pb-3 border-b border-slate-100 dark:border-navy-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Live Notifications
                </span>
                {unreadNotificationCount > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300">
                    {unreadNotificationCount} Unread
                  </span>
                )}
              </div>

              {/* Real-time Connection Status Indicator */}
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                title={
                  notificationWsStatus === 'connected'
                    ? 'WebSocket connection active'
                    : 'Firebase Realtime WebChannel active'
                }
              >
                {notificationWsStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>WebSocket Live</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                    <Wifi className="w-3 h-3" />
                    <span>Realtime Live</span>
                  </span>
                )}
              </div>
            </div>

            {/* Filter Tabs & Mark All Read */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-800 p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('unread')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeTab === 'unread'
                      ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Unread ({unreadNotificationCount})
                </button>
              </div>

              {unreadNotificationCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Browser Push Permission Request Banner (if not yet granted) */}
          {webNotificationPermission !== 'granted' && (
            <div className="mx-3 my-2 p-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Enable desktop alerts for instant notifications
                </span>
              </div>
              <button
                type="button"
                onClick={requestWebNotificationPermission}
                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition-colors shrink-0"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications Scrollable List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800/80">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 text-center px-4 space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-navy-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </div>
                <p className="text-[11px] text-slate-400">
                  Live alerts for duty punches, assignments, and approvals will appear here instantly.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const { icon: IconComponent, bg } = getNotificationIcon(n.type);
                const isUnread = !n.read;

                return (
                  <div
                    key={n.id}
                    className={`relative group flex items-start gap-3 p-3 transition-colors ${
                      isUnread
                        ? 'bg-blue-50/40 dark:bg-navy-800/40 hover:bg-blue-50/70 dark:hover:bg-navy-800/70'
                        : 'hover:bg-slate-50 dark:hover:bg-navy-800/40'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${bg}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs ${
                            isUnread
                              ? 'font-extrabold text-slate-900 dark:text-white'
                              : 'font-semibold text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {n.title}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                        <span>{formatRelativeTime(n.createdAt)}</span>
                        {n.link && (
                          <>
                            <span>•</span>
                            <Link
                              to={n.link}
                              onClick={() => handleNotificationClick(n)}
                              className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>View details</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-all absolute right-2.5 top-2.5"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
