---
layout: default
title: API Reference
nav_order: 7
has_children: true
---

# API Reference

The HoodCompute API is an OpenAI-compatible REST API backed by the decentralized inference network. It accepts the same request shapes as the OpenAI API, returns the same response shapes, and supports the same streaming protocol.

**Base URL:** `https://api.hoodcompute.com/v1`

Existing code that talks to the OpenAI API can typically be pointed at HoodCompute with a single line change. See [OpenAI-compatible usage]({% link integrations/openai-compatible.md %}) for specifics.

---

## API sections

- [Authentication]({% link api-reference/authentication.md %}): API keys, wallet authentication, request signing
- [Chat Completions]({% link api-reference/completions.md %}): `/v1/chat/completions` endpoint
- [Models]({% link api-reference/models.md %}): listing available models and their properties
- [Jobs]({% link api-reference/jobs.md %}): retrieving job status and on-chain receipts
- [Webhooks]({% link api-reference/webhooks.md %}): event delivery for job and account events
- [Errors]({% link api-reference/errors.md %}): error codes and handling

---

## Request format

All requests must include an `Authorization` header with a bearer token:

```
Authorization: Bearer hoodc_live_your_key_here
```

Request bodies are JSON. All responses are JSON. Streaming responses use Server-Sent Events (SSE) in the same format as the OpenAI streaming protocol.

---

## Response headers

Every API response includes standard HTTP headers plus several HoodCompute-specific headers:

| Header | Description |
|---|---|
| `x-hoodcompute-job-id` | The unique job ID for this inference request |
| `x-hoodcompute-tx-hash` | The Robinhood Chain transaction hash for the escrow lock |
| `x-hoodcompute-settlement-tx` | The settlement transaction hash (appears after job completion) |
| `x-hoodcompute-worker` | The worker's on-chain address (for verification) |
| `x-hoodcompute-credits-remaining` | Your remaining credit balance after this request |

---

## Rate limits

There are no rate limits enforced by a policy team. Capacity is dynamically priced by network demand. If no workers are available for the requested model tier, the API returns a `503` with a `retry_after` field.

Credit balance is the only hard constraint: requests fail with a `402` if your balance is insufficient for the model tier.
