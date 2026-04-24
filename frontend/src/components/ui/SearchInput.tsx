// Reusable search input — used in Components list, Trace, Recall

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({ value, onChange, placeholder = "Search…", className = "" }: SearchInputProps) {
  return (
    <div className={`flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200 dark:placeholder:text-gray-500"
      />
    </div>
  );
}
