"use client";

import { FileText } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export default function InvoicesPage() {
  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <PageHeader
          title="Invoices"
          subtitle={<span>Billing history for your workspace</span>}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <FileText className="h-6 w-6 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-500">No invoices yet</p>
          <p className="text-xs text-gray-400 text-center max-w-xs">
            Invoices will appear here once you upgrade to a paid plan. You&apos;re currently on the free Sandbox plan.
          </p>
        </div>
      </div>
    </div>
  );
}
