# Feature Specification: Spaced Repetition System

**Feature Branch**: `001-spaced-repetition-system`  
**Created**: 2025-03-15  
**Status**: Ready for Implementation  
**Input**: User description: "the plan is to create a simple spaced-repetition that takes in the topic name, description, links, initial date etc parameters and then sets dates for them to next revise. It should also be able to send push notifications to the user for today's topics to revise, and they should also be visible in a calendar view on the dashboard. Multi-user system with user accounts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Registration and Account Setup (Priority: P1)

New user wants to create an account to access the spaced repetition system and set up their preferences.

**Why this priority**: Users must be able to create accounts to use the system - this is the entry point for all functionality.

**Independent Test**: User can register with email/password, receive confirmation, and log in to access their dashboard.

**Acceptance Scenarios**:

1. **Given** user is on registration page, **When** they enter valid email and password, **Then** system creates account and redirects to dashboard
2. **Given** user has registered, **When** they log in with correct credentials, **Then** system authenticates them and shows their personal dashboard
3. **Given** user is logged in, **When** they log out, **Then** system ends their session securely

---

### User Story 2 - Create and Manage Topics (Priority: P1)

User wants to add new topics to their spaced repetition system with relevant details like name, description, study materials, and initial review date.

**Why this priority**: This is the core functionality - without topics to study, no other features work.

**Independent Test**: User can create a topic, view it in their list, and see the initial review date calculated automatically.

**Acceptance Scenarios**:

1. **Given** user is logged in and on topic creation page, **When** they enter topic name, description, and links, **Then** system saves the topic to their account and sets initial review date
2. **Given** user has created topics, **When** they view their topics list, **Then** they see all their topics with names, descriptions, and next review dates
3. **Given** user wants to edit a topic, **When** they modify topic details, **Then** system updates the topic and recalculates review schedule if needed

---

### User Story 3 - Review Today's Topics (Priority: P1)

User wants to see which topics are scheduled for review today and complete their reviews.

**Why this priority**: This is the primary daily interaction - users need to review topics when they're due.

**Independent Test**: User can view today's review list, mark topics as reviewed, and see their next review dates updated.

**Acceptance Scenarios**:

1. **Given** user's topics are due for review today, **When** user opens their dashboard, **Then** they see a list of their today's topics to review
2. **Given** user is reviewing a topic, **When** they mark it as reviewed, **Then** system updates the next review date based on spaced repetition algorithm
3. **Given** user has no topics due today, **When** they open the dashboard, **Then** they see a message indicating no reviews are scheduled

---

### User Story 4 - Calendar View (Priority: P2)

User wants to see their review schedule in a calendar format to understand their study pattern and upcoming workload.

**Why this priority**: Calendar view helps users plan their study schedule and visualize their learning progress.

**Independent Test**: User can view a calendar showing which topics are scheduled for each day and navigate between months.

**Acceptance Scenarios**:

1. **Given** user has topics scheduled, **When** they view their calendar, **Then** they see their topics marked on their respective review dates
2. **Given** user is viewing the calendar, **When** they click on a date with topics, **Then** they see a list of topics scheduled for that date
3. **Given** user wants to see future months, **When** they navigate the calendar, **Then** they can view topics scheduled for upcoming dates

---

### User Story 5 - Push Notifications (Priority: P2)

User wants to receive notifications when topics are due for review to stay consistent with their learning schedule.

**Why this priority**: Notifications help users maintain their study habit and avoid missing review sessions.

**Independent Test**: User receives timely notifications about pending reviews and can access the review interface directly from notifications.

**Acceptance Scenarios**:

1. **Given** user's topics are due for review today, **When** the scheduled time arrives, **Then** user receives a push notification about their pending reviews
2. **Given** user receives a notification, **When** they tap on it, **Then** they are taken directly to the review interface
3. **Given** user has completed all reviews for today, **When** they receive notifications, **Then** no more review notifications are sent until next scheduled topics

---

### Edge Cases

- What happens when user wants to skip a review session?
- How does system handle topics that are consistently reviewed as "difficult"?
- What happens when user has too many topics due on the same day?
- How does system ensure user data isolation between different accounts?
- What happens when multiple users have notifications scheduled at the same time?
- How does system handle timezone changes for notifications?
- What happens when user wants to reset a topic's review schedule?

## Requirements *(mandatory)*

### Functional Requirements

**Constitution Compliance Requirements**:
- **FR-001**: System MUST use simplest viable approach for each feature
- **FR-002**: System MUST run in minimal Docker container without external dependencies
- **FR-003**: System MUST limit imports to absolute requirements only
- **FR-004**: System MUST implement security by design (input validation, email/password auth, session tokens)
- **FR-005**: System MUST include descriptive comments for all files and functions
- **FR-006**: System MUST provide user authentication with email/password and session tokens

**Feature-Specific Requirements**:
- **FR-007**: System MUST allow users to register accounts with email/password authentication
- **FR-008**: System MUST allow users to create topics with name, description, links, and initial date
- **FR-009**: System MUST calculate next review dates using SM-2 spaced repetition algorithm
- **FR-010**: Users MUST be able to mark topics as reviewed with 5-point performance rating (0-5) and update their schedules
- **FR-011**: System MUST display today's review topics prominently on user's dashboard
- **FR-012**: System MUST provide calendar view showing all scheduled review dates for the user
- **FR-013**: System MUST send web push notifications for pending reviews to individual users
- **FR-014**: System MUST persist topic data and review history using SQLite database with user isolation
- **FR-015**: System MUST validate all user inputs (topic names, dates, URLs)
- **FR-016**: System MUST handle timezone-aware scheduling and notifications per user
- **FR-017**: Users MUST be able to edit and delete their own topics
- **FR-018**: System MUST ensure complete data isolation between different user accounts

### Key Entities *(include if feature involves data)*

- **Topic**: Represents a learning item with name, description, study materials, review history, and schedule
- **Review**: Represents a review session with date, performance rating, and resulting interval calculation
- **User**: Represents the system user with preferences for notifications and timezone
- **Notification**: Represents scheduled notifications for pending reviews

## Success Criteria *(mandatory)*

## Clarifications

### Session 2025-03-15

- Q: What notification platform should be used for push notifications? → A: Web push notifications (browser-based)
- Q: What spaced repetition algorithm should be used? → A: Simple SM-2 algorithm (standard intervals)
- Q: What user authentication approach should be implemented? → A: Simple email/password with session tokens
- Q: What data storage approach should be used? → A: SQLite database (file-based)
- Q: What review performance rating scale should be used? → A: 5-point scale (0-5)
- Q: What are the user account limits and system capacity? → A: Unlimited users with 1000 topics per user
- Q: What happens when topics are deleted - hard delete or soft delete? → A: Soft delete with review history retention
- Q: How should notifications be scheduled - individual or daily summary? → A: Single daily notification with topic count
- Q: Should the system work offline or require internet connection? → A: Online only with basic offline read access
- Q: What profile management features should be included? → A: Basic profile with notification and timezone settings

### Measurable Outcomes

- **SC-001**: Users can create a new topic in under 30 seconds
- **SC-002**: System calculates and updates review dates in under 100ms
- **SC-003**: Users receive notifications within 5 minutes of scheduled time
- **SC-004**: Calendar view loads and displays up to 100 topics in under 2 seconds
- **SC-005**: 90% of users successfully complete their daily review sessions within the first week
- **SC-006**: System handles up to 1000 topics per user without performance degradation
- **SC-007**: Users report 80% satisfaction with the spaced repetition scheduling effectiveness
