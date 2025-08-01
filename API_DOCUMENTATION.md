# Email Tracking API Documentation

## Base URL
- Development: `http://localhost:5000`
- Production: Auto-detected based on hosting environment (Replit, Render, Vercel, Railway)

## Overview
This API provides comprehensive email open tracking functionality using 1x1 pixel tracking with advanced time tracking features. When someone opens an email containing a tracking pixel, the system records the open event, duration, and viewing patterns.

---

## API Endpoints

### 1. Create Tracking Pixel
**GET** `/api/pixel/create`

Creates a new unique tracking pixel and returns the tracking URL and embed code.

**Request Example:**
```bash
curl -X GET "https://your-domain.replit.dev/api/pixel/create"
```

**Response:**
```json
{
  "id": "48a962dd-fa9d-4e0a-886e-aa7cda4e7f87",
  "trackingUrl": "https://your-domain.replit.dev/api/pixel/48a962dd-fa9d-4e0a-886e-aa7cda4e7f87",
  "embedCode": "<img src=\"https://your-domain.replit.dev/api/pixel/48a962dd-fa9d-4e0a-886e-aa7cda4e7f87\" width=\"1\" height=\"1\" style=\"display:none;\" />",
  "createdAt": "2025-07-26T13:23:32.068Z"
}
```

**Response Fields:**
- `id`: Unique tracking pixel identifier (UUID)
- `trackingUrl`: Direct URL to the tracking pixel image
- `embedCode`: Ready-to-use HTML code for emails
- `createdAt`: ISO timestamp when pixel was created

---

### 2. Track Pixel Open
**GET** `/api/pixel/:id`

Serves a 1x1 transparent GIF and marks the pixel as opened. This is the actual tracking endpoint that goes in emails.

**Parameters:**
- `id` (path parameter): The tracking pixel ID

**Request Example:**
```bash
curl -X GET "https://your-domain.replit.dev/api/pixel/48a962dd-fa9d-4e0a-886e-aa7cda4e7f87"
```

**Response:**
- Content-Type: `image/gif`
- Body: 1x1 transparent GIF binary data (43 bytes)
- Status: 200 OK

**Response Headers:**
- `Content-Type: image/gif`
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

**Side Effects:**
- Marks the pixel as opened in the system
- Records timestamp of the open event
- Increments view count
- Calculates viewing duration
- Updates last seen timestamp
- Logs tracking event to server console

---

### 3. Check Pixel Status
**POST** `/api/pixel/check`

Check the current status and analytics for a specific tracking pixel.

**Request Body:**
```json
{
  "id": "48a962dd-fa9d-4e0a-886e-aa7cda4e7f87"
}
```

**Request Example:**
```bash
curl -X POST "https://your-domain.replit.dev/api/pixel/check" \
     -H "Content-Type: application/json" \
     -d '{"id":"48a962dd-fa9d-4e0a-886e-aa7cda4e7f87"}'
```

**Response (Not Opened):**
```json
{
  "opened": false,
  "openedAt": null,
  "createdAt": "2025-07-26T13:23:32.068Z",
  "viewCount": 0,
  "totalViewTime": 0,
  "lastSeenAt": null
}
```

**Response (Opened with Analytics):**
```json
{
  "opened": true,
  "openedAt": "2025-07-26T13:25:15.234Z",
  "createdAt": "2025-07-26T13:23:32.068Z",
  "lastSeenAt": "2025-07-26T13:27:42.567Z",
  "totalViewTime": 25000,
  "viewCount": 5
}
```

**Error Response (Pixel Not Found):**
```json
{
  "opened": false,
  "message": "Pixel not found"
}
```

**Analytics Fields Explained:**
- `opened`: Boolean indicating if pixel has been accessed
- `openedAt`: ISO timestamp of first pixel access
- `lastSeenAt`: ISO timestamp of most recent pixel access
- `totalViewTime`: Accumulated viewing time in milliseconds
- `viewCount`: Number of times pixel was loaded
- `createdAt`: ISO timestamp when pixel was created

---

### 4. Dashboard Statistics
**GET** `/api/dashboard`

Returns comprehensive tracking statistics and recent pixel activity.

**Request Example:**
```bash
curl -X GET "https://your-domain.replit.dev/api/dashboard"
```

**Response:**
```json
{
  "stats": {
    "totalPixels": 25,
    "openedPixels": 15,
    "openRate": 60,
    "avgViewTime": 12500,
    "totalViewTime": 187500
  },
  "recentPixels": [
    {
      "id": "48a962dd-fa9d-4e0a-886e-aa7cda4e7f87",
      "createdAt": "2025-07-26T13:23:32.068Z",
      "openedAt": "2025-07-26T13:25:15.234Z",
      "lastSeenAt": "2025-07-26T13:27:42.567Z",
      "opened": true,
      "viewCount": 5,
      "totalViewTime": 25000
    }
  ]
}
```

**Statistics Fields:**
- `totalPixels`: Total number of tracking pixels created
- `openedPixels`: Number of pixels that have been opened at least once
- `openRate`: Percentage open rate (0-100, rounded to nearest integer)
- `avgViewTime`: Average viewing time per opened pixel in milliseconds
- `totalViewTime`: Total accumulated viewing time across all pixels in milliseconds

---

## Time Tracking Features

### How Time Tracking Works

The system implements sophisticated viewing duration tracking:

1. **First Load**: Records initial open timestamp
2. **Subsequent Loads**: If pixel reloads within 30 seconds, adds viewing time
3. **Session End**: After 30+ seconds of inactivity, session ends
4. **View Count**: Each pixel load increments the counter
5. **Total Time**: Accumulated across all viewing sessions

### Time Calculation Logic
- Time between pixel loads (within 30 seconds) = viewing duration
- Gaps longer than 30 seconds start a new viewing session
- Minimum tracked time: 1 second
- Maximum single session: No limit

### Example Tracking Scenario
```
12:00:00 - Email opened (first load)
12:00:15 - Still reading (second load) → +15 seconds
12:00:28 - Still reading (third load) → +13 seconds  
12:01:05 - Email reopened (fourth load) → New session starts
12:01:20 - Still reading (fifth load) → +15 seconds

Result: 
- viewCount: 5
- totalViewTime: 43000 (43 seconds)
- Sessions: 2
```

---

## Usage Examples

### 1. Basic Email Tracking Workflow

**Step 1: Create a tracking pixel**
```bash
curl -X GET "https://your-domain.replit.dev/api/pixel/create"
```

**Step 2: Add to your email HTML**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Email</title>
</head>
<body>
    <h1>Welcome to Our Newsletter!</h1>
    <p>Thank you for subscribing. Here's what's new...</p>
    
    <div style="margin: 20px 0;">
        <img src="https://example.com/newsletter-image.jpg" alt="Newsletter" style="max-width: 100%;">
    </div>
    
    <p>Best regards,<br>Your Team</p>
    
    <!-- Tracking pixel (completely invisible) -->
    <img src="https://your-domain.replit.dev/api/pixel/48a962dd-fa9d-4e0a-886e-aa7cda4e7f87" 
         width="1" height="1" style="display:none;" alt="" />
</body>
</html>
```

**Step 3: Check tracking status**
```bash
curl -X POST "https://your-domain.replit.dev/api/pixel/check" \
     -H "Content-Type: application/json" \
     -d '{"id":"48a962dd-fa9d-4e0a-886e-aa7cda4e7f87"}'
```

### 2. Testing Your Implementation

**Quick Test Method:**
1. Create a pixel via API
2. Visit the tracking URL in your browser
3. Check status - should show as opened with viewCount: 1

**Advanced Testing:**
```bash
# Create pixel
PIXEL=$(curl -s "https://your-domain.replit.dev/api/pixel/create" | jq -r '.id')

# Test tracking
curl -s "https://your-domain.replit.dev/api/pixel/$PIXEL" > /dev/null

# Check results  
curl -X POST "https://your-domain.replit.dev/api/pixel/check" \
     -H "Content-Type: application/json" \
     -d "{\"id\":\"$PIXEL\"}" | jq '.'
```

### 3. Bulk Analytics Retrieval

**Get all statistics:**
```bash
curl -s "https://your-domain.replit.dev/api/dashboard" | jq '.stats'
```

**Monitor recent activity:**
```bash
curl -s "https://your-domain.replit.dev/api/dashboard" | jq '.recentPixels[] | select(.opened == true)'
```

---

## Integration Examples

### JavaScript (Node.js/Browser)

```javascript
// Email tracking service class
class EmailTracker {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    async createPixel() {
        const response = await fetch(`${this.baseUrl}/api/pixel/create`);
        return await response.json();
    }
    
    async checkPixel(pixelId) {
        const response = await fetch(`${this.baseUrl}/api/pixel/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pixelId })
        });
        return await response.json();
    }
    
    async getDashboard() {
        const response = await fetch(`${this.baseUrl}/api/dashboard`);
        return await response.json();
    }
    
    async waitForOpen(pixelId, timeout = 300000) { // 5 minutes default
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const status = await this.checkPixel(pixelId);
            if (status.opened) {
                return status;
            }
            await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        }
        
        throw new Error('Timeout waiting for email open');
    }
}

// Usage example
const tracker = new EmailTracker('https://your-domain.replit.dev');

// Create and use tracking pixel
const pixel = await tracker.createPixel();
console.log('Tracking URL:', pixel.trackingUrl);
console.log('Embed code:', pixel.embedCode);

// Wait for email to be opened
try {
    const result = await tracker.waitForOpen(pixel.id);
    console.log('Email opened!', result);
} catch (error) {
    console.log('Email not opened within timeout');
}
```

### Python

```python
import requests
import time
import json

class EmailTracker:
    def __init__(self, base_url):
        self.base_url = base_url
        
    def create_pixel(self):
        """Create a new tracking pixel"""
        response = requests.get(f"{self.base_url}/api/pixel/create")
        response.raise_for_status()
        return response.json()
    
    def check_pixel(self, pixel_id):
        """Check pixel status and analytics"""
        response = requests.post(
            f"{self.base_url}/api/pixel/check",
            json={'id': pixel_id}
        )
        response.raise_for_status()
        return response.json()
    
    def get_dashboard(self):
        """Get overall statistics"""
        response = requests.get(f"{self.base_url}/api/dashboard")
        response.raise_for_status()
        return response.json()
    
    def wait_for_open(self, pixel_id, timeout=300, check_interval=5):
        """Wait for email to be opened"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            status = self.check_pixel(pixel_id)
            if status['opened']:
                return status
            time.sleep(check_interval)
        
        raise TimeoutError("Email not opened within timeout period")

# Usage example
tracker = EmailTracker('https://your-domain.replit.dev')

# Create tracking pixel
pixel = tracker.create_pixel()
print(f"Pixel ID: {pixel['id']}")
print(f"Tracking URL: {pixel['trackingUrl']}")

# Monitor for opens
try:
    result = tracker.wait_for_open(pixel['id'])
    print(f"Email opened! View count: {result['viewCount']}")
    print(f"Total view time: {result['totalViewTime']}ms")
except TimeoutError:
    print("Email not opened within timeout")

# Get analytics
dashboard = tracker.get_dashboard()
print(f"Overall open rate: {dashboard['stats']['openRate']}%")
```

### PHP

```php
<?php
class EmailTracker {
    private $baseUrl;
    
    public function __construct($baseUrl) {
        $this->baseUrl = $baseUrl;
    }
    
    public function createPixel() {
        $response = file_get_contents($this->baseUrl . '/api/pixel/create');
        return json_decode($response, true);
    }
    
    public function checkPixel($pixelId) {
        $postData = json_encode(['id' => $pixelId]);
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json',
                'content' => $postData
            ]
        ]);
        
        $response = file_get_contents(
            $this->baseUrl . '/api/pixel/check', 
            false, 
            $context
        );
        return json_decode($response, true);
    }
    
    public function getDashboard() {
        $response = file_get_contents($this->baseUrl . '/api/dashboard');
        return json_decode($response, true);
    }
    
    public function waitForOpen($pixelId, $timeout = 300, $checkInterval = 5) {
        $startTime = time();
        
        while (time() - $startTime < $timeout) {
            $status = $this->checkPixel($pixelId);
            if ($status['opened']) {
                return $status;
            }
            sleep($checkInterval);
        }
        
        throw new Exception('Email not opened within timeout period');
    }
}

// Usage example
$tracker = new EmailTracker('https://your-domain.replit.dev');

// Create pixel
$pixel = $tracker->createPixel();
echo "Pixel ID: " . $pixel['id'] . "\n";
echo "Embed code: " . $pixel['embedCode'] . "\n";

// Check status
$status = $tracker->checkPixel($pixel['id']);
echo "Opened: " . ($status['opened'] ? 'Yes' : 'No') . "\n";

// Get analytics
$dashboard = $tracker->getDashboard();
echo "Total pixels: " . $dashboard['stats']['totalPixels'] . "\n";
echo "Open rate: " . $dashboard['stats']['openRate'] . "%\n";
?>
```

### cURL Scripts

**Create and Track Workflow:**
```bash
#!/bin/bash

BASE_URL="https://your-domain.replit.dev"

# Create pixel
echo "Creating tracking pixel..."
RESPONSE=$(curl -s "$BASE_URL/api/pixel/create")
PIXEL_ID=$(echo $RESPONSE | jq -r '.id')
TRACKING_URL=$(echo $RESPONSE | jq -r '.trackingUrl')

echo "Pixel ID: $PIXEL_ID"
echo "Tracking URL: $TRACKING_URL"

# Simulate email open
echo "Simulating email open..."
curl -s "$TRACKING_URL" > /dev/null

# Check status
echo "Checking status..."
curl -X POST "$BASE_URL/api/pixel/check" \
     -H "Content-Type: application/json" \
     -d "{\"id\":\"$PIXEL_ID\"}" | jq '.'
```

**Analytics Dashboard:**
```bash
#!/bin/bash

BASE_URL="https://your-domain.replit.dev"

echo "=== Email Tracking Dashboard ==="
curl -s "$BASE_URL/api/dashboard" | jq -r '
.stats | 
"Total Pixels: \(.totalPixels)",
"Opened Pixels: \(.openedPixels)", 
"Open Rate: \(.openRate)%",
"Avg View Time: \(.avgViewTime)ms",
"Total View Time: \(.totalViewTime)ms"
'

echo -e "\n=== Recent Activity ==="
curl -s "$BASE_URL/api/dashboard" | jq -r '
.recentPixels[] | 
select(.opened == true) |
"ID: \(.id) | Views: \(.viewCount) | Time: \(.totalViewTime)ms"
'
```

---

## Advanced Use Cases

### 1. Email Campaign Analytics

```javascript
// Track multiple emails in a campaign
class CampaignTracker {
    constructor(baseUrl) {
        this.tracker = new EmailTracker(baseUrl);
        this.pixels = new Map();
    }
    
    async createCampaign(emailCount) {
        const campaign = {
            id: Date.now().toString(),
            pixels: [],
            createdAt: new Date()
        };
        
        for (let i = 0; i < emailCount; i++) {
            const pixel = await this.tracker.createPixel();
            campaign.pixels.push(pixel);
            this.pixels.set(pixel.id, { campaign: campaign.id, index: i });
        }
        
        return campaign;
    }
    
    async getCampaignStats(campaign) {
        const stats = {
            totalEmails: campaign.pixels.length,
            opened: 0,
            totalViews: 0,
            totalTime: 0,
            openRate: 0
        };
        
        for (const pixel of campaign.pixels) {
            const status = await this.tracker.checkPixel(pixel.id);
            if (status.opened) {
                stats.opened++;
                stats.totalViews += status.viewCount;
                stats.totalTime += status.totalViewTime;
            }
        }
        
        stats.openRate = Math.round((stats.opened / stats.totalEmails) * 100);
        return stats;
    }
}
```

### 2. Real-time Monitoring

```python
import asyncio
import websockets
import json

class RealTimeMonitor:
    def __init__(self, tracker, pixel_ids):
        self.tracker = tracker
        self.pixel_ids = pixel_ids
        self.last_status = {}
        
    async def monitor(self, callback):
        """Monitor pixels for changes in real-time"""
        while True:
            for pixel_id in self.pixel_ids:
                try:
                    current = self.tracker.check_pixel(pixel_id)
                    last = self.last_status.get(pixel_id, {})
                    
                    # Check for changes
                    if (current.get('viewCount', 0) > last.get('viewCount', 0)):
                        await callback('view_updated', pixel_id, current)
                    
                    if current.get('opened') and not last.get('opened'):
                        await callback('first_open', pixel_id, current)
                    
                    self.last_status[pixel_id] = current
                    
                except Exception as e:
                    await callback('error', pixel_id, str(e))
            
            await asyncio.sleep(5)  # Check every 5 seconds

# Usage
async def handle_event(event_type, pixel_id, data):
    if event_type == 'first_open':
        print(f"🎉 Email {pixel_id[:8]} opened for the first time!")
    elif event_type == 'view_updated':
        print(f"👀 Email {pixel_id[:8]} viewed again - Total: {data['viewCount']} views")

monitor = RealTimeMonitor(tracker, ['pixel-id-1', 'pixel-id-2'])
asyncio.run(monitor.monitor(handle_event))
```

### 3. A/B Testing Integration

```javascript
// A/B test email subject lines
class EmailABTest {
    constructor(tracker) {
        this.tracker = tracker;
    }
    
    async createTest(subjectA, subjectB, emailList) {
        const testId = `test_${Date.now()}`;
        const midpoint = Math.floor(emailList.length / 2);
        
        const groupA = emailList.slice(0, midpoint);
        const groupB = emailList.slice(midpoint);
        
        const test = {
            id: testId,
            subjectA,
            subjectB,
            groupA: await this.createGroup(groupA, 'A'),
            groupB: await this.createGroup(groupB, 'B'),
            createdAt: new Date()
        };
        
        return test;
    }
    
    async createGroup(emails, variant) {
        const pixels = [];
        for (const email of emails) {
            const pixel = await this.tracker.createPixel();
            pixels.push({ email, pixel, variant });
        }
        return pixels;
    }
    
    async getTestResults(test) {
        const groupAStats = await this.getGroupStats(test.groupA);
        const groupBStats = await this.getGroupStats(test.groupB);
        
        return {
            testId: test.id,
            subjectA: test.subjectA,
            subjectB: test.subjectB,
            groupA: { ...groupAStats, subject: test.subjectA },
            groupB: { ...groupBStats, subject: test.subjectB },
            winner: groupAStats.openRate > groupBStats.openRate ? 'A' : 'B'
        };
    }
    
    async getGroupStats(group) {
        let opened = 0;
        let totalViews = 0;
        let totalTime = 0;
        
        for (const item of group) {
            const status = await this.tracker.checkPixel(item.pixel.id);
            if (status.opened) {
                opened++;
                totalViews += status.viewCount;
                totalTime += status.totalViewTime;
            }
        }
        
        return {
            total: group.length,
            opened,
            openRate: Math.round((opened / group.length) * 100),
            totalViews,
            totalTime,
            avgViewTime: opened > 0 ? Math.round(totalTime / opened) : 0
        };
    }
}
```

---

## Error Handling

### HTTP Status Codes
- `200 OK`: Request successful
- `400 Bad Request`: Invalid request body or missing required fields
- `404 Not Found`: Pixel ID not found or invalid endpoint
- `405 Method Not Allowed`: Incorrect HTTP method
- `500 Internal Server Error`: Server error

### Error Response Format
```json
{
  "message": "Detailed error description",
  "error": "ERROR_CODE" // Optional error code
}
```

### Common Error Scenarios

**Invalid Pixel ID:**
```json
{
  "opened": false,
  "message": "Pixel not found"
}
```

**Malformed Request:**
```json
{
  "message": "Invalid request body. Expected JSON with 'id' field."
}
```

**Server Error:**
```json
{
  "message": "Internal server error occurred"
}
```

---

## Technical Specifications

### Tracking Pixel Details
- **Format**: GIF89a (1x1 transparent)
- **Size**: 43 bytes
- **Base64**: `R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`
- **Content-Type**: `image/gif`
- **Caching**: Disabled (no-cache headers)

### UUID Format
- **Standard**: UUID v4 (RFC 4122)
- **Example**: `48a962dd-fa9d-4e0a-886e-aa7cda4e7f87`
- **Length**: 36 characters (including hyphens)
- **Uniqueness**: Cryptographically secure random generation

### Time Precision
- **Timestamps**: ISO 8601 format with milliseconds
- **View Time**: Measured in milliseconds
- **Session Timeout**: 30 seconds of inactivity
- **Minimum Track Time**: 1 second

### Storage
- **Type**: In-memory (development) / Persistent (production)
- **Persistence**: Data survives server restarts in production
- **Capacity**: No explicit limits (bounded by available memory)

---

## Security & Privacy

### Data Protection
- **No PII**: Only timestamps and view counts are stored
- **UUID Security**: Cryptographically secure, non-guessable IDs
- **No Cookies**: Stateless tracking approach
- **No User Agent**: User device information not collected

### CORS Policy
- **Origins**: All origins allowed (suitable for email tracking)
- **Methods**: GET, POST, OPTIONS
- **Headers**: Content-Type, Authorization

### Rate Limiting
- **Current**: No rate limits implemented
- **Recommendation**: Implement rate limiting for production
- **Suggested Limits**: 1000 requests/hour per IP for creation, unlimited for tracking

---

## Deployment & Configuration

### Environment Variables

**Optional Configuration:**
```bash
# Custom base URL (auto-detected if not set)
BASE_URL=https://your-custom-domain.com

# Server port (default: 5000)
PORT=3000

# Debug logging
DEBUG=true
```

### Auto-Detection
The system automatically detects hosting environments:
- **Replit**: Uses REPLIT_DOMAINS environment variable
- **Render**: Uses render.com domain structure  
- **Vercel**: Uses vercel.app domain structure
- **Railway**: Uses railway.app domain structure
- **Localhost**: Falls back to localhost:5000

### Production Considerations

**Persistence:**
- Replace in-memory storage with database (PostgreSQL, MongoDB)
- Implement data retention policies
- Consider GDPR compliance for EU users

**Performance:**
- Add Redis caching for frequently accessed pixels
- Implement connection pooling for database
- Use CDN for tracking pixel delivery

**Monitoring:**
- Add application performance monitoring (APM)
- Implement health check endpoints
- Set up error tracking and alerting

**Security:**
- Add rate limiting middleware
- Implement API authentication for admin endpoints
- Use HTTPS in production

---

## Frequently Asked Questions

### Q: How accurate is the time tracking?
A: Time tracking is accurate to within 1-2 seconds. It measures the time between pixel loads, with a 30-second session timeout. Multiple browser tabs or email client behavior may affect accuracy.

### Q: Does the tracking work in all email clients?
A: Most email clients support image loading. Some (like Outlook) may block images by default, requiring users to "enable images" to trigger tracking.

### Q: Can I track the same email opened multiple times?
A: Yes! The system tracks every pixel load. If someone opens the same email multiple times, it increments the view count and accumulates viewing time.

### Q: What happens if the server restarts?
A: In development mode (in-memory storage), all tracking data is lost. In production with persistent storage, data is preserved across restarts.

### Q: Is there a limit on how many pixels I can create?
A: No explicit limit exists, but system memory and storage capacity provide practical bounds.

### Q: Can I use this for GDPR compliance?
A: The system doesn't collect personal information, but you should still inform users about tracking in your privacy policy and provide opt-out mechanisms as required by GDPR.

---

**DEVELOPED BY Sahil Vashisht (Software Developer)**