# Quickstart Guide: Spaced Repetition System

**Date**: 2025-03-15  
**Purpose**: Setup and deployment instructions for spaced-repetition system (Express.js + Next.js)

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- Modern web browser (Chrome 50+, Firefox 44+, Edge 17+)

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd spacer
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```bash
# Database
DATABASE_URL=sqlite:///data/spacer.db

# Security
SECRET_KEY=your-secret-key-here
NODE_ENV=development

# Notifications (development)
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_SUBJECT=mailto:admin@spacer.local

# Port
PORT=5001
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Generate VAPID Keys

```bash
cd backend
node -e "
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
"
```

### 5. Start Development Environment

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

The applications will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001`

### 6. Initialize Database

```bash
cd backend
npm run init-db
```

### 7. Create Admin User

```bash
cd backend
npm run create-user -- --email admin@example.com --password admin123 --timezone UTC
```

## Docker Development

### 1. Development Environment

```bash
docker-compose up --build
```

The applications will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001`

### 2. Production Environment

Create `.env.production`:

```bash
# Backend
DATABASE_URL=sqlite:///data/spacer.db
SECRET_KEY=your-production-secret-key
NODE_ENV=production
VAPID_PRIVATE_KEY=your-production-vapid-private-key
VAPID_PUBLIC_KEY=your-production-vapid-public-key
VAPID_SUBJECT=mailto:admin@yourdomain.com
PORT=5001

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Deploy with Docker Compose

```bash
# Create data directories
mkdir -p data/backend data/frontend

# Deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

## Application Structure

```
backend/
├── src/
│   ├── app.js              # Express application entry point
│   ├── config/
│   │   └── database.js    # Database configuration
│   ├── models/
│   │   ├── User.js        # User model
│   │   ├── Topic.js       # Topic model
│   │   ├── Review.js      # Review model
│   │   └── Notification.js # Notification model
│   ├── services/
│   │   ├── authService.js # Authentication logic
│   │   ├── reviewService.js # SM-2 algorithm
│   │   ├── notificationService.js # Push notifications
│   │   └── calendarService.js # Calendar logic
│   ├── routes/
│   │   ├── auth.js        # Authentication endpoints
│   │   ├── topics.js      # Topic management
│   │   ├── reviews.js     # Review endpoints
│   │   ├── calendar.js     # Calendar endpoints
│   │   └── notifications.js # Notification endpoints
│   ├── middleware/
│   │   ├── auth.js        # Authentication middleware
│   │   ├── validation.js  # Input validation
│   │   └── errorHandler.js # Error handling
│   └── utils/
│       ├── validators.js   # Input validation schemas
│       ├── helpers.js      # Utility functions
│       └── sm2.js         # SM-2 algorithm
├── tests/
│   ├── unit/
│   └── integration/
├── migrations/             # Database migration scripts
├── package.json
└── Dockerfile

frontend/
├── src/
│   ├── pages/
│   │   ├── _app.js        # Next.js app
│   │   ├── _document.js   # Document setup
│   │   ├── index.js       # Dashboard page
│   │   ├── topics/        # Topic pages
│   │   ├── calendar.js    # Calendar page
│   │   ├── login.js       # Login page
│   │   └── register.js    # Registration page
│   ├── components/
│   │   ├── TopicCard.js   # Topic display component
│   │   ├── ReviewModal.js # Review interface
│   │   ├── Calendar.js    # Calendar component
│   │   └── NotificationButton.js # Notification setup
│   ├── hooks/
│   │   ├── useAuth.js     # Authentication hook
│   │   ├── useTopics.js   # Topics data hook
│   │   └── useNotifications.js # Notifications hook
│   ├── services/
│   │   ├── api.js         # API client
│   │   ├── auth.js        # Auth service
│   │   └── notifications.js # Push notification service
│   ├── utils/
│   │   ├── constants.js    # App constants
│   │   ├── helpers.js      # Utility functions
│   │   └── validation.js   # Client-side validation
│   └── styles/
│       ├── globals.css     # Global styles
│       └── components.css # Component styles
├── public/
│   ├── manifest.json      # PWA manifest
│   └── sw.js           # Service worker
├── tests/
├── package.json
└── Dockerfile
```

## Database Management

### Migrations

```bash
# Create new migration
cd backend
npm run create-migration --name add_new_field

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:rollback
```

### Database Operations

```bash
# Reset database
npm run db:reset

# Backup database
npm run db:backup

# Restore database
npm run db:restore --file backup.sql

# View database stats
npm run db:stats
```

## User Guide

### 1. Account Setup

1. Navigate to `http://localhost:3000`
2. Click "Register" 
3. Enter email and password
4. Set timezone and notification preferences

### 2. Creating Topics

1. Click "Add Topic" on dashboard
2. Fill in topic details:
   - Name (required)
   - Description (optional)
   - Study links (optional)
   - Initial review date (default: today)
3. Click "Create Topic"

### 3. Daily Reviews

1. Topics due today appear on dashboard
2. Click "Start Review" for each topic
3. Review the material
4. Rate quality (0-5):
   - 0: Total blackout
   - 1: Incorrect but recognized
   - 2: Incorrect but easy recall
   - 3: Correct with difficulty
   - 4: Correct with hesitation
   - 5: Perfect recall
5. System schedules next review automatically

### 4. Calendar View

1. Click "Calendar" in navigation
2. Navigate between months
3. Click on dates with topics to see details
4. Color coding:
   - Red: Overdue topics
   - Yellow: Topics due today
   - Green: Future reviews

### 5. Notifications

1. Enable notifications in profile settings
2. Grant permission when browser prompts
3. Receive daily review reminders
4. Click notification to go directly to review

## API Usage

### Authentication

```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# Use session cookie in subsequent requests
curl -X GET http://localhost:5001/api/topics \
  -b cookies.txt
```

### Create Topic

```bash
curl -X POST http://localhost:5001/api/topics \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "New Topic",
    "description": "Topic description",
    "links": ["https://example.com"],
    "initialDate": "2025-03-15"
  }'
```

### Submit Review

```bash
curl -X POST http://localhost:5001/api/reviews \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "topicId": 1,
    "qualityRating": 4,
    "reviewTimeSeconds": 120
  }'
```

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- topics.test.js

# Run integration tests
npm run test:integration
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run component tests
npm run test:components
```

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Check what's using port 3000/5001
lsof -i :3000
lsof -i :5001

# Kill process or change ports
```

**Database locked**:
```bash
# Restart containers
docker-compose restart

# Or restart services
npm run dev:restart
```

**CORS issues**:
```bash
# Check frontend API URL
echo $NEXT_PUBLIC_API_URL

# Verify backend CORS configuration
# Check environment variables
```

**Notifications not working**:
```bash
# Check browser console for errors
# Verify VAPID keys are correct
# Ensure HTTPS in production
# Check service worker registration
```

### Logs

```bash
# Backend logs
cd backend && npm run dev

# Frontend logs
cd frontend && npm run dev

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# All logs
docker-compose logs -f
```

### Performance Monitoring

```bash
# Check resource usage
docker stats

# Backend performance
cd backend && npm run perf

# Frontend bundle analysis
cd frontend && npm run analyze
```

## Development Workflow

### 1. Making Changes

1. Edit source code
2. Restart development servers if needed
3. Test changes
4. Commit changes

### 2. Code Quality

```bash
# Backend linting
cd backend
npm run lint
npm run lint:fix

# Frontend linting
cd frontend
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

### 3. Pre-commit Hooks

```bash
# Install husky
npm install --save-dev husky

# Setup pre-commit hooks
npx husky add .husky/pre-commit "npm run lint && npm test"
```

## Production Deployment

### Security

1. Use strong SECRET_KEY
2. Enable HTTPS in production
3. Set secure cookie flags
4. Regular security updates
5. Monitor access logs

### Environment Variables

Production `.env` should include:
```bash
NODE_ENV=production
SECRET_KEY=strong-random-string
DATABASE_URL=sqlite:///data/spacer.db
VAPID_PRIVATE_KEY=production-key
VAPID_SUBJECT=mailto:admin@yourdomain.com
PORT=5001
```

### SSL Configuration

For production with SSL:

```bash
# Use nginx proxy
docker-compose -f docker-compose.ssl.yml up -d --build
```

### Scaling Considerations

1. Use PostgreSQL for larger datasets
2. Implement Redis for session storage
3. Load balance multiple instances
4. Use CDN for static assets

## Support

### Documentation

- API documentation: `/api/docs`
- User guide: `/help`
- Developer documentation: `/docs`

### Getting Help

1. Check troubleshooting section
2. Review application logs
3. Search existing issues
4. Create new issue with details

### Contributing

1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Follow code review process
