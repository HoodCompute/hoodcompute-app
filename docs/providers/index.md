---
layout: default
title: Providers
nav_order: 6
has_children: true
---

# Providers

Providers are the GPU operators who power the HoodCompute inference network. Every completed inference job results in an on-chain USDG payment to the provider's wallet. No invoicing, no payment terms, no intermediary.

Providing compute requires an Ethereum wallet (MetaMask, Rabby, or Robinhood Wallet). Everything else depends on which tier you want to join.

- [Browser Worker]({% link providers/browser-worker.md %}): join with a browser tab, no installation required
- [Native Worker]({% link providers/native-worker.md %}): higher earnings, larger models, `hoodcompute-node` daemon
- [Staking]({% link providers/staking.md %}): stake $HOODCOMPUTE to unlock the 85% payout rate and earn protocol fees
- [Reputation]({% link providers/reputation.md %}): how your on-chain reputation score is calculated and what it affects

---

## Provider tiers at a glance

| | Browser Worker | Native Worker (unstaked) | Native Worker (staked) |
|---|---|---|---|
| Setup | Open a browser tab | Install `hoodcompute-node` | Install + stake 1,000+ $HOODCOMPUTE |
| Models | 1B to 8B quantized | 8B to 70B+ | 8B to 70B+ |
| Payout rate | 98% | 98% | 85% |
| Minimum stake | None | None | 1,000 $HOODCOMPUTE |
| Routing priority | Standard | Standard | Elevated |
| Beta $HOODCOMPUTE multiplier | 2x | 2x | 2x |

Staked native workers receive the highest routing priority on the network and earn 85 cents of every dollar billed for their completed jobs.
