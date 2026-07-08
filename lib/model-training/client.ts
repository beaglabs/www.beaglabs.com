import type {
  TrainingRun,
  TrainingExample,
  PaginatedExamples,
  CreateRunPayload,
  ReviewSubmission,
  ReviewResult,
  ExportInfo,
} from "./types";

const API_BASE = process.env.MODEL_TRAINING_API || "http://localhost:8000/api/v1";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    let detail: string = `Training API error ${res.status}`;
    try {
      const parsed = JSON.parse(body);
      const d = parsed.detail;
      if (Array.isArray(d)) detail = d.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join("; ");
      else if (typeof d === "string") detail = d;
      else if (d && typeof d === "object") detail = JSON.stringify(d);
      else if (typeof parsed === "string") detail = parsed;
    } catch { detail = body || detail; }
    throw new Error(detail);
  }

  return res.json();
}

export async function getRun(runId: string): Promise<TrainingRun> {
  return fetchApi<TrainingRun>(`/runs/${runId}`, { next: { revalidate: 10 } });
}

export async function listRuns(
  organizationId: string,
  limit = 50,
  offset = 0,
): Promise<TrainingRun[]> {
  const params = new URLSearchParams({ organization_id: organizationId, limit: String(limit), offset: String(offset) });
  return fetchApi<TrainingRun[]>(`/runs?${params}`, { next: { revalidate: 10 } });
}

export async function createRun(payload: CreateRunPayload): Promise<TrainingRun> {
  return fetchApi<TrainingRun>("/runs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getExamples(
  runId: string,
  limit = 100,
  offset = 0,
): Promise<PaginatedExamples> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return fetchApi<PaginatedExamples>(`/runs/${runId}/examples?${params}`, { next: { revalidate: 10 } });
}

export async function getReviewQueue(
  runId: string,
  limit = 100,
  offset = 0,
): Promise<PaginatedExamples> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return fetchApi<PaginatedExamples>(`/runs/${runId}/review?${params}`, { next: { revalidate: 5 } });
}

export async function submitReviews(
  runId: string,
  reviews: ReviewSubmission[],
): Promise<ReviewResult> {
  return fetchApi<ReviewResult>(`/runs/${runId}/review`, {
    method: "POST",
    body: JSON.stringify(reviews),
  });
}

export async function triggerRetrain(runId: string): Promise<{ status: string; run_id: string }> {
  return fetchApi<{ status: string; run_id: string }>(`/runs/${runId}/retrain`, {
    method: "POST",
  });
}

export async function getExport(runId: string): Promise<ExportInfo> {
  return fetchApi<ExportInfo>(`/runs/${runId}/export`, { next: { revalidate: 30 } });
}
