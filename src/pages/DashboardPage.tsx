import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Briefcase,
  CheckCircle,
  Receipt,
  IndianRupee,
  Clock,
  Calendar,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Pin,
  PartyPopper,
  Building,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DigitalClock } from '../components/common/DigitalClock';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { calculateSalaryForStaff, formatINR } from '../utils/salaryCalculator';
import { getTodayDateString, getCurrentMonthString } from '../utils/dateUtils';
import { EmptyState } from '../components/common/EmptyState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    staff,
    work,
    attendance,
    expenses,
    advances,
    salaries,
    notices,
    holidays,
    events,
    settings,
    addWork,
    addStaff,
    addNotice,
    addExpense,
  } = useApp();

  // Quick Action Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Quick form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStaffId, setNewTaskStaffId] = useState(staff[0]?.id || '');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState(getTodayDateString());
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<'General' | 'Policy' | 'Urgent' | 'Event' | 'Holiday' | 'Maintenance'>('General');
  const [newNoticePriority, setNewNoticePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newNoticeContent, setNewNoticeContent] = useState('');

  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseStaffId, setNewExpenseStaffId] = useState(staff[0]?.id || '');
  const [newExpenseCategory, setNewExpenseCategory] = useState<'Travel' | 'Food' | 'Office Supplies' | 'Client Entertainment' | 'Fuel' | 'Utilities' | 'Maintenance' | 'Other'>('Travel');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');

  // Determine Greeting based on time
  const currentHour = new Date().getHours();
  let greeting = 'Good Morning';
  if (currentHour >= 12 && currentHour < 17) greeting = 'Good Afternoon';
  else if (currentHour >= 17) greeting = 'Good Evening';

  // Dynamic active dates
  const todayDateStr = getTodayDateString();
  const currentMonthStr = getCurrentMonthString();

  // Today's attendance calculation
  const todayAttendance = attendance.filter((a) => a.date === todayDateStr);
  const presentTodayCount = todayAttendance.filter((a) => a.status === 'present').length;
  const absentTodayCount = todayAttendance.filter(
    (a) => a.status === 'absent' || a.status === 'unpaid_leave'
  ).length;

  // Work metrics
  const pendingWork = work.filter((w) => w.status === 'pending' || w.status === 'in_progress');
  const completedWorkThisMonth = work.filter((w) => w.status === 'completed');

  // Expense metrics
  const pendingExpenses = expenses.filter((e) => e.approvalStatus === 'pending');
  const totalPendingExpenseAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Salary metrics for current month
  let totalMonthlySalaryPayable = 0;
  let pendingSalaryPaymentsCount = 0;

  staff.forEach((s) => {
    if (s.status === 'active') {
      const existingPaid = salaries.find((sal) => sal.staffId === s.id && sal.month === currentMonthStr);
      const calc = calculateSalaryForStaff(s, currentMonthStr, attendance, holidays, advances, existingPaid);
      totalMonthlySalaryPayable += calc.finalPayable;
      if (!existingPaid || existingPaid.paymentStatus !== 'paid') {
        pendingSalaryPaymentsCount++;
      }
    }
  });

  // Upcoming holidays & events
  const upcomingHolidays = holidays.slice(0, 3);
  const upcomingEvents = events.slice(0, 3);

  // Published Notices
  const activeNotices = notices.filter((n) => n.status === 'published').slice(0, 4);

  // Chart data 1: Attendance Distribution
  const attendanceChartData = [
    { name: 'Present', count: presentTodayCount, fill: '#10b981' },
    { name: 'Absent / Unpaid', count: absentTodayCount, fill: '#ef4444' },
    { name: 'On Leave', count: todayAttendance.filter((a) => a.status === 'paid_leave').length, fill: '#f59e0b' },
    { name: 'Rest of Staff', count: Math.max(0, staff.length - todayAttendance.length), fill: '#94a3b8' },
  ];

  // Chart data 2: Expense by Category
  const expenseCategoriesMap: Record<string, number> = {};
  expenses.forEach((e) => {
    expenseCategoriesMap[e.category] = (expenseCategoriesMap[e.category] || 0) + e.amount;
  });
  const expenseChartData = Object.entries(expenseCategoriesMap).map(([category, amount]) => ({
    name: category,
    amount,
  }));

  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Handle Quick Actions submit
  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const assignedStaff = staff.find((s) => s.id === newTaskStaffId);
    addWork({
      id: `work-${Date.now()}`,
      staffId: newTaskStaffId,
      staffName: assignedStaff?.fullName || 'Staff Member',
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || 'Assigned via Quick Action',
      priority: newTaskPriority,
      assignedDate: todayDateStr,
      deadlineDate: newTaskDeadline,
      deadlineTime: '18:00',
      status: 'pending',
    });
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsTaskModalOpen(false);
  };

  const handleQuickNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;
    addNotice({
      id: `not-${Date.now()}`,
      title: newNoticeTitle.trim(),
      content: newNoticeContent.trim(),
      category: newNoticeCategory,
      publishDate: todayDateStr,
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      priority: newNoticePriority,
      targetAudience: 'all',
      isPinned: false,
      status: 'published',
      createdBy: settings.adminName,
    });
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setIsNoticeModalOpen(false);
  };

  const handleQuickExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseTitle.trim() || !newExpenseAmount) return;
    const expStaff = staff.find((s) => s.id === newExpenseStaffId);
    addExpense({
      id: `exp-${Date.now()}`,
      staffId: newExpenseStaffId,
      staffName: expStaff?.fullName || 'Staff Member',
      title: newExpenseTitle.trim(),
      category: newExpenseCategory,
      description: newExpenseDesc.trim() || 'Submitted via Quick Action',
      amount: parseFloat(newExpenseAmount),
      expenseDate: todayDateStr,
      submissionDate: todayDateStr,
      approvalStatus: 'pending',
      paymentStatus: 'unpaid',
    });
    setNewExpenseTitle('');
    setNewExpenseAmount('');
    setNewExpenseDesc('');
    setIsExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Greeting, Live Clock & Location */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200/80 dark:border-navy-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Executive Administration Terminal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {greeting}, {settings.adminName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>{settings.adminDesignation}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              {settings.officeLocation}
            </span>
          </p>
        </div>

        <div className="shrink-0">
          <DigitalClock />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          Assign Work
        </button>

        <button
          onClick={() => navigate('/admin/staff')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all"
        >
          <Users className="w-4 h-4 text-blue-600" />
          Add / Manage Staff
        </button>

        <button
          onClick={() => setIsNoticeModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          Create Notice
        </button>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all"
        >
          <Receipt className="w-4 h-4 text-amber-600" />
          Add Expense
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
              Total Staff
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {staff.length}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {staff.filter((s) => s.status === 'active').length} Active Employees
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
              Present Today
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {presentTodayCount}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">
              {absentTodayCount} Absent / On Leave
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Work */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
              Pending Work
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {pendingWork.length}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">
              {completedWorkThisMonth.length} Completed this month
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Salary Payout */}
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
              Salary Payable
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400">
              {formatINR(totalMonthlySalaryPayable)}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">
              {pendingSalaryPaymentsCount} staff awaiting payout
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section: Attendance & Expenses Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Pie Chart */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Today's Attendance Status
              </h2>
              <p className="text-xs text-slate-400">
                Live staff reporting snapshot for {todayDateStr}
              </p>
            </div>
            <Link
              to="/admin/attendance"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Full Register <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64">
            {staff.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  icon={UserCheck}
                  title="No Staff Enrolled"
                  description="Enrolled staff members will dynamically populate the attendance distribution chart."
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {attendanceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Category Bar Chart */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Expenses by Category
              </h2>
              <p className="text-xs text-slate-400">
                Pending & approved reimbursements breakdown (₹{totalPendingExpenseAmount} pending approval)
              </p>
            </div>
            <Link
              to="/admin/expenses"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View Claims <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64">
            {expenseChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  icon={Receipt}
                  title="No Expenses Logged"
                  description="Company expenditure by category will dynamically display here once claims are submitted."
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {expenseChartData.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Mid-Row: Today's Work / Activity & Notice Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Work Assignments (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-600" />
                  Today's Work & Priority Activity
                </h2>
                <p className="text-xs text-slate-400">
                  Critical operational tasks assigned across active staff members
                </p>
              </div>
              <Link
                to="/admin/work"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                All Tasks ({work.length}) <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {work.length === 0 ? (
              <div className="py-6">
                <EmptyState
                  icon={Briefcase}
                  title="No Active Tasks"
                  description="No operational duties or assignments pending."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-800">
                {work.slice(0, 5).map((t) => {
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
                    <div
                      key={t.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {t.title}
                          </span>
                          <Badge variant={priorityVariants[t.priority]} size="sm">
                            {t.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          Assigned: <span className="font-semibold text-slate-700 dark:text-slate-300">{t.staffName}</span> • Due: {t.deadlineDate} at {t.deadlineTime}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <Badge variant={statusVariants[t.status]} size="sm" dot>
                          {t.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-800 text-right">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
            >
              + Assign New Task Assignment
            </button>
          </div>
        </div>

        {/* Notice Board Preview (1 Col) */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-brand-600 rotate-45" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Notice Board
                </h2>
              </div>
              <Link
                to="/admin/notices"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeNotices.length === 0 ? (
              <div className="py-6">
                <EmptyState
                  icon={Pin}
                  title="No Active Notices"
                  description="No announcements or circulars on the board."
                />
              </div>
            ) : (
              <div className="space-y-3">
                {activeNotices.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/60"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {n.title}
                      </span>
                      {n.isPinned && (
                        <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded">
                          PINNED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2 font-medium">
                      Published {n.publishDate} • {n.category}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-3 border-t border-slate-100 dark:border-navy-800 text-center">
            <button
              onClick={() => setIsNoticeModalOpen(true)}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              + Post New Company Notice
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Company Profile Card + Holidays & Events */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compact Company Profile Card (Editable via Settings) */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Company Profile
              </span>
              <Link
                to="/admin/settings"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                Edit in Settings <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                  {settings.companyName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {settings.brandTagline}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{settings.officialEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{settings.contactNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={settings.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 dark:text-brand-400 hover:underline truncate"
                >
                  {settings.website}
                </a>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-slate-100 dark:border-navy-800">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {settings.officeAddress}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 text-[11px] text-slate-400">
            Base Salary Policy: <span className="font-bold text-slate-700 dark:text-slate-300">30-Day Basis</span> • Weekly Off: <span className="font-bold text-slate-700 dark:text-slate-300">Sunday</span>
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Upcoming Holidays
                </h2>
              </div>
              <Link
                to="/admin/holidays-events"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Calendar <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingHolidays.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No upcoming company holidays.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/60"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {h.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {h.startDate} • {h.description}
                      </div>
                    </div>
                    <Badge variant="purple" size="sm">
                      PAID HOLIDAY
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-navy-800 text-right">
            <Link
              to="/admin/holidays-events"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Manage Company Calendar →
            </Link>
          </div>
        </div>

        {/* Upcoming Office Events */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Office Events
                </h2>
              </div>
              <Link
                to="/admin/holidays-events"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No office events scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/60"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {evt.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {evt.date} • {evt.startTime} - {evt.endTime}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1 truncate">
                      Venue: {evt.venue}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-navy-800 text-right">
            <Link
              to="/admin/holidays-events"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Schedule New Event →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Modal: Assign Work */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Assign Work to Staff Member"
        subtitle="Create an official task delegation record"
      >
        <form onSubmit={handleQuickTaskSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Select Staff Member *
            </label>
            <select
              value={newTaskStaffId}
              onChange={(e) => setNewTaskStaffId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm font-medium"
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
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Statutory Compliance Verification"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Priority
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm font-medium"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Deadline Date
              </label>
              <input
                type="date"
                required
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Description & Specific Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Detail out deliverables, required document formats, and submission standards..."
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Assign Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Action Modal: Create Notice */}
      <Modal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        title="Create Company Notice"
        subtitle="Publish a formal notice to the staff board"
      >
        <form onSubmit={handleQuickNoticeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Revised Policy on Official Expense Reimbursements"
              value={newNoticeTitle}
              onChange={(e) => setNewNoticeTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Category
              </label>
              <select
                value={newNoticeCategory}
                onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm font-medium"
              >
                <option value="General">General</option>
                <option value="Policy">Policy</option>
                <option value="Urgent">Urgent</option>
                <option value="Event">Event</option>
                <option value="Holiday">Holiday</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Priority
              </label>
              <select
                value={newNoticePriority}
                onChange={(e) => setNewNoticePriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm font-medium"
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
              Notice Content *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Write detailed circular description..."
              value={newNoticeContent}
              onChange={(e) => setNewNoticeContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Publish Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Action Modal: Add Expense */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Submit Expense Claim"
        subtitle="Log employee reimbursement or office expenditure"
      >
        <form onSubmit={handleQuickExpenseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Employee *
              </label>
              <select
                value={newExpenseStaffId}
                onChange={(e) => setNewExpenseStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm font-medium"
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
                Category
              </label>
              <select
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm font-medium"
              >
                <option value="Travel">Travel</option>
                <option value="Food">Food</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Client Entertainment">Client Entertainment</option>
                <option value="Fuel">Fuel</option>
                <option value="Utilities">Utilities</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Expense Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Client Site Visit Cab Fare"
                value={newExpenseTitle}
                onChange={(e) => setNewExpenseTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Amount (INR ₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="e.g. 1500"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Description / Justification
            </label>
            <textarea
              rows={3}
              placeholder="Provide reason for expense and merchant info..."
              value={newExpenseDesc}
              onChange={(e) => setNewExpenseDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Submit Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
