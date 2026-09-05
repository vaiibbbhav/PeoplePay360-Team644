import React, { useEffect, useState } from 'react';
import { fingerprintSdk } from '../services/fingerprintSdk';

type ReaderStatusCardProps = {
  selectedReader: string;
  onSelectReader: (readerUid: string) => void;
};

export const ReaderStatusCard: React.FC<ReaderStatusCardProps> = ({
  selectedReader,
  onSelectReader,
}) => {
  const [readers, setReaders] = useState<string[]>([]);
  const [sdkAvailable, setSdkAvailable] = useState<boolean>(false);
  const [scanningDevices, setScanningDevices] = useState<boolean>(false);

  const refreshDevices = async () => {
    setScanningDevices(true);
    try {
      const isAvail = fingerprintSdk.isAvailable();
      setSdkAvailable(isAvail);
      if (isAvail) {
        const list = await fingerprintSdk.enumerateDevices();
        setReaders(list || []);
        if (list && list.length > 0 && !selectedReader) {
          onSelectReader(list[0]);
        }
      }
    } catch {
      setReaders([]);
    } finally {
      setScanningDevices(false);
    }
  };

  useEffect(() => {
    refreshDevices();

    const handleConnected = () => refreshDevices();
    const handleDisconnected = () => refreshDevices();

    fingerprintSdk.on('deviceConnected', handleConnected);
    fingerprintSdk.on('deviceDisconnected', handleDisconnected);

    return () => {
      fingerprintSdk.off('deviceConnected', handleConnected);
      fingerprintSdk.off('deviceDisconnected', handleDisconnected);
    };
  }, []);

  return (
    <div className="rounded-xl border border-line bg-bg-raised/40 p-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
              Biometric Hardware Status
            </h3>
            <p className="text-[11px] text-ink-soft">
              DigitalPersona U.are.U 4500 Optical Reader & OpenAFIS Engine
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshDevices}
          disabled={scanningDevices}
          className="text-xs text-accent hover:underline cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
        >
          {scanningDevices ? (
            <>
              <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <span>Refresh Devices</span>
          )}
        </button>
      </div>

      {/* Reader status content */}
      <div className="pt-3 text-xs">
        {readers.length > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Optical Sensor Online & Ready
              </span>
            </div>
            {readers.length > 1 && (
              <select
                value={selectedReader}
                onChange={(e) => onSelectReader(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-line bg-bg text-ink focus:border-accent outline-none"
              >
                {readers.map((uid) => (
                  <option key={uid} value={uid}>
                    DigitalPersona ({uid.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-line bg-bg text-ink-soft">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>
                {sdkAvailable
                  ? 'DigitalPersona Web Service active. Connect USB reader or use file upload.'
                  : 'DigitalPersona SDK standby. Place finger on scanner or upload image.'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
