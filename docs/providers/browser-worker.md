---
layout: default
title: Browser Worker
parent: Providers
nav_order: 1
---

# Browser Worker

The browser worker is the zero-friction path to earning on HoodCompute. There is nothing to install. Open the Earn tab, connect a wallet, and start accepting inference jobs from your browser.

Browser workers use WebGPU via the WebLLM runtime to run inference directly in the browser tab. Jobs are processed locally on your GPU and streamed back to the requesting client.

---

## Requirements

| Requirement | Details |
|---|---|
| Browser | Chrome 113+ or any Chromium-based browser with WebGPU enabled |
| GPU | Any GPU with WebGPU driver support and at least 3GB of GPU memory visible to the browser |
| Wallet | Any Ethereum wallet (MetaMask, Rabby, Robinhood Wallet) |
| Network | Stable internet connection. Upload bandwidth affects streaming quality. |
| Stake | Not required for browser workers |

**WebGPU support check:** Navigate to `chrome://gpu` in Chrome and look for "WebGPU" in the graphics feature status. If it shows "Hardware accelerated," you are compatible.

**Unsupported:** Safari (WebGPU implementation is incomplete), Firefox (WebGPU not enabled by default in most versions). Mobile browsers are not supported for worker mode.

---

## Getting started

**1. Connect your wallet**

Go to `hoodcompute.com/app` and click "Earn" in the navigation. Connect your Ethereum wallet (MetaMask, Rabby, or Robinhood Wallet) when prompted. This wallet address is where your USDG earnings will be sent.

**2. Check compatibility**

The Earn tab runs a compatibility check automatically when you connect. It detects:
- Whether your browser supports WebGPU
- How much GPU memory is available to the browser
- Which models are compatible with your available VRAM

If WebGPU is not available, you will see an error with a link to enable it or a suggestion to switch browsers.

**3. Select a model**

Choose from the list of compatible models. The list is filtered to models that fit in your detected VRAM. Selecting a larger model generally earns more per job but may slow other activity on your machine while jobs are running.

| Model | Tier | VRAM required | Earnings per job |
|---|---|---|---|
| Qwen3 1.7B (Q4) | Lite | 3GB | $0.015 |
| Llama 3.2 3B (Q4) | Lite | 4GB | $0.015 |
| Qwen3 8B (Q4) | Standard | 6GB | $0.060 |
| Mistral 7B (Q4) | Standard | 6GB | $0.060 |

**4. Start earning**

Click "Start Earning." The page loads the selected model into browser memory. This takes between 15 seconds and 2 minutes depending on the model size and your internet connection. Models are cached in browser storage after the first load.

Once the model is loaded, your worker announces itself to the orchestrator mesh and begins receiving jobs. You do not need to do anything else. The page shows incoming jobs and a live USDG earnings counter as jobs complete.

---

## How browser inference works

When a job arrives at your browser worker:

1. The encrypted job payload is received via WebSocket from the orchestrator.
2. A Web Worker thread decrypts the payload using the ephemeral session key.
3. WebLLM runs inference on the decrypted prompt using your GPU via the WebGPU API.
4. Generated tokens are streamed back to the orchestrator as they are produced.
5. After the final token, the worker computes a SHA-256 hash of the full output, signs it with the wallet key, and submits the proof to the `settlement` contract.
6. The settlement transaction sends USDG to your wallet. This typically confirms within one second, and the gas is sponsored by HoodCompute via ERC-4337 so you never need to hold ETH.

Inference runs in a Web Worker thread to keep the browser UI responsive during jobs. You can use other tabs while earning, though GPU-intensive tasks in other tabs may reduce inference throughput.

---

## Earnings and payouts

Earnings are paid in USDG directly to your connected wallet after each completed job. There is no minimum payout threshold and no batching.

Browser workers receive 98% of the job value. There is no stake requirement to start, but you cannot unlock the 85% rate with browser workers alone. The 85% rate requires the `hoodcompute-node` native worker with an active $HOODCOMPUTE stake.

During the beta period, all browser workers receive a 2x $HOODCOMPUTE reward multiplier on top of USDG earnings. This multiplier applies to $HOODCOMPUTE allocation from the Community/Provider rewards pool and vests over 18 months.

---

## Leaving and returning

Closing the Earn tab stops your worker immediately. Any job currently in progress will time out and be rerouted to another available worker. You will not receive payment for incomplete jobs at the moment of closure.

Your USDG balance and on-chain reputation persist between sessions. When you reopen the Earn tab and reconnect your wallet, your history is intact.

---

## Troubleshooting

**"WebGPU not available"**

Enable hardware acceleration in Chrome settings (`chrome://settings/system`). If it is already enabled, check that your GPU driver is up to date.

**Model loading fails**

Your browser's available GPU memory may be less than the model requires. Try selecting a smaller model. Closing other tabs that use GPU resources (video players, 3D apps, other WebGPU applications) can help.

**Jobs not arriving**

After loading a model, it can take up to 60 seconds for your worker to be visible in the orchestrator mesh. If no jobs arrive after several minutes, check your network connection. Verify on the dashboard that your worker is showing as "Active."

**Low earnings per hour**

Browser workers on Lite-tier models earn less per job than native workers on larger models. If you have NVIDIA or Apple Silicon hardware, the [Native Worker]({% link providers/native-worker.md %}) path will earn significantly more per hour.
