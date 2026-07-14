/**
 * Streaming chat completion. Tokens print as they arrive; the settlement
 * receipt is read once the stream closes.
 *
 * Run with:  HOODCOMPUTE_API_KEY=hoodc_live_... npx tsx examples/streaming.ts
 */

import { HoodComputeClient, explorerTxUrl } from "@hoodcompute/sdk"

const client = new HoodComputeClient()

const stream = await client.chat.completions.create({
  model: "llama-3.3-70b",
  messages: [{ role: "user", content: "Write a haiku about distributed compute." }],
  stream: true,
})

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "")
}

console.log("\n")
if (stream.receipt.settlementTx) {
  console.log("Settled:", explorerTxUrl(stream.receipt.settlementTx))
}
console.log("Credits remaining:", stream.receipt.creditsRemaining)
