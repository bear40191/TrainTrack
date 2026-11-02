# TrainTrack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hybrid mobile app (iOS/Android/Web) for internship work logging with a 4-role sequential approval workflow (trainee → mentor → lead → admin).

**Architecture:** Next.js 14 App Router as the web layer, wrapped with Capacitor for native iOS/Android. Supabase provides Auth, PostgreSQL database with RLS, Storage for file uploads, Edge Functions for push notifications, and Realtime for live status updates. Zustand for client state, Tailwind CSS + shadcn/ui for styling.

**Tech Stack:** Next.js 14 · TypeScript · Capacitor 6 · Supabase (Auth, DB, Storage, Realtime, Edge Functions) · Tailwind CSS · shadcn/ui · Zustand · Recharts · Lucide React

**Spec:** `docs/superpowers/specs/2026-11-02-traintrack-design.md`

## Global Constraints

- TypeScript strict mode everywhere — no `any` types
- Next.js App Router with `"use client"` only where needed (forms, interactive UI)
- All Capacitor native calls wrapped in `services/native/` with browser fallbacks
- Supabase RLS enforced on every table — never trust client-side role checks alone
- Mobile-first responsive design; min touch target 44×44px
- All dates stored as UTC, displayed in user's locale
- Thai language UI labels; code identifiers in English

## Review Focus

1. **Trainee edits a work log while mentor is reviewing it** — optimistic UI must not lose the mentor's approval action; the DB status should win via RLS (trainee can only UPDATE when status is `draft` or `revision_required`)
2. **File upload exceeds Supabase Storage free-tier limit (1 GB)** — upload service must validate file size client-side (max 5 MB per file, max 5 files per log) and show a clear error before uploading
3. **Push notification token expires or user denies permission** — notification service must gracefully degrade; the app must still work without push, and stale tokens must not cause Edge Function errors
4. **Mentor or lead has no trainees assigned** — dashboard queries must handle empty result sets without crashing or showing misleading "0%" stats
5. **Network loss mid-approval** — the approve/reject action must retry or show a clear failure state; it must not silently drop the action

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout: fonts, providers, metadata
│   ├── (auth)/
│   │   ├── layout.tsx                # Auth layout (no tab bar)
│   │   ├── login/page.tsx            # Login page
│   │   └── register/page.tsx         # Register page
│   ├── (main)/
│   │   ├── layout.tsx                # Main layout with TabBar + auth guard
│   │   ├── dashboard/page.tsx        # Role-aware dashboard
│   │   ├── work-logs/
│   │   │   ├── page.tsx              # List work logs (trainee view)
│   │   │   ├── new/page.tsx          # Create new work log
│   │   │   └── [id]/page.tsx         # Detail / edit work log
│   │   ├── reviews/
│   │   │   ├── page.tsx              # Pending reviews list (mentor/lead)
│   │   │   └── [id]/page.tsx         # Review detail with approve/reject
│   │   ├── team/page.tsx             # Team overview (mentor/lead)
│   │   ├── admin/
│   │   │   ├── users/page.tsx        # User management
│   │   │   └── teams/page.tsx        # Team management
│   │   ├── notifications/page.tsx    # Notification list
│   │   └── profile/page.tsx          # User profile
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── layout/
│   │   ├── TabBar.tsx                # Bottom tab navigation
│   │   ├── Header.tsx                # Page header with back button
│   │   └── RoleGuard.tsx             # Conditional render by role
│   ├── work-log/
│   │   ├── WorkLogForm.tsx           # Create/edit form
│   │   ├── WorkLogCard.tsx           # List item card
│   │   ├── StatusBadge.tsx           # Color-coded status badge
│   │   └── AttachmentPicker.tsx      # File/image picker
│   ├── review/
│   │   ├── ReviewActions.tsx         # Approve/reject buttons + comment
│   │   ├── ApprovalTimeline.tsx      # Vertical timeline of actions
│   │   └── CommentThread.tsx         # Comments section
│   └── dashboard/
│       ├── StatCard.tsx              # Single stat with icon
│       ├── WeeklyChart.tsx           # Bar chart (Recharts)
│       └── TraineeList.tsx           # List of trainees with status
├── services/
│   ├── supabase.ts                   # Supabase client (browser + server)
│   ├── auth.service.ts               # signIn, signUp, signOut, getSession
│   ├── worklog.service.ts            # CRUD for work_logs
│   ├── review.service.ts             # approve, requestRevision
│   ├── upload.service.ts             # upload/delete files to Supabase Storage
│   ├── notification.service.ts       # in-app notification queries
│   ├── team.service.ts               # team & user queries
│   └── native/
│       ├── camera.ts                 # Camera plugin wrapper
│       ├── push.ts                   # Push Notifications wrapper
│       └── platform.ts              # isNative, getPlatform
├── hooks/
│   ├── useAuth.ts                    # Auth state + role
│   ├── useWorkLogs.ts                # Fetch + realtime work logs
│   ├── useReviews.ts                 # Fetch pending reviews
│   ├── useNotifications.ts           # Notification count + list
│   └── useRealtime.ts               # Generic Supabase Realtime hook
├── store/
│   ├── authStore.ts                  # Zustand: user, role, session
│   └── notificationStore.ts         # Zustand: unread count
├── lib/
│   ├── types.ts                      # All TypeScript interfaces & enums
│   ├── constants.ts                  # Status values, role names, limits
│   └── utils.ts                      # Date formatting, role checks
└── theme/
    └── globals.css                   # Tailwind + CSS variables
supabase/
├── migrations/
│   ├── 001_create_tables.sql
│   ├── 002_rls_policies.sql
│   └── 003_edge_functions_setup.sql
└── functions/
    └── send-notification/index.ts
capacitor.config.ts
```

---

### Task 1: Project Scaffolding & Core Config

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `capacitor.config.ts`
- Create: `src/app/layout.tsx`, `src/theme/globals.css`
- Create: `src/lib/types.ts`, `src/lib/constants.ts`, `src/lib/utils.ts`
- Create: `src/services/supabase.ts`
- Create: `.env.local.example`

**Interfaces:**
- Consumes: nothing (first task)
- Produces:
  - `src/lib/types.ts` — exports `Role`, `WorkLogStatus`, `Profile`, `WorkLog`, `Attachment`, `Comment`, `ApprovalAction`, `Notification`, `Team` interfaces
  - `src/lib/constants.ts` — exports `ROLES`, `WORK_LOG_STATUSES`, `CATEGORIES`, `MAX_FILE_SIZE`, `MAX_FILES_PER_LOG`
  - `src/lib/utils.ts` — exports `cn()`, `formatDate()`, `formatRelativeTime()`, `getRoleLabel()`, `getStatusColor()`
  - `src/services/supabase.ts` — exports `supabase` client instance and `Database` type

- [ ] **Step 1: Scaffold Next.js project**

Run: `npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` in `d:\TrainTrack`

- [ ] **Step 2: Install dependencies**

Run:
```
npm install @supabase/supabase-js @supabase/ssr zustand lucide-react recharts date-fns
npm install -D @capacitor/cli
```

- [ ] **Step 3: Install shadcn/ui**

Run: `npx shadcn@latest init` — select default style, neutral color, CSS variables: yes.
Then: `npx shadcn@latest add button card input textarea select badge dialog toast tabs avatar dropdown-menu separator sheet`

- [ ] **Step 4: Create `src/lib/types.ts`**

Define all interfaces matching the spec's data model:
```typescript
export type Role = 'trainee' | 'mentor' | 'lead' | 'admin';
export type WorkLogStatus = 'draft' | 'pending_mentor' | 'pending_lead' | 'revision_required' | 'approved';
export type Category = 'development' | 'design' | 'meeting' | 'research' | 'other';
export type ApprovalActionType = 'submit' | 'approve' | 'request_revision';

export interface Profile { id: string; full_name: string; email: string; role: Role; team_id: string | null; mentor_id: string | null; avatar_url: string | null; created_at: string; }
export interface Team { id: string; name: string; department: string; lead_id: string; created_at: string; }
export interface WorkLog { id: string; trainee_id: string; work_date: string; title: string; description: string; hours_spent: number; status: WorkLogStatus; category: Category; revision_count: number; submitted_at: string | null; approved_at: string | null; created_at: string; updated_at: string; trainee?: Profile; attachments?: Attachment[]; comments?: Comment[]; approval_actions?: ApprovalAction[]; }
export interface Attachment { id: string; work_log_id: string; file_name: string; file_url: string; file_type: 'image' | 'document' | 'other'; file_size: number; created_at: string; }
export interface Comment { id: string; work_log_id: string; author_id: string; content: string; is_system: boolean; created_at: string; author?: Profile; }
export interface ApprovalAction { id: string; work_log_id: string; actor_id: string; action: ApprovalActionType; from_status: WorkLogStatus; to_status: WorkLogStatus; note: string | null; created_at: string; actor?: Profile; }
export interface AppNotification { id: string; user_id: string; title: string; body: string; type: 'approval' | 'revision' | 'comment'; reference_id: string; is_read: boolean; created_at: string; }
```

- [ ] **Step 5: Create `src/lib/constants.ts`**

```typescript
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES_PER_LOG = 5;
export const ROLE_LABELS: Record<Role, string> = { trainee: 'นักศึกษาฝึกงาน', mentor: 'พี่เลี้ยง', lead: 'หัวหน้าพี่เลี้ยง', admin: 'ผู้ดูแลระบบ' };
export const STATUS_LABELS: Record<WorkLogStatus, string> = { draft: 'แบบร่าง', pending_mentor: 'รอพี่เลี้ยงตรวจ', pending_lead: 'รอหัวหน้าอนุมัติ', revision_required: 'ต้องแก้ไข', approved: 'อนุมัติแล้ว' };
export const CATEGORY_LABELS: Record<Category, string> = { development: 'พัฒนาระบบ', design: 'ออกแบบ', meeting: 'ประชุม', research: 'ศึกษาข้อมูล', other: 'อื่นๆ' };
```

- [ ] **Step 6: Create `src/lib/utils.ts`**

Export `cn()` (clsx + tailwind-merge), `formatDate(date: string): string` using date-fns Thai locale, `formatRelativeTime(date: string): string`, `getStatusColor(status: WorkLogStatus): string` returning Tailwind color classes matching spec badge colors.

- [ ] **Step 7: Create `src/services/supabase.ts`**

Export `createClient()` using `@supabase/ssr` for Next.js App Router — both browser client and server client helpers. Read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env.

- [ ] **Step 8: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 9: Create `capacitor.config.ts`**

```typescript
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.traintrack.app',
  appName: 'TrainTrack',
  webDir: 'out',
  server: { androidScheme: 'https' }
};
export default config;
```

- [ ] **Step 10: Update `src/app/layout.tsx`**

Set Thai metadata: `title: 'TrainTrack - ระบบบันทึกงานฝึกงาน'`, import globals.css, set `lang="th"`.

- [ ] **Step 11: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 12: Commit**

```
git init && git add -A && git commit -m "chore: scaffold Next.js + Capacitor + Supabase project with types and constants"
```

---

### Task 2: Database Schema & RLS Policies

**Files:**
- Create: `supabase/migrations/001_create_tables.sql`
- Create: `supabase/migrations/002_rls_policies.sql`

**Interfaces:**
- Consumes: Type definitions from Task 1 (`src/lib/types.ts`) — SQL must match these interfaces exactly
- Produces: All database tables, indexes, and RLS policies that services in Tasks 3-8 will query

- [ ] **Step 1: Create `supabase/migrations/001_create_tables.sql`**

SQL creates these tables in order (respecting FK dependencies):

1. `teams` — `id uuid PK default gen_random_uuid()`, `name text NOT NULL`, `department text`, `lead_id uuid REFERENCES auth.users`, `created_at timestamptz default now()`
2. `profiles` — `id uuid PK REFERENCES auth.users ON DELETE CASCADE`, `full_name text NOT NULL`, `email text NOT NULL`, `role text NOT NULL CHECK (role IN ('trainee','mentor','lead','admin')) DEFAULT 'trainee'`, `team_id uuid REFERENCES teams`, `mentor_id uuid REFERENCES profiles`, `avatar_url text`, `created_at timestamptz default now()`
3. `work_logs` — all columns per spec, `trainee_id REFERENCES profiles`, status CHECK constraint on the 5 values, `category` CHECK on 5 values, defaults: `status='draft'`, `revision_count=0`, `hours_spent` CHECK > 0
4. `attachments` — FK to `work_logs ON DELETE CASCADE`, `file_type` CHECK
5. `comments` — FK to `work_logs` and `profiles`, `is_system boolean DEFAULT false`
6. `approval_actions` — FK to `work_logs` and `profiles`, `action` CHECK, `from_status`/`to_status` CHECK
7. `notifications` — FK to `auth.users`, `type` CHECK, `is_read boolean DEFAULT false`

Create indexes on: `work_logs(trainee_id, status)`, `work_logs(work_date)`, `comments(work_log_id)`, `approval_actions(work_log_id)`, `notifications(user_id, is_read)`, `profiles(mentor_id)`, `profiles(team_id)`.

Create trigger function `handle_new_user()` that auto-creates a `profiles` row when a new auth.users row is inserted (via Supabase Auth trigger `on_auth_user_created`).

- [ ] **Step 2: Create `supabase/migrations/002_rls_policies.sql`**

Enable RLS on all tables. Policies:

**profiles:**
- SELECT: authenticated users can read own profile, mentor can read trainees where `mentor_id = auth.uid()`, lead can read profiles in own team, admin reads all
- UPDATE: users can update own `full_name`, `avatar_url`; admin can update any

**work_logs:**
- SELECT: trainee sees own; mentor sees where `trainee_id` IN trainees with `mentor_id = auth.uid()`; lead sees where status IN (`pending_lead`,`approved`) AND trainee's team matches lead's team; admin sees all
- INSERT: trainee can insert with `trainee_id = auth.uid()` and `status = 'draft'`
- UPDATE: trainee can update own where status IN (`draft`, `revision_required`); mentor/lead update status only via approval_actions (handled by DB function)
- DELETE: trainee can delete own where status = `draft`

**attachments:**
- SELECT: follows work_logs visibility
- INSERT: trainee can insert for own work_logs where status IN (`draft`, `revision_required`)
- DELETE: trainee can delete for own work_logs where status IN (`draft`, `revision_required`)

**comments:**
- SELECT: follows work_logs visibility
- INSERT: any authenticated user who can SELECT the parent work_log

**approval_actions:**
- SELECT: follows work_logs visibility
- INSERT: via DB function only (see Task 5)

**notifications:**
- SELECT: own only (`user_id = auth.uid()`)
- UPDATE: own only (mark as read)

- [ ] **Step 3: Verify SQL syntax**

Review both files for syntax correctness, FK order, and CHECK constraint values matching `src/lib/types.ts`.

- [ ] **Step 4: Commit**

```
git add supabase/ && git commit -m "feat(db): add database schema, indexes, and RLS policies"
```

---

### Task 3: Auth System

**Files:**
- Create: `src/services/auth.service.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/store/authStore.ts`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(main)/layout.tsx`
- Create: `src/components/layout/TabBar.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/RoleGuard.tsx`
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `supabase` client from Task 1, `Profile` and `Role` types from Task 1
- Produces:
  - `auth.service.ts` — exports `signIn(email: string, password: string): Promise<Profile>`, `signUp(data: { email: string; password: string; full_name: string; role: Role }): Promise<Profile>`, `signOut(): Promise<void>`, `getSession(): Promise<Session | null>`, `getProfile(userId: string): Promise<Profile>`
  - `authStore.ts` — exports `useAuthStore` with `{ user: Profile | null; isLoading: boolean; setUser; clearUser }`
  - `useAuth()` — returns `{ user, role, isLoading, signIn, signUp, signOut }`
  - `<TabBar />` — renders role-aware bottom navigation
  - `<RoleGuard roles={Role[]}>{children}</RoleGuard>` — renders children only if user's role matches

- [ ] **Step 1: Create `src/store/authStore.ts`**

Zustand store with `user: Profile | null`, `isLoading: boolean`, `setUser(profile: Profile)`, `clearUser()`.

- [ ] **Step 2: Create `src/services/auth.service.ts`**

Implement `signIn` (calls `supabase.auth.signInWithPassword`, then fetches profile), `signUp` (calls `supabase.auth.signUp` with `full_name` in metadata, the trigger creates the profile row), `signOut`, `getSession`, `getProfile` (select from `profiles` where `id = userId`).

- [ ] **Step 3: Create `src/hooks/useAuth.ts`**

Hook that on mount checks session via `supabase.auth.getSession()`, subscribes to `onAuthStateChange`, updates `authStore`. Returns `{ user, role: user?.role, isLoading, signIn, signUp, signOut }`.

- [ ] **Step 4: Create `src/middleware.ts`**

Next.js middleware that checks for Supabase session cookie. Redirect unauthenticated users from `/(main)/*` to `/login`. Redirect authenticated users from `/(auth)/*` to `/dashboard`.

- [ ] **Step 5: Create `src/app/(auth)/layout.tsx`**

Simple centered layout, no tab bar. Logo at top.

- [ ] **Step 6: Create `src/app/(auth)/login/page.tsx`**

`"use client"`. Form with email + password inputs + submit button. Call `useAuth().signIn`. Show toast on error. Redirect to `/dashboard` on success. Link to register page.

- [ ] **Step 7: Create `src/app/(auth)/register/page.tsx`**

`"use client"`. Form with full_name, email, password, role (select from trainee/mentor/lead — admin is assigned manually). Call `useAuth().signUp`. Redirect to `/login` with success message.

- [ ] **Step 8: Create `src/components/layout/TabBar.tsx`**

`"use client"`. Bottom tab bar using `usePathname()` for active state. Tabs differ by role:
- trainee: หน้าหลัก, บันทึกงาน, งานของฉัน, โปรไฟล์
- mentor: หน้าหลัก, รอตรวจ, นักศึกษา, โปรไฟล์
- lead: หน้าหลัก, รออนุมัติ, ภาพรวม, โปรไฟล์
- admin: Dashboard, ผู้ใช้, ทีม, ตั้งค่า

Use Lucide icons. Safe area padding at bottom.

- [ ] **Step 9: Create `src/components/layout/Header.tsx`**

Props: `title: string`, `showBack?: boolean`, `rightAction?: ReactNode`. Renders page title with optional back button and notification bell (with unread count badge).

- [ ] **Step 10: Create `src/components/layout/RoleGuard.tsx`**

`"use client"`. Props: `roles: Role[]`, `children: ReactNode`, `fallback?: ReactNode`. Uses `useAuth()` to conditionally render children if user's role is in `roles`.

- [ ] **Step 11: Create `src/app/(main)/layout.tsx`**

`"use client"`. Wraps children with auth check (redirect to login if not authenticated). Renders `<Header />` + `{children}` + `<TabBar />`. Padding for safe areas.

- [ ] **Step 12: Verify login/register flow**

Run: `npm run dev`, navigate to `/login`. Verify form renders, input validation works, and unauthenticated redirect works.

- [ ] **Step 13: Commit**

```
git add -A && git commit -m "feat(auth): add login, register, auth middleware, and role-aware tab navigation"
```

---

### Task 4: Work Log CRUD (Trainee)

**Files:**
- Create: `src/services/worklog.service.ts`
- Create: `src/hooks/useWorkLogs.ts`
- Create: `src/components/work-log/WorkLogForm.tsx`
- Create: `src/components/work-log/WorkLogCard.tsx`
- Create: `src/components/work-log/StatusBadge.tsx`
- Create: `src/app/(main)/work-logs/page.tsx`
- Create: `src/app/(main)/work-logs/new/page.tsx`
- Create: `src/app/(main)/work-logs/[id]/page.tsx`

**Interfaces:**
- Consumes: `supabase` client, `WorkLog`, `WorkLogStatus`, `Category` types, `useAuth()` hook
- Produces:
  - `worklog.service.ts` — exports `getWorkLogs(traineeId: string, filters?: { status?: WorkLogStatus }): Promise<WorkLog[]>`, `getWorkLog(id: string): Promise<WorkLog>` (includes attachments, comments, approval_actions), `createWorkLog(data: Omit<WorkLog, 'id'|'created_at'|...>): Promise<WorkLog>`, `updateWorkLog(id: string, data: Partial<WorkLog>): Promise<WorkLog>`, `deleteWorkLog(id: string): Promise<void>`, `submitWorkLog(id: string): Promise<WorkLog>` (changes status from draft→pending_mentor, sets submitted_at)
  - `useWorkLogs(filters?)` — returns `{ workLogs, isLoading, error, refetch }`
  - `<StatusBadge status={WorkLogStatus} />` — colored badge per spec
  - `<WorkLogCard workLog={WorkLog} onClick />` — card showing date, title, status, comment count
  - `<WorkLogForm workLog?={WorkLog} onSubmit onSaveDraft />` — form with all fields

- [ ] **Step 1: Create `src/services/worklog.service.ts`**

Implement all CRUD functions. `getWorkLogs` orders by `work_date DESC`. `getWorkLog` uses `.select('*, attachments(*), comments(*, author:profiles(*)), approval_actions(*, actor:profiles(*))')`. `submitWorkLog` updates status to `pending_mentor` and sets `submitted_at` to now. Only allow submit when status is `draft` or `revision_required`.

- [ ] **Step 2: Create `src/hooks/useWorkLogs.ts`**

Hook using `useState` + `useEffect`. Calls `getWorkLogs` with trainee's ID. Accepts optional `status` filter. Returns `{ workLogs, isLoading, error, refetch }`.

- [ ] **Step 3: Create `src/components/work-log/StatusBadge.tsx`**

Uses shadcn `<Badge>` with `variant` mapped from status. Colors: draft=secondary, pending_mentor=warning(yellow), pending_lead=info(blue), revision_required=destructive(orange), approved=success(green). Label from `STATUS_LABELS`.

- [ ] **Step 4: Create `src/components/work-log/WorkLogCard.tsx`**

Card showing: `work_date` (formatted), `title`, `category` label, `hours_spent`h, `<StatusBadge>`, comment count icon. `onClick` navigates to detail. If `revision_required`, show orange left border.

- [ ] **Step 5: Create `src/components/work-log/WorkLogForm.tsx`**

`"use client"`. Props: `workLog?: WorkLog` (for edit mode), `onSubmit`, `onSaveDraft`. Fields: `work_date` (date input, default today), `title` (text), `description` (textarea, min 10 chars), `category` (select), `hours_spent` (number, 0.5-24 step 0.5). Two buttons: "บันทึกแบบร่าง" (secondary) and "ส่งอนุมัติ" (primary). Validate before submit. If editing a `revision_required` log, show the latest rejection comment at top as a warning alert.

- [ ] **Step 6: Create `src/app/(main)/work-logs/page.tsx`**

`"use client"`. List view with status filter tabs (ทั้งหมด | แบบร่าง | รออนุมัติ | ต้องแก้ไข | อนุมัติแล้ว). Renders `<WorkLogCard>` list. Empty state message per filter. FAB or header button to create new. Pull-to-refresh pattern.

- [ ] **Step 7: Create `src/app/(main)/work-logs/new/page.tsx`**

`"use client"`. Renders `<WorkLogForm>`. On save draft: call `createWorkLog` with status `draft`, navigate to `/work-logs`. On submit: call `createWorkLog` then `submitWorkLog`, navigate to `/work-logs` with success toast.

- [ ] **Step 8: Create `src/app/(main)/work-logs/[id]/page.tsx`**

`"use client"`. Fetch work log by ID via `getWorkLog`. Show full detail: title, date, category, hours, description, attachments (preview images / file links), approval timeline (`<ApprovalTimeline>` from Task 5), comments thread. If status is `draft` or `revision_required`, show edit button. If `draft`, show delete button with confirmation dialog.

- [ ] **Step 9: Verify work log CRUD**

Run: `npm run dev`. Create a work log as draft, edit it, submit it. Verify status changes and list filtering.

- [ ] **Step 10: Commit**

```
git add -A && git commit -m "feat(worklog): add work log CRUD, form, list, and detail pages for trainee"
```

---

### Task 5: Approval Workflow (Mentor & Lead)

**Files:**
- Create: `src/services/review.service.ts`
- Create: `src/hooks/useReviews.ts`
- Create: `src/components/review/ReviewActions.tsx`
- Create: `src/components/review/ApprovalTimeline.tsx`
- Create: `src/components/review/CommentThread.tsx`
- Create: `src/app/(main)/reviews/page.tsx`
- Create: `src/app/(main)/reviews/[id]/page.tsx`
- Create: `supabase/migrations/003_approval_functions.sql`

**Interfaces:**
- Consumes: `supabase` client, `WorkLog`, `ApprovalAction`, `Comment` types, `useAuth()`, `getWorkLog()` from Task 4
- Produces:
  - `review.service.ts` — exports `getPendingReviews(userId: string, role: Role): Promise<WorkLog[]>`, `approveWorkLog(workLogId: string, actorId: string, role: Role, note?: string): Promise<void>`, `requestRevision(workLogId: string, actorId: string, role: Role, note: string): Promise<void>`, `addComment(workLogId: string, authorId: string, content: string): Promise<Comment>`, `getComments(workLogId: string): Promise<Comment[]>`
  - `<ReviewActions workLogId onAction />` — approve/reject buttons with required comment on reject
  - `<ApprovalTimeline actions={ApprovalAction[]} />` — vertical timeline
  - `<CommentThread workLogId />` — list of comments with input

- [ ] **Step 1: Create `supabase/migrations/003_approval_functions.sql`**

Create PostgreSQL functions for atomic status transitions:

```sql
-- approve_work_log(p_work_log_id uuid, p_actor_id uuid, p_role text, p_note text)
-- Validates: mentor can only approve pending_mentor, lead can only approve pending_lead
-- Inserts into approval_actions, updates work_logs status
-- If mentor approves: status → pending_lead
-- If lead approves: status → approved, set approved_at
-- Inserts system comment

-- request_revision(p_work_log_id uuid, p_actor_id uuid, p_role text, p_note text)
-- Validates: mentor can request_revision on pending_mentor, lead on pending_lead
-- Status → revision_required, increment revision_count
-- Inserts into approval_actions with note
-- Inserts system comment with the note
```

Both functions SECURITY DEFINER with explicit search_path to bypass RLS for the atomic update.

- [ ] **Step 2: Create `src/services/review.service.ts`**

`getPendingReviews`: for mentor, query `work_logs` where status=`pending_mentor` and trainee's `mentor_id = userId`, join profiles. For lead, query where status=`pending_lead` and trainee's `team_id` matches lead's team.

`approveWorkLog`: calls `supabase.rpc('approve_work_log', { ... })`.
`requestRevision`: calls `supabase.rpc('request_revision', { ... })`. `note` is required (min 5 chars).
`addComment`: insert into `comments` table.
`getComments`: select from `comments` where `work_log_id`, join author profile, order by `created_at ASC`.

- [ ] **Step 3: Create `src/hooks/useReviews.ts`**

Hook that calls `getPendingReviews(userId, role)`. Returns `{ reviews, isLoading, error, refetch, pendingCount }`.

- [ ] **Step 4: Create `src/components/review/ApprovalTimeline.tsx`**

Vertical timeline. Each node shows: actor name, action icon (✅/🔄/📤), action label, note (if any), timestamp. Most recent at top. Color-coded: green for approve, orange for revision, blue for submit.

- [ ] **Step 5: Create `src/components/review/CommentThread.tsx`**

`"use client"`. Props: `workLogId: string`. Fetches comments, displays as chat-style list (system comments styled differently — gray italic). Input field at bottom for adding new comment. Auto-scroll to bottom on new comment.

- [ ] **Step 6: Create `src/components/review/ReviewActions.tsx`**

`"use client"`. Props: `workLogId`, `currentStatus`, `onAction: () => void`. Shows two buttons: "✅ อนุมัติ" (green) and "❌ ส่งแก้ไข" (orange). Clicking reject opens a textarea modal requiring reason (min 5 chars). Confirmation dialog before approve. Both call respective service functions, show toast, call `onAction` to refresh parent.

- [ ] **Step 7: Create `src/app/(main)/reviews/page.tsx`**

`"use client"`. Wrapped in `<RoleGuard roles={['mentor','lead']}>`. List of pending work logs using `<WorkLogCard>` with trainee name shown. Badge showing total pending count. Sort by submitted_at ASC (oldest first). Empty state: "ไม่มีงานรอตรวจ 🎉"

- [ ] **Step 8: Create `src/app/(main)/reviews/[id]/page.tsx`**

`"use client"`. Wrapped in `<RoleGuard roles={['mentor','lead']}>`. Full work log detail (same layout as trainee detail) plus `<ReviewActions>` at bottom (sticky). Shows `<ApprovalTimeline>` and `<CommentThread>`. After approve/reject, redirect back to reviews list.

- [ ] **Step 9: Verify approval workflow**

Run: `npm run dev`. As trainee: create and submit work log. As mentor: see it in reviews, approve it. As lead: see it in reviews, approve it. Verify status transitions. Test rejection flow: reject as mentor, verify trainee sees revision_required, edit and resubmit.

- [ ] **Step 10: Commit**

```
git add -A && git commit -m "feat(review): add approval workflow with approve, reject, comments, and timeline"
```

---

### Task 6: File Upload (Attachments)

**Files:**
- Create: `src/services/upload.service.ts`
- Create: `src/services/native/camera.ts`
- Create: `src/services/native/platform.ts`
- Create: `src/components/work-log/AttachmentPicker.tsx`
- Modify: `src/components/work-log/WorkLogForm.tsx` — integrate AttachmentPicker

**Interfaces:**
- Consumes: `supabase` client, `Attachment` type, `MAX_FILE_SIZE`, `MAX_FILES_PER_LOG`
- Produces:
  - `upload.service.ts` — exports `uploadFile(workLogId: string, file: File): Promise<Attachment>`, `deleteFile(attachmentId: string, fileUrl: string): Promise<void>`, `getPublicUrl(path: string): string`
  - `native/camera.ts` — exports `takePhoto(): Promise<File | null>` (Capacitor Camera on native, file input on web)
  - `native/platform.ts` — exports `isNativePlatform(): boolean`, `getPlatform(): 'ios' | 'android' | 'web'`
  - `<AttachmentPicker workLogId existingAttachments onAttachmentsChange />` — file picker with preview grid

- [ ] **Step 1: Install Capacitor Camera plugin**

Run: `npm install @capacitor/camera @capacitor/core`

- [ ] **Step 2: Create `src/services/native/platform.ts`**

```typescript
import { Capacitor } from '@capacitor/core';
export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform() as 'ios' | 'android' | 'web';
```

- [ ] **Step 3: Create `src/services/native/camera.ts`**

On native: use `Camera.getPhoto()` with `resultType: CameraResultType.Uri`, convert to File. On web: fall back to `<input type="file" accept="image/*">`. Wrap in try-catch; return null if user cancels or permission denied.

- [ ] **Step 4: Create `src/services/upload.service.ts`**

`uploadFile`: validate file size (≤ `MAX_FILE_SIZE`), determine `file_type` from MIME, upload to Supabase Storage bucket `attachments` at path `{workLogId}/{uuid}-{fileName}`, insert row into `attachments` table, return `Attachment`. `deleteFile`: delete from Storage and `attachments` table. `getPublicUrl`: returns Supabase Storage public URL.

- [ ] **Step 5: Create `src/components/work-log/AttachmentPicker.tsx`**

`"use client"`. Shows grid of attachment thumbnails (images) / file icons (documents). "+" button opens action sheet: "ถ่ายรูป" (camera) / "เลือกไฟล์" (file picker). Max 5 files enforcement with count label. Each attachment has delete button (with confirmation). Shows upload progress. Validates file size on selection.

- [ ] **Step 6: Integrate AttachmentPicker into WorkLogForm**

Add `<AttachmentPicker>` below the description field in `WorkLogForm`. Pass `workLogId` (create the work log first as draft, then upload files). Show file count as "แนบไฟล์ (2/5)".

- [ ] **Step 7: Verify file upload**

Run: `npm run dev`. Create work log, attach 2 images and 1 document. Verify thumbnails display. Delete one attachment. Verify file size validation rejects files > 5 MB. Verify max 5 files limit.

- [ ] **Step 8: Commit**

```
git add -A && git commit -m "feat(upload): add file upload with camera integration and attachment picker"
```

---

### Task 7: Dashboard & Statistics

**Files:**
- Create: `src/components/dashboard/StatCard.tsx`
- Create: `src/components/dashboard/WeeklyChart.tsx`
- Create: `src/components/dashboard/TraineeList.tsx`
- Create: `src/services/team.service.ts`
- Create: `src/app/(main)/dashboard/page.tsx`
- Create: `src/app/(main)/team/page.tsx`

**Interfaces:**
- Consumes: `supabase` client, `useAuth()`, `useWorkLogs()`, `useReviews()`, all types
- Produces:
  - `team.service.ts` — exports `getTrainees(mentorId: string): Promise<Profile[]>`, `getTeamMembers(teamId: string): Promise<Profile[]>`, `getTraineeStats(traineeId: string): Promise<{ total, pending, approved, rejected, totalHours }>`, `getWeeklyStats(userId: string, role: Role, weeks?: number): Promise<{ week: string, count: number }[]>`
  - `<StatCard icon title value color />` — single stat display
  - `<WeeklyChart data />` — Recharts bar chart
  - `<TraineeList trainees onSelect />` — list with per-trainee mini stats

- [ ] **Step 1: Create `src/services/team.service.ts`**

`getTrainees`: query profiles where `mentor_id = mentorId`. `getTeamMembers`: query profiles where `team_id = teamId`. `getTraineeStats`: count work_logs grouped by status for a trainee, sum hours_spent. `getWeeklyStats`: group work_logs by `date_trunc('week', work_date)` for the last N weeks.

- [ ] **Step 2: Create `src/components/dashboard/StatCard.tsx`**

Props: `icon: LucideIcon`, `title: string`, `value: number | string`, `color: string`. Card with icon, title, large value. Colored left border.

- [ ] **Step 3: Create `src/components/dashboard/WeeklyChart.tsx`**

`"use client"`. Props: `data: { week: string; count: number }[]`. Recharts `<BarChart>` with Thai week labels on X axis. Responsive container. Green bars.

- [ ] **Step 4: Create `src/components/dashboard/TraineeList.tsx`**

Props: `trainees: (Profile & { stats })[]`, `onSelect: (id) => void`. Each row: avatar, name, mini stat badges (submitted today ✅/❌), total hours this week. Clickable → navigates to trainee's work log history.

- [ ] **Step 5: Create `src/app/(main)/dashboard/page.tsx`**

`"use client"`. Role-aware dashboard:

**Trainee view:** 4 StatCards (งานทั้งหมด, รออนุมัติ, อนุมัติแล้ว, ต้องแก้ไข) + total hours + WeeklyChart of submitted logs + quick action button "บันทึกงานวันนี้".

**Mentor view:** StatCard (งานรอตรวจ — with red badge if > 0) + TraineeList with daily status + quick link to reviews.

**Lead view:** StatCards (รออนุมัติ, อนุมัติสัปดาห์นี้, นักศึกษาทั้งหมด) + WeeklyChart of team + team approval rate.

**Admin view:** StatCards (ผู้ใช้ทั้งหมด, งานทั้งหมด, อัตราอนุมัติ) + system-wide WeeklyChart.

- [ ] **Step 6: Create `src/app/(main)/team/page.tsx`**

`"use client"`. `<RoleGuard roles={['mentor','lead']}>`. For mentor: list own trainees with stats. For lead: list all team members grouped by mentor. Click trainee → see all their work logs.

- [ ] **Step 7: Verify dashboards**

Run: `npm run dev`. Login as each role, verify dashboard renders correct stats and charts. Verify empty state handling (no trainees, no logs).

- [ ] **Step 8: Commit**

```
git add -A && git commit -m "feat(dashboard): add role-aware dashboards with stats, charts, and team overview"
```

---

### Task 8: Notifications (In-App + Push)

**Files:**
- Create: `src/services/notification.service.ts`
- Create: `src/services/native/push.ts`
- Create: `src/hooks/useNotifications.ts`
- Create: `src/store/notificationStore.ts`
- Create: `src/hooks/useRealtime.ts`
- Create: `src/app/(main)/notifications/page.tsx`
- Create: `supabase/functions/send-notification/index.ts`
- Modify: `src/components/layout/Header.tsx` — add notification bell with unread count
- Modify: `supabase/migrations/003_approval_functions.sql` — add notification insert after status change

**Interfaces:**
- Consumes: `supabase` client, `AppNotification` type, `useAuth()`
- Produces:
  - `notification.service.ts` — exports `getNotifications(userId: string): Promise<AppNotification[]>`, `markAsRead(id: string): Promise<void>`, `markAllAsRead(userId: string): Promise<void>`, `getUnreadCount(userId: string): Promise<number>`
  - `notificationStore.ts` — Zustand store `{ unreadCount, setUnreadCount, decrement }`
  - `useNotifications()` — returns `{ notifications, unreadCount, isLoading, markAsRead, markAllAsRead }`
  - `useRealtime(table, filter, onInsert)` — generic Supabase Realtime subscription hook
  - `native/push.ts` — exports `registerPush(): Promise<string | null>` (FCM/APNs token), `addPushListener(callback): void`

- [ ] **Step 1: Create `src/store/notificationStore.ts`**

Zustand store: `unreadCount: number`, `setUnreadCount(n)`, `decrement()`.

- [ ] **Step 2: Create `src/services/notification.service.ts`**

`getNotifications`: select from notifications where `user_id`, order by `created_at DESC`, limit 50. `markAsRead`: update `is_read = true`. `markAllAsRead`: update all unread for user. `getUnreadCount`: count where `is_read = false`.

- [ ] **Step 3: Create `src/hooks/useRealtime.ts`**

Generic hook: subscribes to `supabase.channel(name).on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter }, callback).subscribe()`. Cleanup on unmount.

- [ ] **Step 4: Create `src/hooks/useNotifications.ts`**

Fetches notifications on mount, subscribes to realtime inserts on `notifications` table filtered by `user_id=eq.{userId}`. On new notification: prepend to list, increment `notificationStore.unreadCount`. Returns `{ notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refetch }`.

- [ ] **Step 5: Update Header with notification bell**

Add bell icon (`<Bell />` from Lucide) with badge showing `unreadCount` from store. Click navigates to `/notifications`.

- [ ] **Step 6: Create `src/app/(main)/notifications/page.tsx`**

`"use client"`. List of notifications. Each item: icon by type (✅/📝/💬), title, body, relative time. Unread items have blue left border. Click → navigate to referenced work log. "อ่านทั้งหมด" button at top. Swipe-to-dismiss marks as read.

- [ ] **Step 7: Update approval functions to insert notifications**

Modify `003_approval_functions.sql`: after each status change, INSERT into `notifications` for relevant users:
- On submit: notify mentor
- On mentor approve: notify trainee + lead
- On mentor reject: notify trainee
- On lead approve: notify trainee + mentor
- On lead reject: notify trainee + mentor

- [ ] **Step 8: Create `src/services/native/push.ts`**

Install `@capacitor/push-notifications`. On native: request permission, register, get FCM/APNs token, store in `profiles.push_token` (add column). On web: return null (web push is a stretch goal). `addPushListener`: listen for push received / push action performed.

- [ ] **Step 9: Create `supabase/functions/send-notification/index.ts`**

Supabase Edge Function triggered by DB webhook on `notifications` INSERT. Reads the notification row, fetches user's `push_token` from profiles. If token exists, send push via FCM HTTP v1 API. Handle expired tokens gracefully (delete stale token from profiles).

- [ ] **Step 10: Verify notifications**

Run: `npm run dev`. As trainee: submit work log. As mentor: verify notification appears in-app with realtime update. Mark as read. Verify bell badge decrements. Test "อ่านทั้งหมด".

- [ ] **Step 11: Commit**

```
git add -A && git commit -m "feat(notifications): add in-app notifications with realtime updates and push notification edge function"
```

---

### Task 9: Admin Panel

**Files:**
- Create: `src/app/(main)/admin/users/page.tsx`
- Create: `src/app/(main)/admin/teams/page.tsx`
- Create: `src/services/admin.service.ts`

**Interfaces:**
- Consumes: `supabase` client, `Profile`, `Team`, `Role` types, `useAuth()`
- Produces:
  - `admin.service.ts` — exports `getAllUsers(filters?): Promise<Profile[]>`, `updateUserRole(userId: string, role: Role): Promise<void>`, `assignMentor(traineeId: string, mentorId: string): Promise<void>`, `getAllTeams(): Promise<Team[]>`, `createTeam(data): Promise<Team>`, `updateTeam(id, data): Promise<Team>`, `assignTeam(userId: string, teamId: string): Promise<void>`

- [ ] **Step 1: Create `src/services/admin.service.ts`**

Implement all admin CRUD operations. `getAllUsers` supports filtering by role, team. `updateUserRole` updates `profiles.role`. `assignMentor` updates `profiles.mentor_id`. Team CRUD is straightforward Supabase queries.

- [ ] **Step 2: Create `src/app/(main)/admin/users/page.tsx`**

`"use client"`. `<RoleGuard roles={['admin']}>`. Table/list of all users with: name, email, role (editable dropdown), team, mentor (for trainees). Search bar. Filter by role. Inline edit role. Dialog to assign mentor (select from mentors list). Dialog to assign team.

- [ ] **Step 3: Create `src/app/(main)/admin/teams/page.tsx`**

`"use client"`. `<RoleGuard roles={['admin']}>`. List of teams with member count. Create team dialog (name, department, select lead). Edit team. Show team members.

- [ ] **Step 4: Verify admin functions**

Run: `npm run dev`. As admin: create a team, assign a lead, create users, assign trainee to mentor, change roles. Verify RLS prevents non-admin access.

- [ ] **Step 5: Commit**

```
git add -A && git commit -m "feat(admin): add user management and team management pages"
```

---

### Task 10: Profile & Polish

**Files:**
- Create: `src/app/(main)/profile/page.tsx`
- Modify: `src/app/layout.tsx` — add PWA manifest, viewport meta for mobile
- Modify: `src/theme/globals.css` — add status colors, safe area variables, dark mode support
- Create: `public/manifest.json`

**Interfaces:**
- Consumes: `useAuth()`, `auth.service`, all types
- Produces: Complete polished app with profile page, PWA support, mobile-optimized styles

- [ ] **Step 1: Create `src/app/(main)/profile/page.tsx`**

`"use client"`. Show: avatar (editable), full name (editable), email (read-only), role label, team name, mentor name (for trainee). "บันทึก" button to update profile. "ออกจากระบบ" button.

- [ ] **Step 2: Create `public/manifest.json`**

PWA manifest with app name "TrainTrack", Thai description, theme color, icons.

- [ ] **Step 3: Update `src/app/layout.tsx`**

Add viewport meta for mobile (`width=device-width, initial-scale=1, viewport-fit=cover`), link manifest, add theme-color meta tag.

- [ ] **Step 4: Polish `src/theme/globals.css`**

Add CSS variables for status colors (matching spec). Add safe-area-inset padding utilities. Add dark mode CSS variables using `prefers-color-scheme`. Smooth transitions. Focus-visible styles for a11y.

- [ ] **Step 5: Final verification**

Run: `npm run build` — must succeed with no errors.
Run: `npm run dev` — test complete flow:
1. Register trainee, mentor, lead, admin
2. Admin: create team, assign roles
3. Trainee: create work log with attachments, submit
4. Mentor: review, reject with comment
5. Trainee: see rejection, edit, resubmit
6. Mentor: approve
7. Lead: approve
8. Verify notifications at each step
9. Check all dashboards show correct data

- [ ] **Step 6: Commit**

```
git add -A && git commit -m "feat: add profile page, PWA manifest, and UI polish"
```

---

## Execution Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Project Scaffolding & Core Config | — |
| 2 | Database Schema & RLS | Task 1 (types) |
| 3 | Auth System | Task 1, 2 |
| 4 | Work Log CRUD | Task 1, 2, 3 |
| 5 | Approval Workflow | Task 4 |
| 6 | File Upload | Task 4 |
| 7 | Dashboard & Statistics | Task 3, 4, 5 |
| 8 | Notifications | Task 5 |
| 9 | Admin Panel | Task 3 |
| 10 | Profile & Polish | All |

