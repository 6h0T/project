'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
}

interface CustomSelectTriggerProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

interface CustomSelectContentProps {
  className?: string;
  children?: React.ReactNode;
  open?: boolean;
}

interface CustomSelectItemProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
  onSelect?: (value: string) => void;
  disabled?: boolean;
}

interface CustomSelectValueProps {
  children?: React.ReactNode;
  placeholder?: string;
}

const CustomSelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel?: string;
  setSelectedLabel?: (label: string) => void;
}>({
  open: false,
  setOpen: () => {},
});

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onValueChange, 
  children, 
  disabled 
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState<string>('');
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Reset selectedLabel when value changes externally
  React.useEffect(() => {
    if (!value) {
      setSelectedLabel('');
    }
  }, [value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const contextValue = React.useMemo(() => ({
    value,
    onValueChange,
    open: disabled ? false : open,
    setOpen: disabled ? () => {} : setOpen,
    selectedLabel,
    setSelectedLabel,
  }), [value, onValueChange, open, disabled, selectedLabel]);

  return (
    <CustomSelectContext.Provider value={contextValue}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </CustomSelectContext.Provider>
  );
};

export const CustomSelectTrigger: React.FC<CustomSelectTriggerProps> = ({ 
  className, 
  children 
}) => {
  const { open, setOpen } = React.useContext(CustomSelectContext);

  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 hover:bg-slate-600/80 transition-all duration-200',
        className
      )}
      onClick={() => setOpen(!open)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 text-slate-400" />
    </button>
  );
};

export const CustomSelectContent: React.FC<CustomSelectContentProps> = ({ 
  className, 
  children 
}) => {
  const { open } = React.useContext(CustomSelectContext);

  return (
    <div 
      className={`absolute top-full left-0 right-0 mt-1 origin-top transform transition-all duration-200 ease-out z-50 ${
        open 
          ? 'opacity-100 scale-y-100 translate-y-0' 
          : 'opacity-0 scale-y-0 -translate-y-2 pointer-events-none'
      }`}
      style={{
        transformOrigin: 'top center'
      }}
    >
      <div className={cn(
        'max-h-96 min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-lg bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-1',
        className
      )}>
        {children}
      </div>
    </div>
  );
};

export const CustomSelectItem: React.FC<CustomSelectItemProps> = ({ 
  value, 
  className, 
  children,
  disabled = false
}) => {
  const { value: selectedValue, onValueChange, setOpen, setSelectedLabel } = React.useContext(CustomSelectContext);
  const isSelected = value === selectedValue;

  const extractTextFromChildren = (children: React.ReactNode): string => {
    if (typeof children === 'string') {
      return children;
    }
    
    if (React.isValidElement(children)) {
      // Si es un elemento React, intentar extraer el texto recursivamente
      if (children.props && children.props.children) {
        return extractTextFromChildren(children.props.children);
      }
    }
    
    if (Array.isArray(children)) {
      // Si es un array, concatenar todos los textos
      return children.map(child => extractTextFromChildren(child)).join(' ');
    }
    
    return String(children || '');
  };

  const handleSelect = () => {
    if (disabled) return;
    onValueChange?.(value);
    
    // Extraer el texto de manera más robusta
    const labelText = extractTextFromChildren(children);
    setSelectedLabel?.(labelText);
    setOpen(false);
  };

  return (
    <div
      className={cn(
        'relative flex w-full select-none items-center rounded-md py-2 pl-8 pr-2 text-sm text-slate-300 transition-colors duration-200 outline-none',
        disabled 
          ? 'cursor-not-allowed opacity-50 text-slate-500'
          : 'cursor-pointer hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white',
        isSelected && !disabled && 'bg-white/10 text-white',
        className
      )}
      onClick={handleSelect}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && !disabled && <Check className="h-4 w-4 text-cyan-400" />}
      </span>
      {children}
    </div>
  );
};

export const CustomSelectValue: React.FC<CustomSelectValueProps> = ({ children, placeholder }) => {
  const { value, selectedLabel } = React.useContext(CustomSelectContext);
  
  // Si hay children personalizados y tenemos un valor seleccionado, mostrar los children
  if (children && value) {
    return <span className="block truncate text-white">{children}</span>;
  }
  
  // Si tenemos selectedLabel, mostrarlo
  if (selectedLabel) {
    return <span className="block truncate text-white">{selectedLabel}</span>;
  }
  
  // Si no hay nada seleccionado, mostrar placeholder
  if (placeholder) {
    return <span className="block truncate text-slate-400">{placeholder}</span>;
  }
  
  return <span className="block truncate text-slate-400">Seleccionar...</span>;
};

// Export with same names as shadcn for easy replacement
export { CustomSelect as Select };
export { CustomSelectTrigger as SelectTrigger };
export { CustomSelectContent as SelectContent };
export { CustomSelectItem as SelectItem };
export { CustomSelectValue as SelectValue }; 