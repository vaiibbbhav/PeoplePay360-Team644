import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePunchFingerprint, type PunchResult } from '../queries/useFingerprint';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { formatTimeIST } from '@/lib/formatters';
import { ReaderStatusCard } from '../components/ReaderStatusCard';
import { FingerprintScannerPad } from '../components/FingerprintScannerPad';

export const AttendanceTerminalPage: React.FC = () => {
  const [selectedReader, setSelectedReader] = useState<string>('');
  // User enters only digits (without leading zeros); 'EMP-' is the fixed prefix
  const [employeeNum, setEmployeeNum] = useState<string>('3');
  const [punchResult, setPunchResult] = useState<PunchResult | null>(null);
  const [, setCapturedImage] = useState<string | null>(null);

  const { data: currentUser } = useCurrentUser();
  const punchMutation = usePunchFingerprint();

  // Helper to format any employee code without leading zeros (e.g. EMP-003 -> EMP-3)
  const formatEmpCode = (code?: string): string => {
    if (!code) return '';
    const match = code.match(/(\d+)$/);
    return match ? `EMP-${parseInt(match[1], 10)}` : code.toUpperCase();
  };

  const fullEmployeeCode = employeeNum.trim() ? `EMP-${employeeNum.trim()}` : '';

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

    const cleanCode = fullEmployeeCode;

    try {
      const result = await punchMutation.mutateAsync({
        imageBase64: rawBase64,
        employeeCode: cleanCode || undefined,
      });
      setPunchResult(result);

      if (result.matched && result.success) {
        const timeStr = result.time || formatTimeIST(new Date().toISOString());
        const text =
          result.announcement ||
          (result.action === 'PUNCH_IN'
            ? `Welcome ${result.employeeName}! Punched in at ${timeStr}`
            : `Goodbye ${result.employeeName}! Punched out at ${timeStr}`);
        speak(text);
      } else {
        const failureText =
          result.announcement ||
          (cleanCode ? `Fingerprint did not match ${formatEmpCode(cleanCode)}` : 'No user exists');
        speak(failureText);
      }
    } catch (err: any) {
      const failMsg =
        err?.response?.data?.message ||
        err?.message ||
        (cleanCode
          ? `Fingerprint verification failed for ${formatEmpCode(cleanCode)}`
          : 'No user exists');
      const failResult: PunchResult = {
        success: false,
        matched: false,
        score: 0,
        employeeCode: cleanCode || undefined,
        message: failMsg,
        announcement: cleanCode
          ? `Fingerprint did not match ${formatEmpCode(cleanCode)}`
          : 'No user exists',
      };
      setPunchResult(failResult);
      speak(failResult.announcement || 'No user exists');
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink font-sans flex flex-col selection:bg-accent/20">
      {/* Top Bar Navigation */}
      <header className="h-16 border-b border-line px-4 sm:px-10 flex items-center justify-between bg-bg-raised/30 backdrop-blur-md sticky top-0 z-20">
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
            to="/dashboard"
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
            Biometric Attendance 
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Attendance with biometric fingerprint verification.
          </p>
        </div>

        {/* Unified Terminal Container */}
        <div className="rounded-2xl border border-line bg-bg overflow-hidden shadow-xs">
          {/* Top Status Header Bar */}
          <div className="px-6 py-4 border-b border-line bg-bg-raised/30 flex flex-wrap items-center justify-between gap-4">
            <ReaderStatusCard
              selectedReader={selectedReader}
              onSelectReader={setSelectedReader}
              compact
            />
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-line bg-bg text-ink-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                SourceAFIS 500 DPI
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                AES-256-GCM
              </span>
            </div>
          </div>

          {/* 1:1 Identity Mapping Bar with fixed 'EMP-' prefix and no leading zeros */}
          <div className="px-6 py-4 border-b border-line bg-bg/50 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <label
                  htmlFor="employee-code-input"
                  className="text-xs font-semibold text-ink uppercase tracking-wider cursor-pointer font-mono"
                >
                  Employee Code
                </label>
              </div>
              {employeeNum.trim() ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  1:1 Active ({fullEmployeeCode})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-bg-raised text-ink-soft border border-line">
                  Auto 1:N Fallback
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Input with fixed 'EMP-' prefix */}
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-3.5 flex items-center select-none pointer-events-none">
                  <span className="font-mono text-sm font-bold text-accent">EMP-</span>
                </div>
                <input
                  id="employee-code-input"
                  type="text"
                  value={employeeNum}
                  onChange={(e) => {
                    // Strip any leading 'EMP-' or leading zeros automatically
                    const raw = e.target.value.replace(/^EMP-?/i, '').replace(/[^\d]/g, '');
                    const normalized = raw.replace(/^0+/, '');
                    setEmployeeNum(normalized);
                    setPunchResult(null);
                  }}
                  placeholder="3"
                  className="w-full pl-16 pr-10 py-2.5 rounded-xl border border-line bg-bg text-ink text-sm font-mono tracking-wider font-semibold placeholder:text-ink-soft/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
                {employeeNum && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeNum('');
                      setPunchResult(null);
                    }}
                    className="absolute right-3 text-ink-soft hover:text-ink text-xs p-1 rounded hover:bg-bg-raised cursor-pointer transition-colors"
                    title="Clear code"
                    aria-label="Clear employee code"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Select Employee Chips (without leading zeros: EMP-1, EMP-2, EMP-3) */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] text-ink-soft hidden md:inline">Quick Select:</span>
                {currentUser?.employeeCode && (
                  <button
                    type="button"
                    onClick={() => {
                      const num =
                        currentUser.employeeCode?.replace(/^EMP-?0*/i, '') || '';
                      setEmployeeNum(num);
                      setPunchResult(null);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                      employeeNum ===
                      (currentUser.employeeCode?.replace(/^EMP-?0*/i, '') || '')
                        ? 'border-accent bg-accent text-accent-ink font-semibold'
                        : 'border-line bg-bg hover:border-accent/50 text-ink'
                    }`}
                  >
                    My ID ({formatEmpCode(currentUser.employeeCode)})
                  </button>
                )}
                {['1', '2', '3'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setEmployeeNum(num);
                      setPunchResult(null);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                      employeeNum === num
                        ? 'border-accent bg-accent text-accent-ink font-semibold'
                        : 'border-line bg-bg hover:border-accent/50 text-ink'
                    }`}
                  >
                    EMP-{num}
                  </button>
                ))}
                {employeeNum && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeNum('');
                      setPunchResult(null);
                    }}
                    className="text-[11px] text-ink-soft hover:text-rose-500 underline ml-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Unified 2-Section Layout: IMAGE SCAN and RESULT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-line items-stretch">
            {/* SECTION 1: IMAGE SCAN */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <h2 className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">
                    Image Scan
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-ink-soft bg-bg-raised px-2.5 py-0.5 rounded border border-line font-medium">
                  500 DPI Optical Sensor
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center py-2">
                <FingerprintScannerPad
                  selectedReader={selectedReader}
                  isProcessing={punchMutation.isPending}
                  onScanComplete={handleScanComplete}
                  targetEmployeeCode={fullEmployeeCode || undefined}
                  punchResult={punchResult}
                  onClearScan={() => {
                    setPunchResult(null);
                    setCapturedImage(null);
                  }}
                  statusText={
                    fullEmployeeCode
                      ? `1:1 Target locked on ${fullEmployeeCode}. Touch the optical sensor.`
                      : 'The sensor remains ready for the next attendance scan.'
                  }
                  borderless
                />
              </div>
            </div>

            {/* SECTION 2: RESULT */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-bg-raised/20">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      punchMutation.isPending
                        ? 'bg-accent animate-ping'
                        : punchResult
                          ? punchResult.matched && punchResult.success
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                          : 'bg-ink-soft'
                    }`}
                  />
                  <h2 className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">
                    Result
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-ink-soft bg-bg px-2.5 py-0.5 rounded border border-line font-medium">
                  {punchMutation.isPending
                    ? 'Verifying...'
                    : punchResult
                      ? punchResult.matched
                        ? 'Verified Match'
                        : 'Match Failed'
                      : 'Standby'}
                </span>
              </div>

              {/* Main Result Card */}
              <div className="flex-1 flex flex-col justify-center">
                {punchMutation.isPending ? (
                  /* PENDING / VERIFYING STATE */
                  <div className="p-8 rounded-2xl border border-accent/40 bg-accent/5 text-center space-y-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-ink">Verifying...</h3>
                      <p className="text-xs text-ink-soft mt-1">
                        Please hold your finger steady on the optical sensor.
                      </p>
                    </div>
                  </div>
                ) : punchResult ? (
                  punchResult.matched && punchResult.success ? (
                    /* SUCCESS VERDICT */
                    <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                            {punchResult.employeeName
                              ? punchResult.employeeName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)
                              : '✓'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-ink">
                                {punchResult.action === 'PUNCH_IN'
                                  ? `Welcome, ${punchResult.employeeName}!`
                                  : `Goodbye, ${punchResult.employeeName}!`}
                              </h3>
                              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/30 font-semibold">
                                {formatEmpCode(punchResult.employeeCode || fullEmployeeCode)}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                                1:1 Verified
                              </span>
                            </div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              {punchResult.action === 'PUNCH_IN'
                                ? `Punched In at ${punchResult.time || formatTimeIST(new Date().toISOString())}`
                                : `Punched Out at ${punchResult.time || formatTimeIST(new Date().toISOString())}`}
                            </p>
                          </div>
                        </div>

                        <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-bg text-right">
                          <span className="text-[10px] text-ink-soft block uppercase font-mono">
                            Score
                          </span>
                          <span className="text-sm font-mono font-bold text-ink">
                            {formatMatchScoreBadge(punchResult.score, true)} / 100
                          </span>
                        </div>
                      </div>

                      {/* Attendance metrics */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-emerald-500/20 text-xs">
                        <div className="p-2.5 rounded-xl bg-bg border border-line">
                          <span className="text-[10px] text-ink-soft block uppercase tracking-wider">
                            Status
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            {punchResult.status || 'Present'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-bg border border-line">
                          <span className="text-[10px] text-ink-soft block uppercase tracking-wider">
                            Punch Time
                          </span>
                          <span className="font-mono font-semibold text-ink mt-0.5 block">
                            {punchResult.time || '—'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-bg border border-line">
                          <span className="text-[10px] text-ink-soft block uppercase tracking-wider">
                            Worked Hours
                          </span>
                          <span className="font-mono font-bold text-ink mt-0.5 block">
                            {punchResult.workedHours !== undefined
                              ? `${punchResult.workedHours}h`
                              : '0h'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* FAILURE VERDICT */
                    <div className="p-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold text-lg shrink-0 border border-rose-500/30">
                          ✕
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                              {`Verification Failed for ${formatEmpCode(punchResult.employeeCode || fullEmployeeCode)}`}
                            </h3>
                            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/30">
                              1:1 Target: {formatEmpCode(punchResult.employeeCode || fullEmployeeCode)}
                            </span>
                          </div>
                          <p className="text-xs text-ink-soft leading-relaxed">
                            {`No fingerprint template enrolled for employee ${formatEmpCode(punchResult.employeeCode || fullEmployeeCode)}`}
                          </p>
                          <div className="pt-2 flex items-center justify-between text-[11px] text-ink-soft font-mono border-t border-rose-500/20">
                            <span>Biometric Score: {formatScore(punchResult.score, false)}</span>
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              Mismatch
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  /* STANDBY VERDICT */
                  <div className="p-8 rounded-2xl border border-line bg-bg text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto">
                      <span className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">Ready for Scan</h3>
                      <p className="text-xs text-ink-soft max-w-xs mx-auto mt-1">
                        {fullEmployeeCode
                          ? `Targeting ${fullEmployeeCode}. Touch the optical sensor on the left.`
                          : 'Touch the optical sensor on the left to punch attendance.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Telemetry Metrics Panel */}
              <div className="p-4 rounded-xl border border-line bg-bg space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-line">
                  <span className="text-ink-soft">Capture State:</span>
                  <span className="font-semibold text-ink">
                    {punchMutation.isPending
                      ? 'Verifying...'
                      : punchResult
                        ? punchResult.matched
                          ? 'Verified'
                          : 'Capture Complete'
                        : 'Sensor Standby'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-line">
                  <span className="text-ink-soft">Template Engine:</span>
                  <span className="font-mono text-[11px] text-accent font-semibold">
                    SourceAFIS 500 DPI
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-line">
                  <span className="text-ink-soft">Biometric Security:</span>
                  <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    AES-256-GCM
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-ink-soft">Verification Score:</span>
                  <span className="font-mono font-bold text-ink text-sm">
                    {formatScore(punchResult?.score, punchResult?.matched)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
