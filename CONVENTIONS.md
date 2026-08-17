# Heritage Club — Build Conventions (READ FIRST)

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, MongoDB via Mongoose.

## Design tokens (Tailwind classes only — defined in app/globals.css)
Backgrounds: `bg-background`, `bg-card`, `bg-secondary`, `bg-muted`, `bg-primary`, `bg-accent`.
Text: `text-foreground`, `text-muted-foreground`, `text-primary-foreground`, `text-secondary-foreground`, `text-accent-foreground`.
Borders: `border-border`. Radius: prefer `rounded-xl` / `rounded-2xl`. Headings use `font-serif`.
Semantic colours via tailwind palette with opacity, e.g. `text-emerald-600`, `bg-red-500/15`. Support light + dark automatically (tokens flip). Never hardcode hex. Mobile-first & responsive always.

## Database & models
```ts
import { connectToDatabase } from '@/lib/db'
import { User, Cohort, Pillar, Module, Lesson, LessonProgress, Quiz, QuizAttempt,
  Assignment, Submission, XpEvent, Achievement, Subscription, Payment, Testimonial,
  SiteContent, Notification, PLANS, levelFromXp } from '@/models'
```
Always `await connectToDatabase()` at the start of every API handler before querying.
Convert Mongo docs to plain objects with `.lean()` and serialize `_id`/dates to strings before returning.

## API route pattern (app/api/.../route.ts)
```ts
import { requireAuth, ok, fail } from '@/lib/api'
export async function GET() {
  const auth = await requireAuth(['admin'])          // or ['student'], ['parent'], etc. Omit arg = any logged-in user
  if (auth.response) return auth.response
  const { session } = auth                           // session.userId, session.role, session.name, session.email
  await connectToDatabase()
  ...
  return ok(data)                                    // -> { data }
}
```
Errors: `return fail('message', 400)`. Never trust client role — always scope queries by session.

## Client data fetching (pages are 'use client')
```ts
import { useApi, apiPost, apiPatch, apiDelete } from '@/lib/client'
const { data, loading, error, refetch } = useApi<MyType>('/api/...')   // data is already unwrapped
```
While `loading` show `<SkeletonCards />` / `<Skeleton />`. On empty show `<EmptyState />`. On `error` show a retry.

## UI kit
- `@/components/ui/kit`: `PageHeading`, `Card`, `SectionTitle`, `StatCard`, `Badge` (tone: neutral|success|warning|error|info|accent), `ProgressBar` (tone default|accent), `EmptyState`, `Skeleton`, `SkeletonCards`.
- `@/components/ui/interactive`: `DataTable` (props `columns: Column<T>[]` where Column={key,header,render?,className?}, `rows: T[]`, `empty?`), `Tabs`, `Modal`, `useToast`.
- `@/components/ui/form`: `Field`, `Input`, `Select`, `Textarea`, `FileUploader`.
- `@/components/logo`: `Logo`.
- `@/lib/format`: `formatCurrency`, `formatDate`, `initials`, `levelFromXp`, `levelProgress`, `PLAN_LIST`.

## Dashboard structure
- Route guard + chrome lives in `app/dashboard/<role>/layout.tsx` (server component). It renders `<DashboardShell role user>`.
- Therefore each `page.tsx` renders ONLY its inner content (PageHeading + cards/tables). Do NOT wrap pages in DashboardShell again.
- Pages fetch real data from their role API. No hardcoded/mock arrays in pages.

## Plans (from spec, CAD monthly)
individual $59 (1 child) · family2 $109 (2) · family3 $129 (3) · family4 $149 (4).

## Sample/seed data
Realistic African-heritage content (e.g. student "Amara Johnson", cohort "HC-09-12-A", module "Yoruba Language & Identity", next class "Saturday — 6:00 PM"). No lorem ipsum. Seed populates the DB; the UI reads from DB (not hardcoded).
