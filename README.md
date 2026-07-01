# QueueForge

Asynchronous notification processing system built with Node.js, RabbitMQ, and Redis — designed to decouple request handling from slow, unreliable third-party operations (email/push delivery) using message queues, with automatic retries and job status tracking.

## Why this project

Most CRUD-style portfolio APIs respond synchronously and never fail gracefully. QueueForge demonstrates a different pattern: an API that accepts a request, immediately acknowledges it, and delegates the actual work to background workers — with visibility into job state and resilience when things go wrong (which they always eventually do).

## Architecture

```
┌─────────────┐      publish       ┌──────────────┐      consume      ┌─────────────┐
│  API Service │ ─────────────────▶ │   RabbitMQ    │ ─────────────────▶ │   Worker    │
│ (Express)    │                    │ (notifications│                    │  Service    │
└─────────────┘                    │     queue)     │                    └─────────────┘
       │                            └──────────────┘                            │
       │                                    │ nack/fail                         │
       │                                    ▼                                   │
       │                          ┌──────────────────┐                          │
       │                          │ Dead Letter Queue │                         │
       │                          └──────────────────┘                          │
       │                                                                        │
       ▼                                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                     Redis                                        │
│              (job status tracking: pending → processing → sent/failed)          │
│                         (API rate limiting)                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Flow:**
1. Client calls `POST /notifications` with a notification payload.
2. API validates the request, stores an initial job status in Redis (`pending`), publishes the message to RabbitMQ, and immediately responds `202 Accepted` with a `jobId`.
3. A worker process consumes the message, updates status to `processing`, attempts delivery (email via SMTP/mock provider).
4. On success → status set to `sent`. On failure → automatic retry with backoff; after max retries, the message is routed to a **Dead Letter Queue** and status set to `failed`.
5. Client can poll `GET /notifications/:jobId/status` at any time to check progress.

## Tech Stack

- **Runtime:** Node.js
- **API Framework:** Express (or Fastify — TBD during implementation)
- **Message Broker:** RabbitMQ (via `amqplib`)
- **State & Rate Limiting:** Redis
- **Email delivery:** Nodemailer (SMTP test provider, e.g. Ethereal/Mailtrap)
- **Containerization:** Docker & Docker Compose
- **Validation:** Zod

## Features

- Asynchronous, non-blocking API — clients never wait on the actual delivery
- Job status tracking (`pending`, `processing`, `sent`, `failed`) queryable via API
- Automatic retry with exponential backoff on transient failures
- Dead Letter Queue for messages that exhaust retries
- Basic rate limiting on the public API using Redis
- Fully containerized local environment — single `docker compose up` to run everything

## Getting Started

```bash
git clone https://github.com/mmss1995/queueforge.git
cd queueforge
cp .env.example .env
docker compose up --build
```

This starts:
- `api` — the public-facing REST API
- `worker` — the background notification processor
- `rabbitmq` — broker (management UI at `http://localhost:15672`)
- `redis` — state store

## API Reference

| Method | Endpoint                     | Description                          |
|--------|-------------------------------|---------------------------------------|
| POST   | `/notifications`             | Enqueue a new notification job        |
| GET    | `/notifications/:jobId/status` | Get current status of a job          |
| GET    | `/health`                    | Health check                          |

**Example request:**

```bash
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "to": "user@example.com",
    "template": "welcome",
    "data": { "name": "Matteo" }
  }'
```

**Example response:**

```json
{
  "jobId": "5f2c1e3a-8b1d-4b6f-9e2a-1234567890ab",
  "status": "pending"
}
```

## Environment Variables

```
PORT=3000
RABBITMQ_URL=amqp://rabbitmq:5672
REDIS_URL=redis://redis:6379
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAX_RETRIES=3
```

## Project Structure

```
queueforge/
├── api/                # API service (Express app, routes, validation)
├── worker/             # Worker service (queue consumer, retry logic)
├── shared/             # Shared types/schemas between api and worker
├── docker-compose.yml
├── .env.example
└── README.md
```

## Roadmap / Next Release

- **Multi-job-type routing** — support additional job types (e.g. push notifications, SMS) with dedicated queues and worker routing logic, instead of a single notification type.
- **Image processing pipeline** — extend the worker architecture to handle a second, heavier job type (e.g. thumbnail generation on upload), to demonstrate queue routing across different workloads.
- Structured logging and basic metrics (job throughput, failure rate)
- Integration tests for the full publish → consume → retry → DLQ flow

## License

MIT
