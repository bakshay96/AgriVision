# AgriVision Pro — REST API Documentation

> **Base URL:** `http://localhost:5000/api`  
> **Auth:** All protected routes require `Authorization: Bearer <jwt_token>`  
> **Content-Type:** `application/json` (multipart/form-data for file uploads)

---

## Standard Response Envelope

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "statusCode": 422, "message": "Validation failed: ..." }
```

---

## Auth Errors

| Code | Meaning |
|------|---------|
| 400  | Bad request / CastError (invalid ObjectId) |
| 401  | Unauthorized — missing or expired JWT |
| 404  | Route not found |
| 409  | Duplicate key (e.g. email already registered) |
| 422  | Mongoose ValidationError |
| 429  | Rate limit exceeded |
| 500  | Internal server error |

---

## 1. Authentication — `/api/auth`

### POST `/api/auth/register`
Register a new user and receive a JWT.

**Body**
```json
{
  "name": "Jane Farmer",
  "email": "jane@farm.com",
  "password": "SecurePass123",
  "role": "FARMER",
  "farmName": "Green Acres",
  "farmLocation": { "lat": 37.7749, "lng": -122.4194, "address": "123 Farm Rd" },
  "farmSizeAcres": 120
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "664abc...",
      "name": "Jane Farmer",
      "email": "jane@farm.com",
      "role": "FARMER",
      "tenantId": "uuid-v4",
      "farmName": "Green Acres",
      "farmLocation": { "lat": 37.7749, "lng": -122.4194, "address": "123 Farm Rd" }
    }
  }
}
```

---

### POST `/api/auth/login`
Authenticate and receive a JWT.

**Body**
```json
{ "email": "jane@farm.com", "password": "SecurePass123" }
```

**Response 200** — same envelope as register.

---

### GET `/api/auth/me` 🔒
Returns the currently authenticated user's profile.

**Response 200**
```json
{ "success": true, "data": { "user": { ... } } }
```

---

### PUT `/api/auth/profile` 🔒
Update name, farmName, farmLocation, phone, avatar, etc.

**Body** (all fields optional)
```json
{
  "farmName": "Green Acres v2",
  "farmLocation": { "lat": 37.8, "lng": -122.5, "address": "456 New Rd" },
  "phoneNumber": "+15550001234"
}
```

---

## 2. Crops — `/api/crops` 🔒

### GET `/api/crops`
List all crops for the authenticated tenant.

**Query params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | — | Filter by CropStatus |
| `healthScore` | string | — | Filter by health score |
| `aiStatus` | string | — | `HEALTHY \| STRESSED \| DISEASED \| UNKNOWN` |
| `search` | string | — | Name / variety text search |

**Response 200**
```json
{
  "success": true,
  "data": {
    "crops": [ { "_id": "...", "name": "Wheat", "aiStatus": "HEALTHY", ... } ],
    "total": 42,
    "page": 1,
    "pages": 3
  }
}
```

---

### POST `/api/crops`
Create a new crop. Triggers Mock AI harvest prediction automatically.

**Body**
```json
{
  "name": "Wheat",
  "variety": "Winter Wheat",
  "fieldLocation": "Field A-4",
  "plantedDate": "2024-11-01",
  "expectedHarvestDate": "2025-03-15",
  "areaAcres": 50,
  "expectedYieldTons": 125,
  "soilData": { "ph": 6.5, "nitrogen": 40, "phosphorus": 25, "potassium": 200 }
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "crop": {
      "_id": "...",
      "aiStatus": "UNKNOWN",
      "predictedHarvestDate": "2025-03-08T00:00:00.000Z",
      "daysUntilHarvest": 87
    },
    "harvestPrediction": {
      "confidenceLevel": 92,
      "daysFromNow": 87,
      "yieldEstimate": 130.5,
      "factors": ["Soil pH factor: 0.95", "Rainfall factor: 1.00"]
    }
  }
}
```

---

### GET `/api/crops/stats/summary` 🔒
Aggregated dashboard statistics.

**Response 200**
```json
{
  "success": true,
  "data": {
    "totalCrops": 12,
    "healthStats": [
      { "_id": "good", "count": 7 },
      { "_id": "fair", "count": 3 }
    ],
    "aiStatusStats": [
      { "_id": "HEALTHY", "count": 8 },
      { "_id": "STRESSED", "count": 3 }
    ],
    "statusCounts": [
      { "_id": "growing", "count": 10 }
    ]
  }
}
```

---

### GET `/api/crops/:id` | PUT `/api/crops/:id` | DELETE `/api/crops/:id`
Standard CRUD on individual crop documents.

**PUT body** — any subset of crop fields; `aiStatus` and `aiStatusUpdatedAt` are automatically set by the AI analysis endpoint.

---

## 3. Orders — `/api/orders` 🔒

### GET `/api/orders`
List orders (scoped to tenant & role: buyers see their own; farmers see orders for their crops).

**Query params:** `page`, `limit`, `status`, `role`

---

### POST `/api/orders`
Place a new order. Automatically deducts inventory stock and emits `new_order` via Socket.io.

**Body**
```json
{
  "farmerId": "664abc...",
  "items": [
    {
      "inventoryId": "664def...",
      "cropName": "Wheat",
      "variety": "Winter",
      "quantity": 10,
      "unit": "ton",
      "pricePerUnit": 250
    }
  ],
  "shippingAddress": {
    "street": "1 Buyer Ln",
    "city": "Chicago",
    "state": "IL",
    "zipCode": "60601",
    "country": "US"
  },
  "notes": "Handle with care"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "...",
      "orderNumber": "AGV-LF3K1A-XQRT",
      "status": "pending",
      "totalAmount": 2500,
      "transactionId": null,
      "paymentStatus": "pending"
    }
  }
}
```

---

### PATCH `/api/orders/:id/status` 🔒 (FARMER / ADMIN)
Update order status and optionally record tracking number.

**Body**
```json
{
  "status": "shipped",
  "trackingNumber": "1Z999AA10123456784",
  "transactionId": "txn_stripe_abc123"
}
```

Emits `order_status_update` via Socket.io to the buyer's user room.

---

### GET `/api/orders/stats/summary` 🔒
Order aggregation by status and revenue totals.

---

## 4. AI Analysis — `/api/ai`

### POST `/api/ai/analyze` 🔒 (FARMER)
Upload a crop image for Gemini Vision disease detection.

**Request** — `multipart/form-data`
```
image: <File>   (JPEG | PNG | WebP, max 10 MB)
cropId: string  (optional — if provided, updates crop.aiStatus automatically)
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "_id": "...",
      "imageUrl": "/uploads/scan_abc123.jpg",
      "diagnosis": {
        "disease": "Leaf Rust",
        "confidence": 87,
        "severity": "moderate",
        "affectedArea": "~35% of visible foliage",
        "description": "Fungal infection causing orange pustules...",
        "symptoms": ["Orange powdery pustules", "Yellowing leaves", "Premature leaf drop"]
      },
      "treatmentPlan": {
        "urgency": "within_week",
        "steps": [
          { "step": 1, "action": "Remove heavily infected leaves", "timing": "Immediately", "product": "None" },
          { "step": 2, "action": "Apply fungicide spray", "timing": "Within 24h", "product": "Mancozeb 75% WP" }
        ],
        "preventionTips": ["Ensure good air circulation", "Avoid overhead irrigation"],
        "estimatedRecoveryDays": 14
      },
      "aiModel": "gemini-1.5-flash",
      "processingTimeMs": 2341
    }
  }
}
```

> **Note:** If a `GEMINI_API_KEY` is not configured the endpoint falls back to a structured mock response.

---

### GET `/api/ai/analyses` 🔒
List all AI scan history for the authenticated user.

**Query params:** `page`, `limit`

---

### GET `/api/ai/analyses/:id` 🔒
Retrieve a single analysis result.

---

### DELETE `/api/ai/analyses/:id` 🔒
Archive (soft-delete) an analysis record.

---

## 5. Inventory — `/api/inventory`

### GET `/api/inventory`
Public endpoint — lists all available inventory (marketplace).

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Full-text search (cropName, variety, city) |
| `cropType` | string | Filter by crop name |
| `minPrice` | number | Min price per unit |
| `maxPrice` | number | Max price per unit |
| `sort` | string | `-pricePerUnit`, `createdAt`, `quantity` |
| `page` / `limit` | number | Pagination |

---

### POST `/api/inventory` 🔒 (FARMER)
Create a new listing.

**Body**
```json
{
  "cropName": "Wheat",
  "variety": "Hard Red Winter",
  "quantity": 500,
  "unit": "ton",
  "pricePerUnit": 280,
  "currency": "USD",
  "availableFrom": "2025-03-20",
  "location": { "city": "Kansas City", "state": "KS", "country": "US" },
  "description": "Premium HRW wheat, protein 13.5%",
  "certifications": ["Organic", "Non-GMO"]
}
```

**Response 201** — inventory document with auto-computed `status` (`available | low_stock | out_of_stock`).

---

### GET `/api/inventory/my/listings` 🔒 (FARMER)
Returns only the authenticated farmer's listings.

---

### PUT `/api/inventory/:id` | DELETE `/api/inventory/:id` 🔒
Standard update / soft-delete (sets `isActive: false`).

---

## 6. Real-Time Events — Socket.io

Connect to `http://localhost:5000` with:
```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000', {
  auth: { token: '<jwt>' }
});

// Join your rooms
socket.emit('join', { tenantId: '...', userId: '...' });
```

| Event | Direction | Payload |
|-------|-----------|---------|
| `new_order` | Server → Farmer | `{ orderId, orderNumber, buyer, items, totalAmount }` |
| `order_status_update` | Server → Buyer | `{ orderId, status, trackingNumber }` |
| `ai_analysis_complete` | Server → Farmer | `{ analysisId, cropId, aiStatus }` |
| `crop_alert` | Server → Farmer | `{ cropId, cropName, severity, message }` |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | HS256 signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | — | Token TTL (default `7d`) |
| `GEMINI_API_KEY` | ⚠️ | Gemini Vision AI key — mock used if absent |
| `CLIENT_URL` | — | CORS allowed origin (default `http://localhost:3000`) |
| `PORT` | — | HTTP port (default `5000`) |
