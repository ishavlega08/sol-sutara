// Consistent action buttons — ghost, gradient, danger — reused everywhere

import { type ButtonHTMLAttributes } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "gradient" | "danger" | "outline";
  size?: "sm" | "md";
  loading?: boolean;
}

export default function ActionButton({
  variant = "ghost",
  size = "sm",
  loading,
  children,
  className = "",
  disabled,
  ...props
}: ActionButtonProps) {
  const pad  = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
  const base = `inline-flex items-center gap-1.5 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${pad}`;

  const variants: Record<string, string> = {
    ghost:   "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800",
    gradient:"text-white hover:opacity-90",
    danger:  "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900",
    outline: "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800",
  };

  const style = variant === "gradient" ? { background: "linear-gradient(135deg, #7c3aed, #6d28d9)" } : undefined;

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      style={style}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
