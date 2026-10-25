import React, { useState, useMemo } from 'react';
import {
  Users2,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  CreditCard,
  Building,
  Mail,
  Phone,
  Calendar,
  Eye,
  Edit2,
  PowerOff,
  Trash2,
  Printer,
  FileText,
  ShieldCheck,
  MapPin,
  ChevronRight,
  Sparkles,
  QrCode,
  CheckCircle2,
  Upload,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Staff, EmploymentStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { ManshiIdCard } from '../components/common/ManshiIdCard';
import { formatINR } from '../utils/salaryCalculator';
import { cloudinaryService } from '../services/cloudinaryService';
import { getTodayDateString } from '../utils/dateUtils';
import { EmptyState } from '../components/common/EmptyState';
import { counterService } from '../services/counterService';

export const StaffManagementPage: React.FC = () => {
  const {
    staff,
    work,
    salaries,
    settings,
    addStaff,
    updateStaff,
    deactivateStaff,
    reactivateStaff,
    deleteStaff,
    showToast,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Active Selected Staff
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form Fields
  const [formFullName, setFormFullName] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formDepartment, setFormDepartment] = useState('Operations');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAltPhone, setFormAltPhone] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState(getTodayDateString());
  const [formStatus, setFormStatus] = useState<EmploymentStatus>('active');
  const [formOfficeLocation, setFormOfficeLocation] = useState(settings.officeLocation);
  const [formMonthlySalary, setFormMonthlySalary] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formInitialPassword, setFormInitialPassword] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Emergency Contact Form Fields
  const [formEmName, setFormEmName] = useState('');
  const [formEmRelation, setFormEmRelation] = useState('');
  const [formEmPhone, setFormEmPhone] = useState('');

  // Bank Form Fields
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formIfscCode, setFormIfscCode] = useState('');
  const [formAccountHolder, setFormAccountHolder] = useState('');
  const [formUpiId, setFormUpiId] = useState('');

  // Notes
  const [formNotes, setFormNotes] = useState('');

  // Metrics
  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.status === 'active').length;
  const onLeaveStaff = staff.filter((s) => s.status === 'on_leave').length;
  const inactiveStaff = staff.filter((s) => s.status === 'inactive').length;
  const totalPayrollCommitment = staff
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.monthlyFixedSalary, 0);

  // Departments List
  const departments = Array.from(new Set(staff.map((s) => s.department)));

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.officialEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.designation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = departmentFilter === 'all' || s.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [staff, searchTerm, departmentFilter, statusFilter]);

  // Open Add Staff Form with auto-generated ID from persistent sequential counter
  const handleOpenAdd = async () => {
    setIsEditing(false);
    setSelectedStaff(null);
    setFormError('');

    // Fetch next sequential ID preview from persistent counter
    let previewId = 'MGS-...';
    try {
      previewId = await counterService.peekNextStaffId();
    } catch {
      previewId = 'MGS-101';
    }

    setFormFullName('');
    setFormEmployeeId(previewId);
    setFormDesignation('');
    setFormDepartment('Operations');
    setFormEmail('');
    setFormPhone('');
    setFormAltPhone('');
    setFormJoiningDate(getTodayDateString());
    setFormStatus('active');
    setFormOfficeLocation(settings.officeLocation);
    setFormMonthlySalary('');
    setFormAddress('');
    setFormAvatarUrl('');
    setFormInitialPassword(`Manshi@${previewId.replace(/[^a-zA-Z0-9]/g, '')}2026`);

    setFormEmName('');
    setFormEmRelation('');
    setFormEmPhone('');

    setFormBankName('');
    setFormAccountNumber('');
    setFormIfscCode('');
    setFormAccountHolder('');
    setFormUpiId('');
    setFormNotes('');

    setIsFormModalOpen(true);
  };

  // Upload photo to Cloudinary
  const handlePhotoUpload = async (file: File) => {
    try {
      setIsUploadingPhoto(true);
      setPhotoUploadProgress(0);
      const res = await cloudinaryService.uploadProfilePhoto(file, (p) => {
        setPhotoUploadProgress(p);
      });
      setFormAvatarUrl(res.secureUrl);
    } catch (err: any) {
      alert(err.message || 'Profile photo upload failed.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Open Edit Form
  const handleOpenEdit = (s: Staff) => {
    setIsEditing(true);
    setSelectedStaff(s);
    setFormError('');

    setFormFullName(s.fullName);
    setFormEmployeeId(s.employeeId);
    setFormDesignation(s.designation);
    setFormDepartment(s.department);
    setFormEmail(s.officialEmail);
    setFormPhone(s.contactNumber);
    setFormAltPhone(s.alternateContact || '');
    setFormJoiningDate(s.joiningDate);
    setFormStatus(s.status);
    setFormOfficeLocation(s.officeLocation);
    setFormMonthlySalary(s.monthlyFixedSalary.toString());
    setFormAddress(s.address);
    setFormAvatarUrl(s.avatarUrl || '');
    setFormInitialPassword('');

    setFormEmName(s.emergencyContact.name);
    setFormEmRelation(s.emergencyContact.relation);
    setFormEmPhone(s.emergencyContact.phone);

    setFormBankName(s.bankDetails.bankName);
    setFormAccountNumber(s.bankDetails.accountNumber);
    setFormIfscCode(s.bankDetails.ifscCode);
    setFormAccountHolder(s.bankDetails.accountHolder);
    setFormUpiId(s.bankDetails.upiId || '');
    setFormNotes(s.notes || '');

    setIsFormModalOpen(true);
  };

  // Submit Add / Edit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormSubmitting) return;
    if (!formFullName.trim() || !formEmail.trim() || !formMonthlySalary) return;

    setFormError('');
    setIsFormSubmitting(true);
    const salaryNumber = parseFloat(formMonthlySalary);

    try {
      if (isEditing && selectedStaff) {
        const updated: Staff = {
          ...selectedStaff,
          fullName: formFullName.trim(),
          employeeId: formEmployeeId.trim(),
          designation: formDesignation.trim(),
          department: formDepartment.trim(),
          officialEmail: formEmail.trim(),
          contactNumber: formPhone.trim(),
          alternateContact: formAltPhone.trim() ? formAltPhone.trim() : undefined,
          joiningDate: formJoiningDate,
          status: formStatus,
          officeLocation: formOfficeLocation.trim(),
          monthlyFixedSalary: salaryNumber,
          address: formAddress.trim(),
          avatarUrl: formAvatarUrl.trim() ? formAvatarUrl.trim() : (selectedStaff.avatarUrl || undefined),
          emergencyContact: {
            name: formEmName.trim(),
            relation: formEmRelation.trim(),
            phone: formEmPhone.trim(),
          },
          bankDetails: {
            bankName: formBankName.trim(),
            accountNumber: formAccountNumber.trim(),
            ifscCode: formIfscCode.trim(),
            accountHolder: formAccountHolder.trim() || formFullName.trim(),
            upiId: formUpiId.trim() ? formUpiId.trim() : undefined,
          },
          notes: formNotes.trim() ? formNotes.trim() : undefined,
        };
        await updateStaff(updated);
      } else {
        // Concurrency-safe atomic allocation of persistent sequential employee ID
        const allocatedId = await counterService.allocateNextStaffId();
        setFormEmployeeId(allocatedId);

        const newStaffItem: Staff = {
          id: `staff-${allocatedId.toLowerCase()}`,
          employeeId: allocatedId,
          fullName: formFullName.trim(),
          designation: formDesignation.trim(),
          department: formDepartment.trim(),
          officialEmail: formEmail.trim(),
          contactNumber: formPhone.trim(),
          alternateContact: formAltPhone.trim() ? formAltPhone.trim() : undefined,
          joiningDate: formJoiningDate,
          status: formStatus,
          officeLocation: formOfficeLocation.trim(),
          monthlyFixedSalary: salaryNumber,
          address: formAddress.trim(),
          avatarUrl: formAvatarUrl.trim() ? formAvatarUrl.trim() : undefined,
          emergencyContact: {
            name: formEmName.trim(),
            relation: formEmRelation.trim(),
            phone: formEmPhone.trim(),
          },
          bankDetails: {
            bankName: formBankName.trim(),
            accountNumber: formAccountNumber.trim(),
            ifscCode: formIfscCode.trim(),
            accountHolder: formAccountHolder.trim() || formFullName.trim(),
            upiId: formUpiId.trim() ? formUpiId.trim() : undefined,
          },
          documents: [],
          notes: formNotes.trim() ? formNotes.trim() : undefined,
        };

        const initialPasswordToUse = formInitialPassword.trim()
          ? formInitialPassword.trim()
          : `Manshi@${allocatedId.replace(/[^a-zA-Z0-9]/g, '')}2026`;

        await addStaff(newStaffItem, initialPasswordToUse);
      }

      setIsFormModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please review the form fields.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!selectedStaff) return;
    try {
      setIsProcessingAction(true);
      await deactivateStaff(selectedStaff.employeeId || selectedStaff.id);
      setIsDeactivateModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate staff account.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReactivateConfirm = async () => {
    if (!selectedStaff) return;
    try {
      setIsProcessingAction(true);
      await reactivateStaff(selectedStaff.employeeId || selectedStaff.id);
      setIsReactivateModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to reactivate staff account.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return;
    try {
      setIsProcessingAction(true);
      await deleteStaff(selectedStaff.employeeId || selectedStaff.id);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete staff account.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Staff & Employee Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
              Corporate HRMS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain employee dossiers, corporate ID badges, KYC records, and fixed salary commitments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-200/80 dark:bg-navy-800 p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Employee Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Staff Table
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Enrolled</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalStaff}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Corporate roster</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Active Staff</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeStaff}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Full duty active</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">On Leave</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {onLeaveStaff}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Approved absence</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Inactive</div>
          <div className="text-2xl font-extrabold text-slate-400 mt-1">
            {inactiveStaff}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Preserved records</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Monthly Payroll</div>
          <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
            {formatINR(totalPayrollCommitment)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Fixed gross base</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees by name, ID (e.g. MGS-101), email, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: Employee Cards */}
      {viewMode === 'cards' && (
        filteredStaff.length === 0 ? (
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-8 border border-slate-200 dark:border-navy-800 shadow-xs">
            <EmptyState
              icon={Users2}
              title="No Employees Found"
              description={
                staff.length === 0
                  ? "No staff members have been registered yet. Add your first employee to get started."
                  : "No staff members match the selected department, status, or search query."
              }
              primaryActionLabel={staff.length === 0 ? "Add New Employee" : undefined}
              onPrimaryAction={staff.length === 0 ? handleOpenAdd : undefined}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredStaff.map((emp) => {
            const isInactive = emp.status === 'inactive';
            const statusVariants = {
              active: 'emerald' as const,
              on_leave: 'amber' as const,
              inactive: 'slate' as const,
            };

            return (
              <div
                key={emp.employeeId || emp.id}
                className={`bg-white dark:bg-navy-900 rounded-3xl p-6 border shadow-xs transition-all relative flex flex-col justify-between ${
                  isInactive
                    ? 'opacity-65 border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40'
                    : 'border-slate-200 dark:border-navy-800 hover:shadow-xl hover:border-brand-500/50'
                }`}
              >
                <div>
                  {/* Card Header with Status & ID */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-200/50 dark:border-brand-900/50">
                      {emp.employeeId}
                    </span>
                    <Badge variant={statusVariants[emp.status]} size="sm" dot>
                      {emp.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  {/* Profile Avatar & Name */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-navy-800 overflow-hidden border border-slate-200 dark:border-navy-700 shrink-0 shadow-xs">
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt={emp.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-lg text-slate-700 dark:text-slate-300">
                          {emp.fullName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                        {emp.fullName}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                        {emp.designation}
                      </p>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {emp.department}
                      </span>
                    </div>
                  </div>

                  {/* Key Info Pill */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/50 border border-slate-200/70 dark:border-navy-800/70 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fixed Monthly:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {formatINR(emp.monthlyFixedSalary)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Joined:</span>
                      <span>{emp.joiningDate}</span>
                    </div>
                    <div className="flex items-center justify-between truncate">
                      <span className="text-slate-400">Contact:</span>
                      <span className="font-mono text-[11px]">{emp.contactNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedStaff(emp);
                      setIsProfileModalOpen(true);
                    }}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    View Dossier <ChevronRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedStaff(emp);
                        setIsIdCardModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                      title="Generate ID Badge"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {emp.status === 'inactive' ? (
                      <button
                        onClick={() => {
                          setSelectedStaff(emp);
                          setIsReactivateModalOpen(true);
                        }}
                        className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        title="Reactivate Staff Account"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedStaff(emp);
                          setIsDeactivateModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        title="Deactivate Staff Account"
                      >
                        <PowerOff className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedStaff(emp);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Staff Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* VIEW 2: Staff Table */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Email & Phone</th>
                  <th className="px-5 py-3.5">Joining Date</th>
                  <th className="px-5 py-3.5 text-right">Fixed Monthly</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <EmptyState
                        icon={Users2}
                        title="No Employees Found"
                        description={
                          staff.length === 0
                            ? "No staff members have been registered yet. Add your first employee to get started."
                            : "No staff members match the selected department, status, or search query."
                        }
                        primaryActionLabel={staff.length === 0 ? "Add New Employee" : undefined}
                        onPrimaryAction={staff.length === 0 ? handleOpenAdd : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((emp) => {
                  const statusVariants = {
                    active: 'emerald' as const,
                    on_leave: 'amber' as const,
                    inactive: 'slate' as const,
                  };

                  return (
                    <tr
                      key={emp.employeeId || emp.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-navy-800/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                            {emp.avatarUrl ? (
                              <img
                                src={emp.avatarUrl}
                                alt={emp.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              emp.fullName.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {emp.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {emp.employeeId} • {emp.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                        {emp.department}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200">{emp.officialEmail}</div>
                        <div className="text-[10px] font-mono text-slate-400">{emp.contactNumber}</div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                        {emp.joiningDate}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right font-extrabold text-slate-900 dark:text-white">
                        {formatINR(emp.monthlyFixedSalary)}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Badge variant={statusVariants[emp.status]} size="sm" dot>
                          {emp.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedStaff(emp);
                              setIsProfileModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                            title="View Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStaff(emp);
                              setIsIdCardModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/40"
                            title="Print ID Card"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {emp.status === 'inactive' ? (
                            <button
                              onClick={() => {
                                setSelectedStaff(emp);
                                setIsReactivateModalOpen(true);
                              }}
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Reactivate Staff Account"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedStaff(emp);
                                setIsDeactivateModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title="Deactivate Staff Account"
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedStaff(emp);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete Staff Account"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* ADD / EDIT STAFF MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={isEditing ? 'Edit Employee Details' : 'Enroll New Staff Member'}
        subtitle="Complete employee profile and payroll configuration"
        maxWidth="4xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {formError}
            </div>
          )}

          {/* Section 1: Employment Profile */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b border-slate-100 dark:border-navy-800 pb-1">
              1. General & Employment Profile
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Verma"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-500">
                    Employee ID *
                  </label>
                  <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-900">
                    {isEditing ? 'Immutable' : 'Sequential Counter'}
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={formEmployeeId}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-950 text-xs font-mono font-bold text-brand-600 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isEditing
                    ? 'Employee ID is permanent and cannot be altered.'
                    : 'Sequentially generated & non-reusable. Will never be duplicated or re-issued.'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accounts Executive"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Department *
                </label>
                <select
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
                >
                  <option value="Operations">Operations</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Client Relations">Client Relations</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="IT & Infrastructure">IT & Infrastructure</option>
                  <option value="Executive Office">Executive Office</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Joining Date *
                </label>
                <input
                  type="date"
                  required
                  value={formJoiningDate}
                  onChange={(e) => setFormJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Employment Status *
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
                >
                  <option value="active">Active Duty</option>
                  <option value="on_leave">On Approved Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Monthly Fixed Salary (INR ₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  placeholder="e.g. 30000"
                  value={formMonthlySalary}
                  onChange={(e) => setFormMonthlySalary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold text-brand-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  30-day salary basis daily rate = ₹{Math.round((parseFloat(formMonthlySalary || '0') / 30))} / day
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Office Location
                </label>
                <input
                  type="text"
                  value={formOfficeLocation}
                  onChange={(e) => setFormOfficeLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Profile Photo (Cloudinary)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Photo URL or upload via Cloudinary..."
                    value={formAvatarUrl}
                    onChange={(e) => setFormAvatarUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                  />
                  <label className="px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                    {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploadingPhoto ? `${photoUploadProgress}%` : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Address */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b border-slate-100 dark:border-navy-800 pb-1">
              2. Official Contact & Address
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@manshigroup.in"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Contact Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98112 00000"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Alternate Contact
                </label>
                <input
                  type="text"
                  placeholder="+91 98112 11111"
                  value={formAltPhone}
                  onChange={(e) => setFormAltPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Residential Address *
              </label>
              <input
                type="text"
                placeholder="House / Flat No., Sector, City, State and Pincode"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            {!isEditing && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Initial Staff Login Password (Firebase Authentication) *
                  </label>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Min 6 characters</span>
                </div>
                <input
                  type="text"
                  required
                  value={formInitialPassword}
                  onChange={(e) => setFormInitialPassword(e.target.value)}
                  placeholder="e.g. Manshi@MGS1092026"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-navy-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-amber-700 dark:text-amber-400 block">
                  This password will be securely provisioned in Firebase Auth so the staff member can sign into the Staff Portal.
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Emergency Contact & Bank Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Emergency Contact */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 space-y-2.5">
              <div className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">
                Emergency Contact
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Contact Name"
                  value={formEmName}
                  onChange={(e) => setFormEmName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Relation</label>
                  <input
                    type="text"
                    placeholder="Spouse / Parent"
                    value={formEmRelation}
                    onChange={(e) => setFormEmRelation(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98112..."
                    value={formEmPhone}
                    onChange={(e) => setFormEmPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bank Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 space-y-2.5">
              <div className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">
                Bank & Payment Details
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    placeholder="HDFC Bank"
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-0.5">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="HDFC0001202"
                    value={formIfscCode}
                    onChange={(e) => setFormIfscCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Account Number</label>
                <input
                  type="text"
                  placeholder="50100458923..."
                  value={formAccountNumber}
                  onChange={(e) => setFormAccountNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Internal Admin Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Key client accounts manager, special clearance"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              type="button"
              disabled={isFormSubmitting}
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 rounded-xl shadow-md transition-all"
            >
              {isFormSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isFormSubmitting ? (isEditing ? 'Saving...' : 'Provisioning Account...') : (isEditing ? 'Save Staff Changes' : 'Enroll Staff Member')}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW COMPLETE STAFF PROFILE MODAL */}
      {selectedStaff && (
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title={`Staff Profile: ${selectedStaff.fullName}`}
          subtitle={`${selectedStaff.employeeId} · ${selectedStaff.designation}`}
          maxWidth="4xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header Identity Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
              <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-navy-800 overflow-hidden border border-slate-300 dark:border-navy-700 shrink-0">
                {selectedStaff.avatarUrl ? (
                  <img
                    src={selectedStaff.avatarUrl}
                    alt={selectedStaff.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-2xl text-slate-700 dark:text-slate-300">
                    {selectedStaff.fullName.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {selectedStaff.fullName}
                  </h3>
                  <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">
                    {selectedStaff.employeeId}
                  </span>
                  <Badge
                    variant={selectedStaff.status === 'active' ? 'emerald' : 'slate'}
                    size="sm"
                    dot
                  >
                    {selectedStaff.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-semibold text-xs">
                  {selectedStaff.designation} • {selectedStaff.department}
                </p>
                <p className="text-slate-400 text-[11px] mt-1">
                  Joined {selectedStaff.joiningDate} • {selectedStaff.officeLocation}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Fixed Monthly Salary
                </span>
                <div className="text-xl font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                  {formatINR(selectedStaff.monthlyFixedSalary)}
                </div>
              </div>
            </div>

            {/* Dossier Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Information */}
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Official Communication
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Official Email:</span>{' '}
                  <span className="text-slate-900 dark:text-white font-medium">{selectedStaff.officialEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Contact Number:</span>{' '}
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{selectedStaff.contactNumber}</span>
                </div>
                {selectedStaff.alternateContact && (
                  <div>
                    <span className="text-slate-500 font-semibold">Alternate Phone:</span>{' '}
                    <span className="font-mono">{selectedStaff.alternateContact}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 font-semibold">Residential Address:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{selectedStaff.address}</span>
                </div>
              </div>

              {/* Bank & Remittance Information */}
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Bank & Payroll Remittance
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Bank Name:</span>{' '}
                  <span className="text-slate-900 dark:text-white font-bold">{selectedStaff.bankDetails.bankName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Account Number:</span>{' '}
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{selectedStaff.bankDetails.accountNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">IFSC Code:</span>{' '}
                  <span className="font-mono text-slate-900 dark:text-white">{selectedStaff.bankDetails.ifscCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Account Beneficiary:</span>{' '}
                  <span>{selectedStaff.bankDetails.accountHolder}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact & Verified Documents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Emergency Relative Contact
                </div>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                  {selectedStaff.emergencyContact.name} ({selectedStaff.emergencyContact.relation})
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-400 mt-1">
                  Phone: {selectedStaff.emergencyContact.phone}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Uploaded & Verified Documents
                </div>
                <div className="space-y-1.5">
                  {selectedStaff.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-brand-600" />
                        <span className="truncate">{doc.name}</span>
                      </div>
                      <Badge variant="emerald" size="sm">
                        VERIFIED
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedStaff.notes && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                <strong>Admin Dossier Notes:</strong> {selectedStaff.notes}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setIsIdCardModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-800 dark:text-slate-200 font-bold"
              >
                <CreditCard className="w-4 h-4" />
                Preview ID Badge
              </button>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINTABLE EMPLOYEE ID BADGE MODAL (Manshi Group Of Services Exact Recreation) */}
      {selectedStaff && (
        <Modal
          isOpen={isIdCardModalOpen}
          onClose={() => setIsIdCardModalOpen(false)}
          title="Manshi Group Of Services — Official Identity Card"
          subtitle={`${selectedStaff.fullName} · ${selectedStaff.employeeId} · ${selectedStaff.designation}`}
          maxWidth="4xl"
        >
          <div className="py-2">
            <ManshiIdCard staff={selectedStaff} />
          </div>
        </Modal>
      )}

      {/* DEACTIVATE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate Staff Account"
        message={`Are you sure you want to deactivate ${selectedStaff?.fullName} (${selectedStaff?.employeeId})? This will immediately disable their login access to the Staff Portal. Historical attendance records, past salary calculations, and expense filings will remain safely preserved.`}
        confirmText="Deactivate Account"
        variant="warning"
        isLoading={isProcessingAction}
      />

      {/* REACTIVATE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isReactivateModalOpen}
        onClose={() => setIsReactivateModalOpen(false)}
        onConfirm={handleReactivateConfirm}
        title="Reactivate Staff Account"
        message={`Are you sure you want to reactivate ${selectedStaff?.fullName} (${selectedStaff?.employeeId})? This will restore their active status and re-enable their login access to the Staff Portal.`}
        confirmText="Reactivate Account"
        variant="success"
        isLoading={isProcessingAction}
      />

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Staff Account"
        message={`Are you sure you want to permanently delete the staff account for ${selectedStaff?.fullName} (${selectedStaff?.employeeId})? Their staff directory profile and Firebase login credentials will be removed. All historical attendance logs, payroll calculations, expense claims, and task history will be preserved.`}
        confirmText="Delete Account Permanently"
        variant="danger"
        isLoading={isProcessingAction}
      />
    </div>
  );
};
