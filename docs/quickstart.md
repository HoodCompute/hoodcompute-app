---
layout: default
title: Quickstart
nav_order: 2
---

# Quickstart

Choose your path. You can use HoodCompute as a user, a developer, or a provider. All three are available from day one with no account required beyond an Ethereum wallet.

---

## As a user: get your first inference

**What you need:** Any Ethereum wallet (MetaMask, Rabby, Robinhood Wallet) with a small USDG balance. Gas is sponsored by HoodCompute via ERC-4337, so you never need to hold ETH.

**Time required:** Under 5 minutes.

**1. Connect your wallet**

Go to [hoodcompute.com/app](https://hoodcompute.com/app) and click "Connect wallet." No email, no sign-up form, nothing else.

**2. Buy credits**

Credits are the unit of account for inference jobs. One credit equals $0.01 USDG. You can fund as little as $1 to start.

Click "Add credits," choose an amount, and approve the USDG transaction from your wallet. Credits are immediately available.

**3. Choose a model and start chatting**

Pick a model from the list. If you are not sure, start with **Qwen3 8B** (Standard tier, 8 credits per request). It is fast, capable, and available across multiple worker nodes at all times.

Type a message and submit. Your prompt is encrypted before it leaves your browser. The job routes to an available worker, runs inference, and streams the response back to you.

That is the complete flow. Nothing was logged. The job payment settled on Robinhood Chain.

---

## As a developer: call the API

**What you need:** An Ethereum wallet with USDG, and an API key from the dashboard.

**Time required:** Under 10 minutes.

**1. Get an API key**

Sign in at [hoodcompute.com/app](https://hoodcompute.com/app), go to Settings, and generate an API key. Keys are in the format `hoodc_live_...` and are linked to your wallet's credit balance.

**2. Make your first request**

The HoodCompute API is OpenAI-compatible. If you are already using the OpenAI SDK, change one line:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.hoodcompute.com/v1",
    api_key="hoodc_live_your_key_here"
)

response = client.chat.completions.create(
    model="llama-3.3-70b",
    messages=[{"role": "user", "content": "Explain optimistic rollups in plain terms."}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
```

```typescript
import OpenAI from "openai"

const client = new OpenAI({
    baseURL: "https://api.hoodcompute.com/v1",
    apiKey: "hoodc_live_your_key_here"
})

const stream = await client.chat.completions.create({
    model: "qwen3-8b",
    messages: [{ role: "user", content: "What is an ERC-4337 smart account?" }],
    stream: true
})

for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content ?? "")
}
```

**3. Check your on-chain receipt**

Every API call generates a Robinhood Chain transaction. The response headers include `x-hoodcompute-job-id` and `x-hoodcompute-tx-hash` (the transaction hash). You can verify the payment on the Blockscout explorer at `robinhoodchain.blockscout.com`.

---

## As a provider: start earning

**What you need:** A WebGPU-capable browser (Chrome 113+) and an Ethereum wallet. No USDG required to start as a browser worker.

**Time required:** Under 5 minutes.

**Browser worker (zero friction)**

1. Go to [hoodcompute.com/app](https://hoodcompute.com/app) and click "Earn."
2. Connect your wallet.
3. The page detects your browser's WebGPU support and available VRAM.
4. Select a compatible model from the list.
5. Click "Start Earning."

Jobs begin routing to you within seconds. USDG is credited to your wallet after each completed job. You can close the tab at any time.

**Native worker (higher earnings)**

See the full [Native Worker guide]({% link providers/native-worker.md %}) for installation and configuration. Native workers earn more per job, support larger models, and qualify for the staking multiplier that raises your payout share from 98% to 85%.

---

## Available models at launch

| Model | Tier | Cost per request | VRAM required |
|---|---|---|---|
| Llama 3.3 70B | Max | 40 credits ($0.40) | 48GB+ |
| DeepSeek R1 | Max | 40 credits ($0.40) | 48GB+ |
| Qwen3 8B | Standard | 8 credits ($0.08) | 8GB+ |
| Mistral 7B | Standard | 8 credits ($0.08) | 8GB+ |
| Llama 3.2 3B | Lite | 2 credits ($0.02) | 4GB+ |
| Qwen3 1.7B | Lite | 2 credits ($0.02) | 3GB+ |

Long-form completions billed over approximately 500 output tokens are charged per 1,000 output tokens rather than per request.

---

## Next steps

- [Core Concepts]({% link core-concepts/index.md %}) to understand how the network works end to end
- [API Reference]({% link api-reference/index.md %}) for endpoint documentation
- [Providers: Browser Worker]({% link providers/browser-worker.md %}) for browser setup details
- [Providers: Native Worker]({% link providers/native-worker.md %}) for the full native setup guide
- [Staking]({% link providers/staking.md %}) to unlock the 85% payout multiplier
