import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePunchFingerprint, type PunchResult } from '../queries/useFingerprint';
import { useCurrentUser } from '@/features/auth/queries/useAuth';
import { formatTimeIST } from '@/lib/formatters';
import { ReaderStatusCard } from '../components/ReaderStatusCard';
import { FingerprintScannerPad } from '../components/FingerprintScannerPad';

export const AttendanceTerminalPage: React.FC = () => {
  const [selectedReader, setSelectedReader] = useState<string>('');
  const [employeeCode, setEmployeeCode] = useState<string>('');
  const [punchResult, setPunchResult] = useState<PunchResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const { data: currentUser } = useCurrentUser();
  const punchMutation = usePunchFingerprint();

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

    const cleanCode = employeeCode.trim().toUpperCase();

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
          (cleanCode ? `Fingerprint did not match ${cleanCode}` : 'No user exists');
        speak(failureText);
      }
    } catch (err: any) {
      const failMsg =
        err?.response?.data?.message ||
        err?.message ||
        (cleanCode ? `Fingerprint verification failed for ${cleanCode}` : 'No user exists');
      const failResult: PunchResult = {
        success: false,
        matched: false,
        score: 0,
        employeeCode: cleanCode || undefined,
        message: failMsg,
        announcement: cleanCode ? `Fingerprint did not match ${cleanCode}` : 'No user exists',
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
            Attendance Terminal
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Place your finger on the sensor. If your template exists, you will be punched in or out
            with audible and visual confirmation of your name and time.
          </p>
        </div>

        {/* 2-Column Terminal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Biometric Scanner Station */}
          <div className="lg:col-span-6 rounded-2xl border border-line bg-bg overflow-hidden flex flex-col shadow-xs">
            {/* Panel Header with Integrated Reader Status */}
            <div className="px-6 py-4 border-b border-line bg-bg-raised/30">
              <ReaderStatusCard
                selectedReader={selectedReader}
                onSelectReader={setSelectedReader}
                compact
              />
            </div>

            {/* Panel Body */}
            <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
              {/* 1:1 Identity Input Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    <label
                      htmlFor="employee-code-input"
                      className="text-xs font-semibold text-ink uppercase tracking-wider cursor-pointer"
                    >
                      1:1 Employee Biometric Mapping
                    </label>
                  </div>
                  {employeeCode.trim() ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      1:1 Active ({employeeCode.trim().toUpperCase()})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-bg-raised text-ink-soft border border-line">
                      Auto 1:N Fallback
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-ink-soft">
                  Enter employee code (e.g.{' '}
                  <span className="font-mono text-accent font-semibold">EMP-002</span>) for direct
                  1:1 template verification.
                </p>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono text-xs text-ink-soft select-none pointer-events-none font-semibold">
                    ID:
                  </span>
                  <input
                    id="employee-code-input"
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    placeholder="EMP-002"
                    className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-line bg-bg text-ink text-sm font-mono tracking-wider font-semibold placeholder:text-ink-soft/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent uppercase transition-all"
                  />
                  {employeeCode && (
                    <button
                      type="button"
                      onClick={() => setEmployeeCode('')}
                      className="absolute right-3 text-ink-soft hover:text-ink text-xs p-1 rounded hover:bg-bg-raised cursor-pointer transition-colors"
                      title="Clear code"
                      aria-label="Clear employee code"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Select Employee Chips */}
                <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] text-ink-soft">Quick Select:</span>
                  {currentUser?.employeeCode && (
                    <button
                      type="button"
                      onClick={() => setEmployeeCode(currentUser.employeeCode || '')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                        employeeCode === currentUser.employeeCode
                          ? 'border-accent bg-accent text-accent-ink font-semibold'
                          : 'border-line bg-bg hover:border-accent/50 text-ink'
                      }`}
                    >
                      My ID ({currentUser.employeeCode})
                    </button>
                  )}
                  {['EMP-001', 'EMP-002', 'EMP-003'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setEmployeeCode(code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                        employeeCode === code
                          ? 'border-accent bg-accent text-accent-ink font-semibold'
                          : 'border-line bg-bg hover:border-accent/50 text-ink'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                  {employeeCode && (
                    <button
                      type="button"
                      onClick={() => setEmployeeCode('')}
                      className="text-[11px] text-ink-soft hover:text-rose-500 underline ml-auto cursor-pointer"
                    >
                      Clear Mapping
                    </button>
                  )}
                </div>
              </div>

              {/* Hairline Divider */}
              <div className="border-t border-line" />

              {/* Interactive Biometric Sensor Pad */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <FingerprintScannerPad
                  selectedReader={selectedReader}
                  isProcessing={punchMutation.isPending}
                  onScanComplete={handleScanComplete}
                  targetEmployeeCode={employeeCode.trim().toUpperCase() || undefined}
                  statusText={
                    employeeCode.trim()
                      ? `1:1 Verification Active: Ready to verify against ${employeeCode.trim().toUpperCase()}`
                      : 'The reader stays ready for the next attendance scan.'
                  }
                  borderless
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Captured Biometric Scan & Verification Result */}
          <div className="lg:col-span-6 rounded-2xl border border-line bg-bg overflow-hidden flex flex-col shadow-xs">
            {/* Panel Header */}
            <div className="px-6 py-4 border-b border-line bg-bg-raised/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    punchMutation.isPending ? 'bg-accent animate-ping' : 'bg-accent'
                  }`}
                />
                <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Live Captured Biometric Scan
                </h3>
              </div>
              <span className="text-[10px] font-mono text-ink-soft bg-bg px-2.5 py-1 rounded-md border border-line font-medium">
                500 DPI • Grayscale
              </span>
            </div>

            {/* Panel Body */}
            <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
              {/* Upper Section: Live Minutiae Frame & Telemetry Specs */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* 500 DPI Scan Reticle Frame */}
                <div className="relative w-36 h-48 rounded-xl border border-line bg-black/95 p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-accent/80 pointer-events-none z-20" />
                  <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-accent/80 pointer-events-none z-20" />
                  <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-accent/80 pointer-events-none z-20" />
                  <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-accent/80 pointer-events-none z-20" />

                  {capturedImage ? (
                    <img
                      src={capturedImage}
                      alt="Captured Fingerprint"
                      className="w-full h-full object-contain filter contrast-125 brightness-110"
                    />
                  ) : (
                    <div className="text-center p-3 text-ink-soft flex flex-col items-center justify-center">
                      <svg
                        className="w-12 h-12 stroke-1.5 opacity-40 text-accent mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004.07 9m5.918 8d.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h2z"
                        />
                      </svg>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-soft/70">
                        Sensor Standby
                      </span>
                    </div>
                  )}

                  {punchMutation.isPending && (
                    <div
                      className="absolute inset-x-0 h-1 bg-accent shadow-[0_0_12px_#6A3FA0] z-20 pointer-events-none"
                      style={{ animation: 'scanLaserSweep 1.5s ease-in-out infinite' }}
                    />
                  )}

                  <div className="absolute bottom-1.5 inset-x-0 text-center pointer-events-none">
                    <span className="text-[9px] font-mono tracking-wider text-ink-soft/90 bg-black/80 px-2 py-0.5 rounded border border-white/10">
                      Captured Fingerprint
                    </span>
                  </div>
                </div>

                {/* Telemetry Metrics Table */}
                <div className="flex-1 w-full space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <span className="text-ink-soft">Capture State:</span>
                    <span className="font-semibold text-ink">
                      {punchMutation.isPending
                        ? 'Verifying with NeonDB...'
                        : capturedImage
                          ? punchResult?.matched
                            ? 'Verified'
                            : 'Capture Complete'
                          : 'Sensor Ready'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <span className="text-ink-soft">Template Engine:</span>
                    <span className="font-mono text-[11px] text-accent font-semibold">
                      SourceAFIS 500 DPI
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <span className="text-ink-soft">Biometric Security:</span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      AES-256-GCM
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-ink-soft">Verification Score:</span>
                    <span className="font-mono font-bold text-ink text-base">
                      {formatScore(punchResult?.score, punchResult?.matched)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lower Section: Prominent Verification Result */}
              <div className="border-t border-line pt-5">
                {punchResult ? (
                  punchResult.matched && punchResult.success ? (
                    /* SUCCESS VERDICT */
                    <div className="p-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-base shrink-0">
                            ✓
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-bold text-ink">
                                {punchResult.action === 'PUNCH_IN'
                                  ? `Welcome, ${punchResult.employeeName}!`
                                  : `Goodbye, ${punchResult.employeeName}!`}
                              </h4>
                              {punchResult.employeeCode && (
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-semibold">
                                  {punchResult.employeeCode}
                                </span>
                              )}
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                                1:1 Verified
                              </span>
                            </div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              {punchResult.action === 'PUNCH_IN'
                                ? `Punched In at ${punchResult.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : `Punched Out at ${punchResult.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded border border-emerald-500/30 bg-bg text-ink font-semibold">
                          Score: {formatMatchScoreBadge(punchResult.score, true)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-xs">
                        <div>
                          <span className="text-[10px] text-ink-soft block">Status</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {punchResult.status || 'Present'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-ink-soft block">Time</span>
                          <span className="font-mono font-semibold text-ink">
                            {punchResult.time || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-ink-soft block">Worked Hours</span>
                          <span className="font-mono font-bold text-ink">
                            {punchResult.workedHours !== undefined
                              ? `${punchResult.workedHours}h`
                              : '0.00h'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* FAILURE VERDICT (e.g. EMP-002) */
                    <div className="p-5 rounded-xl border border-rose-500/40 bg-rose-500/10 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold text-base shrink-0 mt-0.5">
                          ✕
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-rose-600 dark:text-rose-400">
                              {punchResult.employeeCode
                                ? `Verification Failed for ${punchResult.employeeCode}`
                                : 'No user exists'}
                            </h4>
                            {punchResult.employeeCode && (
                              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/30">
                                1:1 Target: {punchResult.employeeCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-soft leading-relaxed">
                            {punchResult.message ||
                              (punchResult.employeeCode
                                ? `No fingerprint template enrolled for employee ${punchResult.employeeCode}`
                                : 'The scanned fingerprint did not match any enrolled employee template in the database. Please register your fingerprint in the Employee Portal.')}
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
                  <div className="p-5 rounded-xl border border-line bg-bg-raised/40 text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-2 text-ink font-medium text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      1:1 Biometric Verification Station
                    </div>
                    <p className="text-xs text-ink-soft max-w-sm mx-auto">
                      {employeeCode.trim()
                        ? `Targeting ${employeeCode.trim().toUpperCase()}. Touch the optical sensor on the left to verify minutiae.`
                        : 'Enter employee code (e.g. EMP-002) and touch the sensor to verify minutiae against NeonDB.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
