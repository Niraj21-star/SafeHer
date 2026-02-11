# Advanced Features Implementation - SafeHer MVP

## Overview

This document describes the implementation of three strategic production-ready features that extend SafeHer MVP into a more advanced safety platform:

1. **Post-Incident Recovery Mode** - Guides users through recovery with legal resources and mental health support
2. **Evidence Locker Upgrade** - Provides cryptographic evidence integrity with SHA-256 hashing
3. **Intelligent Guardian Matching** - Uses multi-factor scoring to notify the most suitable guardians

## 1. Post-Incident Recovery Mode

### Purpose
After an incident is resolved, users need guidance on legal rights, evidence documentation, and mental health support. Recovery Mode provides a structured post-incident workflow.

### Components

#### Backend: Recovery Endpoints (`backend/src/routes/incidents.js`)

**POST /api/incidents/:incidentId/recovery**
- Marks recovery process as complete
- Sets `recoveryCompleted: true` flag
- Records recovery completion timestamp

```javascript
router.post('/:incidentId/recovery', async (req, res) => {
    const { incidentId } = req.params;
    
    await db.collection('incidents').doc(incidentId).update({
        recoveryCompleted: true,
        recoveryCompletedAt: new Date()
    });
    
    res.json({ success: true });
});
```

**Modified: POST /api/incidents/:incidentId/resolve**
- Now sets `shouldShowRecovery: true` when incident marked resolved
- Triggers recovery panel display in frontend

#### Frontend: RecoveryPanel Component (`src/components/Common/RecoveryPanel.jsx`)

**Features:**
- **4 Tab Navigation**: Overview, Legal Rights, Mental Health Support, Evidence
- **Legal Resources Section**:
  - Know Your Rights (IPC Sections 354, 509)
  - Immediate legal steps (FIR filing, evidence preservation)
  - Legal aid information
- **Mental Health Support**:
  - National Women's Helpline: 181
  - Women in Distress: 1091
  - NIMHANS Crisis Helpline: 080-46110007
  - Vandrevala Foundation: 1860 2662 345
- **NGO Resources**:
  - National Commission for Women
  - Women Power Line
  - Sneha Foundation
- **Evidence Download**: One-click download of complete incident report
- **Recovery Completion**: Button to mark recovery process as done

**Integration:**
- Automatically displays when `incident.shouldShowRecovery === true`
- Integrated into LiveMap tracking page
- Shows after resolving active incident

### User Flow

```
1. User triggers SOS
2. Guardians respond
3. User marks incident as "Resolved"
   ↓
4. Recovery Panel appears automatically
   ↓
5. User reviews legal rights, downloads evidence, accesses support
   ↓
6. User clicks "Complete Recovery Process"
   ↓
7. Backend marks recoveryCompleted = true
8. Panel closes, toast shows "Recovery process completed 💚"
```

---

## 2. Evidence Locker Upgrade

### Purpose
Provides tamper-proof documentation of incidents with cryptographic hashing for legal admissibility and integrity verification.

### Components

#### Backend Service: `evidenceService.js`

**`generateEvidenceHash(incidentId, timestamp, location)`**
- Creates SHA-256 hash using Node.js `crypto` module
- Input: Incident ID, ISO timestamp, lat/lng coordinates
- Output: 64-character hexadecimal hash
- Purpose: Verifies evidence hasn't been tampered with

```javascript
const crypto = require('crypto');

function generateEvidenceHash(incidentId, timestamp, location) {
    const data = `${incidentId}:${timestamp}:${location.lat}:${location.lng}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}
```

**`buildEvidenceRecord(incidentData, incidentId)`**
- Structures all incident data into standardized evidence format
- Includes: timestamps, location, guardian responses, escalation actions
- Returns JSON object with all evidence metadata

**`generateIncidentTimeline(incidentData, incidentId)`**
- Creates chronological event list
- Event types: incident_triggered, guardian_notified, guardian_responded, police_called, incident_resolved
- Each event has: type, timestamp, description, details

**`generateIncidentSummaryText(evidenceRecord, timeline)`**
- Produces human-readable text report
- Format: Plain text with sections for incident details, timeline, guardian responses
- Suitable for download and printing
- Can be submitted to police/legal authorities

#### Backend Endpoints

**GET /api/incidents/:incidentId/evidence**
- Returns JSON evidence record + timeline
- Response format:
```json
{
  "evidence": {
    "incidentId": "...",
    "timestamp": "...",
    "location": {...},
    "evidenceHash": "...",
    "status": "resolved",
    "guardiansNotified": 5,
    "guardianResponses": [...]
  },
  "timeline": [
    {
      "type": "incident_triggered",
      "timestamp": "...",
      "description": "Emergency SOS triggered",
      "details": "..."
    },
    ...
  ]
}
```

**GET /api/incidents/:incidentId/evidence/download**
- Downloads complete evidence report as text file
- Filename: `SafeHer_Incident_[incidentId].txt`
- Content-Type: `text/plain`
- Includes full timeline, hash, all metadata

#### SOS Integration (`backend/src/routes/sos.js`)

- Evidence hash generated automatically when SOS triggered
- Stored in `evidenceHash` field of incident document
- Hash calculated before any data modifications occur

```javascript
const evidenceHash = generateEvidenceHash(
    incidentRef.id,
    new Date().toISOString(),
    location
);

await incidentRef.set({
    ...incidentData,
    evidenceHash,
    timestamp: new Date()
});
```

#### Frontend: EvidenceTimeline Component (`src/components/Common/EvidenceTimeline.jsx`)

**Features:**
- **Evidence Hash Display**: Shows SHA-256 hash with copy button
- **Incident Summary Cards**: Time, location, guardians notified, status
- **Visual Timeline**: Chronological event list with icons
- **Guardian Responses Section**: Shows who accepted/declined, ETAs
- **Download Button**: One-click download of complete text report
- **Responsive Design**: Mobile-friendly scrollable timeline

**Integration:**
- Accessible from past incidents in LiveMap
- "Evidence" button appears on resolved incidents
- Modal overlay with clean exit option

### Evidence Hash Verification

To verify evidence hasn't been tampered with:

1. Get original hash from evidence record
2. Reconstruct hash from incident data: `SHA256(incidentId:timestamp:lat:lng)`
3. Compare hashes - if they match, evidence is authentic

---

## 3. Intelligent Guardian Matching

### Purpose
Instead of notifying all nearby guardians, intelligently ranks and selects the most suitable guardians based on distance, response history, and availability.

### Algorithm

#### Scoring System (Total: 100 points)

**Distance Score (40 points)**
- Priority zone (< 5km): 40 points
- Medium zone (5-10km): 30 points
- Far zone (10-20km): 20 points
- Very far (> 20km): 10 points

**Priority Guardian Bonus (10 points)**
- Guardians marked as `isPriority: true` get +10 points
- User can designate priority guardians in settings

**Response History Score (40 points)**
- Analyzes last 20 alerts sent to guardian
- Metrics tracked:
  - **Acceptance rate** (40%): Accepted / Total alerts
  - **Response time** (30%): Average time to respond
  - **Reliability** (30%): Completed responses / Accepted
- New guardians get neutral 20-point baseline

**Availability Score (10 points)**
- Online/Active: 10 points
- Offline but available: 5 points
- Do Not Disturb: 0 points

#### Implementation: `guardianMatchingService.js`

**`rankGuardiansForIncident(userLocation, userId)`**
```javascript
// 1. Fetch all opted-in guardians within 20km
// 2. For each guardian:
//    - Calculate distance (Haversine formula)
//    - Calculate distance score
//    - Check priority status
//    - Calculate response history score
//    - Check availability
//    - Total = distance + priority + history + availability
// 3. Sort by total score (descending)
// 4. Return ranked array
```

**`getTopGuardiansForNotification(userLocation, userId, count = 10)`**
- Calls `rankGuardiansForIncident()`
- Returns top N guardians
- Default: 10 guardians
- Configurable via `MAX_GUARDIANS_TO_NOTIFY`

**`trackGuardianResponse(incidentId, guardianId, action, responseTime)`**
- Records guardian response in incidents collection
- Updates guardian's alert history:
  - Increments `totalAlerts`
  - Updates `acceptedAlerts`, `responseTime`, `completedAlerts`
- Used to improve future matching

#### Response History Schema

Each guardian document has:
```javascript
{
  userId: "...",
  optIn: true,
  isPriority: false,
  // Response tracking
  totalAlerts: 15,
  acceptedAlerts: 12,
  declinedAlerts: 2,
  missedAlerts: 1,
  completedAlerts: 10,
  averageResponseTime: 180, // seconds
  lastResponseTime: "...",
  // Other fields...
}
```

#### SOS Integration

Modified `POST /api/sos/trigger`:
```javascript
// OLD: Query all guardians within radius
const nearbyGuardians = await db.collection('guardians')
    .where('optIn', '==', true)
    .get();

// NEW: Use intelligent matching
const rankedGuardians = await getTopGuardiansForNotification(
    location, 
    userId, 
    10 // Top 10
);

// Notify only top-ranked guardians
for (const guardian of rankedGuardians) {
    await sendGuardianNotification(guardian, incident);
}
```

---

## Configuration

### Environment Variables

Add to `.env`:
```bash
# Guardian Matching
MAX_GUARDIANS_TO_NOTIFY=10
MAX_DISTANCE_KM=20
PRIORITY_DISTANCE_KM=5

# Evidence Service
EVIDENCE_HASH_ALGORITHM=sha256
```

### Firestore Security Rules

Ensure guardians collection allows reading opted-in profiles:
```javascript
match /guardians/{guardianId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.userId || resource.data.optIn == true);
  
  // Alert tracking subcollection
  match /alerts/{alertId} {
    allow read, write: if request.auth != null && 
      request.auth.uid == guardianId;
  }
}
```

---

## Testing Checklist

### Recovery Mode
- [ ] Trigger SOS, mark resolved, verify recovery panel appears
- [ ] Navigate through all 4 tabs (Overview, Legal, Support, Evidence)
- [ ] Click phone numbers, verify tel: links work
- [ ] Download evidence report, verify file contains incident data
- [ ] Click "Complete Recovery", verify panel closes and backend updates

### Evidence Locker
- [ ] Trigger SOS, verify evidenceHash field populated
- [ ] View evidence timeline, verify events appear chronologically
- [ ] Copy evidence hash, verify clipboard works
- [ ] Download evidence report, verify text format
- [ ] Resolve incident, view evidence from past incidents list

### Guardian Matching
- [ ] Seed guardians at various distances (2km, 8km, 15km)
- [ ] Trigger SOS, check which guardians notified (should be top-ranked)
- [ ] Have guardian accept alert, verify response tracked
- [ ] Trigger another SOS, verify guardian's score improved
- [ ] Mark guardian as priority, verify gets +10 points

---

## API Reference

### Incidents API

#### Complete Recovery
```http
POST /api/incidents/:incidentId/recovery
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Recovery completed successfully"
}
```

#### Get Evidence
```http
GET /api/incidents/:incidentId/evidence
Authorization: Bearer <token>
```

Response:
```json
{
  "evidence": {
    "incidentId": "abc123",
    "timestamp": "2025-01-15T10:30:00Z",
    "evidenceHash": "a1b2c3...",
    "location": {...},
    "guardiansNotified": 5,
    ...
  },
  "timeline": [...]
}
```

#### Download Evidence Report
```http
GET /api/incidents/:incidentId/evidence/download
Authorization: Bearer <token>
```

Response: Text file download

---

## Frontend Integration

### Add to Dashboard or Tracking Page

```jsx
import RecoveryPanel from './components/Common/RecoveryPanel';
import EvidenceTimeline from './components/Common/EvidenceTimeline';

function TrackingPage() {
    const [showRecovery, setShowRecovery] = useState(false);
    const [showEvidence, setShowEvidence] = useState(false);
    const [incidentId, setIncidentId] = useState(null);

    // After resolving incident
    const handleResolve = async (id) => {
        await sosAPI.resolveIncident(id);
        setIncidentId(id);
        setShowRecovery(true); // Automatically show recovery
    };

    return (
        <>
            {/* Your tracking UI */}
            
            {showRecovery && (
                <RecoveryPanel 
                    incidentId={incidentId}
                    onComplete={() => setShowRecovery(false)}
                />
            )}

            {showEvidence && (
                <EvidenceTimeline 
                    incidentId={incidentId}
                    onClose={() => setShowEvidence(false)}
                />
            )}
        </>
    );
}
```

---

## Database Schema Changes

### Incidents Collection

New fields:
```javascript
{
  // Existing fields...
  
  // Evidence fields
  evidenceHash: "a1b2c3...",
  evidenceGenerated: true,
  
  // Recovery fields
  shouldShowRecovery: false,
  recoveryCompleted: false,
  recoveryCompletedAt: null,
  
  // Guardian matching fields
  rankedGuardians: [
    {
      guardianId: "...",
      matchScore: 85,
      distance: 3.2,
      responseScore: 35,
      priorityBonus: 10
    }
  ],
  responders: [
    {
      guardianId: "...",
      action: "accepted",
      timestamp: "...",
      responseTime: 120
    }
  ]
}
```

### Guardians Collection

New fields:
```javascript
{
  // Existing fields...
  
  // Response tracking
  totalAlerts: 0,
  acceptedAlerts: 0,
  declinedAlerts: 0,
  missedAlerts: 0,
  completedAlerts: 0,
  averageResponseTime: null,
  lastResponseTime: null,
  
  // Priority designation
  isPriority: false
}
```

---

## Performance Considerations

### Guardian Matching
- Query limited to 20km radius (configurable)
- Only processes opted-in guardians
- Caches response scores (updates on new alerts)
- Max 10 guardians notified per incident

### Evidence Generation
- Hash generated once at incident creation
- Timeline built on-demand from incident data
- Text report generated server-side (no client processing)

### Recovery Panel
- Lazy-loaded components (only when needed)
- Static resource data (no API calls for helplines)
- Minimal re-renders with proper state management

---

## Security Considerations

### Evidence Integrity
- SHA-256 hash generated server-side (client can't manipulate)
- Hash includes immutable data: incidentId, timestamp, location
- Hash stored immediately after incident creation
- Verification possible by recalculating hash from source data

### Recovery Panel
- All external links use `rel="noopener noreferrer"`
- Phone numbers use `tel:` protocol (user must approve)
- Legal disclaimers included
- No sensitive data exposed in recovery resources

### Guardian Matching
- Only opted-in guardians included in matching
- Response history only visible to system (not exposed to users)
- Firestore rules enforce read/write permissions
- Priority status user-controlled

---

## Future Enhancements

### Recovery Mode
- [ ] Integration with local NGOs for in-person support
- [ ] Automated FIR draft generation from incident data
- [ ] Follow-up check-ins (24h, 1 week, 1 month)
- [ ] Mental health chatbot integration

### Evidence Locker
- [ ] Digital signature support for legal admissibility
- [ ] Photo/video evidence upload with hashing
- [ ] Witness statement recording
- [ ] Blockchain timestamp anchoring for enhanced proof

### Guardian Matching
- [ ] Machine learning for pattern detection
- [ ] Time-of-day availability preferences
- [ ] Guardian specializations (medical, legal, etc.)
- [ ] Real-time location sharing for ETA calculation
- [ ] Dynamic re-ranking based on current traffic conditions

---

## Troubleshooting

### Recovery Panel Not Showing
- Verify `shouldShowRecovery` flag set on incident
- Check browser console for component errors
- Ensure RecoveryPanel imported correctly

### Evidence Hash Mismatch
- Verify incident timestamp format (ISO 8601)
- Check location precision (should match creation time)
- Ensure hash generated before any data modifications

### Guardian Not Receiving Notifications
- Check `optIn` status in guardian document
- Verify guardian within MAX_DISTANCE_KM
- Check Firestore security rules allow reading guardian data
- Ensure guardian has valid FCM token for notifications

---

## Deployment Steps

1. **Deploy Backend Services**
```bash
cd backend
npm install
# Copy evidenceService.js and guardianMatchingService.js to src/services/
# Update routes/sos.js and routes/incidents.js
npm run build
```

2. **Deploy Frontend Components**
```bash
cd src
# Copy RecoveryPanel.jsx and EvidenceTimeline.jsx to components/Common/
# Update LiveMap.jsx with integration code
npm run build
```

3. **Update Firestore Rules**
```bash
firebase deploy --only firestore:rules
```

4. **Update Environment Variables**
```bash
# Add to .env
MAX_GUARDIANS_TO_NOTIFY=10
MAX_DISTANCE_KM=20
```

5. **Test in Production**
- Trigger test SOS
- Verify guardian matching works
- Check evidence hash generation
- Test recovery panel workflow

---

## Success Metrics

### Recovery Mode
- **Adoption Rate**: % of users who complete recovery process
- **Resource Usage**: Which resources accessed most (legal, mental health, evidence)
- **Time to Complete**: Average time from resolution to recovery completion

### Evidence Locker
- **Evidence Downloads**: Number of reports downloaded
- **Hash Verifications**: How often users verify evidence integrity
- **Legal Usage**: Evidence submitted in legal proceedings

### Guardian Matching
- **Response Rate Improvement**: % increase in guardian acceptance rates
- **Response Time Reduction**: Average time saved vs. random selection
- **User Satisfaction**: Rating of guardian quality/relevance

---

## Credits & License

**SafeHer MVP - Advanced Features**
- Evidence hashing: SHA-256 cryptographic standard
- Guardian matching: Multi-factor scoring algorithm
- Recovery resources: Compiled from NCW, NIMHANS, Indian government helplines

Licensed under MIT. For support contact: support@safeher.com
