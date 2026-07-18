---
layout: default
title: Models
parent: API Reference
nav_order: 3
---

# Models

`GET /v1/models`

Returns the list of models currently available on the network. Availability reflects the live worker pool: a model appears in this list only if at least one worker is currently hosting it.

---

## List models

```bash
curl https://api.hoodcompute.com/v1/models \
  -H "Authorization: Bearer hoodc_live_your_key_here"
```

### Response

```json
{
  "object": "list",
  "data": [
    {
      "id": "llama-3.3-70b",
      "object": "model",
      "created": 1750000000,
      "owned_by": "meta",
      "hoodcompute": {
        "tier": "max",
        "credits_per_request": 40,
        "credits_per_1k_tokens": 20,
        "active_workers": 12,
        "median_latency_ms": 1840,
        "parameters": "70B",
        "context_window": 128000
      }
    },
    {
      "id": "qwen3-8b",
      "object": "model",
      "created": 1750000000,
      "owned_by": "qwen",
      "hoodcompute": {
        "tier": "standard",
        "credits_per_request": 8,
        "credits_per_1k_tokens": 4,
        "active_workers": 47,
        "median_latency_ms": 420,
        "parameters": "8B",
        "context_window": 32768
      }
    }
  ]
}
```

The `hoodcompute` object contains additional fields not present in the standard OpenAI response.

| Field | Description |
|---|---|
| `tier` | Pricing tier: `lite`, `standard`, `pro`, or `max` |
| `credits_per_request` | Credit cost for completions up to ~500 output tokens |
| `credits_per_1k_tokens` | Credit cost per 1,000 output tokens for longer completions |
| `active_workers` | Number of workers currently hosting this model |
| `median_latency_ms` | Observed p50 time-to-first-token across the worker pool |
| `parameters` | Parameter count |
| `context_window` | Maximum context length in tokens |

---

## Available models

Models available at launch. The list grows as workers add new models and governance votes approve additions.

| Model ID | Parameters | Context | Tier | Credits/request |
|---|---|---|---|---|
| `llama-3.3-70b` | 70B | 128K | Max | 40 |
| `deepseek-r1` | 70B | 128K | Max | 40 |
| `llama-3.2-27b` | 27B | 128K | Pro | 18 |
| `qwen3-14b` | 14B | 32K | Pro | 18 |
| `qwen3-8b` | 8B | 32K | Standard | 8 |
| `mistral-7b` | 7B | 32K | Standard | 8 |
| `llama-3.2-3b` | 3B | 128K | Lite | 2 |
| `qwen3-1.7b` | 1.7B | 32K | Lite | 2 |

Model IDs are stable. When an underlying model is superseded, the old ID remains valid until a governance vote retires it, with advance notice.

---

## Model availability

A model's `active_workers` count reflects the live state of the network. Models with more active workers have lower latency and better job acceptance rates.

If you request a model with zero active workers, the API returns a `503` with a `retry_after` suggestion.

During beta, the HoodCompute team maintains a first-party seed provider pool to ensure all launch models have consistent availability for early users.

---

## Retrieve a specific model

```bash
curl https://api.hoodcompute.com/v1/models/qwen3-8b \
  -H "Authorization: Bearer hoodc_live_your_key_here"
```

Returns a single model object in the same format as the list response. Useful for checking the current worker count and latency before submitting a job.
