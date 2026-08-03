"use client";

import { Button } from "@/components/ui/button";

interface ReviewSubmitProps {
  reviewedCount: number;
  totalCount: number;
  submitting: boolean;
  onSubmit: () => void;
}

export function ReviewSubmit({
  reviewedCount,
  totalCount,
  submitting,
  onSubmit,
}: ReviewSubmitProps) {
  const allDone = reviewedCount >= totalCount;

  return (
    <div className="space-y-2">
      <Button
        onClick={onSubmit}
        disabled={reviewedCount === 0 || submitting}
        className="w-full rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-10"
        style={{ backgroundColor: "#ff5f1f" }}
      >
        {submitting
          ? "Submitting..."
          : `Submit ${reviewedCount} Review${reviewedCount !== 1 ? "s" : ""}`}
        {" "}
        <kbd className="ml-2 bg-black/15 rounded px-1.5 py-0.5 text-[9px] leading-none">&#8629;</kbd>
      </Button>

      {allDone && !submitting && (
        <p className="text-[10px] text-[#2E7D32] text-center">
          All reviews complete! Press Enter to submit and trigger retraining.
        </p>
      )}
    </div>
  );
}
