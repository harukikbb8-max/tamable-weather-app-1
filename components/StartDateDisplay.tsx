"use client";

/**
 * 表示開始日は常に「今日（現在から）」のみ表示。選択不可。
 */
export function StartDateDisplay() {
  return (
    <div className="flex flex-col justify-end">
      <span className="text-xs font-medium text-[var(--text-muted)]">
        表示開始日
      </span>
      <span className="mt-1 text-sm text-[var(--text)]" aria-hidden>
        今日（現在から）
      </span>
    </div>
  );
}
