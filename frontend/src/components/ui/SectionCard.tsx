// Card panel with optional header — reused on detail, trace, recall, analytics pages

interface SectionCardProps {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function SectionCard({ title, action, children, className = "", noPadding }: SectionCardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          {title && <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "px-5 py-4"}>{children}</div>
    </div>
  );
}
