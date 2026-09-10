import React, { useState, useEffect, useRef } from 'react';
import { fingerprintSdk, type SampleAcquiredData } from '../services/fingerprintSdk';

type PunchResultSummary = {
  success: boolean;
  matched: boolean;
  score?: number;
};

type FingerprintScannerPadProps = {
  selectedReader?: string;
  isProcessing: boolean;
  onScanComplete: (imageBase64: string, dataUrl: string) => void | Promise<void>;
  statusText?: string;
  targetEmployeeCode?: string;
  borderless?: boolean;
  punchResult?: PunchResultSummary | null;
  onClearScan?: () => void;
};

export const FingerprintScannerPad: React.FC<FingerprintScannerPadProps> = ({
  selectedReader = '',
  isProcessing,
  onScanComplete,
  statusText,
  targetEmployeeCode,
  borderless = false,
  punchResult = null,
  onClearScan,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScannedUrl, setLastScannedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isHandlingSampleRef = useRef(false);
  const onScanCompleteRef = useRef(onScanComplete);
  onScanCompleteRef.current = onScanComplete;

  const isSuccess = Boolean(punchResult?.matched && punchResult?.success);
  const isFailed = Boolean(punchResult && (!punchResult.matched || !punchResult.success));

  useEffect(() => {
    const handleSample = async (sample: SampleAcquiredData) => {
      if (isHandlingSampleRef.current) return;

      isHandlingSampleRef.current = true;
      setLastScannedUrl(sample.dataUrl);

      try {
        await onScanCompleteRef.current(sample.rawBase64, sample.dataUrl);
      } finally {
        isHandlingSampleRef.current = false;
      }
    };

    const handleCommFail = () => {
      setIsScanning(false);
    };

    fingerprintSdk.on('sampleAcquired', handleSample);
    fingerprintSdk.on('communicationFailed', handleCommFail);

    return () => {
      fingerprintSdk.off('sampleAcquired', handleSample);
      fingerprintSdk.off('communicationFailed', handleCommFail);
    };
  }, []);

  const handleStartScan = async () => {
    if (isScanning || isProcessing) return;

    try {
      setIsScanning(true);
      await fingerprintSdk.startAcquisition(selectedReader);
    } catch {
      setIsScanning(false);
    }
  };

  const handleStopScan = async () => {
    try {
      await fingerprintSdk.stopAcquisition();
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const rawBase64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      setLastScannedUrl(dataUrl);
      onScanComplete(rawBase64, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setLastScannedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClearScan?.();
  };

  return (
    <div
      className={`flex flex-col items-center justify-center font-sans ${
        borderless ? 'p-1 w-full' : 'p-6 sm:p-8 rounded-2xl border border-line bg-bg'
      }`}
    >
      <style>{`
        @keyframes scanLaserSweep {
          0% { top: 4%; opacity: 0.85; }
          50% { top: 90%; opacity: 1; }
          100% { top: 4%; opacity: 0.85; }
        }
      `}</style>

      {/* Biometric Sensor Target Canvas (High-Tech Touch Plate) */}
      <div className="relative group mb-4">
        <button
          type="button"
          onClick={isScanning ? handleStopScan : handleStartScan}
          disabled={isProcessing}
          aria-label="Scan Biometric"
          className={`relative w-44 h-52 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer outline-none overflow-hidden bg-black/95 shadow-inner ${
            isProcessing || isScanning
              ? 'border-accent ring-2 ring-accent/30'
              : isSuccess
                ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                : isFailed
                  ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                  : 'border-line hover:border-accent'
          }`}
        >
          {/* Reticle Corner Crosshair Brackets */}
          <span
            className={`absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 pointer-events-none z-30 transition-colors ${
              isSuccess ? 'border-emerald-500' : isFailed ? 'border-rose-500' : 'border-accent/80'
            }`}
          />
          <span
            className={`absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 pointer-events-none z-30 transition-colors ${
              isSuccess ? 'border-emerald-500' : isFailed ? 'border-rose-500' : 'border-accent/80'
            }`}
          />
          <span
            className={`absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 pointer-events-none z-30 transition-colors ${
              isSuccess ? 'border-emerald-500' : isFailed ? 'border-rose-500' : 'border-accent/80'
            }`}
          />
          <span
            className={`absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 pointer-events-none z-30 transition-colors ${
              isSuccess ? 'border-emerald-500' : isFailed ? 'border-rose-500' : 'border-accent/80'
            }`}
          />

          {/* Active Animated Scanning Laser Beam */}
          {(isScanning || isProcessing) && (
            <div
              className="absolute inset-x-0 h-1 bg-accent shadow-[0_0_15px_#6A3FA0,0_0_6px_#a855f7] z-20 pointer-events-none"
              style={{ animation: 'scanLaserSweep 1.8s ease-in-out infinite' }}
            >
              <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-accent/25 pointer-events-none" />
              <div className="absolute inset-x-0 top-1 h-3 bg-gradient-to-t from-transparent to-accent/25 pointer-events-none" />
            </div>
          )}

          {/* Optical Sensor Surface: Futuristic Biometric Vector Visualizer */}
          <div className="flex flex-col items-center justify-center p-3 transition-all w-full h-full select-none">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Concentric Sensor Guidance Rings */}
              <span
                className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                  isScanning || isProcessing
                    ? 'border-accent/40 animate-pulse'
                    : isSuccess
                      ? 'border-emerald-500/30'
                      : isFailed
                        ? 'border-rose-500/30'
                        : 'border-white/10'
                }`}
              />
              <span className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />
              <span className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />

              {/* Stylized Modern Biometric Vector Graphic (Not a raw photo) */}
              <svg
                className={`w-16 h-20 transition-all duration-300 ${
                  isScanning || isProcessing
                    ? 'text-accent scale-105 animate-pulse'
                    : isSuccess
                      ? 'text-emerald-400 scale-100'
                      : isFailed
                        ? 'text-rose-400 scale-100'
                        : 'text-white/40 group-hover:text-accent group-hover:scale-105'
                }`}
                viewBox="0 0 80 100"
                fill="none"
                stroke="currentColor"
              >
                {/* Concentric Biometric Ridge Curves */}
                <path
                  d="M40 10 C22 10 12 24 12 44 C12 68 22 84 30 90"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M40 10 C58 10 68 24 68 44 C68 68 58 84 50 90"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M40 22 C26 22 20 32 20 46 C20 64 28 78 36 84"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M40 22 C54 22 60 32 60 46 C60 64 52 78 44 84"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M40 34 C30 34 28 42 28 50 C28 62 34 72 40 76"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M40 34 C50 34 52 42 52 50 C52 62 46 72 40 76"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M40 46 C36 46 36 54 36 58 C36 64 40 68 40 68"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Lower delta lines */}
                <path d="M22 62 C26 70 32 76 38 80" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M58 62 C54 70 48 76 42 80" strokeWidth="2.5" strokeLinecap="round" />
                {/* Key Minutiae Nodes */}
                <circle cx="28" cy="50" r="2.5" className="fill-current" />
                <circle cx="52" cy="50" r="2.5" className="fill-current" />
                <circle cx="40" cy="34" r="2.5" className="fill-current" />
                <circle cx="36" cy="74" r="2.5" className="fill-current" />
                <circle cx="44" cy="74" r="2.5" className="fill-current" />
              </svg>

              {/* Status Badges */}
              {isSuccess && (
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                  ✓
                </span>
              )}
              {isFailed && (
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                  ✕
                </span>
              )}
            </div>

            <span
              className={`text-[10px] uppercase font-semibold tracking-wider mt-2.5 font-mono transition-colors ${
                isProcessing
                  ? 'text-accent'
                  : isSuccess
                    ? 'text-emerald-400'
                    : isFailed
                      ? 'text-rose-400'
                      : isScanning
                        ? 'text-accent'
                        : lastScannedUrl
                          ? 'text-ink'
                          : 'text-ink-soft group-hover:text-ink'
              }`}
            >
              {isProcessing
                ? 'Verifying...'
                : isSuccess
                  ? 'Scan Verified'
                  : isFailed
                    ? 'Scan Mismatch'
                    : isScanning
                      ? 'Acquiring Sample...'
                      : lastScannedUrl
                        ? 'Sample Acquired'
                        : 'Touch Sensor'}
            </span>
            <span className="text-[9px] text-ink-soft/70 font-mono mt-0.5">
              {isSuccess
                ? 'Match Confirmed'
                : isFailed
                  ? 'Touch to Retry'
                  : lastScannedUrl
                    ? '500 DPI Extracted'
                    : '500 DPI Optical Glass'}
            </span>
          </div>
        </button>

        {/* Circular indicator pill */}
        <div className="absolute -bottom-2.5 inset-x-0 flex justify-center pointer-events-none z-30">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold border transition-all ${
              isProcessing
                ? 'bg-accent text-accent-ink border-accent shadow-sm'
                : isScanning
                  ? 'bg-accent text-accent-ink border-accent animate-pulse shadow-sm'
                  : isSuccess
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : isFailed
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : lastScannedUrl
                        ? 'bg-bg-raised text-ink border-line font-mono'
                        : targetEmployeeCode
                          ? 'bg-accent/15 text-accent border-accent/40 font-mono font-bold'
                          : 'bg-bg border-line text-ink-soft'
            }`}
          >
            {isProcessing
              ? targetEmployeeCode
                ? `1:1 Verifying: ${targetEmployeeCode}...`
                : 'Matching Minutiae...'
              : isScanning
                ? targetEmployeeCode
                  ? `Scanning for ${targetEmployeeCode}...`
                  : 'Sensor Active — Scanning Ridges'
                : isSuccess
                  ? targetEmployeeCode
                    ? `1:1 Verified: ${targetEmployeeCode}`
                    : 'Verified Match'
                  : isFailed
                    ? targetEmployeeCode
                      ? `Mismatch: ${targetEmployeeCode}`
                      : 'Pattern Mismatch'
                    : lastScannedUrl
                      ? 'Sample Acquired (500 DPI)'
                      : targetEmployeeCode
                        ? `1:1 Target: ${targetEmployeeCode}`
                        : 'Sensor Ready'}
          </span>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="w-full max-w-xs mt-3">
        <button
          type="button"
          onClick={isScanning ? handleStopScan : handleStartScan}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : isScanning ? (
            <span>Stop Sensor</span>
          ) : (
            <span>Scan via Hardware Sensor</span>
          )}
        </button>
      </div>

      {/* File upload fallback & clear */}
      <div className="flex items-center gap-3 mt-3 text-[11px]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/bmp,image/jpeg"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="text-ink-soft hover:text-accent underline cursor-pointer"
        >
          Upload scan image
        </button>
        {(lastScannedUrl || punchResult) && (
          <>
            <span className="text-line">•</span>
            <button
              type="button"
              onClick={handleClear}
              disabled={isProcessing}
              className="text-ink-soft hover:text-rose-500 cursor-pointer"
            >
              Clear scan
            </button>
          </>
        )}
      </div>

      {/* Status message */}
      {statusText && (
        <p className="text-[11px] text-ink-soft text-center max-w-sm mt-2 font-medium">
          {statusText}
        </p>
      )}
    </div>
  );
};
