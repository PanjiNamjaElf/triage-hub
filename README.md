# 🎯 AI Support Triage & Recovery Hub

An AI-powered support ticket management system that ingests customer complaints and asynchronously triages them using an LLM, producing categorized, scored, and "ready-to-send" response drafts.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Engineering Decisions](#engineering-decisions)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Setup](#manual-setup)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)

[Back to Top](#table-of-contents)

---

## Architecture

```
┌─────────────┐     POST /tickets     ┌─────────────┐     Enqueue     ┌─────────┐
│   Next.js   │ ──────────────────▶   │   Express   │ ──────────────▶ │  Redis  │
│  Frontend   │ ◀────── 201 ──────    │   Backend   │                 │ (Queue) │
└─────────────┘                       └─────────────┘                 └────┬────┘
       │                                     │                             │
       │         GET /tickets/:id            │                      BullMQ Worker
       └─────────────────────────────────────┘                             │
                                             │                      ┌──────▼──────┐
                                     ┌───────▼───────┐              │  LLM API    │
                                     │  PostgreSQL   │ ◀────────────│  (OpenAI)   │
                                     └───────────────┘              └─────────────┘
```

**Key Flow:**

1. Customer submits ticket → API returns **201 immediately** (non-blocking).
2. BullMQ dispatches background job to Redis queue.
3. Worker picks up job, calls LLM for triage (3-5s).
4. Validated result is persisted to PostgreSQL as **distinct fields**.
5. Dashboard auto-refreshes to show triaged tickets.

[Back to Top](#table-of-contents)

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 15 (App Router), Tailwind CSS |
| Backend     | Node.js, Express                    |
| Database    | PostgreSQL 16, Prisma ORM           |
| Queue       | BullMQ + Redis (background jobs)    |
| AI          | OpenAI-compatible API (any LLM)     |
| Validation  | Zod (request + AI response)         |
| Container   | Docker Compose                      |

[Back to Top](#table-of-contents)

---

## Engineering Decisions

### 1. Non-Blocking Ingestion (The "Bottleneck" Constraint)

The core challenge: LLM calls take 3-5 seconds, but the API must respond instantly.

**Solution:** BullMQ job queue backed by Redis.

- `POST /tickets` creates the DB record, enqueues a job, and returns `201` immediately.
- A separate BullMQ worker processes the job asynchronously.
- The worker has exponential backoff retries (3 attempts) for transient LLM failures.
- Failed tickets are marked with `FAILED` status and can be manually retried.

**Why BullMQ over alternatives:**

- `setTimeout` / fire-and-forget: No persistence, no retries, jobs lost on crash.
- pg-boss: Adds polling overhead to PostgreSQL.
- BullMQ: Battle-tested, Redis-backed persistence, built-in retries, rate limiting, concurrency control.

### 2. Structured AI Output Validation

The spec requires Category and Score stored as **distinct database fields**, not raw text.

**Solution:** Two-layer validation.

1. **LLM Prompt Engineering:** System prompt strictly specifies JSON schema, low temperature (0.3).
2. **Zod Schema Validation:** After parsing JSON, Zod validates every field type, range, and enum value.
3. **Edge Case Handling:** Strips markdown code fences some models wrap around JSON.

If validation fails, the error is captured and the ticket enters `FAILED` state with a descriptive error message.

### 3. Database Design

- Enum types for `status`, `urgency`, `category` — enforced at DB level for data integrity.
- Separate `aiDraft` (original AI output) and `resolvedReply` (agent-edited version) to preserve audit trail.
- Indexed columns for common query patterns (status, urgency, creation date).
- `retryCount` and `errorMessage` for observability on failed triage attempts.

### 4. Real-Time Dashboard Updates

Instead of WebSocket complexity, the dashboard uses **polling** (every 5 seconds) which is appropriate for a support queue that doesn't need sub-second updates. The ticket detail page polls every 3 seconds while a ticket is in `PENDING`/`PROCESSING` state, then stops polling once it reaches a terminal state.

### 5. Worker Resilience

- **Concurrency:** 3 parallel jobs to balance throughput vs. rate limits.
- **Rate Limiting:** Max 10 jobs per minute to respect LLM API quotas.
- **Exponential Backoff:** 2s → 4s → 8s between retries.
- **Graceful Shutdown:** SIGTERM/SIGINT handlers to finish in-flight jobs.

[Back to Top](#table-of-contents)

---

## Quick Start (Docker)

### Prerequisites

- Docker & Docker Compose installed.
- An OpenAI API key (or any OpenAI-compatible LLM key).

### Steps

```bash
# 1. Clone the repository.
git clone https://github.com/PanjiNamjaElf/triage-hub.git
cd triage-hub

# 2. Set your LLM API key.
export LLM_API_KEY=sk-your-openai-api-key

# 3. Start all services.
docker compose up --build

# 4. Run database migration (first time only, in a new terminal).
docker exec triage_backend npx prisma migrate deploy

# 5. (Optional) Seed demo data.
docker exec triage_backend node prisma/seed.js
```

**Access:**

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:4000/api](http://localhost:4000/api)
- Health Check: [http://localhost:4000/api/health](http://localhost:4000/api/health)

[Back to Top](#table-of-contents)

---

## Manual Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Backend

```bash
cd backend

# Install dependencies.
npm install

# Configure environment.
cp .env.example .env
# Edit .env with your database URL, Redis URL, and LLM API key.

# Run migrations.
npx prisma migrate deploy

# Generate Prisma client.
npx prisma generate

# (Optional) Seed demo data.
node prisma/seed.js

# Start development server (includes worker).
npm run dev
```

### Frontend

```bash
cd frontend

# Install dependencies.
npm install

# Configure environment.
cp .env.example .env.local

# Start development server.
npm run dev
```

[Back to Top](#table-of-contents)

---

## API Reference

### Create Ticket

```
POST /api/tickets
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "subject": "Double charged",
  "complaint": "I was charged twice for my subscription this month..."
}

Response: 201 Created
{
  "data": { "id": "uuid", "status": "PENDING", ... },
  "message": "Ticket created. AI triage processing in background."
}
```

### List Tickets

```
GET /api/tickets?status=TRIAGED&urgency=HIGH&page=1&limit=20
```

### Get Ticket

```
GET /api/tickets/:id
```

### Resolve Ticket

```
PATCH /api/tickets/:id/resolve
Content-Type: application/json

{
  "resolvedReply": "Dear John, we have processed your refund..."
}
```

### Retry AI Triage

```
POST /api/tickets/:id/retry
```

### Dashboard Stats

```
GET /api/tickets/stats
```

[Back to Top](#table-of-contents)

---

## Project Structure

```
triage-hub/
├── docker-compose.yml          # Full stack orchestration.
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema with enums.
│   │   ├── seed.js             # Demo data seeder.
│   │   └── migrations/         # SQL migrations.
│   └── src/
│       ├── index.js            # Express app entry point.
│       ├── lib/
│       │   ├── prisma.js       # Prisma client singleton.
│       │   └── queue.js        # BullMQ queue configuration.
│       ├── routes/
│       │   └── tickets.js      # Ticket API routes.
│       ├── controllers/
│       │   └── ticketController.js  # Request handlers.
│       ├── services/
│       │   └── aiService.js    # LLM triage with Zod validation.
│       ├── workers/
│       │   └── triageWorker.js # Background AI processing worker.
│       └── middleware/
│           ├── validation.js   # Zod request validation.
│           └── errorHandler.js # Global error handler.
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    └── src/
        ├── app/
        │   ├── layout.jsx      # Root layout with sidebar.
        │   ├── globals.css     # Tailwind directives.
        │   ├── page.jsx        # Dashboard (ticket list).
        │   ├── submit/
        │   │   └── page.jsx    # Submit ticket form.
        │   └── tickets/
        │       └── [id]/
        │           └── page.jsx  # Ticket detail + resolve.
        ├── components/
        │   ├── TicketList.jsx  # Color-coded ticket list.
        │   └── StatsBar.jsx    # Dashboard metrics.
        └── lib/
            └── api.js          # API client helper.
```

[Back to Top](#table-of-contents)
