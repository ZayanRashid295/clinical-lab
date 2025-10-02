# Clinical Lab

## Overview

Clinical Lab is an interactive medical education platform that revolutionizes clinical training through AI-powered simulations. The platform enables medical students to practice clinical interviews with AI patients, observe expert consultations in "shadow mode," and receive OSCE-style assessments with detailed rubric-based feedback. Faculty members can monitor student progress, assign cases, and track cohort performance through comprehensive analytics dashboards.

The application serves three primary user roles: medical students who practice and learn, faculty members who assign cases and monitor progress, and institutional administrators who manage cohorts and curricula. The platform combines gamification elements (leaderboards, Elo ratings, achievements) with professional medical credibility to create an engaging yet clinically rigorous learning environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 18 with TypeScript, using Vite as the build tool and development server. The application follows a component-based architecture with client-side routing via Wouter.

**UI Framework**: Built on shadcn/ui components (Radix UI primitives) with Tailwind CSS for styling. The design system implements a hybrid approach combining medical credibility with modern engagement, using a carefully crafted color palette (Medical Blue, Deep Navy, Success Green, Alert Red) that adapts between light and dark modes.

**State Management**: TanStack Query (React Query) for server state management with custom query client configuration. The application uses a centralized API request pattern with credential-based authentication and comprehensive error handling.

**Component Architecture**:

- Reusable UI components in `/client/src/components/ui/` (buttons, cards, dialogs, etc.)
- Feature-specific components (ChatBubble, CaseCard, RubricScorecard, LeaderboardTable)
- Layout components (AppSidebar with role-based navigation)
- Page-level components in `/client/src/pages/`

**Routing Strategy**: Client-side routing with Wouter supporting routes for:

- Landing page and authentication
- Student dashboard and case library
- Case sessions (shadow mode and clinical interview mode)
- Leaderboards and achievements
- Faculty dashboard and analytics

### Backend Architecture

**Runtime**: Node.js with Express server framework using ESM modules.

**API Design**: RESTful API pattern with routes prefixed under `/api`. The application uses a storage abstraction layer (IStorage interface) currently implemented with in-memory storage (MemStorage class), designed to be swapped with database persistence.

**Session Management**: Express session handling with middleware for request/response logging, JSON parsing, and error handling. The architecture supports credential-based authentication flows.

**Development Setup**: Custom Vite middleware integration for HMR in development, with separate production build pipeline using esbuild for server bundling.

### Data Storage Solutions

**Current Implementation**: In-memory storage (MemStorage) implementing the IStorage interface with basic CRUD operations for users.

**Database Schema**: Drizzle ORM configured for PostgreSQL with schema defined in `/shared/schema.ts`. Current schema includes:

- Users table with UUID primary keys, username/password authentication
- Zod validation schemas for type-safe data insertion

**Migration Strategy**: Drizzle Kit configured for schema migrations with output to `/migrations` directory.

**Planned Expansion**: The storage interface is designed to support additional entities for cases, student progress, assessments, rubrics, achievements, and leaderboard data.

### Authentication & Authorization

**Current State**: Basic user schema with username/password fields. Storage interface provides methods for user lookup by ID and username, plus user creation.

**Planned Implementation**: The architecture supports role-based access control with student and faculty roles already implemented in UI components (AppSidebar role prop, separate dashboard routes).

**Session Security**: Express session configuration with connect-pg-simple for PostgreSQL-backed session storage once database is provisioned.

### External Dependencies

**UI Component Library**:

- Radix UI primitives (@radix-ui/\*) for accessible, unstyled component foundations
- shadcn/ui configuration with "new-york" style variant
- Tailwind CSS with custom theme extending base colors and typography

**Form Handling**:

- React Hook Form with @hookform/resolvers for validation
- Zod schemas via drizzle-zod for type-safe form validation

**Database & ORM**:

- Drizzle ORM for type-safe database queries
- @neondatabase/serverless for PostgreSQL connectivity with WebSocket support
- connect-pg-simple for PostgreSQL session storage

**Development Tools**:

- Vite with @vitejs/plugin-react for fast development
- Replit-specific plugins (@replit/vite-plugin-runtime-error-modal, cartographer, dev-banner)
- TypeScript with strict mode enabled

**Utilities**:

- date-fns for date manipulation
- embla-carousel-react for carousel components
- class-variance-authority and clsx for conditional styling
- nanoid for unique ID generation

**Asset Management**: Custom Vite alias configuration pointing to `/attached_assets` directory for images and media files used in hero sections and feature showcases.
