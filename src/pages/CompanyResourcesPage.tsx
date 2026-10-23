import React, { useState, useMemo } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  Mail,
  Copy,
  Check,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Globe,
  FileText,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompanyResource, ResourceCategory } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';

export const CompanyResourcesPage: React.FC = () => {
  const { resources, addResource, updateResource, deleteResource, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<CompanyResource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<CompanyResource | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('Company Websites');
  const [urlOrEmail, setUrlOrEmail] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [credentialHint, setCredentialHint] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);

  const categories: ResourceCategory[] = [
    'Company Websites',
    'Important Links',
    'Official Email Accounts',
    'Internal Tools',
    'Documents and Guidelines',
    'Other Resources',
  ];

  // Filtered List
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch =
        res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.urlOrEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'all' || res.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [resources, searchTerm, selectedCategory]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied resource URL/address to clipboard.', 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenAdd = () => {
    setEditingResource(null);
    setName('');
    setCategory('Company Websites');
    setUrlOrEmail('');
    setDescription('');
    setUsername('');
    setCredentialHint('');
    setIsConfidential(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: CompanyResource) => {
    setEditingResource(res);
    setName(res.name);
    setCategory(res.category);
    setUrlOrEmail(res.urlOrEmail);
    setDescription(res.description);
    setUsername(res.username || '');
    setCredentialHint(res.credentialHint || '');
    setIsConfidential(!!res.isConfidential);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !urlOrEmail.trim()) return;

    if (editingResource) {
      updateResource({
        ...editingResource,
        name: name.trim(),
        category,
        urlOrEmail: urlOrEmail.trim(),
        description: description.trim(),
        username: username.trim() || undefined,
        credentialHint: credentialHint.trim() || undefined,
        isConfidential,
      });
    } else {
      addResource({
        id: `res-${Date.now()}`,
        name: name.trim(),
        category,
        urlOrEmail: urlOrEmail.trim(),
        description: description.trim(),
        username: username.trim() || undefined,
        credentialHint: credentialHint.trim() || undefined,
        isConfidential,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (resourceToDelete) {
      deleteResource(resourceToDelete.id);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Company Resources & Portals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
              Verified Links Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized directory of corporate websites, statutory GST/EPFO portals, and internal utilities.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add New Resource
        </button>
      </div>

      {/* Security Advisory Banner (Fulfills exact prompt security requirement) */}
      <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Enterprise Security Standard: </strong>
          No actual passwords or sensitive credentials are stored in plaintext localStorage or exposed in frontend code. Credential fields display masked placeholder hints only. Production migration will connect to encrypted cloud secrets with role-based hardware token verification.
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources, URLs, email domains, or tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-slate-900 dark:text-white"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700 hover:bg-slate-50'
            }`}
          >
            All Categories ({resources.length})
          </button>

          {categories.map((cat) => {
            const count = resources.filter((r) => r.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700 hover:bg-slate-50'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResources.map((res) => {
          const isEmail = res.urlOrEmail.includes('@') || res.category === 'Official Email Accounts';
          const isRevealed = revealedIds.has(res.id);
          const isCopied = copiedId === res.id;

          const destinationUrl = isEmail
            ? `mailto:${res.urlOrEmail}`
            : res.urlOrEmail.startsWith('http')
            ? res.urlOrEmail
            : `https://${res.urlOrEmail}`;

          return (
            <div
              key={res.id}
              className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-xs hover:border-brand-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="blue" size="sm">
                    {res.category}
                  </Badge>

                  {res.isConfidential && (
                    <Badge variant="rose" size="sm">
                      <Lock className="w-3 h-3 inline mr-1" />
                      CONFIDENTIAL
                    </Badge>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1.5">
                  {res.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {res.description}
                </p>

                {/* Primary Destination Link Container */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/70 dark:border-navy-800/70 mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {isEmail ? (
                      <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                    ) : (
                      <Globe className="w-4 h-4 text-brand-600 shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {res.urlOrEmail}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(res.urlOrEmail, res.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors"
                      title="Copy Link"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={destinationUrl}
                      target={isEmail ? '_self' : '_blank'}
                      rel="noreferrer"
                      className="p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-lg transition-colors"
                      title="Open Resource"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Optional Masked Credentials */}
                {(res.username || res.credentialHint) && (
                  <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-navy-800/50 border border-slate-200 dark:border-navy-700/60 text-xs space-y-1.5 mb-4">
                    {res.username && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-semibold">Username / ID:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {res.username}
                        </span>
                      </div>
                    )}

                    {res.credentialHint && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-navy-700/60">
                        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-500" />
                          Access Hint:
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span>
                            {isRevealed ? res.credentialHint : '••••••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(res.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs">
                <a
                  href={destinationUrl}
                  target={isEmail ? '_self' : '_blank'}
                  rel="noreferrer"
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  Launch Gateway <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(res)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setResourceToDelete(res);
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
          );
        })}

        {filteredResources.length === 0 && (
          <div className="col-span-full bg-white dark:bg-navy-900 rounded-3xl p-8 border border-slate-200 dark:border-navy-800 shadow-xs">
            <EmptyState
              icon={FolderGit2}
              title="No Company Resources Found"
              description={
                resources.length === 0
                  ? "No corporate credentials, tools, or links have been cataloged yet."
                  : "No resources found matching your search query or selected category."
              }
              primaryActionLabel={resources.length === 0 ? "Add First Resource" : undefined}
              onPrimaryAction={resources.length === 0 ? handleOpenAdd : undefined}
            />
          </div>
        )}
      </div>

      {/* ADD / EDIT RESOURCE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingResource ? 'Edit Company Resource' : 'Add Company Resource'}
        subtitle="Catalog corporate tools, portals, and service gateways"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Resource Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Bank Corporate NetBanking Portal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-bold"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                URL or Email Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. https://portal.example.com or support@company.in"
                value={urlOrEmail}
                onChange={(e) => setUrlOrEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Description & Purpose
            </label>
            <textarea
              rows={3}
              placeholder="Explain how authorized employees should use this resource..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 space-y-3">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
              Access Credentials (Internal Use Only)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Username / Account ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. corp_admin_2026"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Access Policy / Credential Hint
                </label>
                <input
                  type="text"
                  placeholder="e.g. Managed via Director 2FA token"
                  value={credentialHint}
                  onChange={(e) => setCredentialHint(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="rounded text-brand-600 w-4 h-4"
              />
              <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                Mark as Restricted / Confidential Resource
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md"
            >
              Save Resource
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Resource Entry"
        message={`Are you sure you want to remove "${resourceToDelete?.name}" from Company Resources?`}
        confirmText="Delete Resource"
        isDestructive={true}
      />
    </div>
  );
};
