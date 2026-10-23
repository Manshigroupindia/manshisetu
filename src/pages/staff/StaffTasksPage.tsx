import React, { useState } from 'react';
import {
  Briefcase,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Send,
  Check,
  Search,
  Filter,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkAssignment, TaskStatus } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';

export const StaffTasksPage: React.FC = () => {
  const { currentStaff, work, updateWorkAssignmentStaffNotes, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<WorkAssignment | null>(null);

  // Note form state
  const [progressNotes, setProgressNotes] = useState('');
  const [completedNotes, setCompletedNotes] = useState('');
  const [statusToSet, setStatusToSet] = useState<TaskStatus | ''>('');

  const myEmployeeId = currentStaff?.employeeId;

  // Filter tasks assigned to this employee only!
  const myTasks = work.filter((w) => w.staffId === myEmployeeId);

  const filteredTasks = myTasks
    .filter((w) => {
      if (activeTab === 'active') {
        return w.status === 'pending' || w.status === 'in_progress' || w.status === 'overdue';
      }
      return w.status === 'completed';
    })
    .filter((w) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.priority.toLowerCase().includes(q)
      );
    });

  const handleOpenTask = (task: WorkAssignment) => {
    setSelectedTask(task);
    setProgressNotes(task.staffProgressNotes || '');
    setCompletedNotes(task.staffCompletedNotes || '');
    setStatusToSet(task.status);
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const newStatus = (statusToSet as TaskStatus) || selectedTask.status;
    updateWorkAssignmentStaffNotes(
      selectedTask.id,
      newStatus,
      progressNotes,
      completedNotes
    );

    setSelectedTask(null);
  };

  const todayStr = getTodayDateString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Task Assignments</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            My Assigned Tasks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deliverables and assignments specifically delegated to {currentStaff?.fullName} ({myEmployeeId})
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-white dark:bg-navy-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Active Tasks (
            {myTasks.filter((t) => t.status !== 'completed').length}
            )
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-navy-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Completed History (
            {myTasks.filter((t) => t.status === 'completed').length}
            )
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by task title, description or priority..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.map((task) => {
          const isOverdue = task.deadlineDate < todayStr && task.status !== 'completed';

          return (
            <div
              key={task.id}
              onClick={() => handleOpenTask(task)}
              className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      task.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        : task.priority === 'high'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                    }`}
                  >
                    {task.priority} Priority
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      task.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : task.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : isOverdue
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {isOverdue && task.status !== 'completed' ? 'OVERDUE' : task.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                </div>
              </div>

              {/* Task Meta details */}
              <div className="pt-3 border-t border-slate-100 dark:border-navy-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Assigned: {task.assignedDate}</span>
                  </span>
                  <span
                    className={`flex items-center gap-1 font-bold ${
                      isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {task.deadlineDate}</span>
                  </span>
                </div>

                {task.adminNotes && (
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-800/60 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Admin Note: </span>
                    {task.adminNotes}
                  </div>
                )}

                {task.staffProgressNotes && (
                  <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 text-[11px] text-blue-700 dark:text-blue-300">
                    <span className="font-bold">My Note: </span>
                    {task.staffProgressNotes}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              No tasks found in this view
            </h4>
            <p className="text-xs">
              {activeTab === 'active'
                ? 'Great job! You have no pending tasks right now.'
                : 'No completed tasks recorded yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Task Details & Progress Update Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedTask(null)}
          />

          <div className="relative w-full max-w-xl bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Task Details & Progress
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedTask.title}
                  </h3>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                  selectedTask.priority === 'urgent'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {selectedTask.priority}
              </span>
            </div>

            {/* Read-only specification details */}
            <div className="my-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Task Description
                </label>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Date</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                    {selectedTask.assignedDate}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Deadline</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                    {selectedTask.deadlineDate}
                  </span>
                </div>
              </div>

              {selectedTask.adminNotes && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Administrator Instructions
                  </label>
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                    {selectedTask.adminNotes}
                  </div>
                </div>
              )}
            </div>

            {/* Editable Staff Progress Form */}
            <form onSubmit={handleSaveProgress} className="space-y-4 pt-3 border-t border-slate-100 dark:border-navy-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Update Task Status
                </label>
                <select
                  value={statusToSet}
                  onChange={(e) => setStatusToSet(e.target.value as TaskStatus)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Staff can update status to In Progress or Completed. Tasks cannot be deleted or reassigned.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Progress Note
                </label>
                <textarea
                  rows={2}
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="Describe your current progress, milestones, or roadblocks..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Completion Note (When Finished)
                </label>
                <textarea
                  rows={2}
                  value={completedNotes}
                  onChange={(e) => setCompletedNotes(e.target.value)}
                  placeholder="Summarize deliverables, links or results upon completion..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save Progress & Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
