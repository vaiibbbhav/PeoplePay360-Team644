# PeoplePay360 — Next-Gen Enterprise HR & Payroll Platform

> **Odoo Hackathon 2026** — Built by **Team 644**  
> *A high-precision, modular HRMS and statutory payroll engine built with TypeScript, Node.js, React, Neon Serverless PostgreSQL, and OpenAFIS Biometrics.*

---

https://github.com/user-attachments/assets/f723c9df-2e0e-4fc5-b2c6-32bfebe96bc2


## 🌟 Executive Summary

**PeoplePay360** is a full-lifecycle HR and Payroll management platform designed for modern enterprises. It integrates operational HR administration (employee profiles, contracts, working schedules, attendance, and leave management) with a sequence-driven salary rule computation engine and 2-step payrun execution wizard.

Key differentiators:
- **Strict Separation of Concerns**: Follows a strict 4-layer backend architecture (`routes` ➔ `controllers` ➔ `services` ➔ `repositories` ➔ `db`).
- **Live Rule Engine**: Computes dynamic salary rules (Fixed, Percentage, and Algebraic Formulas) with strict dependency ordering.
- **Biometric Security**: Native OpenAFIS fingerprint template matching with AES-256-GCM encryption at rest.
- **Editorial Design System**: High-contrast, executive monochrome styling with Playfair Display serifs, IBM Plex Sans body, and `#6A3FA0` violet accents.
- **Server-Side RBAC**: Granular permission matrix enforcing role separation across Employees, HR Managers, HR Payroll Users, HR Payroll Managers, and Admins.

---

## 🏛️ System Architecture & Tech Stack

```
                                  ┌────────────────────────┐
                                  │      React 18 + Vite   │
                                  │  Tailwind CSS v4 + TS  │
                                  │  TanStack Query v5     │
                                  └───────────┬────────────┘
                                              │ HTTP + JWT (HttpOnly Cookie)
                                              ▼
                                  ┌────────────────────────┐
                                  │  Express Modular Monolith│
                                  │   (TypeScript / Node)  │
                                  │  Auth / HR / Pay / Doc │
                                  └─────┬────────────┬─────┘
                                        │            │
            Drizzle ORM (SQL Parameters)│            │ gRPC / REST
                                        ▼            ▼
                   ┌───────────────────────┐   ┌───────────────────────────┐
                   │ Neon Serverless PG    │   │ OpenAFIS Biometric Service│
                   │ (Connection Pooling)  │   │ Java 17 + AES-256-GCM     │
                   └───────────────────────┘   └───────────────────────────┘
```

| Layer | Technologies | Key Highlights |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS v4, Lucide React, TanStack Query | Feature-based modular architecture, shadcn UI components, colocated queries, 0 shadows/gradients, responsive editorial aesthetics |
| **Backend** | Node.js, Express, TypeScript, Zod, Drizzle ORM | 4-layer modular monolith, centralized error handling (`AppError`), parameterized SQL, transactional batching |
| **Database** | Neon Serverless PostgreSQL | Automated schema migrations, strict foreign-key integrity, UUID primary keys, parameterized query construction |
| **Biometrics** | Java 17, Spring Boot, OpenAFIS, JCA/AES-GCM | Hardware fingerprint template extraction, cryptographic key versioning, zero plaintext biometric storage |
| **Auth & RBAC** | JWT (7-day session), bcrypt, HttpOnly Cookies | Role-based authorization: `Employee`, `HR Manager`, `HR Payroll User`, `HR Payroll Manager`, `Admin` |

---

## 📂 Repository Structure

```
.
├── backend/                  # Node.js + Express + Drizzle ORM API server
│   ├── src/
│   │   ├── db/               # PostgreSQL schema definitions & connection pool
│   │   ├── modules/          # Domain modules (auth, hr, contracts, attendance, timeoff, payroll, etc.)
│   │   │   ├── hr/           # Employees, departments, job positions
│   │   │   ├── contracts/    # Contracts, wage structures, active status validation
│   │   │   ├── attendance/   # Time clock, biometric logs, lateness/overtime
│   │   │   ├── timeoff/      # Leave requests, allocations, balance deductions
│   │   │   ├── payroll/      # Rule engine, payrun wizard, payslips, PDF generation
│   │   │   ├── documents/    # Company policies & compliance acceptance logging
│   │   │   └── users/        # User accounts & RBAC management
│   │   └── shared/           # Permissions, error classes, formatters, async wrapper
│   ├── migrations/           # Versioned SQL migrations (001, 002, 003)
│   └── tests/                # Unit test suites (Rule engine, App routing)
│
├── frontend/                 # React + Vite client application
│   ├── src/
│   │   ├── api/              # Axios instance with centralized auth handling
│   │   ├── components/       # Global UI primitives (Select, SearchInput, Modals, Layouts)
│   │   ├── features/         # Feature-driven modules (employees, payroll, attendance, etc.)
│   │   │   ├── employees/    # Employee directory, Kanban, detail tabs
│   │   │   ├── contracts/    # Contract management & status toggles
│   │   │   ├── payroll/      # Payrun wizard, payslip registry, salary structures
│   │   │   ├── attendance/   # Biometric terminal, live clock-in, log records
│   │   │   └── timeoff/      # Leave balance cards, request modal, approval actions
│   │   └── lib/              # Formatters (currency, dates, periods)
│   └── index.html
│
└── fingerprint-service/      # OpenAFIS biometric template service (Java)
```

---

## ⚡ Core Workflows

### 1. End-to-End Payroll Execution (Payrun Wizard)
1. **Structure & Rules**: Define Salary Structures composed of sequenced Salary Rules (Basic, House Rent Allowance, Provident Fund, Professional Tax, TDS).
2. **Two-Step Wizard**:
   - *Step 1*: Select Salary Structure and payroll period dates.
   - *Step 2*: Filter and select eligible employees with active contracts. System validates contract validity and pre-screens warnings.
3. **Computation & Review**: Calculates gross wages, prorated worked days, deductions, and net payouts.
4. **Validation & Disbursement**: Transitions payrun from `computed` ➔ `validated` ➔ `paid`, automatically cascading statuses to child payslips.
5. **PDF & Audit Delivery**: Instant individual payslip generation with printable PDF view.

### 2. Time Off & Attendance Lifecycle
1. **Working Schedule**: Configures shift patterns (Monday–Friday 09:00–17:00) with automatic weekly hour tallies.
2. **Attendance Tracking**: Records check-ins via web interface or the Biometric Terminal. Evaluates lateness against schedule start time.
3. **Leave Allocations**: Grants time-off days per policy.
4. **Leave Approval & Consumption**: Approved requests atomically deduct from remaining balances inside an ACID transaction.

### 3. Biometric Fingerprint Matching
1. **Enrollment**: High-resolution fingerprint image is converted to an OpenAFIS minutiae template, encrypted with AES-256-GCM, and stored in Neon DB.
2. **Terminal Scan**: Live scan is matched against registered encrypted templates in memory with dynamic score thresholds, triggering instant attendance punch.

---

## 👥 Role-Based Access Control (RBAC)

| Role | Permissions & Operational Scope |
| :--- | :--- |
| **Employee** | View own profile, personal attendance history, leave balances; clock-in/out; submit time-off requests; view own payslips. |
| **HR Manager** | Full management of Employees, Contracts, Working Schedules, and Attendance; approve/refuse time-off requests. |
| **HR Payroll User** | All HR Manager capabilities + create, compute, and review Payruns and Payslips; read-only access to Salary Structures. |
| **HR Payroll Manager** | Full access to Payruns, Payslips, Salary Structures, and Salary Rules; configure statutory formula rules. |
| **Admin** | Full system access, user management, role assignments, audit logs, and policy administration. |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **pnpm**: `v9.x` or higher (`npm install -g pnpm`)
- **Java JDK**: 17+ (required only if running the OpenAFIS biometric service)
- **PostgreSQL**: Neon DB connection string or local PostgreSQL 15+

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vaiibbbhav/PeoplePay360-Team644.git
   cd PeoplePay360-Team644
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   pnpm install
   cp .env.example .env
   # Ensure DATABASE_URL and JWT_SECRET are set in .env
   pnpm dev
   ```
   *Backend server runs on `http://localhost:5001` with API mounted at `/api`.*

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   pnpm install
   pnpm dev
   ```
   *Frontend application runs on `http://localhost:5173`.*

4. **Biometric Microservice (Optional)**:
   ```bash
   cd ../fingerprint-service
   mvn clean spring-boot:run
   ```
   *Biometric service runs on `http://localhost:8080`.*

---

## 🧪 Testing & Verification

Run the automated test suites:

```bash
# Backend unit tests (Vitest)
cd backend && pnpm test

# Backend TypeScript build verification
cd backend && pnpm run build

# Frontend build & type check
cd frontend && pnpm run build
```

---

## 📄 License & Team

Developed for the **Odoo Hackathon 2026** by **Team 644**.  
All rights reserved.
