"use client";

export function LoadingSpinner() {
  return (
    <div
      className="flex h-[340px] flex-col items-center justify-center gap-4 rounded-xl border border-[var(--chart-grid)] bg-[var(--accent-soft)]/50"
      role="status"
      aria-label="読み込み中"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--accent)]"
        aria-hidden
      />
      <p className="text-sm text-[var(--text-muted)]">取得中</p>
    </div>
  );
}
