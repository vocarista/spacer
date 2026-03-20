# Implementation Plan: Spaced Repetition System

**Branch**: `001-spaced-repetition-system` | **Date**: 2025-03-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-spaced-repetition-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Create a multi-user spaced-repetition system that allows users to create accounts, manage topics with study materials, schedules reviews using SM-2 algorithm, provides calendar view, and sends web push notifications for daily reviews. System will use SQLite for data storage, email/password authentication, and run in minimal Docker container without external dependencies.

## Technical Context

**Language/Version**: Node.js 18+  
**Primary Dependencies**: Express.js (backend), Next.js (frontend), SQLite (database), Web Push libraries  
**Storage**: SQLite database  
**Testing**: Jest (backend), React Testing Library (frontend)  
**Target Platform**: Linux server (Docker container)  
**Project Type**: full-stack web-application  
**Performance Goals**: 100ms response times, handle 1000 topics per user  
**Constraints**: <200ms p95, <100MB memory, Docker containerized  
**Scale/Scope**: Multi-user system with up to 1000 topics per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Required Compliance Gates

- **Simplicity First**: Solution MUST use the most straightforward approach. Any complexity MUST be justified with measurable benefits.
- **Minimal Infrastructure**: Design MUST run in minimal Docker containers without external dependencies. No performance bottlenecks acceptable.
- **Essential Imports Only**: All dependencies MUST be absolutely required. Import analysis MUST be documented.
- **Security by Design**: Input validation, authentication, and authorization MUST be designed in from the start.
- **Documentation for Maintainability**: All files and functions MUST have descriptive comments explaining purpose and behavior.

### Complexity Justification Required

If any design decision violates the above principles, provide explicit justification in the table below:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., External database] | [specific requirement] | [why in-memory/file-based insufficient] |
| [e.g., Complex framework] | [specific problem] | [why simpler solution insufficient] |

## Project Structure

### Documentation (this feature)

```text
specs/001-spaced-repetition-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── tests/
│   ├── unit/
│   └── integration/
└── package.json

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── tests/
└── package.json
```

**Structure Decision**: Full-stack application with Express.js backend and Next.js frontend, clear separation of concerns

## Phase 0: Research Tasks

### Technology Stack Research

1. **Express.js vs Koa for backend framework**: Evaluate simplicity and middleware ecosystem for multi-user support
2. **Next.js vs React for frontend**: Consider SSR benefits vs simplicity for multi-user application
3. **Web Push notification implementation**: Research Node.js libraries and best practices for multi-user notifications
4. **SQLite optimization**: Investigate performance considerations for multiple users with 1000+ topics each
5. **SM-2 algorithm implementation**: Review JavaScript implementations vs custom implementation
6. **Docker containerization**: Multi-stage builds for Node.js applications

### Security Research

1. **Session management**: Best practices for Express.js session handling in multi-user environment
2. **Password hashing**: Evaluate bcrypt vs argon2 for Node.js
3. **Input validation**: Framework choices for comprehensive validation across multiple users
4. **Web Push security**: VAPID key management and secure notification delivery per user
5. **User data isolation**: Ensure proper data separation between users

### Integration Research

1. **Calendar component**: Evaluate React calendar libraries for Next.js with multi-user support
2. **Notification scheduling**: Background job processing approaches in Node.js for multiple users
3. **Timezone handling**: Best practices for timezone management in JavaScript across multiple users
4. **Database migrations**: Simple migration strategies for SQLite with Node.js
5. **User management**: User registration, login, and account management flows

## Phase 1: Design Artifacts

### Data Model Design ✅
- Topic entity schema and relationships with user isolation
- User entity with authentication fields and preferences
- Review session tracking per user
- Notification scheduling data for multiple users
- **File**: `data-model.md`

### Interface Contracts ✅
- REST API endpoints for topic management with user authentication
- Web Push notification contract for multiple users
- Calendar view data contract per user
- Authentication and user management endpoints
- **Files**: `contracts/api.md`, `contracts/web-push.md`

### Quickstart Guide ✅
- Local development setup for multi-user application
- Docker deployment instructions
- Database initialization steps
- User management guide and API usage
- **File**: `quickstart.md`

## Constitution Compliance Status - Final

✅ **Simplicity First**: Express.js + Next.js chosen for minimal complexity, custom SM-2 implementation, focused multi-user feature set  
✅ **Minimal Infrastructure**: SQLite + Docker container, no external services, 12 core dependencies only  
✅ **Essential Imports Only**: Each dependency serves critical function, documented justification  
✅ **Security by Design**: bcrypt hashing, session management, input validation, VAPID authentication, user data isolation  
✅ **Documentation for Maintainability**: Comprehensive API docs, data model, quickstart guide

### Complexity Justification (None Required)

All design decisions align with constitutional principles. No complexity violations identified.

## Implementation Ready

The spaced-repetition system is now ready for implementation with:
- Complete technical specifications for Express.js + Next.js architecture
- Multi-user support with proper data isolation
- Detailed data model with Node.js integration patterns
- Comprehensive API contracts with Express.js route examples
- Deployment and development guides for full-stack multi-user application
- Full constitutional compliance

**Technology Stack Summary**:
- **Backend**: Express.js + SQLite + Node.js 18+
- **Frontend**: Next.js + React + TypeScript
- **Database**: SQLite with custom migration scripts
- **Authentication**: bcrypt + express-session (multi-user)
- **Notifications**: Web Push with VAPID (per user)
- **Deployment**: Docker multi-stage builds

**Next Step**: Run `/speckit.tasks` to generate implementation tasks
