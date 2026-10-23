import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import { cloudinaryService } from '../../services/cloudinaryService';
import { getTodayDateString } from '../../utils/dateUtils';

export const StaffExpensesPage: React.FC = () => {
  const { currentStaff, expenses, addExpense, showToast } = useApp();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // New Expense Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Travel');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const myEmployeeId = currentStaff?.employeeId;

  // Filter only this employee's expenses!
  const myExpenses = expenses.filter((e) => e.staffId === myEmployeeId);

  const filteredExpenses = myExpenses
    .filter((e) => {
      if (statusFilter === 'all') return true;
      return e.approvalStatus === statusFilter;
    })
    .filter((e) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    });

  // Calculate totals
  const totalClaimed = myExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = myExpenses
    .filter((e) => e.approvalStatus === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPending = myExpenses
    .filter((e) => e.approvalStatus === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleReceiptFileChange = async (file: File) => {
    try {
      setIsUploadingReceipt(true);
      setUploadProgress(0);
      setReceiptFileName(file.name);
      const res = await cloudinaryService.uploadExpenseReceipt(file, (p) => {
        setUploadProgress(p);
      });
      setReceiptUrl(res.secureUrl);
      showToast(`Receipt "${file.name}" uploaded to Cloudinary successfully.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Receipt upload to Cloudinary failed.', 'error');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) {
      showToast('Please provide a valid title and expense amount.', 'error');
      return;
    }

    if (!currentStaff) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      staffId: currentStaff.employeeId,
      staffName: currentStaff.fullName,
      title: title.trim(),
      category: category as any,
      description: description.trim(),
      amount: parseFloat(amount),
      expenseDate: date || getTodayDateString(),
      submissionDate: getTodayDateString(),
      receiptUrl: receiptUrl || (receiptFileName ? `/receipts/${receiptFileName}` : undefined),
      receiptName: receiptFileName || undefined,
      approvalStatus: 'pending',
      paymentStatus: 'unpaid',
      adminRemarks: remarks.trim() ? `Staff Remark: ${remarks.trim()}` : undefined,
    };

    addExpense(newExpense);
    setIsSubmitModalOpen(false);

    // Reset form
    setTitle('');
    setAmount('');
    setDate(getTodayDateString());
    setDescription('');
    setRemarks('');
    setReceiptFileName('');
    setReceiptUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Receipt className="w-4 h-4" />
            <span>Reimbursements & Claims</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            My Expense Claims
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit official expense claims, track administrative approvals, and monitor disbursement status
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Expense Claim</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Submitted */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Claims Submitted
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{totalClaimed.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">{myExpenses.length} total requests</span>
        </div>

        {/* Pending Approval */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
            Pending Review
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">
            {myExpenses.filter((e) => e.approvalStatus === 'pending').length} under admin review
          </span>
        </div>

        {/* Approved Claims */}
        <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            Approved Claims
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{totalApproved.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">
            {myExpenses.filter((e) => e.approvalStatus === 'approved').length} verified & cleared
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
            placeholder="Search claims by title, category, or note..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-800/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-navy-800">
              <tr>
                <th className="px-5 py-3.5">Expense Item</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-center">Approval</th>
                <th className="px-5 py-3.5 text-center">Disbursement</th>
                <th className="px-5 py-3.5">Admin Review Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {expense.title}
                    </div>
                    {expense.description && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {expense.description}
                      </div>
                    )}
                    {expense.receiptUrl && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                        <FileText className="w-3 h-3" />
                        <span>Receipt attached</span>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                      {expense.category}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-300">
                    {expense.expenseDate}
                  </td>

                  <td className="px-5 py-4 text-right font-black font-mono text-slate-900 dark:text-white text-sm">
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        expense.approvalStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : expense.approvalStatus === 'rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}
                    >
                      {expense.approvalStatus}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        expense.paymentStatus === 'paid'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400'
                      }`}
                    >
                      {expense.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs">
                    {expense.adminRemarks || '—'}
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No expense records found.
                    </p>
                    <p className="text-[11px] mt-0.5">Click "New Expense Claim" above to submit one.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit New Expense Claim Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsSubmitModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-navy-800">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Submit Official Expense Claim
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manshi Group Setu Reimbursement Terminal
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Travel Cab to Client Meeting"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Travel">Travel / Transit</option>
                    <option value="Food">Food / Meals</option>
                    <option value="Client Meeting">Client Meeting</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Fuel">Fuel / Petrol</option>
                    <option value="Software">Software & Subscriptions</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Amount (INR ₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Expense Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Description & Justification
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why this expense was incurred..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Receipt Upload via Cloudinary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Receipt Upload (Cloudinary Unsigned Preset)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-slate-200 dark:border-navy-700 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer bg-slate-50/50 dark:bg-navy-800/40 transition-colors">
                    {isUploadingReceipt ? (
                      <div className="flex flex-col items-center justify-center py-1">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin mb-1" />
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          Uploading to Cloudinary... ({uploadProgress}%)
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                          {receiptFileName ? `Selected: ${receiptFileName}` : 'Click to select and upload invoice/receipt (PDF or Image)'}
                        </span>
                        {receiptUrl && (
                          <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                            ✓ Cloudinary secure upload complete
                          </span>
                        )}
                      </>
                    )}
                    <input
                      type="file"
                      disabled={isUploadingReceipt}
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReceiptFileChange(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
