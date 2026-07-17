---
layout: default
title: Overview
nav_order: 1
description: HoodCompute is a decentralized AI inference network on Robinhood Chain. Share compute and earn, or use private uncensored AI with no account required.
permalink: /
---

# HoodCompute

HoodCompute is a decentralized AI inference network built on Robinhood Chain, an Ethereum Layer 2. Anyone with a GPU can join as a provider and earn USDG for completed inference jobs. Anyone with an Ethereum wallet can access open-weight AI models with no account, no logs, and no content filters applied by the protocol.

Every job, payment, and provider payout is settled on Robinhood Chain and is independently verifiable by anyone.

---

## How it fits together

The network has three layers.

**Users and developers** submit inference requests through the chat interface, the API, or the SDK. Credits are locked in an on-chain escrow before the job is routed. Nothing is logged. Prompts are encrypted before leaving the client.

**Providers** run worker nodes, either in a browser tab (WebGPU) or as a native daemon (`hoodcompute-node`). Workers receive encrypted jobs, run inference locally, and submit a signed proof of completion. Settlement is automatic and immediate.

**Smart contracts** handle escrow, proof verification, and payout distribution without a middleman. The `settlement` contract releases 75 to 85 percent of each job's value directly to the worker's wallet and routes the remainder to the protocol treasury.

---

## Core properties

**Private by design.** Prompts are encrypted client-side with a one-time ephemeral key. Workers decrypt only in memory, only for the duration of inference. Nothing is written to disk or retained by any party.

**Censorship resistant.** All models on HoodCompute are open-weight. No model-level content filtering is applied at the protocol layer. Model curation is governed by $HOODCOMPUTE holders on-chain.

**Fully on-chain.** Every job generates at least two Robinhood Chain transactions: one to lock escrow and one to release payment. Every buyback, burn, and treasury action is a public, verifiable transaction. There is no "trust our dashboard" moment.

**Open access.** No waitlist. No KYC. No geographic restrictions. An Ethereum wallet is the only requirement - gas is sponsored via ERC-4337, so you never need to hold ETH.

---

## Documentation map

| Section | What you will find |
|---|---|
| [Quickstart]({% link quickstart.md %}) | Start earning or get your first inference in under 10 minutes |
| [Architecture]({% link architecture.md %}) | Technical overview of every system component |
| [Core Concepts]({% link core-concepts/index.md %}) | How jobs work, privacy model, settlement, credits, tokenomics |
| [Providers]({% link providers/index.md %}) | Browser workers, native workers, staking, and reputation |
| [API Reference]({% link api-reference/index.md %}) | Endpoints, authentication, request and response formats |
| [Integrations]({% link integrations/index.md %}) | OpenAI drop-in, JS/TS SDK, Python, LangChain |
| [Beta]({% link beta.md %}) | Current beta status, incentives, and known limitations |
| [Changelog]({% link changelog.md %}) | Version history |

---

## Network at a glance

| Metric | Value |
|---|---|
| Settlement chain | Robinhood Chain Mainnet (chain ID 4663) |
| Block time | ~100ms |
| Cost per transaction | Fractions of a cent |
| Provider payout | 98% of job value (85% with staking) |
| Stablecoin | USDG (ERC-20) |
| Governance token | $HOODCOMPUTE |
| Total $HOODCOMPUTE supply | 1,000,000,000 (fixed, no inflation) |
| Minimum stake for Tier 2 | 1,000 $HOODCOMPUTE |
| Prompt retention | Zero |

---

{: .note }
HoodCompute is in open beta. The network is live, earnings are real, and all payments settle on Mainnet. Some features are still rolling out. See the [Beta page]({% link beta.md %}) for current status.
