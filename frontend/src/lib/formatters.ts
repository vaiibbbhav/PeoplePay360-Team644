export const formatCurrency = (val: string | number | undefined, show: boolean): string => {
  if (!show) return '****';
  const num = typeof val === 'string' ? parseFloat(val) : Number(val || 0);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatPeriod = (startStr: string): string => {
  if (!startStr) return '-';
  const date = new Date(startStr);
  if (isNaN(date.getTime())) return startStr;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const INDIAN_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns YYYY-MM-DD in Indian Standard Time (Asia/Kolkata).
 */
export const formatDateIST = (date?: Date | string | null): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

/**
 * Returns today's date YYYY-MM-DD in Indian Standard Time.
 */
export const getTodayIST = (): string => {
  return formatDateIST(new Date());
};

/**
 * Formats time strictly according to Indian Standard Time (hh:mm a or hh:mm:ss a).
 */
export const formatTimeIST = (isoString?: string | null, includeSeconds = false): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('en-IN', {
      timeZone: INDIAN_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
      hour12: true,
    });
  } catch {
    return isoString || '—';
  }
};

/**
 * Formats full timestamp in Indian Standard Time.
 */
export const formatDateTimeIST = (isoString?: string | null): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-IN', {
      timeZone: INDIAN_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString || '—';
  }
};

/**
 * Derives the calendar date in Indian Standard Time for an attendance record.
 * Prioritizes the actual check_in timestamp if available, falling back to record.date.
 */
export const getRecordDateIST = (rec: { date?: string; check_in?: string | null }): string => {
  if (rec.check_in) {
    const istDate = formatDateIST(rec.check_in);
    if (istDate) return istDate;
  }
  return rec.date || '';
};
