/**
 * @hoodcompute/sdk
 *
 * Typed access to the HoodCompute decentralized AI inference network.
 * OpenAI-compatible chat completions, streaming, and on-chain settlement
 * receipts on Robinhood Chain.
 *
 * @example
 * import { HoodComputeClient } from "@hoodcompute/sdk"
 *
 * const client = new HoodComputeClient({ apiKey: process.env.HOODCOMPUTE_API_KEY })
 *
 * const completion = await client.chat.completions.create({
 *   model: "qwen3-8b",
 *   messages: [{ role: "user", content: "What is WebGPU?" }],
 * })
 * console.log(completion.choices[0].message.content)
 * console.log("Settled on-chain:", completion.settlementTx)
 */

export { HoodComputeClient } from "./client.js"
export type { HoodComputeClientOptions } from "./client.js"

export { ChatCompletionStream } from "./streaming.js"
export type { StreamReceipt } from "./streaming.js"

export type { WaitForSettlementOptions } from "./resources/jobs.js"

export {
  verifyWebhookSignature,
  constructWebhookEvent,
} from "./webhooks.js"

export {
  DEFAULT_BASE_URL,
  ROBINHOOD_CHAIN_ID,
  BLOCKSCOUT_BASE_URL,
  SDK_VERSION,
  explorerTxUrl,
  explorerAddressUrl,
} from "./constants.js"

export {
  HoodComputeError,
  AuthenticationError,
  InsufficientCreditsError,
  InvalidRequestError,
  NotFoundError,
  RateLimitError,
  NoWorkersAvailableError,
  JobTimeoutError,
  ServerError,
  ConnectionError,
} from "./errors.js"

export type {
  // Chat
  ChatRole,
  ChatMessage,
  ChatCompletionCreateParams,
  ChatCompletion,
  ChatCompletionChoice,
  ChatCompletionChunk,
  ChatCompletionChunkChoice,
  ChatCompletionDelta,
  ChatCompletionDelta as Delta,
  Usage,
  // Jobs
  Job,
  JobStatus,
  JobOnChain,
  JobList,
  JobListParams,
  JobReceipt,
  DisputeResult,
  // Models
  Model,
  ModelList,
  ModelMeta,
  ModelTier,
  // Account
  Account,
} from "./types.js"

export type {
  WebhookEvent,
  WebhookEventType,
  JobCompletedEvent,
  CreditLowEvent,
  WorkerSlashedEvent,
  GenericWebhookEvent,
} from "./webhook-types.js"
