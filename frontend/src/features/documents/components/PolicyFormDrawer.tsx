import React, { useState, useEffect } from 'react';
import type { Policy, CreatePolicyPayload } from '../queries/useDocuments';

type PolicyFormDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePolicyPayload) => Promise<void>;
  initialData?: Policy | null;
  isSubmitting?: boolean;
};

export const PolicyFormDrawer: React.FC<PolicyFormDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'compliance' | 'security' | 'workplace' | 'hr'>('hr');
  const [version, setVersion] = useState('1.0');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCode(initialData.code);
      setCategory(
        (['compliance', 'security', 'workplace', 'hr'].includes(initialData.category)
          ? initialData.category
          : 'hr') as any,
      );
      setVersion(initialData.version || '1.0');
      setSummary(initialData.summary || '');
      setContent(initialData.content || '');
      setIsMandatory(initialData.isMandatory);
      setEffectiveDate(initialData.effectiveDate ? initialData.effectiveDate.slice(0, 10) : '');
    } else {
      setTitle('');
      setCode('HR-POL-');
      setCategory('hr');
      setVersion('1.0');
      setSummary('');
      setContent(
        '# Policy Overview\n\nThis policy establishes mandatory operational procedures and expectations for all employees.\n\n## 1. Objectives\n\n- Ensure workplace compliance and safety\n- Outline employee rights and obligations\n\n## 2. Guidelines\n\nAll team members are expected to uphold the principles described herein.',
      );
      setIsMandatory(true);
      setEffectiveDate(new Date().toISOString().slice(0, 10));
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Policy title is required');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('Policy code is required');
      return;
    }
    if (!summary.trim()) {
      setErrorMessage('Summary is required');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Content is required');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        code: code.trim().toUpperCase(),
        category,
        version: version.trim() || '1.0',
        summary: summary.trim(),
        content: content.trim(),
        isMandatory,
        effectiveDate: effectiveDate || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error || err.message || 'Failed to save policy document',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-bg border-l border-line shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {initialData ? 'Edit Document' : 'New Policy'}
              </span>
              <h2 className="font-serif text-xl font-bold text-ink mt-0.5 mb-0">
                {initialData ? initialData.title : 'Publish Company Policy'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-line bg-transparent text-ink-soft hover:text-ink hover:bg-bg-raised transition-colors flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-over-red text-xs">
                {errorMessage}
              </div>
            )}

            {/* Title & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Policy Title <span className="text-over-red">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Information Security & Data Protection Policy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs placeholder:text-ink-soft/60 focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Policy Code <span className="text-over-red">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SEC-002"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-bg text-ink text-xs font-mono uppercase focus:outline-none focus:border-accent"
                  required
                />
              </div>
            </div>

            {/* Category & Version & Effective Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent capitalize"
                >
                  <option value="compliance">Compliance</option>
                  <option value="security">Security</option>
                  <option value="workplace">Workplace</option>
                  <option value="hr">Human Resources</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.0 or 2.1"
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-line bg-bg text-ink text-xs focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Mandatory Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-bg-raised/40">
              <div>
                <span className="text-xs font-semibold text-ink block">Mandatory Acceptance</span>
                <span className="text-[11px] text-ink-soft">
                  Enforce sign-off requirement for all active employees
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
              </label>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Executive Summary <span className="text-over-red">*</span>
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="High-level summary of what this document entails and key expectations..."
                className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-ink text-xs placeholder:text-ink-soft/60 focus:outline-none focus:border-accent resize-none"
                required
              />
            </div>

            {/* Markdown Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink">
                  Document Content (Markdown Supported) <span className="text-over-red">*</span>
                </label>
                <span className="text-[10px] text-ink-soft font-mono">
                  {content.length} characters
                </span>
              </div>
              <textarea
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Policy Title&#10;&#10;Use markdown headers, lists, and emphasis..."
                className="w-full p-3 rounded-xl border border-line bg-bg text-ink text-xs font-mono placeholder:text-ink-soft/60 focus:outline-none focus:border-accent resize-y"
                required
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-line bg-transparent text-ink hover:bg-bg-raised transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>{initialData ? 'Save Changes' : 'Publish Document'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
