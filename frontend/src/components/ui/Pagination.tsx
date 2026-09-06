import React, { useMemo, useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from 'lucide-react';

export type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  variant?: 'table' | 'standalone';
  className?: string;
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50],
  itemName = 'records',
  variant = 'table',
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Determine slice range for display label
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (totalItems <= 0) return null;

  const containerStyle =
    variant === 'standalone'
      ? 'border border-line rounded-2xl'
      : 'border-t border-line';

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg text-xs text-ink-soft ${containerStyle} ${className}`}
    >
      {/* Left: Range and total count */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <span>
          Showing <span className="font-semibold text-ink">{startItem}</span>–
          <span className="font-semibold text-ink">{endItem}</span> of{' '}
          <span className="font-semibold text-ink">{totalItems}</span> {itemName}
        </span>

        {/* Page Size Selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-line">
            <span className="text-[11px] text-ink-soft whitespace-nowrap">Per page:</span>
            <div className="relative inline-flex items-center">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                aria-label="Records per page"
                className="appearance-none h-7 pl-2.5 pr-6 text-xs bg-bg text-ink border border-line rounded-lg hover:border-line-strong focus:outline-none focus:border-accent cursor-pointer transition-colors font-medium select-none"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size} className="bg-bg text-ink py-1">
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink-soft absolute right-1.5 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="First page"
          className="p-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous page"
          className="p-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numeric page items */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-ink-soft select-none">
                  …
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-ink font-semibold border border-accent shadow-xs'
                    : 'bg-bg text-ink hover:bg-bg-raised border border-line'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next page"
          className="p-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Last page"
          className="p-1.5 rounded-lg border border-line bg-bg hover:bg-bg-raised text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Clean reusable pagination hook for arrays
 */
export function usePagination<T>(items: T[], initialPageSize = 15) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // When items change (e.g. search filter applied), ensure currentPage doesn't exceed totalPages
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [items.length, pageSize, totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems: items.length,
    paginatedItems,
  };
}
