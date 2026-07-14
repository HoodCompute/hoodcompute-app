/**
 * Verify and handle HoodCompute webhooks in an Express server.
 *
 * The signature must be checked against the raw request body, so mount the
 * raw body parser on the webhook route before any JSON middleware.
 */

import express from "express"
import { constructWebhookEvent } from "@hoodcompute/sdk"

const app = express()
const secret = process.env.HOODCOMPUTE_WEBHOOK_SECRET ?? ""

app.post(
  "/hoodcompute-events",
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
      const event = constructWebhookEvent(
        req.body.toString(),
        req.header("HoodCompute-Signature"),
        secret,
      )

      switch (event.event) {
        case "job.completed":
          console.log("Job settled:", event.data.settlement_tx)
          break
        case "credit.low":
          console.log("Credits low:", event.data.credits_remaining)
          break
        default:
          console.log("Event:", event.event)
      }

      res.json({ received: true })
    } catch {
      res.status(400).json({ error: "Invalid signature" })
    }
  },
)

app.listen(3000, () => console.log("Listening on :3000"))
