# Email Tracking API Documentation

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-replit-domain.replit.dev`

## Overview
This API provides simple email open tracking functionality using 1x1 pixel tracking. When someone opens an email containing a tracking pixel, the system records the open event.

---

## Endpoints

### 1. Create Tracking Pixel
**GET** `/api/pixel/create`

Creates a new unique tracking pixel and returns the tracking URL and embed code.

**Parameters:**
- `metadata` (optional, query parameter): JSON string with additional data to store

**Request Example:**
```bash
curl -X GET "http://localhost:5000/api/pixel/create"
```

**Request with Metadata:**
```bash
curl -X GET "http://localhost:5000/api/pixel/create?metadata=%7B%22campaign%22%3A%22newsletter%22%7D"
```

**Response:**
```json
{
  "id": "48a962dd-fa9d-4e0a-886e-aa7cda4e7f87",
  "trackingUrl": "https://your-domain.replit.dev/api/pixel/48a962dd-fa9d-4e0a-886e-aa7cda4e7f87",
  "embedCode": "<img src=\"https://your-domain.replit.dev/api/pixel/48a962dd-fa9d-4e0a-886e-aa7cda4e7f87\" width=\"1\" height=\"1\" style=\"display:none;\" />",
  "createdAt": "2025-07-26T05:23:32.068Z"
}
```

**Response Fields:**
- `id`: Unique tracking pixel identifier
- `trackingUrl`: Direct URL to the tracking pixel
- `embedCode`: Ready-to-use HTML code for emails
- `createdAt`: Timestamp when pixel was created

---

### 2. Track Pixel Open
**GET** `/api/pixel/:id`

Serves a 1x1 transparent GIF and marks the pixel as opened. This is the actual tracking endpoint that goes in emails.

**Parameters:**
- `id` (path parameter): The tracking pixel ID

**Request Example:**
```bash
curl -X GET "http://localhost:5000/api/pixel/48a962dd-fa9d-4e0a-886e-aa7cda4e7f87"
```

**Response:**
- Content-Type: `image/gif`
- Body: 1x1 transparent GIF binary data
- Status: 200 OK

**Headers:**
- `Content-Type: image/gif`
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

**Side Effects:**
- Marks the pixel as opened in the system
- Records the timestamp of the open event
- Logs the event to server console

---

### 3. Check Pixel Status
**POST** `/api/pixel/check`

Check if a specific tracking pixel has been opened.

**Request Body:**
```json
{
  "id": "48a962dd-fa9d-4e0a-886e-aa7cda4e7f87"
}
```

**Request Example:**
```bash
curl -X POST "http://localhost:5000/api/pixel/check" \
     -H "Content-Type: application/json" \
     -d '{"id":"48a962dd-fa9d-4e0a-886e-aa7cda4e7f87"}'
```

**Response (Not Opened):**
```json
{
  "opened": false,
  "openedAt": null,
  "createdAt": "2025-07-26T05:23:32.068Z"
}
```

**Response (Opened):**
```json
{
  "opened": true,
  "openedAt": "2025-07-26T05:25:15.234Z",
  "createdAt": "2025-07-26T05:23:32.068Z",
  "lastSeenAt": "2025-07-26T05:27:42.567Z",
  "totalViewTime": 15000,
  "viewCount": 3
}
```

**Error Response (Pixel Not Found):**
```json
{
  "opened": false,
  "message": "Pixel not found"
}
```

---

### 4. Dashboard Statistics
**GET** `/api/dashboard`

Returns overall tracking statistics and recent pixel activity.

**Request Example:**
```bash
curl -X GET "http://localhost:5000/api/dashboard"
```

**Response:**
```json
{
  "stats": {
    "totalPixels": 15,
    "openedPixels": 8,
    "openRate": 53
  },
  "recentPixels": [
    {
      "id": "48a962dd-fa9d-4e0a-886e-aa7cda4e7f87",
      "createdAt": "2025-07-26T05:23:32.068Z",
      "openedAt": "2025-07-26T05:25:15.234Z",
      "opened": true,
      "metadata": null
    }
  ]
}
```

**Response Fields:**
- `stats.totalPixels`: Total number of tracking pixels created
- `stats.openedPixels`: Number of pixels that have been opened
- `stats.openRate`: Percentage open rate (rounded to nearest integer)
- `stats.avgViewTime`: Average viewing time in milliseconds
- `stats.totalViewTime`: Total viewing time across all pixels in milliseconds
- `recentPixels`: Array of up to 20 most recent pixels with their status

---

## Time Tracking Features

### How Time Tracking Works

The system now tracks viewing duration and engagement for each tracking pixel:

- **View Count**: Number of times the pixel has been loaded
- **Total View Time**: Accumulated viewing time in milliseconds
- **Last Seen**: Timestamp of the most recent pixel load
- **Continuous Viewing**: Time is only counted if pixel reloads occur within 30 seconds

### Time Tracking Fields

- `totalViewTime`: Time in milliseconds (accumulated across all views)
- `viewCount`: Number of times the pixel was loaded
- `lastSeenAt`: ISO timestamp of most recent pixel access
- `avgViewTime`: Average viewing time per opened pixel (dashboard stats only)

### Example Time Tracking Data

```json
{
  "opened": true,
  "openedAt": "2025-07-26T05:25:15.234Z",
  "lastSeenAt": "2025-07-26T05:27:42.567Z",
  "totalViewTime": 25000,
  "viewCount": 5
}
```

This shows:
- Email was opened 5 times
- Total viewing time: 25 seconds
- Last viewed at 5:27 AM

---

## Usage Examples

### Basic Email Tracking Workflow

1. **Create a tracking pixel:**
```bash
curl -X GET "http://localhost:5000/api/pixel/create"
```

2. **Add to email HTML:**
```html
<html>
<body>
  <h1>Your Email Content</h1>
  <p>Lorem ipsum dolor sit amet...</p>
  
  <!-- Tracking pixel (invisible) -->
  <img src="https://your-domain.replit.dev/api/pixel/48a962dd-fa9d-4e0a-886e-aa7cda4e7f87" 
       width="1" height="1" style="display:none;" />
</body>
</html>
```

3. **Check if opened:**
```bash
curl -X POST "http://localhost:5000/api/pixel/check" \
     -H "Content-Type: application/json" \
     -d '{"id":"48a962dd-fa9d-4e0a-886e-aa7cda4e7f87"}'
```

### Testing Tracking

To test if tracking works:
1. Create a pixel via the API
2. Open the tracking URL in a browser
3. Check the status - it should show as opened

---

## Error Handling

### Common HTTP Status Codes
- `200 OK`: Request successful
- `400 Bad Request`: Invalid request body or missing required fields
- `404 Not Found`: Pixel ID not found
- `500 Internal Server Error`: Server error

### Error Response Format
```json
{
  "message": "Error description"
}
```

---

## Technical Details

### Tracking Pixel Implementation
- Uses a 1x1 transparent GIF image
- Base64 encoded: `R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`
- No caching headers to ensure each request is tracked
- Unique UUID4 identifiers for each pixel

### Storage
- In-memory storage (data resets on server restart)
- Production deployments should use persistent database

### CORS & Security
- API accepts requests from any origin
- No authentication required (suitable for email tracking)
- Pixel IDs are UUIDs (not easily guessable)

---

## Rate Limits
Currently no rate limits are implemented. Consider adding rate limiting for production use.

---

## Web Interface URLs

### Dashboard
- Main dashboard: `http://localhost:5000/`
- Test page: `http://localhost:5000/test`

### Features
- Create tracking pixels with one click
- Real-time statistics
- Recent pixel activity
- Copy tracking URLs and embed codes
- Test tracking functionality

---

## Environment Variables

### Optional Configuration
- `BASE_URL`: Override base URL for tracking links
- `REPLIT_DOMAINS`: Automatic domain detection for Replit deployments

If neither is set, defaults to `http://localhost:5000`

---

## Integration Examples

### JavaScript (Frontend)
```javascript
// Create pixel
const response = await fetch('/api/pixel/create');
const pixel = await response.json();

// Check status
const checkResponse = await fetch('/api/pixel/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: pixel.id })
});
const status = await checkResponse.json();
console.log('Opened:', status.opened);
```

### Python
```python
import requests

# Create pixel
response = requests.get('http://localhost:5000/api/pixel/create')
pixel = response.json()

# Check status
check_response = requests.post(
    'http://localhost:5000/api/pixel/check',
    json={'id': pixel['id']}
)
status = check_response.json()
print(f"Opened: {status['opened']}")
```

### PHP
```php
// Create pixel
$response = file_get_contents('http://localhost:5000/api/pixel/create');
$pixel = json_decode($response, true);

// Check status
$postData = json_encode(['id' => $pixel['id']]);
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $postData
    ]
]);
$checkResponse = file_get_contents('http://localhost:5000/api/pixel/check', false, $context);
$status = json_decode($checkResponse, true);
echo "Opened: " . ($status['opened'] ? 'Yes' : 'No');
```