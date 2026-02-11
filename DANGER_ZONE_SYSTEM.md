# Community-Reported Danger Zone System

## Overview

The Community-Reported Danger Zone System empowers SafeHer users to report and visualize unsafe locations in their community. This crowdsourced safety intelligence helps women make informed decisions about their routes and avoid potentially dangerous areas.

## ✨ Key Features

### 🗺️ Interactive Map Visualization
- **Color-coded risk markers**: Green (low), Yellow (medium), Red (high)
- **Risk-based clustering**: Nearby reports are automatically grouped
- **Real-time updates**: New reports appear immediately on the map
- **Detailed popups**: View report count, categories, and risk score

### 📝 Easy Reporting
- **One-click GPS detection**: Automatic location capture
- **5 predefined categories**: Harassment, Poor Lighting, Stalking, Suspicious Activity, Unsafe Transport Stop
- **Optional descriptions**: Add context for better awareness
- **Anonymous reporting**: Protect reporter identity

### 🛡️ Misuse Protection
- **Rate limiting**: 1 report per minute per user (10 in dev mode)
- **Minimum threshold**: Requires 2+ reports for high-risk classification
- **Validation**: Coordinates and category validation
- **Recency weighting**: Recent reports carry more weight

### 🎯 Intelligent Risk Scoring
- **Time-based weighting**:
  - Reports < 7 days old: 1.5x weight
  - Reports 7-30 days old: 1.0x weight
  - Reports > 30 days old: 0.5x weight
- **Clustering algorithm**: Groups reports within 500 meters
- **Multi-factor risk**: Based on report count × average recency

## 📐 Architecture

### Backend Components

#### `backend/src/services/dangerZoneService.js`
Core business logic for danger zone management.

**Key Functions:**
```javascript
// Calculate risk score for a cluster
calculateRiskScore(reports) → number

// Fetch zones within radius
getDangerZones(lat, lng, radiusKm) → Promise<Array>

// Create new report
createDangerZoneReport(data) → Promise<Object>

// Cluster nearby reports
clusterDangerZones(reports) → Array

// Generate mock data for testing
generateMockDangerZones(lat, lng) → Array
```

**Risk Level Calculation:**
```javascript
// Risk score = sum of (recency weight per report)
if (score >= 5 && reportCount >= 2) → HIGH
else if (score >= 2) → MEDIUM
else → LOW
```

**Clustering Algorithm:**
- Groups reports within 500 meters
- Calculates average position
- Aggregates categories
- Computes combined risk score

#### `backend/src/routes/dangerZones.js`
REST API endpoints for danger zone operations.

**Endpoints:**

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/danger-zones/report` | Submit new report | 1/min (prod), 10/min (dev) |
| GET | `/api/danger-zones?lat=X&lng=Y&radius=Z` | Fetch zones | 1000/15min |
| GET | `/api/danger-zones/:zoneId` | Get zone details | 1000/15min |

**Request/Response Examples:**

**POST /api/danger-zones/report**
```json
// Request
{
  "lat": 18.5204,
  "lng": 73.8567,
  "category": "Poor Lighting",
  "description": "Street lights not working"
}

// Response
{
  "success": true,
  "report": {
    "id": "abc123",
    "lat": 18.5204,
    "lng": 73.8567,
    "category": "Poor Lighting",
    "description": "Street lights not working",
    "timestamp": "2024-01-15T10:30:00Z",
    "userId": "user123",
    "verified": false
  }
}
```

**GET /api/danger-zones**
```json
// Response
{
  "success": true,
  "zones": [
    {
      "id": "cluster_0",
      "lat": 18.5204,
      "lng": 73.8567,
      "reportCount": 3,
      "riskScore": 4.5,
      "riskLevel": "medium",
      "categories": ["Poor Lighting", "Harassment"],
      "firstReported": "2024-01-10T08:00:00Z",
      "lastReported": "2024-01-15T10:30:00Z",
      "reports": [...]
    }
  ],
  "count": 1,
  "radius": 10
}
```

### Frontend Components

#### `src/components/Safety/ReportDangerZone.jsx`
Modal form component for submitting danger zone reports.

**Features:**
- Auto-detect GPS location with user consent
- Category selection with icon buttons
- Optional description (max 500 chars)
- Real-time validation
- Success/error notifications
- Anonymous submission

**Usage:**
```jsx
<ReportDangerZone 
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
  onReportSuccess={(report) => {
    // Handle success (e.g., refresh map)
  }}
/>
```

**UI Flow:**
1. User clicks "Report Danger" button on map
2. Modal opens with GPS auto-detection
3. User selects category and adds description
4. Submit validates and sends to API
5. Success message displays for 2 seconds
6. Modal closes and map refreshes

#### `src/components/Track/LiveMap.jsx` (Enhanced)
Main map component now includes danger zone visualization.

**New Features:**
- Fetches danger zones on map load
- Renders color-coded markers
- "Report Danger" button overlay
- Popup details on marker click
- Auto-refresh on new report

**Danger Zone Marker:**
```javascript
// Custom Leaflet icon
const icon = L.divIcon({
  html: `
    <div style="
      background-color: ${color};  // red/yellow/green
      border: 3px solid white;
      border-radius: 50%;
      ...
    ">
      ⚠️
    </div>
  `,
  iconSize: [32, 32]
});
```

**Popup Content:**
- Risk level badge (HIGH/MEDIUM/LOW)
- Report count
- Categories list
- Risk score value

#### `src/services/api.js` (Enhanced)
Added danger zone API client.

```javascript
export const dangerZonesAPI = {
  reportZone: (data) => api.post('/danger-zones/report', data),
  getZones: (params) => api.get('/danger-zones', { params }),
  getZoneDetails: (zoneId) => api.get(`/danger-zones/${zoneId}`)
};
```

## 🗄️ Database Schema

### Firestore Collection: `dangerZones`

**Document Structure:**
```javascript
{
  // Location
  lat: number,          // Latitude (-90 to 90)
  lng: number,          // Longitude (-180 to 180)
  
  // Report details
  category: string,     // One of 5 predefined categories
  description: string,  // Optional context (max 500 chars)
  timestamp: Timestamp, // When reported
  
  // User info
  userId: string,       // Reporter ID (or 'anonymous')
  
  // Verification
  verified: boolean     // Admin verification flag
}
```

**Indexes:**
In production, create composite indexes:
```
- Collection: dangerZones
- Fields: lat (Ascending), lng (Ascending)
- Query scope: Collection
```

## 🎨 User Experience

### Reporting Flow

1. **Navigation**: User goes to Live Location (Track) page
2. **Detection**: Map loads with current location and danger zones
3. **Decision**: User notices unsafe area
4. **Action**: Clicks "Report Danger" button (top-right of map)
5. **Location**: GPS auto-detects (or manual entry)
6. **Category**: Selects from 5 icon-based options
7. **Details**: Adds optional description
8. **Submit**: Validates and sends to API
9. **Confirmation**: Success message + map refresh
10. **Visibility**: New danger zone appears on map immediately

### Viewing Danger Zones

1. **Map Load**: Danger zones fetch within 10km radius
2. **Visual Cues**: Color-coded markers indicate risk level
   - 🟢 Green: Low risk (score < 2)
   - 🟡 Yellow: Medium risk (score 2-5)
   - 🔴 Red: High risk (score > 5)
3. **Interaction**: Click marker to see details popup
4. **Information**: Popup shows:
   - Risk level badge
   - Number of reports
   - Categories involved
   - Risk score value

## 🔒 Security & Privacy

### Rate Limiting
- **Report endpoint**: 1 request/minute (production), 10/minute (development)
- **Fetch endpoints**: 1000 requests/15 minutes
- **Key generation**: Uses userId if authenticated, otherwise IP address

### Validation
- **Coordinates**: Must be valid numbers within Earth bounds
- **Category**: Must match one of 5 predefined categories
- **Description**: Max 500 characters
- **Authentication**: Bearer token required (or dev bypass)

### Privacy Protection
- Reports stored with userId but not displayed publicly
- Option for anonymous reporting (userId = 'anonymous')
- No personal identifiers in public API responses
- Location precision limited to 6 decimal places (~10cm)

### Misuse Prevention
- Minimum 2 reports required for high-risk classification
- Recency weighting prevents stale report spam
- Rate limiting prevents rapid-fire fake reports
- Admin verification flag for future moderation

## 🧪 Demo Mode

### Mock Data
When `VITE_DEMO_MODE=true` or `demo=true` query param:

```javascript
// Example mock zones
[
  {
    lat: 18.5304,
    lng: 73.8667,
    category: 'Poor Lighting',
    reportCount: 3,
    riskLevel: 'medium'
  },
  {
    lat: 18.5054,
    lng: 73.8417,
    category: 'Harassment',
    reportCount: 2,
    riskLevel: 'medium'
  },
  // ... 4 more zones
]
```

**Benefits:**
- Test without real reports
- Demonstrate system functionality
- Train users on feature usage
- QA without database pollution

## 📊 Risk Scoring Algorithm

### Formula
```
Risk Score = Σ (recencyWeight_i) for all reports in cluster

where recencyWeight_i = 
  1.5  if report age < 7 days
  1.0  if report age 7-30 days
  0.5  if report age > 30 days
```

### Risk Levels
```
HIGH:   score >= 5 AND reportCount >= 2
MEDIUM: score >= 2
LOW:    score < 2
```

### Example Calculation

**Scenario**: 3 reports at same location
- Report 1: 2 days ago → weight = 1.5
- Report 2: 5 days ago → weight = 1.5
- Report 3: 15 days ago → weight = 1.0

**Risk Score**: 1.5 + 1.5 + 1.0 = **4.0**  
**Risk Level**: **MEDIUM** (score 4.0 >= 2, but < 5)

**If one more recent report added:**
- Report 4: 1 day ago → weight = 1.5
- New score: 4.0 + 1.5 = **5.5**
- New level: **HIGH** (score >= 5, reportCount >= 2)

## 🚀 API Integration

### Client-Side Usage

```javascript
import { dangerZonesAPI } from './services/api';

// Report a danger zone
const reportZone = async () => {
  try {
    const response = await dangerZonesAPI.reportZone({
      lat: 18.5204,
      lng: 73.8567,
      category: 'Poor Lighting',
      description: 'Street lights broken'
    });
    console.log('Report ID:', response.data.report.id);
  } catch (error) {
    console.error('Failed to report:', error.response?.data?.error);
  }
};

// Fetch nearby danger zones
const fetchZones = async (userLat, userLng) => {
  try {
    const response = await dangerZonesAPI.getZones({
      lat: userLat,
      lng: userLng,
      radius: 10,  // 10km
      demo: false
    });
    const zones = response.data.zones;
    console.log(`Found ${zones.length} danger zones`);
  } catch (error) {
    console.error('Failed to fetch zones:', error);
  }
};

// Get zone details
const getDetails = async (zoneId) => {
  try {
    const response = await dangerZonesAPI.getZoneDetails(zoneId);
    console.log('Zone details:', response.data.zone);
  } catch (error) {
    console.error('Failed to fetch details:', error);
  }
};
```

## 🎯 Future Enhancements

### Phase 2 Features
- [ ] Admin verification dashboard
- [ ] User reputation scoring
- [ ] Photo attachments with zones
- [ ] Time-of-day risk patterns
- [ ] Heat map visualization
- [ ] Navigation integration (avoid danger zones)
- [ ] Push notifications for nearby zones
- [ ] Community moderation (upvote/downvote)
- [ ] Integration with police crime data
- [ ] Gamification (points for verified reports)

### Technical Improvements
- [ ] Geohash-based querying for scalability
- [ ] Redis caching for hot zones
- [ ] WebSocket for real-time updates
- [ ] ML-based anomaly detection
- [ ] Advanced clustering algorithms (DBSCAN)
- [ ] Progressive Web App offline support
- [ ] Voice-based reporting

## 🧰 Development

### Running Locally

1. **Backend**:
```bash
cd backend
npm install
npm run dev
```

2. **Frontend**:
```bash
npm install
npm run dev
```

3. **Environment**:
```env
# .env
VITE_DEMO_MODE=true  # Enable demo data
VITE_API_URL=http://localhost:5000/api
```

### Testing

**Test Report Submission:**
```bash
curl -X POST http://localhost:5000/api/danger-zones/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "lat": 18.5204,
    "lng": 73.8567,
    "category": "Poor Lighting",
    "description": "Test report"
  }'
```

**Test Fetch Zones:**
```bash
curl "http://localhost:5000/api/danger-zones?lat=18.5204&lng=73.8567&radius=10&demo=true"
```

### Debugging

**Console Logs:**
```javascript
// Backend
[DangerZones] New report created: {id, category, location}
[DangerZones] Returning N zones within Xkm
[DangerZoneService] Error fetching danger zones: ...

// Frontend
[ReportDangerZone] Location detected: {lat, lng}
[ReportDangerZone] Report submitted: {id, ...}
[LiveMap] Loaded N danger zones
[LiveMap] Error fetching danger zones: ...
```

## 📖 User Documentation

### How to Report a Danger Zone

1. Open SafeHer app and go to **Track** (Live Location) page
2. Click the **"Report Danger"** button (top-right of map)
3. Allow location access when prompted
4. Select a **category** that best describes the danger:
   - 🚨 **Harassment** - Catcalling, eve-teasing, verbal abuse
   - 💡 **Poor Lighting** - Dark streets, broken lights
   - 👁️ **Stalking** - Someone following or watching
   - ⚠️ **Suspicious Activity** - Unusual behavior, loitering
   - 🚏 **Unsafe Transport Stop** - Isolated bus/auto stops
5. (Optional) Add **description** with more details
6. Click **"Submit Report"**
7. See success message and your report on the map!

### Understanding Risk Levels

**🟢 GREEN (Low Risk)**
- Few reports (< 2)
- Older reports (> 30 days)
- Single incident type
- **Action**: Normal caution

**🟡 YELLOW (Medium Risk)**
- Multiple reports (2-4)
- Recent activity (7-30 days)
- Mixed incident types
- **Action**: Increased awareness

**🔴 RED (High Risk)**
- Many reports (5+)
- Very recent (< 7 days)
- Repeated patterns
- **Action**: Avoid or use alternate route

### Best Practices

**When Reporting:**
- ✅ Report immediately for accuracy
- ✅ Be specific in descriptions
- ✅ Select correct category
- ✅ Only report genuine concerns
- ❌ Don't spam fake reports
- ❌ Don't include personal info

**When Viewing:**
- ✅ Check danger zones before travel
- ✅ Plan alternate routes if needed
- ✅ Share info with trusted contacts
- ✅ Report any new incidents
- ❌ Don't panic - use as guidance
- ❌ Don't assume 100% safety elsewhere

## 📝 Changelog

### v1.0.0 - Initial Release
- Backend danger zone service
- REST API with rate limiting
- Frontend report form
- LiveMap integration
- Color-coded risk markers
- Demo mode support
- Clustering algorithm
- Risk scoring system

---

**Built with 💜 for women's safety**

For questions or support, contact: support@safeher.app
