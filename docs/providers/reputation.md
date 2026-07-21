---
layout: default
title: Reputation
parent: Providers
nav_order: 4
---

# Reputation

Every registered worker on HoodCompute has an on-chain reputation score from 0 to 1000. The score is calculated from your historical performance across four signals and updated after every settled job.

Higher reputation means higher priority in the routing algorithm, which translates to more jobs and more earnings.

---

## Score components

| Signal | Weight | Description |
|---|---|---|
| Job completion rate | 35% | Percentage of routed jobs that produced a valid, settled proof |
| Response latency | 30% | Combined p50 and p95 of time-to-first-token, relative to other workers hosting the same model |
| Proof verification pass rate | 25% | Percentage of submitted proofs that passed on-chain verification without dispute |
| Uptime (trailing 30 days) | 10% | Proportion of time your worker was online and responding to orchestrator health checks |

The score is a rolling weighted average. Recent jobs have more influence than older ones. A poor period can be recovered from.

---

## How the score is calculated

After every settled job, the `settlement` contract calls an update on your `worker_registry` entry with the performance metrics for that job. The registry stores the raw metric counters and recomputes the score using an exponential moving average with a 30-day half-life.

This means:

- A fresh worker builds reputation quickly from a clean slate.
- A worker recovering from a bad period sees their score improve within days once performance normalizes.
- A long-running worker with consistently good performance maintains a high score even if they have occasional slow jobs.

---

## Impact on routing priority

The orchestrator routing algorithm uses your reputation score as one of four factors when selecting a worker for a job. The others are model availability, stake weight, and estimated latency.

In practice, reputation is the primary differentiator between workers who have been on the network for a while. Two workers hosting the same model at similar latency are ranked by reputation first, then by stake weight.

| Score range | Routing priority |
|---|---|
| 900 to 1000 | Highest priority, first in queue for most jobs |
| 700 to 899 | High priority, competitive with other experienced workers |
| 500 to 699 | Standard priority |
| 300 to 499 | Below standard, may receive fewer jobs during high demand |
| 0 to 299 | Low priority, rarely routed to during competition |

New workers start at 500 and build from there.

---

## Improving your score

**Completion rate (35% weight)**

Do not go offline in the middle of a job. If you need to stop your node, use `hoodcompute-node stop` gracefully. This signals the orchestrator that you are going offline before jobs are routed to you, preventing failed completions.

Avoid selecting models that push your GPU to its VRAM limit. Jobs that cause OOM errors result in incomplete completions and hurt your completion rate.

**Latency (30% weight)**

Latency is measured relative to other workers hosting the same model, not on an absolute scale. You are always competing with peers on the same model tier.

Steps that improve latency:
- Use a machine with fast NVMe storage for model loading
- Avoid running other GPU-intensive processes alongside the node
- Ensure your CPU is not the bottleneck on tokenization (native workers that are GPU-bottlenecked are in the best position)
- For Mac workers on Apple Silicon, keeping the model in unified memory with no swap is important

**Proof verification pass rate (25% weight)**

This score is 1.0 for most workers and drops only if you have disputes opened against you and confirmed. Running honest inference keeps this at maximum.

**Uptime (10% weight)**

Keep your node running consistently. A node that goes offline frequently for short periods gets a worse uptime score than one that takes occasional planned maintenance windows. If you plan to be offline for an extended period, stop the node cleanly rather than letting it drop.

---

## Viewing your reputation score

**Dashboard:** Your score is shown on the Earn tab in the web app.

**On-chain:** Your `worker_registry` entry holds your current score and the raw counters it is derived from. Query it by your registered worker address using the Robinhood Chain JSON-RPC (`https://rpc.mainnet.chain.robinhood.com`) or on Blockscout.

**HoodCompute Explorer:** The worker leaderboard at `hoodcompute.com/explorer` shows all registered workers ranked by reputation, with their stake, completed job count, and 30-day earnings visible.

**CLI:**

```bash
hoodcompute-node status
# ...
# Reputation score: 847 / 1000
# Completion rate (30d): 99.1%
# Median first-token latency (30d): 1.3s
# Proof pass rate (all time): 100%
# Uptime (30d): 98.4%
```

---

## Reputation and slashing

Reputation is separate from the staking slash mechanic. A successful dispute against you triggers two independent consequences:

1. Your proof verification pass rate drops, which lowers your reputation score.
2. If you are staked, 5% of your staked $HCOMPUTE is burned.

Reputation is earned through sustained performance. It cannot be purchased, transferred, or gamed by stake alone.
