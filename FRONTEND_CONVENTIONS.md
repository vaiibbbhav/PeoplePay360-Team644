# Frontend Architecture & Conventions
**PeoplePay360 React + Vite + TypeScript + Tailwind CSS Frontend**

---

## 1. Feature-Driven (Domain-Driven) Architecture

Code is grouped by business capability under `src/features/` rather than technical layer. Global infrastructure is decoupled from domain logic.

### Directory Structure
```
src/
├── api/                  # Global Axios client & TanStack Query configuration
│   ├── apiClient.ts      # Axios instance (baseURL, credentials, 401 refresh queue)
│   └── queryClient.ts    # Global QueryClient instance
├── components/           # Global reusable UI primitives & layout shells
│   ├── ui/               # Generic UI primitives (Button, Input, Card, Dialog)
│   ├── AppLayout.tsx     # Global layout shell (Navigation, Header, Theme Toggle)
│   └── ThemeToggle.tsx   # Light/Dark mode switcher
├── features/             # Business domain modules
│   ├── auth/             # Authentication & session
│   ├── employees/        # Employee master records
│   ├── contracts/        # Contract history & terms
│   ├── attendance/       # Punches & exception reviews
│   ├── timeoff/          # Leave requests & allocations
│   ├── payroll/          # Payruns, payslip computation, & PDF
│   └── dashboard/        # Operational KPI dashboards
├── hooks/                # Global UI/state behavior hooks (no network calls)
├── lib/                  # Generic helpers, class merging (cn)
├── pages/                # Public or root pages (LandingPage.tsx)
├── App.tsx               # Root component (Providers & Router configuration)
└── main.tsx              # Application entry point
```

---

## 2. Anatomy of a Feature Folder

```
src/features/<feature-name>/
├── components/       # UI elements used within this feature
├── pages/            # Routable page screens
└── queries/          # Colocated API calls + TanStack Query hooks + Type declarations
```

### Key Principles:
1. **Colocated Queries & Types:**
   - Both the network fetch function and the TanStack Query hook (`useQuery` / `useMutation`) live in the **same file** inside `queries/`.
   - **No separate `types.ts` file.** TypeScript types representing request payloads, query filters, and response models are defined directly inside the query file.
   - Do **NOT** create a separate `services/` or `api/` file per feature.
2. **No Barrel Files (`index.ts`):**
   - Direct imports are standard and encouraged:
     ```typescript
     // ✅ Standard direct imports:
     import { LoginForm } from '@/features/auth/components/LoginForm';
     import { useCurrentUser } from '@/features/auth/queries/useAuth';
     ```
3. **Always Use `type` Over `interface`:**
   - Enforce `type` across all component props, query response types, and state models.

---

## 3. Colocated Query Pattern Example

```typescript
// src/features/attendance/queries/useAttendance.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';

// 1. Types defined in the query file
export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: string;
  status: 'Present' | 'Late' | 'Absent' | 'Half-Day';
  exceptionNote: string | null;
  isManualEdit: boolean;
};

export type CheckInInput = {
  employeeId: string;
  checkIn?: string;
};

// 2. Private fetcher functions
const fetchAttendanceList = async (employeeId?: string): Promise<AttendanceRecord[]> => {
  const { data } = await apiClient.get('/attendance', { params: { employeeId } });
  return data;
};

const postCheckIn = async (input: CheckInInput): Promise<AttendanceRecord> => {
  const { data } = await apiClient.post('/attendance/check-in', input);
  return data;
};

// 3. Exported React Query hooks
export const useAttendanceList = (employeeId?: string) => {
  return useQuery({
    queryKey: ['attendance', employeeId],
    queryFn: () => fetchAttendanceList(employeeId),
  });
};

export const useCheckInMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};
```

---

## 4. Design System & UI Integration

- **Aesthetic:** Minimal editorial black-and-white with single violet accent (`#6A3FA0`).
- **Typography:**
  - Headlines (`h1`, `h2`, `h3`, wordmark): `Playfair Display`, serif.
  - Body, navigation, buttons, and labels: `IBM Plex Sans`, sans-serif.
- **Elevation:** Flat surfaces with 1px hairline borders (`var(--line)`). No heavy drop shadows or gradient backgrounds.
- **Three Required UI States:** Every list and detail component must handle:
  1. **Loading** (clean monochrome skeleton or spinner)
  2. **Error** (clear diagnostic callout)
  3. **Empty** (thoughtfully presented empty state)
