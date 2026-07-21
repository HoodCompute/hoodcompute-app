# HoodCompute contracts

The on-chain half of HoodCompute. This is the settlement layer for a decentralized GPU inference network: workers register and stake, clients prepay for inference in USDG, jobs get routed and claimed, and proofs get settled with an escrowed payout. Everything here targets Robinhood Chain and is built with Foundry.

If you just want to read the code, start with [`src/`](src). If you want to deploy or poke at the live testnet contracts, skip to [Deploying](#deploying) and [Deployed addresses](#deployed-addresses).

## How it fits together

There are nine contracts plus a test USDG stand-in. They are deployed together and wired to each other in a single transaction by the deploy script, so no contract trusts an address that was set after the fact.

The rough flow of a job:

1. A worker registers in `WorkerRegistry` and stakes $HCOMPUTE in `Staking`, then links the stake to the worker node. Linked stake is what gets slashed for bad behavior.
2. A client deposits USDG into `JobEscrow` and gets prepaid credits back. Locking a job moves the tier's credit price into escrow.
3. `JobRouter` publishes the locked job. A qualified worker claims it.
4. The worker submits a proof to `Settlement`. The payout is released immediately (worker share now, treasury share held in escrow), and a short dispute window opens.
5. If the client disputes and the arbitrator rules the worker was dishonest, `Settlement` tells `Staking` to slash the linked stake and `WorkerRegistry` to drop the worker's reputation.

`Governance` and `RewardDistributor` sit alongside this loop. Governance runs weighted-stake voting over protocol parameters, and RewardDistributor pays USDG to stakers epoch by epoch. `ModelRegistry` is an owner-curated catalog of which models the network serves and the hardware tier each one needs.

## Contracts

| Contract | What it does |
|---|---|
| `HoodComputeToken` | $HCOMPUTE, the staking and governance token. Fixed supply of 1B, minted once at deployment. No inflation. |
| `WorkerRegistry` | Tracks GPU workers, the tiers they support, and a reputation score kept as an EMA of job outcomes. |
| `Staking` | Locks $HCOMPUTE for 30, 90, or 180 days at 1.0x / 1.25x / 1.5x weight. Handles worker linking and slashing. |
| `JobEscrow` | Holds USDG as prepaid credits and escrows them per job. 1 credit is $0.01. Treasury share of each job accrues here. |
| `JobRouter` | On-chain job board. Clients post after locking escrow, workers atomically claim jobs they are qualified for. |
| `Settlement` | Verifies proofs, releases escrow, runs the dispute window, and drives slashing on a dishonest verdict. |
| `Governance` | Weighted-stake proposals with a quorum, an approval threshold, and a timelock before execution. |
| `RewardDistributor` | USDG reward epochs. The owner opens an epoch with a stake snapshot, stakers claim pro rata. |
| `ModelRegistry` | Owner-curated list of served models and the minimum hardware tier each requires. |
| `MockUSDG` | Test-only, freely mintable USDG (6 decimals). Testnet uses this in place of real USDG. |

Interfaces the contracts share live in [`src/interfaces/`](src/interfaces).

## Layout

```
contracts/
  src/                Contracts and their interfaces
  script/             Foundry deploy, seed, and demo-traffic scripts
  scripts/            Bash wrappers and keeper crons
  tests/              Forge test suite (167 tests) and MockUSDG
  foundry.toml        Solc 0.8.30, optimizer on, RPC endpoints
```

## Build and test

You need Foundry. If you do not have it:

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
```

Then:

```bash
forge build
forge test
```

To run the suite against live testnet state instead of a fresh EVM:

```bash
forge test --fork-url https://rpc.testnet.chain.robinhood.com
```

## Deploying

`script/Deploy.s.sol` deploys the whole suite and wires every cross-contract authority in one broadcast. On testnet it also deploys a fresh MockUSDG and a fresh $HCOMPUTE token unless you point it at existing ones.

The easy path is the wrapper, which checks the chain ID and your balance first:

```bash
export DEPLOYER_KEY=0x...        # a funded testnet key
./scripts/deploy.sh              # add --dry-run to simulate only
```

Or call Forge directly:

```bash
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.testnet.chain.robinhood.com \
  --private-key "$DEPLOYER_KEY" \
  --broadcast
```

Robinhood Chain is an Arbitrum-style L2 and gas estimation can come in low. If a script halts on an out-of-gas revert, re-run it with a larger multiplier, for example `-g 300`.

Optional env vars for Deploy:

- `USDG_ADDRESS` reuse an existing USDG instead of deploying MockUSDG. Required on mainnet.
- `HOODCOMPUTE_ADDRESS` reuse an existing $HCOMPUTE token instead of minting a new one.

After deploying, record the printed addresses in the table below.

## Deployed addresses

Robinhood Chain testnet, chain ID 46630. RPC `https://rpc.testnet.chain.robinhood.com`, explorer `https://explorer.testnet.chain.robinhood.com`.

| Contract | Address |
|---|---|
| HoodComputeToken | `0x192FE24d1650B7E507096abedA64F591b3c8277a` |
| WorkerRegistry | `0xd281e728E7a5F7Fd7FfB92D8aA727730dDb316dB` |
| Staking | `0x792483c381006bbF7fC75221B518cE862cF727d0` |
| JobEscrow | `0xd131A27987866ED7dDCdf4A81D33F1790Be0a222` |
| Settlement | `0x3D9B0ec18cF2a17f231b4261CBd362bf327A4C65` |
| Governance | `0x4F49B82589b0f5fC8564632082bA7dCeDd30678C` |
| JobRouter | `0xf8BbCcd8F6c829f2Df322e84Fc3DA3d6D0a8687F` |
| ModelRegistry | `0x41E666Ba8a13D7DfB46C7e6344521D94D794748A` |
| RewardDistributor | `0xB4aFc2ab2facabb60A14A0136EECcBB8FD978848` |
| MockUSDG (test only) | `0x37B0bE0E9fbe61cAe45F70F3feA9aED0215ab9Ca` |

## Scripts

Foundry scripts in [`script/`](script):

- `Deploy.s.sol` deploys and wires the full suite.
- `Seed.s.sol` seeds one worker, a few models, and a single settled job so a fresh deployment is not empty.
- `BatchTx.s.sol`, `BatchTx2.s.sol`, `BatchTx2b.s.sol` push demo traffic across every contract. Handy for populating the explorer or exercising the flows end to end.

Bash helpers in [`scripts/`](scripts):

- `deploy.sh` guarded wrapper around the deploy script.
- `airdrop_testnet.sh` prints your balance and faucet guidance.
- `distribute_rewards.sh` opens a reward epoch from the operator's USDG. Meant to run on a schedule.
- `refund_crank.sh` permissionless keeper that refunds any job past its 120s timeout that is still locked.

## Before mainnet

Two placeholder authorities need to be replaced first:

- `ARBITRATOR` in `src/Settlement.sol` should become the real dispute arbitrator, ideally a Safe multisig.
- `CRANK_OPERATOR` in `src/Staking.sol` should become the real reward crank operator.

Also set `USDG_ADDRESS` to the real USDG on deploy so the mintable MockUSDG never touches mainnet.
