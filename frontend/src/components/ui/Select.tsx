import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { ChevronDown, Check } from 'lucide-react';

type SelectContextType = {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLabel?: ReactNode;
  setSelectedLabel: React.Dispatch<React.SetStateAction<ReactNode>>;
  placeholder?: string;
  setPlaceholder: React.Dispatch<React.SetStateAction<string | undefined>>;
};

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const useSelect = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select subcomponents must be used within a <Select>');
  }
  return context;
};

export type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
};

export const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<ReactNode>(null);
  const [placeholder, setPlaceholder] = useState<string | undefined>(undefined);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleValueChange = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onValueChange?.(val);
    setOpen(false);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
        placeholder,
        setPlaceholder,
      }}
    >
      <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export type SelectTriggerProps = {
  children?: ReactNode;
  className?: string;
  id?: string;
  disabled?: boolean;
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className = '',
  id,
  disabled = false,
}) => {
  const { open, setOpen } = useSelect();

  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={() => setOpen((prev) => !prev)}
      className={`flex items-center justify-between gap-2 px-3.5 py-2 text-xs rounded-xl border border-line bg-bg text-ink focus:outline-none focus:border-accent hover:border-line-strong transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-haspopup="listbox"
      aria-expanded={open}
    >
      {children}
      <ChevronDown
        className={`w-3.5 h-3.5 text-ink-soft shrink-0 transition-transform duration-200 ${
          open ? 'rotate-180' : ''
        }`}
      />
    </button>
  );
};

export type SelectValueProps = {
  placeholder?: string;
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder: customPlaceholder }) => {
  const { selectedLabel, placeholder: ctxPlaceholder, setPlaceholder } = useSelect();

  useEffect(() => {
    if (customPlaceholder) {
      setPlaceholder(customPlaceholder);
    }
  }, [customPlaceholder, setPlaceholder]);

  return (
    <span className="truncate block font-normal">
      {selectedLabel || customPlaceholder || ctxPlaceholder || 'Select an option...'}
    </span>
  );
};

export type SelectContentProps = {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
};

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = '',
  align = 'start',
}) => {
  const { open } = useSelect();

  if (!open) return null;

  const alignClasses =
    align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';

  return (
    <div
      role="listbox"
      tabIndex={-1}
      className={`absolute z-50 mt-1.5 min-w-[160px] max-h-60 w-full overflow-auto rounded-xl border border-line bg-bg p-1 text-xs shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-none font-sans ${alignClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export type SelectItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  className = '',
  disabled = false,
}) => {
  const { value: selectedValue, onValueChange, setSelectedLabel } = useSelect();
  const isSelected = selectedValue === value;

  useEffect(() => {
    if (isSelected) {
      setSelectedLabel(children);
    }
  }, [isSelected, children, setSelectedLabel]);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => {
        if (!disabled) {
          onValueChange?.(value);
          setSelectedLabel(children);
        }
      }}
      className={`relative flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors ${
        isSelected
          ? 'bg-accent/10 text-accent font-medium'
          : 'text-ink hover:bg-bg-raised'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <span className="truncate">{children}</span>
      {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-2" />}
    </div>
  );
};
