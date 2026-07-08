import { RunDetail } from "./run-detail";
import type { TrainingRun } from "@/lib/model-training/types";

export const dynamic = "force-dynamic";

async function getRun(runId: string): Promise<TrainingRun | null> {
  try {
    const api = process.env.MODEL_TRAINING_API || "http://localhost:8000/api/v1";
    const res = await fetch(`${api}/runs/${runId}`, { next: { revalidate: 10 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

type Params = Promise<{ runId: string }>;

export default async function RunDetailPage({ params }: { params: Params }) {
  const { runId } = await params;
  const run = await getRun(runId);

  if (!run) {
    return (
      <div className="text-center py-24">
        <p className="text-[15px] text-[#777]">Run not found.</p>
      </div>
    );
  }

  return <RunDetail initialRun={run} />;
}
