export default function ChatLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse pb-10">
      <div className="h-20 rounded-3xl bg-slate-200/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-slate-300 dark:bg-slate-700/80" />
        <div className="space-y-1.5 flex-1">
          <div className="h-5 w-40 bg-slate-300 dark:bg-slate-700/80 rounded-lg" />
          <div className="h-3 w-64 bg-slate-300/60 dark:bg-slate-700/40 rounded" />
        </div>
      </div>
      <div className="h-[480px] rounded-3xl bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 p-6 flex flex-col justify-end space-y-4">
        <div className="h-14 w-3/5 bg-slate-300/70 dark:bg-slate-700/60 rounded-2xl self-start" />
        <div className="h-14 w-2/5 bg-blue-400/30 dark:bg-blue-600/30 rounded-2xl self-end" />
        <div className="h-20 w-4/5 bg-slate-300/70 dark:bg-slate-700/60 rounded-2xl self-start" />
        <div className="h-12 w-full bg-slate-300/50 dark:bg-slate-700/30 rounded-2xl" />
      </div>
    </div>
  );
}
