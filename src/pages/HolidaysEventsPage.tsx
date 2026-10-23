import React, { useState } from 'react';
import {
  CalendarDays,
  PartyPopper,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Palmtree,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Holiday, OfficeEvent } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { getTodayDateString } from '../utils/dateUtils';
import { EmptyState } from '../components/common/EmptyState';

export const HolidaysEventsPage: React.FC = () => {
  const {
    holidays,
    events,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'holidays' | 'events'>('holidays');

  // Holiday Modals & Form
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');
  const [holidayStartDate, setHolidayStartDate] = useState(getTodayDateString());
  const [holidayEndDate, setHolidayEndDate] = useState(getTodayDateString());
  const [holidayIsPaid, setHolidayIsPaid] = useState(true);
  const [holidayType, setHolidayType] = useState<'gazetted' | 'company' | 'festival'>('gazetted');

  // Event Modals & Form
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OfficeEvent | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(getTodayDateString());
  const [eventStartTime, setEventStartTime] = useState('11:00');
  const [eventEndTime, setEventEndTime] = useState('12:30');
  const [eventVenue, setEventVenue] = useState('Main Conference Room');
  const [eventAudience, setEventAudience] = useState('All Staff Members');
  const [eventStatus, setEventStatus] = useState<'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('upcoming');

  // Delete Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'holiday' | 'event'; id: string; name: string } | null>(null);

  // Open Create Holiday
  const handleOpenAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayName('');
    setHolidayDesc('');
    setHolidayStartDate(getTodayDateString());
    setHolidayEndDate(getTodayDateString());
    setHolidayIsPaid(true);
    setHolidayType('festival');
    setIsHolidayModalOpen(true);
  };

  // Open Edit Holiday
  const handleOpenEditHoliday = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayName(h.name);
    setHolidayDesc(h.description);
    setHolidayStartDate(h.startDate);
    setHolidayEndDate(h.endDate);
    setHolidayIsPaid(h.isPaid);
    setHolidayType(h.type);
    setIsHolidayModalOpen(true);
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim()) return;

    if (editingHoliday) {
      updateHoliday({
        ...editingHoliday,
        name: holidayName.trim(),
        description: holidayDesc.trim(),
        startDate: holidayStartDate,
        endDate: holidayEndDate,
        isPaid: holidayIsPaid,
        type: holidayType,
      });
    } else {
      addHoliday({
        id: `hol-${Date.now()}`,
        name: holidayName.trim(),
        description: holidayDesc.trim(),
        startDate: holidayStartDate,
        endDate: holidayEndDate,
        isPaid: holidayIsPaid,
        type: holidayType,
      });
    }
    setIsHolidayModalOpen(false);
  };

  // Open Create Event
  const handleOpenAddEvent = () => {
    setEditingEvent(null);
    setEventTitle('');
    setEventDesc('');
    setEventDate(getTodayDateString());
    setEventStartTime('14:00');
    setEventEndTime('15:30');
    setEventVenue('Auditorium / Hybrid Link');
    setEventAudience('All Staff');
    setEventStatus('upcoming');
    setIsEventModalOpen(true);
  };

  // Open Edit Event
  const handleOpenEditEvent = (evt: OfficeEvent) => {
    setEditingEvent(evt);
    setEventTitle(evt.title);
    setEventDesc(evt.description);
    setEventDate(evt.date);
    setEventStartTime(evt.startTime);
    setEventEndTime(evt.endTime);
    setEventVenue(evt.venue);
    setEventAudience(evt.targetAudience);
    setEventStatus(evt.status);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    if (editingEvent) {
      updateEvent({
        ...editingEvent,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        venue: eventVenue.trim(),
        targetAudience: eventAudience.trim(),
        status: eventStatus,
      });
    } else {
      addEvent({
        id: `evt-${Date.now()}`,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        venue: eventVenue.trim(),
        targetAudience: eventAudience.trim(),
        status: eventStatus,
      });
    }
    setIsEventModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'holiday') {
      deleteHoliday(itemToDelete.id);
    } else {
      deleteEvent(itemToDelete.id);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Holidays & Office Events
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
              Corporate Schedule
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official holidays integrated into 30-day payroll calculations and enterprise events calendar.
          </p>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-200/80 dark:bg-navy-800 p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => setActiveTab('holidays')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'holidays'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Company Holidays ({holidays.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'events'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Office Events ({events.length})
            </button>
          </div>

          {activeTab === 'holidays' ? (
            <button
              onClick={handleOpenAddHoliday}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Holiday
            </button>
          ) : (
            <button
              onClick={handleOpenAddEvent}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              Schedule Event
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: HOLIDAYS */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          {holidays.length === 0 ? (
            <div className="bg-white dark:bg-navy-900 rounded-3xl p-8 border border-slate-200 dark:border-navy-800 shadow-xs">
              <EmptyState
                icon={Palmtree}
                title="No Holidays Scheduled"
                description="No upcoming or company holidays registered in the holiday calendar."
                primaryActionLabel="Add Holiday"
                onPrimaryAction={handleOpenAddHoliday}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidays.map((holiday) => (
              <div
                key={holiday.id}
                className="bg-white dark:bg-navy-900 p-5 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400">
                      {holiday.startDate} {holiday.startDate !== holiday.endDate ? `to ${holiday.endDate}` : ''}
                    </span>
                    <Badge variant="purple" size="sm">
                      {holiday.isPaid ? 'PAID HOLIDAY' : 'UNPAID'}
                    </Badge>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
                    {holiday.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {holiday.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="capitalize font-semibold text-slate-600 dark:text-slate-300">
                    Type: {holiday.type}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditHoliday(holiday)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete({ type: 'holiday', id: holiday.id, name: holiday.name });
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* TAB 2: OFFICE EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="bg-white dark:bg-navy-900 rounded-3xl p-8 border border-slate-200 dark:border-navy-800 shadow-xs">
              <EmptyState
                icon={CalendarDays}
                title="No Office Events Scheduled"
                description="No upcoming corporate events, meetings, or celebrations scheduled."
                primaryActionLabel="Schedule Event"
                onPrimaryAction={handleOpenAddEvent}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((evt) => {
              const statusVariants = {
                upcoming: 'blue' as const,
                ongoing: 'emerald' as const,
                completed: 'slate' as const,
                cancelled: 'rose' as const,
              };

              return (
                <div
                  key={evt.id}
                  className="bg-white dark:bg-navy-900 p-5 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs hover:border-blue-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {evt.date}
                      </span>
                      <Badge variant={statusVariants[evt.status]} size="sm" dot>
                        {evt.status.toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      {evt.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 py-2 border-t border-slate-100 dark:border-navy-800">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{evt.startTime} – {evt.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.targetAudience}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEditEvent(evt)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete({ type: 'event', id: evt.id, name: evt.title });
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ADD / EDIT HOLIDAY MODAL */}
      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title={editingHoliday ? 'Edit Company Holiday' : 'Add Company Holiday'}
        subtitle="Holidays are paid non-working days for eligible staff"
      >
        <form onSubmit={handleSaveHoliday} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Holiday Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Diwali (Deepawali)"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={holidayStartDate}
                onChange={(e) => setHolidayStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={holidayEndDate}
                onChange={(e) => setHolidayEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Holiday Type
              </label>
              <select
                value={holidayType}
                onChange={(e) => setHolidayType(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
              >
                <option value="gazetted">Gazetted National Holiday</option>
                <option value="festival">Festival Holiday</option>
                <option value="company">Company Specific Holiday</option>
              </select>
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={holidayIsPaid}
                  onChange={(e) => setHolidayIsPaid(e.target.checked)}
                  className="rounded text-brand-600 w-4 h-4"
                />
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Paid Company Holiday (No deduction)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Description / Circular Context
            </label>
            <input
              type="text"
              placeholder="e.g. Festival of Lights celebration office closure"
              value={holidayDesc}
              onChange={(e) => setHolidayDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsHolidayModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Save Holiday
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD / EDIT EVENT MODAL */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? 'Edit Office Event' : 'Schedule Office Event'}
        subtitle="Coordinate executive reviews, drills, and team gatherings"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Annual Strategic Growth Conference 2026"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Venue or Google Meet Link *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Conference Room B or https://meet.google.com/..."
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Target Audience
              </label>
              <input
                type="text"
                value={eventAudience}
                onChange={(e) => setEventAudience(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Event Description & Agenda
            </label>
            <textarea
              rows={3}
              placeholder="Outline schedule, agenda items, speakers and required preparations..."
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
            >
              Save Event
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${itemToDelete?.type === 'holiday' ? 'Holiday' : 'Event'}`}
        message={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};
