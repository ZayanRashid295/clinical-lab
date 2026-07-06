# Clinical Lab

Medical education platform: QBank, assessments, subscriptions, MedPrep AI, and admin tooling.

## Structure

| Path | Description |
|------|-------------|
| `backend/` | NestJS API, Prisma, MySQL |
| `frontend-next/` | Next.js app |
| `docs/` | Deployment and production setup |

## Local development

```bash
# Install dependencies
npm run install:all

# Backend (.env with DATABASE_URL, JWT_SECRET, etc.)
cd backend && cp env.example .env

# Run migrations (dev)
npm run prisma:migrate

# Start both apps
cd .. && npm run dev
```

- Frontend: http://localhost:3001  
- Backend: http://localhost:3000  

Or run separately:

```bash
cd backend && yarn start:dev
cd frontend-next && yarn dev
```

## Production

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) and [docs/PRODUCTION_ENV_SETUP.md](docs/PRODUCTION_ENV_SETUP.md).

```bash
cd backend
npm run prisma:generate
npx prisma migrate deploy
npm run build
```

## Docker

```bash
docker compose up -d
```
