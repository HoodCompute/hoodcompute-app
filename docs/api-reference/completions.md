---
layout: default
title: Chat Completions
parent: API Reference
nav_order: 2
---

# Chat Completions

`POST /v1/chat/completions`

Generates a model response for a conversation. The request and response format is identical to the OpenAI Chat Completions API.

---

## Request

```
POST https://api.hoodcompute.com/v1/chat/completions
Authorization: Bearer hoodc_live_your_key_here
Content-Type: application/json
```

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `model` | string | Yes | Model ID to use. See [Models]({% link api-reference/models.md %}). |
| `messages` | array | Yes | List of messages in the conversation. |
| `stream` | boolean | No | If `true`, returns a stream of SSE events. Defaults to `false`. |
| `max_tokens` | integer | No | Maximum number of tokens to generate. |
| `temperature` | number | No | Sampling temperature (0.0 to 2.0). |
| `top_p` | number | No | Nucleus sampling probability. |
| `stop` | string or array | No | Stop sequences. |
| `frequency_penalty` | number | No | Penalize repeated tokens (-2.0 to 2.0). |
| `presence_penalty` | number | No | Penalize tokens that have already appeared (-2.0 to 2.0). |
| `seed` | integer | No | Seed for deterministic sampling. Not guaranteed with distributed inference. |

### Message object

```json
{
  "role": "user",
  "content": "Explain how Robinhood Chain achieves 100ms block times."
}
```

Valid roles: `system`, `user`, `assistant`.

### Example request

```json
{
  "model": "qwen3-8b",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant. Keep answers concise."
    },
    {
      "role": "user",
      "content": "What is an ERC-4337 smart account?"
    }
  ],
  "stream": false,
  "max_tokens": 512,
  "temperature": 0.7
}
```

---

## Response (non-streaming)

```json
{
  "id": "chatcmpl-job_8fx2kp3m...",
  "object": "chat.completion",
  "created": 1750000000,
  "model": "qwen3-8b",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "An ERC-4337 smart account is a smart contract wallet that can sponsor gas, batch transactions, and support social recovery..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 48,
    "completion_tokens": 214,
    "total_tokens": 262
  }
}
```

### Response headers (non-streaming)

```
x-hoodcompute-job-id: job_8fx2kp3m9qrstvwxyz
x-hoodcompute-tx-hash: 0x8c2f41ab9e07d3565f18c4ba20d97e631a5c08f2be49d176e0a3b58c917d24f0
x-hoodcompute-settlement-tx: 0x3a91d5c07f26e8b4915dc3a08e67f21b49c0d8a35e7612fb08d94ce5a172b36d
x-hoodcompute-worker: 0x9d24ab7e315f68c0d1b2fa4c8e0973d65a1cbe48
x-hoodcompute-credits-remaining: 1412
```

---

## Streaming response

When `stream: true`, the response is a stream of Server-Sent Events in the OpenAI format. Each event contains a JSON `delta` with the newly generated content.

```
data: {"id":"chatcmpl-job_8fx2kp3m...","object":"chat.completion.chunk","created":1750000000,"model":"qwen3-8b","choices":[{"index":0,"delta":{"role":"assistant","content":"A "},"finish_reason":null}]}

data: {"id":"chatcmpl-job_8fx2kp3m...","object":"chat.completion.chunk","created":1750000000,"model":"qwen3-8b","choices":[{"index":0,"delta":{"content":"Program "},"finish_reason":null}]}

data: {"id":"chatcmpl-job_8fx2kp3m...","object":"chat.completion.chunk","created":1750000000,"model":"qwen3-8b","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

The final event before `[DONE]` includes `finish_reason`. After `[DONE]`, the `x-hoodcompute-settlement-tx` header is available if you inspect the response after the stream closes.

### Streaming example

```bash
curl https://api.hoodcompute.com/v1/chat/completions \
  -H "Authorization: Bearer hoodc_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b",
    "messages": [{"role": "user", "content": "Write a haiku about Robinhood Chain."}],
    "stream": true
  }'
```

---

## Credit charges

Credits are locked in escrow when the request is received and released to the worker after the job settles.

| Charge point | Timing |
|---|---|
| Escrow lock | When the request is received, before routing |
| Escrow release | After proof-of-completion is verified on-chain |
| Credit deduction | On settlement confirmation |
| Refund on failure | Automatic if no worker completes within 120 seconds |

For long completions (over approximately 500 output tokens), the charge switches to a per-1,000-output-token rate. The initial escrow locks an estimated amount. If the actual output is shorter, the difference is credited back.

---

## Errors

| Status | Code | Meaning |
|---|---|---|
| `400` | `invalid_request` | Malformed request body or missing required field |
| `400` | `model_not_found` | The requested model ID does not exist |
| `402` | `insufficient_credits` | Credit balance too low for the requested tier |
| `503` | `no_workers_available` | No workers currently hosting the requested model. Includes `retry_after` in seconds. |
| `504` | `job_timeout` | No worker completed the job within 120 seconds. Credits were refunded. |

See [Errors]({% link api-reference/errors.md %}) for the full error response format.
