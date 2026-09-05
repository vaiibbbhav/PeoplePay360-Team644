import React, { useState } from 'react';
import { useFingerprint, useUpdateFingerprint } from '../queries/useAttendance';

type FingerprintModalProps = {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
};

export const FingerprintModal: React.FC<FingerprintModalProps> = ({ isOpen, onClose, employeeId }) => {
  const { data: fingerprint } = useFingerprint(employeeId);
  const updateMutation = useUpdateFingerprint();

  const [customTemplate, setCustomTemplate] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const template = customTemplate !== null ? customTemplate : fingerprint?.encryted_template || '';

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setIsScanning(true);
    setSuccessMessage(null);

    setTimeout(() => {
      // Generate a simulated cryptographic biometric hash template
      const randomHex = Array.from({ length: 48 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      const newTemplate = `FP_SHA256_${randomHex}`;
      setCustomTemplate(newTemplate);
      setIsScanning(false);
    }, 900);
  };

  const handleSave = async () => {
    if (!template.trim()) return;

    try {
      await updateMutation.mutateAsync({
        employeeId,
        encrytedTemplate: template.trim(),
      });
      setSuccessMessage('Biometric fingerprint template updated successfully.');
      setTimeout(() => {
        setSuccessMessage(null);
        setCustomTemplate(null);
        onClose();
      }, 1200);
    } catch {
      // Error handling
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
      <div className="w-full max-w-lg bg-bg border border-line rounded-2xl p-6 sm:p-7 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004.07 9m5.918 8d.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink m-0">Biometric Fingerprint</h3>
              <p className="text-xs text-ink-soft m-0">Manage hardware terminal encryption key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1 rounded-md cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-4">
          {successMessage && (
            <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {successMessage}
            </div>
          )}

          <div className="p-3.5 rounded-xl border border-line bg-bg-raised/60 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-ink-soft font-medium">Bound Employee ID</span>
              <span className="font-mono text-ink font-semibold">{employeeId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-soft font-medium">Registration Status</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {fingerprint?.encryted_template ? 'Active & Enrolled' : 'Not Registered'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              Encrypted Biometric Template (<code className="text-accent font-mono text-[11px]">encryted_template</code>)
            </label>
            <textarea
              rows={3}
              value={template}
              onChange={(e) => setCustomTemplate(e.target.value)}
              placeholder="FP_SHA256_..."
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-line bg-bg text-ink outline-none focus:border-accent resize-none transition-colors"
            />
            <p className="text-[11px] text-ink-soft mt-1">
              Cryptographic biometric minutiae hash captured from optical hardware reader.
            </p>
          </div>

          {/* Biometric Scan Trigger */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSimulateScan}
              disabled={isScanning || updateMutation.isPending}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span>Scanning hardware optical pad...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>Scan / Re-generate Biometric Key</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-line flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!template.trim() || updateMutation.isPending}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-accent-ink hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {updateMutation.isPending ? 'Saving to Database...' : 'Save Fingerprint'}
          </button>
        </div>
      </div>
    </div>
  );
};
