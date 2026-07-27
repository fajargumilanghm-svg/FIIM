# FIIM Developer Onboarding Guide

> **Goal**: Get the full FIIM development environment running locally in under 5 minutes.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v4.25+)
- [Node.js](https://nodejs.org/) v20 LTS
- [npm](https://www.npmjs.com/) v9+ (included with Node.js)
- [Git](https://git-scm.com/)

**Recommended**:
- [VS Code](https://code.visualstudio.com/) with extensions: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense
- Make (for using Makefile commands)

---

## Quick Start (5 Minutes)

### 1. Clone & Navigate
```bash
git clone <repository-url> fiim
cd fiim
```

### 2. Start Infrastructure (Docker)
```bash
cd infra/docker
docker-compose up -d
```

**Services started**:
| Service | URL | Purpose |
|---------|-----|---------|
| PostgreSQL + TimescaleDB | `localhost:5432` | Primary database |
| Redis | `localhost:6379` | Cache & sessions |
| RabbitMQ | `localhost:5672` | Message queue |
| RabbitMQ Management UI | http://localhost:15672 (`fiim` / `fiim_password`) | Queue monitoring |
| Elasticsearch | `localhost:9200` | Search & audit |
| MinIO (S3) | http://localhost:9001 (`fiim_minio` / `fiim_minio_password`) | File storage |
| pgAdmin | http://localhost:5050 (`dev@fiim.local` / `fiim_admin`) | DB GUI |
| Nginx Proxy | http://localhost | Reverse proxy |

### 3. Setup Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run start:dev
```
API akan berjalan di: http://localhost:3000/api/v1

### 4. Setup Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Web akan berjalan di: http://localhost:5173

### 5. Access the Application
- **Web App**: http://localhost (via Nginx) atau http://localhost:5173 (direct)
- **API Docs (Swagger)**: http://localhost:3000/api/docs
- **API Base**: http://localhost:3000/api/v1

---

## Project Structure

```
FIIM/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication (OAuth2, MFA, RBAC)
│   │   │   ├── users/          # User management
│   │   │   ├── athletes/       # Athlete profiles & demographics
│   │   │   ├── wellness/       # Daily wellness surveys
│   │   │   ├── training-load/  # GPS, RPE, session data
│   │   │   ├── calculations/   # ACWR, RPE algorithms (100% test coverage)
│   │   │   ├── injuries/       # Injury management workflow
│   │   │   ├── alerts/         # Threshold-based alerting
│   │   │   ├── reports/        # PDF/Excel generation
│   │   │   ├── dashboard/      # Aggregated metrics
│   │   │   ├── import/         # CSV/XML/3rd party imports
│   │   │   ├── audit/          # Compliance logging
│   │   │   └── admin/          # System administration
│   │   ├── common/             # Guards, interceptors, pipes, decorators
│   │   ├── config/             # App configuration
│   │   ├── prisma/             # Database schema & migrations
│   │   └── main.ts             # Application bootstrap
│   ├── test/                   # E2E tests
│   └── package.json
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── modules/            # Feature-based modules
│   │   ├── components/         # Shared UI components (Shadcn/ui)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand state management
│   │   ├── services/           # API clients
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Helpers & formatters
│   │   └── App.tsx             # Root component
│   └── package.json
├── infra/
│   ├── docker/                 # Docker configs & compose
│   ├── terraform/              # AWS IaC (Stage 2)
│   └── k8s/                    # Kubernetes manifests (Stage 2)
└── docs/                       # Architecture & design docs
```

---

## Common Commands

### Backend
```bash
npm run start:dev         # Development with hot reload
npm run test              # Unit tests
npm run test:cov          # Coverage report
npm run test:e2e          # End-to-end tests
npm run db:migrate        # Run database migrations
npm run db:seed           # Seed development data
npm run db:studio         # Open Prisma Studio (GUI)
npm run lint              # ESLint check
npm run format            # Prettier format
```

### Frontend
```bash
npm run dev               # Vite dev server
npm run build             # Production build
npm run preview           # Preview production build
npm run test              # Vitest unit tests
npm run test:coverage     # Coverage report
npm run lint              # ESLint check
npm run format            # Prettier format
npm run typecheck         # TypeScript type check
```

### Docker
```bash
docker-compose up -d      # Start all services
docker-compose down       # Stop all services
docker-compose logs -f api    # Tail API logs
docker-compose logs -f web    # Tail web logs
docker-compose ps         # List running services
```

---

## Environment Variables

### Backend (.env)
Copy `.env.example` to `.env` and adjust:

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://fiim_dev:fiim_dev_password@localhost:5432/fiim_development

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://fiim:fiim_password@localhost:5672

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# MinIO / S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=fiim_minio
MINIO_SECRET_KEY=fiim_minio_password
MINIO_BUCKET=fiim-uploads

# JWT
JWT_SECRET=change_this_in_production_use_32_char_min
JWT_EXPIRATION=4h
REFRESH_TOKEN_EXPIRATION=7d

# 3rd Party (leave empty for local dev)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=

# App
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000
LOG_LEVEL=debug
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=FIIM
VITE_APP_VERSION=1.0.0
```

---

## Database Workflow

1. **Modify schema**: Edit `backend/prisma/schema.prisma`
2. **Generate migration**: `npm run db:migrate` (creates SQL file)
3. **Apply migration**: Migration applies automatically on API startup
4. **Update client**: `npm run db:generate` (regenerates Prisma Client types)
5. **Seed data**: `npm run db:seed` (for dev data)

---

## Testing Strategy

| Type | Command | Coverage Target |
|------|---------|----------------|
| Unit (Backend) | `npm run test` | 80%+ |
| E2E (Backend) | `npm run test:e2e` | Critical paths |
| Calculation Engine | `npm run test` | **100%** |
| Unit (Frontend) | `npm run test` | 70%+ |
| Integration | CI pipeline | Full regression |

---

## Troubleshooting

### Port already in use
```bash
# Kill processes using port 5432 (PostgreSQL)
lsof -ti:5432 | xargs kill -9

# Or use different ports in docker-compose.yml
```

### Database connection refused
```bash
# Ensure Docker is running and healthy
docker-compose ps
docker-compose logs postgres
```

### Prisma Client not found
```bash
cd backend
npm run db:generate
```

### Node modules issues
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/FIIM-123-auth-module`
2. **Implement** with tests
3. **Run lint & tests**: `npm run lint && npm run test`
4. **Commit** with conventional commits: `feat(auth): add OAuth2 login`
5. **Push** & create Pull Request
6. **Code Review** (require 2 approvals for calculation engine)
7. **Merge** to `develop`

---

## Security Notes for Local Dev

- JWT secret in `.env` is for development only. Production uses AWS Secrets Manager.
- Never commit `.env` files. They are in `.gitignore`.
- Default passwords are in `docker-compose.yml` for local convenience only.

---

## Module Status

| Module | Backend | Frontend | Notes |
|--------|:-------:|:--------:|-------|
| auth / users | ✅ | ✅ (login) | JWT, RBAC, MFA scaffolding |
| athletes | ✅ | ✅ | CRUD + stats |
| wellness | ✅ | ✅ | surveys, team avg, athlete trend |
| training-load | ✅ | ✅ | sessions, sRPE, load history |
| calculations | ✅ | ✅ (dashboard) | ACWR engine, **100% covered** |
| dashboard | ✅ | ✅ | aggregated metrics |
| alerts | ✅ | ✅ | ACWR-threshold alerts, ack/resolve |
| injuries | ✅ | ✅ | CRUD, return-to-play, days-lost |
| reports | ✅ | ✅ | team summary + CSV export |
| audit | ✅ | ✅ | compliance log viewer (admin) |
| import | ✅ | ✅ | CSV wellness import + preview |
| admin | ✅ | ✅ | org overview + compliance settings |

Testing: run `npm test` in `backend/` (unit) and `frontend/` (vitest);
`npm run test:e2e` in `backend/` for the bootstrap e2e (needs a DB for
data-backed specs).

For architecture details, see:
- [Technical Architecture](../FIIM_PRD.md#section-8)
- [Database Schema](../FIIM_Database_Schema.sql)
- [API Specification](../FIIM_OpenAPI.yaml)
- [UI/UX Specification](../FIIM_UIUX_Wireframe_Spec.md)

---

**Questions?** Contact the Tech Lead or check the #dev channel.
