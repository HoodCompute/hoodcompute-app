---
layout: default
title: Errors
parent: API Reference
nav_order: 6
---

# Errors

The HoodCompute API uses standard HTTP status codes. When a request fails, the response body contains a JSON object with a machine-readable `code` and a human-readable `message`.

---

## Error response format

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Your credit balance (4 credits) is insufficient for the Standard tier (8 credits required).",
    "type": "payment_error",
    "param": null,
    "docs": "https://docs.hoodcompute.com/api-reference/errors#insufficient_credits"
  }
}
```

| Field | Description |
|---|---|
| `code` | Machine-readable error identifier |
| `message` | Human-readable explanation |
| `type` | Error category |
| `param` | The request parameter that caused the error, if applicable |
| `docs` | Link to this errors page, pointing directly at the specific error |

---

## HTTP status codes

| Status | Category | When it occurs |
|---|---|---|
| `400` | Bad request | Malformed request body, missing required field, invalid parameter value |
| `401` | Authentication | Missing or invalid API key |
| `402` | Payment | Insufficient credit balance |
| `403` | Forbidden | Key suspended or action not permitted |
| `404` | Not found | Resource (job, model, webhook) does not exist |
| `409` | Conflict | Duplicate resource or conflicting state |
| `422` | Unprocessable | Request is structurally valid but logically invalid |
| `429` | Too many requests | Request rate to the API itself is too high (per-IP burst limit, not a capacity limit) |
| `500` | Server error | Internal error; retrying usually resolves it |
| `503` | Service unavailable | No workers available for the requested model |
| `504` | Gateway timeout | Job timeout; credits were refunded |

---

## Error codes

### `invalid_api_key`

The provided API key does not exist or has been revoked.

**Status:** 401  
**Action:** Generate a new key from Settings.

---

### `missing_api_key`

No `Authorization` header was included in the request.

**Status:** 401  
**Action:** Include `Authorization: Bearer hoodc_live_your_key_here` in all requests.

---

### `key_suspended`

The API key has been suspended. This occurs if your account is flagged for abuse.

**Status:** 403  
**Action:** Contact support at contact@hoodcompute.com.

---

### `insufficient_credits`

Your credit balance is too low for the requested model tier.

**Status:** 402  
**Action:** Add credits at `hoodcompute.com/app` or reduce the requested model tier.

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Your credit balance (4 credits) is insufficient for the Standard tier (8 credits required).",
    "type": "payment_error",
    "details": {
      "credits_remaining": 4,
      "credits_required": 8,
      "tier": "standard"
    }
  }
}
```

---

### `model_not_found`

The `model` field in the request body does not match any known model ID.

**Status:** 400  
**Action:** Call `GET /v1/models` to get the list of valid model IDs.

---

### `no_workers_available`

No workers are currently hosting the requested model. This is a transient condition that resolves as workers come online.

**Status:** 503  
**Action:** Retry after the indicated `retry_after` interval, or use a different model.

```json
{
  "error": {
    "code": "no_workers_available",
    "message": "No workers are currently available for llama-3.3-70b. Try again in approximately 30 seconds.",
    "type": "capacity_error",
    "details": {
      "model": "llama-3.3-70b",
      "retry_after": 30
    }
  }
}
```

---

### `job_timeout`

No worker completed the job within the 120-second window. The credits that were locked in escrow have been automatically refunded.

**Status:** 504  
**Action:** Retry the request. Credits are available immediately. If this error recurs on the same model, that model may have low worker availability.

```json
{
  "error": {
    "code": "job_timeout",
    "message": "The inference job timed out after 120 seconds. Your credits have been refunded.",
    "type": "timeout_error",
    "details": {
      "job_id": "job_8fx2kp3m9qrstvwxyz",
      "credits_refunded": 8,
      "refund_tx": "0x5e08c3b71a94f2d6580b1ce9f43a07d218e6c5049fb3a827d15e90cb46281f7a"
    }
  }
}
```

---

### `invalid_request`

The request body is malformed or a required field is missing.

**Status:** 400  
**Action:** Check the `param` field for the specific field that caused the error.

---

### `context_length_exceeded`

The total token count of the messages array exceeds the selected model's context window.

**Status:** 400  
**Action:** Reduce the length of the conversation or switch to a model with a larger context window. Check `GET /v1/models` for `context_window` values.

---

### `dispute_window_expired`

A dispute was submitted after the 60-second window closed.

**Status:** 422  
**Action:** Disputes must be opened within 60 seconds of receiving the final output token. This cannot be extended.

---

## Retrying safely

All 5xx errors and `no_workers_available` (503) errors are safe to retry. All other errors indicate a problem with the request that will not resolve by retrying with the same payload.

Recommended retry strategy:

```python
import time
import httpx

def call_with_retry(client, payload, max_retries=3):
    for attempt in range(max_retries):
        response = client.post("/v1/chat/completions", json=payload)
        
        if response.status_code == 200:
            return response
        
        error = response.json().get("error", {})
        code = error.get("code")
        
        if response.status_code == 503 and code == "no_workers_available":
            retry_after = error.get("details", {}).get("retry_after", 10)
            time.sleep(retry_after)
            continue
        
        if response.status_code >= 500:
            time.sleep(2 ** attempt)
            continue
        
        # 4xx errors are not retryable
        response.raise_for_status()
    
    raise Exception(f"Request failed after {max_retries} attempts")
```
