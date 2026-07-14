# @hoodcompute/sdk

The official TypeScript SDK for [HoodCompute](https://hoodcompute.com), the decentralized AI inference network on Robinhood Chain.

Private, censorship-free inference from a distributed pool of GPU providers. Every job is settled on-chain, so every completion comes with a receipt you can verify yourself on Blockscout.

- **OpenAI-compatible** chat completions. If you know the OpenAI SDK, you know this one.
- **Streaming** token delivery over Server-Sent Events, as an async iterable.
- **On-chain receipts** attached to every completion. Job ID and settlement transaction, no extra call.
- **Typed end to end.** Full TypeScript types for requests, responses, jobs, models, and webhooks.
- **React hooks** in a separate entry point, so the core stays framework-agnostic.
- **Zero runtime dependencies.** Built on the platform `fetch`.

> **Beta.** HoodCompute is an early, real, working network. The SDK follows semantic versioning. Expect additive changes as the network grows.

---

## Installation

```bash
npm install @hoodcompute/sdk
```

Requires Node 18 or newer (for the built-in `fetch`), or any modern browser or edge runtime.

---

## Quickstart

Get an API key from the Settings tab at [hoodcompute.com/app/settings](https://hoodcompute.com/app/settings). Keys are formatted `hoodc_live_...` and are linked to your wallet's credit balance.

```typescript
import { HoodComputeClient } from "@hoodcompute/sdk"

const client = new HoodComputeClient({
  apiKey: process.env.HOODCOMPUTE_API_KEY,
})

const completion = await client.chat.completions.create({
  model: "qwen3-8b",
  messages: [{ role: "user", content: "What is an ERC-4337 smart account?" }],
})

console.log(completion.choices[0].message.content)
console.log("Job:", completion.jobId)
console.log("Settled:", completion.settlementTx)
```

If you omit `apiKey`, the client reads `HOODCOMPUTE_API_KEY` from the environment.

---

## Streaming

Pass `stream: true` to receive an async iterable of chunks. Once the stream closes, the settlement receipt is available on the stream object.

```typescript
import { HoodComputeClient, explorerTxUrl } from "@hoodcompute/sdk"

const client = new HoodComputeClient()

const stream = await client.chat.completions.create({
  model: "llama-3.3-70b",
  messages: [{ role: "user", content: "Explain how optimistic rollups work." }],
  stream: true,
})

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "")
}

console.log("\nSettled:", explorerTxUrl(stream.receipt.settlementTx!))
console.log("Credits remaining:", stream.receipt.creditsRemaining)
```

Need the whole response as a string? Use `await stream.text()`.

---

## On-chain receipts

Every completed job has a receipt whose transaction hashes resolve on the Robinhood Chain [Blockscout explorer](https://robinhoodchain.blockscout.com). The receipt never contains prompt or completion content, only settlement metadata.

```typescript
// Fetch the full receipt for any settled job
const receipt = await client.jobs.getReceipt("job_8fx2kp3m9qrstvwxyz")

console.log(receipt.workerAddress)   // 0x9d24ab7e...
console.log(receipt.creditsCharged)  // 8
console.log(receipt.settlementTx)    // 0x3a91d5c0...

import { explorerTxUrl } from "@hoodcompute/sdk"
console.log(explorerTxUrl(receipt.settlementTx))
```

You do not need to trust the API's report of what happened. The Robinhood Chain transaction is the authoritative record.

---

## Models

The model list reflects the live worker pool. A model appears only while at least one worker is hosting it.

```typescript
const { data: models } = await client.models.list()

for (const model of models) {
  console.log(
    `${model.id}  ${model.hoodcompute.tier}  ` +
      `${model.hoodcompute.activeWorkers} workers  ` +
      `~${model.hoodcompute.medianLatencyMs}ms`,
  )
}

// Inspect one model before submitting a job
const qwen = await client.models.retrieve("qwen3-8b")
```

| Model ID | Parameters | Context | Tier | Credits/request |
|---|---|---|---|---|
| `llama-3.3-70b` | 70B | 128K | Max | 40 |
| `deepseek-r1` | 70B | 128K | Max | 40 |
| `qwen3-14b` | 14B | 32K | Pro | 18 |
| `qwen3-8b` | 8B | 32K | Standard | 8 |
| `mistral-7b` | 7B | 32K | Standard | 8 |
| `llama-3.2-3b` | 3B | 128K | Lite | 2 |

Call `client.models.list()` for the current catalog. One credit is $0.01.

---

## Jobs

```typescript
// Retrieve a job, including its on-chain settlement detail
const job = await client.jobs.get("job_8fx2kp3m9qrstvwxyz")
console.log(job.status)                // "settled"
console.log(job.onChain?.settlementTx)

// List recent jobs
const jobs = await client.jobs.list({ limit: 20, status: "settled" })
for (const j of jobs.data) {
  console.log(`${j.id}  ${j.model}  ${j.creditsCharged} credits`)
}
```

### Disputes

If a worker's on-chain proof does not match the output you received, open a dispute within 60 seconds of the final token. Hash the full response text you received (SHA-256, UTF-8, no trailing newline) and submit it.

```typescript
const result = await client.jobs.dispute(
  "job_8fx2kp3m9qrstvwxyz",
  "sha256:a1b2c3d4...",
)
console.log(result.disputeOpened, result.disputeTx)
```

---

## Account and credits

```typescript
const account = await client.account.get()
console.log(account.wallet)             // 0x7f3ce8b1...
console.log(account.creditsRemaining)   // 1420
console.log(account.usdgValue)          // 14.20
```

---

## React hooks

Import from the `@hoodcompute/sdk/react` entry point. `react` is an optional peer dependency, so it is pulled in only when you use this subpath.

```tsx
import { useHoodComputeChat } from "@hoodcompute/sdk/react"

function Chat() {
  const { send, messages, status, balance, lastReceipt } = useHoodComputeChat({
    model: "qwen3-8b",
    apiKey: process.env.NEXT_PUBLIC_HOODCOMPUTE_API_KEY,
  })

  return (
    <div>
      <p>Credits: {balance?.creditsRemaining ?? "..."}</p>
      {messages.map((m, i) => (
        <p key={i}>
          <strong>{m.role}:</strong> {m.content}
        </p>
      ))}
      <button disabled={status === "streaming"} onClick={() => send("Hello")}>
        Send
      </button>
      {lastReceipt?.settlementTx && (
        <a href={`https://robinhoodchain.blockscout.com/tx/${lastReceipt.settlementTx}`}>
          View settlement
        </a>
      )}
    </div>
  )
}
```

Calling the API directly from the browser exposes your key. In production, proxy requests through your own server. During beta, if you must call from the browser, use a `NEXT_PUBLIC_`-scoped key you can revoke at any time.

---

## Webhooks

Verify the `HoodCompute-Signature` header against the raw request body before parsing it.

```typescript
import { constructWebhookEvent } from "@hoodcompute/sdk"

app.post("/hoodcompute-events", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const event = constructWebhookEvent(
      req.body.toString(),
      req.header("HoodCompute-Signature"),
      process.env.HOODCOMPUTE_WEBHOOK_SECRET!,
    )

    if (event.event === "job.completed") {
      console.log("Settled:", event.data.settlement_tx)
    }

    res.json({ received: true })
  } catch {
    res.status(400).json({ error: "Invalid signature" })
  }
})
```

`verifyWebhookSignature(rawBody, signature, secret)` is also exported if you want to verify without parsing.

---

## Configuration

```typescript
const client = new HoodComputeClient({
  apiKey: "hoodc_live_...",                    // or HOODCOMPUTE_API_KEY
  baseURL: "https://api.hoodcompute.com/v1",   // default
  timeout: 120_000,                            // per-request timeout, ms
  maxRetries: 2,                               // retries on 5xx, 429, network errors
  defaultHeaders: { "x-app-version": "1.0.0" },
})
```

Every request method accepts an `AbortSignal` for cancellation:

```typescript
const controller = new AbortController()
const promise = client.chat.completions.create(
  { model: "qwen3-8b", messages },
  { signal: controller.signal },
)
controller.abort()
```

---

## Error handling

Failed requests throw a typed `HoodComputeError` subclass. Retryable conditions (5xx, 429, network failures, and `no_workers_available`) are retried automatically up to `maxRetries`.

```typescript
import {
  HoodComputeError,
  InsufficientCreditsError,
  NoWorkersAvailableError,
} from "@hoodcompute/sdk"

try {
  await client.chat.completions.create({ model, messages })
} catch (err) {
  if (err instanceof InsufficientCreditsError) {
    console.error("Add credits to continue.")
  } else if (err instanceof NoWorkersAvailableError) {
    console.error(`No workers online. Retry in ${err.retryAfter}s.`)
  } else if (err instanceof HoodComputeError) {
    console.error(err.code, err.message)
  }
}
```

| Class | Status | When |
|---|---|---|
| `AuthenticationError` | 401, 403 | Missing, invalid, revoked, or suspended key |
| `InsufficientCreditsError` | 402 | Credit balance too low for the tier |
| `InvalidRequestError` | 400, 422 | Malformed request or invalid field |
| `NotFoundError` | 404 | Job, model, or resource does not exist |
| `RateLimitError` | 429 | Request rate to the API too high |
| `NoWorkersAvailableError` | 503 | No worker hosting the model right now |
| `JobTimeoutError` | 504 | No worker completed within the window, credits refunded |
| `ServerError` | 5xx | Internal error, usually safe to retry |
| `ConnectionError` | none | Network failure, timeout, or aborted request |

---

## Migrating from the OpenAI SDK

Requests and responses share the OpenAI shape, so most code changes only the client and the model ID.

```diff
- import OpenAI from "openai"
- const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
+ import { HoodComputeClient } from "@hoodcompute/sdk"
+ const client = new HoodComputeClient({ apiKey: process.env.HOODCOMPUTE_API_KEY })

  const completion = await client.chat.completions.create({
-   model: "gpt-4o",
+   model: "llama-3.3-70b",
    messages: [{ role: "user", content: "Hello" }],
  })
```

The HoodCompute responses add `jobId`, `settlementTx`, and `creditsRemaining` on top of the standard fields.

---

## Documentation

- API reference: [docs.hoodcompute.com](https://docs.hoodcompute.com)
- Concept and architecture: [hoodcompute.com](https://hoodcompute.com)
- Explorer: [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com)

## License

MIT
