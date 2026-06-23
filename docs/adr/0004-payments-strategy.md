# ADR 0004: Payments Strategy
**Status:** Accepted
**Decision:** Keep business-customer payments separate from UpNext SaaS billing. Start with Stripe payment links / Checkout; webhooks are source of truth; idempotent processing.
**Why:** Avoids storing card data; minimizes PCI scope; ships fast.
