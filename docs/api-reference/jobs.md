---
layout: default
title: Jobs
parent: API Reference
nav_order: 4
---

# Jobs

Every inference request on HoodCompute creates a job. The Jobs API lets you retrieve job status and the on-chain receipt for any job associated with your API key.

---

## Retrieve a job

`GET /v1/jobs/{job_id}`

```bash
curl https://api.hoodcompute.com/v1/jobs/job_8fx2kp3m9qrstvwxyz \
  -H "Authorization: Bearer hoodc_live_your_key_here"
```

### Response

```json
{
  "id": "job_8fx2kp3m9qrstvwxyz",
  "object": "job",
  "status": "settled",
  "model": "qwen3-8b",
  "tier": "standard",
  "credits_charged": 8,
  "usdg_value": 0.08,
  "worker_address": "0x9d24ab7e315f68c0d1b2fa4c8e0973d65a1cbe48",
  "created_at": "2026-06-15T14:22:00Z",
  "completed_at": "2026-06-15T14:22:03Z",
  "on_chain": {
    "escrow_tx": "0x8c2f41ab9e07d3565f18c4ba20d97e631a5c08f2be49d176e0a3b58c917d24f0",
    "settlement_tx": "0x3a91d5c07f26e8b4915dc3a08e67f21b49c0d8a35e7612fb08d94ce5a172b36d",
    "escrow_address": "0x4be09d7c21f8a3565edc10b9f472ea08d3961c5b",
    "block_number": 12847293,
    "proof_hash": "sha256:a1b2c3d4e5f6..."
  },
  "usage": {
    "prompt_tokens": 48,
    "completion_tokens": 214,
    "total_tokens": 262
  }
}
```

### Job status values

| Status | Meaning |
|---|---|
| `pending` | Credits locked in escrow, job is being routed to a worker |
| `processing` | Worker acknowledged the job and inference is running |
| `settling` | Proof submitted on-chain, awaiting settlement confirmation |
| `settled` | Job complete, worker paid, credits deducted |
| `failed` | Job failed before completion (routing failure, worker error) |
| `refunded` | Job timed out (120s), credits returned to balance |
| `disputed` | Client opened a dispute, awaiting arbitration |

---

## List jobs

`GET /v1/jobs`

Returns a paginated list of jobs for the authenticated API key.

```bash
curl "https://api.hoodcompute.com/v1/jobs?limit=20&status=settled" \
  -H "Authorization: Bearer hoodc_live_your_key_here"
```

### Query parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | 20 | Number of results to return (max 100) |
| `before` | string | none | Return jobs created before this job ID (cursor pagination) |
| `after` | string | none | Return jobs created after this job ID |
| `status` | string | none | Filter by status (e.g. `settled`, `refunded`) |
| `model` | string | none | Filter by model ID |

### Response

```json
{
  "object": "list",
  "data": [...],
  "has_more": true,
  "next_cursor": "job_7ex1jo2l8pqrsuvwxy"
}
```

---

## On-chain verification

The `on_chain` object in every settled job response gives you everything you need to verify the payment independently.

**Verify the escrow lock:**

```
https://robinhoodchain.blockscout.com/tx/0x8c2f41ab9e07d3565f18c4ba20d97e631a5c08f2be49d176e0a3b58c917d24f0
```

This transaction shows the credit balance debit, the escrow lock in the settlement contract, the model tier recorded, and the job ID.

**Verify the settlement:**

```
https://robinhoodchain.blockscout.com/tx/0x3a91d5c07f26e8b4915dc3a08e67f21b49c0d8a35e7612fb08d94ce5a172b36d
```

This transaction shows the escrow release, the USDG transfer to the worker's wallet, the USDG transfer to the protocol treasury, and the proof hash verified.

You do not need to trust the API's report of what happened. The Robinhood Chain transactions contain the authoritative record.

---

## Opening a dispute

If you believe a worker submitted a proof that does not match the response you received, you can open a dispute within 60 seconds of receiving the final output token.

`POST /v1/jobs/{job_id}/dispute`

```json
{
  "received_output_hash": "sha256:a1b2c3d4..."
}
```

Compute the SHA-256 hash of the full response text you received (UTF-8 encoded, no trailing newline). The API compares your hash to the proof hash the worker submitted on-chain. If they differ, the job is flagged as disputed.

```json
{
  "job_id": "job_8fx2kp3m9qrstvwxyz",
  "dispute_opened": true,
  "your_hash": "sha256:a1b2c3d4...",
  "worker_hash": "sha256:e5f6g7h8...",
  "dispute_tx": "0xb47a20e9c15d38f60a92e7b40c81f5d3968a2ce70b15df4839e6a01c2d7458b9",
  "arbitration_window_hours": 24
}
```

If the worker's hash matches yours, no dispute is opened and the response says so.

See [On-Chain Settlement]({% link core-concepts/on-chain-settlement.md %}#dispute-process) for the full dispute and arbitration flow.
