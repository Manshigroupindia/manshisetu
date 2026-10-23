import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Clock,
  Eye,
  FileText,
  CreditCard,
  User,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Upload,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory, ExpenseApprovalStatus, ExpensePaymentStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatINR } from '../utils/salaryCalculator';
import { cloudinaryService } from '../services/cloudinaryService';
import { getTodayDateString, getCurrentMonthString } from '../utils/dateUtils';
import { EmptyState } from '../components/common/EmptyState';

export const ExpenseManagementPage: React.FC = () => {
  const { expenses, staff, addExpense, updateExpense, deleteExpense } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isStaffHistoryModalOpen, setIsStaffHistoryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Active Selected Expense
  const [activeExpense, setActiveExpense] = useState<Expense | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'UPI' | 'Cash'>('Bank Transfer');
  const [paymentRefNumber, setPaymentRefNumber] = useState('');

  // Selected staff for history view
  const [historyStaffId, setHistoryStaffId] = useState<string>('');

  // Submit Expense Form
  const [newStaffId, setNewStaffId] = useState(staff[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');

  React.useEffect(() => {
    if (!newStaffId && staff.length > 0) {
      setNewStaffId(staff[0].id);
    }
  }, [staff, newStaffId]);
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('Travel');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(getTodayDateString());
  const [newReceiptUrl, setNewReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAdminReceiptUpload = async (file: File) => {
    try {
      setIsUploadingReceipt(true);
      setUploadProgress(0);
      const res = await cloudinaryService.uploadExpenseReceipt(file, (p) => {
        setUploadProgress(p);
      });
      setNewReceiptUrl(res.secureUrl);
    } catch (err: any) {
      alert(err.message || 'Receipt upload failed');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Metrics Calculation
  const totalSubmittedCount = expenses.length;
  const pendingExpenses = expenses.filter((e) => e.approvalStatus === 'pending');
  const totalPendingApprovalAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  const approvedExpenses = expenses.filter((e) => e.approvalStatus === 'approved');
  const totalApprovedAmount = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const paidExpenses = expenses.filter((e) => e.paymentStatus === 'paid');
  const totalPaidAmount = paidExpenses.reduce((sum, e) => sum + e.amount, 0);

  const unpaidApprovedExpenses = expenses.filter(
    (e) => e.approvalStatus === 'approved' && e.paymentStatus === 'unpaid'
  );
  const totalUnpaidApprovedAmount = unpaidApprovedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'pending' && e.approvalStatus === 'pending') ||
        (selectedStatus === 'approved' && e.approvalStatus === 'approved' && e.paymentStatus === 'unpaid') ||
        (selectedStatus === 'rejected' && e.approvalStatus === 'rejected') ||
        (selectedStatus === 'paid' && e.paymentStatus === 'paid');

      const matchesStaff = selectedStaffFilter === 'all' || e.staffId === selectedStaffFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesStaff;
    });
  }, [expenses, searchTerm, selectedCategory, selectedStatus, selectedStaffFilter]);

  // Submit Expense Handler
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;
    const emp = staff.find((s) => s.id === newStaffId);

    const expenseItem: Expense = {
      id: `exp-${Date.now()}`,
      staffId: newStaffId,
      staffName: emp?.fullName || 'Staff Member',
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Official expense claim',
      amount: parseFloat(newAmount),
      expenseDate: newExpenseDate,
      receiptName: newReceiptUrl ? 'Receipt_Doc.pdf' : undefined,
      receiptUrl: newReceiptUrl || undefined,
      submissionDate: getTodayDateString(),
      approvalStatus: 'pending',
      paymentStatus: 'unpaid',
    };

    addExpense(expenseItem);
    setNewTitle('');
    setNewAmount('');
    setNewDescription('');
    setNewReceiptUrl('');
    setIsSubmitModalOpen(false);
  };

  // Open Review Modal
  const handleOpenReview = (exp: Expense) => {
    setActiveExpense(exp);
    setReviewRemarks(exp.adminRemarks || '');
    setIsReviewModalOpen(true);
  };

  // Review Actions
  const handleApprove = () => {
    if (!activeExpense) return;
    updateExpense({
      ...activeExpense,
      approvalStatus: 'approved',
      adminRemarks: reviewRemarks.trim() || 'Verified and approved by admin.',
    });
    setIsReviewModalOpen(false);
  };

  const handleReject = () => {
    if (!activeExpense) return;
    updateExpense({
      ...activeExpense,
      approvalStatus: 'rejected',
      adminRemarks: reviewRemarks.trim() || 'Rejected due to insufficient documentation.',
    });
    setIsReviewModalOpen(false);
  };

  // Open Payment Modal
  const handleOpenPayment = (exp: Expense) => {
    setActiveExpense(exp);
    setPaymentRefNumber(`CMS-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsPaymentModalOpen(true);
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExpense) return;
    if (activeExpense.approvalStatus !== 'approved') return;

    updateExpense({
      ...activeExpense,
      paymentStatus: 'paid',
      paidAt: getTodayDateString(),
      paymentRef: `${paymentMethod}-${paymentRefNumber}`,
      adminRemarks: activeExpense.adminRemarks
        ? `${activeExpense.adminRemarks} | Disbursed via ${paymentMethod} (${paymentRefNumber})`
        : `Disbursed via ${paymentMethod} (${paymentRefNumber})`,
    });
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Expense Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
              Corporate Reimbursable Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review field conveyance, client bills, and disburse verified staff expense claims.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Submit Expense Claim
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Claims</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalSubmittedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Submitted to date</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Pending Approval</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {formatINR(totalPendingApprovalAmount)}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
            {pendingExpenses.length} awaiting review
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Approved Total</div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {formatINR(totalApprovedAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {approvedExpenses.length} approved claims
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Unpaid Approved</div>
          <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
            {formatINR(totalUnpaidApprovedAmount)}
          </div>
          <div className="text-[11px] text-brand-600 font-semibold mt-0.5">
            Eligible for payment ({unpaidApprovedExpenses.length})
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Paid</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(totalPaidAmount)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {paidExpenses.length} disbursed
          </div>
        </div>
      </div>

      {/* Employee Expense Summary Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Employee Expense Summary (Click card for individual claim history)
          </h2>
          <span className="text-xs text-slate-400">{staff.length} staff records</span>
        </div>

        {staff.length === 0 ? (
          <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-800 text-center">
            <EmptyState
              icon={User}
              title="No Staff Enrolled"
              description="Active employees and their individual claim summaries will appear here once registered."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {staff.map((emp) => {
              const empExpenses = expenses.filter((e) => e.staffId === emp.id);
              const empTotalAmount = empExpenses.reduce((sum, e) => sum + e.amount, 0);
              const empPending = empExpenses.filter((e) => e.approvalStatus === 'pending').length;

              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setHistoryStaffId(emp.id);
                    setIsStaffHistoryModalOpen(true);
                  }}
                  className="group cursor-pointer bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs hover:shadow-lg hover:border-brand-500/50 transition-all text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-center shrink-0 border border-slate-200 dark:border-navy-700 text-xs">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 transition-colors">
                        {emp.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {emp.employeeId} • {emp.designation}
                      </div>
                      <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                        {formatINR(empTotalAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {empPending > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {empPending} Pnd
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search claims by title, employee name, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Staff Filter */}
          <select
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Employees</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            <option value="Travel">Travel</option>
            <option value="Food">Food</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Client Entertainment">Client Entertainment</option>
            <option value="Fuel">Fuel</option>
            <option value="Utilities">Utilities</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Other">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved (Unpaid)</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Expense Table */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/40 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Expense / Title</th>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Approval</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {filteredExpenses.map((expense) => {
                const isApproved = expense.approvalStatus === 'approved';
                const isPaid = expense.paymentStatus === 'paid';
                const isPending = expense.approvalStatus === 'pending';

                return (
                  <tr
                    key={expense.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {expense.title}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {expense.description}
                      </p>
                      {expense.receiptName && (
                        <div className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{expense.receiptName}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {expense.staffName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Submitted {expense.submissionDate}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge variant="blue" size="sm">
                        {expense.category}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {expense.expenseDate}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap font-extrabold text-sm text-slate-900 dark:text-white">
                      {formatINR(expense.amount)}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {isPending && (
                        <Badge variant="amber" size="sm" dot>
                          PENDING
                        </Badge>
                      )}
                      {expense.approvalStatus === 'approved' && (
                        <Badge variant="emerald" size="sm" dot>
                          APPROVED
                        </Badge>
                      )}
                      {expense.approvalStatus === 'rejected' && (
                        <Badge variant="rose" size="sm" dot>
                          REJECTED
                        </Badge>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {isPaid ? (
                        <Badge variant="emerald" size="sm">
                          PAID ({expense.paidAt})
                        </Badge>
                      ) : isApproved ? (
                        <Badge variant="slate" size="sm">
                          UNPAID
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReview(expense)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold"
                          title="Review claim & preview receipt"
                        >
                          Review
                        </button>

                        {isApproved && !isPaid && (
                          <button
                            onClick={() => handleOpenPayment(expense)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <EmptyState
                      icon={Receipt}
                      title="No Expense Claims Found"
                      description={
                        expenses.length === 0
                          ? "No expense claims or reimbursements logged yet. Submit a new expense to get started."
                          : "No expense claims match your selected filters."
                      }
                      primaryActionLabel={expenses.length === 0 ? "Submit New Expense" : undefined}
                      onPrimaryAction={expenses.length === 0 ? () => setIsSubmitModalOpen(true) : undefined}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMIT EXPENSE MODAL */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit New Expense Claim"
        subtitle="Log an employee expenditure or reimbursement claim"
      >
        <form onSubmit={handleSubmitExpense} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Employee *
              </label>
              <select
                value={newStaffId}
                onChange={(e) => setNewStaffId(e.target.value)}
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
                Expense Category *
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-semibold"
              >
                <option value="Travel">Travel (Cab, Train, Flight)</option>
                <option value="Food">Food & Refreshments</option>
                <option value="Office Supplies">Office Supplies & Stationery</option>
                <option value="Client Entertainment">Client Entertainment</option>
                <option value="Fuel">Fuel & Vehicle Conveyance</option>
                <option value="Utilities">Utilities & Software</option>
                <option value="Maintenance">Facility Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Expense Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Gurgaon Client Audit Visit Cab Reimbursement"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Claim Amount (INR ₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="e.g. 2400"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Expense Date
              </label>
              <input
                type="date"
                required
                value={newExpenseDate}
                onChange={(e) => setNewExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Receipt Attachment (Cloudinary Upload)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Receipt URL or upload file..."
                  value={newReceiptUrl}
                  onChange={(e) => setNewReceiptUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
                <label className="px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                  {isUploadingReceipt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploadingReceipt ? `${uploadProgress}%` : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={isUploadingReceipt}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAdminReceiptUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Description & Merchant Details
            </label>
            <textarea
              rows={3}
              placeholder="State reason for expenditure, merchant name, and project reference..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Submit Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* REVIEW & RECEIPT PREVIEW MODAL */}
      {activeExpense && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="Expense Claim Verification"
          subtitle={`Claim Reference: ${activeExpense.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Employee
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {activeExpense.staffName}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Claim Amount
                </span>
                <div className="text-xl font-extrabold text-brand-600 mt-0.5">
                  {formatINR(activeExpense.amount)}
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {activeExpense.title}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-1 bg-slate-50 dark:bg-navy-800/60 p-3 rounded-xl border border-slate-200/50 dark:border-navy-700/50">
                {activeExpense.description}
              </p>
            </div>

            {/* Receipt Preview */}
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                Attached Merchant Invoice / Proof of Payment
              </span>
              {activeExpense.receiptUrl ? (
                <div className="max-h-56 overflow-hidden rounded-xl border border-slate-200 dark:border-navy-700">
                  <img
                    src={activeExpense.receiptUrl}
                    alt="Receipt"
                    className="w-full h-auto object-cover max-h-56"
                  />
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <span>Physical paper voucher submitted to office desk (Document verified).</span>
                </div>
              )}
            </div>

            {/* Admin Remarks Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Admin Audit Remarks & Justification
              </label>
              <input
                type="text"
                placeholder="Enter approval note or reason for rejection..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors"
                >
                  Reject Claim
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
                >
                  Approve Claim
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* EXECUTE PAYMENT MODAL */}
      {activeExpense && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Disburse Approved Expense Payment"
          subtitle={`Staff: ${activeExpense.staffName} · Amount: ${formatINR(activeExpense.amount)}`}
        >
          <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
              <span className="font-bold">Payment Authorization: </span>
              This expense has been audited and approved. Complete the disbursement details to prevent duplicate payment marking.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Disbursement Mode *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / CMS NetBanking)</option>
                <option value="UPI">UPI Direct Remittance</option>
                <option value="Cash">Office Petty Cash Voucher</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Transaction / UTR Reference Number *
              </label>
              <input
                type="text"
                required
                value={paymentRefNumber}
                onChange={(e) => setPaymentRefNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-mono font-bold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Confirm & Mark as Paid
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* INDIVIDUAL STAFF EXPENSE HISTORY MODAL */}
      {(() => {
        const historyStaff = staff.find((s) => s.id === historyStaffId);
        if (!historyStaff) return null;
        const staffClaims = expenses.filter((e) => e.staffId === historyStaff.id);
        const totalStaffAmount = staffClaims.reduce((sum, e) => sum + e.amount, 0);

        return (
          <Modal
            isOpen={isStaffHistoryModalOpen}
            onClose={() => setIsStaffHistoryModalOpen(false)}
            title={`Expense History: ${historyStaff.fullName}`}
            subtitle={`${historyStaff.employeeId} · ${historyStaff.designation}`}
            maxWidth="4xl"
          >
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Total Claims Submitted
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {staffClaims.length} Claims
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Cumulative Amount
                  </span>
                  <div className="text-xl font-extrabold text-brand-600">
                    {formatINR(totalStaffAmount)}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-navy-800">
                {staffClaims.map((claim) => (
                  <div key={claim.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {claim.title}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {claim.expenseDate} • {claim.category}
                      </div>
                      {claim.adminRemarks && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">
                          Remark: {claim.adminRemarks}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {formatINR(claim.amount)}
                      </span>
                      {claim.approvalStatus === 'approved' && (
                        <Badge variant="emerald" size="sm">
                          {claim.paymentStatus === 'paid' ? 'PAID' : 'APPROVED'}
                        </Badge>
                      )}
                      {claim.approvalStatus === 'pending' && (
                        <Badge variant="amber" size="sm">
                          PENDING
                        </Badge>
                      )}
                      {claim.approvalStatus === 'rejected' && (
                        <Badge variant="rose" size="sm">
                          REJECTED
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => setIsStaffHistoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
                >
                  Close History
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
