# UWorld USMLE Question Bank - Medical Education Platform

## Overview

This is a comprehensive medical education platform designed for USMLE exam preparation, modeled after UWorld's question bank interface. The application provides medical students with practice questions, performance analytics, study planning tools, flashcards, and a medical library to support their exam preparation journey.

The platform emphasizes clinical precision in data presentation, cognitive load reduction through clear hierarchy, and efficient navigation for time-pressed medical students. It features a professional, information-dense interface with both light and dark mode support.

**Current Implementation Status**: Fully functional with complete backend API integration. All 10 pages are connected to real backend APIs using React Query for data fetching and state management. Uses in-memory storage that persists during the session but resets on server restart.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens following healthcare UI patterns

**Design System**:
- Professional medical education aesthetic with Material Design influence
- Comprehensive color palette supporting light/dark modes with semantic naming
- Custom CSS variables for theming (primary blue: 210 100% 45%, success green, error red, warning amber)
- Accessibility-focused design for extended study sessions
- Responsive layout with mobile breakpoint at 768px

**Component Structure**:
- Reusable UI components in `/client/src/components/ui/` (buttons, cards, forms, dialogs, etc.)
- Domain-specific components for question banks, test creation, performance tracking
- Example components for documentation/testing in `/client/src/components/examples/`

### Backend Architecture

**Server Framework**: Express.js with TypeScript
- Complete REST API implementation in `server/routes.ts` with 15+ endpoints
- Custom Vite middleware integration for development
- Error handling middleware for consistent error responses
- Request/response logging for API routes
- Zod validation for all request bodies

**Storage Layer**:
- Abstract storage interface (`IStorage`) for CRUD operations
- Current implementation uses in-memory storage (`MemStorage`) with comprehensive seed data
- Designed to swap to database-backed storage without changing business logic
- Seed data includes: 50 USMLE questions with status tracking, 5 completed tests, study tasks, flashcard decks, medical articles, and notes

### Data Storage Solutions

**ORM**: Drizzle ORM configured for PostgreSQL
- Schema definition in `/shared/schema.ts`
- Database migrations output to `/migrations` directory
- Type-safe database queries with Zod validation schemas
- Currently configured for Neon serverless PostgreSQL

**Database Schema** (Initial):
- Users table with UUID primary keys, username (unique), and password fields
- Schema uses PostgreSQL-specific features (gen_random_uuid)
- Validation schemas generated from Drizzle schemas using drizzle-zod

**Note**: The application uses in-memory storage by design (user preference). Data persists during the session but resets on server restart. The database layer (Drizzle + PostgreSQL) is configured but intentionally not used to keep the application lightweight.

### Authentication and Authorization

**Current State**: Basic user schema defined but authentication not implemented
- User model includes username/password fields
- No active session management or auth middleware
- Storage interface includes user CRUD methods (getUser, getUserByUsername, createUser)

**Planned Approach**: Session-based authentication expected
- `connect-pg-simple` dependency suggests PostgreSQL session store
- Express session management to be implemented

### External Dependencies

**UI Components**:
- Radix UI primitives for accessible, unstyled components
- Shadcn/ui as the base design system
- Lucide React for iconography
- Recharts for data visualization (performance analytics)
- CMDK for command palette functionality
- Embla Carousel for image/content carousels

**Development Tools**:
- Vite for build tooling and development server
- Replit-specific plugins for runtime error handling and dev environment
- TypeScript for type safety across frontend and backend
- ESBuild for server-side bundling

**Data Management**:
- TanStack React Query for API requests and caching
- React Hook Form with Zod resolvers for form validation
- Date-fns for date manipulation

**Database & ORM**:
- Drizzle ORM for type-safe database queries
- @neondatabase/serverless for PostgreSQL connectivity
- Drizzle Kit for migrations and schema management

**Styling**:
- Tailwind CSS with PostCSS
- Class Variance Authority for component variant management
- CLSX and tailwind-merge for class name handling

**Fonts**:
- Inter (400, 500, 600, 700) for UI text
- JetBrains Mono for code/monospace content
- Loaded from Google Fonts

## Application Features

### Implemented Pages (All Connected to Backend APIs)

1. **Dashboard** (`/`)
   - Performance overview with real-time stats from API
   - Question score, QBank usage, and test completion tracking
   - Upcoming study tasks display
   - Quick access to all features

2. **Create Test** (`/create-test`)
   - Tutor Mode and Timed Mode test creation
   - Subject and system filtering
   - Custom question pool selection
   - Fully functional test configuration

3. **Search** (`/search`)
   - Question search with multi-filter support (subject, system, status, keyword)
   - Status-based filtering: Correct, Incorrect, Unseen
   - Real-time search with debouncing
   - Question details with explanations

4. **Study Planner** (`/study-planner`)
   - Task management with completion tracking
   - Upcoming, overdue, and completed task tabs
   - Task completion mutations
   - Progress visualization

5. **Medical Library** (`/medical-library`)
   - Searchable medical articles and videos
   - Category filtering (Articles, Videos, Guidelines)
   - Content type badges
   - Real-time search functionality

6. **Notes** (`/notes`)
   - Full CRUD operations for study notes
   - Subject-based organization
   - Create, read, and delete functionality
   - Toast notifications for user feedback

7. **Notebook** (`/notebook`)
   - Alternative notes interface
   - Subject/category tagging system
   - Grid layout with card-based UI
   - Connected to same notes API

8. **Flashcards** (`/flashcards`)
   - Flashcard deck management
   - Create and delete decks
   - Progress tracking with mastered/due counts
   - Study statistics per deck

9. **Previous Tests** (`/previous-tests`)
   - Test history display
   - Performance metrics per test
   - Searchable test list
   - Detailed test statistics

10. **Performance** (`/performance`)
    - Comprehensive performance analytics
    - Subject-wise performance tracking
    - Performance trends over time
    - Statistical overview with charts

### API Endpoints

**Questions**
- `GET /api/questions` - Get all questions
- `GET /api/questions/:id` - Get single question
- `GET /api/questions/search` - Search with filters (subject, system, status, searchTerm)
- `POST /api/questions` - Create new question

**Tests**
- `GET /api/tests` - Get all tests
- `GET /api/tests/:id` - Get single test
- `POST /api/tests` - Create new test

**Study Tasks**
- `GET /api/study-tasks` - Get all tasks
- `PATCH /api/study-tasks/:id` - Update task (mark complete)
- `POST /api/study-tasks` - Create new task

**Notes**
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create new note
- `DELETE /api/notes/:id` - Delete note

**Flashcards**
- `GET /api/flashcard-decks` - Get all decks
- `GET /api/flashcard-decks/:id/flashcards` - Get flashcards for deck
- `POST /api/flashcard-decks` - Create new deck
- `DELETE /api/flashcard-decks/:id` - Delete deck

**Medical Library**
- `GET /api/articles/search` - Search articles with filters

**Performance**
- `GET /api/performance/stats` - Get performance statistics

### Data Models

**Question Schema**:
- Text, options, correct answer, explanation
- Subject and system categorization
- Difficulty level (Easy, Medium, Hard)
- Status tracking: correct, incorrect, unseen
- User answer recording

**Test Schema**:
- Mode (Tutor/Timed), duration, question count
- Subject and system filters
- Performance metrics (score, time)
- Completion status

**Study Task Schema**:
- Title, type, duration, due date
- Status: upcoming, overdue, completed
- Priority and scheduling information

**Note Schema**:
- Title, content, subject
- Tags for categorization
- Timestamp tracking

**Flashcard Deck Schema**:
- Name, description, card count
- Individual flashcards with front/back
- Mastery tracking per card

## Recent Changes (October 13, 2025)

### Phase 1: Complete Test Creation & Taking Workflow ✅

**Core Test Flow (Production-Ready)**
1. **Schema Enhancements**
   - Made `mode` field required in Test schema
   - Added proper default values: `questions: []`, `answers: {}`, `markedQuestions: []`
   - Enforced data consistency across test lifecycle

2. **Test Creation with Smart Filtering**
   - Implemented OR-based filtering: questions match ANY selected subject OR system
   - Added comprehensive error handling with specific user-friendly messages
   - Fixed system ID alignment between UI and seed data (e.g., "cardio" vs "Cardiovascular System")
   - Validates sufficient question availability before test creation

3. **Question ID Architecture**
   - Tests store actual question IDs in `questions` array
   - TestSession and TestResults fetch questions by stored IDs
   - Eliminates filter re-application issues and ensures consistent question sets

4. **API Request Layer Fix**
   - Fixed `apiRequest` to return parsed JSON instead of Response object
   - Proper error propagation from backend to frontend
   - Toast notifications display server error messages

5. **SystemSelector Improvements**
   - Implemented "Expand All" functionality for accordion navigation
   - System IDs standardized across UI and backend (short IDs like "cardio", "allergy", "endo")

6. **Test Execution Flow**
   - Dashboard → Create Test → Test Session → Test Results
   - Question answering with answer tracking
   - Test submission with score calculation
   - Performance analysis on results page

7. **Seed Data**
   - 15 comprehensive USMLE questions across multiple subjects and systems
   - Proper system ID mapping (cardio, allergy, endo, neuro, pulm, gi, infectious, heme-onc, rheum, renal, biochem-general)
   - Mix of correct/incorrect/unseen statuses for testing

**End-to-End Testing**
- Automated test validates complete workflow
- Multi-subject/system test creation verified
- Question display and answering functionality confirmed
- Results page shows accurate scoring and metadata

### Phase 2: Bug Fixes & Feature Enhancements ✅

**Study Planner Task Creation (Fixed)**
- Added dialog-based task creation interface with form validation
- Integrated with POST /api/study-tasks endpoint
- Form fields: title, type (dropdown), duration (string), due date (datetime-local)
- Proper cache invalidation on successful task creation
- Success/error toast notifications
- E2E tested and verified working

**Medical Library View/Fullscreen (Fixed)**
- Implemented fullscreen dialog for article viewing
- Click "View" button opens large modal (max-w-4xl)
- Displays complete article metadata: title, category, description
- Type-specific content sections for articles/videos/references
- Proper dialog close and return to library
- E2E tested and verified working

**Comprehensive Question Bank (Expanded)**
- Added 50+ new USMLE questions (total: 65+ questions)
- Complete coverage of all subjects: Anatomy, Biochemistry, Biostatistics, Embryology, Genetics, Histology, Immunology, Microbiology, Pathology, Pathophysiology, Pharmacology, Physiology
- Complete coverage of all systems: cardio, endo, neuro, pulm, allergy, gi, infectious, heme-onc, rheum, renal, derm, ent, ophtho, male-repro, female-repro, preg, biostats, poisoning, psych, biochem-general, genetics-general
- Each subject/system has minimum 2 questions for accurate test creation
- Verified question counts display correctly in Create Test page