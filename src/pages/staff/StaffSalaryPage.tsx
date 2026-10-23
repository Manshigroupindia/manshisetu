import React, { useState } from 'react';
import {
  CircleDollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  AlertTriangle,
  Info,
  ShieldCheck,
  Building2,
  Download,
  IndianRupee,
  Receipt,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateSalaryForStaff, formatINR } from '../../utils/salaryCalculator';
import { SalaryRecord } from '../../types';
import { getCurrentMonthString } from '../../utils/dateUtils';

export const StaffSalaryPage: React.FC = () => {
  const { currentStaff, attendance, holidays, advances, salaries, settings } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [showSlipModal, setShowSlipModal] = useState(false);

  if (!currentStaff) {
    return (
      <div className="p-8 text-center text-slate-400">
        Staff profile not loaded. Please log in again.
      </div>
    );
  }

  // Check if an admin finalized salary record exists for this month
  const existingRecord: SalaryRecord | undefined = salaries.find(
    (s) => s.staffId === currentStaff.id && s.month === selectedMonth
  );

  // Compute live 30-day salary breakdown using the official calculation engine
  const calculation = calculateSalaryForStaff(
    currentStaff,
    selectedMonth,
    attendance,
    holidays,
    advances,
    existingRecord
  );

  // All historical salary records for this staff
  const staffSalaryHistory = salaries.filter((s) => s.staffId === currentStaff.id);

  const isPaid = existingRecord?.paymentStatus === 'paid';
  const displayNet = existingRecord ? existingRecord.finalPayable : calculation.finalPayable;

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <CircleDollarSign className="w-4 h-4" />
            <span>Employee Payroll & Compensation</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            My Salary & Payslip
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent 30-day salary calculation, attendance audit, advance deduction breakdown, and printable salary slip
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSlipModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-navy-700"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Generate Salary Slip</span>
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-blue-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isPaid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isPaid ? 'Salary Disbursed (Paid)' : 'Calculation in Progress'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Month: {selectedMonth}
              </span>
            </div>

            <div className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1">
              ₹{displayNet.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Net Payable Amount for {selectedMonth} (Based on 30-Day Fixed Policy)
            </p>
          </div>

          <div className="flex flex-col gap-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-300">Base Monthly Salary:</span>
              <span className="font-bold font-mono">
                ₹{(currentStaff.monthlyFixedSalary || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-300">Daily Salary Rate (÷30):</span>
              <span className="font-bold font-mono">
                ₹{calculation.dailyRate.toFixed(2)} / day
              </span>
            </div>
            {isPaid && existingRecord?.paymentDate && (
              <div className="flex items-center justify-between gap-6 pt-1 border-t border-white/10 text-emerald-300">
                <span>Disbursed On:</span>
                <span className="font-mono font-bold">{existingRecord.paymentDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Salary Breakdown & Policy Rules Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Attendance Summary</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/50">
              <span className="text-slate-600 dark:text-slate-400">Total Calendar Days:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {calculation.totalCalendarDays} Days
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
              <span>Present Days:</span>
              <span className="font-bold font-mono">{calculation.recordedPresentDays} Days</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
              <span>Approved Paid Leaves:</span>
              <span className="font-bold font-mono">{calculation.recordedPaidLeaveDays} Day (Allowed)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300">
              <span>Paid Sundays & Holidays:</span>
              <span className="font-bold font-mono">
                {calculation.sundaysCount + calculation.holidayDays} Days
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
              <span>Unpaid Absences:</span>
              <span className="font-bold font-mono">{calculation.unpaidAbsenceDays} Days</span>
            </div>
          </div>
        </div>

        {/* Deductions & Additions */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
            <Receipt className="w-4 h-4 text-brand-600" />
            <span>Deductions Transparency</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/50">
              <span className="text-slate-600 dark:text-slate-400">Gross Monthly Salary:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                ₹{calculation.grossSalary.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">
              <span>Absence Deduction ({calculation.unpaidAbsenceDays} × ₹{calculation.dailyRate.toFixed(2)}):</span>
              <span className="font-bold font-mono">-₹{calculation.absenceDeduction.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
              <span>Advance Recovery:</span>
              <span className="font-bold font-mono">
                -₹{(existingRecord ? existingRecord.advanceDeduction : calculation.applicableAdvanceDeduction).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/50 text-slate-600 dark:text-slate-400">
              <span>Other Authorized Deductions:</span>
              <span className="font-bold font-mono">
                -₹{(existingRecord ? existingRecord.otherAuthorizedDeductions : calculation.otherAuthorizedDeductions).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900 font-bold">
              <span>Net Payable:</span>
              <span className="font-black text-sm font-mono">
                ₹{displayNet.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Company 30-Day Policy Info */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Manshi Group Salary Policy</span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/40 border border-slate-200/80 dark:border-navy-700/80">
              <div className="font-bold text-slate-900 dark:text-white mb-1">
                30-Day Basis Standard
              </div>
              <p className="text-[11px]">
                Fixed monthly salaries are calculated on a uniform 30-day basis. The daily salary rate is always monthly salary ÷ 30.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/40 border border-slate-200/80 dark:border-navy-700/80">
              <div className="font-bold text-slate-900 dark:text-white mb-1">
                Paid Leave & Offs
              </div>
              <p className="text-[11px]">
                Employees receive 1 approved paid leave per month, plus all Sundays and declared company holidays without deduction.
              </p>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Note: Staff can view their salary breakdown but cannot modify calculations or payment status.
            </p>
          </div>
        </div>
      </div>

      {/* Salary History */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Salary Payment History</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-800/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-navy-800">
              <tr>
                <th className="px-5 py-3.5">Month</th>
                <th className="px-5 py-3.5">Gross Base</th>
                <th className="px-5 py-3.5">Absence Deductions</th>
                <th className="px-5 py-3.5">Advance Deductions</th>
                <th className="px-5 py-3.5">Net Disbursed</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5">Disbursement Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800/80">
              {staffSalaryHistory.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                  <td className="px-5 py-4 font-bold text-slate-900 dark:text-white font-mono">
                    {s.month}
                  </td>
                  <td className="px-5 py-4 font-mono">₹{s.grossSalary.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4 font-mono text-rose-600">
                    -₹{(s.absenceDeduction || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4 font-mono text-amber-600">
                    -₹{(s.advanceDeduction || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4 font-black font-mono text-slate-900 dark:text-white">
                    ₹{s.finalPayable.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        s.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}
                    >
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-[11px]">
                    {s.paymentDate ? (
                      <span>
                        Paid on {s.paymentDate} · {s.paymentMethod || 'Bank Transfer'}
                      </span>
                    ) : (
                      'Processing'
                    )}
                  </td>
                </tr>
              ))}

              {staffSalaryHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No past salary history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Salary Slip Modal */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-800 p-8 z-10 my-8">
            {/* Action Bar (Not printed) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-navy-800 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Printable Salary Slip
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setShowSlipModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Content */}
            <div className="pt-6 space-y-6">
              {/* Slip Header with Manshi Branding */}
              <div className="flex items-start justify-between border-b pb-6 border-slate-200 dark:border-navy-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      {settings.companyName || 'Manshi Group of Services'}
                    </h2>
                    <p className="text-xs text-slate-500">{settings.officeLocation}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Official Monthly Pay Advice · {selectedMonth}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Pay Slip</span>
                  <span className="text-sm font-black font-mono text-blue-600">
                    SLIP-{currentStaff.employeeId}-{selectedMonth}
                  </span>
                </div>
              </div>

              {/* Employee Dossier */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Employee Name
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {currentStaff.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Employee ID
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                    {currentStaff.employeeId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Designation
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {currentStaff.designation}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Department
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {currentStaff.department}
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="border border-slate-200 dark:border-navy-800 rounded-2xl p-4 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white border-b pb-2 mb-3">
                    Earnings
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Basic Fixed Monthly:</span>
                      <span className="font-mono font-bold">
                        ₹{calculation.grossSalary.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold pt-1 border-t">
                      <span>Total Earnings:</span>
                      <span className="font-mono">
                        ₹{calculation.grossSalary.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 dark:border-navy-800 rounded-2xl p-4 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white border-b pb-2 mb-3">
                    Deductions
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-rose-600">
                      <span>Unpaid Absences ({calculation.unpaidAbsenceDays}d):</span>
                      <span className="font-mono">
                        ₹{calculation.absenceDeduction.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Advance Recovery:</span>
                      <span className="font-mono">
                        ₹{(existingRecord ? existingRecord.advanceDeduction : calculation.applicableAdvanceDeduction).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-semibold pt-1 border-t">
                      <span>Total Deductions:</span>
                      <span className="font-mono">
                        ₹{(calculation.absenceDeduction + (existingRecord ? existingRecord.advanceDeduction : calculation.applicableAdvanceDeduction)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Net Disbursed Amount
                  </span>
                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    ₹{displayNet.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-600 uppercase">
                    Status: {isPaid ? 'PAID' : 'PENDING'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Authorized Signatory
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-2">
                This is a computer-generated salary advice slip issued under Manshi Group Setu Office Management System.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
