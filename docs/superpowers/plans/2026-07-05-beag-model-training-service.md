# Beag Custom Model Training Service — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a service that trains small domain-specific models (500M–5B) for customers in <24 hours. Cold start via DeepSeek frontier labels + model disagreement filter. Training on Tinker (cloud) or Unsloth (on-prem). Model as deliverable; anonymized customer data feeds a domain-adapted base model library.

**Architecture:** Python backend (FastAPI) orchestrates Tinker API (cloud) or Unsloth stack (on-prem). Next.js in-app review UI. PostgreSQL + S3 for state and data. OpenAPI 3.1 API with auto-generated SDKs (Stainless/Speakeasy). ONNX model export for deployment.

**Tech Stack:** FastAPI, Tinker API, DeepSeek API, Unsloth, PyTorch, ONNX, PostgreSQL, S3, Next.js, OpenAPI 3.1, Stainless/Speakeasy, Celery/Temporal, Qwen3.5-9B-Base

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         YOUR PRODUCT                                  │
│                                                                       │
│  API Layer (OpenAPI 3.1 — Stainless generates SDKs)                  │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │ POST /runs                    POST /connectors/auth           │     │
│  │ GET /runs/{id}                POST /connectors/sync           │     │
│  │ GET /runs/{id}/review         GET /connectors/{id}/schema     │     │
│  │ POST /runs/{id}/review        POST /connectors/webhook        │     │
│  │ POST /runs/{id}/retrain                                        │     │
│  │ GET /runs/{id}/export                                           │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  Cloud Pipeline (default)               On-Prem Pipeline (contract)  │
│  ┌──────────────────────────────┐       ┌────────────────────────┐   │
│  │ Orchestration Engine         │       │ Unsloth + custom OPD   │   │
│  │ (FastAPI + Celery/Temporal)  │       │ Self-contained Docker  │   │
│  │                              │       │ Customer GPU cluster   │   │
│  │ ┌──────┐ ┌────────┐         │       │ Deployed by your eng   │   │
│  │ │Tinker│ │ DeepSeek│         │       └────────────────────────┘   │
│  │ │ API  │ │  API   │         │                                     │
│  │ └──────┘ └────────┘         │                                     │
│  └──────────────────────────────┘                                     │
│                                                                       │
│  Base Model Library (your moat)                                       │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │ LoRA adapters → de-identify (NER) → store in S3 →           │     │
│  │ distill into domain base when threshold reached               │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  Data Store                                                           │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │ PostgreSQL: customers, training_runs, review_examples,        │     │
│  │   checkpoints, base_models, connectors                        │     │
│  │ S3: Raw data, labels, exported ONNX models, adapter weights   │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Tinker Training Orchestration Pipeline

**Goal:** Core pipeline that accepts customer data → trains on Tinker → runs disagreement → collects reviews → retrains → exports ONNX. Phase 1 assumes CSV upload with initial labels (DeepSeek cold start is Phase 2).

**Dependencies:** Tinker API access, Qwen3.5-9B-Base availability on Tinker.

---

### Task 1: Tinker API Client

**Files:**
- Create: `backend/tinker/client.py`
- Create: `backend/tinker/models.py`
- Create: `backend/tinker/config.py`

- [ ] **Step 1: Set up Tinker auth**

Get API key from Tinker console. Store as `TINKER_API_KEY` env var.

- [ ] **Step 2: Implement client wrapper**

Wrap Tinker's four core functions:

```python
# tinker/client.py (pseudocode)
class TinkerClient:
    def train(self, model_id, dataset, params) -> RunId
    def forward_backward(self, run_id) -> None
    def optim_step(self, run_id) -> None
    def sample(self, run_id, prompt_data) -> Logprobs
    def save_state(self, run_id) -> CheckpointId
    def download_checkpoint(self, checkpoint_id) -> Path
    def get_run_status(self, run_id) -> RunStatus
```

Tinker API is REST-based. Use `httpx` for async HTTP calls. Each call returns a run ID for tracking long-running operations.

- [ ] **Step 3: Model lineup config**

Map model tiers to Tinker model IDs:

```python
# tinker/config.py
MODEL_TIERS = {
    "starter": {        # 500M equivalent
        "tinker_id": "qwen3.5-4b",
        "context": 32768,
        "train_cost_per_mtok": 0.67,
        "sample_cost_per_mtok": 0.67,
    },
    "standard": {       # 1B equivalent
        "tinker_id": "qwen3.5-9b-base",
        "context": 65536,
        "train_cost_per_mtok": 1.33,
        "sample_cost_per_mtok": 1.33,
    },
    "performance": {    # 5B equivalent
        "tinker_id": "qwen3.5-35b-a3b",
        "context": 65536,
        "train_cost_per_mtok": 1.07,
        "sample_cost_per_mtok": 0.89,
    },
}
```

- [ ] **Step 4: Verify Tinker API works end-to-end**

Write a test script that:
1. Uploads a small dataset (~100 examples)
2. Trains Qwen3.5-9B-Base with LoRA (rank=32)
3. Checks status until complete
4. Downloads checkpoint
5. Verifies model loads correctly

---

### Task 2: Orchestration Engine

**Files:**
- Create: `backend/orchestrator/state_machine.py`
- Create: `backend/orchestrator/pipeline.py`
- Create: `backend/orchestrator/schemas.py`

- [ ] **Step 1: Define state machine**

```
DATA_INGESTED → DEEPSEEK_LABELING → TRAINING → SAMPLING → DISAGREEMENT_SCAN
→ AWAITING_REVIEW → RETRAINING → OPD_RECOVERY → EXPORTING → COMPLETE

Error states: FAILED (any step), EXPIRED (customer didn't review in time)
```

- [ ] **Step 2: Implement pipeline runner**

```python
# orchestrator/pipeline.py (pseudocode)
class TrainingPipeline:
    def run(self, customer_id, data_uri, label_field, config):
        # 1. Ingest data from S3
        # 2. If warm start: check base model library
        # 3. Train on Tinker (LoRA + CISPO + interleaved batching)
        # 4. Sample student on training data
        # 5. Compute disagreement scores (KL divergence)
        # 6. Create review batch (top 5% by KL, cap 500)
        # 7. Wait for customer review (poll or webhook)
        # 8. Retrain on corrected data
        # 9. Run OPD recovery phase
        # 10. Export ONNX
        # 11. Store in S3, update customer record
```

- [ ] **Step 3: Async job queue**

Use Celery or Temporal for durable execution. Training runs take hours and must survive process restarts.

```python
@celery.task(bind=True, max_retries=3)
def run_training_pipeline(self, run_id):
    # self.retry(exc=error, countdown=60) on transient failures
```

- [ ] **Step 4: Progress tracking**

Pipeline emits events at each state transition. Store in `training_runs` table. API returns current state + ETA estimate.

---

### Task 3: Data Store

**Files:**
- Create: `backend/database/schema.sql`
- Create: `backend/database/models.py` (SQLAlchemy or similar)
- Create: `backend/database/migrations/`

- [ ] **Step 1: PostgreSQL schema**

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tier TEXT NOT NULL DEFAULT 'standard',  -- starter, standard, performance
    on_prem BOOLEAN DEFAULT FALSE,
    connector_count INTEGER DEFAULT 0
);

CREATE TABLE training_runs (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    status TEXT NOT NULL DEFAULT 'data_ingested',
    model_tier TEXT NOT NULL,
    base_model_id TEXT NOT NULL,
    total_examples INTEGER,
    contested_examples INTEGER,
    reviewed_examples INTEGER DEFAULT 0,
    estimated_accuracy FLOAT,
    tinker_run_id TEXT,
    tinker_checkpoint_id TEXT,
    onnx_s3_uri TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE TABLE training_examples (
    id UUID PRIMARY KEY,
    run_id UUID REFERENCES training_runs(id),
    input_data JSONB NOT NULL,
    original_label TEXT,
    frontier_label TEXT,
    model_label TEXT,
    model_confidence FLOAT,
    student_logprobs JSONB,
    frontier_logprobs JSONB,
    kl_divergence FLOAT,
    is_contested BOOLEAN DEFAULT FALSE,
    corrected_label TEXT,
    reviewed BOOLEAN DEFAULT FALSE
);

CREATE TABLE model_checkpoints (
    id UUID PRIMARY KEY,
    run_id UUID REFERENCES training_runs(id),
    tinker_checkpoint_id TEXT,
    onnx_s3_uri TEXT,
    format TEXT NOT NULL,  -- 'tinker', 'onnx'
    is_current BOOLEAN DEFAULT FALSE,
    is_exported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE base_models (
    id UUID PRIMARY KEY,
    domain TEXT NOT NULL,
    source_model TEXT NOT NULL,
    tinker_checkpoint_id TEXT,
    customer_count INTEGER DEFAULT 0,
    accuracy FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_reviews (
    id UUID PRIMARY KEY,
    example_id UUID REFERENCES training_examples(id),
    run_id UUID REFERENCES training_runs(id),
    reviewer_id TEXT,  -- customer user identifier
    original_label TEXT,
    corrected_label TEXT,
    agreed BOOLEAN,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE connectors (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    connector_type TEXT NOT NULL,  -- 'gmail', 'hubspot', etc.
    auth_credentials_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 2: S3 bucket structure**

```
s3://beag-training-data/
  ├── customers/{customer_id}/
  │   ├── raw/                    # Raw ingested data
  │   ├── labeled/                # Dataset with labels
  │   ├── checkpoints/            # Downloaded Tinker checkpoints
  │   └── exports/                # ONNX models for delivery
  ├── base-models/
  │   └── {domain}/               # Domain-merged checkpoints
  └── adapters/
      └── {customer_id}/          # LoRA adapters before de-identification
```

- [ ] **Step 3: Database setup and migration tool**

Use Alembic for migrations. Initial migration creates all tables.

---

### Task 4: Disagreement Engine

**Files:**
- Create: `backend/disagreement/scorer.py`
- Create: `backend/disagreement/ranker.py`

- [ ] **Step 1: Implement KL divergence scoring**

```python
# disagreement/scorer.py
def compute_kl_divergence(student_logprobs, frontier_logprobs) -> float:
    """Per-token reverse KL: student vs frontier labels"""
    # student_logprobs: [batch, seq_len, vocab]
    # frontier_logprobs: [batch, seq_len, vocab]
    # Returns: [batch] — average KL per example
    return (student_logprobs.exp() * (student_logprobs - frontier_logprobs)).sum(-1).mean(-1)
```

- [ ] **Step 2: Threshold logic**

```python
# disagreement/ranker.py
def select_contested_examples(examples, max_count=500, pct=0.05):
    """Return top-N examples by KL divergence, capped."""
    sorted_examples = sorted(examples, key=lambda x: x.kl_divergence, reverse=True)
    count = min(max_count, int(len(sorted_examples) * pct))
    return sorted_examples[:count]
```

- [ ] **Step 3: Confidence calibration (future improvement)**

Track how often customer agrees/disagrees with model predictions at each confidence decile. Use this to calibrate the contest threshold over time.

---

### Task 5: Training Recipe Implementation

**Files:**
- Create: `backend/training/recipe.py`
- Create: `backend/training/loss.py`

- [ ] **Step 1: CISPO loss with asymmetric clipping**

Implement the loss function from the Bridgewater paper (arXiv:2510.13786). Tinker supports custom loss functions via the `loss_fn` parameter. This is the default loss for all training steps.

```python
# training/loss.py (pseudocode for Tinker API usage)
CISPO_LOSS_CONFIG = {
    "loss_fn": "cispo_asymmetric",
    "asymmetric_clip_low": 0.2,
    "asymmetric_clip_high": 0.8,
    "beta": 0.1,
}
```

- [ ] **Step 2: Interleaved batching**

For multi-task datasets, shuffle tasks in round-robin within each batch. Single-task datasets use standard batching.

```python
# training/recipe.py
def prepare_batches(examples, batch_size, task_field="task_id"):
    """If multiple tasks present, interleave. Otherwise standard."""
    tasks = set(ex.get(task_field) for ex in examples)
    if len(tasks) <= 1:
        return standard_batches(examples, batch_size)
    return interleaved_batches(examples, batch_size, task_field)
```

- [ ] **Step 3: OPD recovery phase**

After retraining, run on-policy distillation using Qwen3.5-9B (instruct) as teacher to recover instruction-following behavior. Use the Tinker cookbook OPD recipe.

```python
# training/recipe.py
def on_policy_distill(run_id, student_checkpoint, teacher_model="qwen3.5-9b"):
    """Recover post-training behavior after domain fine-tuning."""
    # Student samples trajectories
    # Teacher computes logprobs on student trajectories
    # Reverse KL loss → gradient update
    # Periodically promote best checkpoint as teacher
```

---

### Task 6: ONNX Export Pipeline

**Files:**
- Create: `backend/export/onnx_exporter.py`
- Create: `backend/export/validator.py`

- [ ] **Step 1: Download Tinker checkpoint**

```python
# Download checkpoint from Tinker
checkpoint_path = tinker_client.download_checkpoint(checkpoint_id)
# Path is a directory with config.json, model.safetensors, etc.
```

- [ ] **Step 2: Convert to ONNX**

```bash
optimum-cli export onnx --model {checkpoint_path} --task text-classification {output_dir}
```

Or use Python API:

```python
from optimum.onnxruntime import ORTModelForSequenceClassification
from transformers import AutoModelForSequenceClassification

model = AutoModelForSequenceClassification.from_pretrained(checkpoint_path)
ort_model = ORTModelForSequenceClassification.from_pretrained(model, export=True)
ort_model.save_pretrained(output_dir)
```

- [ ] **Step 3: Validate export**

```python
# export/validator.py
def validate_onnx_export(pytorch_model, onnx_path, test_inputs):
    """Compare logits between original PyTorch and ONNX export"""
    pt_outputs = pytorch_model(**test_inputs).logits
    ort_session = onnxruntime.InferenceSession(onnx_path)
    ort_inputs = {ort_session.get_inputs()[0].name: test_inputs["input_ids"].numpy()}
    ort_outputs = ort_session.run(None, ort_inputs)[0]
    similarity = cosine_similarity(pt_outputs.numpy(), ort_outputs)
    assert similarity > 0.99, f"ONNX export diverged: similarity={similarity}"
```

- [ ] **Step 4: Upload to S3 + generate signed URL**

ONNX artifact goes to `s3://beag-training-data/customers/{id}/exports/{run_id}/model.onnx`. Generate pre-signed download URL valid for 7 days.

---

### Task 7: API Layer

**Files:**
- Create: `backend/api/main.py`
- Create: `backend/api/routes/runs.py`
- Create: `backend/api/routes/connectors.py`
- Create: `backend/api/routes/models.py`
- Create: `backend/api/openapi.yaml`

- [ ] **Step 1: FastAPI application**

```python
# api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Beag Model Training API",
    version="0.1.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] **Step 2: Route definitions**

```python
# api/routes/runs.py
@router.post("/runs", status_code=201)
async def create_run(data: RunCreate):
    """Start a new training run. Accepts data URI + label config."""
    run = pipeline.create_run(data)
    celery_app.send_task("run_training_pipeline", args=[run.id])
    return run

@router.get("/runs/{run_id}")
async def get_run_status(run_id: UUID):
    """Get current status and progress."""
    return db.get_run(run_id)

@router.get("/runs/{run_id}/review")
async def get_review_batch(run_id: UUID):
    """Get contested examples awaiting review."""
    return db.get_unreviewed_contested(run_id, limit=500)

@router.post("/runs/{run_id}/review")
async def submit_reviews(run_id: UUID, reviews: list[ReviewSubmission]):
    """Submit reviewed examples (correct or corrected label)."""
    db.save_reviews(run_id, reviews)
    # If all contested reviewed, trigger retrain
    if db.all_contested_reviewed(run_id):
        celery_app.send_task("retrain_pipeline", args=[run_id])
    return {"status": "ok", "remaining": db.unreviewed_count(run_id)}

@router.post("/runs/{run_id}/retrain")
async def trigger_retrain(run_id: UUID):
    """Manually trigger retrain before all reviews complete."""
    celery_app.send_task("retrain_pipeline", args=[run_id])
    return {"status": "retrain_started"}

@router.get("/runs/{run_id}/export")
async def get_export(run_id: UUID):
    """Get ONNX download URL."""
    export = db.get_current_export(run_id)
    url = s3.generate_presigned_url(export.onnx_s3_uri, expires=604800)
    return {"url": url, "format": "ONNX", "expires_at": export.created_at + timedelta(days=7)}
```

- [ ] **Step 3: OpenAPI spec**

FastAPI auto-generates OpenAPI 3.1 from route definitions. Export and feed to Stainless/Speakeasy for SDK generation.

```bash
# Generate OpenAPI spec
curl http://localhost:8000/openapi.json > openapi.yaml
# Feed to Stainless CLI
npx stainless generate --openapi openapi.yaml --output sdk/
```

- [ ] **Step 4: Stainless SDK generation**

Configure Stainless to auto-publish SDKs to:
- TypeScript (npm)
- Python (PyPI)
- Go (Go module)
- Java (Maven)

---

### Task 8: Integration Testing

**Files:**
- Create: `backend/tests/test_pipeline.py`
- Create: `backend/tests/test_disagreement.py`
- Create: `backend/tests/test_export.py`
- Create: `backend/tests/test_api.py`

- [ ] **Step 1: Mock Tinker API for unit tests**

- [ ] **Step 2: Full end-to-end test with real Tinker API**

Test flow: CSV upload of 200 labeled examples → train → sample → disagreement → review 10 → retrain → OPD → ONNX export.

- [ ] **Step 3: Export validation test**

Compare ONNX model logits to original PyTorch model. Must match within 99%.

- [ ] **Step 4: Error handling tests**

Test Tinker API timeout, checkpoint download failure, ONNX conversion failure. Verify pipeline transitions to FAILED state with clear error message.

---

## Phase 2: DeepSeek Cold Start

**Goal:** Add DeepSeek API frontend to the pipeline — when customer has unlabeled data, DeepSeek labels everything, then the pipeline proceeds as Phase 1.

**Dependencies:** Phase 1 complete, DeepSeek API key.

---

### Task 1: DeepSeek API Integration

**Files:**
- Create: `backend/frontier/deepseek.py`
- Create: `backend/frontier/prompts.py`

- [ ] **Step 1: Implement DeepSeek chat completion wrapper**

```python
# frontier/deepseek.py
class DeepSeekClient:
    def __init__(self, api_key):
        self.client = OpenAI(base_url="https://api.deepseek.com", api_key=api_key)
    
    def label_example(self, text, task_description, label_options) -> str:
        response = self.client.chat.completions.create(
            model="deepseek-chat",  # or deepseek-reasoner
            messages=[
                {"role": "system", "content": task_description},
                {"role": "user", "content": text},
            ],
            temperature=0.0,  # Deterministic labeling
        )
        return response.choices[0].message.content.strip()
    
    def batch_label(self, examples, task_description, label_options, concurrency=10):
        """Batch label with async HTTP. 10 concurrent requests."""
        # Use asyncio + httpx for concurrent requests
```

- [ ] **Step 2: Prompt library**

```python
# frontier/prompts.py
CLASSIFICATION_PROMPT = """You are a domain expert classifying documents.
Classify the following text into exactly one of these categories: {labels}

Respond with ONLY the category name, nothing else.

Text:
{text}
"""

RELEVANCE_PROMPT = """You are an expert at determining document relevance.
Given this query: "{query}"
And this document: "{text}"

Is the document relevant? Answer exactly: "relevant" or "not_relevant"
"""

CUSTOM_PROMPT = """{customer_task_description}

{text}
"""
```

- [ ] **Step 3: Update pipeline state machine**

Add `DEEPSEEK_LABELING` state between `DATA_INGESTED` and `TRAINING`. When customer has no initial labels, skip directly to DeepSeek labeling. When they provide labels, the original Phase 1 flow applies.

---

### Task 2: Prompt Template UI

**Files:**
- Modify: `backend/orchestrator/schemas.py` (add task definition)

- [ ] **Step 1: Add task definition to run creation**

```python
class TaskDefinition(BaseModel):
    type: Literal["classification", "relevance", "custom"]
    labels: list[str] | None = None  # For classification
    query: str | None = None  # For relevance
    description: str | None = None  # For custom
    few_shot_examples: list[FewShotExample] | None = None
```

- [ ] **Step 2: Few-shot support**

Accept up to 10 customer-provided labeled examples. Use them as few-shot examples in the DeepSeek prompt.

---

## Phase 3: In-App Review UI

**Goal:** Customer reviews contested examples inside the product, not via CSV export.

**Dependencies:** Phase 1 API layer complete.

---

### Task 1: Review Page

**Files:**
- Create: `app/customer/runs/[run_id]/review/page.tsx`
- Create: `components/review/review-card.tsx`
- Create: `components/review/review-progress.tsx`
- Create: `components/review/review-submit.tsx`

- [ ] **Step 1: Fetch contested examples**

```typescript
// Fetch from API
const { data, error } = await api.get(`/runs/${runId}/review`);
// Returns: [{ id, input_data, original_label, model_label, confidence, ... }]
```

- [ ] **Step 2: Review card component**

Shows:
- The data (text highlighted, with field labels for structured data)
- The original label (from DeepSeek or initial upload)
- The model's prediction and confidence score
- Two buttons: "Correct" (model was right) / "Wrong → pick correct label"
- Keyboard shortcuts for speed (j/k to navigate, c to confirm correct, w to mark wrong)

- [ ] **Step 3: Progress bar**

"42 / 156 reviewed" with a percentage bar. ETA estimate based on pace: "At this rate, ~4 minutes remaining."

- [ ] **Step 4: Submit on completion**

When all reviewed, auto-submit to API. Show "Retrain started" status, link to run detail page.

---

### Task 2: Run Status Page

**Files:**
- Create: `app/customer/runs/[run_id]/page.tsx`
- Create: `components/pipeline-status.tsx`

- [ ] **Step 1: Pipeline visualization**

Visual state machine showing current step with checkmarks for completed steps:

```
📥 Ingested  →  🏷️ Labeling  →  🧠 Training  →  🔍 Sampling  →  ⚡ Disagreement
                                                                      ↓
🎉 Complete  ←  📦 Exporting  ←  🔄 Retraining  ←  👀 Awaiting Review
```

- [ ] **Step 2: Poll for status**

Poll `GET /runs/{id}` every 5 seconds. Animate transitions. Show estimated remaining time.

- [ ] **Step 3: Export download button**

When `status == "complete"`, show download ONNX button with copy-to-clipboard for the presigned URL.

---

## Phase 4: Connector SDK + Built-in Connectors

**Goal:** Customers connect data sources via OAuth, not manual uploads.

**Dependencies:** Phase 1 API layer, OpenAPI spec finalized.

---

### Task 1: OpenAPI Connector Spec

**Files:**
- Create: `connectors/SPEC.md`
- Create: `connectors/sdks/typescript/`
- Create: `connectors/sdks/python/`

- [ ] **Step 1: Define connector interface**

```yaml
# In the OpenAPI spec
components:
  schemas:
    Connector:
      type: object
      required: [type, auth_config]
      properties:
        type:
          type: string
          description: Connector type identifier (e.g., "gmail", "hubspot")
        auth_config:
          type: object
          properties:
            oauth_client_id:
              type: string
            oauth_scopes:
              type: array
              items: string
            redirect_uri:
              type: string
        schema:
          type: object
          description: Discovered schema (fields for structured, document listing for unstructured)
```

- [ ] **Step 2: Generate SDKs via Stainless/Speakeasy**

SDK auto-generated from OpenAPI spec. Third-party developers use this to build connectors without writing auth boilerplate.

- [ ] **Step 3: Connector packaging**

A connector is a Docker container or serverless function that:
1. Implements OAuth 2.0 flow
2. Exposes `GET /schema` (discover structure)
3. Exposes `POST /sync` (pull data, return pages)
4. Optionally exposes `POST /write-label` (write-back to source)
5. Calls your API with the data

---

### Task 2: Built-in Connectors

**Files:**
- Create: `backend/connectors/sources/gmail.py`
- Create: `backend/connectors/sources/hubspot.py`
- Create: `backend/connectors/sources/googlesheets.py`
- Create: `backend/connectors/sources/notion.py`
- Create: `backend/connectors/sources/csv_upload.py`

- [ ] **Step 1: CSV/JSON upload connector (priority 1)**

Simplest connector — customer uploads a file. Your product parses it, infers schema (columns → text fields, label fields). Renders preview, customer confirms field mapping.

```typescript
// CSV upload flow
1. Customer uploads file
2. Parse first 20 rows → detect types (string, number, boolean)
3. Show preview: "We detected: Column A = text, Column B = text, Column C = label"
4. Customer confirms or remaps
5. Full ingest into S3
```

- [ ] **Step 2: Google Sheets connector**

OAuth 2.0 → Google Sheets API → list spreadsheets → select sheet → discover columns → sync all rows.

- [ ] **Step 3: Gmail connector**

OAuth 2.0 → Gmail API → list messages (with query filter) → fetch full messages → extract body (text + HTML stripping) → store with metadata (from, to, subject, date).

- [ ] **Step 4: HubSpot connector**

OAuth 2.0 → HubSpot CRM API → list objects (contacts, deals, tickets) → discover properties → customer selects input property + label property.

- [ ] **Step 5: Notion connector**

OAuth 2.0 → Notion API → list databases → discover properties → select database → pull all pages.

---

### Task 3: Schedule & Sync

**Files:**
- Create: `backend/connectors/sync/scheduler.py`
- Create: `backend/connectors/sync/webhook.py`

- [ ] **Step 1: Initial bulk sync**

On OAuth success, kick off full history pull. Background task, progress tracked. Customer sees: "Syncing 2,341 emails... 67% complete."

- [ ] **Step 2: Delta sync via polling**

Cron job / scheduler checks each active connector for new data. Use cursor-based pagination (Gmail history ID, HubSpot last modified date, etc.). Polll interval: every 6 hours for most connectors, configurable.

- [ ] **Step 3: Webhook support (where available)**

Some sources (HubSpot, Google Sheets) support webhooks. Register webhook URL on OAuth setup. Incoming webhook → trigger delta sync for that connector.

---

## Phase 5: Base Model Library

**Goal:** Accumulate customer fine-tuned adapters and merge them into domain-specific base checkpoints for warm starts.

**Dependencies:** Phase 1 complete, multiple customers with trained models.

---

### Task 1: Adapter Collection

**Files:**
- Create: `backend/library/adapter_store.py`
- Create: `backend/library/deidentify.py`

- [ ] **Step 1: Collect LoRA adapters**

After each successful training run, save a copy of the LoRA adapter weights (not the full base model — adapters are tiny, ~1–10MB). Store in S3 keyed by customer + domain.

- [ ] **Step 2: De-identification pipeline**

```python
# library/deidentify.py
def deidentify_adapter(adapter_weights, training_data, domain):
    """
    1. NER scan on training data to identify PII patterns
    2. Identify attention heads that fire on PII tokens
    3. Zero out or prune those adapter weights
    4. Sanity check: model no longer predicts PII
    """
    ner_model = load_ner_model("en_core_web_trf")  # spaCy
    pii_entities = ["PERSON", "ORG", "EMAIL", "PHONE", "ADDRESS", "SSN", "CREDIT_CARD"]
    pii_tokens = find_pii_tokens(training_data, ner_model, pii_entities)
    adapter = prune_pii_heads(adapter_weights, pii_tokens)
    return adapter
```

- [ ] **Step 3: Store in base model library**

```
s3://beag-training-data/adapters/{customer_id}/{run_id}/adapter.safetensors
s3://beag-training-data/adapters/{customer_id}/{run_id}/metadata.json
  { domain, source_model, accuracy, training_examples_count, deidentified: true }
```

---

### Task 2: Domain Merge via Distillation

**Files:**
- Create: `backend/library/domain_merger.py`

- [ ] **Step 1: Trigger condition**

```python
# library/domain_merger.py
def should_merge(domain):
    """Trigger merge when domain has >= 3 distinct customer adapters."""
    adapters = list_adapters_for_domain(domain)
    return len(adapters) >= 3
```

- [ ] **Step 2: Distillation merge**

Use OPD to train a single student model from the ensemble of customer adapters:

```python
def merge_adapters(domain, adapters, base_model="qwen3.5-9b-base"):
    """
    For each adapter:
    1. Load base + adapter → inference on held-out prompts
    2. Collect logprobs (teacher signal for each adapter)
    
    Train a fresh base model:
    3. Student starts from base_model (no adapter)
    4. On-policy distill: student samples → all adapter-ensembles
       compute average teacher logprobs → reverse KL
    5. Result: a single checkpoint capturing combined domain knowledge
    """
    merged = train_on_policy_distill(
        student=base_model,
        teachers=adapter_models,
        prompts=domain_relevant_prompts,
    )
    return merged
```

- [ ] **Step 3: Store merged base**

```
s3://beag-training-data/base-models/{domain}/v1/
  ├── model.safetensors
  ├── config.json
  └── metadata.json
    { source_customers: [...], customer_count: 3, avg_accuracy: 0.87 }
```

- [ ] **Step 4: Warm start check in pipeline**

At pipeline start, check `base_models` table for matching domain. If found, start training from the merged base instead of raw Qwen — fewer iterations needed, lower disagreement rate.

---

## Phase 6: On-Prem Stack (Unsloth)

**Goal:** For large contracts ($200K+) where customer requires data to stay on-premises, deploy a self-contained training stack using Unsloth.

**Dependencies:** Phase 1 training recipe (feature parity required with Tinker pipeline).

---

### Task 1: Custom Training Loop

**Files:**
- Create: `onprem/train.py`
- Create: `onprem/unsloth_adapter.py`
- Create: `onprem/recipe.py`

- [ ] **Step 1: Unsloth integration**

```python
# onprem/unsloth_adapter.py
from unsloth import FastLanguageModel

def load_base_model(model_id="Qwen/Qwen2.5-7B-Instruct", max_seq_length=32768):
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=model_id,
        max_seq_length=max_seq_length,
        dtype=None,  # Auto-detect
        load_in_4bit=True,  # QLoRA for memory efficiency
    )
    model = FastLanguageModel.get_peft_model(
        model,
        r=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
        lora_alpha=16,
        use_gradient_checkpointing=True,
    )
    return model, tokenizer
```

- [ ] **Step 2: Implement CISPO loss**

```python
# onprem/train.py
def cispo_loss(logits, labels, asymmetric_clip_low=0.2, asymmetric_clip_high=0.8):
    """
    CISPO loss with asymmetric clipping.
    Paper: https://arxiv.org/abs/2510.13786
    """
    # Cross-entropy with per-token clipping based on probability
    probs = F.softmax(logits, dim=-1)
    target_probs = gather_target_probs(probs, labels)
    clipped = torch.clamp(target_probs, asymmetric_clip_low, asymmetric_clip_high)
    loss = -torch.log(clipped) * (target_probs > asymmetric_clip_low).float()
    return loss.mean()
```

- [ ] **Step 3: Implement OPD**

```python
# onprem/recipe.py
def on_policy_distill(student_model, teacher_model, prompts_dataset, steps=100):
    """
    1. Student samples trajectory from each prompt
    2. Teacher computes logprobs on student tokens
    3. Reverse KL: minimize KL(student || teacher)
    4. Every N steps, promote best checkpoint as teacher
    """
    for step in range(steps):
        batch = sample_batch(prompts_dataset)
        student_outputs = student_model.generate(batch, max_new_tokens=512)
        teacher_logprobs = teacher_model.compute_logprobs(student_outputs)
        student_logprobs = student_logprobs(student_outputs)
        loss = (student_logprobs - teacher_logprobs).mean()
        loss.backward()
        optimizer.step()
        # Step-best checkpoint promotion
```

- [ ] **Step 4: Interleaved batching**

Same logic as Phase 1. Multi-task datasets interleave, single-task standard.

---

### Task 2: ONNX Export (Unsloth → ONNX)

**Files:**
- Create: `onprem/export.py`

- [ ] **Step 1: Convert Unsloth model to ONNX**

```python
# onprem/export.py
from optimum.onnxruntime import ORTModelForSequenceClassification
import torch

def unsloth_to_onnx(unsloth_model, tokenizer, output_dir):
    # Merge LoRA weights into base
    merged = unsloth_model.merge_and_unload()
    
    # Convert to HuggingFace format
    merged.save_pretrained("/tmp/merged_model")
    tokenizer.save_pretrained("/tmp/merged_model")
    
    # Export to ONNX via optimum
    ort_model = ORTModelForSequenceClassification.from_pretrained(
        "/tmp/merged_model", export=True
    )
    ort_model.save_pretrained(output_dir)
```

---

### Task 3: Docker Deployment Package

**Files:**
- Create: `onprem/Dockerfile`
- Create: `onprem/docker-compose.yml`
- Create: `onprem/config.yaml`

- [ ] **Step 1: Docker image**

```dockerfile
FROM nvidia/cuda:12.4-runtime-ubuntu22.04

RUN pip install unsloth torch optimum onnxruntime-gpu

COPY onprem/ /app

ENTRYPOINT ["python", "/app/train.py"]
```

- [ ] **Step 2: Configuration**

```yaml
# config.yaml
customer:
  id: "cust-001"
  model_tier: "standard"  # starter, standard, performance
  base_model: "Qwen/Qwen2.5-7B-Instruct"

pipeline:
  loss_fn: "cispo_asymmetric"
  interleaved_batching: true
  opd_steps: 50
  lora_rank: 32

export:
  format: "onnx"
  output_dir: "/exports"
```

- [ ] **Step 3: Validation script**

Run at deployment to verify: CUDA available, model loads, inference works, ONNX export matches PyTorch within 99%.

---

## Phase 7: Connector Marketplace

**Goal:** Third-party developers can build and sell connectors. Platform takes a revenue share.

**Dependencies:** Phase 4 (connector SDK), Phase 1 (API layer).

---

### Task 1: Marketplace API

**Files:**
- Create: `backend/marketplace/routes.py`
- Create: `backend/marketplace/schemas.py`

- [ ] **Step 1: Listing endpoints**

```python
# marketplace/routes.py
@router.get("/marketplace/connectors")
async def list_connectors():
    """List all available connectors (built-in + third-party)."""
    return db.list_available_connectors()

@router.post("/marketplace/connectors/publish")
async def publish_connector(connector: ConnectorListing):
    """Third-party developer publishes a connector."""
    # Validate OAuth config, schema endpoint, sync endpoint
    # Assign connector_type slug
    # Set revenue share (default 70/30 developer/platform)
    
@router.get("/marketplace/connectors/{id}/install")
async def install_connector(id: UUID, customer_id: UUID):
    """Customer installs a connector. Initiates OAuth flow."""
```

- [ ] **Step 2: Revenue tracking**

Track per-connector usage (records synced). Monthly payout to developers.

---

### Task 2: Developer Onboarding

**Files:**
- Create: `connectors/docs/quickstart.md`

- [ ] **Step 1: Documentation**

Publish connector SDK documentation: auth flow, schema discovery, sync endpoint, webhook registration, testing guide, submission checklist.

- [ ] **Step 2: Validation suite**

Developers run a test suite against their connector before submission:

```bash
npx beag-connector validate ./my-connector
# ✓ OAuth flow works
# ✓ Schema discovery returns valid response
# ✓ Sync returns paginated data
# ✓ Data format matches spec
```

---

## Deployment & Operations

### Environment Setup

- [ ] **Step 1: Production infrastructure**

| Service | Provider | Config |
|---|---|---|
| API backend | Railway / Fly.io / AWS ECS | FastAPI, 2 vCPU, 4GB RAM |
| Database | Railway Postgres / RDS | PostgreSQL 16, 20GB |
| Object storage | S3 / R2 / GCS | Standard tier |
| Task queue | Temporal Cloud / Redis + Celery | Durable execution |
| Tinker API | Tinker | API key in env |

- [ ] **Step 2: Environment variables**

```
TINKER_API_KEY=
DEEPSEEK_API_KEY=
DATABASE_URL=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
CELERY_BROKER_URL=
STAINLESS_API_KEY=
```

- [ ] **Step 3: CI/CD**

GitHub Actions: test → build Docker image → deploy to Railway/Fly. Separate staging and production environments.

### Monitoring

- [ ] **Step 1: Pipeline metrics**

Track per run: duration per phase, cost, disagreement rate, review rate, final accuracy. Dashboards in Grafana or similar.

- [ ] **Step 2: Tinker cost tracking**

Log every Tinker API call with token count and cost. Alert if costs exceed threshold (e.g., >$50/run).

- [ ] **Step 3: Error tracking**

Sentry or similar for API errors. PagerDuty for pipeline failures.

---

## Implementation Order

```
Phase 1 (Tinker Pipeline) ─────────────────────────────── High priority
  └── Must complete before anything else works

Phase 2 (DeepSeek Cold Start) ─────────────────────────── High priority
  └── Required for unlabeled data (most customers)

Phase 3 (Review UI) ───────────────────────────────────── Medium priority
  └── Makes pipeline usable by customers

Phase 4 (Connectors) ──────────────────────────────────── Medium priority
  └── Replaces CSV upload, makes product compelling

Phase 5 (Base Model Library) ──────────────────────────── Low priority
  └── Needs customer volume first; start collecting adapters immediately

Phase 6 (On-Prem) ─────────────────────────────────────── Low priority
  └── Only for large contracts; build when first deal closes

Phase 7 (Marketplace) ─────────────────────────────────── Low priority
  └── Depends on Phase 4; build when connector volume justifies it
```

**Parallel work possible:**
- Phase 3 (Review UI) can start as soon as Phase 1 API layer is stable (no need to wait for Phase 1 to fully complete)
- Phase 5 adapter **collection** can start immediately (save adapter from every training run) even though the merge engine isn't built yet
- Phase 6 and Phase 7 are independent of each other

---

## Open Technical Questions

1. **Tinker webhook support**: Does Tinker support webhooks for async completion notifications, or must we poll? This affects the Celery/Temporal design for pipeline orchestration.

2. **Qwen3.5-X vs Unsloth compatibility**: Which specific models does Unsloth support well? Qwen2.5-7B is confirmed; Qwen3.5-9B may need testing.

3. **ONNX export path**: optimum-cli exports classification heads cleanly, but the OPD-derived model is a language model (causal LM). The ONNX export needs to handle both classification (labels) and generation (text output) depending on customer use case.

4. **LoRA adapter size**: Need to measure typical adapter size to estimate storage costs for the base model library. Likely negligible (<10MB per customer).

5. **Tinker rate limits**: Need to confirm Tinker API rate limits for parallel customer pipelines. If we have 10 customers training simultaneously, will we hit limits?
