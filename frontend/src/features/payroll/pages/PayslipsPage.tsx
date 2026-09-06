import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAllCompanyPayslips, usePayslipDetail } from '@/features/compensation/queries/useEmployeePayslips';
import { formatCurrency, formatPeriod } from '@/lib/formatters';
import { PayslipDetailModal } from '@/features/compensation/components/PayslipDetailModal';
import { MonthlyPayslipDocument } from '@/features/compensation/components/MonthlyPayslipDocument';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';
import {
  FileText,
  Download,
  Printer,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Layers,
  RefreshCw,
} from 'lucide-react';

type PayslipSortOption = 'date_desc' | 'date_asc' | 'net_desc' | 'net_asc' | 'name_asc';

export const PayslipsPage: React.FC = () => {
  const {
    data: payslips = [],
    isLoading,
    isError,
    refetch,
  } = useAllCompanyPayslips();

  // Selected payslip for modal
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const { data: selectedPayslipDetail } = usePayslipDetail(selectedPayslipId);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayrun, setSelectedPayrun] = useState<string>('all');
  const [selectedStructure, setSelectedStructure] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<PayslipSortOption>('date_desc');

  // Derive unique payruns and salary structures from payslips
  const uniquePayruns = useMemo(() => {
    const map = new Map<string, string>();
    payslips.forEach((p) => {
      if (p.payrun_id && p.payrun_name) {
        map.set(p.payrun_id, p.payrun_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [payslips]);

  const uniqueStructures = useMemo(() => {
    const map = new Map<string, string>();
    payslips.forEach((p) => {
      if (p.structure_id && p.structure_name) {
        map.set(p.structure_id, p.structure_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [payslips]);

  // Filtered and Sorted Payslips
  const filteredPayslips = useMemo(() => {
    return payslips
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (p.employee_name || '').toLowerCase();
          const email = (p.employee_email || '').toLowerCase();
          const runName = (p.payrun_name || '').toLowerCase();
          if (!name.includes(q) && !email.includes(q) && !runName.includes(q)) {
            return false;
          }
        }
        // Payrun filter
        if (selectedPayrun !== 'all' && p.payrun_id !== selectedPayrun) {
          return false;
        }
        // Structure filter
        if (selectedStructure !== 'all' && p.structure_id !== selectedStructure) {
          return false;
        }
        // Status filter (resolving effective status from payslip or parent payrun)
        if (selectedStatus !== 'all') {
          const effective = (
            (p.status && p.status.toLowerCase() !== 'draft' ? p.status : p.payrun_status) ||
            p.status ||
            'computed'
          ).toLowerCase();
          if (effective !== selectedStatus.toLowerCase()) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.period_start).getTime() - new Date(a.period_start).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.period_start).getTime() - new Date(b.period_start).getTime();
        }
        if (sortBy === 'net_desc') {
          return Number(b.net_salary) - Number(a.net_salary);
        }
        if (sortBy === 'net_asc') {
          return Number(a.net_salary) - Number(b.net_salary);
        }
        if (sortBy === 'name_asc') {
          return (a.employee_name || '').localeCompare(b.employee_name || '');
        }
        return 0;
      });
  }, [payslips, searchQuery, selectedPayrun, selectedStructure, selectedStatus, sortBy]);

  // KPI Calculations
  const totalCount = filteredPayslips.length;
  const totalGross = filteredPayslips.reduce((acc, p) => acc + (Number(p.gross_salary) || 0), 0);
  const totalDeductions = filteredPayslips.reduce((acc, p) => acc + (Number(p.total_deductions) || 0), 0);
  const totalNet = filteredPayslips.reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);
  const avgNet = totalCount > 0 ? totalNet / totalCount : 0;

  // Handle Export to CSV
  const handleExportCSV = () => {
    if (filteredPayslips.length === 0) return;
    const headers = [
      'Employee Name',
      'Employee Email',
      'Payrun',
      'Salary Structure',
      'Period Start',
      'Period End',
      'Worked Days',
      'Basic Salary',
      'Gross Salary',
      'Deductions',
      'Net Salary',
      'Status',
    ];
    const rows = filteredPayslips.map((p) => [
      `"${p.employee_name || ''}"`,
      `"${p.employee_email || ''}"`,
      `"${p.payrun_name || ''}"`,
      `"${p.structure_name || ''}"`,
      p.period_start,
      p.period_end,
      p.worked_days,
      p.basic_salary,
      p.gross_salary,
      p.total_deductions,
      p.net_salary,
      p.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `company_payslips_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPayslip = (payslipId: string) => {
    setSelectedPayslipId(payslipId);
    setIsPrintModalOpen(true);
  };

  const renderStatusBadge = (status?: string | null, payrunStatus?: string | null) => {
    const raw = (
      (status && status.toLowerCase() !== 'draft' ? status : payrunStatus) ||
      status ||
      'computed'
    ).toLowerCase();
    switch (raw) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Paid
          </span>
        );
      case 'validated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50">
            <Clock className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            Validated
          </span>
        );
      case 'computed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50">
            Computed
          </span>
        );
    }
  };

  return (
    <AppLayout title="All Employee Payslips">
      <div className="space-y-6 w-full min-w-0 max-w-7xl mx-auto font-sans">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
              Payroll Administration
            </span>
            <h1 className="text-2xl lg:text-3xl font-sans font-medium text-ink tracking-tight mt-1">
              All Employee Payslips
            </h1>
            <p className="text-xs text-ink-soft mt-1 max-w-2xl">
              Complete organizational registry of all computed, validated, and paid employee payslips across all payruns.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredPayslips.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-line bg-bg hover:bg-bg-raised text-ink transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-ink-soft" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-line bg-bg hover:bg-bg-raised text-ink transition-all cursor-pointer shadow-xs"
              title="Refresh payslips"
            >
              <RefreshCw className="w-3.5 h-3.5 text-ink-soft" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl border border-line bg-bg shadow-2xs">
            <span className="text-xs font-medium text-ink-soft flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-ink-soft" />
              Total Payslips
            </span>
            <span className="text-xl font-sans font-bold text-ink mt-1.5 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-ink-soft mt-0.5 block">Issued across runs</span>
          </div>

          <div className="p-4 rounded-2xl border border-line bg-bg shadow-2xs">
            <span className="text-xs font-medium text-ink-soft flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-ink-soft" />
              Total Gross
            </span>
            <span className="text-xl font-bold text-ink mt-1.5 block font-mono">
              {formatCurrency(totalGross, true)}
            </span>
            <span className="text-[11px] text-ink-soft mt-0.5 block">Earnings computed</span>
          </div>

          <div className="p-4 rounded-2xl border border-line bg-bg shadow-2xs">
            <span className="text-xs font-medium text-ink-soft flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-ink-soft" />
              Total Deductions
            </span>
            <span className="text-xl font-bold text-ink mt-1.5 block font-mono">
              {formatCurrency(totalDeductions, true)}
            </span>
            <span className="text-[11px] text-ink-soft mt-0.5 block">PF, PT, TDS withheld</span>
          </div>

          <div className="p-4 rounded-2xl border border-line bg-bg shadow-2xs">
            <span className="text-xs font-medium text-ink-soft flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-ink-soft" />
              Net Disbursed
            </span>
            <span className="text-xl font-bold text-ink mt-1.5 block font-mono">
              {formatCurrency(totalNet, true)}
            </span>
            <span className="text-[11px] text-ink-soft mt-0.5 block">Take-home salary</span>
          </div>

          <div className="p-4 rounded-2xl border border-line bg-bg shadow-2xs col-span-2 lg:col-span-1">
            <span className="text-xs font-medium text-ink-soft flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-ink-soft" />
              Average Net
            </span>
            <span className="text-xl font-bold text-ink mt-1.5 block font-mono">
              {formatCurrency(avgNet, true)}
            </span>
            <span className="text-[11px] text-ink-soft mt-0.5 block">Per employee / cycle</span>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="p-4 rounded-2xl border border-line bg-bg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
          {/* Search Box */}
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Search by employee name, email, or payrun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Payrun Filter */}
            {uniquePayruns.length > 0 && (
              <Select value={selectedPayrun} onValueChange={setSelectedPayrun}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Payruns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payruns</SelectItem>
                  {uniquePayruns.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Salary Structure Filter */}
            {uniqueStructures.length > 0 && (
              <Select value={selectedStructure} onValueChange={setSelectedStructure}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Structures" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Structures</SelectItem>
                  {uniqueStructures.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="validated">Validated</SelectItem>
                <SelectItem value="computed">Computed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as PayslipSortOption)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest Period First</SelectItem>
                <SelectItem value="date_asc">Oldest Period First</SelectItem>
                <SelectItem value="net_desc">Net Salary: High to Low</SelectItem>
                <SelectItem value="net_asc">Net Salary: Low to High</SelectItem>
                <SelectItem value="name_asc">Employee Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center space-y-3 border border-line rounded-2xl bg-bg">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-ink-soft">Loading all company payslips...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-8 text-center border border-line rounded-2xl bg-bg-raised space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="font-sans text-base font-bold text-ink">Failed to Load Payslips</h3>
            <p className="text-xs text-ink-soft max-w-sm mx-auto">
              Could not retrieve employee payslips. Ensure your account has appropriate payroll or HR permissions.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Payslips Table */}
        {!isLoading && !isError && (
          <div className="border border-line rounded-2xl overflow-hidden bg-bg shadow-2xs w-full min-w-0">
            {filteredPayslips.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <FileText className="w-8 h-8 text-ink-soft mx-auto opacity-50" />
                <h3 className="font-sans text-base font-bold text-ink">No Payslips Found</h3>
                <p className="text-xs text-ink-soft max-w-sm mx-auto">
                  {searchQuery || selectedPayrun !== 'all' || selectedStatus !== 'all'
                    ? 'No payslips match your current search or filter criteria. Try clearing filters.'
                    : 'No payruns have generated payslips yet. Start by creating and computing a payrun in the Payruns section.'}
                </p>
                {(searchQuery || selectedPayrun !== 'all' || selectedStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedPayrun('all');
                      setSelectedStructure('all');
                      setSelectedStatus('all');
                    }}
                    className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-medium border border-line bg-bg hover:bg-bg-raised text-ink cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-xs text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-line bg-bg-raised/70 text-ink-soft font-semibold">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Pay Run / Period</th>
                      <th className="py-3 px-4">Salary Structure</th>
                      <th className="py-3 px-3 text-center">Worked Days</th>
                      <th className="py-3 px-4 text-right">Basic</th>
                      <th className="py-3 px-4 text-right">Gross</th>
                      <th className="py-3 px-4 text-right">Deductions</th>
                      <th className="py-3 px-4 text-right font-bold text-ink">Net Salary</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredPayslips.map((p) => {
                      const initials = (p.employee_name || 'E')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-bg-raised/50 transition-colors group cursor-pointer"
                          onClick={() => setSelectedPayslipId(p.id)}
                        >
                          {/* Employee Info */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                                {initials}
                              </div>
                              <div>
                                <span className="font-semibold text-ink block text-xs group-hover:text-accent transition-colors">
                                  {p.employee_name || 'Unnamed Employee'}
                                </span>
                                <span className="text-[11px] text-ink-soft block font-mono">
                                  {p.employee_email || p.employee_id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Payrun & Period */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-ink block">
                              {p.payrun_name || 'Standard Payrun'}
                            </span>
                            <span className="text-[11px] text-ink-soft block font-mono">
                              {formatPeriod(p.period_start)}
                            </span>
                          </td>

                          {/* Structure */}
                          <td className="py-3 px-4 whitespace-nowrap text-ink-soft">
                            <span className="font-mono text-xs">{p.structure_name || 'Standard Package'}</span>
                          </td>

                          {/* Worked Days */}
                          <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-ink">
                            {p.worked_days}d
                          </td>

                          {/* Basic Salary */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-ink-soft">
                            {formatCurrency(Number(p.basic_salary), true)}
                          </td>

                          {/* Gross Salary */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-medium text-ink">
                            {formatCurrency(Number(p.gross_salary), true)}
                          </td>

                          {/* Deductions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-ink-soft font-medium">
                            -{formatCurrency(Number(p.total_deductions), true)}
                          </td>

                          {/* Net Salary */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-ink text-sm">
                            {formatCurrency(Number(p.net_salary), true)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {renderStatusBadge(p.status, p.payrun_status)}
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3 px-4 text-center whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedPayslipId(p.id)}
                                className="p-1.5 text-ink-soft hover:text-accent rounded-lg hover:bg-bg-raised transition-colors cursor-pointer"
                                title="View payslip breakdown"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePrintPayslip(p.id)}
                                className="p-1.5 text-ink-soft hover:text-ink rounded-lg hover:bg-bg-raised transition-colors cursor-pointer"
                                title="Print / PDF salary slip"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payslip Breakdown Modal */}
      {selectedPayslipId && !isPrintModalOpen && (
        <PayslipDetailModal
          payslipId={selectedPayslipId}
          onClose={() => setSelectedPayslipId(null)}
          showValues={true}
        />
      )}

      {/* Printable Monthly Document Modal */}
      {selectedPayslipId && isPrintModalOpen && selectedPayslipDetail && (
        <MonthlyPayslipDocument
          payslip={selectedPayslipDetail}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedPayslipId(null);
          }}
        />
      )}
    </AppLayout>
  );
};

export default PayslipsPage;
