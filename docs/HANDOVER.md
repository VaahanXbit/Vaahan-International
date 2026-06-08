# Vaahan International — Handover Document

**Updated every Friday by the Web Developer Intern.**
This document must be complete and accurate at all times.
At the end of Month 3, this is the only guide for running the site.

---

## Site Overview

| Item              | Detail                                      |
|-------------------|---------------------------------------------|
| Domain            | vaahan-international.com                    |
| Hosting           | Hostinger Premium                           |
| CMS               | WordPress 6.x                              |
| Theme             | Astra + vaahan-child (this repo)            |
| Custom Plugin     | vaahan-core (this repo)                     |
| Analytics         | Google Analytics 4                          |
| Search Console    | Google Search Console                       |
| Email             | Mailchimp (free tier)                       |
| Lead Forms        | WPForms Lite                                |
| Last Speed Score  | GTmetrix: — / PageSpeed Mobile: —          |
| Last Updated      | DD Month YYYY                               |

---

## Credentials (Location Only — NOT the actual passwords)

**All passwords stored in:** [Add password manager name here — e.g. Bitwarden, 1Password]

| System              | Who Has Access                     |
|---------------------|------------------------------------|
| Hostinger hPanel    | Utsav Krishna (owner)              |
| WordPress Admin     | Utsav + all interns                |
| Google Analytics    | Utsav Krishna (owner)              |
| Google Search Console | Utsav Krishna (owner)            |
| Mailchimp           | Utsav Krishna (owner)              |
| GitHub Repo         | Utsav + developer intern           |
| Domain Registrar    | Utsav Krishna (owner)              |

**NEVER commit passwords or API keys to this repo.**

---

## How to Publish an Article (Content Intern SOP)

1. Log into WordPress: vaahan-international.com/wp-admin
2. Go to Posts → Add New
3. Enter article title
4. Write content in Gutenberg editor
5. Add featured image (1200×630px, WebP format)
6. Select the correct Category from the right sidebar
7. Fill in: Read Time, Verdict, Rating (Vaahan Article Details box)
8. Add Rank Math SEO title and meta description (Rank Math panel at bottom)
9. Preview on mobile before publishing
10. Click Publish

**Shortcodes available:**
```
[vaahan_verdict result="yes" text="Your verdict here"]
[vaahan_callout type="info"]Your callout text[/vaahan_callout]
[vaahan_lead_form type="insurance"]
[vaahan_toc]
[vaahan_compare feature="ABS" pro1="..." con1="..."]
[vaahan_feature_box title="What is X?" icon="🛡️"]Content[/vaahan_feature_box]
```

---

## How to Check Leads (Marketing Intern SOP)

1. Log into WordPress Admin
2. Go to Vaahan Leads (left sidebar)
3. New leads show with "New" status in gold
4. Export CSV: Click "Export CSV" button for reporting
5. Update lead status after contacting: New → Contacted → Converted
6. Check lead quality weekly and report to Utsav

---

## How to Update Plugins (Safe Process)

**Never update plugins directly on the live site.**

1. Go to Hostinger hPanel → Staging → Create staging copy
2. Update plugins on staging first
3. Test all pages and lead forms on staging
4. If everything works → update on live site
5. If something breaks → do NOT update on live site, investigate first

---

## Plugin List

See `docs/PLUGINS.md` for full list with versions and config notes.

---

## Monthly Maintenance Checklist

Run this every month:

- [ ] Check WordPress Site Health (Admin → Tools → Site Health) — fix any issues
- [ ] Run UpdraftPlus manual backup — verify backup is complete
- [ ] Run Wordfence full scan — verify clean
- [ ] Check GTmetrix score — flag if drops below A
- [ ] Check Google Search Console for crawl errors
- [ ] Review lead form submissions — check for spam
- [ ] Check all affiliate links are working
- [ ] Update HANDOVER.md with any changes

---

## Known Issues / Technical Debt

| Issue | Status | Notes |
|-------|--------|-------|
| Partner API integration (PolicyBazaar) | Pending | Waiting for agreement to be signed |
| Partner API integration (HDFC) | Pending | Waiting for agreement to be signed |
| | | |

---

## Weekly Log

### Week 1 — [Date]
**Completed:**
-

**In Progress:**
-

**Blockers:**
-

---

### Week 2 — [Date]
**Completed:**
-

**In Progress:**
-

**Blockers:**
-

---

### Week 3 — [Date]
**Completed:**
-

**In Progress:**
-

**Blockers:**
-

---

### Week 4 — [Date]
**Completed:**
-

**In Progress:**
-

**Blockers:**
-

---

*Continue adding weeks below. One entry per week, every Friday.*
