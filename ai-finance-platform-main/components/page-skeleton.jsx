export function PageSkeleton({ title = "Loading...", cards = 4 }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse pb-10">
      {/* Header Skeleton */}
      <div className="h-28 rounded-3xl bg-slate-200/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 p-6 flex flex-col justify-center space-y-2.5">
        <div className="h-6 w-48 bg-slate-300 dark:bg-slate-700/80 rounded-xl" />
        <div className="h-3 w-80 bg-slate-300/70 dark:bg-slate-700/50 rounded-lg" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-slate-200/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-20 bg-slate-300 dark:bg-slate-700/80 rounded-lg" />
              <div className="h-8 w-8 rounded-xl bg-slate-300 dark:bg-slate-700/80" />
            </div>
            <div className="space-y-1.5">
              <div className="h-6 w-28 bg-slate-300 dark:bg-slate-700/80 rounded-lg" />
              <div className="h-2.5 w-36 bg-slate-300/60 dark:bg-slate-700/40 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-80 rounded-3xl bg-slate-200/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 p-6 space-y-4">
          <div className="h-5 w-40 bg-slate-300 dark:bg-slate-700/80 rounded-xl" />
          <div className="h-52 w-full bg-slate-300/50 dark:bg-slate-700/30 rounded-2xl" />
        </div>
        <div className="lg:col-span-4 h-80 rounded-3xl bg-slate-200/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-300 dark:bg-slate-700/80 rounded-xl" />
          <div className="h-52 w-full bg-slate-300/50 dark:bg-slate-700/30 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
