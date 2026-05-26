<h1 align="center">
  <br/>
  <img src="https://img.shields.io/badge/Threadora-Professional%20Discussion%20Platform-6366F1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMSAxNWE2IDYgMCAwIDEtNiA2SDZhNiA2IDAgMCAxLTYtNlY5YTYgNiAwIDAgMSA2LTZIMTV2M0g2YTMgMyAwIDAgMC0zIDN2NmEzIDMgMCAwIDAgMyAzaDlhMyAzIDAgMCAwIDMtM3YtM2gzdjZ6Ii8+PC9zdmc+" alt="Threadora"/>
  <br/>
  Threadora
</h1>

<p align="center">
  <strong>A full-stack professional discussion & knowledge-curation platform</strong><br/>
  Built with React 19, Node.js / Express 5, and MongoDB
</p>

<p align="center">
  <a href="https://threadora-app.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-threadora--app.vercel.app-22D3EE?style=flat-square&logo=vercel" alt="Live Demo"/>
  </a>
  <a href="https://github.com/Manishrao2004/Threadora" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-Manishrao2004%2FThreadadora-181717?style=flat-square&logo=github" alt="GitHub"/>
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19"/>
  <img src="https://img.shields.io/badge/Node.js-Express%205-339933?style=flat-square&logo=node.js" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Deployed-Vercel%20%2B%20Render-black?style=flat-square&logo=vercel" alt="Deployed"/>
</p>

---

## 📌 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Author](#author)

---

## Overview

**Threadora** is a full-stack community discussion platform engineered for **structured, high-quality knowledge exchange**. Think Reddit — but designed with an emphasis on content quality, smart moderation, and credibility-based interactions.

The platform features a **dual-panel admin system**, **Google OAuth**, **Cloudinary media uploads**, **real-time vote syncing**, **infinite scroll**, **duplicate content detection**, and a **keyword-based auto-moderation engine** — all inside a sleek dark-mode glassmorphism UI.

---

## Live Demo

> 🌐 **[https://threadora-app.vercel.app/](https://threadora-app.vercel.app/)**

You can explore the platform as a **guest** (read-only) without creating an account. Sign up to post threads, vote, comment, and save content.

---

## Key Features

### 👤 Authentication & Identity
- Email / password registration with **bcrypt** hashing
- **Google OAuth 2.0** sign-in (`@react-oauth/google` + `google-auth-library`)
- Hybrid accounts — link Google to an existing email account
- JWT-based session management (stateless, no session store required)
- Role system: `user` → `admin` → `superadmin`

### 🧵 Threads & Communities
- Create threads with **rich text** and **media attachments** (images/videos via Cloudinary)
- Posts are scoped to **communities (categories)**
- **Three feed modes**: Trending (score-based), Newest, and Top Voted
- **Infinite scroll** with an Intersection Observer sentinel
- **Edit** and **soft-delete** your own threads
- **Save/bookmark** any thread for later

### 💬 Comments
- Nested, **threaded reply tree** (arbitrary depth via `parentId`)
- Inline media support in comments
- Upvote / downvote comments (separate vote ledger per target)
- Soft-delete preserves thread continuity without orphaned UI gaps

### 🗳️ Voting System
- Polymorphic vote model — one collection handles both thread and comment votes
- **Partial unique indexes** prevent double-voting without cross-target collisions
- Optimistic UI updates with server reconciliation

### 🔍 Duplicate Detection
- Client-side similarity check before posting warns users of semantically close existing threads

### 🛡️ Moderation & Admin Panel
| Feature | Admin | SuperAdmin |
|---------|-------|------------|
| View system stats | ✅ | ✅ |
| Manage users (suspend) | ✅ | ✅ |
| Review moderation queue | ✅ | ✅ |
| Approve / reject flagged content | ✅ | ✅ |
| Manage communities/categories | ✅ | ✅ |
| Promote / demote user roles | ❌ | ✅ |
| Delete users | ❌ | ✅ |
| Edit system config (maintenance mode, guest access, blocked keywords) | ❌ | ✅ |

- **Auto-flagging** via blocked keyword list stored in `SystemConfig`
- **Maintenance mode** gate — redirects all non-admin traffic to `/maintenance`
- Report system — users can flag threads/comments for review

### ⚙️ System Reliability
- **Global rate limiter** (500 req / 15 min per IP in production, bypassed in dev)
- Centralised error handler middleware
- `trust proxy` configured for Render's load balancer (correct IP-based limiting)
- Compound MongoDB indexes for paginated feeds, full-text search, and reply trees

### ✨ UI / UX
- Dark mode glassmorphism design system (Tailwind CSS v4)
- Skeleton loading states for all async views
- Toast notifications (`react-hot-toast`)
- Responsive layout — mobile, tablet, desktop
- Credibility score badge (`TrustBadge`) displayed on user profiles

---

## Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 (Vite 7) |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| HTTP Client | Axios |
| Auth (Google) | @react-oauth/google |
| Notifications | react-hot-toast |
| Build Tool | Vite |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB (Mongoose 9) |
| Auth | JWT + bcrypt |
| Google OAuth | google-auth-library |
| Media Storage | Cloudinary (via Multer) |
| Rate Limiting | express-rate-limit |
| Config | dotenv |
| Dev Server | Nodemon |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Browser (React SPA)             │
│  Vite · React Router · Tailwind · Axios      │
└────────────────────┬────────────────────────┘
                     │ HTTPS / REST API
┌────────────────────▼────────────────────────┐
│         Express 5 API Server (Render)        │
│                                              │
│  systemMiddleware → authMiddleware → routes  │
│                                              │
│  /api/auth       /api/threads               │
│  /api/categories /api/comments              │
│  /api/votes      /api/reports               │
│  /api/admin                                 │
└────────────────────┬────────────────────────┘
                     │ Mongoose ODM
┌────────────────────▼────────────────────────┐
│              MongoDB Atlas                   │
│  Users · Threads · Comments · Votes         │
│  Categories · Reports · SystemConfig        │
└─────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│         Cloudinary (Media CDN)               │
│         Google OAuth 2.0                     │
└─────────────────────────────────────────────┘
```

---

## Project Structure

```
Threadora/
├── threadora-frontend/         # React + Vite SPA
│   ├── src/
│   │   ├── api/                # Axios API call modules
│   │   ├── components/
│   │   │   ├── common/         # Shared UI (Composer, Modals, Skeletons, VoteControls…)
│   │   │   ├── layout/         # UserLayout, AdminLayout
│   │   │   └── threads/        # ThreadCard, CommentNode, MediaGrid, ReportModal
│   │   ├── context/            # AuthContext (global auth state)
│   │   ├── hooks/              # useAuth, useThreads, useInfiniteScroll, useVoteHandler
│   │   ├── pages/
│   │   │   ├── Auth/           # Login, Register
│   │   │   ├── Dashboard/      # UserHome, ThreadDetail, Saved, MyThreads, Settings
│   │   │   ├── Admin/          # AdminOverview, AdminModeration, AdminUsers,
│   │   │   │                   # AdminReports, AdminCategories, AdminSettings
│   │   │   ├── LandingPage.jsx
│   │   │   └── Maintenance.jsx
│   │   ├── routes/             # AppRoutes, ProtectedRoute, GuestRoute, AdminRoute
│   │   ├── styles/             # Global CSS / design tokens
│   │   └── utils/              # cloudinary helper, errorUtils
│   ├── vite.config.js
│   └── vercel.json
│
└── threadora-backend/          # Node.js + Express REST API
    ├── index.js                # App bootstrap, middleware registration
    └── src/
        ├── config/             # db.js (Mongoose connect), env.js
        ├── controllers/        # authController, threadController, commentController,
        │                       # voteController, reportController, adminController,
        │                       # configController, categoryController
        ├── middleware/         # authMiddleware, adminMiddleware, superAdminMiddleware,
        │                       # optionalAuth, rateLimiter, errorHandler, systemMiddleware
        ├── models/             # User, Thread, Comment, Vote, Category, Report, SystemConfig
        ├── routes/             # authRoutes, threadRoutes, commentRoutes, voteRoutes,
        │                       # reportRoutes, adminRoutes, categoryRoutes
        └── services/           # Business logic / helpers
```

---

## API Reference

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | Public | Register with email & password |
| `POST` | `/login` | Public | Login, returns JWT |
| `POST` | `/google` | Public | Google OAuth sign-in / sign-up |
| `GET` | `/me` | 🔒 JWT | Get current user profile |
| `PUT` | `/me` | 🔒 JWT | Update username / avatar |
| `PUT` | `/password` | 🔒 JWT | Change password |

### Threads — `/api/threads`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Optional | List threads (paginated, sortable, category filter) |
| `GET` | `/search` | Optional | Full-text search across title + content |
| `GET` | `/saved` | 🔒 JWT | Get current user's saved threads |
| `GET` | `/:id` | Optional | Get single thread |
| `POST` | `/` | 🔒 JWT | Create a new thread |
| `PUT` | `/:id` | 🔒 JWT | Edit thread (author only) |
| `DELETE` | `/:id` | 🔒 JWT | Delete thread (author or admin) |
| `POST` | `/:id/save` | 🔒 JWT | Toggle save/bookmark on a thread |

### Comments — `/api/comments`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/:threadId` | Optional | Get all comments for a thread (nested tree) |
| `POST` | `/` | 🔒 JWT | Create a comment or reply |
| `PUT` | `/:id` | 🔒 JWT | Edit comment (author only) |
| `DELETE` | `/:id` | 🔒 JWT | Soft-delete comment |

### Votes — `/api/votes`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/` | 🔒 JWT | Cast or toggle an upvote / downvote (thread or comment) |

### Reports — `/api/reports`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/` | 🔒 JWT | Submit a report against a thread or comment |

### Categories — `/api/categories`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Optional | List all communities |
| `POST` | `/` | 🔒 Admin | Create a community |
| `PUT` | `/:id` | 🔒 Admin | Update community name/description |
| `DELETE` | `/:id` | 🔒 Admin | Delete a community |

### Admin — `/api/admin`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/stats` | 🔒 Admin | System-wide stats (users, threads, reports) |
| `GET` | `/users` | 🔒 Admin | List all users |
| `PUT` | `/users/:id/suspend` | 🔒 Admin | Suspend / unsuspend a user |
| `GET` | `/moderation-queue` | 🔒 Admin | Get flagged content queue |
| `PUT` | `/moderation-queue/:id/approve` | 🔒 Admin | Approve or reject a flagged item |
| `PUT` | `/users/:id/role` | 🔒 SuperAdmin | Promote / demote user role |
| `DELETE` | `/users/:id` | 🔒 SuperAdmin | Permanently delete a user |
| `GET` | `/config` | 🔒 SuperAdmin | Read system config |
| `PUT` | `/config` | 🔒 SuperAdmin | Update maintenance mode, guest access, blocked keywords |

---

## Database Schema

### User
```js
{ username, email, passwordHash (bcrypt), role, avatarUrl,
  googleId, authProvider, credibilityScore,
  isSuspended, savedThreads[], pinnedCommunities{Map} }
```

### Thread
```js
{ title, content, categoryId, authorId, media[],
  upvotes, downvotes, commentCount, reportCount, score,
  isHidden, moderationStatus, systemFlagReason, isEdited }
// Indexes: categoryId, createdAt desc, score desc, full-text(title+content)
```

### Comment
```js
{ threadId, authorId, parentId (null = top-level), content, media[],
  upvotes, downvotes, score, replyCount, reportCount,
  isHidden, moderationStatus, systemFlagReason, isEdited, isDeleted }
// Indexes: (threadId, createdAt), parentId, score desc
```

### Vote
```js
{ threadId | commentId (polymorphic), userId, type: 'upvote'|'downvote' }
// Partial unique indexes prevent double-voting per target type
```

### SystemConfig
```js
{ maintenanceMode, allowGuestViews,
  requireEmailVerification, blockedKeywords[] }
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas URI)
- Cloudinary account
- Google OAuth Client ID

### 1. Clone the repository
```bash
git clone https://github.com/Manishrao2004/Threadora.git
cd Threadora
```

### 2. Backend setup
```bash
cd threadora-backend
cp .env.example.txt .env    # fill in your values
npm install
npm run dev                  # starts on http://localhost:3000
```

### 3. Frontend setup
```bash
cd ../threadora-frontend
cp .env.example.txt .env    # fill in VITE_API_URL etc.
npm install
npm run dev                  # starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`threadora-backend/.env`)
```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/threadora

# Auth
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# Cloudinary (media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Resend — optional)
RESEND_API_KEY=your_resend_api_key_here

# Rate Limiting (production)
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX=500            # requests per window per IP
```

### Frontend (`threadora-frontend/.env`)
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## Deployment

| Service | Purpose | URL |
|---------|---------|-----|
| **Vercel** | Frontend (React SPA) | [threadora-app.vercel.app](https://threadora-app.vercel.app/) |
| **Render** | Backend (Node.js API) | Configured via Render dashboard |
| **MongoDB Atlas** | Cloud database | Atlas free tier |
| **Cloudinary** | Media CDN | Cloudinary free tier |

The frontend `vercel.json` includes SPA rewrite rules so React Router handles all client-side navigation correctly.

The backend sets `app.set('trust proxy', 1)` to ensure IP-based rate limiting works correctly behind Render's load balancer.

---

## Author

**Manish Rao**

- 🌐 [threadora-app.vercel.app](https://threadora-app.vercel.app/)
- 💻 [github.com/Manishrao2004](https://github.com/Manishrao2004)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Manishrao2004">Manishrao2004</a>
</p>
