# AgriVision Pro — Frontend Documentation

> **Framework:** Next.js 15 (App Router) · React 19 · TypeScript  
> **Styling:** Tailwind CSS v3 · Shadcn/UI components  
> **State:** Zustand (global) + TanStack Query v5 (server state)  
> **Real-time:** Socket.io client  
> **AI UX:** react-dropzone · Framer Motion  

---

## Project Structure

```
client/
├── app/
│   ├── layout.tsx              # Root HTML shell + Providers
│   ├── page.tsx                # Redirects → /auth/login
│   ├── globals.css             # Tailwind directives + CSS variables + shimmer
│   ├── auth/login/page.tsx     # Split-screen Login / Register
│   └── (app)/                  # Protected route group
│       ├── layout.tsx          # Auth guard + socket init
│       ├── dashboard/page.tsx  # Farmer Dashboard (3-col grid)
│       ├── health-monitor/page.tsx  # AI HealthScan full page
│       └── marketplace/page.tsx     # B2B Inventory + Order Modal
│
├── components/
│   ├── Providers.tsx           # QueryClient + Toaster wrapper
│   ├── navigation/
│   │   ├── Navbar.tsx          # Sticky top bar + notification bell
│   │   └── Sidebar.tsx         # Collapsible side nav (role-filtered)
│   ├── dashboard/
│   │   ├── HealthScan.tsx      # ★ NEW — Shadcn/UI drag-drop AI widget
│   │   ├── AICropScan.tsx      # Legacy compact widget (kept for reference)
│   │   └── CropStatusCard.tsx  # Individual crop card
│   └── ui/
│       ├── button.tsx          # Shadcn/UI Button (emerald + amber variants)
│       ├── card.tsx            # Shadcn/UI Card family
│       ├── progress.tsx        # Shadcn/UI Progress (auto-colour by value)
│       ├── badge.tsx           # Shadcn/UI Badge (AI status variants)
│       └── SkeletonLoaders.tsx # Shimmer skeletons (Card, CropCard, Analysis)
│
├── hooks/
│   ├── useCrops.ts             # TanStack Query hooks for crops
│   ├── useInventory.ts         # TanStack Query hooks for inventory
│   └── useSocket.ts            # Singleton Socket.io hook
│
├── lib/
│   ├── api.ts                  # Axios instance + all API namespaces
│   └── utils.ts                # cn(), formatCurrency, getSeverityColor, …
│
├── store/
│   └── useAppStore.ts          # Zustand store (auth + notifications + UI)
│
├── postcss.config.js
├── tailwind.config.ts
├── next.config.ts
└── .env.local
```

---

## Environment Variables

Create `client/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Color Design System

The agricultural palette is defined in `tailwind.config.ts` and mirrored as CSS custom properties in `globals.css`.

| Token | Hex | Usage |
|-------|-----|-------|
| `emerald-600` | `#059669` | Primary CTA, sidebar active, icons |
| `emerald-50` | `#ecfdf5` | Hover backgrounds, healthy badges |
| `amber-500` | `#f59e0b` | Warnings, stressed badges, urgency |
| `slate-900` | `#0f172a` | Headings, body text |
| `slate-500` | `#64748b` | Secondary text |
| `red-600` | `#dc2626` | Alerts, diseased badges, delete actions |

---

## Shadcn/UI Components

All components live in `components/ui/` and are zero-dependency (no Radix required).

### Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="emerald" size="sm" loading={isLoading}>
  Run AI Scan
</Button>

// Available variants: default | destructive | outline | secondary
//                     ghost | link | emerald | emerald-outline | amber
// Available sizes:    default | sm | lg | xl | icon | xs
// Props:              loading?: boolean  (shows spinner, disables button)
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
  from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Wheat Field A</CardTitle>
    <CardDescription>50 acres · HEALTHY</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

### Progress

```tsx
import { Progress } from '@/components/ui/progress';

// Auto-colours: ≥80% emerald, ≥60% amber, ≥40% orange, else red
<Progress value={87} className="h-3" />

// Manual colour
<Progress value={45} fillClassName="bg-blue-400" />
```

### Badge

```tsx
import { Badge } from '@/components/ui/badge';

// AI Status variants map directly to the backend CropAIStatus enum
<Badge variant="HEALTHY">Healthy</Badge>
<Badge variant="STRESSED">Stressed</Badge>
<Badge variant="DISEASED">Diseased</Badge>
```

---

## HealthScan Component

`components/dashboard/HealthScan.tsx` — the flagship Step 3 deliverable.

### Features

| Feature | Implementation |
|---------|---------------|
| Drag-and-drop | `react-dropzone` with visual feedback |
| Image preview | `FileReader` → base64 preview with analysing overlay |
| AI call | `POST /api/ai/analyze` via TanStack `useMutation` |
| Confidence bar | Shadcn `<Progress value={confidence} />` (auto-coloured) |
| Severity badge | Shadcn `<Badge variant={aiStatus} />` |
| Treatment steps | Numbered list with product + timing |
| Toast | `react-hot-toast` on success / error |
| Animation | Framer Motion spring enter/exit |

### Usage

```tsx
// On Dashboard — replaces legacy AICropScan
import HealthScan from '@/components/dashboard/HealthScan';

<HealthScan />

// On dedicated Health Monitor page
import HealthScan from '@/components/dashboard/HealthScan';
// The page also shows scan history via useQuery(['ai','analyses'])
```

### AI Analysis Result Shape

```typescript
interface AIAnalysis {
  diagnosis: {
    disease: string;         // e.g. "Leaf Rust" | "Healthy"
    confidence: number;      // 0–100
    severity: 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';
    affectedArea: string;    // e.g. "~35% of visible foliage"
    description: string;
    symptoms: string[];
  };
  treatmentPlan: {
    urgency: 'immediate' | 'within_week' | 'routine';
    steps: Array<{ step: number; action: string; timing: string; product?: string }>;
    preventionTips: string[];
    estimatedRecoveryDays: number;
  };
}
```

**Severity → AI Status mapping** (mirrors backend `mapSeverityToAIStatus`):

| Gemini severity | CropAIStatus | Badge variant |
|-----------------|-------------|---------------|
| `healthy` | `HEALTHY` | green |
| `mild` | `STRESSED` | amber |
| `moderate` | `STRESSED` | amber |
| `severe` | `DISEASED` | red |
| `critical` | `DISEASED` | red |

---

## Dashboard Responsive Layout

The dashboard uses CSS Grid with explicit breakpoints to guarantee the
3-column desktop → 1-column mobile shift:

```
Mobile  (< 768px):  1 column — all sections stack vertically
Tablet  (≥ 768px):  grid-cols-3  →  crops span 2/3, HealthScan 1/3
Desktop (≥ 1280px): crops sub-grid becomes xl:grid-cols-3 (3 crop cards wide)

Crop cards inner grid:
  1-col mobile → 2-col sm → 3-col xl
```

Tailwind classes used:
```html
<!-- Outer grid -->
<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
  <!-- Crops section -->
  <div class="md:col-span-2">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <!-- individual CropStatusCard components -->
    </div>
  </div>
  <!-- HealthScan -->
  <div class="md:col-span-1"> <HealthScan /> </div>
</div>
```

---

## State Management

### Zustand Store (`useAppStore`)

```typescript
// Auth slice
const { user, token, isAuthenticated, setUser, clearUser } = useAppStore();

// Notifications slice
const { notifications, unreadCount, addNotification, markAllRead } = useAppStore();

// UI slice
const { isSidebarOpen, isAnalyzing, toggleSidebar, setIsAnalyzing } = useAppStore();
```

Persistence: Only `user`, `token`, `isAuthenticated` are persisted to `localStorage`
under the key `agrivision-store`.

### TanStack Query Keys

```typescript
['crops']                  // all crops list
['crops', 'stats']         // aggregated stats
['orders', 'recent']       // recent orders
['ai', 'analyses']         // scan history
['inventory']              // marketplace items
```

---

## Socket.io Hook (`useSocket`)

```typescript
// Initialises a singleton socket — safe to call from multiple components
import { useSocket } from '@/hooks/useSocket';

function MyComponent() {
  const socket = useSocket(); // connects on mount, disconnects on unmount
  // Automatically handles: new_order, order_status_update, crop_alert events
  // → adds to Zustand notifications + react-hot-toast
}
```

---

## API Client (`lib/api.ts`)

All API namespaces:

```typescript
import { authApi, cropsApi, ordersApi, aiApi, inventoryApi } from '@/lib/api';

// Examples
authApi.login({ email, password });
cropsApi.create({ name, plantedDate, ... });
aiApi.analyzeImage(formData);            // multipart
ordersApi.updateStatus(id, { status: 'shipped', trackingNumber: '...' });
inventoryApi.getAll({ search: 'wheat', minPrice: 200 });
```

The Axios instance:
- Automatically attaches `Authorization: Bearer <token>` from `localStorage`
- On 401 → clears auth state and redirects to `/auth/login`

---

## Running the Client

```bash
cd client
npm install --legacy-peer-deps
npm run dev          # → http://localhost:3000
npm run build        # production build
npm run lint         # ESLint check
npx tsc --noEmit     # TypeScript type check
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.x | Framework (App Router) |
| `react` | 19.x | UI runtime |
| `framer-motion` | 11.x | Page & component animations |
| `lucide-react` | 0.469.x | Icon system |
| `@tanstack/react-query` | 5.x | Server state, caching |
| `zustand` | 5.x | Global client state |
| `socket.io-client` | 4.x | Real-time events |
| `react-dropzone` | 14.x | Drag-and-drop file upload |
| `axios` | 1.x | HTTP client |
| `react-hot-toast` | 2.x | Toast notifications |
| `class-variance-authority` | 0.7.x | Shadcn/UI variant system |
| `clsx` + `tailwind-merge` | latest | Conditional class merging |
