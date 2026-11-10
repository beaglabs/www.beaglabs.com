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
          <span className="text-sm font-semibold text-[#1a1714]">
            {reviewed} / {total}
          </span>
          <span className="text-[11px] text-[#a08b78]">reviewed</span>
        </div>
        <span className="text-[11px] text-[#a08b78]">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-[#e2c9a6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? "#2E7D32" : "#e5632f",
          }}
        />
      </div>
      {etaMinutes != null && etaMinutes > 0 && (
        <p className="text-[10px] text-[#e5632f] mt-1">
          ~{etaMinutes} min remaining
        </p>
      )}
    </div>
  );
}
