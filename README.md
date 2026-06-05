# FlowDo — Futuristic Productivity Operating System

FlowDo is a full-stack, open-source productivity platform that unifies task management, habit tracking, calendar planning, note-taking, focus timing, AI assistance, gamification, and analytics into a single, beautiful interface.

Designed with a dark-first, glassmorphism aesthetic and powered by Supabase, FlowDo serves as a complete personal command center for managing your time, attention, and goals.

---

## Features

### Eisenhower Matrix (Task Management)
Organize tasks across the four quadrants of the Eisenhower Matrix:
- **Urgent & Important** — Do Now
- **Important, Not Urgent** — Schedule
- **Urgent, Not Important** — Delegate
- **Neither** — Eliminate

Each task supports:
- Title, description, and rich notes
- Priority levels: Low, Medium, High, Critical
- Status workflow: Todo → In Progress → Blocked → Completed
- Due dates, estimated time, and tags (JSONB array)
- Duplicate detection with automatic cleanup (60-second window)
- Drag-to-complete gesture in the daily dashboard

### Time-Based Targets
Plan work across four horizons:
- **Tomorrow** — Next-day tasks (auto-migrate to tasks at midnight)
- **Week** — Weekly goals
- **Month** — Monthly objectives
- **Year** — Annual milestones

Targets auto-migrate: tomorrow's targets become full tasks when a new day begins. Expired targets (week/month/year) are automatically cleaned up on app startup. Migration safeguards prevent duplicate creation via localStorage and sessionStorage checks plus database queries.

### Habit Tracker
Build and maintain routines with:
- Daily, weekly, and monthly frequency types
- Weekly progress visualization (SMTWTFS grid)
- Streak counter and completion rate tracking
- Color-coded habits
- Monthly journal entries per habit
- Automatic cleanup of old habit data at month boundaries

### Calendar
- Month and day views with event management
- Color-coded events (Blue, Green, Purple, Red, Orange, Pink)
- Event details: title, date, time range, location, attendees, all-day flag
- Overlay display of tasks and targets alongside calendar events

### Notes System
Full-featured rich text note-taking powered by ReactQuill:
- Rich text formatting: bold, italic, lists, headers, text colors, links, images, video embeds, code blocks
- Color coding: Purple, Blue, Green, Orange, Red
- Tags as text arrays for organization
- Search and filter functionality
- Dedicated routes: `/notes/new` and `/notes/:id`
- Link notes to tasks via `linked_tasks` (UUID array)

### Pomodoro Focus Timer
- Launch a standalone flip-clock timer (`Clock.html`) in a new window
- Pass task context via URL parameters (`task`, `taskId`, `taskDescription`, `authToken`)
- Log focus and break sessions to the database
- Track average focus time across sessions
- Session types: Focus and Break

### AI Assistant (Vikram)
An intelligent chat interface powered by Google Gemini via the OpenAI-compatible SDK:
- Natural language conversation with context awareness
- Web search via DuckDuckGo (with Programmable Search fallback)
- File attachments: images (inline display), PDFs (text extraction), text and markdown files
- Command palette: `/clone`, `/search`, `/page`, `/improve`
- Monte Carlo forecasting for task completion prediction (seed 12345, 95% decay, 100 iterations, 7-day horizon)
- Calendar, task, and target context injection
- Built-in connection diagnostics (`testA4FConnection`, `testA4FDirectFetch`)
- Glowing, animated chat UI with typing indicators and responsive input

### Achievements & Gamification
- Upload achievement images (max 5MB) to Supabase Storage
- 21 unlockable badges covering:
  - Task completion milestones
  - Habit tracking consistency
  - Pomodoro session counts
  - Target creation streaks
  - And more gamified metrics
- Image gallery grid layout

### Analytics Dashboard
Visualize your productivity with Recharts:
- Weekly focus time (area/bar chart)
- Eisenhower quadrant distribution (pie chart)
- Matrix score (weighted calculation)
- Daily breakdowns

### Daily Checklist
Pre-defined routine categories with local progress tracking:
- Before College, Morning Routine, Evening Routine, Health/Fitness, Learning/Skill
- Persistent via localStorage with daily auto-reset
- Progress bars for each category

### Authentication
- Email/password registration and login
- Google OAuth single sign-on
- Password reset flow
- Persistent sessions via Supabase `onAuthStateChange`
- Protected routes with auth guard
- Editable user profiles (name, avatar)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Build Tool** | Vite 5 + SWC |
| **Language** | TypeScript |
| **UI Framework** | React 18 |
| **Routing** | React Router 6 |
| **Styling** | Tailwind CSS 3 (dark mode via `class` strategy) |
| **Component Library** | shadcn/ui (52 Radix-based components) |
| **State Management** | TanStack Query (React Query) |
| **Backend / Database** | Supabase (PostgreSQL, Auth, Storage) |
| **Charts** | Recharts |
| **Rich Text** | ReactQuill |
| **Animation** | Framer Motion |
| **Forms** | React Hook Form + Zod |
| **AI SDKs** | OpenAI SDK (Gemini-compatible endpoint), Anthropic SDK |
| **Font** | Montserrat |

---

## Architecture

### Routing
| Path | Component | Auth Required |
|---|---|---|
| `/` | Main app shell with 12 views | Yes |
| `/profile` | User profile settings | Yes |
| `/notes/new` | New note editor | Yes |
| `/notes/:id` | Edit existing note | Yes |
| `/auth/login` | Login form | No |
| `/auth/signup` | Signup form | No |
| `/auth/forgot-password` | Password reset | No |

### View System
The main app shell (`Index.tsx`) uses a stateful `activeView` string to render 12 views in the same layout:

| # | View | Key | Component |
|---|---|---|---|
| 1 | Today Dashboard | `today` | `TodayView` |
| 2 | Eisenhower Matrix | `matrix` | `EisenhowerMatrix` |
| 3 | Targets | `targets` | `TargetsView` |
| 4 | Calendar | `calendar` | `CalendarView` |
| 5 | Notes | `notes` | `NotesView` |
| 6 | Note Editor | `notes-editor` | `NoteEditor` |
| 7 | Pomodoro | `pomodoro` | `PomodoroTimer` |
| 8 | Habits | `habits` | `HabitsView` |
| 9 | Checklist | `checklist` | `ChecklistView` |
| 10 | Statistics | `stats` | `StatsView` |
| 11 | Achievements | `achievements` | `AchievementsView` |
| 12 | AI Chat | `chat` | `ChatView` |

### Data Flow
```
React Components → Custom Hooks (useTasks, useHabits, etc.)
  → TanStack Query (caching, refetching)
    → Supabase JS Client (CRUD operations)
      → PostgreSQL Database (public schema)
```

### Auth Flow
```
Supabase Auth (email/password or Google OAuth)
  → onAuthStateChange listener in AuthContext
    → ProtectedRoute checks context
      → Renders Index or redirects to /auth/login
```

---

## Database Schema

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `profiles` | User profiles | `id`, `email`, `full_name`, `avatar_url` |
| `tasks` | Eisenhower tasks | `title`, `description`, `quadrant`, `priority`, `due_date`, `tags`, `estimated_time`, `status`, `completed`, `notes` |
| `targets` | Time-based targets | `title`, `target_type` (tomorrow/week/month/year), `target_date`, `quadrant`, `priority`, `completed` |
| `calendar_events` | Calendar entries | `title`, `date`, `start_time`, `end_time`, `color`, `location`, `attendees`, `all_day` |
| `habits` | Habit definitions | `title`, `color`, `target_frequency`, `frequency_type` (daily/weekly/monthly), `is_active` |
| `habit_logs` | Daily habit check-ins | `habit_id`, `user_id`, `completed_at`, `log_date` |
| `habit_monthly_journals` | Monthly habit reflections | `habit_id`, `user_id`, `month_year`, `journal_content` |
| `pomodoro_sessions` | Focus session logs | `task_id`, `start_time`, `end_time`, `duration_minutes`, `session_type` (focus/break), `completed` |
| `achievements` | User achievements | `title`, `description`, `image_url`, `achievement_date` |
| `notes` | Rich text notes | `title`, `content`, `tags` (text[]), `linked_tasks` (uuid[]), `color` |

### Storage
- **Bucket:** `achievement-images` — public per-user folder with RLS policies

### Realtime
- `targets` and `tasks` tables published for realtime subscriptions

---

## Getting Started

### Prerequisites
- Node.js 18+ (recommended: install via [nvm](https://github.com/nvm-sh/nvm))
- npm 9+
- A Supabase project (free tier works)

### Installation

```sh
# Clone the repository
git clone https://github.com/your-org/flowdo.git
cd flowdo

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables

The project uses a `.env` file for configuration (committed to the repo with default values). Create or edit `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

These are consumed via `import.meta.env` in:
- `src/integrations/supabase/client.ts` — Supabase URL and anon key
- `src/lib/a4f-api.ts` — Gemini API key
- `src/vite-env.d.ts` — TypeScript type declarations for all env vars

### Database Setup

Run the migration files in `supabase/migrations/` against your Supabase project in order:

1. `001_initial_auth_setup.sql` — Auth triggers, profiles, tasks
2. `002_calendar_events.sql` — Calendar events table
3. `003_notes_table.sql` — Notes table

Alternatively, execute `restore_public_schema.sql` for the complete schema restoration.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start dev server with HMR on port 8080 |
| `build` | `vite build` | Production build |
| `build:dev` | `vite build --mode development` | Development build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Lint all source files |

---

## Project Structure

```
flowdo/
├── public/                    # Static assets
│   ├── Clock.html             # Standalone pomodoro flip-clock timer
│   ├── sounds/                # Timer alert sounds
│   └── Notes/                 # Sample files
├── src/
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component with route definitions
│   ├── index.css              # Global design system + custom utilities
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Authentication state provider
│   │   └── CalendarContext.tsx # Calendar event context
│   ├── integrations/supabase/
│   │   ├── client.ts          # Supabase client singleton
│   │   └── types.ts           # TypeScript type definitions for all tables
│   ├── lib/
│   │   ├── utils.ts           # Utility functions (cn, etc.)
│   │   ├── a4f-api.ts         # AI chat engine (Gemini + web search)
│   │   └── file-utils.ts      # File processing utilities
│   ├── hooks/
│   │   ├── useTasks.ts        # Task CRUD operations
│   │   ├── useHabits.ts       # Habit CRUD + log operations
│   │   ├── useTargets.ts      # Target CRUD + migration
│   │   ├── useNotes.ts        # Notes CRUD operations
│   │   ├── useCalendarEvents.ts # Calendar event CRUD
│   │   ├── useAchievements.ts  # Achievement CRUD + image upload
│   │   ├── usePomodoroSessions.ts # Pomodoro session tracking
│   │   ├── useStatistics.ts   # Analytics engine + 21 badge conditions
│   │   ├── use-toast.ts       # Toast notification system
│   │   └── use-mobile.tsx     # Mobile detection + swipe gestures
│   ├── pages/
│   │   ├── Index.tsx          # Main app shell with 12 views
│   │   ├── Profile.tsx        # User profile page
│   │   ├── NotFound.tsx       # 404 page
│   │   └── auth/              # Auth pages
│   │       ├── Login.tsx      # Login page
│   │       ├── Signup.tsx     # Signup page
│   │       └── ForgotPassword.tsx # Password reset page
│   ├── components/
│   │   ├── Navigation.tsx     # Sidebar with 11 nav items
│   │   ├── ProtectedRoute.tsx # Auth guard wrapper
│   │   ├── TodayView.tsx      # Daily dashboard
│   │   ├── EisenhowerMatrix.tsx # 4-quadrant task board
│   │   ├── TargetsView.tsx    # Time-based target planner
│   │   ├── CalendarView.tsx   # Full calendar (day/month)
│   │   ├── NotesView.tsx      # Notes list with search/filter
│   │   ├── NoteEditor.tsx     # Rich text note editor
│   │   ├── PomodoroTimer.tsx  # Focus timer launcher
│   │   ├── HabitsView.tsx     # Habit tracker with streak
│   │   ├── ChecklistView.tsx  # Daily routine checklists
│   │   ├── ChatView.tsx       # AI chat interface
│   │   ├── StatsView.tsx      # Analytics dashboard
│   │   ├── AchievementsView.tsx # Achievement gallery
│   │   ├── AddTaskDialog.tsx  # Task creation dialog
│   │   ├── EditTaskDialog.tsx # Task edit dialog
│   │   ├── AddTargetDialog.tsx # Target creation dialog
│   │   ├── AddAchievementModal.tsx # Achievement creation modal
│   │   ├── EditAchievementModal.tsx # Achievement edit modal
│   │   ├── CleanupExpiredTargets.tsx # Expired target cleanup
│   │   ├── auth/              # Auth form components
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── UserProfile.tsx
│   │   │   └── GoogleSignInButton.tsx
│   │   └── ui/                # 52 shadcn/ui components
│   │       ├── animated-ai-chat.tsx  # Animated AI chat component
│   │       ├── RichTextEditor.tsx    # ReactQuill wrapper
│   │       ├── file-upload.tsx       # File upload component
│   │       ├── sidebar.tsx           # Sidebar component
│   │       └── ...                   # Standard shadcn components
│   └── utils/
│       ├── migrateTargets.ts   # Target-to-task migration engine
│       ├── migrationSafeguards.ts # Duplicate prevention safeguards
│       ├── taskCleanup.ts      # Task duplicate cleanup
│       └── habitCleanup.ts     # Old habit data cleanup
├── supabase/
│   ├── config.toml            # Supabase project configuration
│   └── migrations/            # Database migration files
│       ├── 001_initial_auth_setup.sql
│       ├── 002_calendar_events.sql
│       └── 003_notes_table.sql
├── Clock.html                 # Standalone pomodoro timer (root copy)
├── restore_public_schema.sql  # Full database schema dump
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tailwind.config.ts
├── components.json            # shadcn/ui configuration
├── postcss.config.js
└── eslint.config.js
```

---

## Design System

### Theme
- **Dark mode first** with full CSS variable-based theming
- Light mode available via `.light` class toggle
- Purple accent (`hsl(263, 70%, 50%)`) as the primary brand color
- Glassmorphism cards with backdrop blur

### Custom Animations (Tailwind)
| Animation | Description |
|---|---|
| `glow` | Pulsing glow effect |
| `shimmer` | Loading shimmer |
| `float` | Floating motion |
| `pulse-subtle` | Subtle pulse |
| `countdown` | Countdown timer effect |
| `meteor` | Meteor shower background |

### CSS Utilities
- `.glass` — Glassmorphism card with backdrop blur
- `.glow` — Glow box shadow
- `.gradient-border` — Gradient border pseudo-element
- `.flip-card` — 3D flip card animation
- `.auth-glass` — Enhanced glass effect for auth pages
- `.gradient-text` — Animated gradient text
- `.sidebar-scrollbar` — Custom purple glowing scrollbar

---

## AI Chat System (Vikram)

The AI assistant uses:
- **Gemini API** via the OpenAI SDK (OpenAI-compatible endpoint)
- **DuckDuckGo** for primary web search
- **Programmable Search** and **programmatic-search** as fallback search providers
- **Monte Carlo simulation** for task completion forecasting
- **Anthropic SDK** as an additional AI provider

The chat interface supports:
- Natural language queries about tasks, habits, calendar events
- `/search` command for web lookups
- `/clone` command for task duplication
- `/improve` command for text enhancement
- File upload analysis (images, PDFs, text)
- Context-aware responses that reference your actual data

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run `npm run lint` to ensure code quality
5. Commit with a descriptive message
6. Push and open a Pull Request

### Code Style
- TypeScript throughout (strict mode disabled)
- React functional components with hooks
- Tailwind classes for styling (inline or cn() utility)
- shadcn/ui conventions for component patterns
- Framer Motion for animations
- No barrel exports — use explicit import paths

---

## Roadmap

- [ ] Unit and integration test suite
- [ ] Mobile app (React Native)
- [ ] Offline support with PWA
- [ ] Collaborative task boards (real-time multiplayer)
- [ ] Email notifications and reminders
- [ ] Public API
- [ ] Plugin system for custom extensions
- [ ] Dark/light mode system toggle
- [ ] Drag-and-drop task reordering
- [ ] Recurring tasks

---

## License

Open source under the [MIT License](LICENSE).

---

*Built with React, Supabase, and TypeScript. Designed for focus, clarity, and getting things done.*
