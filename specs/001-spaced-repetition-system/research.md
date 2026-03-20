# Research Findings: Spaced Repetition System

**Date**: 2025-03-15  
**Purpose**: Technology and implementation research for spaced-repetition system design

## Backend Framework Decision

**Decision**: Express.js  
**Rationale**: 
- Minimal and unopinionated framework
- Large middleware ecosystem for multi-user features
- Simple learning curve and setup
- Sufficient performance for multi-user system
- Better alignment with constitutional simplicity principle

**Multi-user considerations**:
- Built-in session middleware for user authentication
- Robust middleware ecosystem for security
- Easy integration with user management systems

**Alternatives considered**: 
- Koa: More modern but smaller ecosystem
- Fastify: Higher performance but more complex configuration

## Frontend Framework Decision

**Decision**: Next.js  
**Rationale**:
- Built-in routing and page structure
- Server-side rendering capabilities
- Good TypeScript support
- Simplified deployment with Vercel/Docker
- Comprehensive documentation

**Multi-user considerations**:
- Built-in authentication patterns
- Server-side rendering for user-specific content
- Easy integration with API routes for user data

## Web Push Notifications

**Decision**: web-push library with VAPID keys  
**Rationale**:
- Native Node.js support for web push protocol
- VAPID provides authentication without external services
- Browser-based notifications align with minimal infrastructure

**Implementation approach**:
- Generate VAPID keys on first startup
- Store public key for client subscription
- Background worker for scheduled notifications per user
- User-specific notification subscriptions

## Database Optimization

**Decision**: SQLite with optimized schema  
**Rationale**:
- Zero external dependencies required
- File-based storage fits Docker container model
- Adequate performance for multiple users with 1000+ topics each with proper indexing

**Optimization strategies**:
- Index on user_id, next_review_date for multi-user queries
- Separate tables for topics, reviews, notifications with user isolation
- WAL mode for better concurrent access across multiple users

## SM-2 Algorithm Implementation

**Decision**: Custom implementation in JavaScript  
**Rationale**:
- Simple mathematical formulas, minimal dependencies
- Full control over algorithm behavior
- Better alignment with simplicity principle
- Consistent implementation across frontend and backend

**Implementation details**:
- Quality ratings: 0-5 scale
- Interval calculation: standard SM-2 formulas
- E-factor tracking for difficulty adjustment

## Docker Containerization

**Decision**: Node.js 18 Alpine base image with multi-stage builds  
**Rationale**:
- Minimal image size (~100MB final)
- Official Node.js maintenance
- Efficient layer caching
- Separate build and runtime stages

**Optimization strategies**:
- Multi-stage builds to reduce final image size
- Non-root user for security
- Proper dependency management

## Session Management

**Decision**: express-session with filesystem store  
**Rationale**:
- No external Redis required
- Simple configuration
- Adequate for multi-user system with proper session isolation
- Good Express.js integration

**Security measures**:
- Secure random session keys per user
- Configurable timeout (24 hours)
- HttpOnly and Secure cookies
- Session isolation between users

## Password Hashing

**Decision**: bcrypt  
**Rationale**:
- Industry standard with proven security
- Built-in salt generation
- Reasonable performance for authentication
- Good Node.js support

## Input Validation

**Decision**: joi library  
**Rationale**:
- Comprehensive validation with minimal code
- Good error message formatting
- Integrates well with Express.js
- Lightweight dependency

## Calendar Component

**Decision**: react-big-calendar  
**Rationale**:
- Well-maintained React calendar library
- Good TypeScript support
- Customizable and feature-complete
- Simple integration with Next.js

## Background Task Processing

**Decision**: node-cron  
**Rationale**:
- No external message queue required
- Simple cron-like scheduling
- Good integration with Node.js
- Lightweight dependency

## Timezone Handling

**Decision**: moment-timezone or date-fns-tz  
**Rationale**:
- Comprehensive timezone database
- Simple datetime conversion
- Good React/Next.js integration

## Database Migrations

**Decision**: custom migration scripts  
**Rationale**:
- Simpler than heavy migration libraries
- Full control over schema evolution
- Adequate for single-user system
- Better alignment with simplicity principle

## Dependencies Summary

**Backend dependencies**:
- express (web framework)
- express-session (session management)
- bcrypt (password hashing)
- joi (input validation)
- sqlite3 (database)
- web-push (notifications)
- node-cron (background tasks)
- cors (cross-origin requests)

**Frontend dependencies**:
- next (framework)
- react (UI library)
- react-big-calendar (calendar)
- axios (HTTP client)
- date-fns (date utilities)

**Total estimated dependencies**: 12 core libraries
**Justification**: Each serves critical function that cannot be achieved otherwise in multi-user context

## Security Considerations

**Authentication flow**:
1. Password hashing with bcrypt
2. Session tokens with secure cookies
3. CSRF protection on forms
4. Input validation on all endpoints

**Data protection**:
1. No sensitive data in error messages
2. Secure session storage per user
3. Input sanitization across all user inputs
4. SQL injection prevention via parameterized queries
5. User data isolation enforced at database level

**Notification security**:
1. VAPID key generation and storage
2. HTTPS-only notification delivery
3. Subscription validation

## Performance Targets

**Response times**:
- Topic creation: <100ms
- Review submission: <50ms
- Calendar loading: <200ms
- Dashboard loading: <150ms

**Database performance**:
- Indexed queries on critical paths with user_id optimization
- Connection pooling for multiple concurrent users
- Query optimization for 1000+ topics per user

**Resource usage**:
- Memory: <100MB per container
- CPU: Minimal background processing
- Storage: Efficient SQLite usage
