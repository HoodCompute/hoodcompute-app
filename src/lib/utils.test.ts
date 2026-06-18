import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("ignores falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b")
  })

  it("supports the conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active")
  })

  it("lets a later Tailwind utility win over an earlier conflicting one", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
  })

  it("resolves conflicts inside array inputs", () => {
    expect(cn(["text-sm", "text-lg"])).toBe("text-lg")
  })

  it("returns an empty string when given nothing", () => {
    expect(cn()).toBe("")
  })
})
