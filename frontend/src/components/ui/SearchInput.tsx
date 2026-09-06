import React, { type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

export type SearchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  wrapperClassName?: string;
};

export const SearchInput: React.FC<SearchInputProps> = ({
  className = '',
  wrapperClassName = '',
  ...props
}) => {
  return (
    <div className={`relative flex-1 w-full ${wrapperClassName}`}>
      <Search className="w-4 h-4 text-ink-soft absolute left-3 top-2.5 pointer-events-none" />
      <input
        type="text"
        className={`w-full pl-9 pr-4 py-2 rounded-xl border border-line bg-bg-raised text-ink text-xs placeholder:text-ink-soft/60 focus:outline-none focus:border-accent transition-all ${className}`}
        {...props}
      />
    </div>
  );
};
