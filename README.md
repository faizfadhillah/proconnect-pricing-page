# ProConnect — Employer Dashboard Prototype

A **pixel-faithful, navigable prototype** of the ProConnect Employer Dashboard, implemented
directly from the Figma *Employer Dashboard* design file (`SxImwwoE11hklbKv8Eu2bZ`).
**80 screens** — desktop, mobile, modals and components — built as pure static HTML/CSS/JS
on a shared design system. No build step.

🔗 **Live gallery:** https://faizfadhillah.github.io/proconnect-pricing-page/

## What's inside

| Flow | Screens |
|------|--------:|
| Auth & Registration | login, sign-in (mobile), role selection, company setup |
| Dashboard | home, getting-started, trial-expired, onboarding (desktop + mobile) |
| Pricing & Plans | pricing page, calculator, feature table (desktop + mobile + modal) |
| Subscription & Billing | subscription, invoices, edit/remove seats, cancel, order confirmation |
| Team & Staff Management | staff list, edit member, role assignment, move/upgrade seat modals |
| Jobs | job list + detail, job posting (desktop + mobile) |
| Candidate & ATS | candidate home / profile (mobile) |

The landing page (`index.html`) is a **gallery** that groups every screen by flow with live
scaled previews and a category filter (desktop / mobile / modal / component). Click any card to
open the screen full-size.

## Architecture

```
index.html              # gallery / launcher (groups all 80 screens)
pricing-classic.html    # original standalone interactive pricing page (currency + annual calc)
assets/
  app.css               # shared design system (tokens, sidebar, topbar, cards, tables, forms, modals…)
  app.js                # shared interactions (sidebar submenus, FAQ, counters, modal close)
  manifest.json         # catalog of all 80 screens (slug, title, group, category)
partials/
  desktop-shell.html    # reference skeleton: topbar + sidebar + trial banner + content
  mobile-shell.html     # reference skeleton: 360px header + body
screens/                # 80 self-contained screen pages (<slug>.html)
```

Every screen reuses the shared design-system classes from `assets/app.css` for consistency, with
small per-screen tweaks. Brand: blue `#2563eb`, green `#16a34a`, amber trial banner `#f4c84c`.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

> Prototype only — names, prices and content are reproduced from the source designs for illustration.
