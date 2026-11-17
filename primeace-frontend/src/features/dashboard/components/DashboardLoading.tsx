function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      aria-live="polite"
      className="animate-pulse space-y-8"
    >
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="h-8 w-56 max-w-full rounded bg-slate-200" />
          <div className="h-4 w-64 max-w-full rounded bg-slate-200" />
        </div>

        <div className="h-10 w-28 rounded-lg bg-slate-200" />
      </div>

      {/* Statistics */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-4 w-56 max-w-full rounded bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-36 rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="h-4 w-28 rounded bg-slate-200" />
                  <div className="h-8 w-20 rounded bg-slate-200" />
                </div>

                <div className="h-9 w-9 rounded-lg bg-slate-100" />
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3">
                <div className="h-3 w-32 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent operations */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-44 rounded bg-slate-200" />
          <div className="h-4 w-60 max-w-full rounded bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="min-h-72 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded bg-slate-200" />
                  <div className="h-3 w-52 max-w-full rounded bg-slate-100" />
                </div>

                <div className="h-4 w-16 rounded bg-slate-100" />
              </div>

              <div className="mt-7 divide-y divide-slate-100">
                {Array.from({ length: 3 }).map((_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-28 max-w-full rounded bg-slate-200" />
                      <div className="h-3 w-40 max-w-full rounded bg-slate-100" />
                      <div className="h-3 w-32 max-w-full rounded bg-slate-100" />
                    </div>

                    <div className="shrink-0 space-y-2">
                      <div className="h-5 w-20 rounded-md bg-slate-100" />
                      <div className="h-3 w-16 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="h-4 w-60 max-w-full rounded bg-slate-200" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100" />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/4 max-w-full rounded bg-slate-200" />
                  <div className="h-3 w-40 max-w-full rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <span className="sr-only">Loading dashboard data...</span>
    </div>
  );
}

export default DashboardLoading;