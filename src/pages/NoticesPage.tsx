import React, { useState, useMemo } from 'react';
import {
  BellRing,
  Plus,
  Search,
  Filter,
  Pin,
  Calendar,
  AlertTriangle,
  Users,
  Paperclip,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Upload,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Notice, NoticeCategory, NoticePriority, NoticeStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { cloudinaryService } from '../services/cloudinaryService';
import { getTodayDateString } from '../utils/dateUtils';
import { EmptyState } from '../components/common/EmptyState';

export const NoticesPage: React.FC = () => {
  const { notices, staff, settings, addNotice, updateNotice, deleteNotice } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active Notice
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<NoticeCategory>('General');
  const [formPriority, setFormPriority] = useState<NoticePriority>('medium');
  const [formPublishDate, setFormPublishDate] = useState(getTodayDateString());
  const [formExpiryDate, setFormExpiryDate] = useState('2026-11-20');
  const [formTargetAudience, setFormTargetAudience] = useState<'all' | 'specific'>('all');
  const [formTargetStaffIds, setFormTargetStaffIds] = useState<string[]>([]);
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formStatus, setFormStatus] = useState<NoticeStatus>('published');
  const [formAttachment, setFormAttachment] = useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleNoticeFileUpload = async (file: File) => {
    try {
      setIsUploadingAttachment(true);
      setUploadProgress(0);
      const res = await cloudinaryService.uploadFile(file, {
        folder: 'manshi-setu/shared-documents',
        onProgress: (p) => setUploadProgress(p),
      });
      setFormAttachment(res.secureUrl);
    } catch (err: any) {
      alert(err.message || 'Attachment upload failed');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  // Metrics
  const totalNotices = notices.length;
  const publishedNotices = notices.filter((n) => n.status === 'published').length;
  const draftNotices = notices.filter((n) => n.status === 'draft').length;
  const pinnedNotices = notices.filter((n) => n.isPinned).length;

  // Filtered List
  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const matchesSearch =
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'all' || notice.category === selectedCategory;
      const matchesPri = selectedPriority === 'all' || notice.priority === selectedPriority;
      const matchesStat = selectedStatus === 'all' || notice.status === selectedStatus;

      return matchesSearch && matchesCat && matchesPri && matchesStat;
    });
  }, [notices, searchTerm, selectedCategory, selectedPriority, selectedStatus]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('General');
    setFormPriority('medium');
    setFormPublishDate(getTodayDateString());
    setFormExpiryDate('2026-11-20');
    setFormTargetAudience('all');
    setFormTargetStaffIds([]);
    setFormIsPinned(false);
    setFormStatus('published');
    setFormAttachment('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (notice: Notice) => {
    setActiveNotice(notice);
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setFormCategory(notice.category);
    setFormPriority(notice.priority);
    setFormPublishDate(notice.publishDate);
    setFormExpiryDate(notice.expiryDate);
    setFormTargetAudience(notice.targetAudience);
    setFormTargetStaffIds(notice.targetStaffIds || []);
    setFormIsPinned(notice.isPinned);
    setFormStatus(notice.status);
    setFormAttachment(notice.attachmentName || '');
    setIsEditModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    const newNotice: Notice = {
      id: `not-${Date.now()}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      publishDate: formPublishDate,
      expiryDate: formExpiryDate,
      priority: formPriority,
      targetAudience: formTargetAudience,
      targetStaffIds: formTargetAudience === 'specific' ? formTargetStaffIds : undefined,
      isPinned: formIsPinned,
      status: formStatus,
      attachmentName: formAttachment.trim() || undefined,
      createdBy: settings.adminName,
    };

    addNotice(newNotice);
    setIsCreateModalOpen(false);
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotice || !formTitle.trim() || !formContent.trim()) return;

    const updated: Notice = {
      ...activeNotice,
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      publishDate: formPublishDate,
      expiryDate: formExpiryDate,
      priority: formPriority,
      targetAudience: formTargetAudience,
      targetStaffIds: formTargetAudience === 'specific' ? formTargetStaffIds : undefined,
      isPinned: formIsPinned,
      status: formStatus,
      attachmentName: formAttachment.trim() || undefined,
    };

    updateNotice(updated);
    setIsEditModalOpen(false);
  };

  // Toggle Pin directly
  const handleTogglePin = (notice: Notice) => {
    updateNotice({
      ...notice,
      isPinned: !notice.isPinned,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Company Notice Board
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
              Official Bulletins
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publish official policies, holiday advisories, and administrative instructions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Create New Notice
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Notices</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalNotices}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Board records</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Published</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {publishedNotices}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Active on dashboard</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Draft Notices</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {draftNotices}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Unpublished</div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Pinned Important</div>
          <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
            {pinnedNotices}
          </div>
          <div className="text-[11px] text-brand-600 font-semibold mt-0.5">Top priority circulars</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search circulars by title, subject, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            <option value="General">General</option>
            <option value="Policy">Policy</option>
            <option value="Urgent">Urgent</option>
            <option value="Event">Event</option>
            <option value="Holiday">Holiday</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNotices.map((notice) => {
          const isDraft = notice.status === 'draft';
          const priorityVariants = {
            urgent: 'rose' as const,
            high: 'amber' as const,
            medium: 'blue' as const,
            low: 'slate' as const,
          };

          return (
            <div
              key={notice.id}
              className={`bg-white dark:bg-navy-900 rounded-3xl p-6 border shadow-xs transition-all relative flex flex-col justify-between ${
                notice.isPinned
                  ? 'border-brand-300 dark:border-brand-800/80 ring-1 ring-brand-500/30'
                  : 'border-slate-200 dark:border-navy-800 hover:border-slate-300'
              } ${isDraft ? 'opacity-80 bg-slate-50/50 dark:bg-navy-950/40' : ''}`}
            >
              <div>
                {/* Header Pills */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="slate" size="sm">
                      {notice.category}
                    </Badge>
                    <Badge variant={priorityVariants[notice.priority]} size="sm">
                      {notice.priority.toUpperCase()}
                    </Badge>
                    {isDraft ? (
                      <Badge variant="amber" size="sm">
                        DRAFT
                      </Badge>
                    ) : (
                      <Badge variant="emerald" size="sm" dot>
                        LIVE
                      </Badge>
                    )}
                  </div>

                  <button
                    onClick={() => handleTogglePin(notice)}
                    title={notice.isPinned ? 'Unpin Notice' : 'Pin to Top'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      notice.isPinned
                        ? 'text-brand-600 bg-brand-50 dark:bg-brand-950'
                        : 'text-slate-300 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    <Pin className={`w-4 h-4 ${notice.isPinned ? 'rotate-45' : ''}`} />
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2">
                  {notice.title}
                </h3>

                {/* Content */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4 leading-relaxed mb-4">
                  {notice.content}
                </p>
              </div>

              <div>
                {/* Attachment or Target */}
                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 text-[11px] text-slate-400 flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{notice.publishDate}</span>
                  </div>

                  <div className="flex items-center gap-1 truncate font-medium text-slate-600 dark:text-slate-400">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>{notice.targetAudience === 'all' ? 'All Staff' : 'Selected Staff'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-navy-800">
                  <button
                    onClick={() => {
                      setActiveNotice(notice);
                      setIsDetailModalOpen(true);
                    }}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    Read Full Notice
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(notice)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveNotice(notice);
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
            </div>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="col-span-full bg-white dark:bg-navy-900 rounded-3xl p-8 border border-slate-200 dark:border-navy-800 shadow-xs">
            <EmptyState
              icon={BellRing}
              title="No Notices or Circulars"
              description={
                notices.length === 0
                  ? "No company notices or announcements published yet."
                  : "No notices match your current filters or search term."
              }
              primaryActionLabel={notices.length === 0 ? "Create Notice" : undefined}
              onPrimaryAction={notices.length === 0 ? handleOpenCreate : undefined}
            />
          </div>
        )}
      </div>

      {/* CREATE NOTICE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Company Notice"
        subtitle="Broadcast an announcement to staff"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mandatory Annual Health Checkup & Executive Camp"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
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
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
              >
                <option value="published">Published (Active)</option>
                <option value="draft">Save as Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Publish Date
              </label>
              <input
                type="date"
                required
                value={formPublishDate}
                onChange={(e) => setFormPublishDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                required
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Target Audience
            </label>
            <div className="flex items-center gap-4 py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="audience"
                  checked={formTargetAudience === 'all'}
                  onChange={() => setFormTargetAudience('all')}
                  className="text-brand-600"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  All Office Staff Members
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="audience"
                  checked={formTargetAudience === 'specific'}
                  onChange={() => setFormTargetAudience('specific')}
                  className="text-brand-600"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Specific Staff Members Only
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Circular Description & Content *
            </label>
            <textarea
              rows={5}
              required
              placeholder="State full circular details, mandatory instructions, and effective dates..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Document Attachment (Cloudinary)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="URL or upload circular/policy doc..."
                  value={formAttachment}
                  onChange={(e) => setFormAttachment(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
                <label className="px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                  {isUploadingAttachment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploadingAttachment ? `${uploadProgress}%` : 'Upload'}</span>
                  <input
                    type="file"
                    disabled={isUploadingAttachment}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleNoticeFileUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded text-brand-600 w-4 h-4"
                />
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Pin this notice to top of board & dashboard
                </span>
              </label>
            </div>
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Post Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT NOTICE MODAL */}
      {activeNotice && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Company Notice"
          subtitle={`Editing notice #${activeNotice.id}`}
          maxWidth="3xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Notice Title *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
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
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Content
              </label>
              <textarea
                rows={5}
                required
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded text-brand-600 w-4 h-4"
                />
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Pin notice to top
                </span>
              </label>
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
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DETAIL MODAL */}
      {activeNotice && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={activeNotice.title}
          subtitle={`Published ${activeNotice.publishDate} · ${activeNotice.category}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="slate" size="sm">
                Category: {activeNotice.category}
              </Badge>
              <Badge variant="rose" size="sm">
                Priority: {activeNotice.priority.toUpperCase()}
              </Badge>
              {activeNotice.isPinned && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700">
                  PINNED CIRCULAR
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800 text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
              {activeNotice.content}
            </div>

            {activeNotice.attachmentName && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-600 font-bold">
                  <Paperclip className="w-4 h-4" />
                  <span>{activeNotice.attachmentName}</span>
                </div>
                <span className="text-[10px] text-slate-400">Official Annexure</span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between">
              <span>Issued By: {activeNotice.createdBy}</span>
              <span>Expires: {activeNotice.expiryDate}</span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (activeNotice) deleteNotice(activeNotice.id);
        }}
        title="Delete Notice"
        message={`Are you sure you want to remove "${activeNotice?.title}" from the notice board?`}
        confirmText="Delete Notice"
        isDestructive={true}
      />
    </div>
  );
};
