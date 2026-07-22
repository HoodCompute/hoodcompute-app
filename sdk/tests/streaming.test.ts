import { describe, it, expect } from "vitest"
import { ChatCompletionStream } from "../src/streaming"

const encoder = new TextEncoder()

/** Build a fake SSE Response from a list of raw byte-string frames. */
function sseResponse(frames: string[], headers: Record<string, string> = {}): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(frame))
      controller.close()
    },
  })
  return new Response(stream, { headers })
}

function contentChunk(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`
}

describe("ChatCompletionStream", () => {
  it("yields each chunk in order", async () => {
    const stream = new ChatCompletionStream(
      sseResponse([contentChunk("Hel"), contentChunk("lo"), "data: [DONE]\n\n"]),
    )
    const contents: string[] = []
    for await (const chunk of stream) {
      contents.push(chunk.choices[0]?.delta?.content ?? "")
    }
    expect(contents).toEqual(["Hel", "lo"])
  })

  it("collects the full text through the convenience helper", async () => {
    const stream = new ChatCompletionStream(
      sseResponse([contentChunk("Hello, "), contentChunk("world"), "data: [DONE]\n\n"]),
    )
    expect(await stream.text()).toBe("Hello, world")
  })

  it("stops at the [DONE] terminator and ignores trailing frames", async () => {
    const stream = new ChatCompletionStream(
      sseResponse([contentChunk("a"), "data: [DONE]\n\n", contentChunk("b")]),
    )
    expect(await stream.text()).toBe("a")
  })

  it("skips comments and blank lines", async () => {
    const stream = new ChatCompletionStream(
      sseResponse([": keep-alive\n\n", contentChunk("x"), "data: [DONE]\n\n"]),
    )
    expect(await stream.text()).toBe("x")
  })

  it("reassembles an event split across network chunks", async () => {
    const full = contentChunk("split")
    const mid = Math.floor(full.length / 2)
    const stream = new ChatCompletionStream(
      sseResponse([full.slice(0, mid), full.slice(mid), "data: [DONE]\n\n"]),
    )
    expect(await stream.text()).toBe("split")
  })

  it("flushes a trailing event with no terminating blank line", async () => {
    const trailing = `data: ${JSON.stringify({ choices: [{ delta: { content: "end" } }] })}`
    const stream = new ChatCompletionStream(sseResponse([trailing]))
    expect(await stream.text()).toBe("end")
  })

  it("reads job id and settlement receipt from the response headers", async () => {
    const stream = new ChatCompletionStream(
      sseResponse(["data: [DONE]\n\n"], {
        "x-hoodcompute-job-id": "job_42",
        "x-hoodcompute-settlement-tx": "0xsettle",
        "x-hoodcompute-tx-hash": "0xescrow",
        "x-hoodcompute-worker": "0xworker",
        "x-hoodcompute-credits-remaining": "980",
      }),
    )
    expect(stream.jobId).toBe("job_42")
    expect(stream.receipt).toEqual({
      jobId: "job_42",
      settlementTx: "0xsettle",
      escrowTx: "0xescrow",
      workerAddress: "0xworker",
      creditsRemaining: 980,
    })
  })

  it("throws a connection error when the response has no body", async () => {
    const stream = new ChatCompletionStream(new Response(null))
    await expect(stream.text()).rejects.toThrow(/no body/i)
  })

  it("parses events separated by CRLF blank lines", async () => {
    const chunk = (content: string) =>
      `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\r\n\r\n`
    const stream = new ChatCompletionStream(
      sseResponse([chunk("Hel"), chunk("lo"), "data: [DONE]\r\n\r\n"]),
    )
    expect(await stream.text()).toBe("Hello")
  })

  it("cancels the underlying body when iteration exits early", async () => {
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(contentChunk("a")))
        controller.enqueue(encoder.encode(contentChunk("b")))
      },
      cancel() {
        cancelled = true
      },
    })
    const stream = new ChatCompletionStream(new Response(body))

    for await (const chunk of stream) {
      expect(chunk.choices[0]?.delta?.content).toBe("a")
      break
    }
    expect(cancelled).toBe(true)
  })
})
