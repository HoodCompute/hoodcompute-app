---
layout: default
title: How It Works
parent: Core Concepts
nav_order: 1
---

# How It Works

An inference job on HoodCompute moves through four distinct stages: credit lock, routing, inference, and settlement. Each stage involves different parts of the system, and several of them produce on-chain state that anyone can inspect.

---

## Stage 1: Credit lock

When you submit an inference request, the first thing that happens on-chain is a credit lock. The `job_escrow` contract atomically reserves the credit cost for the requested model tier before any routing begins.

This matters for two reasons. First, it guarantees the worker will be paid before they start the job. Second, it means the protocol can issue a refund automatically if no worker completes the job within the timeout window, with no manual intervention required.

The escrow lock generates a transaction on Robinhood Chain. The job ID, credit amount, model tier, and requesting wallet's escrow record are written to chain at this point. The prompt content is not.

**Timeout behavior:** If no worker submits a valid proof within 120 seconds, the `job_escrow` contract releases the credits back to the user's balance. This happens on-chain without any action from the user.

---

## Stage 2: Routing

With credits locked, the job is handed to the orchestrator network. The orchestrator is a peer-to-peer mesh built on libp2p. There is no central server making routing decisions.

Worker nodes continuously broadcast their state to the orchestrator mesh: which models they are hosting, current VRAM availability, GPU type, estimated latency zone, stake weight, and reputation score.

The routing algorithm selects the best available worker using a weighted scoring function:

| Factor | Description |
|---|---|
| Model availability | Worker must be hosting the requested model or a compatible variant |
| Stake weight | Higher $HCOMPUTE stake increases routing priority |
| Reputation score | On-chain score based on historical completion rate, latency, and proof validity |
| Estimated latency | Geographic proximity to the requesting client |

The job payload (encrypted prompt, model parameters, streaming configuration) is delivered to the selected worker.

**Rerouting:** If the selected worker does not acknowledge the job within 8 seconds, it is rerouted to the next candidate. The escrow remains locked. The rerouting does not cost the user any additional credits.

---

## Stage 3: Inference

The worker receives the encrypted job payload. It decrypts the prompt locally using the ephemeral session key included in the payload envelope. Decryption happens in memory only. No part of the plaintext prompt or response is written to disk or logged anywhere.

The worker runs inference using its local GPU backend (llama.cpp for native workers, WebLLM for browser workers) and streams generated tokens back through the orchestrator mesh to the client via WebSocket.

The orchestrator relays the token stream without reading or buffering the content. It sees only the encrypted transport frames.

When inference is complete, the worker:

1. Computes a SHA-256 hash of the full output token stream
2. Signs the hash with its registered worker key
3. Submits the signed proof to the `settlement` contract

---

## Stage 4: Settlement

The `settlement` contract receives the proof submission and verifies:

- The signing key matches the registered address in the `worker_registry` contract
- The worker registered the model tier matching the escrowed job
- The proof was submitted within the allowed window

If verification passes, the contract atomically:

- Releases the escrowed credits as USDG
- Sends 98% (or 85% if the worker has an active stake) to the worker's wallet
- Sends the remainder to the protocol treasury
- Emits an on-chain event indexed by Alchemy

The settlement transaction appears in the HoodCompute Explorer within seconds of confirmation.

**Dispute window:** The client has 60 seconds after receiving the final token to compare its local output hash against the submitted proof hash. If they do not match, the client can open a dispute. See [On-Chain Settlement]({% link core-concepts/on-chain-settlement.md %}) for dispute mechanics.

---

## Summary timeline

```
T+0ms     User submits request
T+~100ms  Credits locked on-chain (escrow tx)
T+~250ms  Job routed to worker
T+~450ms  Worker acknowledges and begins inference
T+Ns      Tokens stream to client (N = inference duration)
T+N+50ms  Worker submits proof on-chain
T+N+250ms Settlement tx confirmed, USDG in worker wallet
T+N+60s   Dispute window closes
```

Total time from request to settled payment is typically under one second for the payment mechanics; Robinhood Chain's ~100ms block times mean each on-chain step confirms almost immediately. Inference duration depends on model size and output length.

---

## What is on-chain vs. off-chain

| Data | Location | Reason |
|---|---|---|
| Credit escrow lock | On-chain | Guarantees worker payment before job starts |
| Job ID, model tier, timestamp | On-chain | Auditable job record |
| Credit amount charged | On-chain | Verifiable billing |
| Worker address | On-chain | Identifies who received the payment |
| Proof hash | On-chain | Enables dispute verification |
| USDG payout transaction | On-chain | Verifiable settlement |
| Prompt content | Nowhere | Encrypted in transit, never persisted |
| Response content | Nowhere | Streamed in memory only, never stored |
| User identity | Nowhere | Only a wallet address is ever known |
