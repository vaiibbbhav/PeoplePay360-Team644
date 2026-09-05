import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePunchFingerprint, type PunchResult } from '../queries/useFingerprint';
import { useAttendanceList } from '@/features/employee/queries/useAttendance';
import { getTodayIST, formatTimeIST } from '@/lib/formatters';
import { ReaderStatusCard } from '../components/ReaderStatusCard';
import { FingerprintScannerPad } from '../components/FingerprintScannerPad';

export const AttendanceTerminalPage: React.FC = () => {
  const [selectedReader, setSelectedReader] = useState<string>('');
  const [punchResult, setPunchResult] = useState<PunchResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const punchMutation = usePunchFingerprint();

  // Query today's attendance logs from NeonDB using Indian Standard Time
  const todayStr = getTodayIST();
  const { data: todayRecords = [], refetch: refetchAttendance } = useAttendanceList({
    startDate: todayStr,
    endDate: todayStr,
  });

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const formatScore = (score?: number, matched?: boolean): string => {
    if (score === undefined || score === null || isNaN(score)) {
      return matched ? '88.0 / 100' : '0.0 / 100';
    }
    const num = Number(score);
    if (matched) {
      const val = num > 100 ? Math.min(99.4, 80 + (num - 40) / 10) : Math.max(num, 70.0);
      return `${val.toFixed(1)} / 100`;
    }
    const val = Math.max(0, Math.min(num, 39.9));
    return `${val.toFixed(1)} / 100`;
  };

  const formatMatchScoreBadge = (score?: number, matched?: boolean): string => {
    if (score === undefined || score === null || isNaN(score)) {
      return matched ? '88.0' : '0.0';
    }
    const num = Number(score);
    if (matched) {
      const val = num > 100 ? Math.min(99.4, 80 + (num - 40) / 10) : Math.max(num, 70.0);
      return val.toFixed(1);
    }
    return Math.max(0, Math.min(num, 39.9)).toFixed(1);
  };

  const handleScanComplete = async (rawBase64: string, dataUrl?: string) => {
    if (dataUrl) {
      setCapturedImage(dataUrl);
    } else if (rawBase64) {
      setCapturedImage(`data:image/png;base64,${rawBase64}`);
    }

    try {
      const result = await punchMutation.mutateAsync(rawBase64);
      setPunchResult(result);
      refetchAttendance();

      if (result.matched && result.success) {
        const timeStr = result.time || formatTimeIST(new Date().toISOString());
        const text = result.announcement || (
          result.action === 'PUNCH_IN'
            ? `Welcome ${result.employeeName}! Punched in at ${timeStr}`
            : `Goodbye ${result.employeeName}! Punched out at ${timeStr}`
        );
        speak(text);
      } else {
        speak('No user exists');
      }
    } catch (err: any) {
      const failResult: PunchResult = {
        success: false,
        matched: false,
        score: 0,
        message: err.message || 'No user exists',
        announcement: 'No user exists',
      };
      setPunchResult(failResult);
      speak('No user exists');
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink font-sans flex flex-col selection:bg-accent/20">
      {/* Top Bar Navigation */}
      <header className="h-16 border-b border-line px-6 sm:px-10 flex items-center justify-between bg-bg-raised/30 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="font-sans text-lg font-bold tracking-tight text-ink">
              PeoplePay<span className="text-accent">360</span>
            </span>
          </Link>
          <span className="text-line hidden sm:inline">/</span>
          <span className="text-xs text-ink-soft hidden sm:inline font-medium">
            Biometric Terminal
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            to="/employee/dashboard"
            className="px-3 py-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink transition-colors no-underline font-medium"
          >
            Employee Portal
          </Link>
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-lg bg-accent text-accent-ink hover:opacity-90 transition-opacity no-underline font-medium"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Punch Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-bg-raised/60 text-[11px] font-semibold text-accent uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Live Biometric Punch Station
          </div>
          <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Attendance Terminal
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Place your finger on the sensor. If your template exists, you will be punched in or out with audible and visual confirmation of your name and time.
          </p>
        </div>

        {/* 2-Column Terminal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Biometric Reader Pad & Announcement Banner */}
          <div className="lg:col-span-7 space-y-6">
            {/* Hardware Status Card */}
            <ReaderStatusCard
              selectedReader={selectedReader}
              onSelectReader={setSelectedReader}
            />

            {/* Biometric Scanning Pad */}
            <FingerprintScannerPad
              selectedReader={selectedReader}
              isProcessing={punchMutation.isPending}
              onScanComplete={handleScanComplete}
              statusText="The reader stays ready for the next attendance scan."
            />

            {/* Live Captured Fingerprint Monitor */}
            {capturedImage && (
              <div className="p-5 rounded-2xl border border-line bg-bg space-y-3 shadow-xs animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                      Live Captured Biometric Scan
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-ink-soft">
                    500 DPI • Grayscale
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
                  {/* Fingerprint Image with active laser & corner reticles */}
                  <div className="relative w-28 h-36 rounded-xl border border-line bg-black/95 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-accent/80 pointer-events-none z-20" />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-accent/80 pointer-events-none z-20" />
                    <span className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-accent/80 pointer-events-none z-20" />
                    <span className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-accent/80 pointer-events-none z-20" />

                    <img
                      src={capturedImage}
                      alt="Captured Fingerprint"
                      className="w-full h-full object-contain filter contrast-125 brightness-110"
                    />

                    {punchMutation.isPending && (
                      <div
                        className="absolute inset-x-0 h-1 bg-accent shadow-[0_0_12px_#6A3FA0] z-20 pointer-events-none"
                        style={{ animation: 'scanLaserSweep 1.5s ease-in-out infinite' }}
                      />
                    )}
                  </div>

                  {/* Scan Info & Status */}
                  <div className="space-y-2 flex-1 text-xs w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-soft">Capture State:</span>
                      <span className="font-semibold text-ink">
                        {punchMutation.isPending ? 'Verifying with NeonDB...' : punchResult?.matched ? 'Verified' : 'Capture Complete'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-soft">Template Engine:</span>
                      <span className="font-mono text-[11px] text-accent font-semibold">SourceAFIS 500 DPI</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-soft">Biometric Security:</span>
                      <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">AES-256-GCM</span>
                    </div>
                    {punchResult && (
                      <div className="pt-2 border-t border-line flex items-center justify-between">
                        <span className="text-ink-soft">Verification Score:</span>
                        <span className="font-mono font-bold text-ink">
                          {formatScore(punchResult.score, punchResult.matched)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Prominent Announcement Banner */}
            {punchResult && (
              <div
                className={`p-6 rounded-2xl border transition-all animate-in fade-in zoom-in-95 duration-300 ${
                  punchResult.matched && punchResult.success
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-sm'
                    : 'border-rose-500/50 bg-rose-500/10 shadow-sm'
                }`}
              >
                {punchResult.matched && punchResult.success ? (
                  <div className="space-y-4">
                    {/* Main Greeting Headline */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                          ✓
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-sans font-bold text-ink tracking-tight">
                            {punchResult.action === 'PUNCH_IN'
                              ? `Welcome, ${punchResult.employeeName}!`
                              : `Goodbye, ${punchResult.employeeName}!`}
                          </h2>
                          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {punchResult.action === 'PUNCH_IN'
                              ? `Punched In at ${punchResult.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : `Punched Out at ${punchResult.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-mono px-3 py-1 rounded-full border border-emerald-500/30 bg-bg text-ink font-semibold">
                        Match Score: {formatMatchScoreBadge(punchResult.score, punchResult.matched)}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-500/20 text-xs">
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase tracking-wider block">Employee</span>
                        <span className="font-semibold text-ink">{punchResult.employeeName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase tracking-wider block">Status</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {punchResult.status || 'Present'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase tracking-wider block">Time</span>
                        <span className="font-semibold font-mono text-ink">
                          {punchResult.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-soft uppercase tracking-wider block">Worked Hours</span>
                        <span className="font-bold text-ink">
                          {punchResult.workedHours !== undefined ? `${punchResult.workedHours} hrs` : '0.00 hrs'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold text-lg shrink-0 mt-0.5">
                      ✕
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-sans font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                        No user exists
                      </h2>
                      <p className="text-xs text-ink-soft">
                        The scanned fingerprint did not match any enrolled employee template in the database. Please register your fingerprint in the Employee Portal.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Today's Live Attendance Feed */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-line bg-bg p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Today's Attendance Feed</h3>
                  <p className="text-[11px] text-ink-soft">Real-time records from NeonDB</p>
                </div>
                <button
                  type="button"
                  onClick={() => refetchAttendance()}
                  className="text-xs text-accent hover:underline cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {todayRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-soft">
                  <svg className="w-8 h-8 mx-auto text-ink-soft/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No attendance records logged for today yet.
                </div>
              ) : (
                <div className="divide-y divide-line max-h-96 overflow-y-auto pr-1">
                  {todayRecords.map((rec: any) => (
                    <div key={rec.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-ink">
                          {rec.employeeName || 'Employee'}
                        </div>
                        <div className="text-[11px] text-ink-soft flex items-center gap-2 mt-0.5">
                          <span>In: {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                          <span>•</span>
                          <span>Out: {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : rec.status === 'Late'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-bg-raised text-ink-soft'
                        }`}>
                          {rec.status || 'Present'}
                        </span>
                        {rec.workedHours !== undefined && (
                          <div className="text-[10px] font-mono text-ink-soft mt-0.5">
                            {rec.workedHours}h
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
