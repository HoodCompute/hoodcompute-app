---
layout: default
title: Credits
parent: Core Concepts
nav_order: 4
---

# Credits

Credits are the unit of account for inference jobs on HoodCompute. One credit equals exactly $0.01 USDG. You purchase them with USDG and spend them on inference requests.

Credits exist to separate the payment unit from the on-chain settlement unit. Rather than executing a USDG transfer on every keystroke of a conversation, credits let you fund a balance once and spend it across many jobs without a wallet approval prompt each time.

---

## Credit properties

| Property | Value |
|---|---|
| Value | 1 credit = $0.01 USDG |
| Purchased with | USDG (ERC-20) on Robinhood Chain |
| Transferable | No; credits are bound to the purchasing wallet |
| Expiry | Never |
| Minimum purchase | 100 credits ($1.00 USDG) |
| Refundable | Yes; unspent credits can be withdrawn as USDG at any time |

Credits are non-transferable by design. This prevents a secondary market for credits and keeps billing simple: one wallet, one balance.

---

## Buying credits

**From the web app:**
1. Connect your Ethereum wallet (MetaMask, Rabby, or Robinhood Wallet) at `hoodcompute.com/app`
2. Click "Add credits" in the top navigation bar
3. Enter an amount
4. Approve the USDG transaction from your wallet

The USDG transfer goes directly to the `job_escrow` contract, which records the balance against your wallet address. Gas for the deposit is sponsored by HoodCompute via ERC-4337, so you never need to hold ETH. The credit balance updates immediately after transaction confirmation, typically within a second at Robinhood Chain's ~100ms block times.

**From the API:**
Credits must be funded via the web app or a wallet payment QR. There is no API endpoint to initiate a credit purchase.

**Via payment QR:**
The credit purchase screen generates an EIP-681 payment QR code that you can scan from any compatible mobile wallet. The QR encodes the exact USDG amount and the `job_escrow` contract's deposit address.

---

## Pricing tiers

| Tier | Model range | Cost per request |
|---|---|---|
| Lite | 1B to 3B parameter models | 2 credits ($0.02) |
| Standard | 7B to 8B parameter models | 8 credits ($0.08) |
| Pro | 13B to 27B parameter models | 18 credits ($0.18) |
| Max | 70B+ parameter models | 40 credits ($0.40) |

Pricing is per request for completions up to approximately 500 output tokens. For longer completions, billing switches to a per-1,000-output-token rate:

| Tier | Per 1,000 output tokens |
|---|---|
| Lite | 1 credit ($0.01) |
| Standard | 4 credits ($0.04) |
| Pro | 9 credits ($0.09) |
| Max | 20 credits ($0.20) |

The credit cost for your request is locked in escrow before the job begins. If the job fails or times out, the locked credits are returned to your balance automatically.

---

## Checking your balance

**Dashboard:** Your credit balance is displayed in the top navigation bar of the web app at all times.

**API:** Make a `GET /v1/account` request with your API key. The response includes `credits_remaining` and `usdg_value`.

```json
{
  "wallet": "0x7c41f9b8d2a6e3054cf18a9b62d47e0c93f5a1b8",
  "credits_remaining": 1420,
  "usdg_value": 14.20,
  "last_topup_at": "2026-06-15T09:43:00Z"
}
```

**On-chain:** Your credit balance is stored in the `job_escrow` contract, keyed by your wallet address. You can query it directly using the Robinhood Chain JSON-RPC (`https://rpc.mainnet.chain.robinhood.com`) or view it on Blockscout at `robinhoodchain.blockscout.com`.

---

## Low balance alerts

You can configure a webhook to fire when your credit balance falls below a threshold. See the [Webhooks]({% link api-reference/webhooks.md %}) page for the `credit.low` event.

The web app also displays a warning banner when your balance drops below 100 credits.

---

## Withdrawing unused credits

If you want to withdraw your remaining credits as USDG:

1. Go to Settings in the web app
2. Click "Withdraw credits"
3. Enter the number of credits to withdraw (or withdraw all)
4. Approve the transaction from your wallet

The USDG is transferred from the `job_escrow` contract back to your wallet in the same transaction. There is no fee for withdrawals, and gas is sponsored via ERC-4337.

---

## Credits vs $HCOMPUTE

Credits and $HCOMPUTE are separate and serve different purposes.

| | Credits | $HCOMPUTE |
|---|---|---|
| Purpose | Pay for inference jobs | Stake, govern, earn protocol fees |
| Value | Fixed at $0.01 USDG | Market price |
| Earned by | Purchasing with USDG | Providing compute, staking |
| Spent on | Inference requests | Staking (locked, not spent) |
| On-chain | Balance in the `job_escrow` contract | ERC-20 token balance |

You do not need $HCOMPUTE to use HoodCompute as a user. You do not need credits to provide compute. They operate in parallel.
