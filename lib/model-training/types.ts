export interface TrainingRun {
  id: string;
  organization_id: string;
  name: string;
  status: RunStatus;
  model_tier: "starter" | "standard" | "performance";
  task_type: "classification" | "relevance" | "extraction" | "code";
  base_model_id: string;
  total_examples: number;
  contested_examples: number;
  reviewed_examples: number;
  estimated_accuracy: number | null;
  disagreement_rate: number | null;
  tinker_run_id: string | null;
  tinker_checkpoint_id: string | null;
  onnx_s3_uri: string | null;
  training_cost: number | null;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export type RunStatus =
  | "data_ingested"
  | "deepseek_labeling"
  | "training"
  | "sampling"
  | "disagreement"
  | "awaiting_review"
  | "retraining"
  | "opd_recovery"
  | "exporting"
  | "complete"
  | "failed";

export interface TrainingExample {
  id: string;
  input_data: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  frontier_label: string | null;
  model_label: string | null;
  model_confidence: number | null;
  kl_divergence: number | null;
  is_contested: boolean;
  reviewed: boolean;
}

export interface PaginatedExamples {
  items: TrainingExample[];
  total: number;
  offset: number;
  limit: number;
}

export interface FewShotExample {
  text: string;
  label: string;
}

export interface TaskDefinition {
  type: TaskType;
  labels: string[];
  query: string;
  fields: string[];
  description: string;
  language: string;
  few_shot_examples: FewShotExample[];
}

export type TaskType = "classification" | "relevance" | "extraction" | "code" | "custom";

export interface CreateRunPayload {
  organization_id: string;
  name?: string;
  model_tier?: string;
  task_type?: string;
  task_definition?: TaskDefinition;
}

export interface ReviewSubmission {
  example_id: string;
  corrected_label: string;
}

export interface ReviewResult {
  status: string;
  reviewed: number;
  contested: number;
  all_reviewed: boolean;
}

export interface ExportInfo {
  url: string;
  format: string;
  checkpoint_id: string | null;
}
