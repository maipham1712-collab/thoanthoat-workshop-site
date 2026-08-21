# Thoăn Thoắt — workshop site

A single-page site (`index.html`) with a 3D ring/pendant configurator, plus one
serverless function (`api/booking.js`) that emails the team when someone
submits the booking form. Everything on the site that's still a business
placeholder (address, pricing, hours, etc.) renders visibly as `[LIKE_THIS]`
instead of being faked — search `index.html` for `CONFIG` to fill those in.

## Deploying to thoatthoatws.vietjewelers.com

You'll need three free accounts: **GitHub** (to hold the code), **Vercel**
(to host it), and **Resend** (to send the booking emails). None of these can
be created on your behalf — here's the sequence:

### 1. Push this folder to GitHub
```bash
git add -A
git commit -m "Initial site"
```
Then create an empty repo on [github.com/new](https://github.com/new) and follow
its "push an existing repository" instructions to connect this folder to it.

### 2. Connect Vercel to the repo
- Sign in at [vercel.com](https://vercel.com) with your GitHub account.
- "Add New… → Project", pick this repo, click Deploy. No build settings needed —
  Vercel serves `index.html` as-is and auto-detects `api/booking.js` as a function.
- You'll get a working `*.vercel.app` URL immediately, before the domain is attached.

### 3. Get a Resend API key
- Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month).
- Under **Domains**, add `thoatthoatws.vietjewelers.com` (or a `mail.` sibling
  subdomain if you'd rather keep the booking subdomain purely for the site) and
  add the DNS records Resend gives you (see step 5 — same place you'll add the
  Vercel record).
- Once verified, create an API key under **API Keys**.

### 4. Set environment variables in Vercel
Project → Settings → Environment Variables:
| Key | Value |
|---|---|
| `RESEND_API_KEY` | the key from step 3 |
| `NOTIFY_EMAIL` | `maipham1712@gmail.com` |
| `FROM_EMAIL` | `Thoăn Thoắt <bookings@thoatthoatws.vietjewelers.com>` (must match a domain verified in Resend) |

Redeploy after adding these (Vercel prompts you to).

### 5. Point the subdomain at Vercel
In Vercel: Project → Settings → Domains → add `thoatthoatws.vietjewelers.com`.
Vercel will show you a CNAME record to add. In vietjewelers.com's DNS
(wherever that's managed — your registrar or a DNS host like Cloudflare), add:

| Type | Name | Value |
|---|---|---|
| CNAME | `thoatthoatws` | `cname.vercel-dns.com` |

DNS changes can take a few minutes to a few hours to propagate. Vercel's
domain settings page shows a green check once it sees the record.

## Local testing
```bash
npm install -g vercel   # once
npm install
vercel dev
```
This runs the static site and the `/api/booking` function together on
`localhost`. Copy `.env.example` to `.env` with a real `RESEND_API_KEY` to
test actual email sending, or leave it unset — the function will log the
booking to the console and still return success so the front end doesn't break.

## What's still a placeholder
Everything bracketed in `CONFIG` inside `index.html`: studio address/phone/hours,
Google Maps link, pricing (currency, gold/silver rate, method & texture add-ons),
sizing standard, the two pendant base models (need a GLB/STL file each), a few
FAQ answers, and the news/bench-notes entries.
