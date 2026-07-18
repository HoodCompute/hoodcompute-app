---
layout: default
title: Webhooks
parent: API Reference
nav_order: 5
---

# Webhooks

HoodCompute can deliver real-time event notifications to an HTTPS endpoint of your choosing. Webhooks are useful for responding to job completions without polling the Jobs API, monitoring credit levels, and triggering downstream workflows.

---

## Configuring a webhook

Create and manage webhooks in the Settings tab at `hoodcompute.com/app/settings`.

You can also configure webhooks programmatically:

```bash
curl -X POST https://api.hoodcompute.com/v1/webhooks \
  -H "Authorization: Bearer hoodc_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/hoodcompute-events",
    "events": ["job.completed", "credit.low"],
    "secret": "your_signing_secret"
  }'
```

```json
{
  "id": "wh_9ax3mb5n7kqrstvwxyz",
  "url": "https://your-server.com/hoodcompute-events",
  "events": ["job.completed", "credit.low"],
  "created_at": "2026-06-15T09:00:00Z",
  "status": "active"
}
```

The `secret` is used to sign webhook deliveries. Store it securely; it is shown only at creation time.

---

## Event types

| Event | When it fires |
|---|---|
| `job.submitted` | A job has been created and credits locked in escrow |
| `job.processing` | A worker has acknowledged the job and inference has started |
| `job.completed` | The job has settled on-chain and the worker has been paid |
| `job.failed` | The job failed before completion (routing error, worker dropped) |
| `job.timeout` | No worker completed the job within 120 seconds; credits refunded |
| `job.disputed` | A dispute was opened on a completed job |
| `credit.low` | Your credit balance has dropped below the configured threshold |
| `credit.topup` | Credits were added to your balance |
| `worker.registered` | A new worker registered (provider-facing) |
| `worker.slashed` | A worker had stake slashed due to a confirmed fraudulent proof |

Subscribe to only the events you need. The `events` array accepts any combination.

---

## Event payload format

All events share a common envelope:

```json
{
  "id": "evt_7bx2ma4n6jpqruvwxyz",
  "event": "job.completed",
  "created_at": "2026-06-15T14:22:03Z",
  "api_version": "2026-06-01",
  "data": { ... }
}
```

### `job.completed`

```json
{
  "id": "evt_7bx2ma4n6jpqruvwxyz",
  "event": "job.completed",
  "created_at": "2026-06-15T14:22:03Z",
  "api_version": "2026-06-01",
  "data": {
    "job_id": "job_8fx2kp3m9qrstvwxyz",
    "model": "qwen3-8b",
    "tier": "standard",
    "credits_charged": 8,
    "usdg_value": 0.08,
    "worker_address": "0x9d24ab7e315f68c0d1b2fa4c8e0973d65a1cbe48",
    "settlement_tx": "0x3a91d5c07f26e8b4915dc3a08e67f21b49c0d8a35e7612fb08d94ce5a172b36d",
    "block_number": 12847293,
    "prompt_tokens": 48,
    "completion_tokens": 214,
    "credits_remaining": 1412
  }
}
```

### `credit.low`

```json
{
  "id": "evt_3cx1la5n7kqrtvwxyz",
  "event": "credit.low",
  "created_at": "2026-06-15T15:00:00Z",
  "api_version": "2026-06-01",
  "data": {
    "credits_remaining": 87,
    "usdg_value": 0.87,
    "threshold": 100
  }
}
```

The `credit.low` threshold can be configured in Settings. Default is 100 credits.

### `worker.slashed`

```json
{
  "id": "evt_5dx4nb8m2lqruvwxyz",
  "event": "worker.slashed",
  "created_at": "2026-06-15T16:00:00Z",
  "api_version": "2026-06-01",
  "data": {
    "worker_address": "0x9d24ab7e315f68c0d1b2fa4c8e0973d65a1cbe48",
    "slash_amount_hoodc": 500,
    "slash_tx": "0x6d15f8a2c30b97e4d68f012a5c4be79308d1a6f5e2c48b09173da5e6f0b2c481",
    "reason": "fraudulent_proof",
    "related_job_id": "job_2ax1jb4k8npqruvwxyz"
  }
}
```

---

## Verifying webhook signatures

Every webhook delivery includes a `HoodCompute-Signature` header. Verify it to confirm the request came from HoodCompute and was not tampered with.

**Signature format:**

```
HoodCompute-Signature: t=1750000000,v1=a1b2c3d4e5f6...
```

- `t` is the Unix timestamp of delivery
- `v1` is the HMAC-SHA256 of `{timestamp}.{raw_request_body}` using your webhook secret

**Verification in Node.js:**

```typescript
import crypto from "crypto"

function verifyWebhook(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const match = signature.match(/^t=(\d+),v1=([0-9a-f]+)$/)
  if (!match) return false
  const [, timestamp, receivedSig] = match

  const payload = `${timestamp}.${rawBody}`
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(receivedSig)
  )
}

// In your webhook handler:
app.post("/hoodcompute-events", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["hoodcompute-signature"] as string
  const isValid = verifyWebhook(req.body.toString(), sig, process.env.WEBHOOK_SECRET!)

  if (!isValid) {
    return res.status(400).json({ error: "Invalid signature" })
  }

  const event = JSON.parse(req.body.toString())
  // Handle event...
  res.json({ received: true })
})
```

**Verification in Python:**

```python
import hmac
import hashlib
import re

def verify_webhook(raw_body: bytes, signature: str, secret: str) -> bool:
    match = re.fullmatch(r"t=(\d+),v1=([0-9a-f]+)", signature)
    if not match:
        return False
    timestamp, received_sig = match.groups()

    payload = f"{timestamp}.{raw_body.decode()}"
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, received_sig)
```

Always use a constant-time comparison (`timingSafeEqual` / `hmac.compare_digest`) to prevent timing attacks.

---

## Retry behavior

If your endpoint returns a non-2xx status code or does not respond within 10 seconds, the delivery is retried with exponential backoff:

| Attempt | Delay |
|---|---|
| 1 | Immediate |
| 2 | 30 seconds |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |

After five failed attempts, the webhook is marked as failed and no further retries are made. You can view failed deliveries and replay them from the Settings tab.

---

## Managing webhooks

List webhooks:

```bash
curl https://api.hoodcompute.com/v1/webhooks \
  -H "Authorization: Bearer hoodc_live_your_key_here"
```

Delete a webhook:

```bash
curl -X DELETE https://api.hoodcompute.com/v1/webhooks/wh_9ax3mb5n7kqrstvwxyz \
  -H "Authorization: Bearer hoodc_live_your_key_here"
```
