import { afterEach, describe, expect, it, vi } from "vitest"
import { Jobs } from "../src/resources/jobs"
import { JobTimeoutError } from "../src/errors"
import type { HttpClient } from "../src/http"

function rawJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job_1",
    object: "job",
    status: "settled",
    model: "qwen3-8b",
    tier: "standard",
    credits_charged: 4,
    usdg_value: 0.04,
    worker_address: "0xworker",
    created_at: "2026-07-22T00:00:00Z",
    completed_at: "2026-07-22T00:00:05Z",
    on_chain: {
      escrow_tx: "0xescrow",
      settlement_tx: "0xsettle",
      escrow_address: "0xvault",
      block_number: 100,
      proof_hash: "0xproof",
    },
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    ...overrides,
  }
}

/** Stub HttpClient that replays canned bodies in order. */
function makeJobs(bodies: unknown[]) {
  const request = vi.fn(async () => {
    const data = bodies.shift()
    if (data === undefined) throw new Error("no more canned responses")
    return { data, response: new Response() }
  })
  return { jobs: new Jobs({ request } as unknown as HttpClient), request }
}

afterEach(() => {
  vi.useRealTimers()
})

describe("Jobs.iterate", () => {
  it("follows cursor pagination across pages", async () => {
    const { jobs, request } = makeJobs([
      {
        object: "list",
        data: [rawJob({ id: "job_3" }), rawJob({ id: "job_2" })],
        has_more: true,
        next_cursor: "job_2",
      },
      {
        object: "list",
        data: [rawJob({ id: "job_1" })],
        has_more: false,
        next_cursor: null,
      },
    ])

    const ids: string[] = []
    for await (const job of jobs.iterate()) ids.push(job.id)

    expect(ids).toEqual(["job_3", "job_2", "job_1"])
    expect(request).toHaveBeenCalledTimes(2)
    const secondCall = request.mock.calls[1]?.[0] as { query: { before?: string } }
    expect(secondCall.query.before).toBe("job_2")
  })

  it("stops fetching when iteration exits early", async () => {
    const { jobs, request } = makeJobs([
      {
        object: "list",
        data: [rawJob({ id: "job_2" })],
        has_more: true,
        next_cursor: "job_2",
      },
    ])

    for await (const job of jobs.iterate()) {
      expect(job.id).toBe("job_2")
      break
    }
    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe("Jobs.waitForSettlement", () => {
  it("polls until the job reaches a terminal status", async () => {
    vi.useFakeTimers()
    const { jobs, request } = makeJobs([
      rawJob({ status: "processing", on_chain: null }),
      rawJob({ status: "settling", on_chain: null }),
      rawJob({ status: "settled" }),
    ])

    const pending = jobs.waitForSettlement("job_1", { pollIntervalMs: 100 })
    await vi.runAllTimersAsync()
    const job = await pending

    expect(job.status).toBe("settled")
    expect(job.onChain?.settlementTx).toBe("0xsettle")
    expect(request).toHaveBeenCalledTimes(3)
  })

  it("throws JobTimeoutError when the deadline passes first", async () => {
    vi.useFakeTimers()
    const { jobs } = makeJobs(
      Array.from({ length: 10 }, () => rawJob({ status: "processing", on_chain: null })),
    )

    const pending = jobs.waitForSettlement("job_1", {
      pollIntervalMs: 100,
      timeoutMs: 250,
    })
    const assertion = expect(pending).rejects.toBeInstanceOf(JobTimeoutError)
    await vi.runAllTimersAsync()
    await assertion
  })
})

describe("Jobs.getReceipt", () => {
  it("throws a receipt_not_ready error before settlement", async () => {
    const { jobs } = makeJobs([rawJob({ status: "processing", on_chain: null })])
    await expect(jobs.getReceipt("job_1")).rejects.toMatchObject({
      code: "receipt_not_ready",
    })
  })
})
