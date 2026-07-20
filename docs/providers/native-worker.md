---
layout: default
title: Native Worker
parent: Providers
nav_order: 2
---

# Native Worker

The native worker runs `hoodcompute-node`, a single-binary Rust daemon that manages GPU backends, model downloads, job queue handling, and on-chain settlement interactions.

Native workers support larger models, earn more per job, and with an active $HOODCOMPUTE stake receive 85% of each completed job's credit value.

---

## Requirements

| Requirement | Details |
|---|---|
| OS | Linux (recommended), macOS, Windows |
| GPU | NVIDIA (CUDA), Apple Silicon (Metal), or AMD (ROCm) |
| VRAM | 8GB minimum to host the smallest native-tier models |
| Ethereum wallet | Required for registration and receiving USDG payouts (MetaMask, Rabby, or Robinhood Wallet) |
| Disk | 50GB+ free for model storage (70B models require ~40GB) |
| Network | Stable connection; lower latency to users improves reputation |

---

## Installation

### Linux (CUDA)

```bash
curl -sSL https://install.hoodcompute.com | bash
```

The install script downloads the `hoodcompute-node` binary and the CUDA backend. It detects your NVIDIA driver version and selects the correct binary variant.

After installation, verify it works:

```bash
hoodcompute-node --version
# hoodcompute-node 0.1.0 (cuda-12.4)
```

### macOS (Apple Silicon)

```bash
curl -sSL https://install.hoodcompute.com/mac | bash
```

The macOS binary uses Metal via llama.cpp. M1, M2, M3, and M4 chips are all supported. Unified memory is used directly, so a 36GB M3 Max can serve 27B parameter models comfortably.

### Windows (CUDA)

Download the installer from `hoodcompute.com/downloads`. Run the `.exe` installer. The installer adds `hoodcompute-node` to your PATH and installs the CUDA backend.

### AMD (ROCm)

```bash
curl -sSL https://install.hoodcompute.com/rocm | bash
```

ROCm 5.6+ required. RDNA 2 (RX 6000 series) and later are supported.

---

## Setup

### Step 1: Register your worker

```bash
hoodcompute-node register --wallet <your-ethereum-wallet-address>
```

This command:
- Generates a keypair for your worker node (separate from your wallet)
- Submits a registration transaction to the `worker_registry` contract
- Signs the registration using your wallet

You will be prompted to approve the registration transaction from your wallet (via QR code or deeplink).

The worker keypair is stored at `~/.hoodcompute/worker.json`. Back this up. It is used to sign proof-of-completion submissions and is tied to your on-chain reputation.

### Step 2: Configure models

```bash
hoodcompute-node models list    # see available models
hoodcompute-node models add qwen3-8b
hoodcompute-node models add llama-3.3-70b
```

Model weights are downloaded from the HoodCompute model registry and stored in `~/.hoodcompute/models/`. Downloads are verified against SHA-256 checksums before the model is added to your serving list.

To see how much VRAM a model requires before downloading:

```bash
hoodcompute-node models info llama-3.3-70b
# Model: llama-3.3-70b
# Parameters: 70B
# Format: GGUF Q4_K_M
# VRAM required: 43GB
# Tier: Max
# Earnings per job: $0.300 (unstaked) / $0.340 (staked)
```

### Step 3: Stake $HOODCOMPUTE (optional but recommended)

Staking is not required to start earning, but it unlocks the 85% payout rate and elevates your routing priority. See the [Staking guide]({% link providers/staking.md %}) for the full staking flow.

### Step 4: Start the node

```bash
hoodcompute-node start
```

The node:
1. Loads your configured models into GPU memory
2. Announces your capabilities to the orchestrator mesh
3. Begins accepting jobs
4. Logs job completions and earnings to the terminal

To run as a background service on Linux:

```bash
hoodcompute-node install-service
systemctl enable hoodcompute-node
systemctl start hoodcompute-node
```

---

## Configuration

The configuration file is at `~/.hoodcompute/config.toml`.

```toml
[node]
wallet = "0x7c41f9b8d2a6e3054cf18a9b62d47e0c93f5a1b8"
worker_keypair = "~/.hoodcompute/worker.json"

[models]
# Models to load at startup
active = ["qwen3-8b", "mistral-7b"]

[gpu]
# Backend auto-detected from hardware. Override if needed.
# Options: cuda, metal, rocm
backend = "cuda"
# Maximum fraction of VRAM to allocate to hoodcompute-node
vram_limit = 0.85

[networking]
# Port the worker listens on for orchestrator connections
port = 8765
# Optional: set your public IP if auto-detection fails
# public_ip = "1.2.3.4"

[logging]
level = "info"
# Log to file in addition to stdout
file = "~/.hoodcompute/logs/node.log"
```

---

## Monitoring

The local dashboard is available at `http://localhost:3001` when the node is running. It shows:

- Active jobs and queue depth
- Earnings per hour and cumulative USDG
- GPU utilization and VRAM usage
- On-chain reputation score
- Per-model job counts and latency metrics

You can also query the node's status via its local API:

```bash
curl http://localhost:3001/status | jq
```

```json
{
  "status": "running",
  "wallet": "0x7c41f9b8d2a6e3054cf18a9b62d47e0c93f5a1b8",
  "active_models": ["qwen3-8b", "mistral-7b"],
  "jobs_completed_24h": 342,
  "usdg_earned_24h": 27.36,
  "reputation_score": 847,
  "stake_active": true,
  "payout_rate": "85%"
}
```

---

## Updating

```bash
hoodcompute-node update
```

The update command downloads the latest binary and replaces the current installation. If you are running as a service, the update command restarts the service automatically after the update.

Model weights do not need to be re-downloaded on updates unless a new model format version is released.

---

## Hardware recommendations

| GPU | VRAM | Recommended models | Estimated earnings / hour |
|---|---|---|---|
| RTX 3060 | 12GB | Qwen3 8B, Mistral 7B | $0.15 to $0.30 |
| RTX 3090 / 4090 | 24GB | Qwen3 8B, Mistral 7B, Llama 3.2 13B | $0.40 to $0.80 |
| 2x RTX 3090 (multi-GPU, Q1 2027) | 48GB | Llama 3.3 70B, DeepSeek R1 | $1.50 to $3.00 |
| M2 Max 38GPU | 32GB | Qwen3 8B, Llama 3.2 27B | $0.50 to $1.00 |
| M3 Ultra 76GPU | 128GB | Llama 3.3 70B, DeepSeek R1 | $1.50 to $3.00 |
| A100 80GB | 80GB | All models | $2.00 to $4.00 |

Earnings estimates assume sustained job throughput. Actual earnings depend on network demand, model availability, and your reputation score.

{: .note }
Multi-GPU support (pooling two or more cards per node) is on the Q1 2027 roadmap. The current release uses one GPU per node.
