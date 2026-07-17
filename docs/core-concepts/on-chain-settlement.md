---
layout: default
title: On-Chain Settlement
parent: Core Concepts
nav_order: 3
---

# On-Chain Settlement

Every inference job on HoodCompute generates at least two transactions on Robinhood Chain: one to lock the escrow when the job is submitted, and one to release payment when the job is verified complete. Both are publicly visible on the Blockscout explorer at `robinhoodchain.blockscout.com`.

This page covers the settlement mechanics in detail: the smart contracts involved, the escrow lifecycle, payout distribution, and the dispute process.

---

## Why Robinhood Chain

Robinhood Chain's economics make per-job micropayment viable in a way that few other chains currently do.

| Property | Value | Why it matters for HoodCompute |
|---|---|---|
| Block time | ~100ms | Settlement confirms before the full inference stream even reaches the client |
| Cost per tx | Fractions of a cent | Settling an $0.08 inference job carries negligible overhead - and HoodCompute sponsors gas via ERC-4337, so users and workers never need to hold ETH |
| Throughput | High-throughput Arbitrum Orbit stack | Each job generates at least 2 on-chain transactions. At scale this must be a rounding error, not a bottleneck |
| Native USDG | ERC-20 | No bridging; USDG (Paxos Global Dollar) lives natively on Robinhood Chain |
| EVM compatibility | Solidity + Ethereum security | Audited smart contract development with mature tooling (Foundry, ethers.js, viem), settling on Ethereum and inheriting its security |

Settling the same $0.08 inference job on Ethereum L1 would cost between $2 and $10 in gas, making per-job settlement economically impossible at this price point. As an Ethereum Layer 2, Robinhood Chain keeps fees at fractions of a cent while still settling on Ethereum.

---

## Smart contracts

All contracts are written in Solidity and developed with Foundry. Source code is open and all contracts are audited before Mainnet deployment.

### `job_escrow`

Handles the credit lock at job submission and the refund path if no valid proof is submitted.

**When a job is submitted:**
- Validates that the user's credit balance covers the requested model tier
- Atomically creates an escrow record with the credit amount, job ID, model tier, and expiry timestamp
- Marks the escrow as `Pending`

**When a valid proof is received:** Transitions the escrow to `Settled` and signals the `settlement` contract to release funds.

**On timeout:** If the escrow record is still `Pending` at the expiry timestamp (120 seconds after job submission), any party can call the `refund` function. The contract releases the locked credits back to the user's balance and deletes the escrow record.

### `worker_registry`

Tracks every registered worker on the network.

For each worker, the registry stores:
- Ethereum address
- Staked $HOODCOMPUTE amount and lock tier
- Declared model support list
- On-chain reputation score (0 to 1000)
- Cumulative completed jobs and earnings
- Last seen timestamp

Workers must be registered to receive job routing. Registration requires a minimum stake for Tier 2 workers.

### `settlement`

Called by workers when submitting proof of completion.

**Verification steps:**
1. Look up the job ID in `job_escrow`. Confirm status is `Pending` and has not expired.
2. Look up the submitting address in `worker_registry`. Confirm the worker is registered and declared the model tier used.
3. Verify the proof signature: the SHA-256 hash of the output stream must be signed by the worker's registered key.
4. If all checks pass, calculate the payout split based on the worker's current stake tier.
5. Release the escrow: transfer USDG to the worker's wallet and the remainder to the protocol treasury.
6. Update the worker's reputation score and completed job count in `worker_registry`.
7. Emit a `JobSettled` event for the Alchemy indexer.

### `staking`

Handles $HOODCOMPUTE staking for workers and passive stakers. $HOODCOMPUTE is an ERC-20 token on Robinhood Chain.

Lock options: 30 days, 90 days, and 180 days. Longer locks earn a higher reward rate multiplier (up to 1.5x at 180 days).

Workers with an active stake in `staking` are recognized by the `settlement` contract and receive the 85% payout rate instead of the base 98%.

Slashing is triggered by `settlement` when a valid dispute is confirmed. The slashed amount (5% of stake) is burned, not redistributed.

### `governance`

Manages on-chain voting for model curation, protocol fee parameters, and contract upgrades. Active post-beta. $HOODCOMPUTE holders vote proportionally to their staked balance.

---

## Payout distribution

When a job settles, the escrowed USDG is split as follows:

| Recipient | Unstaked worker | Staked worker |
|---|---|---|
| Worker wallet | 98% | 85% |
| Protocol treasury | 25% | 15% |

Workers qualify for the 85% rate if they have a minimum of 1,000 $HOODCOMPUTE staked in the `staking` contract at the time the settlement transaction executes.

The protocol treasury accumulates USDG. Weekly, the treasury contract:
- Uses 50% of accumulated fees to buy back $HOODCOMPUTE on Uniswap and burn the purchased tokens
- Distributes 50% to $HOODCOMPUTE stakers pro-rata by staked balance

Every buyback and burn is a public transaction on Robinhood Chain. The HoodCompute Explorer displays the full history.

---

## Dispute process

If you believe a worker submitted a proof that does not match the response you received, you can open a dispute within 60 seconds of receiving the final output token.

**Opening a dispute:**

Call the `dispute` function on the `settlement` contract with:
- The job ID
- Your locally computed SHA-256 hash of the received output stream

The contract compares your hash to the proof hash the worker submitted. If they differ, the job is flagged as `Disputed` and held in escrow pending arbitration.

**Beta arbitration:** The HoodCompute Safe multisig reviews disputes and issues a ruling. If the worker is found to have submitted a fraudulent proof, 5% of their staked $HOODCOMPUTE is slashed (burned), and the user's credits are refunded.

**Post-beta arbitration:** A DAO committee elected by $HOODCOMPUTE holders will handle disputes. The long-term direction is ZK proof-of-inference, which would make this fully trustless by making the proof self-verifying without a dispute window.

---

## Reading settlement data

Every settled job is a verifiable transaction on Robinhood Chain. You can inspect it using:

**Blockscout** at `robinhoodchain.blockscout.com`: search by transaction hash or the `job_escrow` contract address.

**Alchemy API**: query the `worker_registry` contract for a given worker address to get their full on-chain earnings history, job count, and reputation score.

**HoodCompute Explorer**: the network-level view at `hoodcompute.com/explorer` shows live job completions, worker leaderboards, treasury balance, and buyback history with links to every underlying transaction.

**API response headers**: every API call includes `x-hoodcompute-job-id` and `x-hoodcompute-tx-hash` headers so you can immediately verify the settlement transaction for any request you make.
