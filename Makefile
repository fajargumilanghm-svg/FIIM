# FIIM Sprint 1 - Quick Start Commands

.PHONY: setup infra backend frontend dev test clean

# Initial setup
setup:
	cd backend && npm install && npx prisma generate
	cd frontend && npm install

# Start infrastructure (Docker)
infra:
	cd infra/docker && docker-compose up -d

# Start backend only
backend:
	cd backend && npm run start:dev

# Start frontend only
frontend:
	cd frontend && npm run dev

# Start everything (run infra first, then backend & frontend in separate terminals)
dev: infra
	@echo "Infrastructure started. Now run 'make backend' and 'make frontend' in separate terminals."

# Database migration
migrate:
	cd backend && npx prisma migrate dev

# Seed database
seed:
	cd backend && npx prisma db seed

# Reset database
reset:
	cd backend && npx prisma migrate reset --force

# Run backend tests
test-backend:
	cd backend && npm test

# Run frontend tests
test-frontend:
	cd frontend && npm test

# Stop all docker services
stop:
	cd infra/docker && docker-compose down

# Clean everything
clean: stop
	cd backend && rm -rf node_modules dist
	cd frontend && rm -rf node_modules dist
