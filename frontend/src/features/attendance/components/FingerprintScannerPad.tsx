import React, { useState, useEffect, useRef } from 'react';
import { fingerprintSdk, type SampleAcquiredData } from '../services/fingerprintSdk';

type FingerprintScannerPadProps = {
  selectedReader?: string;
  isProcessing: boolean;
  onScanComplete: (imageBase64: string, dataUrl: string) => void | Promise<void>;
  statusText?: string;
};

export const FingerprintScannerPad: React.FC<FingerprintScannerPadProps> = ({
  selectedReader = '',
  isProcessing,
  onScanComplete,
  statusText,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScannedUrl, setLastScannedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isHandlingSampleRef = useRef(false);
  const onScanCompleteRef = useRef(onScanComplete);
  onScanCompleteRef.current = onScanComplete;

  useEffect(() => {
    const handleSample = async (sample: SampleAcquiredData) => {
      if (isHandlingSampleRef.current) return;

      isHandlingSampleRef.current = true;
      setLastScannedUrl(sample.dataUrl);
      setErrorMessage(null);

      try {
        await onScanCompleteRef.current(sample.rawBase64, sample.dataUrl);
      } finally {
        isHandlingSampleRef.current = false;
      }
    };

    const handleCommFail = () => {
      setIsScanning(false);
      setErrorMessage('Communication with biometric reader failed. Please check device connection.');
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
    setErrorMessage(null);

    try {
      setIsScanning(true);
      await fingerprintSdk.startAcquisition(selectedReader);
    } catch (err: any) {
      setIsScanning(false);
      setErrorMessage(err.message || 'Could not start reader acquisition. Ensure DigitalPersona Web Service is active.');
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
      setErrorMessage(null);
      onScanComplete(rawBase64, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border border-line bg-bg font-sans">
      {/* Biometric Sensor Target */}
      <div className="relative group mb-5">
        <button
          type="button"
          onClick={isScanning ? handleStopScan : handleStartScan}
          disabled={isProcessing}
          aria-label="Scan Fingerprint"
          className={`relative w-36 h-44 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer outline-none overflow-hidden ${
            isScanning || isProcessing
              ? 'border-accent bg-accent/5'
              : 'border-line hover:border-accent bg-bg-raised/30 hover:bg-accent/5'
          }`}
        >
          {/* Scanning sweep line animation */}
          {(isScanning || isProcessing) && (
            <div className="absolute inset-x-0 h-1 bg-accent/80 animate-pulse shadow-[0_0_12px_#6A3FA0] z-20 top-1/2 -translate-y-1/2" />
          )}

          {lastScannedUrl ? (
            <img
              src={lastScannedUrl}
              alt="Scanned Fingerprint"
              className="w-28 h-36 object-contain rounded-lg filter contrast-125 transition-opacity"
            />
          ) : (
            <div className="text-ink-soft group-hover:text-accent transition-colors flex flex-col items-center">
              <svg className="w-16 h-16 stroke-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004.07 9m5.918 8d.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h2z"
                />
              </svg>
              <span className="text-[10px] uppercase font-semibold tracking-wider mt-2">
                Touch Sensor
              </span>
            </div>
          )}
        </button>

        {/* Circular indicator pill */}
        <div className="absolute -bottom-2 inset-x-0 flex justify-center pointer-events-none">
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
              isProcessing
                ? 'bg-accent text-accent-ink border-accent'
                : isScanning
                ? 'bg-emerald-500 text-white border-emerald-500 animate-pulse'
                : 'bg-bg border-line text-ink-soft'
            }`}
          >
            {isProcessing
              ? 'Matching Minutiae...'
              : isScanning
              ? 'Sensor Active — Place Finger'
              : 'Press to Activate'}
          </span>
        </div>
      </div>

      {/* Action CTA Button */}
      <button
        type="button"
        onClick={isScanning ? handleStopScan : handleStartScan}
        disabled={isProcessing}
        className="w-full max-w-xs py-2.5 px-4 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
            <span>Verifying with NeonDB...</span>
          </>
        ) : isScanning ? (
          <span>Stop Sensor</span>
        ) : (
          <span>Place Finger & Scan</span>
        )}
      </button>

      {/* File upload fallback */}
      <div className="mt-3">
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
          className="text-[11px] text-ink-soft hover:text-accent underline cursor-pointer"
        >
          Or upload fingerprint image scan
        </button>
      </div>

      {/* Error / Status message */}
      {errorMessage && (
        <p className="text-xs text-rose-500 text-center max-w-sm mt-3">
          {errorMessage}
        </p>
      )}

      {statusText && !errorMessage && (
        <p className="text-[11px] text-ink-soft text-center max-w-sm mt-2">
          {statusText}
        </p>
      )}
    </div>
  );
};
