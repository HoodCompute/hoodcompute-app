/**
 * Jobs. Retrieve job status, fetch on-chain receipts, and open disputes.
 */

import type { HttpClient } from "../http.js"
import type {
  DisputeResult,
  Job,
  JobList,
  JobListParams,
  JobReceipt,
  JobStatus,
  ModelTier,
  Usage,
} from "../types.js"
import { ConnectionError, JobTimeoutError, NotFoundError } from "../errors.js"

/** Statuses after which a job will no longer change. */
const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set([
  "settled",
  "failed",
  "refunded",
])

export interface WaitForSettlementOptions {
  /** Milliseconds between polls. Defaults to 2000. */
  pollIntervalMs?: number
  /** Give up after this many milliseconds. Defaults to 120000. */
  timeoutMs?: number
  signal?: AbortSignal
}

interface RawJob {
  id: string
  object: "job"
  status: JobStatus
  model: string
  tier: ModelTier
  credits_charged: number
  usdg_value: number
  worker_address: string
  created_at: string
  completed_at: string | null
  on_chain: {
    escrow_tx: string
    settlement_tx: string
    escrow_address: string
    block_number: number
    proof_hash: string
  } | null
  usage: Usage | null
}

function normalize(raw: RawJob): Job {
  return {
    id: raw.id,
    object: raw.object,
    status: raw.status,
    model: raw.model,
    tier: raw.tier,
    creditsCharged: raw.credits_charged,
    usdgValue: raw.usdg_value,
    workerAddress: raw.worker_address,
    createdAt: raw.created_at,
    completedAt: raw.completed_at,
    onChain: raw.on_chain
      ? {
          escrowTx: raw.on_chain.escrow_tx,
          settlementTx: raw.on_chain.settlement_tx,
          escrowAddress: raw.on_chain.escrow_address,
          blockNumber: raw.on_chain.block_number,
          proofHash: raw.on_chain.proof_hash,
        }
      : null,
    usage: raw.usage,
  }
}

export class Jobs {
  constructor(private readonly http: HttpClient) {}

  /** Retrieve a job by ID, including its on-chain settlement detail. */
  async get(jobId: string, options: { signal?: AbortSignal } = {}): Promise<Job> {
    const { data } = await this.http.request<RawJob>({
      path: `/jobs/${encodeURIComponent(jobId)}`,
      signal: options.signal,
    })
    return normalize(data)
  }

  /** List jobs for the authenticated key, most recent first. */
  async list(params: JobListParams = {}, options: { signal?: AbortSignal } = {}): Promise<JobList> {
    const { data } = await this.http.request<{
      object: "list"
      data: RawJob[]
      has_more: boolean
      next_cursor: string | null
    }>({
      path: "/jobs",
      query: {
        limit: params.limit,
        before: params.before,
        after: params.after,
        status: params.status,
        model: params.model,
      },
      signal: options.signal,
    })
    return {
      object: "list",
      data: data.data.map(normalize),
      hasMore: data.has_more,
      nextCursor: data.next_cursor,
    }
  }

  /**
   * List every job matching the filters, transparently following cursor
   * pagination. Stop iterating early to stop fetching pages.
   *
   * @example
   * for await (const job of client.jobs.iterate({ status: "settled" })) {
   *   console.log(job.id, job.creditsCharged)
   * }
   */
  async *iterate(
    params: Omit<JobListParams, "before" | "after"> = {},
    options: { signal?: AbortSignal } = {},
  ): AsyncGenerator<Job, void, undefined> {
    let cursor: string | undefined
    while (true) {
      const page = await this.list({ ...params, before: cursor }, options)
      yield* page.data
      if (!page.hasMore || page.nextCursor === null) return
      cursor = page.nextCursor
    }
  }

  /**
   * Poll a job until it reaches a terminal status (`settled`, `failed`, or
   * `refunded`) and return the final record. Throws {@link JobTimeoutError}
   * when the deadline passes first.
   */
  async waitForSettlement(
    jobId: string,
    options: WaitForSettlementOptions = {},
  ): Promise<Job> {
    const pollIntervalMs = options.pollIntervalMs ?? 2_000
    const timeoutMs = options.timeoutMs ?? 120_000
    const deadline = Date.now() + timeoutMs

    while (true) {
      const job = await this.get(jobId, { signal: options.signal })
      if (TERMINAL_STATUSES.has(job.status)) return job

      if (Date.now() + pollIntervalMs > deadline) {
        throw new JobTimeoutError(
          `Job ${jobId} still has status "${job.status}" after ${timeoutMs}ms.`,
          { code: "settlement_wait_timeout" },
        )
      }
      await sleep(pollIntervalMs)
      if (options.signal?.aborted) {
        throw new ConnectionError("Request aborted by caller.")
      }
    }
  }

  /**
   * Fetch the on-chain receipt for a settled job. Throws if the job exists but
   * has not settled yet.
   */
  async getReceipt(jobId: string, options: { signal?: AbortSignal } = {}): Promise<JobReceipt> {
    const job = await this.get(jobId, options)
    if (!job.onChain) {
      throw new NotFoundError(
        `Job ${jobId} has status "${job.status}" and no on-chain receipt yet.`,
        { code: "receipt_not_ready" },
      )
    }
    return {
      jobId: job.id,
      model: job.model,
      tier: job.tier,
      creditsCharged: job.creditsCharged,
      usdgValue: job.usdgValue,
      workerAddress: job.workerAddress,
      escrowTx: job.onChain.escrowTx,
      settlementTx: job.onChain.settlementTx,
      blockNumber: job.onChain.blockNumber,
      proofHash: job.onChain.proofHash,
    }
  }

  /**
   * Open a dispute on a completed job. Must be called within 60 seconds of
   * receiving the final output token.
   *
   * @param receivedOutputHash SHA-256 of the full response text you received,
   *   formatted as `sha256:<hex>`.
   */
  async dispute(
    jobId: string,
    receivedOutputHash: string,
    options: { signal?: AbortSignal } = {},
  ): Promise<DisputeResult> {
    const { data } = await this.http.request<{
      job_id: string
      dispute_opened: boolean
      your_hash: string
      worker_hash: string
      dispute_tx?: string | null
      arbitration_window_hours?: number | null
    }>({
      method: "POST",
      path: `/jobs/${encodeURIComponent(jobId)}/dispute`,
      body: { received_output_hash: receivedOutputHash },
      signal: options.signal,
    })
    return {
      jobId: data.job_id,
      disputeOpened: data.dispute_opened,
      yourHash: data.your_hash,
      workerHash: data.worker_hash,
      disputeTx: data.dispute_tx ?? null,
      arbitrationWindowHours: data.arbitration_window_hours ?? null,
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
