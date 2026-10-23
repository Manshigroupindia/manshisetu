import React, { useState, useMemo, useEffect } from 'react';
import {
  CircleDollarSign,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Printer,
  CreditCard,
  Plus,
  Search,
  Eye,
  FileText,
  Building,
  Info,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Staff, SalaryRecord, SalaryAdvance, PaymentMethod } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  calculateSalaryForStaff,
  formatINR,
  SalaryCalculationResult,
} from '../utils/salaryCalculator';
import { getTodayDateString, getCurrentMonthString } from '../utils/dateUtils';
import { EmptyState } from '../components/common/EmptyState';

export const SalaryManagementPage: React.FC = () => {
  const {
    staff,
    salaries,
    advances,
    attendance,
    holidays,
    settings,
    saveSalaryRecord,
    addAdvance,
    updateAdvance,
  } = useApp();

  // Active Month Filter
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [activeTab, setActiveTab] = useState<'salaries' | 'advances'>('salaries');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [isIssueAdvanceModalOpen, setIsIssueAdvanceModalOpen] = useState(false);

  // Active Employee under review
  const [selectedStaffMember, setSelectedStaffMember] = useState<Staff | null>(null);
  const [selectedCalcResult, setSelectedCalcResult] = useState<SalaryCalculationResult | null>(null);
  const [existingPaidSalary, setExistingPaidSalary] = useState<SalaryRecord | null>(null);

  // Payment Form States
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Issue Advance Form States
  const [advanceStaffId, setAdvanceStaffId] = useState(staff[0]?.id || '');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(getTodayDateString());
  const [advanceReason, setAdvanceReason] = useState('');

  useEffect(() => {
    if (!advanceStaffId && staff.length > 0) {
      setAdvanceStaffId(staff[0].id);
    }
  }, [staff, advanceStaffId]);

  // Calculate calculations for all active staff in the selected month
  const monthlySalaryData = useMemo(() => {
    return staff
      .filter((s) => s.status === 'active')
      .map((employee) => {
        const existingPaid = salaries.find(
          (sal) => sal.staffId === employee.id && sal.month === selectedMonth
        );
        const calculation = calculateSalaryForStaff(
          employee,
          selectedMonth,
          attendance,
          holidays,
          advances,
          existingPaid
        );
        return {
          employee,
          calculation,
          paidRecord: existingPaid,
          isPaid: existingPaid?.paymentStatus === 'paid',
        };
      });
  }, [staff, salaries, advances, attendance, holidays, selectedMonth]);

  // Filtered by Search
  const filteredData = useMemo(() => {
    return monthlySalaryData.filter(
      (item) =>
        item.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [monthlySalaryData, searchTerm]);

  // Overall Monthly Metrics
  const totalPayableMonth = monthlySalaryData.reduce(
    (sum, item) => sum + item.calculation.finalPayable,
    0
  );
  const totalPaidMonth = monthlySalaryData.reduce((sum, item) => {
    if (item.isPaid && item.paidRecord) {
      return sum + item.paidRecord.finalPayable;
    }
    return sum;
  }, 0);
  const pendingStaffCount = monthlySalaryData.filter((item) => !item.isPaid).length;
  const totalPendingAmount = Math.max(0, totalPayableMonth - totalPaidMonth);

  // Outstanding advances across company
  const totalOutstandingAdvances = advances
    .filter((a) => a.status === 'approved')
    .reduce((sum, a) => sum + a.remainingBalance, 0);

  // Open Salary Breakdown & Payment Modal
  const handleOpenBreakdown = (
    employee: Staff,
    calculation: SalaryCalculationResult,
    paidRecord?: SalaryRecord
  ) => {
    setSelectedStaffMember(employee);
    setSelectedCalcResult(calculation);
    setExistingPaidSalary(paidRecord || null);

    // Initialize payment reference number
    setPaymentDate(getTodayDateString());
    setPaymentMethod('Bank Transfer');
    setTransactionRef(`CMS-${employee.employeeId}-${Date.now().toString().slice(-6)}`);
    setPaymentRemarks('Monthly salary disbursed via Corporate CMS portal.');
    setIsBreakdownModalOpen(true);
  };

  // Open Printable Salary Slip Modal
  const handleOpenPayslip = (
    employee: Staff,
    calculation: SalaryCalculationResult,
    paidRecord?: SalaryRecord
  ) => {
    setSelectedStaffMember(employee);
    setSelectedCalcResult(calculation);
    setExistingPaidSalary(paidRecord || null);
    setIsPayslipModalOpen(true);
  };

  // Execute Mark as Paid
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffMember || !selectedCalcResult) return;

    // Prevent duplicate payment
    const alreadyPaid = salaries.some(
      (s) =>
        s.staffId === selectedStaffMember.id &&
        s.month === selectedMonth &&
        s.paymentStatus === 'paid'
    );
    if (alreadyPaid) return;

    // Deduct advance balance if applicable
    const advanceDeductionAmount = selectedCalcResult.applicableAdvanceDeduction;
    const adjustedAdvanceIds: string[] = [];

    if (advanceDeductionAmount > 0) {
      let remainingDeductionToApply = advanceDeductionAmount;
      const staffAdvances = advances.filter(
        (a) => a.staffId === selectedStaffMember.id && a.status === 'approved' && a.remainingBalance > 0
      );

      for (const adv of staffAdvances) {
        if (remainingDeductionToApply <= 0) break;
        const deductionFromThisAdvance = Math.min(adv.remainingBalance, remainingDeductionToApply);
        const updatedAdv: SalaryAdvance = {
          ...adv,
          deductedAmount: adv.deductedAmount + deductionFromThisAdvance,
          remainingBalance: adv.remainingBalance - deductionFromThisAdvance,
        };
        updateAdvance(updatedAdv);
        adjustedAdvanceIds.push(adv.id);
        remainingDeductionToApply -= deductionFromThisAdvance;
      }
    }

    // Save final Salary Record
    const newSalaryRecord: SalaryRecord = {
      id: `sal-${selectedMonth}-${selectedStaffMember.id}`,
      staffId: selectedStaffMember.id,
      staffName: selectedStaffMember.fullName,
      month: selectedMonth,
      monthlySalary: selectedCalcResult.monthlySalary,
      dailyRate: selectedCalcResult.dailyRate,
      totalCalendarDays: selectedCalcResult.totalCalendarDays,
      presentDays: selectedCalcResult.recordedPresentDays,
      paidLeaveDays: selectedCalcResult.recordedPaidLeaveDays,
      sundaysCount: selectedCalcResult.sundaysCount,
      holidayDays: selectedCalcResult.holidayDays,
      unpaidAbsenceDays: selectedCalcResult.unpaidAbsenceDays,
      unrecordedDays: selectedCalcResult.unrecordedDays,
      grossSalary: selectedCalcResult.grossSalary,
      absenceDeduction: selectedCalcResult.absenceDeduction,
      otherAuthorizedDeductions: selectedCalcResult.otherAuthorizedDeductions,
      salaryBeforeAdvance: selectedCalcResult.salaryBeforeAdvance,
      advanceDeduction: advanceDeductionAmount,
      finalPayable: selectedCalcResult.finalPayable,
      paymentStatus: 'paid',
      paymentDate,
      paymentMethod,
      transactionRef: transactionRef.trim(),
      remarks: paymentRemarks.trim(),
      paidAt: new Date().toISOString(),
      advanceRecordIdsDeducted: adjustedAdvanceIds,
    };

    saveSalaryRecord(newSalaryRecord);
    setIsBreakdownModalOpen(false);
  };

  // Issue New Salary Advance Handler
  const handleIssueAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceAmount || !advanceReason.trim()) return;
    const emp = staff.find((s) => s.id === advanceStaffId);
    if (!emp) return;

    const parsedAmount = parseFloat(advanceAmount);
    const newAdv: SalaryAdvance = {
      id: `adv-${Date.now()}`,
      staffId: advanceStaffId,
      staffName: emp.fullName,
      amount: parsedAmount,
      requestDate: advanceDate,
      approvedDate: advanceDate,
      reason: advanceReason.trim(),
      status: 'approved',
      deductedAmount: 0,
      remainingBalance: parsedAmount,
      notes: 'Approved by Chief Administrator.',
    };

    addAdvance(newAdv);
    setAdvanceAmount('');
    setAdvanceReason('');
    setIsIssueAdvanceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Salary & Advance Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
              30-Day Policy Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated payroll calculation, advance deduction tracking, and bank payslip generator.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs"
          />

          <div className="bg-slate-200/80 dark:bg-navy-800 p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => setActiveTab('salaries')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'salaries'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Salary Processing
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'advances'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Advance Tracking
            </button>
          </div>
        </div>
      </div>

      {/* Corporate Salary Policy Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-navy-900 text-white p-5 rounded-3xl shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Company Salary Policy Formulation
            </div>
            <h3 className="text-lg font-bold">
              30-Day Monthly Salary Basis Policy (Daily Rate = Fixed Monthly Salary ÷ 30)
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              • Official Sundays & Company Holidays are 100% paid. • 1 approved paid leave allowed per month without deduction. • Excess unpaid absences deducted strictly at Daily Rate. • 31-day months and 5th Sundays are accommodated within the fixed monthly salary cap.
            </p>
          </div>

          <button
            onClick={() => setIsIssueAdvanceModalOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Issue Staff Advance
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Payable</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatINR(totalPayableMonth)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{selectedMonth} budget</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Already Paid</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(totalPaidMonth)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {monthlySalaryData.length - pendingStaffCount} staff disbursed
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Pending Payout</div>
          <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
            {formatINR(totalPendingAmount)}
          </div>
          <div className="text-[11px] text-brand-600 font-semibold mt-0.5">
            {pendingStaffCount} staff awaiting payment
          </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Staff Awaiting</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {pendingStaffCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active pending queue</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Outstanding Advances</div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {formatINR(totalOutstandingAdvances)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Company balance</div>
        </div>
      </div>

      {/* TAB 1: SALARIES */}
      {activeTab === 'salaries' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employee by name, ID or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Calculated for 30-day policy • {filteredData.length} records
            </div>
          </div>

          {/* Salaries Table */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/40 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Fixed Monthly</th>
                    <th className="px-5 py-3.5 text-center">Present</th>
                    <th className="px-5 py-3.5 text-center">Paid Leave</th>
                    <th className="px-5 py-3.5 text-center">Sundays</th>
                    <th className="px-5 py-3.5 text-center">Absences</th>
                    <th className="px-5 py-3.5 text-right">Deductions</th>
                    <th className="px-5 py-3.5 text-right">Advance Adj</th>
                    <th className="px-5 py-3.5 text-right">Final Net</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center">
                        <EmptyState
                          icon={CreditCard}
                          title="No Salary Records Found"
                          description="No active employees found to calculate payroll for this month."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredData.map(({ employee, calculation, paidRecord, isPaid }) => {
                    const finalPayable = isPaid && paidRecord ? paidRecord.finalPayable : calculation.finalPayable;
                    const advanceDed = isPaid && paidRecord ? paidRecord.advanceDeduction : calculation.applicableAdvanceDeduction;
                    const absenceDed = isPaid && paidRecord ? paidRecord.absenceDeduction : calculation.absenceDeduction;

                    return (
                      <tr
                        key={employee.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-navy-800/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200">
                              {employee.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {employee.fullName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {employee.employeeId} • {employee.designation}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                          {formatINR(employee.monthlyFixedSalary)}
                        </td>

                        <td className="px-5 py-3.5 text-center font-bold text-emerald-600">
                          {calculation.recordedPresentDays}
                        </td>

                        <td className="px-5 py-3.5 text-center font-semibold text-amber-600">
                          {calculation.recordedPaidLeaveDays}
                        </td>

                        <td className="px-5 py-3.5 text-center font-semibold text-blue-600">
                          {calculation.sundaysCount}
                        </td>

                        <td className="px-5 py-3.5 text-center font-bold text-rose-600">
                          {calculation.unpaidAbsenceDays}
                        </td>

                        <td className="px-5 py-3.5 text-right font-medium text-rose-600">
                          {absenceDed > 0 ? `-${formatINR(absenceDed)}` : '₹0'}
                        </td>

                        <td className="px-5 py-3.5 text-right font-medium text-amber-600">
                          {advanceDed > 0 ? `-${formatINR(advanceDed)}` : '₹0'}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap font-extrabold text-sm text-slate-900 dark:text-white">
                          {formatINR(finalPayable)}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {isPaid ? (
                            <Badge variant="emerald" size="sm" dot>
                              PAID
                            </Badge>
                          ) : (
                            <Badge variant="amber" size="sm" dot>
                              PENDING
                            </Badge>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenBreakdown(employee, calculation, paidRecord)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-2xs transition-colors ${
                                isPaid
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-navy-800 dark:hover:bg-navy-700 dark:text-slate-200'
                                  : 'bg-brand-600 hover:bg-brand-700 text-white'
                              }`}
                            >
                              {isPaid ? 'Review Record' : 'Review & Pay'}
                            </button>

                            <button
                              onClick={() => handleOpenPayslip(employee, calculation, paidRecord)}
                              className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                              title="Print / View Payslip"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCE MANAGEMENT */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Employee Salary Advance Registry
              </h2>
              <p className="text-xs text-slate-400">
                Advances are deducted automatically during monthly salary processing.
              </p>
            </div>

            <button
              onClick={() => setIsIssueAdvanceModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              Issue Advance
            </button>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/40 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Staff Member</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Deducted from Salary</th>
                    <th className="px-5 py-3.5">Remaining Balance</th>
                    <th className="px-5 py-3.5">Date Issued</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Reason & Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {advances.map((adv) => (
                    <tr
                      key={adv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-navy-800/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {adv.staffName}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                        {formatINR(adv.amount)}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-emerald-600 font-semibold">
                        {formatINR(adv.deductedAmount)}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-extrabold text-sm text-brand-600">
                        {formatINR(adv.remainingBalance)}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                        {adv.requestDate}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {adv.remainingBalance === 0 ? (
                          <Badge variant="emerald" size="sm">
                            FULLY SETTLED
                          </Badge>
                        ) : (
                          <Badge variant="amber" size="sm">
                            ACTIVE BALANCE
                          </Badge>
                        )}
                      </td>

                      <td className="px-5 py-3.5 max-w-md text-slate-600 dark:text-slate-300">
                        {adv.reason}
                      </td>
                    </tr>
                  ))}

                  {advances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <EmptyState
                          icon={IndianRupee}
                          title="No Advances Issued"
                          description="No employee salary advances recorded in the company ledger."
                          primaryActionLabel="Issue Advance"
                          onPrimaryAction={() => setIsIssueAdvanceModalOpen(true)}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SALARY BREAKDOWN & PAYMENT PROCESSING MODAL */}
      {selectedStaffMember && selectedCalcResult && (
        <Modal
          isOpen={isBreakdownModalOpen}
          onClose={() => setIsBreakdownModalOpen(false)}
          title={`Salary Audit & Disbursal: ${selectedStaffMember.fullName}`}
          subtitle={`Employee ID: ${selectedStaffMember.employeeId} · Salary Month: ${selectedMonth}`}
          maxWidth="4xl"
        >
          <div className="space-y-5 text-xs">
            {/* Calculation Formula Transparency Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-navy-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Monthly Fixed Salary
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {formatINR(selectedCalcResult.monthlySalary)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Calculated Daily Rate (÷ 30)
                  </span>
                  <div className="text-base font-extrabold text-blue-600 mt-0.5">
                    {formatINR(selectedCalcResult.dailyRate)} / day
                  </div>
                </div>
              </div>

              {/* Attendance Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Present Days</div>
                  <div className="text-base font-extrabold text-emerald-600">
                    {selectedCalcResult.recordedPresentDays}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Paid Leave (1 max)</div>
                  <div className="text-base font-extrabold text-amber-600">
                    {selectedCalcResult.recordedPaidLeaveDays}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Sundays (Paid)</div>
                  <div className="text-base font-extrabold text-blue-600">
                    {selectedCalcResult.sundaysCount}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Holidays (Paid)</div>
                  <div className="text-base font-extrabold text-purple-600">
                    {selectedCalcResult.holidayDays}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Deductible Absences</div>
                  <div className="text-base font-extrabold text-rose-600">
                    {selectedCalcResult.unpaidAbsenceDays}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Calendar Days</div>
                  <div className="text-base font-extrabold text-slate-700 dark:text-slate-300">
                    {selectedCalcResult.totalCalendarDays}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Ledger Calculation Breakdown */}
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2.5">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Fixed Monthly Base Salary:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatINR(selectedCalcResult.monthlySalary)}
                </span>
              </div>

              <div className="flex items-center justify-between text-rose-600">
                <span>
                  Absence Deductions ({selectedCalcResult.unpaidAbsenceDays} days × {formatINR(selectedCalcResult.dailyRate)}):
                </span>
                <span className="font-semibold">
                  -{formatINR(selectedCalcResult.absenceDeduction)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-navy-800 font-bold">
                <span>Salary Before Advance Adjustment:</span>
                <span>{formatINR(selectedCalcResult.salaryBeforeAdvance)}</span>
              </div>

              <div className="flex items-center justify-between text-amber-600">
                <span>
                  Salary Advance Deduction (Outstanding balance: {formatINR(selectedCalcResult.outstandingAdvanceBalance)}):
                </span>
                <span className="font-semibold">
                  -{formatINR(selectedCalcResult.applicableAdvanceDeduction)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-900 dark:text-white pt-2 border-t-2 border-slate-200 dark:border-navy-800 text-sm font-extrabold">
                <span className="text-brand-600 dark:text-brand-400">
                  Final Payable Net Amount:
                </span>
                <span className="text-brand-600 dark:text-brand-400 text-lg">
                  {formatINR(
                    existingPaidSalary ? existingPaidSalary.finalPayable : selectedCalcResult.finalPayable
                  )}
                </span>
              </div>
            </div>

            {/* Warnings or Notes */}
            {selectedCalcResult.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Policy Notice / Audit Warning:
                </div>
                {selectedCalcResult.warnings.map((w, i) => (
                  <p key={i} className="text-[11px] leading-relaxed">
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* Payment Execution Section */}
            {existingPaidSalary && existingPaidSalary.paymentStatus === 'paid' ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Disbursed & Settled in Full
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500 font-semibold">Payment Date:</span>
                    <div className="font-bold">{existingPaidSalary.paymentDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Method:</span>
                    <div className="font-bold">{existingPaidSalary.paymentMethod}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 font-semibold">Transaction Reference:</span>
                    <div className="font-mono font-bold truncate">
                      {existingPaidSalary.transactionRef}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-3 pt-2">
                <div className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
                  Process Disbursal & Mark as Paid
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
                    >
                      <option value="Bank Transfer">Bank Transfer (CMS NEFT / RTGS)</option>
                      <option value="UPI">UPI Direct Remittance</option>
                      <option value="Cash">Cash Voucher</option>
                      <option value="Cheque">Bank Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Transaction / UTR Ref *
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Disbursal Remarks
                  </label>
                  <input
                    type="text"
                    value={paymentRemarks}
                    onChange={(e) => setPaymentRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsBreakdownModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                  >
                    Confirm & Disburse Salary
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* PRINTABLE SALARY SLIP MODAL */}
      {selectedStaffMember && selectedCalcResult && (
        <Modal
          isOpen={isPayslipModalOpen}
          onClose={() => setIsPayslipModalOpen(false)}
          title="Printable Salary Slip"
          subtitle={`${selectedStaffMember.fullName} (${selectedMonth})`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-navy-800 no-print">
              <span className="text-slate-500">
                Verified computer-generated payslip matching statutory 30-day salary policy.
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-brand-600 font-bold text-xs shadow-md"
              >
                <Printer className="w-4 h-4" />
                Print Payslip
              </button>
            </div>

            {/* Payslip Document (Print Optimized) */}
            <div className="p-8 bg-white text-slate-900 rounded-2xl border border-slate-300 shadow-md space-y-6 print-break-inside-avoid">
              {/* Company Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">
                    {settings.companyName}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {settings.officeAddress}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Email: {settings.officialEmail} • Phone: {settings.contactNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-slate-100 font-mono font-bold text-xs border border-slate-300">
                    PAYSLIP - {selectedMonth}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                    Policy: 30-Day Base
                  </div>
                </div>
              </div>

              {/* Employee Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs py-1 border-b border-slate-200">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 font-medium">Employee Name:</span>{' '}
                    <strong className="text-slate-900">{selectedStaffMember.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Employee ID:</span>{' '}
                    <strong className="font-mono text-slate-900">
                      {selectedStaffMember.employeeId}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Designation:</span>{' '}
                    <span>{selectedStaffMember.designation}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Department:</span>{' '}
                    <span>{selectedStaffMember.department}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 font-medium">Bank Name:</span>{' '}
                    <span>{selectedStaffMember.bankDetails.bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Account Number:</span>{' '}
                    <span className="font-mono">
                      {selectedStaffMember.bankDetails.accountNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">IFSC Code:</span>{' '}
                    <span className="font-mono">{selectedStaffMember.bankDetails.ifscCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Payable Days:</span>{' '}
                    <strong>30 Days Basis</strong>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-700">
                    <tr>
                      <th className="px-4 py-2 border-r border-slate-300">Earnings</th>
                      <th className="px-4 py-2 border-r border-slate-300 text-right">Amount (₹)</th>
                      <th className="px-4 py-2 border-r border-slate-300">Deductions</th>
                      <th className="px-4 py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-2.5 border-r border-slate-200">
                        Monthly Fixed Salary
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200 text-right font-semibold">
                        {formatINR(selectedCalcResult.monthlySalary)}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200">
                        Absence Deductions ({selectedCalcResult.unpaidAbsenceDays} days)
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-rose-600">
                        {selectedCalcResult.absenceDeduction > 0
                          ? formatINR(selectedCalcResult.absenceDeduction)
                          : '₹0'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 border-r border-slate-200 text-slate-500">
                        Sundays & Gazetted Holidays (Paid)
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200 text-right text-slate-500">
                        Included
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200">
                        Salary Advance Deduction
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-amber-600">
                        {selectedCalcResult.applicableAdvanceDeduction > 0
                          ? formatINR(selectedCalcResult.applicableAdvanceDeduction)
                          : '₹0'}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="px-4 py-2 border-r border-slate-300 uppercase">Gross Earnings</td>
                      <td className="px-4 py-2 border-r border-slate-300 text-right">
                        {formatINR(selectedCalcResult.monthlySalary)}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-300 uppercase">
                        Total Deductions
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatINR(
                          selectedCalcResult.absenceDeduction +
                            selectedCalcResult.applicableAdvanceDeduction
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Payable Highlight */}
              <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Net Salary Disbursed
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Credited to Employee Registered Bank Account
                  </div>
                </div>
                <div className="text-2xl font-black">
                  {formatINR(
                    existingPaidSalary ? existingPaidSalary.finalPayable : selectedCalcResult.finalPayable
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="flex items-end justify-between pt-12 text-slate-500 text-[11px]">
                <div className="text-center">
                  <div className="w-36 border-t border-slate-400 mb-1" />
                  <span>Employee Signature</span>
                </div>
                <div className="text-center">
                  <div className="w-44 border-t border-slate-400 mb-1" />
                  <span className="font-bold text-slate-800">For Manshi Group of Services</span>
                  <div className="text-[10px]">Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ISSUE ADVANCE MODAL */}
      <Modal
        isOpen={isIssueAdvanceModalOpen}
        onClose={() => setIsIssueAdvanceModalOpen(false)}
        title="Issue Salary Advance"
        subtitle="Grant an advance to an employee to be adjusted in upcoming payroll"
      >
        <form onSubmit={handleIssueAdvance} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Select Staff Member *
            </label>
            <select
              value={advanceStaffId}
              onChange={(e) => setAdvanceStaffId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
            >
              {staff.length === 0 ? (
                <option value="" disabled>No staff available</option>
              ) : (
                staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.designation} - Salary: {formatINR(s.monthlyFixedSalary)})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Advance Amount (INR ₹) *
              </label>
              <input
                type="number"
                required
                min="100"
                step="500"
                placeholder="e.g. 5000"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                required
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Reason & Terms for Advance *
            </label>
            <textarea
              rows={3}
              required
              placeholder="State purpose of advance (e.g. Medical emergency, festival advance) and repayment schedule..."
              value={advanceReason}
              onChange={(e) => setAdvanceReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsIssueAdvanceModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Issue Advance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
