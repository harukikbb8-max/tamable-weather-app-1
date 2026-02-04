"use client";

export function LoadingSpinner() {
  return (
    <div
      className="flex h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--glass-border)] bg-white/40 shadow-[var(--glass-shadow)] backdrop-blur-xl"
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
