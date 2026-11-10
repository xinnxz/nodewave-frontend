# NodeWave Deliverables Management System (Frontend)

Frontend web application built for the **NodeWave Fullstack / Product Engineer Technical Assessment**.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **UI Core:** React 19 + TypeScript (`strict: true`)
- **Styling:** Tailwind CSS 4
- **Data Fetching & Caching:** TanStack Query 5 + Axios (`NEXT_PUBLIC_BE_URL`)
- **State Management:** Zustand 5
- **Forms & Validation:** React Hook Form + Zod
- **Tooling:** Biome (Lint & Format) + Husky + Commitlint (Conventional Commits)

## Key Architectural Features Implemented
1. **Dual-Layer RBAC + ABAC Protection:**
   - Action buttons on both the Kanban Board and Task Detail page evaluate `Role x Department x Task State x DAG Prerequisites`.
   - Product Manager (`PM`) has full read/write access to projects and tasks, but the `IN_PROGRESS -> DONE` button is locked/disabled with an explicit ABAC explanation (and enforced at the API layer).
   - Internal Engineers (`UIUX`, `FRONTEND`, `BACKEND`) cannot edit core task descriptions and can only transition task status when all prerequisite tasks are `DONE`.
2. **Dependency-Aware Task Board (DAG):**
   - 4-column Kanban workflow (`TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`) displaying real-time prerequisite badges and blocker warnings.
   - Interactive dependency manager with backend DFS Circular Dependency detection.
3. **Concurrency & Optimistic Locking (`409 Conflict`):**
   - Every task displays its live version counter (`v1`, `v2`, etc.).
   - Includes a 1-click **Race Condition Simulator** on the Task Detail page to demonstrate `HTTP 409 Conflict` rejection and state refresh.
4. **Multi-Tenant Isolation & API Data Masking (`CLIENT_GUEST`):**
   - Client Guests only see their own project's aggregate metrics and tasks flagged `isClientVisible = true`, with internal identities stripped at the API response level.
5. **Quick Role Switcher:**
   - Top navigation bar includes a 1-click switcher between all 5 seeded accounts (`PM`, `UI/UX`, `Frontend`, `Backend`, `Client Guest`) for rapid evaluator inspection.

## Getting Started

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run development server:
   ```bash
   bun run dev
   ```
   Open `http://localhost:3000`.
