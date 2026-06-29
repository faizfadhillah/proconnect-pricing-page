# ProConnect — Pricing Prototype

A **working, interactive prototype** of the ProConnect pricing & subscription experience —
not a static design compilation. The whole upgrade journey runs live in the browser.

🔗 **Live:** https://faizfadhillah.github.io/proconnect-pricing-page/

## The flow (it actually works)

```
Dashboard ─▶ Plan & Pricing ─▶ Order Confirmation ─▶ Pay ─▶ Subscription & Billing
                                                              └▶ Edit / Cancel seats
Staff Management ─▶ Move member to a paid seat
```

- **Live pricing calculator** — `+ / −` seat counters, 5-country currency switch (IDR / MYR / SGD / PHP / USD) with localised pricing, and an annual toggle that applies a *Save 10%* discount and recomputes the total instantly.
- **Connected upgrade journey** — choices on the Plan page carry through to the Order summary; **Pay Now** activates the subscription, flips the dashboard/sidebar out of trial mode, and populates Billing with invoices.
- **Working dialogs** — Edit Seats, Cancel Subscription, and Move-member-seat modals open from their buttons and update state.
- **Pages & Flow tab** (bottom-right) — opens a right-side **Prototype Map** to jump between every page and walk the numbered flow.

State is shared across the whole prototype, so it behaves like a real app.

## Structure

```
index.html              # the prototype (single-page app shell)
assets/
  app.css               # shared design system (sidebar, cards, tables, forms, modals…)
  prototype.js          # app engine: views, live calculator, flow, modals, flow-map drawer
  proconnect-logo.svg   # official ProConnect logo
```

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

> Prototype — names, prices and content are for illustration, based on the ProConnect designs.
