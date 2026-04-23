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
    <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "px-5 py-4"}>{children}</div>
    </div>
  );
}
