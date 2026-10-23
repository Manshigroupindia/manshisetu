import React, { useState } from 'react';
import {
  BellRing,
  Calendar,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Paperclip,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Users2,
  Building2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Notice } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';

export const StaffNoticesPage: React.FC = () => {
  const { currentStaff, notices } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const myEmployeeId = currentStaff?.employeeId;
  const todayStr = getTodayDateString();

  // Filter only published notices that are company-wide or targeted to this employee, and not expired!
  const visibleNotices = notices.filter((n) => {
    // Must be published
    if (n.status !== 'published') return false;

    // Check expiry
    if (n.expiryDate && n.expiryDate < todayStr) return false;

    // Target audience filter
    if (n.targetAudience === 'all') return true;
    if (n.targetAudience === 'specific' && n.targetStaffIds?.includes(myEmployeeId || '')) {
      return true;
    }

    return false;
  });

  const categories = ['all', ...Array.from(new Set(visibleNotices.map((n) => n.category)))];

  const filteredNotices = visibleNotices
    .filter((n) => {
      if (categoryFilter === 'all') return true;
      return n.category === categoryFilter;
    })
    .filter((n) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <BellRing className="w-4 h-4" />
            <span>Corporate Communications</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Official Notice Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Company-wide updates, policy circulars, and private notices for {currentStaff?.fullName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {visibleNotices.length} Active Notices
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars by subject, keyword, or category..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNotices.map((notice) => {
          const isTargetedToMe =
            notice.targetAudience === 'specific' &&
            notice.targetStaffIds?.includes(myEmployeeId || '');

          return (
            <div
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      notice.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        : notice.priority === 'high'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                    }`}
                  >
                    {notice.priority}
                  </span>

                  <span className="text-[10px] font-mono text-slate-400">
                    Published: {notice.publishDate}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {isTargetedToMe && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                        Assigned To You
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {notice.category}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {notice.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                    {notice.content}
                  </p>
                </div>
              </div>

              {/* Notice Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {notice.expiryDate ? `Expires: ${notice.expiryDate}` : 'Permanent Circular'}
                </span>

                <span className="text-blue-600 dark:text-blue-400 text-xs font-bold group-hover:underline">
                  Read Notice →
                </span>
              </div>
            </div>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-400 space-y-2">
            <BellRing className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              No notices found
            </h4>
            <p className="text-xs">There are no active notices matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Notice Detail Reader Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedNotice(null)}
          />

          <div className="relative w-full max-w-xl bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Official Notice Circular
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedNotice.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 uppercase">
                  {selectedNotice.category}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 uppercase">
                  Priority: {selectedNotice.priority}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Published: {selectedNotice.publishDate}
                </span>
                {selectedNotice.expiryDate && (
                  <span className="text-xs text-slate-400 font-mono">
                    Valid till: {selectedNotice.expiryDate}
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedNotice.content}
              </div>

              {selectedNotice.attachmentName && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Attached Document
                  </span>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200/80 dark:border-navy-700/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-semibold">{selectedNotice.attachmentName}</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">
                      Download
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex justify-end">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close Circular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
