import { describe, it, expect } from "vitest"
import {
  BLOCKSCOUT_BASE_URL,
  DEFAULT_BASE_URL,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
  ROBINHOOD_CHAIN_ID,
  SDK_VERSION,
  explorerAddressUrl,
  explorerTxUrl,
} from "../src/constants"

describe("network defaults", () => {
  it("points at the versioned production API", () => {
    expect(DEFAULT_BASE_URL).toBe("https://api.hoodcompute.com/v1")
  })

  it("uses the Robinhood Chain mainnet id", () => {
    expect(ROBINHOOD_CHAIN_ID).toBe(4663)
  })

  it("keeps sensible timeout and retry defaults", () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(120_000)
    expect(DEFAULT_MAX_RETRIES).toBe(2)
  })

  it("exposes a semver looking version string", () => {
    expect(SDK_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

describe("explorer helpers", () => {
  it("builds a transaction link from a hash", () => {
    const hash = "0xabc123"
    expect(explorerTxUrl(hash)).toBe(`${BLOCKSCOUT_BASE_URL}/tx/${hash}`)
  })

  it("builds an address link", () => {
    const address = "0xdeadbeef"
    expect(explorerAddressUrl(address)).toBe(`${BLOCKSCOUT_BASE_URL}/address/${address}`)
  })
})
