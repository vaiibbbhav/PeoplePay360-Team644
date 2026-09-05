import React, { useState } from 'react';
import { useFingerprintStatus, useEnrollFingerprint } from '@/features/attendance/queries/useFingerprint';
import { ReaderStatusCard } from '@/features/attendance/components/ReaderStatusCard';
import { FingerprintScannerPad } from '@/features/attendance/components/FingerprintScannerPad';

type FingerprintModalProps = {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
};

export const FingerprintModal: React.FC<FingerprintModalProps> = ({ isOpen, onClose, employeeId }) => {
  const { data: fpStatus, refetch } = useFingerprintStatus(employeeId);
  const enrollMutation = useEnrollFingerprint();

  const [selectedReader, setSelectedReader] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleScanComplete = async (rawBase64: string) => {
    setStatusMessage(null);
    setIsError(false);

    try {
      await enrollMutation.mutateAsync({
        employeeId,
        imageBase64: rawBase64,
      });

      setStatusMessage('Biometric template encrypted via AES-256-GCM and saved to NeonDB.');
      setIsError(false);
      refetch();

      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to enroll fingerprint');
      setIsError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
      <div className="w-full max-w-lg bg-bg border border-line rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
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
              <h3 className="text-base font-semibold text-ink m-0">Biometric Registration</h3>
              <p className="text-xs text-ink-soft m-0">
                AES-256-GCM hardware encryption with OpenAFIS template engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1 rounded-md cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Current status pill */}
        <div className="p-3 rounded-xl border border-line bg-bg-raised/60 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-ink-soft font-medium">Registration Status:</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                fpStatus?.enrolled
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  fpStatus?.enrolled ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {fpStatus?.enrolled ? 'Enrolled & Active' : 'Not Registered'}
            </span>
          </div>
          <span className="font-mono text-[11px] text-ink-soft">
            {employeeId.slice(0, 8)}...
          </span>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`p-3 text-xs rounded-lg flex items-center gap-2 border ${
              isError
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isError ? 'bg-rose-500' : 'bg-emerald-500'}`}
            />
            {statusMessage}
          </div>
        )}

        {/* Reader Status Card */}
        <ReaderStatusCard
          selectedReader={selectedReader}
          onSelectReader={setSelectedReader}
        />

        {/* Biometric Scanning Pad */}
        <FingerprintScannerPad
          selectedReader={selectedReader}
          isProcessing={enrollMutation.isPending}
          onScanComplete={handleScanComplete}
          statusText="Touch the sensor to scan and register your biometric template."
        />
      </div>
    </div>
  );
};
