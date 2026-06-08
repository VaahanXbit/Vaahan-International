# Vaahan International — Lead Generation Documentation

All lead generation setup, partner details, and integration notes.

---

## Revenue Target

| Month | Target | Source |
|-------|--------|--------|
| 1–2   | ₹0–9,500 | Testing phase |
| 3     | ₹21,500 | Lead gen kicking in |
| 4     | ₹40,000 | Full pipeline |
| 5–6   | ₹50,000–66,000 | All streams active |

---

## Lead Form Types

Three forms built in WPForms Lite:

| Form | WPForms ID | Lead Type | Partner |
|------|-----------|-----------|---------|
| Car Insurance Quote | 1 | insurance | PolicyBazaar |
| Auto Loan Eligibility | 2 | auto_loan | HDFC Bank |
| General Enquiry | 3 | general | Internal only |

---

## Fields Captured on Every Lead

- Full Name
- Email
- Phone Number
- City
- Car Budget (dropdown: Under ₹10L / ₹10–15L / ₹15–20L / Above ₹20L)
- Intent (dropdown: Ready to buy / Just researching / Comparing options)
- Source URL (hidden — auto-filled by JS)
- UTM Source (hidden — auto-filled by JS)
- UTM Medium (hidden — auto-filled by JS)
- UTM Campaign (hidden — auto-filled by JS)

---

## Partner Details

### PolicyBazaar (Insurance Leads)
- Program type: Pay-per-lead
- Payout: ₹400–600 per qualified lead
- Qualification: Name + Phone + City + Vehicle type
- Integration: [Add API endpoint after agreement]
- API Key location: WordPress Admin → Vaahan → Settings
- Status: [ ] Agreement signed [ ] API integrated [ ] Live

### HDFC Bank (Auto Loan Leads)
- Program type: DSA (Direct Sales Associate)
- Payout: ₹400–800 per qualified lead
- Qualification: Name + Phone + City + Loan amount
- Integration: [Add details after agreement]
- Status: [ ] Agreement signed [ ] API integrated [ ] Live

### Amazon Associates (Affiliate Links)
- Program type: Affiliate commission
- Payout: 3–5% on qualifying purchases
- Integration: Pretty Links plugin — all Amazon links wrapped
- Tag ID: [Add after signup]
- Status: [ ] Signed up [ ] Links added

### Cars24 (Used Car Referrals)
- Program type: Referral payout
- Payout: ₹500–1,500 per successful referral
- Integration: Tracking link from Cars24 affiliate dashboard
- Status: [ ] Agreement signed [ ] Links added

---

## Lead Flow

```
Visitor reads article
        ↓
Sees lead form (embedded via shortcode)
        ↓
Submits form
        ↓
Lead stored in wp_vaahan_leads table
        ↓
Admin notified by email
        ↓
[FUTURE] Lead sent to partner API automatically
        ↓
Partner pays per qualified lead
```

---

## Lead Quality Standards

Only send leads to partners that meet ALL criteria:

- Valid phone number (10 digits, Indian format)
- Valid email address
- City provided
- Intent: "Ready to buy" or "Comparing options" (NOT "Just researching")
- Budget specified

Low quality leads (just researching, no phone, fake email) — keep in database but do NOT send to partner. Partners stop paying if quality drops.

---

## Reporting

Check leads weekly:
1. WordPress Admin → Vaahan Leads
2. Export CSV for monthly partner reconciliation
3. Track: Total leads / Qualified leads / Sent to partner / Converted

Monthly report to Utsav every 1st of the month.
