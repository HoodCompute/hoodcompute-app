---
layout: default
title: Privacy Model
parent: Core Concepts
nav_order: 2
---

# Privacy Model

Privacy in HoodCompute is a protocol guarantee, not a product feature. The system is designed so that no single party, including HoodCompute itself, has access to the content of your prompts or responses.

This page explains exactly what is encrypted, what each party can and cannot see, and what the on-chain record contains.

---

## Prompt encryption

Every prompt is encrypted client-side before it leaves your browser or application.

**Encryption scheme:** AES-256-GCM with a one-time ephemeral session key.

**Key lifecycle:**
1. Your client generates a fresh ephemeral keypair for each job.
2. The public half of the ephemeral key is used to derive a shared secret with the selected worker's registered public key via ECDH.
3. The prompt is encrypted with this shared secret before being sent.
4. The encrypted payload is delivered to the worker through the orchestrator.
5. The worker decrypts the payload in memory using its private key and the ephemeral public key included in the payload envelope.
6. The ephemeral key is discarded after the job completes. It is never reused.

**What this means in practice:**

- The orchestrator sees only an opaque encrypted blob. It cannot read the prompt.
- HoodCompute's servers are not in the encryption path. HoodCompute cannot read your prompts.
- Workers decrypt only in memory, only for the duration of inference. No file is written.
- If a worker is compromised after a job completes, the session key is already gone.

---

## Response privacy

The response stream is encrypted during transit using the same session key as the prompt. Tokens flow from the worker through the orchestrator to your client, where they are decrypted and displayed.

No response content is stored anywhere. Workers do not write inference outputs to disk. Orchestrators relay the stream without buffering the content. The only trace is the SHA-256 hash of the output, which the worker signs and submits on-chain as the proof of completion. The hash does not reveal the content.

---

## What each party can see

| Party | What they see |
|---|---|
| HoodCompute (as an organization) | Nothing. No access to prompt or response content. |
| Orchestrator nodes | Encrypted payload (opaque bytes), job ID, model tier, source and destination routing metadata. No content. |
| Worker | Decrypted prompt and generated response, in memory only, for the duration of the job. |
| Other workers | Nothing. Jobs are not broadcast to the mesh, only to the selected worker. |
| Anyone with a block explorer | Job ID, model tier, credit amount, worker address, timestamp, proof hash. No content. |
| You | Your own prompts and responses. No one else's. |

---

## User anonymity

An Ethereum wallet address is the only identity HoodCompute requires. There is no email address, no phone number, no KYC at any stage during the beta.

Credits can be funded from any wallet, including a freshly generated one with no prior on-chain history. If you use a wallet that has no connection to your identity, HoodCompute has no way to associate your usage with you.

Workers see only the encrypted job payload. They do not see the requesting wallet address or any identifying metadata. The orchestrator routes the response back using the job ID, not the wallet address.

---

## What the on-chain record contains

The Robinhood Chain transaction record for each job contains:

| Field | Value |
|---|---|
| Job ID | A unique identifier for the job |
| Model tier | Lite / Standard / Pro / Max |
| Credits charged | The amount locked and released |
| Worker address | The Robinhood Chain address that received payment |
| Timestamp | The block number and approximate time |
| Proof hash | SHA-256 of the output stream |

The on-chain record does not contain:

- Prompt content (never)
- Response content (never)
- The requesting wallet address (not recorded on-chain)
- Any metadata about the user's identity

---

## No log retention

No component of the HoodCompute stack writes logs that contain prompt or response content.

- API servers log request metadata (model tier, job ID, timestamp, credit usage) for operational monitoring. Prompt and response content are never logged.
- Orchestrator nodes log routing events (job ID, worker selected, latency). No content.
- Workers log job completion events (job ID, duration, proof hash submitted). No content.
- There is no central store of inference history. Each job is ephemeral.

---

## Model neutrality

No model-level content filtering is applied by the HoodCompute protocol. All models available on the network are open-weight models that workers choose to host. The protocol does not inspect, score, or gate any prompt or response.

Workers choose which models they run. No worker is required to host any specific model. Model availability on the recommended list is governed by $HCOMPUTE holder votes on-chain, not by a content policy team.

---

## What HoodCompute does not guarantee

Privacy is very strong in this design, but there are limits worth understanding.

**The worker knows what you are asking.** The worker decrypts and processes your prompt. It sees the plaintext. The protocol minimizes this exposure (ephemeral keys, in-memory only, no logging requirement) but it is a trust assumption: you are trusting the worker not to log your content. Workers who log content and are caught doing so lose reputation and are eligible for slashing.

**The on-chain record is permanent.** The proof hash, model tier, credit amount, and timestamp are written to Robinhood Chain permanently. Anyone can see that a job of a given size and cost was completed at a given time. They cannot see what it was about.

**Browser environments have inherent limits.** If your browser is compromised by malware before the prompt is encrypted, HoodCompute cannot protect you. Client-side security is a precondition, not something the protocol can enforce.
