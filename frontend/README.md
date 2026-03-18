# School Inventory Management System - Frontend

**Status**: 🎨 **Design & Architecture Phase** (API-Ready, No Functionality Implemented)

A premium, non-traditional SaaS-quality frontend for a school inventory management system. Built with React, TypeScript, Tailwind CSS, and Framer Motion.

## 🎯 Project Vision

Two user roles with completely different experiences:

- **Students/Staff**: Browse equipment, request items, track borrowing history
- **Administrators**: Manage inventory, approve requests, view analytics, scan QR codes

## 🏗️ Architecture Overview

### Current Phase

✅ Design system tokens & color palettes  
✅ Component library structure (UI primitives)  
✅ Authentication page UI (Login/Signup)  
✅ API service contracts (TypeScript DTOs)  
✅ Zustand store placeholders  
✅ Framer Motion animation structure  
⏳ **No functional implementation yet** — Ready to connect to Node.js/TS backend

### Project Structure

```
school-inventory-frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   └── auth/                  # Auth-specific components
│   │       ├── ThemeToggle.tsx
│   │       ├── InteractiveBackground.tsx
│   │       ├── LoginForm.tsx
│   │       ├── SignupForm.tsx
│   │       └── OAuthButtons.tsx
│   ├── features/                  # Feature modules (placeholder structure)
│   │   ├── inventory/
│   │   ├── requests/
│   │   ├── admin/
│   │   └── analytics/
│   ├── pages/
│   │   └── AuthPage.tsx          # Main auth layout
│   ├── stores/                    # Zustand state management
│   │   └── authStore.ts
│   ├── services/                  # API clients & contracts
│   │   └── authService.ts
│   ├── hooks/
│   │   └── useTheme.ts
│   ├── types/
│   │   └── auth.ts
│   ├── styles/
│   │   └── globals.css            # Design tokens & Tailwind setup
│   └── main.tsx                   # Entry point
├── tailwind.config.js             # Extended theme config
├── tsconfig.json                  # Path aliases
├── vite.config.ts                 # Build configuration
├── package.json
├── index.html
└── README.md
```

## 🎨 Design System

### Color Palettes

#### Dark Mode (Black → Purple Gradient)

- Primary: `#0B0E27` → `#2D1B69`
- Accent: `#A855F7` (Purple) / `#60A5FA` (Blue)
- Text: `#E5ECF6` (primary), `#9FB0C7` (secondary)

#### Light Mode (White → Cyan Gradient)

- Primary: `#FFFFFF` → `#E0F7FA`
- Accent: `#06B6D4` (Cyan) / `#2563EB` (Blue)
- Text: `#0B1020` (primary), `#475569` (secondary)

### Typography

- **Display**: Space Grotesk (headings)
- **UI**: Plus Jakarta Sans (default)
- **Monospace**: IBM Plex Mono (code/serial numbers)

### Status Workflow Colors

```
🟢 Available:      #22C55E / #4ADE80
🔵 Checked Out:    #3B82F6 / #60A5FA
🟡 Under Repair:   #F59E0B / #FBBF24
⚫ Retired:         #475569 / #94A3B8
```

## 🔌 API-Ready Architecture

### Authentication Service Contract

```typescript
// Placeholder: awaiting backend implementation
interface IAuthService {
  loginWithEmail(credentials: LoginRequest): Promise<AuthResponse>;
  signupWithEmail(credentials: SignupRequest): Promise<AuthResponse>;
  initiateGoogleOAuth(): void;
  initiateAppleOAuth(): void;
  handleOAuthCallback(params: OAuthCallbackRequest): Promise<AuthResponse>;
  requestPasswordReset(request: PasswordResetRequest): Promise<AuthResponse>;
  resetPassword(request: PasswordResetConfirm): Promise<AuthResponse>;
  logout(): Promise<AuthResponse>;
  refreshSession(): Promise<AuthResponse>;
  getCurrentUser(): Promise<AuthResponse>;
}
```

### Expected Backend Endpoints

- `POST /auth/login`
- `POST /auth/signup`
- `GET /auth/google/authorize`
- `GET /auth/apple/authorize`
- `POST /auth/oauth/callback`
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`

## 🎬 Interactive Features (Design-Only)

### Login/Signup Page

- 🌗 Dark/Light mode toggle with smooth 400–600ms transitions
- 🎪 Animated gradient background (mesh gradients, floating shapes, particle system)
- 💳 Premium card-based form with glass-morphism effect
- 🔐 Email/password with password visibility toggle
- 🎨 Google & Apple OAuth buttons (design-ready, no logic)
- ⌚ Form validation states (error, success indicators)

### Animations (Framer Motion Structure)

```
- @keyframes meshPulse: 10-12s hue-shift oscillation
- @keyframes float: 15-20s sine-wave motion (shapes)
- @keyframes glow: 3s pulse intensity cycle
- @keyframes drift: 30-40s particle traversal
```

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.1",
    "@tanstack/react-query": "^5.0.0",
    "framer-motion": "^10.16.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "tailwindcss": "^3.3.0",
    "vite": "^5.0.0"
  }
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18.0.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_APPLE_CLIENT_ID=your-apple-client-id
```

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
```

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
