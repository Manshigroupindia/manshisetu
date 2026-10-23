import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  Paperclip,
  User,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkAssignment, TaskPriority, TaskStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { getTodayDateString } from '../utils/dateUtils';
import { EmptyState } from '../components/common/EmptyState';

export const WorkManagementPage: React.FC = () => {
  const { work, staff, addWork, updateWork, deleteWork } = useApp();

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active Selected Task
  const [activeTask, setActiveTask] = useState<WorkAssignment | null>(null);

  // Form State
  const [formStaffId, setFormStaffId] = useState(staff[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formAssignedDate, setFormAssignedDate] = useState(getTodayDateString());
  const [formDeadlineDate, setFormDeadlineDate] = useState(getTodayDateString());
  const [formDeadlineTime, setFormDeadlineTime] = useState('18:00');
  const [formStatus, setFormStatus] = useState<TaskStatus>('pending');
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [formAdminNotes, setFormAdminNotes] = useState('');

  // Metrics
  const totalTasks = work.length;
  const completedTasks = work.filter((w) => w.status === 'completed').length;
  const inProgressTasks = work.filter((w) => w.status === 'in_progress').length;
  const pendingTasks = work.filter((w) => w.status === 'pending').length;
  const overdueTasks = work.filter((w) => w.status === 'overdue').length;
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtered List
  const filteredWork = useMemo(() => {
    return work.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStaff =
        selectedStaffFilter === 'all' || task.staffId === selectedStaffFilter;

      const matchesPriority =
        selectedPriorityFilter === 'all' || task.priority === selectedPriorityFilter;

      const matchesStatus =
        selectedStatusFilter === 'all' || task.status === selectedStatusFilter;

      return matchesSearch && matchesStaff && matchesPriority && matchesStatus;
    });
  }, [work, searchTerm, selectedStaffFilter, selectedPriorityFilter, selectedStatusFilter]);

  // Open Create Form
  const handleOpenCreate = () => {
    setFormStaffId(staff[0]?.id || '');
    setFormTitle('');
    setFormDescription('');
    setFormPriority('medium');
    setFormAssignedDate(getTodayDateString());
    setFormDeadlineDate(getTodayDateString());
    setFormDeadlineTime('18:00');
    setFormStatus('pending');
    setFormAttachmentName('');
    setFormAdminNotes('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (task: WorkAssignment) => {
    setActiveTask(task);
    setFormStaffId(task.staffId);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormPriority(task.priority);
    setFormAssignedDate(task.assignedDate);
    setFormDeadlineDate(task.deadlineDate);
    setFormDeadlineTime(task.deadlineTime);
    setFormStatus(task.status);
    setFormAttachmentName(task.attachments?.[0] || '');
    setFormAdminNotes(task.adminNotes || '');
    setIsEditModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const selectedStaffMember = staff.find((s) => s.id === formStaffId);

    const newTask: WorkAssignment = {
      id: `work-${Date.now()}`,
      staffId: formStaffId,
      staffName: selectedStaffMember?.fullName || 'Assigned Staff',
      title: formTitle.trim(),
      description: formDescription.trim(),
      priority: formPriority,
      assignedDate: formAssignedDate,
      deadlineDate: formDeadlineDate,
      deadlineTime: formDeadlineTime,
      status: formStatus,
      attachments: formAttachmentName.trim() ? [formAttachmentName.trim()] : [],
      adminNotes: formAdminNotes.trim(),
    };

    addWork(newTask);
    setIsCreateModalOpen(false);
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !formTitle.trim()) return;
    const selectedStaffMember = staff.find((s) => s.id === formStaffId);

    const updated: WorkAssignment = {
      ...activeTask,
      staffId: formStaffId,
      staffName: selectedStaffMember?.fullName || activeTask.staffName,
      title: formTitle.trim(),
      description: formDescription.trim(),
      priority: formPriority,
      assignedDate: formAssignedDate,
      deadlineDate: formDeadlineDate,
      deadlineTime: formDeadlineTime,
      status: formStatus,
      attachments: formAttachmentName.trim() ? [formAttachmentName.trim()] : [],
      adminNotes: formAdminNotes.trim(),
      completedAt:
        formStatus === 'completed' && activeTask.status !== 'completed'
          ? new Date().toISOString()
          : activeTask.completedAt,
    };

    updateWork(updated);
    setIsEditModalOpen(false);
  };

  // Direct Status Update from quick select
  const handleQuickStatusChange = (task: WorkAssignment, newStatus: TaskStatus) => {
    updateWork({
      ...task,
      status: newStatus,
      completedAt:
        newStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Work & Task Management
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
              {totalTasks} Total Assignments
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign deliverables, track staff progress, and manage operational deadlines.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Assign New Work
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Pending</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {pendingTasks}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting start</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">In Progress</div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {inProgressTasks}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active tasks</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Completed</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {completedTasks}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Delivered</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Overdue</div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {overdueTasks}
          </div>
          <div className="text-[11px] text-rose-500 font-semibold mt-0.5">Deadline passed</div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Completion</span>
            <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-navy-800 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">Monthly progress rate</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, staff member, or deliverable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Staff Filter */}
          <select
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Staff Members</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Task List / Grid */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/40 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Task Title & Details</th>
                <th className="px-5 py-3.5">Assigned Staff</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Deadlines</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {filteredWork.map((task) => {
                const priorityVariants = {
                  urgent: 'rose' as const,
                  high: 'amber' as const,
                  medium: 'blue' as const,
                  low: 'slate' as const,
                };
                const statusVariants = {
                  completed: 'emerald' as const,
                  in_progress: 'blue' as const,
                  pending: 'amber' as const,
                  overdue: 'rose' as const,
                };

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {task.title}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-medium">
                          <Paperclip className="w-3 h-3" />
                          <span>{task.attachments[0]}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[11px]">
                          {task.staffName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {task.staffName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Assigned {task.assignedDate}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge variant={priorityVariants[task.priority]} size="sm">
                        {task.priority.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{task.deadlineDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{task.deadlineTime}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleQuickStatusChange(task, e.target.value as TaskStatus)
                        }
                        className="text-xs font-bold rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 px-2.5 py-1 text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setActiveTask(task);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Edit Assignment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveTask(task);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredWork.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <EmptyState
                      icon={Briefcase}
                      title="No Work Assignments"
                      description={
                        work.length === 0
                          ? "No tasks or duties have been assigned yet. Create the first task assignment to get started."
                          : "No tasks match your selected filter criteria."
                      }
                      primaryActionLabel={work.length === 0 ? "Assign First Task" : undefined}
                      onPrimaryAction={work.length === 0 ? handleOpenCreate : undefined}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Assign New Work Task"
        subtitle="Mandate operational deliverables to an employee"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Assigned Staff Member *
              </label>
              <select
                value={formStaffId}
                onChange={(e) => setFormStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-semibold"
              >
                {staff.length === 0 ? (
                  <option value="" disabled>No staff available</option>
                ) : (
                  staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.designation} - {s.department})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Priority Level *
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-semibold"
              >
                <option value="low">Low (Standard Office Routine)</option>
                <option value="medium">Medium (Standard Priority)</option>
                <option value="high">High (Time Sensitive)</option>
                <option value="urgent">Urgent (Statutory / Immediate)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Statutory TDS Return Verification & Form 26AS Reconciliation"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Task Description & Deliverables *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Outline deliverables, references, files required, and specific steps..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Assignment Date
              </label>
              <input
                type="date"
                required
                value={formAssignedDate}
                onChange={(e) => setFormAssignedDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Deadline Date
              </label>
              <input
                type="date"
                required
                value={formDeadlineDate}
                onChange={(e) => setFormDeadlineDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Deadline Time
              </label>
              <input
                type="time"
                required
                value={formDeadlineTime}
                onChange={(e) => setFormDeadlineTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Initial Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-semibold"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Attachment File / Document Name
              </label>
              <input
                type="text"
                placeholder="e.g. Reconciliation_Template.xlsx"
                value={formAttachmentName}
                onChange={(e) => setFormAttachmentName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Internal Admin Notes
            </label>
            <input
              type="text"
              placeholder="Private guidance or verification requirements..."
              value={formAdminNotes}
              onChange={(e) => setFormAdminNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Assign Work
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Work Assignment"
        subtitle={`Modify assignment record #${activeTask?.id}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Assigned Staff Member
              </label>
              <select
                value={formStaffId}
                onChange={(e) => setFormStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-semibold"
              >
                {staff.length === 0 ? (
                  <option value="" disabled>No staff available</option>
                ) : (
                  staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.designation})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Priority Level
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-semibold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Assigned Date
              </label>
              <input
                type="date"
                required
                value={formAssignedDate}
                onChange={(e) => setFormAssignedDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Deadline Date
              </label>
              <input
                type="date"
                required
                value={formDeadlineDate}
                onChange={(e) => setFormDeadlineDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Deadline Time
              </label>
              <input
                type="time"
                required
                value={formDeadlineTime}
                onChange={(e) => setFormDeadlineTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-semibold"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Attachments
              </label>
              <input
                type="text"
                value={formAttachmentName}
                onChange={(e) => setFormAttachmentName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Task Modal */}
      {activeTask && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Work Assignment Details"
          subtitle={`Reference ID: ${activeTask.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Current Status
                </span>
                <div className="mt-1">
                  <Badge variant="blue" size="md" dot>
                    {activeTask.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Priority
                </span>
                <div className="mt-1">
                  <Badge variant="rose" size="md">
                    {activeTask.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-base text-slate-900 dark:text-white">
                {activeTask.title}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-2 text-sm bg-slate-50 dark:bg-navy-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-navy-700/60">
                {activeTask.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-slate-200/50 dark:border-navy-700/50">
                <div className="text-slate-400 font-semibold">Assigned Staff</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {activeTask.staffName}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-slate-200/50 dark:border-navy-700/50">
                <div className="text-slate-400 font-semibold">Submission Deadline</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {activeTask.deadlineDate} at {activeTask.deadlineTime}
                </div>
              </div>
            </div>

            {activeTask.attachments && activeTask.attachments.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-slate-200/50 dark:border-navy-700/50">
                <div className="text-slate-400 font-semibold mb-1">Attached Files</div>
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold">
                  <Paperclip className="w-4 h-4" />
                  <span>{activeTask.attachments[0]}</span>
                </div>
              </div>
            )}

            {activeTask.adminNotes && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300">
                <span className="font-bold">Admin Directive: </span>
                {activeTask.adminNotes}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEdit(activeTask);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Edit Task
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (activeTask) deleteWork(activeTask.id);
        }}
        title="Delete Task Assignment"
        message={`Are you sure you want to delete "${activeTask?.title}"? This task assignment will be permanently removed.`}
        confirmText="Delete Task"
        isDestructive={true}
      />
    </div>
  );
};
