---
layout: default
title: Authentication
parent: API Reference
nav_order: 1
---

# Authentication

All API requests require a bearer token in the `Authorization` header. Tokens are API keys linked to a specific Ethereum wallet and its credit balance.

---

## API keys

API keys are generated from the Settings tab in the HoodCompute web app at `hoodcompute.com/app/settings`.

**Key format:** `hoodc_live_` followed by a 32-character alphanumeric string.

Example: `hoodc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Key properties:**
- One key per wallet during beta. Multiple keys per wallet are coming in Phase 2.
- Keys are linked to the credit balance of the wallet that created them. Spending credits via the API reduces the same balance visible in the web app.
- Keys can be revoked and regenerated from the Settings tab at any time.
- Keys are shown once at creation. If you lose your key, you must generate a new one.

---

## Making authenticated requests

Include the API key as a bearer token in every request:

```bash
curl https://api.hoodcompute.com/v1/models \
  -H "Authorization: Bearer hoodc_live_your_key_here"
```

```python
import httpx

headers = {"Authorization": "Bearer hoodc_live_your_key_here"}
response = httpx.get("https://api.hoodcompute.com/v1/models", headers=headers)
```

```typescript
const response = await fetch("https://api.hoodcompute.com/v1/models", {
    headers: { "Authorization": "Bearer hoodc_live_your_key_here" }
})
```

---

## Security

**Keep your API key private.** Do not commit it to version control or expose it in client-side code. Use environment variables.

```bash
export HOODCOMPUTE_API_KEY="hoodc_live_your_key_here"
```

```python
import os
api_key = os.environ["HOODCOMPUTE_API_KEY"]
```

**Key scope:** An API key can only spend credits from the wallet that created it. It cannot withdraw credits, transfer $HCOMPUTE, or modify account settings.

**Key revocation:** If you believe a key has been compromised, revoke it immediately from Settings. Revocation is instant and takes effect for all subsequent requests.

---

## Wallet-native authentication (coming in Phase 2)

In Phase 2, the API will support wallet-native authentication as an alternative to static API keys. Instead of a pre-generated key, you sign each request with your Ethereum wallet key using EIP-4361 Sign-In with Ethereum. This allows programmatic use without a pre-shared secret and is better suited to automated environments where generating a static key is inconvenient.

---

## Authentication errors

| Status | Code | Meaning |
|---|---|---|
| `401` | `invalid_api_key` | The key does not exist or has been revoked |
| `401` | `missing_api_key` | No `Authorization` header was included |
| `402` | `insufficient_credits` | Your credit balance is too low for the requested model tier |
| `403` | `key_suspended` | The key has been suspended due to a policy violation |

See [Errors]({% link api-reference/errors.md %}) for full error response format.

---

## Checking your balance via the API

```bash
curl https://api.hoodcompute.com/v1/account \
  -H "Authorization: Bearer hoodc_live_your_key_here"
```

```json
{
  "wallet": "0x7f3ce8b1a94d20c5e6f18b7a2d40953c1e8ba672",
  "credits_remaining": 1420,
  "usdg_value": 14.20,
  "last_topup_at": "2026-06-15T09:43:00Z",
  "api_key_created_at": "2026-06-01T00:00:00Z"
}
```
