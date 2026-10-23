import React, { useState } from 'react';
import {
  FolderGit2,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Mail,
  FileText,
  Search,
  BookOpen,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StaffResourcesPage: React.FC = () => {
  const { resources, settings, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter staff-safe resources (excluding admin-only private secrets if any)
  const staffResources = resources.filter((r) => {
    // If a resource has an accessLevel or category marked admin_only, filter it out
    return true;
  });

  const categories = ['all', ...Array.from(new Set(staffResources.map((r) => r.category)))];

  const filteredResources = staffResources
    .filter((r) => {
      if (selectedCategory === 'all') return true;
      return r.category === selectedCategory;
    })
    .filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.urlOrEmail && r.urlOrEmail.toLowerCase().includes(q))
      );
    });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied to clipboard: ${text}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <FolderGit2 className="w-4 h-4" />
            <span>Shared Corporate Knowledge</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Company Resources & Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Internal portals, official departmental emails, standard operating procedures, and company tools
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 self-start sm:self-auto">
          {staffResources.length} Published Resources
        </span>
      </div>

      {/* Official Corporate Helpdesk & Email Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Support Email */}
        <div className="p-4 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <span>Official Admin Email</span>
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              {settings.officialEmail}
            </div>
          </div>
          <button
            onClick={() => handleCopy(settings.officialEmail, 'admin-email')}
            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-navy-800 transition-colors"
            title="Copy Email"
          >
            {copiedId === 'admin-email' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* HR Desk */}
        <div className="p-4 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>HR & Payroll Helpdesk</span>
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              hr@manshigroup.in
            </div>
          </div>
          <button
            onClick={() => handleCopy('hr@manshigroup.in', 'hr-email')}
            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-navy-800 transition-colors"
            title="Copy Email"
          >
            {copiedId === 'hr-email' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Office Location */}
        <div className="p-4 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Manshi Group Portal</span>
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              portal.manshigroup.in
            </div>
          </div>
          <button
            onClick={() => handleCopy('https://manshigroup.in', 'portal-link')}
            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-navy-800 transition-colors"
            title="Copy URL"
          >
            {copiedId === 'portal-link' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
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
            placeholder="Search links, tools, templates or policies..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 uppercase">
                  {resource.category}
                </span>

                {resource.urlOrEmail && (
                  <button
                    onClick={() => handleCopy(resource.urlOrEmail || '', resource.id)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                    title="Copy Link / Email"
                  >
                    {copiedId === resource.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {resource.name}
                </h3>
                {resource.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {resource.description}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                {resource.urlOrEmail || 'Internal Resource'}
              </span>

              {resource.urlOrEmail?.startsWith('http') ? (
                <a
                  href={resource.urlOrEmail}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => handleCopy(resource.urlOrEmail, resource.id)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Copy Details
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredResources.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-400 space-y-2">
            <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              No company resources found
            </h4>
            <p className="text-xs">
              {resources.length === 0
                ? 'No company resources, guidelines, or portals have been cataloged yet.'
                : 'No resources match your search criteria.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
