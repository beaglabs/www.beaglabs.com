"use client";

interface ReviewProgressProps {
  reviewed: number;
  total: number;
  etaMinutes?: number;
  className?: string;
}

export function ReviewProgress({
  reviewed,
  total,
  etaMinutes,
  className = "",
}: ReviewProgressProps) {
  const pct = total > 0 ? (reviewed / total) * 100 : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#111]">
            {reviewed} / {total}
          </span>
          <span className="text-[11px] text-[#999]">reviewed</span>
        </div>
        <span className="text-[11px] text-[#999]">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-[#E2E0DB] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? "#2E7D32" : "#C7661D",
          }}
        />
      </div>
      {etaMinutes != null && etaMinutes > 0 && (
        <p className="text-[10px] text-[#C7661D] mt-1">
          ~{etaMinutes} min remaining
        </p>
      )}
    </div>
  );
}
