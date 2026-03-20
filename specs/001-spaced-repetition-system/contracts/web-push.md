# Web Push Notification Contract

**Date**: 2025-03-15  
**Purpose**: Web push notification implementation specifications

## VAPID Authentication

The system uses Voluntary Application Server Identification (VAPID) for authentication with push services.

### VAPID Keys

- **Algorithm**: ES256 (ECDSA with P-256 curve and SHA-256)
- **Subject**: mailto:admin@spacer.local
- **Key Generation**: Generated on first startup, stored in database

### Public Key Distribution

**Endpoint**: `GET /api/notifications/vapid-public-key`

**Response**:
```json
{
  "success": true,
  "public_key": "B...="
}
```

## Client Subscription

### Subscription Flow

1. Client requests VAPID public key
2. Client generates subscription using `navigator.pushManager.subscribe()`
3. Client sends subscription to server
4. Server stores subscription for future notifications

### Subscription Data Format

**Endpoint**: `POST /api/notifications/subscribe`

**Request**:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "B...=",
    "auth": "B...="
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Subscribed to notifications successfully"
}
```

### Subscription Storage

```sql
CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## Notification Types

### Daily Review Reminder

**Trigger**: Daily at user's configured notification time

**Payload**:
```json
{
  "type": "daily_review",
  "title": "Time to Review!",
  "body": "You have 3 topics to review today",
  "data": {
    "url": "/dashboard",
    "count": 3
  },
  "actions": [
    {
      "action": "review",
      "title": "Start Review"
    }
  ]
}
```

### Topic Due Notification

**Trigger**: When topic becomes due for review

**Payload**:
```json
{
  "type": "topic_due",
  "title": "Topic Ready for Review",
  "body": "Python Basics is ready for review",
  "data": {
    "url": "/review/1",
    "topic_id": 1,
    "topic_name": "Python Basics"
  },
  "actions": [
    {
      "action": "review",
      "title": "Review Now"
    }
  ]
}
```

## Notification Scheduling

### Background Job Processing

**Scheduler**: APScheduler with SQLAlchemyJobStore

**Job Types**:

1. **Daily Review Job**:
   - Runs daily at user's notification time
   - Checks for topics due today
   - Sends daily summary notification

2. **Topic Due Job**:
   - Runs every hour
   - Checks for newly due topics
   - Sends individual topic notifications

### Job Configuration

```python
# Daily review notification
scheduler.add_job(
    func=send_daily_review_notification,
    trigger='cron',
    hour=9,  # User's configured time
    minute=0,
    id=f'daily_review_{user_id}'
)

# Topic due check
scheduler.add_job(
    func=check_topic_due_notifications,
    trigger='interval',
    hours=1,
    id='topic_due_check'
)
```

## Push Message Format

### Message Headers

```python
headers = {
    'TTL': '2419200',  # 28 days in seconds
    'Urgency': 'normal',
    'Topic': 'spacer-reviews'
}
```

### Encryption

- Uses Web Push Protocol encryption
- Content-Encoding: 'aes128gcm'
- Requires VAPID authorization header

## Error Handling

### Push Service Errors

**Transient Errors**:
- Rate limiting: Retry with exponential backoff
- Network timeouts: Retry up to 3 times
- Service unavailable: Queue for retry

**Permanent Errors**:
- Invalid subscription: Remove from database
- Subscription expired: Remove from database

### Error Response Format

```json
{
  "success": false,
  "error": "Push notification failed",
  "error_code": "PUSH_ERROR",
  "details": "Subscription no longer valid"
}
```

## Security Considerations

### VAPID Key Management

- Private key stored securely in database
- Public key distributed to clients
- Keys generated once per installation

### Subscription Validation

- Validate subscription format before storage
- Remove invalid subscriptions after failed delivery
- Limit subscriptions per user (max 5 per user)

### Content Security

- No sensitive data in notification payloads
- URL validation in notification data
- Rate limiting on notification sending

## Browser Compatibility

### Supported Browsers

- Chrome 50+
- Firefox 44+
- Edge 17+
- Safari 16+ (limited support)

### Feature Detection

```javascript
if ('serviceWorker' in navigator && 'PushManager' in window) {
    // Push notifications supported
} else {
    // Fallback to in-app notifications
}
```

## Fallback Strategy

### In-App Notifications

When push notifications are not available:

1. Show notification banner in web app
2. Store notifications in database
3. Display on next page load
4. Use browser notification API as fallback

### Notification Persistence

```sql
CREATE TABLE in_app_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

## Performance Considerations

### Batch Processing

- Group multiple topics into single daily notification
- Limit to 5 topics per notification
- Use background queue for sending

### Subscription Cleanup

- Remove inactive subscriptions after 30 days
- Clean up failed delivery attempts
- Monitor subscription health

## Testing Strategy

### Unit Tests

- VAPID key generation and validation
- Subscription creation and storage
- Notification payload formatting
- Error handling scenarios

### Integration Tests

- End-to-end push notification flow
- Browser compatibility testing
- Background job scheduling
- Error recovery scenarios

### Manual Testing

- Real browser testing across platforms
- Notification delivery verification
- User interaction testing
- Performance under load
