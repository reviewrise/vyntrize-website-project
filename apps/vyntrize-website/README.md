# Vyntrize Website

Marketing website for Vyntrize with integrated CRM for contact form submissions.

## Features

- Modern Next.js 15 website with React 19
- Contact form with lead tracking
- PostgreSQL database for CRM
- Prisma ORM for type-safe database access
- Docker-ready for production deployment

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS, Motion (Framer Motion)
- **Database**: PostgreSQL with Prisma
- **Icons**: Lucide React

## Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Update `DATABASE_URL` in `.env` with your PostgreSQL connection string.

3. **Run database migrations**:
   ```bash
   pnpm db:migrate:dev
   ```

4. **Generate Prisma client**:
   ```bash
   pnpm db:generate
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```

   The site will be available at `http://localhost:3000`

## Database Schema

The CRM database includes:

- **ContactSubmission**: Stores all contact form submissions with:
  - Contact info (name, email, company)
  - Intent/interest area
  - Message content
  - Lead status tracking (NEW, CONTACTED, QUALIFIED, etc.)
  - Priority levels
  - Assignment to team members
  - Follow-up tracking
  - Source/referrer tracking

## API Routes

- `POST /api/contact` - Submit contact form
- `GET /api/health` - Health check endpoint

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run migrations (production)
- `pnpm db:migrate:dev` - Run migrations (development)
- `pnpm db:studio` - Open Prisma Studio

## Production Deployment

The website is containerized and deployed via Docker Compose:

1. **Build the Docker image**:
   ```bash
   docker build -t vyntrize-website -f apps/vyntrize-website/Dockerfile .
   ```

2. **Deploy with docker-compose**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d vyntrize-website
   ```

The service runs on port 3013 and is routed through Nginx at `vyntrise.com`.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port (default: 3013) | No |

## CRM Management

To view and manage contact submissions:

```bash
pnpm db:studio
```

This opens Prisma Studio where you can:
- View all contact submissions
- Update lead status
- Assign leads to team members
- Add follow-up notes
- Track conversion funnel
