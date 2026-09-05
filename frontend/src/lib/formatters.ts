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
