import { describe, it, expect } from "vitest"
import {
  AuthenticationError,
  ConnectionError,
  HoodComputeError,
  InsufficientCreditsError,
  InvalidRequestError,
  JobTimeoutError,
  NoWorkersAvailableError,
  NotFoundError,
  RateLimitError,
  ServerError,
  errorFromResponse,
  isRetryable,
} from "../src/errors"

describe("errorFromResponse", () => {
  it("maps 400 and 422 to InvalidRequestError", () => {
    expect(errorFromResponse(400, undefined)).toBeInstanceOf(InvalidRequestError)
    expect(errorFromResponse(422, undefined)).toBeInstanceOf(InvalidRequestError)
  })

  it("maps 401 and 403 to AuthenticationError", () => {
    expect(errorFromResponse(401, undefined)).toBeInstanceOf(AuthenticationError)
    expect(errorFromResponse(403, undefined)).toBeInstanceOf(AuthenticationError)
  })

  it("maps 402 to InsufficientCreditsError", () => {
    expect(errorFromResponse(402, undefined)).toBeInstanceOf(InsufficientCreditsError)
  })

  it("maps 404, 429 and 5xx to their dedicated errors", () => {
    expect(errorFromResponse(404, undefined)).toBeInstanceOf(NotFoundError)
    expect(errorFromResponse(429, undefined)).toBeInstanceOf(RateLimitError)
    expect(errorFromResponse(500, undefined)).toBeInstanceOf(ServerError)
    expect(errorFromResponse(503, undefined)).toBeInstanceOf(NoWorkersAvailableError)
    expect(errorFromResponse(504, undefined)).toBeInstanceOf(JobTimeoutError)
  })

  it("prefers the body code over the status when they disagree", () => {
    const err = errorFromResponse(400, { code: "insufficient_credits", message: "no funds" })
    expect(err).toBeInstanceOf(InsufficientCreditsError)
    expect(err.message).toBe("no funds")
  })

  it("routes no_workers_available regardless of the status", () => {
    const err = errorFromResponse(200, { code: "no_workers_available", message: "busy" })
    expect(err).toBeInstanceOf(NoWorkersAvailableError)
  })

  it("carries status, code, requestId and details onto the error", () => {
    const err = errorFromResponse(
      429,
      { code: "rate_limited", type: "rate_limit", param: "model", details: { retry_after: 12 } },
      "req_abc123",
    )
    expect(err.status).toBe(429)
    expect(err.code).toBe("rate_limited")
    expect(err.type).toBe("rate_limit")
    expect(err.param).toBe("model")
    expect(err.details).toEqual({ retry_after: 12 })
    expect(err.requestId).toBe("req_abc123")
  })

  it("falls back to a generic message when the body has none", () => {
    const err = errorFromResponse(418, undefined)
    expect(err).toBeInstanceOf(HoodComputeError)
    expect(err.message).toContain("418")
  })

  it("exposes retryAfter on NoWorkersAvailableError when present", () => {
    const err = errorFromResponse(503, {
      code: "no_workers_available",
      details: { retry_after: 30 },
    }) as NoWorkersAvailableError
    expect(err.retryAfter).toBe(30)
  })
})

describe("isRetryable", () => {
  it("treats connection errors as retryable", () => {
    expect(isRetryable(new ConnectionError("offline"))).toBe(true)
  })

  it("treats 5xx and 429 as retryable", () => {
    expect(isRetryable(errorFromResponse(500, undefined))).toBe(true)
    expect(isRetryable(errorFromResponse(503, undefined))).toBe(true)
    expect(isRetryable(errorFromResponse(429, undefined))).toBe(true)
  })

  it("does not retry 4xx client errors other than 429", () => {
    expect(isRetryable(errorFromResponse(400, undefined))).toBe(false)
    expect(isRetryable(errorFromResponse(401, undefined))).toBe(false)
    expect(isRetryable(errorFromResponse(404, undefined))).toBe(false)
  })

  it("does not retry unknown, non SDK errors", () => {
    expect(isRetryable(new Error("boom"))).toBe(false)
    expect(isRetryable("nope")).toBe(false)
  })
})
