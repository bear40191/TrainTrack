# AGENT_CONTEXT & SYSTEM ARCHITECTURE
> **For AI Coding Agents (Claude, GPT, Gemini, Cursor, Copilot, etc.)**
> This file contains the complete context, architectural patterns, state flow, and development guidelines for **TrainTrack**. Read this file first before making changes or adding features.

---

## 1. Project Overview & Business Logic

**TrainTrack** is a cross-platform Hybrid Application (Mobile iOS/Android & Web PWA) designed for internship work logging and sequential approval workflows.

### Sequential Approval Workflow
The core business workflow follows a 4-tier hierarchy:
```
[Trainee (นักศึกษาฝึกงาน)] 
       │ creates log (Draft or Submit)
       ▼
  pending_mentor
       │
[Mentor (พี่เลี้ยง)] ──(Request Revision)──► revision_required ──► [Trainee re-submits]
       │
       ▼ (Approves & Confirms)
  pending_lead
       │
[Head Mentor / Lead (หัวหน้าพี่เลี้ยง)] ──(Request Revision)──► revision_required ──► [Trainee re-submits]
       │
       ▼ (Final Approval)
   approved
```

1. **Multiple Mentors Support:** A company/team has multiple mentors. When a trainee creates a work log, they select specifically which mentor assigned or should review that task (`assigned_mentor_id`).
2. **Rejection Behavior:** If either Mentor or Lead requests revision (`request_revision`), the work log transitions to `revision_required`. The trainee must modify the work log and re-submit it (always starting back with Mentor approval).
3. **Audit Trail (Approval Actions):** Every status transition creates an immutable `approval_actions` record containing `actor_id`, `from_status`, `to_status`, and optional/mandatory `note`.

---

## 2. Tech Stack & Dependencies

- **Framework:** Next.js 14 (App Router, `"use client"` where interactive)
- **Language:** TypeScript (Strict mode enabled, clean interfaces in `src/lib/types.ts`)
- **Styling:** Tailwind CSS (`tailwind.config.ts`, clean light enterprise theme: `bg-slate-50`, cards: `bg-white`, border: `border-slate-200`, primary accent: Emerald-600)
- **Font:** Google Font **`Noto_Sans_Thai`** (configured via `next/font/google` in `src/app/layout.tsx`)
- **Mobile Hybrid Layer:** Capacitor 6 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/camera`, `@capacitor/push-notifications`)
- **State Management:** Zustand (`src/store/appStore.ts` - handles active user, mentors list, dynamic categories, work logs, notifications, and approval actions)
- **Database / Backend Schema:** Supabase PostgreSQL (`supabase/migrations/001_create_tables.sql`)
- **Icons:** `lucide-react`
- **Date Handling:** `date-fns` (with Thai locale formatters in `src/lib/utils.ts`)

---

## 3. Directory Structure

```
d:/TrainTrack/
├── .agent/
│   └── skill/seo-master/
│       └── hybrid.md             # Guidelines for Capacitor & Hybrid apps
├── docs/
│   └── superpowers/
│       ├── specs/2026-11-02-traintrack-design.md
│       └── plans/2026-11-02-traintrack.md
├── public/
│   └── manifest.json             # PWA Manifest
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with Noto Sans Thai font injection
│   │   ├── globals.css           # Tailwind base, utilities, scrollbar styling
│   │   └── page.tsx              # Main single-page application orchestrator
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminView.tsx     # Admin dashboard & CSV export
│   │   ├── dashboard/
│   │   │   └── DashboardView.tsx # Role-specific dashboard (Trainee/Mentor/Lead/Admin)
│   │   ├── layout/
│   │   │   ├── Header.tsx        # Top navigation with notification bell & user avatar
│   │   │   ├── RoleSelector.tsx  # Interactive Demo Role & Mentor Switcher
│   │   │   ├── TabBar.tsx        # Mobile-first Bottom Navigation
│   │   │   └── NotificationModal.tsx
│   │   ├── review/
│   │   │   └── ReviewListView.tsx# Pending reviews list for Mentors & Leads
│   │   └── work-log/
│   │       ├── MyLogsView.tsx    # Filterable list of work logs for Trainee
│   │       ├── StatusBadge.tsx   # Color-coded badge for 5 work log statuses
│   │       ├── WorkLogCard.tsx   # Reusable card component for work logs
│   │       ├── WorkLogDetailModal.tsx # Full detail, approval timeline, comment thread
│   │       └── WorkLogForm.tsx   # Form with custom categories & mentor picker
│   ├── lib/
│   │   ├── constants.ts          # Default categories, status/role labels
│   │   ├── types.ts              # Canonical TypeScript interfaces & types
│   │   └── utils.ts              # cn(), formatDate(), getStatusBadgeStyle()
│   ├── services/
│   │   └── supabase.ts           # Supabase client setup
│   └── store/
│       └── appStore.ts           # Central Zustand store
├── supabase/
│   └── migrations/
│       └── 001_create_tables.sql # Complete PostgreSQL DDL
├── capacitor.config.ts           # Capacitor mobile configuration
├── package.json
└── tailwind.config.ts
```

---

## 4. Key Data Models (`src/lib/types.ts`)

### Status Definition
```typescript
export type WorkLogStatus = 
  | 'draft'              // Trainee draft
  | 'pending_mentor'     // Submitted to assigned mentor
  | 'pending_lead'       // Mentor approved; waiting for Head Mentor
  | 'revision_required'  // Rejected with note; sent back to trainee
  | 'approved';          // Approved by Head Mentor (final)
```

### Roles
```typescript
export type Role = 'trainee' | 'mentor' | 'lead' | 'admin';
```

### WorkLog Interface
```typescript
export interface WorkLog {
  id: string;
  trainee_id: string;
  assigned_mentor_id?: string; // Target mentor selected by trainee
  work_date: string;
  title: string;
  description: string;
  hours_spent: number;
  status: WorkLogStatus;
  category: string;           // Dynamic category chosen by user
  revision_count: number;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  trainee?: Profile;
  assigned_mentor?: Profile;
  attachments?: Attachment[];
  comments?: Comment[];
  approval_actions?: ApprovalAction[];
}
```

---

## 5. UI/UX Rules & Styling Conventions

1. **Light Theme Only (Clean Enterprise):**
   - Background: `bg-slate-50` (`#f8fafc`)
   - Card/Surface: `bg-white` (`#ffffff`) with `border border-slate-200`
   - Shadow: `shadow-card` or `shadow-soft`
   - Accent / Action Button: Emerald-600 (`bg-emerald-600 hover:bg-emerald-700 text-white`)
2. **Typography:**
   - Font: `font-sans` maps to `var(--font-noto-sans-thai)`
   - No informal stickers or emojis in standard labels or buttons.
3. **Dashboard Separation:**
   - **Trainee View:** Shows submission stats (`บันทึกทั้งหมด`, `รออนุมัติ`, `อนุมัติแล้ว`, `ส่งกลับแก้ไข`) and recent logs. Note: *Accumulated hour bars have been removed from the main view as requested.*
   - **Mentor View:** Shows `งานที่รอตรวจ`, `ยืนยันแล้ว`, `ส่งกลับให้นักศึกษาแก้ไข`. Does NOT show `บันทึกทั้งหมด`.
   - **Lead View:** Shows `รออนุมัติขั้นสุดท้าย`, `อนุมัติเสร็จสิ้นแล้ว`, `ส่งกลับให้แก้ไข`, and Mentors Team list. Does NOT show `บันทึกทั้งหมด`.
4. **Dynamic Categories:**
   - Categories are managed in `appStore.categories`.
   - Trainees can add new custom categories or remove unused ones directly within `WorkLogForm.tsx`.

---

## 6. How to Run & Build

```bash
# Run local dev server (port 3000)
npm run dev

# Run production build & type checks
npm run build

# Sync web assets to Capacitor native iOS/Android
npx cap copy
npx cap sync
```

---

## 7. Next Steps for Incoming AI Agents

When continuing development, consider the following tasks:
- **Backend Sync:** Connect `src/store/appStore.ts` functions to real Supabase tables using `src/services/supabase.ts` (the SQL schema in `supabase/migrations/001_create_tables.sql` already mirrors the Zustand state).
- **Push Notifications:** Configure Firebase Cloud Messaging (FCM) credentials in `capacitor.config.ts` and set up Supabase Database Webhook to trigger Edge Functions on `approval_actions` INSERT.
- **Offline Storage:** Use `@capacitor/preferences` or IndexedDB to cache pending logs when offline.
