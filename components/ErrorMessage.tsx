"use client";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-8 text-center shadow-[var(--glass-shadow)] backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-sm text-amber-900">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--glass-shadow)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
        >
          再試行
        </button>
      )}
    </div>
  );
}
