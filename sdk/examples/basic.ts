/**
 * Non-streaming chat completion with an on-chain settlement receipt.
 *
 * Run with:  HOODCOMPUTE_API_KEY=hoodc_live_... npx tsx examples/basic.ts
 */

import { HoodComputeClient, explorerTxUrl } from "@hoodcompute/sdk"

const client = new HoodComputeClient()

const completion = await client.chat.completions.create({
  model: "qwen3-8b",
  messages: [{ role: "user", content: "Explain optimistic rollups in two sentences." }],
})

console.log(completion.choices[0]?.message.content)
console.log("\nJob:", completion.jobId)

if (completion.settlementTx) {
  console.log("Settled on-chain:", explorerTxUrl(completion.settlementTx))
}
