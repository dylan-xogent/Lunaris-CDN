<p align="center">
  <img src="static/logo.png" alt="Lunaris CDN" width="120" height="120" />
</p>

<h1 align="center">Lunaris CDN</h1>

<p align="center">
  <strong>Free developer CDN for hosting installers, packages, and documentation.</strong>
</p>

<p align="center">
  <a href="https://lunaris.win">Website</a> &middot;
  <a href="https://lunaris.win/docs">API Docs</a> &middot;
  <a href="https://lunaris.win/about">About</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/SvelteKit-5-ff3e00?logo=svelte&logoColor=white" alt="SvelteKit 5" />
  <img src="https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Cloudflare-Pages-f38020?logo=cloudflare&logoColor=white" alt="Cloudflare Pages" />
</p>

---

Upload files up to 5GB, get clean CDN URLs your users can trust. **100GB free storage**, zero egress fees, forever. Powered by Cloudflare's global edge network with 300+ locations worldwide.

```
cdn.lunaris.win/acme/my-app/installer.exe
cdn.lunaris.win/acme/my-lib/docs.zip?v=2.1.0
```

---

## Features

### File Hosting & CDN Delivery

- **Chunked multipart uploads** — Resumable uploads in 50MB chunks, supporting files up to 5GB
- **SHA-256 integrity verification** — Every upload is checksummed automatically; users can verify downloads
- **Clean CDN URLs** — Human-readable download links: `cdn.lunaris.win/{user}/{project}/{file}`
- **Version pinning** — Append `?v=tag` for specific versions, or omit for the latest
- **Intelligent caching** — Versioned files get 1-year immutable cache; latest files get 5-minute cache with revalidation
- **CORS-enabled** — Cross-origin access headers on all CDN responses
- **Zero egress fees** — Built on Cloudflare R2, so downloads are always free

### Authentication & Security

- **Multiple auth methods** — Email/password, GitHub OAuth, Google OAuth
- **Mandatory 2FA** — Email OTP on every account, upgradeable to TOTP authenticator apps
- **Passkeys (WebAuthn)** — Passwordless login with biometrics or hardware keys
- **PBKDF2 password hashing** — 100,000 iterations with SHA-256, compatible with Cloudflare Workers CPU limits
- **Disposable email blocking** — 150+ throwaway email providers blocked at registration
- **Registration IP tracking** — Admin visibility into account creation patterns for anti-abuse
- **Rate limiting** — Per-endpoint rate limits on auth, uploads, quota requests, and account deletion
- **Security headers** — HSTS, CSP, X-Frame-Options, X-Content-Type-Options on all responses

### Project & Version Management

- **Unlimited projects** — Organize files into projects with slugs, descriptions, and public/private visibility
- **Semantic versioning** — Tag releases with version strings; mark any version as "latest"
- **File management** — Rename, delete, and organize files within versions
- **Project settings** — Update name, description, visibility, and danger-zone deletion

### Collaboration

- **Team access** — Invite collaborators by email with role-based permissions
- **Four permission levels** — Owner, Admin, Editor, Viewer
- **Email invitations** — 7-day expiry with auto-signup links for new users
- **Shared quota** — Storage usage counts against all project members

### API & Automation

- **RESTful API** — Full CRUD for projects, versions, files, and webhooks
- **API key management** — Generate scoped keys with custom rate limits, expiration, and permissions
- **CI/CD ready** — Upload from GitHub Actions, GitLab CI, or any pipeline with Bearer auth
- **Multipart upload API** — Initiate → upload parts → complete/abort workflow for large files

### Webhooks

- **Event-driven notifications** — Subscribe to `file.uploaded`, `file.downloaded`, `version.created`, `project.created`, `project.deleted`
- **HMAC-SHA256 signatures** — Verify webhook authenticity with per-webhook secrets
- **Discord integration** — Native Discord webhook formatting with rich embeds
- **Delivery logging** — Track delivery status, response codes, and retry history
- **Project scoping** — Global webhooks or per-project filtering

### Analytics

- **Download tracking** — Per-file download counts with timestamps
- **Dashboard insights** — Top files, top referrers, browser breakdown, daily trends
- **Time range filtering** — 7-day, 30-day, and 90-day views with period comparisons
- **Per-project drill-down** — Filter analytics by specific projects

### Storage & Quotas

- **100GB default quota** — Every account starts with 100GB of free storage
- **Quota request system** — Users can request additional storage with justification
- **Admin approval workflow** — Approve, reject, or modify quota requests with notes
- **Real-time usage tracking** — Storage used/remaining displayed throughout the dashboard

### Admin Panel

- **System dashboard** — Total users, projects, files, storage, downloads at a glance
- **User management** — View, search, bulk role changes, account deletion
- **IP abuse detection** — Registration IPs with duplicate-IP flagging
- **Project & file management** — Admin oversight of all hosted content
- **Quota administration** — Review and process quota increase requests

### Additional Features

- **User avatars** — Upload profile pictures stored in R2
- **Public profiles** — `lunaris.win/{username}` pages with project showcase
- **Email notifications** — Welcome emails, verification, password reset, collaboration invites
- **Email unsubscribe** — Token-based one-click unsubscribe from marketing emails
- **Custom error pages** — Branded 404/500 error pages
- **Progressive Web App** — Installable with manifest and app icons

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/) (runes) |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at the edge) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) |
| **Storage** | [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible, zero egress) |
| **Auth** | [Better Auth](https://www.better-auth.com/) + Passkeys + 2FA |
| **Validation** | [Zod 4](https://zod.dev/) |
| **Email** | [Resend](https://resend.com/) |
| **Hashing** | [hash-wasm](https://github.com/nicolo-ribaudo/nicolo-nicolo/nicolo) (SHA-256 streaming) |
| **IDs** | [nanoid](https://github.com/ai/nanoid) |
| **Runtime** | [Cloudflare Workers](https://workers.cloudflare.com/) (edge, V8 isolates) |
| **Deployment** | [Cloudflare Pages](https://pages.cloudflare.com/) |
| **Build** | [Vite 7](https://vitejs.dev/) |
| **Package Manager** | [Bun](https://bun.sh/) |

---

## Project Structure

```
src/
├── app.css                          # Global styles, theme, animations
├── app.d.ts                         # TypeScript declarations (Platform env)
├── hooks.server.ts                  # Rate limiting, CDN routing, security headers
│
├── lib/
│   ├── auth-client.ts               # Client-side Better Auth instance
│   ├── utils.ts                     # Formatting helpers (bytes, dates, numbers)
│   ├── reveal.ts                    # Scroll reveal + countUp animations
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   └── OAuthButtons.svelte  # GitHub/Google OAuth buttons
│   │   ├── layout/
│   │   │   └── Navbar.svelte        # Global navigation bar
│   │   ├── projects/
│   │   │   └── FileUploader.svelte  # Chunked multipart file uploader
│   │   └── ui/                      # Reusable UI components (card, button, toast, etc.)
│   │
│   ├── server/
│   │   ├── auth.ts                  # Better Auth config (OAuth, 2FA, passkeys, hooks)
│   │   ├── cdn.ts                   # CDN request handler (file resolution, caching)
│   │   ├── middleware.ts            # Auth helpers, JSON error/success responses
│   │   ├── rate-limit.ts            # In-memory sliding window rate limiter
│   │   ├── quota.ts                 # Storage quota calculations
│   │   ├── quota-check.ts           # Pre-upload quota validation
│   │   ├── project-access.ts        # Role-based permission checks
│   │   ├── webhooks.ts              # Webhook dispatch with HMAC signing
│   │   ├── email.ts                 # Resend email delivery
│   │   ├── email-templates.ts       # HTML email templates
│   │   ├── validation.ts            # Zod schemas for request validation
│   │   ├── utils.ts                 # Path sanitization, pagination
│   │   ├── r2.ts                    # R2 bucket helpers
│   │   ├── uploadCleanup.ts         # Stale upload session cleanup
│   │   ├── unsubscribe.ts           # Email unsubscribe token generation
│   │   └── db/
│   │       ├── index.ts             # Drizzle client factory
│   │       └── schema.ts            # Full database schema (18 tables)
│   │
│   └── stores/
│       └── toast.svelte.ts          # Toast notification store (Svelte 5 runes)
│
├── routes/
│   ├── +layout.svelte               # Root layout (Navbar + Toast)
│   ├── +layout.server.ts            # Session loading
│   ├── +page.svelte                 # Landing page
│   ├── +error.svelte                # Custom error page
│   │
│   ├── auth/                        # Authentication flows
│   │   ├── login/                   # Sign in page
│   │   ├── register/                # Sign up page
│   │   ├── forgot-password/         # Password reset request
│   │   ├── reset-password/          # Password reset form
│   │   ├── choose-username/         # OAuth username selection
│   │   └── verified/                # Email verification confirmation
│   │
│   ├── dashboard/                   # Authenticated user area
│   │   ├── projects/                # Project list + creation
│   │   │   └── [slug]/              # Project detail
│   │   │       ├── upload/          # File upload page
│   │   │       ├── members/         # Collaboration management
│   │   │       └── settings/        # Project settings
│   │   ├── analytics/               # Download analytics dashboard
│   │   ├── api-keys/                # API key management
│   │   ├── webhooks/                # Webhook configuration
│   │   ├── security/                # 2FA + passkey settings
│   │   └── settings/                # Account settings + avatar
│   │
│   ├── admin/                       # Admin panel (role-gated)
│   │   ├── users/                   # User management
│   │   ├── projects/                # Project oversight
│   │   ├── files/                   # File management
│   │   └── quotas/                  # Quota request processing
│   │
│   ├── cdn/                         # CDN delivery endpoint
│   │   └── [username]/[projectSlug]/[...filePath]/
│   │
│   ├── api/
│   │   ├── auth/[...all]/           # Better Auth catch-all handler
│   │   └── v1/                      # Application API
│   │       ├── projects/            # Project CRUD
│   │       ├── upload/              # Multipart upload (initiate/part/complete/abort)
│   │       ├── analytics/           # Download analytics
│   │       ├── webhooks/            # Webhook CRUD + test
│   │       ├── quota-request/       # Quota requests
│   │       ├── user/                # User settings (avatar, username, delete)
│   │       └── admin/               # Admin operations
│   │
│   ├── [username]/                  # Public user profiles
│   │   └── [projectSlug]/           # Public project pages
│   │
│   ├── about/                       # About page
│   ├── docs/                        # API documentation
│   ├── privacy/                     # Privacy policy
│   ├── tos/                         # Terms of service
│   └── invite/[id]/                 # Collaboration invitation acceptance
│
static/
├── logo.png                         # Brand logo
├── favicon.ico                      # Favicon
├── icon-192.png / icon-512.png      # PWA icons
├── site.webmanifest                 # PWA manifest
├── robots.txt                       # Search engine directives
└── sitemap.xml                      # Sitemap
```

---

## Database Schema

18 tables managed by Drizzle ORM on Cloudflare D1:

| Table | Purpose |
|-------|---------|
| `user` | User accounts — name, username, email, role, avatar, registration IP, 2FA flag |
| `session` | Active sessions with IP address and user agent tracking |
| `account` | OAuth provider connections (GitHub, Google) |
| `verification` | Email verification and password reset tokens |
| `apikey` | API keys with rate limits, expiration, and scoped permissions |
| `passkey` | WebAuthn credential storage |
| `twoFactor` | TOTP secrets and backup codes |
| `project` | CDN projects with slug, description, visibility (unique per user) |
| `version` | Project versions with semantic tags and "latest" flag |
| `file` | Uploaded files — R2 key, SHA-256, MIME type, download count |
| `uploadSession` | In-progress multipart uploads (24-hour expiry) |
| `userQuota` | Per-user storage limits and usage (default 100GB) |
| `quotaRequest` | User-submitted quota increase requests |
| `downloadLog` | File download events — IP hash, user agent, referrer |
| `webhook` | Webhook endpoint configuration per user/project |
| `webhookDelivery` | Webhook delivery history with status and response |
| `projectMember` | Collaboration members with role assignments |
| `projectInvitation` | Pending collaboration invitations (7-day expiry) |

---

## API Reference

### Authentication

All auth is handled by Better Auth at `/api/auth/*`. Supports email/password, GitHub OAuth, Google OAuth, 2FA (email OTP + TOTP), and passkeys.

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/projects` | List user's projects (supports `?page=` and `?limit=` pagination) |
| `POST` | `/api/v1/projects` | Create a new project |
| `GET` | `/api/v1/projects/:slug` | Get project details |
| `PATCH` | `/api/v1/projects/:slug` | Update project settings |
| `DELETE` | `/api/v1/projects/:slug` | Delete project and all associated data |

### Versions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/projects/:slug/versions` | List all versions |
| `POST` | `/api/v1/projects/:slug/versions` | Create a new version |
| `DELETE` | `/api/v1/projects/:slug/versions/:tag` | Delete a version |
| `POST` | `/api/v1/projects/:slug/versions/:tag/set-latest` | Mark version as latest |

### File Upload (Multipart)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/upload/initiate` | Start upload — returns session ID, part size, total parts |
| `PUT` | `/api/v1/upload/part` | Upload a single chunk |
| `POST` | `/api/v1/upload/complete` | Finalize upload and move to production |
| `POST` | `/api/v1/upload/abort` | Cancel an in-progress upload |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `DELETE` | `/api/v1/projects/:slug/files/:fileId` | Delete a file (reclaims quota) |
| `PATCH` | `/api/v1/projects/:slug/files/:fileId` | Rename a file (update path/name) |

### Collaboration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/projects/:slug/members` | List members and pending invitations |
| `POST` | `/api/v1/projects/:slug/members` | Invite a user by email |
| `PATCH` | `/api/v1/projects/:slug/members/:id` | Update member role |
| `DELETE` | `/api/v1/projects/:slug/members/:id` | Remove a member |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/webhooks` | List user's webhooks |
| `POST` | `/api/v1/webhooks` | Create a webhook |
| `PATCH` | `/api/v1/webhooks/:id` | Update webhook settings |
| `DELETE` | `/api/v1/webhooks/:id` | Delete a webhook |
| `POST` | `/api/v1/webhooks/:id/test` | Send a test ping event |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analytics?range=7d` | Download stats (7d, 30d, 90d) with optional `projectId` filter |

### CDN Delivery

```
GET cdn.lunaris.win/{username}/{project}/{filePath}
GET cdn.lunaris.win/{username}/{project}/{filePath}?v={versionTag}
```

Returns the file with appropriate `Content-Type`, `Cache-Control`, `ETag`, and `X-Checksum-SHA256` headers.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A [Cloudflare](https://cloudflare.com/) account with:
  - A D1 database
  - An R2 bucket
  - Pages project

### Installation

```bash
# Clone the repository
git clone https://github.com/dylan-xogent/Lunaris-CDN.git
cd Lunaris-CDN

# Install dependencies
bun install
```

### Environment Variables

All secrets are managed through Cloudflare Pages environment variables (not `.env` files). The following must be set in your Cloudflare Pages project settings:

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Secret key for session signing and encryption |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Local Development

```bash
# Start the dev server with Cloudflare bindings
bun run dev

# The app runs at http://localhost:5173
```

For local development with D1 and R2, Wrangler creates local `.wrangler/state` with SQLite files and R2 storage.

### Database Migrations

```bash
# Generate a migration from schema changes
bunx drizzle-kit generate

# Apply migrations to local D1
bunx wrangler d1 execute lunaris-cdn-db --local --file=drizzle/XXXX_migration.sql

# Apply migrations to production D1
bunx wrangler d1 execute lunaris-cdn-db --remote --file=drizzle/XXXX_migration.sql
```

### Building

```bash
# Build for production
bun run build

# Preview the production build locally
bun run preview
```

### Deployment

```bash
# Deploy to Cloudflare Pages
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=lunaris-cdn
```

---

## CDN URL Format

Files are served from a dedicated CDN subdomain with clean, memorable URLs:

```
https://cdn.lunaris.win/{username}/{projectSlug}/{filePath}
```

### Version Pinning

```bash
# Always get the latest version
curl -O https://cdn.lunaris.win/acme/my-app/installer.exe

# Pin to a specific version
curl -O "https://cdn.lunaris.win/acme/my-app/installer.exe?v=2.1.0"

# Verify integrity
curl -I https://cdn.lunaris.win/acme/my-app/installer.exe
# → X-Checksum-SHA256: a1b2c3d4e5f6...
```

### Cache Behavior

| Request Type | Cache-Control | Behavior |
|-------------|---------------|----------|
| Versioned (`?v=tag`) | `public, max-age=31536000, immutable` | Cached for 1 year at the edge |
| Latest (no `?v=`) | `public, max-age=300, s-maxage=300` | 5-minute cache with revalidation |

---

## Design

Lunaris CDN uses a dark-first design system built on Tailwind CSS 4:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#8b5cf6` | Primary purple accent |
| `--color-cyan` | `#22d3ee` | Secondary cyan accent |
| `--color-emerald` | `#34d399` | Success/status indicators |
| `--color-background` | `#050507` | Page background |
| `--color-card` | `#0c0c10` | Card surfaces |
| `--color-foreground` | `#f0f0f5` | Primary text |
| `--color-border` | `#1e1e28` | Subtle dividers |

**Typography**: Inter (body), Instrument Serif (display headings), JetBrains Mono (code)

---

## Webhook Events

Subscribe to events and receive POST requests with HMAC-SHA256 signed payloads:

| Event | Trigger |
|-------|---------|
| `file.uploaded` | A file finishes uploading |
| `file.downloaded` | A file is downloaded via CDN |
| `version.created` | A new version tag is created |
| `project.created` | A new project is created |
| `project.deleted` | A project is deleted |
| `ping` | Manual test from webhook settings |

Each delivery includes an `X-Webhook-Signature` header for verification.

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth (login/register) | 20 requests | 1 minute |
| Sign-up (email) | 3 requests | 1 hour |
| Upload initiation | 30 requests | 1 minute |
| Quota requests | 5 requests | 1 hour |
| Avatar upload | 10 requests | 1 minute |
| Account deletion | 3 requests | 1 hour |

---

## Contributing

Contributions are welcome! Please open an issue or pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source under the [MIT License](LICENSE).

---

<p align="center">
  <sub>Built with care. Powered by Cloudflare.</sub>
</p>
