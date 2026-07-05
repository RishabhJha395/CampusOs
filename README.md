# 🎓 CampusOS — The Operating System for Modern Campuses

CampusOS is a unified, full-stack digital campus management platform that connects **Students**, **Faculty**, **Wardens**, **Parents**, and **College Admins** in one seamless ecosystem. It provides real-time chat, emergency SOS alerts, hostel management, an academic hub, a student marketplace, clubs & events, and an **AI-powered assistant (CampusMind)** — all secured with role-based access control and powered by Supabase.

> **Live Demo**: [campusos.vercel.app](https://campus-os-omega.vercel.app)  
> **CampusMind AI**: [campus-mind-ai-plum.vercel.app](https://campus-mind-ai-plum.vercel.app/)

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [High-Level System Architecture](#-high-level-system-architecture)
- [Deployment Architecture](#-deployment-architecture)
- [Authentication & Role-Based Routing](#-authentication--role-based-routing)
- [Database Architecture](#-database-architecture)
- [CampusMind AI (RAG)](#-campusmind-ai-rag)
- [Key Features](#-key-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript 6 |
| **Build Tool** | Vite 8 |
| **State Management** | Redux Toolkit (global auth state) + TanStack React Query (server state) |
| **Routing** | React Router v7 |
| **Styling** | Tailwind CSS v4 |
| **Backend / BaaS** | Supabase (PostgreSQL, Auth, Realtime, Storage, RPC) |
| **Realtime** | Supabase Realtime (Postgres Changes + Broadcast) |
| **Icons** | Lucide React |
| **Forms** | React Hook Form |
| **AI Assistant** | CampusMind AI — RAG-based Q&A (separate Vercel app) |
| **Hosting** | Vercel (Frontend + AI App) + Supabase Cloud (Backend) |

---

## 🏗 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  React   │  │ Redux Toolkit│  │  TanStack Query   │  │
│  │  Router  │──│  (Auth State)│──│  (Server Cache)   │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
│        │                │                  │             │
│        ▼                ▼                  ▼             │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Supabase Client SDK                      │   │
│  │   (REST API + Realtime WebSocket + Auth)          │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS + WSS
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE CLOUD                          │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │PostgreSQL│  │   GoTrue     │  │   Realtime        │  │
│  │ Database │  │   (Auth)     │  │   (WebSockets)    │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
│  ┌──────────┐  ┌──────────────┐                         │
│  │PostgREST │  │   Storage    │                         │
│  │ (API)    │  │   (Files)    │                         │
│  └──────────┘  └──────────────┘                         │
│                                                         │
│  Row Level Security (RLS) on ALL tables                  │
│  Custom SQL Functions (RPCs) for complex operations      │
│  Database Triggers for automated side-effects            │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **No custom backend server**: The entire backend is managed by Supabase. All business logic is enforced via PostgreSQL Row Level Security (RLS) policies and SQL functions (`SECURITY DEFINER`).
- **Realtime subscriptions**: Chat messages and emergency alerts are pushed to clients instantly via Supabase Realtime channels listening on `postgres_changes`.
- **Feature-sliced architecture**: Frontend code is organized by feature domain (auth, chat, marketplace, etc.), each with its own `services/`, `hooks/`, and component files.

---

## 🚀 Deployment Architecture

```
┌──────────────┐        ┌──────────────────────┐
│              │  HTTPS  │                      │
│   Browser    │────────▶│   Vercel Edge CDN    │
│   (User)     │◀────────│   (Static SPA)       │
│              │         │                      │
└──────────────┘        └──────────┬───────────┘
                                   │
                                   │ Env Vars:
                                   │ VITE_SUPABASE_URL
                                   │ VITE_SUPABASE_ANON_KEY
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │                      │
                        │   Supabase Cloud     │
                        │   (PostgreSQL +      │
                        │    Auth + Realtime)   │
                        │                      │
                        └──────────────────────┘
```

- **Vercel** serves the static React SPA built by Vite.
- **Supabase Cloud** handles all database operations, authentication, file storage, and WebSocket-based realtime events.
- Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are injected at build time on Vercel.

---

## 🔐 Authentication & Role-Based Routing

### User Roles

CampusOS supports **6 distinct user roles**, each with a unique dashboard and set of permissions:

| Role | Description |
|---|---|
| `super_admin` | Platform-level administrator |
| `college_admin` | College-level administrator (manages directory, hostels) |
| `faculty` | Faculty member (manages courses, grades, attendance) |
| `student` | Student (hostel, marketplace, clubs, emergency, academics) |
| `parent` | Parent/Guardian (monitors child's academics and hostel, raises SOS) |
| `warden` | Hostel warden (manages hostel, responds to emergencies) |

### Authentication Flow

```
User lands on /login
        │
        ▼
Supabase GoTrue (email/password sign-up & sign-in)
        │
        ▼
Auth trigger creates a row in `profiles` table
        │
        ▼
ProtectedRoute checks Redux auth state
        │
        ├── Unauthenticated ──▶ Redirect to /login
        │
        ├── Authenticated, onboarding incomplete ──▶ /onboarding
        │
        └── Authenticated, onboarding complete ──▶ /{role}/dashboard
```

- **Supabase GoTrue** handles all authentication (email/password).
- A **database trigger** (`on_auth_user_created`) automatically creates a `profiles` row on sign-up.
- The `useAuthSession` hook listens to Supabase auth state changes and syncs them into Redux.
- `<ProtectedRoute>` wraps all authenticated pages and redirects unauthenticated users to `/login`.

### Role-Based Navigation

Each role gets a tailored sidebar navigation:

| Role | Sidebar Items |
|---|---|
| **Student** | Dashboard, Chat, Notifications, Profile, Hostel, Marketplace, Clubs & Events, Emergency |
| **Faculty** | Dashboard, Chat, Notifications, Profile |
| **Warden** | Dashboard, Chat, Notifications, Profile, Hostel Management, Emergencies |
| **College Admin** | Dashboard, Chat, Notifications, Profile, Directory, Hostels |
| **Parent** | Dashboard, Chat, Notifications, Profile |

### Route Map

| Path | Component | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/onboarding` | Onboarding wizard | Authenticated |
| `/student/dashboard` | Student dashboard | Authenticated |
| `/student/hostel` | Hostel view | Authenticated |
| `/student/emergency` | SOS & emergency | Authenticated |
| `/student/academics` | Academic progress | Authenticated |
| `/marketplace` | Buy/sell marketplace | Authenticated |
| `/clubs` | Clubs & events | Authenticated |
| `/chat` | Real-time messaging | Authenticated |
| `/notifications` | Notification center | Authenticated |
| `/faculty/dashboard` | Faculty dashboard | Authenticated |
| `/faculty/academics` | Course management | Authenticated |
| `/warden/dashboard` | Warden dashboard | Authenticated |
| `/warden/hostel` | Hostel management | Authenticated |
| `/warden/emergencies` | Emergency alerts | Authenticated |
| `/admin/dashboard` | Admin dashboard | Authenticated |
| `/admin/directory` | User directory | Authenticated |
| `/admin/hostels` | Hostel admin | Authenticated |
| `/parent/dashboard` | Parent portal | Authenticated |

---

## 🗄 Database Architecture

### Entity Relationship Overview

```
colleges
  ├── profiles (users)
  │     ├── students ──┐
  │     ├── faculty    │
  │     ├── wardens    │
  │     └── parents ───┤
  │                    │
  │     parent_student_links
  │
  ├── departments
  │     └── courses
  │           ├── course_enrollments
  │           │     ├── attendance
  │           │     └── grades
  │
  ├── hostels
  │     └── rooms
  │
  ├── emergency_alerts
  │
  ├── marketplace_categories
  │     └── marketplace_listings
  │
  ├── chat_channels
  │     ├── chat_participants
  │     └── chat_messages
  │
  └── clubs
        ├── club_members
        └── club_events
```

### Table Reference

#### Core Tables

| Table | Description | Key Columns |
|---|---|---|
| `colleges` | Top-level tenant | `id`, `name`, `short_code`, `domain`, `is_active` |
| `profiles` | All users (linked to `auth.users`) | `id`, `college_id`, `role`, `full_name`, `onboarding_completed` |
| `departments` | Academic departments per college | `id`, `college_id`, `name`, `code` |
| `hostels` | Hostel buildings | `id`, `college_id`, `name`, `type`, `warden_id` |
| `rooms` | Rooms within hostels | `id`, `hostel_id`, `room_number`, `capacity`, `occupied_count` |

#### Identity Tables (Role-Specific)

| Table | Description | Key Columns |
|---|---|---|
| `students` | Student profile extension | `id` (FK→profiles), `department_id`, `enrollment_number`, `hostel_id`, `room_id` |
| `faculty` | Faculty profile extension | `id` (FK→profiles), `department_id`, `designation`, `employee_code` |
| `wardens` | Warden profile extension | `id` (FK→profiles), `hostel_id` |
| `parents` | Parent profile extension | `id` (FK→profiles) |
| `parent_student_links` | Links parents to students | `parent_id`, `student_id`, `status` |

#### Academic Tables

| Table | Description | Key Columns |
|---|---|---|
| `courses` | Courses offered | `id`, `department_id`, `faculty_id`, `course_code`, `name`, `credits` |
| `course_enrollments` | Student-course enrollments | `course_id`, `student_id`, `status` |
| `attendance` | Daily attendance records | `enrollment_id`, `date`, `status`, `marked_by` |
| `grades` | Assessment grades | `enrollment_id`, `assessment_name`, `grade`, `graded_by` |

#### Chat & Notifications

| Table | Description | Key Columns |
|---|---|---|
| `chat_channels` | Chat rooms (direct or group) | `id`, `college_id`, `name`, `type`, `updated_at` |
| `chat_participants` | Users in a channel | `channel_id`, `user_id`, `last_read_at` |
| `chat_messages` | Individual messages | `channel_id`, `sender_id`, `content`, `is_edited` |

#### Marketplace

| Table | Description | Key Columns |
|---|---|---|
| `marketplace_categories` | Item categories | `id`, `name`, `icon` |
| `marketplace_listings` | Items for sale | `seller_id`, `category_id`, `title`, `price`, `condition`, `status` |

#### Emergency

| Table | Description | Key Columns |
|---|---|---|
| `emergency_alerts` | SOS alerts | `student_id`, `type`, `location`, `status`, `resolved_by` |

#### Clubs & Events

| Table | Description | Key Columns |
|---|---|---|
| `clubs` | Campus clubs | `college_id`, `name`, `category`, `president_id` |
| `club_members` | Club memberships | `club_id`, `student_id` |
| `club_events` | Events hosted by clubs | `club_id`, `title`, `event_date`, `event_time`, `location` |

### Security Model

All tables use **Row Level Security (RLS)**. Key policies include:

- **College isolation**: Users can only see data within their own college (`college_id = auth_college_id()`).
- **Ownership policies**: Users can only modify their own data (e.g., sellers can only edit their own listings).
- **Role-based access**: Wardens and admins get elevated read/write access to emergency alerts and hostel data.
- **Chat participant isolation**: Users can only see channels and messages they are a participant of.

### Custom SQL Functions (RPCs)

| Function | Purpose |
|---|---|
| `auth_college_id()` | Returns the current user's college ID (used in RLS policies) |
| `auth_role()` | Returns the current user's role (used in RLS policies) |
| `mark_channel_read(channel_id)` | Updates `last_read_at` for the current user in a channel |
| `get_unread_counts()` | Returns unread message counts for all of the user's channels |
| `create_direct_message(...)` | Creates or finds an existing DM channel between two users |
| `redeem_parent_invite_code(...)` | Links a parent to a student via a one-time invite code |

---

## ✨ Key Features

### 🏠 Hostel Management
- Students view their room allocation and hostel details
- Wardens manage room assignments and occupancy
- Admins create and manage hostel buildings and rooms

### 📚 Academic Hub
- Faculty create courses, mark attendance, and assign grades
- Students view their enrollments, attendance stats, and grade reports
- Parents can monitor their child's academic progress

### 💬 Real-time Chat
- Direct messaging between any users in the same college
- Group chat support
- Message editing (within 10-minute window)
- Unread message badges and notification counts
- Most recent conversations appear on top (database trigger)

### 🛒 Campus Marketplace
- Students buy and sell items (Books, Electronics, Vehicles, etc.)
- Category filtering and search
- "Contact Seller" integration with chat
- Sellers mark items as sold to remove from the marketplace

### 🚨 Emergency SOS
- Students and parents can trigger SOS alerts
- Wardens receive real-time notifications of active alerts
- Alert lifecycle: `active` → `acknowledged` → `resolved`
- Emergency type classification (medical, security, fire, other)

### 👥 Clubs & Events
- Browse and join campus clubs by category
- Club presidents can host and schedule events
- Upcoming events feed with date, time, and location

### 🔔 Notifications
- Unified notification center for chat messages and SOS alerts
- Real-time badge counts on sidebar navigation
- Per-channel unread tracking

---

## 🤖 CampusMind AI (RAG)

CampusOS integrates **CampusMind**, an AI-powered Retrieval-Augmented Generation (RAG) assistant accessible directly from the sidebar for every user role.

- **What it does**: CampusMind lets students, faculty, parents, and admins ask natural-language questions about college policies, hostel rules, academic guidelines, examination schedules, and more — and get instant, accurate answers sourced from official college documents.
- **How it works**: The RAG pipeline retrieves relevant chunks from indexed college documents and feeds them as context to an LLM, ensuring answers are grounded in real institutional data rather than hallucinated.
- **Access**: Every authenticated user sees an **"Ask CampusMind"** button in the left sidebar. Clicking it opens the CampusMind app in a new tab.
- **Deployed at**: [campus-mind-ai-plum.vercel.app](https://campus-mind-ai-plum.vercel.app/)

---

## 📁 Project Structure

```
CampusOs/
├── client/                          # Frontend (Vite + React)
│   ├── src/
│   │   ├── app/                     # Store, router, root app
│   │   ├── components/              # Shared UI components
│   │   │   ├── layout/              # AppShell, navConfig
│   │   │   └── clubs/               # Club-specific components
│   │   ├── features/                # Feature-sliced modules
│   │   │   ├── auth/                # Auth services, hooks, types, Redux slice
│   │   │   ├── chat/                # Chat services & hooks
│   │   │   ├── clubs/               # Club services & hooks
│   │   │   ├── academics/           # Academic services & hooks
│   │   │   ├── emergency/           # Emergency services & hooks
│   │   │   ├── hostels/             # Hostel services & hooks
│   │   │   ├── marketplace/         # Marketplace services & hooks
│   │   │   ├── notifications/       # Notification services & hooks
│   │   │   └── parents/             # Parent services & hooks
│   │   ├── lib/                     # Supabase client initialization
│   │   ├── pages/                   # Page components by role
│   │   │   ├── admin/               # College admin pages
│   │   │   ├── auth/                # Login, Signup
│   │   │   ├── faculty/             # Faculty pages
│   │   │   ├── onboarding/          # Onboarding wizard
│   │   │   ├── parent/              # Parent dashboard
│   │   │   ├── public/              # Landing page
│   │   │   ├── shared/              # Dashboard, Messages, Notifications
│   │   │   ├── student/             # Student pages
│   │   │   └── warden/              # Warden pages
│   │   ├── routes/                  # ProtectedRoute guard
│   │   └── styles/                  # Global styles
│   ├── .env                         # Environment variables (git-ignored)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── server/
    └── migrations/                  # SQL migrations (00000–00013)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- A [Supabase](https://supabase.com/) project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RishabhJha395/CampusOs.git
   cd CampusOs
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Set up the database:**
   Go to your Supabase project's **SQL Editor** and run each file in `server/migrations/` in order (from `00000_initial_schema.sql` to `00013_clubs_and_events.sql`).

4. **Configure environment variables:**
   Create a `.env` file in the `client/` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

6. **Open** `http://localhost:5173` in your browser.

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key |

---

## 🌐 Deployment

### Frontend (Vercel)

1. Push your code to GitHub.
2. Import the repository on [Vercel](https://vercel.com/).
3. Set the **Root Directory** to `client`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
5. Deploy!

### Backend (Supabase)

- Your Supabase cloud project serves as the production backend.
- Ensure **Realtime** is enabled for `chat_messages` and `emergency_alerts` tables via **Database → Publications**.
- Update **Authentication → URL Configuration** to include your Vercel domain as a redirect URL.

---

## 📄 License

This project is built as an academic/portfolio project.

---

<p align="center">
  Built with ❤️ using React, Supabase & Vite
</p>
