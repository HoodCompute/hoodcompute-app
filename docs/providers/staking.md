---
layout: default
title: Staking
parent: Providers
nav_order: 3
---

# Staking

Staking $HCOMPUTE (an ERC-20 token on Robinhood Chain) serves two purposes. For providers, it unlocks the 85% payout rate and elevated routing priority. For any $HCOMPUTE holder, it earns a share of the weekly protocol fee distribution in USDG.

---

## Provider staking

Providers who stake a minimum of 1,000 $HCOMPUTE in the `staking` contract receive 85% of each completed job's credit value. Unstaked providers receive 98%.

| Parameter | Value |
|---|---|
| Minimum stake to qualify | 1,000 $HCOMPUTE |
| Unstaked payout rate | 98% of job value |
| Staked payout rate | 85% of job value |
| Earnings increase | ~13.3% more USDG per completed job |
| Routing priority boost | Staked workers are ranked higher in the routing algorithm |

At the Standard tier (8 credits per request = $0.08), the difference per job is $0.060 unstaked versus $0.068 staked. At any meaningful volume, this adds up quickly.

### Staking as a native worker

1. Make sure `hoodcompute-node` is installed and your worker is registered. See the [Native Worker guide]({% link providers/native-worker.md %}).
2. Go to `hoodcompute.com/app`, navigate to the Earn tab, and click "Stake $HCOMPUTE."
3. Choose an amount (minimum 1,000 $HCOMPUTE) and a lock period.
4. Approve the staking transaction from your wallet. Gas is sponsored by HoodCompute via ERC-4337, so you do not need ETH to stake.

The `staking` contract registers your stake and links it to your registered worker address. The `settlement` contract reads this during payout calculation and applies the 85% rate immediately for jobs completed after the stake confirms.

---

## Lock periods

You choose how long to lock your $HCOMPUTE stake. The lock period affects your $HCOMPUTE reward multiplier, not your USDG per-job payout rate. The 85% rate applies regardless of lock period.

| Lock period | $HCOMPUTE reward multiplier |
|---|---|
| 30 days | 1.0x |
| 90 days | 1.25x |
| 180 days | 1.5x |

$HCOMPUTE rewards accumulate from the Community/Provider rewards pool (40% of total supply over 4 years). A 180-day lock earns 50% more $HCOMPUTE per completed job compared to a 30-day lock, while USDG payout stays at 85% for both.

Once a lock period begins, you cannot withdraw the staked $HCOMPUTE until it expires. USDG earnings from completed jobs are always immediately available regardless of lock status.

---

## Passive staking

You do not need to run a worker node to stake $HCOMPUTE and earn protocol fees.

Any wallet holding $HCOMPUTE can stake and receive a share of the weekly USDG distribution from the protocol treasury. This distribution comes from 50% of the protocol's weekly fee revenue, split pro-rata among all stakers by staked balance.

**To stake passively:**
1. Go to `hoodcompute.com/app` and connect your wallet.
2. Navigate to the Staking tab.
3. Choose an amount and lock period.
4. Approve the transaction.

Weekly USDG distributions are sent to your wallet automatically every Monday at approximately 00:00 UTC. Each distribution is a public transaction on Robinhood Chain, visible on Blockscout.

---

## Slashing

Providers who submit fraudulent proofs of completion and are confirmed dishonest through the dispute process face slashing.

| Event | Consequence |
|---|---|
| Confirmed fraudulent proof | 5% of staked $HCOMPUTE burned |
| Burned to | Protocol burn address (permanent) |
| Effect on payout rate | Drops to 98% if balance falls below 1,000 $HCOMPUTE |

Slashing is designed to be proportionate but meaningful. A provider staking 10,000 $HCOMPUTE who is caught submitting a fraudulent proof loses 500 $HCOMPUTE permanently. This creates a financial disincentive that scales with the stake.

Slashing only applies to confirmed disputes. A failed job or a rerouted job does not trigger slashing.

---

## Unstaking

When your lock period expires, you can withdraw your staked $HCOMPUTE at any time.

1. Go to the Staking tab in the app.
2. Click "Unstake" next to the expired stake.
3. Approve the transaction.

The $HCOMPUTE is returned to your wallet in the same transaction. There is no cooldown period after the lock expires.

If you have multiple stakes with different lock periods, you can unstake them independently as each one expires.

---

## Viewing your stake on-chain

Your stake is stored in the `staking` contract, keyed by your wallet address. You can read it directly over the Robinhood Chain JSON-RPC, for example with Foundry's `cast`:

```bash
# Query the staking contract for your stake balance
cast call $(hoodcompute-node stake-contract) \
  "stakeOf(address)(uint256)" YOUR_WALLET_ADDRESS \
  --rpc-url https://rpc.mainnet.chain.robinhood.com
```

Or through the HoodCompute Explorer by searching your wallet address, or on Blockscout at `robinhoodchain.blockscout.com`. Your full stake history, lock periods, expiry dates, and accrued rewards are visible without logging in.
