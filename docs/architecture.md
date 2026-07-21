---
layout: default
title: Architecture
nav_order: 3
---

# Architecture

HoodCompute is built in three independent layers. The smart contracts on Robinhood Chain are the authoritative enforcement layer. The orchestrator network coordinates routing. The client layer is where users and developers interact.

---

## System overview

```
+---------------------------------------------------------------+
|                    User / Developer                           |
|           (Chat UI  /  API Client  /  SDK)                    |
+-----------------------------+---------------------------------+
                              |
                              | 1. Submit job + lock escrow on-chain
                              |
                              v
+---------------------------------------------------------------+
|                   Orchestrator Network                        |
|             (libp2p peer mesh, decentralized)                 |
|                                                               |
|   Worker discovery via gossip protocol                        |
|   Job matching: model availability, stake weight,             |
|   latency, reputation score                                   |
|   Token streaming: worker -> orchestrator -> client           |
+-----------------------------+---------------------------------+
                              |
                              | 2. Route job to best available worker
                              |
                              v
+---------------------------------------------------------------+
|                       Worker Node                             |
|      Browser (WebGPU via WebLLM) or Native (hoodcompute-node)  |
|                                                               |
|   Decrypt payload with ephemeral session key                  |
|   Run inference locally                                       |
|   Stream tokens back through orchestrator                     |
|   Sign and submit proof of completion                         |
+-----------------------------+---------------------------------+
                              |
                              | 3. Submit proof on-chain
                              |
                              v
+---------------------------------------------------------------+
|              Robinhood Chain Smart Contracts                  |
|                                                               |
|   Verify proof signature                                      |
|   Release escrow: 75-85% to worker, 15-25% to treasury       |
|   Emit indexed event for Explorer                             |
+---------------------------------------------------------------+
```

---

## Layer 1: Client interfaces

**Chat UI**

The web-based chat interface at `hoodcompute.com/app`. Built on Next.js, served at the edge. Handles wallet connection, credit management, model selection, and streaming response display.

**REST API**

An OpenAI-compatible HTTP API at `api.hoodcompute.com/v1`. Accepts bearer token authentication via API key. Every request locks credits in escrow before routing begins. Response headers include the Robinhood Chain transaction hash for the escrow lock.

**TypeScript and Python SDKs**

Thin wrappers around the REST API that add wallet-native authentication, streaming helpers, React hooks, and typed access to on-chain job receipts.

---

## Layer 2: Orchestrator network

The orchestrator layer is a peer-to-peer network built on libp2p. There is no central orchestrator server. Any party can run an orchestrator node and earn a routing fee per job.

**Worker discovery**

Workers broadcast their capabilities via a gossip protocol: GPU model, available VRAM, hosted models, geographic region, stake weight, and current queue depth. Orchestrators maintain a live view of the network from this gossip stream.

**Job routing**

When a job arrives, the routing algorithm selects a worker based on:

1. Model availability (worker must be hosting the requested model)
2. Stake weight (higher stake gets higher routing priority)
3. Reputation score (on-chain, updated after each completed job)
4. Estimated latency to the requesting client

**Token streaming**

Once a worker accepts a job, it streams generated tokens back through the orchestrator to the client via WebSocket. The orchestrator relays the stream without buffering the full output.

**Fault handling**

If a worker fails to begin streaming within a configurable timeout (default 8 seconds), the job is rerouted to the next available worker and the escrow remains locked. If no worker completes the job within 120 seconds, the escrow is refunded automatically by the `job_escrow` contract.

---

## Layer 3: Worker nodes

### Browser workers (Tier 1)

Browser workers run inference using WebGPU via the WebLLM runtime. No installation required. Workers load quantized GGUF models into browser memory and process jobs in a Web Worker thread to avoid blocking the UI.

| Property | Value |
|---|---|
| Runtime | WebLLM + WebGPU |
| Supported models | 1B to 8B quantized (GGUF) |
| Minimum VRAM | 3GB GPU memory visible to browser |
| Setup | Open the Earn tab in Chrome 113+ |
| Payout rate | 98% of job value (unstaked) |

### Native workers (Tier 2)

Native workers run the `hoodcompute-node` daemon, a single Rust binary that manages GPU backends, model downloads, job queue handling, and on-chain interactions.

| Property | Value |
|---|---|
| Runtime | hoodcompute-node (Rust) |
| GPU backends | CUDA (NVIDIA), Metal (Apple Silicon), ROCm (AMD) |
| Inference engine | llama.cpp |
| Supported models | 8B to 70B+ (full precision and quantized) |
| Setup | Install binary, connect wallet, stake, configure |
| Payout rate | 98% unstaked, 85% with minimum stake |

---

## Layer 4: Robinhood Chain smart contracts

All contracts are open-source and audited before Mainnet deployment.

| Contract | Responsibility |
|---|---|
| `job_escrow` | Locks credits when a job is submitted. Releases on verified completion or refunds on timeout. |
| `worker_registry` | Manages worker stake, registered models, and on-chain reputation. |
| `settlement` | Verifies proof of completion. Distributes payout to worker and treasury. |
| `staking` | Handles $HCOMPUTE staking, lock periods, and earnings multiplier tiers. |
| `governance` | On-chain voting for model curation, fee parameters, and protocol upgrades. Active post-beta. |

### Proof of completion

After each inference job, the worker submits a lightweight cryptographic proof:

- SHA-256 hash of the full output token stream
- Signed by the worker's registered secp256k1 keypair

The `settlement` contract verifies the signature matches the registered address, then releases the escrow. If the client-side hash of the received output does not match the submitted proof, the client can open a dispute within a 60-second window.

**Beta dispute resolution:** The HoodCompute Safe multisig arbitrates. A confirmed dishonest proof submission results in slashing 5% of the worker's staked $HCOMPUTE.

**Long-term:** ZK proof-of-inference is on the active research track. This would make verification fully trustless without requiring a dispute window.

---

## Technology stack

| Layer | Technology | Reason |
|---|---|---|
| Blockchain | Robinhood Chain Mainnet | ~100ms blocks, sub-cent fees, Ethereum security, native USDG |
| Smart contracts | Solidity + Foundry | Battle-tested EVM toolchain; audited with industry-standard tooling |
| Credits | USDG (ERC-20) | Stable, Paxos-issued, native to Robinhood Chain |
| Governance token | $HCOMPUTE (ERC-20) | Staking, governance, protocol value accrual |
| P2P networking | libp2p | Proven peer mesh for the orchestrator layer |
| Native inference | llama.cpp | Supports CUDA, Metal, ROCm; broad model format support |
| Browser inference | WebLLM + WebGPU | Zero-install browser workers |
| Indexing | Alchemy | Recommended RPC for Robinhood Chain; webhooks, full transaction history |
| API layer | TypeScript / Node.js | Fast iteration, first-class EVM tooling (viem, ethers.js) |
| Dashboard | Next.js | SSR, edge-deployable |

---

## Settlement flow, step by step

1. User funds their credit balance by sending USDG to the `job_escrow` contract (wallet transfer, payment link, or on-ramp - gas sponsored via ERC-4337). Credits are recorded as an on-chain balance keyed to the user's wallet address.

2. User submits an inference request. The escrow contract locks the job's credit cost atomically. The job ID and locked amount are recorded on-chain before routing begins.

3. The orchestrator routes the job to an available worker based on the matching criteria above.

4. The worker decrypts the job payload, runs inference, and streams tokens back to the client.

5. The worker submits a signed proof-of-completion to the `settlement` contract.

6. The settlement contract verifies the signature and atomically releases funds:
   - Worker wallet receives **98%** (or **85%** with an active stake)
   - Protocol treasury receives the remainder

7. The settlement transaction is indexed by Alchemy and appears in the HoodCompute Explorer within seconds.

Every step from escrow lock to settlement is a publicly verifiable Robinhood Chain transaction, visible on Blockscout.
