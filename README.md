# Vaahan International — WordPress Repository

**vaahan-international.com** · Modern car features, explained simply for Indian buyers.

---

## What This Repo Contains

This repository contains **only custom code** for the Vaahan International WordPress site.
It does NOT contain WordPress core files, plugin files, or uploaded media.

```
vaahan-international/
├── wp-content/
│   ├── themes/
│   │   └── vaahan-child/          ← All theme customisations live here
│   └── plugins/
│       └── vaahan-core/           ← All custom functionality lives here
├── docs/                          ← Documentation — keep updated weekly
├── scripts/                       ← Deployment and utility scripts
├── .gitignore
└── README.md
```

---

## Quick Start (Day 1)

```bash
# 1. Clone this repo
git clone https://github.com/YOUR_USERNAME/vaahan-international.git

# 2. Install WordPress on Hostinger via hPanel (one-click installer)

# 3. Copy theme to WordPress
cp -r wp-content/themes/vaahan-child /path/to/wordpress/wp-content/themes/

# 4. Copy plugin to WordPress
cp -r wp-content/plugins/vaahan-core /path/to/wordpress/wp-content/plugins/

# 5. Activate both from WordPress admin
# Admin → Appearance → Themes → Activate Vaahan Child
# Admin → Plugins → Activate Vaahan Core
```

---

## Stack

| Layer        | Tool              | Version  |
|--------------|-------------------|----------|
| CMS          | WordPress         | 6.x      |
| Parent Theme | Astra             | Latest   |
| Child Theme  | vaahan-child      | This repo|
| Custom Plugin| vaahan-core       | This repo|
| Page Builder | Elementor Free    | Latest   |
| SEO          | Rank Math Pro     | Latest   |
| Speed        | WP Rocket         | Latest   |
| Analytics    | Google Analytics 4| —        |
| Email        | Mailchimp         | —        |
| Lead Forms   | WPForms Lite      | Latest   |
| Security     | Wordfence         | Latest   |
| Backups      | UpdraftPlus       | Latest   |

---

## Branch Strategy

```
main          ← Production (live site). Never commit directly.
develop       ← Staging. All work merges here first.
feature/*     ← Individual features (e.g. feature/lead-form-insurance)
fix/*         ← Bug fixes (e.g. fix/mobile-nav-overlap)
```

**Workflow:**
1. Create `feature/your-feature` from `develop`
2. Build and test locally
3. Open PR to `develop`
4. Test on staging
5. Merge `develop` → `main` only when ready for production

---

## Commit Message Format

```
[Month N] Short description of what was done

Examples:
[Month 1] Add Astra child theme with brand colours
[Month 1] Build homepage using Elementor
[Month 2] Add insurance lead form with UTM tracking
[Month 2] Fix mobile nav menu overlap on iOS
[Month 3] Complete handover documentation
```

---

## Contacts

| Role             | Name          | Contact              |
|------------------|---------------|----------------------|
| Founder          | Utsav Krishna | utsav@vaahan-international.com |
| Web Dev Intern   | Your Name     | your@email.com       |
| Content Intern 1 | TBD           | —                    |
| Content Intern 2 | TBD           | —                    |
| Marketing Intern | TBD           | —                    |

---

## Documentation

| File                    | Contents                              |
|-------------------------|---------------------------------------|
| `docs/HANDOVER.md`      | Complete handover doc — updated weekly|
| `docs/PLUGINS.md`       | All plugins, versions, config notes   |
| `docs/LEAD-GEN.md`      | Lead form setup and partner details   |
| `docs/CREDENTIALS.md`   | Where credentials are stored (NOT the credentials themselves) |
| `docs/WEEKLY-LOG.md`    | Weekly progress log                   |

---

## Rules

1. **Never edit WordPress core files** — child theme and vaahan-core plugin only
2. **Never commit secrets** — no passwords, API keys, or wp-config.php
3. **Mobile first** — test on mobile before marking any task done
4. **Update HANDOVER.md every Friday** — non-negotiable
5. **Keep it simple** — no over-engineering, this is a content site
