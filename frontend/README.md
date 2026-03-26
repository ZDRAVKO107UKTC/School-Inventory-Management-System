# School Inventory Management System - Frontend

**Status**: 🎨 **Design & Component Architecture Phase** (API-Ready, No Functional Implementation)

A premium React + TypeScript frontend for school inventory management. Built with Vite, Tailwind CSS, Framer Motion, and Zustand. API contracts are ready to connect to Node.js/Express backend.

## Table of Contents

- [Project Vision](#-project-vision)
- [Architecture](#️-architecture-overview)
- [Design System](#-design-system)
- [API Contracts](#-api-ready-architecture)
- [Setup & Development](#-getting-started)
- [Integration Guide](#-backend-integration-guide)
- [Type Safety](#-typescript--type-safety)

## 🎯 Project Vision

**Two distinct user experiences:**

1. **Students/Staff** (Limited Access)
   - Browse available equipment with photos & specs
   - Submit borrow requests with date selection
   - Track active borrowing history & return dates
   - View request status (pending → approved → returned)

2. **Administrators** (Full Access)
   - Inventory management (add/edit/delete equipment)
   - Request approval workflow with notes
   - System analytics & reports
   - Export data (CSV, PDF, Google Sheets)
   - User management & role assignment

## 🏗️ Architecture Overview

### Current Development Phase

✅ Design system with color tokens, typography, spacing  
✅ Component library (UI primitives, forms, layouts)  
✅ Authentication UI components (dark/light mode)  
✅ API service layer with TypeScript contracts  
✅ Zustand store structure for state management  
✅ Framer Motion animation setup  
⏳ **Backend integration** — Ready to connect to API

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                      # Reusable UI components
│   │   │   ├── Button.tsx           # Primary, secondary, outline variants
│   │   │   ├── Input.tsx            # Text, password, email inputs
│   │   │   ├── Card.tsx             # Container component
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   └── ...
│   │   ├── auth/                    # Auth-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── OAuthButtons.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── InteractiveBackground.tsx
│   │   ├── dashboard/               # Dashboard components
│   │   │   ├── EquipmentCard.tsx
│   │   │   ├── Virtual3DModel.tsx
│   │   │   └── RequestList.tsx
│   │   └── admin/                   # Admin-only components
│   │       ├── UserManagement.tsx
│   │       ├── InventoryEditor.tsx
│   │       └── RequestApprovalPanel.tsx
│   ├── features/                    # Feature modules (organized by domain)
│   │   ├── inventory/               # Equipment browsing & details
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── requests/                # Borrow request workflow
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── admin/                   # Admin dashboard & management
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── analytics/               # Reports & analytics
│   │       ├── pages/
│   │       ├── components/
│   │       └── hooks/
│   ├── pages/
│   │   ├── AuthPage.tsx             # Login/Signup page
│   │   ├── DashboardPage.tsx        # Main inventory page
│   │   ├── AdminPage.tsx            # Admin panel
│   │   ├── NotFoundPage.tsx
│   │   └── LoadingPage.tsx
│   ├── services/                    # API clients & business logic
│   │   ├── apiClient.ts             # HTTP wrapper
│   │   ├── authService.ts           # Authentication
│   │   ├── equipmentService.ts      # Inventory API
│   │   ├── requestService.ts        # Borrow requests API
│   │   └── userService.ts           # User management API
│   ├── stores/                      # Zustand state management
│   │   ├── authStore.ts             # Authentication state
│   │   ├── equipmentStore.ts        # Inventory state
│   │   ├── uiStore.ts               # UI state (theme, modals)
│   │   └── notificationStore.ts     # Toast/notification state
│   ├── hooks/
│   │   ├── useTheme.ts              # Dark/light mode
│   │   ├── useAuth.ts               # Authentication logic
│   │   ├── useAsync.ts              # Generic data fetching
│   │   └── useNotification.ts       # Toast notifications
│   ├── types/
│   │   ├── api.ts                   # API response types & utilities
│   │   ├── auth.ts                  # Auth-related types (User, LoginRequest, etc.)
│   │   ├── equipment.ts             # Equipment DTOs
│   │   ├── request.ts               # Borrow request DTOs
│   │   └── index.ts                 # Re-exports
│   ├── utils/
│   │   ├── constants.ts             # App-level constants
│   │   ├── formatting.ts            # Date, currency, string formatting
│   │   ├── validation.ts            # Form validation helpers
│   │   └── errorHandling.ts         # Error parsing utilities
│   ├── styles/
│   │   ├── globals.css              # Global styles & design tokens
│   │   └── animations.css           # Framer Motion keyframes
│   ├── config/
│   │   ├── api.ts                   # API configuration
│   │   └── theme.ts                 # Theme configuration
│   ├── App.tsx                      # Root component
│   └── main.tsx                     # Entry point
├── public/
│   ├── icons/                       # SVG icons
│   └── logos/
├── tailwind.config.js               # Extended Tailwind theme
├── tsconfig.json                    # TypeScript config with path aliases
├── vite.config.ts                   # Vite bundler config
├── .env.example                     # Environment variables template
├── package.json
└── README.md
```

## 🎨 Design System

### Color Palettes

**Dark Mode** (Black → Purple Gradient)

```css
--color-dark-bg: #0b0e27; /* Background */
--color-dark-accent: #2d1b69; /* Accent background */
--color-dark-primary: #a855f7; /* Purple accent */
--color-dark-secondary: #60a5fa; /* Blue accent */
--color-dark-text-primary: #e5ecf6;
--color-dark-text-secondary: #9fb0c7;
```

**Light Mode** (White → Cyan Gradient)

```css
--color-light-bg: #ffffff; /* Background */
--color-light-accent: #e0f7fa; /* Accent background */
--color-light-primary: #06b6d4; /* Cyan accent */
--color-light-secondary: #2563eb; /* Blue accent */
--color-light-text-primary: #0b1020;
--color-light-text-secondary: #475569;
```

### Typography

| Layer   | Font              | Use Case                   |
| ------- | ----------------- | -------------------------- |
| Display | Space Grotesk     | Page headings, hero text   |
| UI      | Plus Jakarta Sans | Body text, buttons, labels |
| Mono    | IBM Plex Mono     | Serial numbers, codes      |

### Status Colors

```
🟢 Available:      #22C55E (bright) / #16A34A (dark)
🔵 Checked Out:    #3B82F6 (bright) / #1D4ED8 (dark)
🟡 Under Repair:   #F59E0B (bright) / #D97706 (dark)
⚫ Retired:         #6B7280 (bright) / #374151 (dark)
```

### Spacing & Layout

```
xs: 4px,   sm: 8px,    md: 16px,   lg: 24px,   xl: 32px,   2xl: 48px
```

## 🔌 API-Ready Architecture

### Service Layer Pattern

```typescript
// Example: authService.ts
import apiClient from "./apiClient";
import type { ApiResponse, User, LoginRequest } from "@/types";

export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthToken>> {
    return apiClient.post("/auth/login", credentials);
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get("/auth/me");
  },
};
```

### API Client

Located in `src/services/apiClient.ts`:

```typescript
const apiClient = {
  async get<T>(url: string): Promise<ApiResponse<T>> { ... },
  async post<T>(url: string, data: any): Promise<ApiResponse<T>> { ... },
  async put<T>(url: string, data: any): Promise<ApiResponse<T>> { ... },
  async delete<T>(url: string): Promise<ApiResponse<T>> { ... },
};
```

### Backend API Contracts

**Expected Backend Running On:** `http://localhost:5000`

| Service   | Endpoint Prefix | Status   |
| --------- | --------------- | -------- |
| Auth      | `/auth`         | ✅ Ready |
| Equipment | `/equipment`    | ✅ Ready |
| Requests  | `/requests`     | ✅ Ready |
| Admin     | `/admin`        | ✅ Ready |
| Reports   | `/reports`      | ✅ Ready |
| Documents | `/documents`    | ✅ Ready |

See [Backend README](../backend/README.md) for complete endpoint documentation.

## 🔐 Type Safety

### Response Handling

All API responses use discriminated unions for type-safe error handling:

```typescript
import type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "@/types/api";
import { isSuccess, getErrorMessage, getFieldErrors } from "@/types/api";

// Type guards ensure proper error handling
const response = await authService.login(credentials);

if (isSuccess(response)) {
  // TypeScript knows response.data exists
  setUser(response.data);
} else {
  // TypeScript knows response.error exists
  const fieldErrors = getFieldErrors(response);
  updateFormErrors(fieldErrors);
}
```

### Pagination Types

```typescript
import type { PaginationParams, PaginationMeta } from "@/types/api";
import { buildPaginationQuery } from "@/types/api";

// Build query string with type safety
const query = buildPaginationQuery({
  page: 1,
  limit: 25,
  search: "laptop",
});

// Response types include pagination
const response = await equipmentService.getAll(query);
if (isSuccess(response)) {
  console.log(response.pagination.totalPages);
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18.0.0
- npm or yarn
- Backend server running on `http://localhost:5000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start dev server (Vite with hot reload)
npm run dev

# Run type checking
npx tsc --noEmit

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Available Scripts

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview built site
npm run type-check   # TypeScript type checking
npm run lint         # ESLint check (if configured)
npm run format       # Format code with Prettier (if configured)
```

### Environment Configuration

Create `.env` file based on `.env.example`:

```env
# Backend API
VITE_API_URL=http://localhost:5000

# OAuth (optional for design phase)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_APPLE_CLIENT_ID=your-apple-client-id
```

## 🔗 Backend Integration Guide

### 1. Setup Backend First

```bash
cd ../backend
npm install
npm run migrate
npm run seed
npm run dev  # Runs on http://localhost:5000
```

### 2. Connect API Client

Edit `src/config/api.ts` to match backend URL:

```typescript
export const API_CONFIG = {
  baseURL: process.env.VITE_API_URL || "http://localhost:5000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
};
```

### 3. Implement Service Methods

Replace placeholder implementations with actual API calls:

```typescript
// src/services/equipmentService.ts
export const equipmentService = {
  async getAll(query: string) {
    // Actually call backend
    return apiClient.get(`/equipment?${query}`);
  },
};
```

### 4. Connect Stores to Services

Update Zustand store to populate from API:

```typescript
// src/stores/equipmentStore.ts
export const useEquipmentStore = create((set) => ({
  equipment: [],

  async fetchEquipment() {
    const response = await equipmentService.getAll("");
    if (isSuccess(response)) {
      set({ equipment: response.data });
    }
  },
}));
```

### 5. Update Components to Use Data

Replace mock data with store state:

```typescript
// src/pages/DashboardPage.tsx
const equipment = useEquipmentStore(s => s.equipment);

useEffect(() => {
  useEquipmentStore.getState().fetchEquipment();
}, []);

return <>{equipment.map(item => <EquipmentCard key={item.id} {...item} />)}</>;
```

## 🧠 State Management (Zustand)

### Authentication Store

```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}
```

### Equipment Store

```typescript
interface EquipmentStore {
  items: Equipment[];
  totalItems: number;
  currentPage: number;

  fetchEquipment: (page: number, limit: number) => Promise<void>;
  addEquipment: (item: Equipment) => void;
  deleteEquipment: (id: number) => void;
}
```

### UI Store

```typescript
interface UIStore {
  theme: "light" | "dark";
  isModalOpen: boolean;
  notifications: Notification[];

  toggleTheme: () => void;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
  addNotification: (notification: Notification) => void;
}
```

## 🎬 Features & Components

### Completed (Design Phase)

- ✅ Authentication page (login/signup forms, OAuth buttons)
- ✅ Dark/light mode toggle with smooth animations
- ✅ Interactive background (mesh gradients, floating particles)
- ✅ Component library (buttons, inputs, cards, modals)
- ✅ TypeScript type contracts for all services
- ✅ Zustand store structure and patterns
- ✅ Tailwind CSS design system with tokens

### In Development

- 🟠 Equipment list & detail pages
- 🟠 Request creation workflow
- 🟠 Admin dashboard & management panels
- 🟠 Analytics & reporting views

### Planned

- 🔵 Real-time notifications (WebSocket)
- 🔵 QR code scanning for quick item lookup
- 🔵 Offline capability (service workers)
- 🔵 Mobile app (React Native or Expo)

## 📦 Key Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.x",
  "zustand": "^4.4.0",
  "@tanstack/react-query": "^5.x",
  "framer-motion": "^10.x",
  "typescript": "^5.x",
  "tailwindcss": "^3.x",
  "vite": "^5.x"
}
```

## 🧪 Testing

```bash
# Run tests (when test suite is set up)
npm run test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📚 Additional Resources

- [Backend Documentation](../backend/README.md)
- [Design System Reference](#-design-system)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## ✅ Development Checklist

- [ ] Backend running on http://localhost:5000
- [ ] `.env` file configured with `VITE_API_URL`
- [ ] `npm install` dependencies
- [ ] `npm run dev` starts dev server
- [ ] API contracts in `src/types/` filled out
- [ ] Service methods integrated with backend
- [ ] Zustand stores connected to services
- [ ] Components updated to use real data
- [ ] Type checking passes: `npx tsc --noEmit`
      VITE_APPLE_CLIENT_ID=your-apple-client-id

````

## 📋 Component Inventory

### UI Primitives

- ✅ `Button` — Primary, secondary, ghost, destructive, oauth variants
- ✅ `Input` — Text, email, password with icons and validation states
- ✅ `ThemeToggle` — Moon/sun icon toggle (fixed positioning)
- (Planned: Badge, Select, Dropdown, Modal, Table, Toast, Skeleton)

### Auth Components

- ✅ `InteractiveBackground` — Animated mesh gradients + particles
- ✅ `LoginForm` — Email/password form with forgot password link
- ✅ `SignupForm` — Full registration form with password confirmation
- ✅ `OAuthButtons` — Google & Apple sign-in buttons
- ✅ `AuthPage` — Main layout combining all components

### Services (Placeholder)

- `AuthService` — API contracts (no implementation)
- (Planned: InventoryService, RequestService, AdminService)

### State Management (Zustand)

- `useAuthStore` — Auth state + UI flags (no logic)
- (Planned: useInventoryStore, useRequestStore, useAnalyticsStore)

## 🔐 No Functionality Implemented

⚠️ **This is a design-phase build. All components are UI-ready but:**

- ❌ No form submission logic
- ❌ No API calls or data fetching
- ❌ No authentication flows
- ❌ No routing (single page currently)
- ❌ No theme persistence
- ❌ No error handling
- ❌ No loading states (UI structure only)

**Next Phase**: Wire services to Node.js/TypeScript backend APIs

## 🎯 Next Steps

1. **Tailwind CSS Integration**: Await user's custom Tailwind codes
2. **Backend API Setup**: Node.js/TS server with auth endpoints
3. **Service Implementation**: Fill in `authService.ts` with real API calls
4. **Routing Setup**: Implement React Router for multi-page navigation
5. **Dashboard Layouts**: Build user & admin dashboard containers
6. **Feature Modules**: Inventory catalog, request management, analytics
7. **Testing Setup**: Unit tests, E2E tests with Playwright

## 📚 Design References

- **Inspiration**: Linear, Stripe, Vercel, Notion dashboards
- **Typography**: Plus Jakarta Sans (UI), Space Grotesk (headings)
- **Dark Mode**: Black-purple gradients with subtle glows
- **Light Mode**: White-cyan gradients with soft depth
- **Micro-interactions**: Smooth 120–180ms transitions, Framer Motion

## 📝 Component Usage Example

```tsx
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// No logic implemented yet — just UI

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit">Sign in</Button>
    </form>
  );
}
````

## 🔄 State Management Approach

**Zustand** for lightweight, modular state:

- `useAuthStore`: Session + UI state
- `useInventoryStore` (planned): Filters, selected items
- `useRequestStore` (planned): Request queue, history context
- **React Query**: Server-side state (caching, refetch, mutations)

## 🎨 Responsive Breakpoints

| Device  | Width       | Layout      | Notes                    |
| ------- | ----------- | ----------- | ------------------------ |
| Mobile  | < 768px     | Full-stack  | Card overlays background |
| Tablet  | 768–1024px  | Stack       | 70vw centered card       |
| Desktop | 1024–1440px | Split 50/50 | Side-by-side             |
| Wide    | 1440px+     | Split 60/40 | Maximum readability      |

## 📞 API Connection Checklist (When Ready)

- [ ] Implement `authService.ts` with actual HTTP client
- [ ] Add request interceptors for token refresh
- [ ] Handle error response mappings
- [ ] Add request/response logging
- [ ] Implement retry logic for failed requests
- [ ] Add API timeout configuration
- [ ] Set up token storage (secure, persistent)
- [ ] Implement OAuth redirect handlers
- [ ] Add request rate limiting
- [ ] Set up error boundary for API failures

## 📄 License

Private project for school infrastructure

---

**Built with 💜 using React + TypeScript + Tailwind CSS + Framer Motion**

**Current Status**: Design & Architecture Complete | API-Ready | Awaiting Backend Integration
