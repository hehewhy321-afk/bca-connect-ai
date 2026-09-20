import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Suspense fallback for the assistant route. Renders the real chat shell —
 * sidebar, action bar, composer — so the page doesn't blank out to a spinner
 * while its chunk loads.
 */
export function ChatSkeleton() {
  return (
    <DashboardLayout hideHeader fullBleed>
      <div className="flex h-[calc(100dvh-3.25rem)] min-h-0 flex-col lg:h-[100dvh]">
        <div className="flex items-center justify-end gap-1.5 border-b border-border px-4 py-2.5">
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-6 overflow-hidden p-4 lg:px-8">
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-80 max-w-full" />

              <div className="mt-4 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-md" />
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-background p-3 lg:px-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
              <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
              <Skeleton className="h-11 flex-1 rounded-md" />
              <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
            </div>
            <div className="mt-2 flex justify-center">
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
