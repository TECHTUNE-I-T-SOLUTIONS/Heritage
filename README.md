# Heritage Club

> **A modern learning platform helping the next generation of African diaspora children connect with their culture, language, and heritage through live classes, interactive curriculum, and community.**

[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?logo=nextdotjs&logoColor=white&labelColor=%23000000)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React%2019-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel Analytics](https://img.shields.io/badge/Vercel%20Analytics-000000?logo=vercel)](https://vercel.com/analytics)
[![License](https://img.shields.io/badge/License-Proprietary%20Software-blue.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [The Four Pillars](#the-four-pillars)
- [User Roles](#user-roles)
- [Pricing](#pricing)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
  - [Seeding the Database](#seeding-the-database)
  - [Building for Production](#building-for-production)
- [Architecture](#architecture)
  - [API Layer](#api-layer)
  - [Data Models](#data-models)
  - [Authentication & Authorization](#authentication--authorization)
  - [Client-Side Data Fetching](#client-side-data-fetching)
- [Payment Integration](#payment-integration)
- [Development Conventions](#development-conventions)
- [Legal Documents](#legal-documents)
- [Resources](#resources)

---

## Overview

---

## Features

### Public-Facing

- **Landing page** — Hero section, four pillars, how-it-works, pricing, testimonials, and contact form
- **About page** — Mission, values, and the four pillars of learning
- **How it works** — Step-by-step guide from enrollment to progress tracking
- **Pricing** — Transparent monthly plans in CAD
- **Contact** — Form-based contact with email, WhatsApp, and social links
- **Legal pages** — Terms of Service, Privacy Policy, Refund & Cancellation, Cookie Policy
- **Responsive design** — Mobile-first, light/dark mode, fully responsive

### Student Dashboard

- **Overview** — XP, level, streak, cohort info, upcoming assignments, and progress snapshot
- **Classes** — Interactive lessons across four pillars with completion tracking
- **Quizzes** — Take and review auto-scored quizzes with instant feedback and XP rewards
- **Assignments** — View, submit creative projects (documents, images, video, audio, links), receive educator feedback
- **Leaderboard** — Friendly cohort and global rankings
- **Progress** — Detailed view of lessons completed, quiz history, XP events, and streak
- **Profile** — Account settings, avatar upload, and parent/guardian linking

### Parent Dashboard

- **Overview** — Family progress summary with child cards and subscription status
- **My Children** — Manage children enrolments, view profiles, edit details
- **Progress** — Track each child's lessons, quizzes, and submissions
- **Subscription** — View plan details, manage cancellation, and re-trigger payment
- **Payments** — Billing history and invoice records
- **Settings** — Profile management, password changes, and avatar upload

### Educator Dashboard

- **Overview** — Cohort summaries, student counts, pending submissions, and quiz statistics
- **Students** — View assigned students and their profiles
- **Lessons** — Upload and organize lesson materials by pillar, module, and week
- **Quizzes** — Create, edit, and publish quizzes with multiple-choice questions
- **Assignments** — Create assignments, set deadlines, review and grade submissions
- **Progress** — Track quiz scores, assignment grades, and overall completion

### Admin Dashboard

- **Overview** — Live counts of students, parents, educators, cohorts, subscriptions, revenue, and pending moderation
- **Users** — Manage all accounts (students, parents, educators, admins)
- **Cohorts** — Create, edit, and archive age/timezone-based learning groups
- **Curriculum** — Manage pillars, modules, and lessons
- **Quizzes & Assignments** — Centralized content management
- **Submissions** — Moderate and review flagged content
- **Gamification** — Manage XP rules and achievements
- **Subscriptions & Payments** — View all billing and reconcile transactions
- **Testimonials** — Curate and publish student/family stories
- **Website Content** — Edit site hero text, contact info, and social links
- **Analytics & Settings** — System-wide configuration

Heritage Club is a structured online cultural heritage programme designed for African children in the diaspora. It brings African languages, history, stories, values, traditions, identity, and creative expression into one thoughtful, engaging learning journey.

The platform is part of the **Damzy Next Gen** ecosystem — its own identity with a focused mission: helping children maintain a meaningful, everyday connection to their African heritage through live small-group classes, self-paced lessons, interactive quizzes, creative projects, and gamified progress tracking.

### Core Experience

1. **Enroll** — Guardians create a family account and register one or more children.
2. **Cohort placement** — Each learner is placed into an age-appropriate cohort with a dedicated educator.
3. **Live sessions** — Weekend live classes bring language, stories, and culture to life.
4. **Lessons** — Structured curriculum across four pillars, organized by module and week.
5. **Quizzes & Assignments** — Auto-scored quizzes and creative projects reinforce learning.

---

## The Four Pillars

Heritage Club organizes its curriculum around four foundational pillars:

| # | Pillar | Focus |
|---|--------|-------|
| 01 | **Identity** | Family stories, identity, place, and the many ways heritage can be carried |
| 02 | **Language** | Greetings, phrases, sounds, and expressions that carry identity across generations |
| 03 | **History** | Stories about kingdoms, leaders, movements, art, science, and everyday life |
| 04 | **Community** | Growing alongside a cohort that celebrates every milestone |

---

## User Roles

| Role | Description | Key Access |
|------|-------------|------------|
| **Student** | Independent learners aged 3–19 | Dashboard, classes, quizzes, assignments, progress, leaderboard, profile |
| **Parent** | Guardians who enroll and manage children | Family dashboard, child profiles, progress tracking, billing |
| **Educator** | Teachers assigned to cohorts | Student management, quiz/assignment creation, lesson materials, progress |
| **Admin** | Platform operators with full control | All administrative functions, user management, content, billing |

**Registration access controls:**
- Educators and admins require invite/setup codes (`EDUCATOR_INVITE_CODE`, `ADMIN_SETUP_CODE`)
- Staff signups are disabled until codes are configured

---

## Pricing

All plans are billed monthly in **CAD** and include full access to live classes, the complete curriculum, quizzes, assignments, XP rewards, and progress tracking.

| Plan | Price | Children | Key Details |
|------|-------|----------|-------------|
| Individual | $59/month | 1 | Full access for one child |
| Family — 2 Children | $109/month | 2 | **Most popular** — family dashboard |
| Family — 3 Children | $129/month | 3 | Family dashboard |
| Family — 4 Children | $149/month | 4 | Family dashboard |

> No payment is taken at sign-up. Subscriptions are created as `incomplete` and parents complete payment through Paystack after account creation.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Runtime** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), `tailwind-merge`, `class-variance-authority` |
| **UI** | Custom component kit using [shadcn/ui](https://ui.shadcn.com/) base-nova style, [Lucide React](https://lucide.dev/) icons, `tw-animate-css` |
| **Database** | [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) |
| **Authentication** | JWT-based sessions (signed with `jose`), bcrypt password hashing |
| **Payments** | [Paystack](https://paystack.com/) API with CAD→local currency conversion |
| **Form Validation** | [Zod](https://zod.dev/) |
| **Package Manager** | [pnpm](https://pnpm.io/) |
| **Analytics** | [Vercel Analytics](https://vercel.com/analytics) |

---

## Project Structure

```
heritage-club/
├── app/                          # Next.js App Router — all routes
│   ├── api/                      # API route handlers (REST endpoints)
│   │   ├── account/              # User profile, avatar, password, parent linking
│   │   ├── admin/                # Admin operations (users, cohorts, curriculum, etc.)
│   │   ├── auth/                 # Login, register, logout, forgot/reset password, me
│   │   ├── avatar/[id]/          # Avatar image serving
│   │   ├── contact/              # Contact form handler
│   │   ├── curriculum/           # Public curriculum listing
│   │   ├── educator/             # Educator operations (students, quizzes, assignments)
│   │   ├── leaderboard/          # Leaderboard data
│   │   ├── notifications/        # User notifications
│   │   ├── parent/               # Parent operations (children, payments, subscription)
│   │   ├── payments/             # Paystack initialize & verify
│   │   └── student/              # Student operations (overview, lessons, quizzes)
│   ├── admin/                    # Admin auth pages (login, signup)
│   ├── dashboard/                # Role-based dashboards
│   │   ├── admin/                # Admin operations centre
│   │   ├── educator/             # Educator workspace
│   │   ├── parent/               # Parent family dashboard
│   │   └── student/              # Student learning dashboard
│   ├── auth/                     # Auth redirect (/auth → /login)
│   ├── educator/                 # Educator auth pages
│   ├── staff/                    # Staff password reset flows
│   ├── [slug]/                   # Dynamic public pages (about, pricing, faq, etc.)
│   ├── about/                    # About page
│   ├── contact/                  # Contact page
│   ├── enroll/                   # Multi-step enrollment flow
│   ├── forgot-password/          # Password recovery
│   ├── how-it-works/             # Step-by-step guide
│   ├── login/                    # Sign-in page
│   ├── payment/                  # Payment callback handler
│   ├── pricing/                  # Pricing page
│   └── reset-password/           # Password reset form
├── components/                   # Reusable React components
│   ├── ui/                       # UI kit: kit.tsx, form.tsx, interactive.tsx
│   ├── logo.tsx                  # Brand logo component
│   ├── public-chrome.tsx         # Public site header + footer
│   ├── dashboard-shell.tsx       # Dashboard layout (sidebar, header, profile)
│   ├── hero-video.tsx            # Background video carousel
│   ├── auth-split.tsx            # Split-screen auth layout
│   ├── staff-auth-split.tsx      # Staff auth layout
│   ├── auth-page.tsx             # Legacy auth page
│   ├── settings-form.tsx         # Profile/account settings form
│   ├── student-parent-card.tsx   # Parent linking card for students
│   ├── child-edit-button.tsx     # Inline child edit modal
│   ├── legal-page.tsx            # Legal document renderer
│   └── theme-toggle.tsx          # Light/dark mode toggle
├── lib/                          # Core utilities and helpers
│   ├── api.ts                    # API response helpers (ok, fail, requireAuth)
│   ├── auth.ts                   # Password hashing, JWT, session cookies
│   ├── client.ts                 # Client-side API hooks (useApi, apiPost, etc.)
│   ├── db.ts                     # MongoDB connection pooling
│   ├── format.ts                 # Currency, date, initials, XP formatting
│   ├── fx.ts                     # Currency conversion (CAD → paystack currency)
│   ├── notifications.ts          # Notification trigger helpers
│   ├── options.ts                # Dropdown option lists (countries, timezones)
│   ├── paystack.ts               # Paystack REST client
│   ├── progress.ts               # Student progress computation
│   ├── utils.ts                  # Utility helpers (cn/tailwind-merge)
│   ├── xp.ts                     # XP awarding logic
│   └── legal.ts                  # Legal document content (terms, privacy, etc.)
├── models/                       # Mongoose data models
│   ├── User.ts                   # User (student, parent, educator, admin)
│   ├── Cohort.ts                 # Learning cohorts
│   ├── Curriculum.ts             # Pillars, Modules, Lessons, LessonProgress
│   ├── Quiz.ts                   # Quizzes and QuizAttempts
│   ├── Assignment.ts             # Assignments and Submissions
│   ├── Gamification.ts           # XP events, Achievements, level computation
│   ├── Billing.ts                # Subscriptions, Payments, Plans
│   ├── Content.ts                # Testimonials, SiteContent, Notifications
│   ├── Attendance.ts             # Live class attendance records
│   ├── ProfilePicture.ts         # Avatar storage (binary in MongoDB)
│   └── index.ts                  # Barrel re-exports
├── scripts/                      # Utility scripts
│   └── seed.ts                   # Database seeder for sample data
├── public/                       # Static assets (images, videos, icons)
├── data/                         # Documentation files
├── .env.example                  # Environment variable template
├── .gitignore
├── components.json               # shadcn/ui configuration
├── CONVENTIONS.md                # Build conventions (READ FIRST)
├── middleware.ts                 # Edge middleware (route guarding)
├── next.config.mjs               # Next.js configuration
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── pnpm-workspace.yaml
└── tsconfig.tsbuildinfo
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: Node.js 20+ / LTS)
- **pnpm** 8+ (recommended package manager)
- **MongoDB** — either a local MongoDB instance or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- **Paystack** account (for payment processing — optional for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/TECHTUNE-I-T-SOLUTIONS/Heritage.git
cd Heritage

# Install dependencies
pnpm install

# Or with npm (if pnpm is unavailable)
npm install
```

### Environment Variables

1. Copy the example file:

```bash
cp .env.example .env.local
```

2. Fill in your values in `.env.local`:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/heritage-club` |
| `MONGODB_DB` | Database name (optional) | `heritage` |
| `AUTH_SECRET` | Secret for signing session JWTs (use a long random string in production) | A 64-char random hex |
| `NEXT_PUBLIC_APP_URL` | Public site URL | `https://heritageclub.app` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | `sk_test_...` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_test_...` |
| `PAYSTACK_CURRENCY` | Billing currency (NGN, GHS, ZAR, USD, KES, CAD) | `NGN` |
| `EDUCATOR_INVITE_CODE` | Code required for educator signups | `ED-HC-ONE` |
| `ADMIN_SETUP_CODE` | Code required for admin signups | `AD-HC-ONE` |
| `PAYSTACK_FX_RATE` | Optional manual FX rate (1 CAD = X) | `1200` |

> **Important:** The `.env.local` file is git-ignored. Never commit real environment variables.

### Running the Application

```bash
# Start the development server
pnpm dev

# Or with npm
npm run dev
```

The application will be available at `http://localhost:3000`.

### Seeding the Database

The seed script populates MongoDB with realistic sample data:

```bash
# Run the seed script (requires MONGODB_URI in .env.local)
pnpm seed

# Or with tsx directly
npx tsx scripts/seed.ts
```

The seed creates:

- 1 admin (`admin@heritageclub.app`)
- 3 educators (Zainab Bello, Kwame Mensah, Thandiwe Ndlovu)
- 3 cohorts (e.g., `HC-09-12-A`)
- 2 parents (Chinedu Eze, Fatima Diallo)
- 4 students (Ada Eze, Kofi Eze, Amara Johnson, etc.)
- 4 pillars with modules and lessons
- Quizzes, assignments, and submissions
- XP events, achievements, subscriptions, and payments
- Testimonials, site content, and notifications

**Default password for all seeded accounts:** `Passw0rd!`

### Building for Production

```bash
pnpm build    # Build the application
pnpm start    # Start the production server
```

### Linting

```bash
pnpm lint
```

---

## Architecture

### API Layer

All API routes live under `app/api/` and follow a consistent pattern using the Next.js App Router convention (`route.ts` files):

```typescript
import { requireAuth, ok, fail } from '@/lib/api'

export async function GET() {
  const auth = await requireAuth(['admin'])   // role-gated
  if (auth.response) return auth.response
  const { session } = auth                    // { userId, role, name, email }

  await connectToDatabase()
  // ... database logic with .lean()
  return ok(data)                              // -> { data }
}
```

**Key helpers in `lib/api.ts`:**

| Function | Description |
|----------|-------------|
| `ok(data, init?)` | Returns a successful JSON response: `{ data }` |
| `fail(message, status?, extra?)` | Returns an error response: `{ error: message, ... }` |
| `requireAuth(roles?)` | Validates the session and optionally restricts by role |

Every API handler calls `await connectToDatabase()` before querying MongoDB, uses `.lean()` to return plain objects, and serializes `_id` fields to strings.

### Data Models

The application uses **MongoDB** with **Mongoose** ODM. Models are organized in `models/`:

| Model | Purpose |
|-------|---------|
| `User` | Student, parent, educator, and admin accounts |
| `Cohort` | Age/timezone-based learning groups (e.g., `HC-09-12-A`) |
| `Pillar` | Top-level curriculum category (Language, Stories, etc.) |
| `Module` | Grouped lessons under a pillar |
| `Lesson` | Individual structured content with resources |
| `LessonProgress` | Tracks student lesson completion |
| `Quiz` | Multiple-choice assessments |
| `QuizAttempt` | Student quiz submissions and scores |
| `Assignment` | Creative project briefs |
| `Submission` | Student assignment uploads and educator feedback |
| `XpEvent` | Log of XP earned, by source |
| `Achievement` | Earned badges/titles for students |
| `Subscription` | Recurring billing records |
| `Payment` | Individual payment transactions |
| `Testimonial` | Published student/family stories |
| `SiteContent` | Editable key-value site configuration |
| `Notification` | System notifications per user |
| `Attendance` | Live class attendance records |
| `ProfilePicture` | Avatar images stored as binary |

### Authentication & Authorization

- **Password hashing:** `bcryptjs` (10 rounds)
- **Session tokens:** JWT signed with `jose` (HS256), 30-day expiry
- **Session storage:** HTTP-only cookie named `hc_session`
- **Edge middleware:** Lightweight cookie presence check + redirect for `/dashboard` and auth pages (`middleware.ts`)
- **Role-based guards:** Each API handler uses `requireAuth(['role'])` to enforce permissions
- **Staff access control:** Educator and admin signups require invite/setup codes

### Client-Side Data Fetching

Client components use a unified data-fetching pattern:

```typescript
import { useApi, apiPost, apiPatch, apiDelete } from '@/lib/client'

const { data, loading, error, refetch } = useApi<MyType>('/api/endpoint')
```

- `data` is automatically unwrapped (returns the `data` property from `{ data }` responses)
- `loading` state shows `<SkeletonCards />` or `<Skeleton />`
- `error` state shows `<EmptyState />` with retry option
- `refetch()` can be called imperatively after mutations

### Enrollment & Payment Flow

```
User visits /enroll
  → Creates parent/student account (subscription = "incomplete")
  → Redirected to Paystack checkout via /api/payments/paystack/initialize
  → Paystack callback hits /payment/callback
  → /api/payments/paystack/verify confirms the transaction
  → Subscription updated to "active"
  → User redirected to /dashboard/<role>
```

### Gamification

- Lessons award 50 XP, quizzes award up to 100 XP, assignments award 150 XP
- XP → level = `floor(xp / 500) + 1`
- Streaks track consecutive days of activity
- Leaderboard shows cohort-wide and global rankings

---

## Payment Integration

The payment flow uses **Paystack** as the payment processor:

1. After enrollment, a subscription is created with `status: 'incomplete'`
2. The parent is redirected to Paystack to complete payment
3. On success, the Paystack callback verifies the transaction at `/api/payments/paystack/verify`
4. The subscription is updated to `status: 'active'` with the 30-day billing period
5. The user is redirected to their dashboard

**Currency conversion:** Plans are priced in CAD. Paystack charges in the configured currency (`PAYSTACK_CURRENCY`, e.g. NGN). The `lib/fx.ts` module converts prices using:
1. Live exchange rates from `open.er-api.com`
2. Fallback static rates (CAD → NGN/GHS/ZAR/KES/USD)
3. Optional `PAYSTACK_FX_RATE` environment override

Paystack amounts are sent in the smallest currency unit (subunits), so the converted amount is multiplied by 100. Zero-decimal currencies (NGN, KES, JPY, KRW, VND) are rounded to whole units.

---

## Development Conventions

This project follows strict conventions documented in [`CONVENTIONS.md`](./CONVENTIONS.md). Key points:

### Styling

- Use Tailwind CSS design tokens only (`bg-background`, `text-foreground`, etc.)
- No hardcoded hex colors — use semantic palette with opacity
- Light + dark mode support via CSS custom properties in `app/globals.css`
- Mobile-first and fully responsive
- Headings use `font-serif`; monospace labels use `font-mono`
- Prefer `rounded-xl` / `rounded-2xl` for card radii

### UI Kit

Components are built on top of reusable primitives in `@/components/ui`:

| Category | Components |
|----------|-----------|
| **Kit** | `PageHeading`, `Card`, `SectionTitle`, `StatCard`, `Badge` (tone: neutral\|success\|warning\|error\|info\|accent), `ProgressBar`, `EmptyState`, `Skeleton`, `SkeletonCards` |
| **Interactive** | `DataTable`, `Tabs`, `Modal`, `useToast`, `ToastProvider` |
| **Form** | `Field`, `Input`, `Select`, `Textarea`, `FileUploader` |

### API Pattern

```typescript
// Every handler starts with:
await connectToDatabase()
// Use .lean() for plain objects, serialize _id to strings
// Return with ok() / fail() helpers
```

**Never trust client role** — always scope queries by `session.userId` and `session.role`.

### Client Pattern

```typescript
const { data, loading, error, refetch } = useApi<T>('/api/endpoint')
// While loading → show SkeletonCards / Skeleton
// On error → show EmptyState with retry
// On empty → show EmptyState
```

### Dashboard Structure

- Each role has its own layout at `app/dashboard/<role>/layout.tsx`
- The layout renders `<DashboardShell role user>` — **pages should NOT wrap themselves in `DashboardShell` again**
- Pages render only inner content (PageHeading + cards/tables)
- Pages fetch real data from their role-specific API
- No hardcoded/mock arrays in pages

### Database Conventions

- Always call `await connectToDatabase()` at the start of every API handler
- Convert Mongo docs to plain objects with `.lean()`
- Serialize `_id` and dates to strings before returning
- Mongoose connection is cached globally to survive hot reloads

---

## Legal Documents

The application includes four professionally drafted legal documents (sourced from `lib/legal.ts`):

| Document | Route | Description |
|----------|-------|-------------|
| Terms of Service | `/terms` | User agreements, eligibility, billing, cancellations |
| Privacy Policy | `/privacy` | Data collection, usage, user rights (COPPA/GDPR/PIPEDA) |
| Refund & Cancellation | `/refund` | Cancellation policy, refund process, statutory rights |
| Cookie Policy | `/cookies` | Cookie usage, management, third-party policies |

> These documents are provided as a strong starting point and should be reviewed by qualified legal counsel before launch.

---

## Resources

- **MVP Specification:** [data/heritage-app-document-2931b1.docx](./data/heritage-app-document-2931b1.docx) — Full requirements and feature breakdown
- **Build Conventions:** [CONVENTIONS.md](./CONVENTIONS.md) — Read-first development guide
- **Seed Script:** [scripts/seed.ts](./scripts/seed.ts) — Database sample data generator
- **Environment Template:** [.env.example](./.env.example)
- **Parent Project:** [Damzy Next Gen](https://damzynextgen.app)

---

## License

This software is proprietary to **Heritage Club, operated by Damzy Next Gen**. All rights reserved.

© 2026 Heritage Club. All rights reserved.