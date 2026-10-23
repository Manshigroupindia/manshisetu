import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  MapPin,
  Clock,
  Video,
  Calendar,
  Building2,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';

export const StaffHolidaysEventsPage: React.FC = () => {
  const { holidays, events } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'holidays' | 'events'>('all');

  const todayStr = getTodayDateString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>Company Calendar</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Holidays & Office Events
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Official company holiday schedule, team meetups, training sessions, and town halls
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-navy-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Dates ({holidays.length + events.length})
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'holidays'
                ? 'bg-white dark:bg-navy-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Holidays ({holidays.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'events'
                ? 'bg-white dark:bg-navy-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Events ({events.length})
          </button>
        </div>
      </div>

      {/* Grid: Holidays Column & Events Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Official Company Holidays */}
        {(activeTab === 'all' || activeTab === 'holidays') && (
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Official Company Holidays
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paid non-working days for all Manshi Group staff
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-full">
                {holidays.length} Declared
              </span>
            </div>

            <div className="space-y-3">
              {holidays.map((h) => {
                const isPast = h.startDate < todayStr;

                return (
                  <div
                    key={h.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isPast
                        ? 'bg-slate-50/50 dark:bg-navy-950/30 border-slate-200/50 dark:border-navy-800/50 opacity-75'
                        : 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40 hover:border-purple-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 uppercase">
                          {h.type}
                        </span>
                        {isPast && (
                          <span className="text-[10px] text-slate-400 font-medium">Concluded</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {h.name}
                      </h3>
                      {h.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {h.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black font-mono text-purple-700 dark:text-purple-300">
                        {h.startDate}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                        Paid Holiday
                      </div>
                    </div>
                  </div>
                );
              })}
              {holidays.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-navy-800/40 rounded-2xl">
                  No company holidays scheduled.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Column: Office Events, Workshops & Meets */}
        {(activeTab === 'all' || activeTab === 'events') && (
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Office Events & Town Halls
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Team gatherings, reviews, and interactive sessions
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full">
                {events.length} Scheduled
              </span>
            </div>

            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-800/40 hover:border-amber-400/50 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {ev.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{ev.date}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{ev.startTime} - {ev.endTime}</span>
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 uppercase shrink-0">
                      Office Event
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200/50 dark:border-navy-700/50 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{ev.venue}</span>
                    </div>

                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                      Audience: {ev.targetAudience}
                    </span>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-navy-800/40 rounded-2xl">
                  No office events scheduled.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
