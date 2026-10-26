# Expense Voucher Management System (ExpenseVMS) 

A modern, production-grade Full Stack Web Application designed for end-to-end expense voucher creation, multi-level review workflows, finance disbursement, analytics, and security audit logging.


---

##  Key Features

### 1. Role-Based Access Control (RBAC) & Authentication
- **Multi-Role Support**: 4 predefined roles — **Employee**, **Manager**, **Finance**, and **Admin**.
- **Secure Authentication**: JSON Web Tokens (JWT) stored with secure HTTP bearer headers and bcrypt password hashing (12 rounds).
- **One-Click Demo Login**: Instant login buttons for all roles directly on the login page for effortless testing and evaluation.

### 2. Voucher Lifecycle & Management
- **Voucher Creation**:
  - Auto-generated alphanumeric voucher numbers (`VCH-<timestamp>-<rand>`).
  - Form validation with expense date, description, currency (INR, USD, EUR, GBP, AED, SGD), and payment methods.
  - Multi-category classification: *Travel, Meals & Entertainment, Office Supplies, Software & Subscriptions, Training & Development, Marketing, Equipment, Medical, Accommodation, Other*.
  - **Receipt Upload**: Drag-and-drop or file selector supporting images (PNG, JPG, WEBP) and PDFs up to 5MB.
- **Workflow State Engine**:
  - `Draft` ➔ `Pending` (Submitted) ➔ `Approved` / `Rejected` ➔ `Paid`.
  - Employees can save drafts, edit, delete, or submit for approval.

### 3.  Multi-Level Approvals (Managers & Admin)
- Dedicated approvals queue for managers to review vouchers.
- Ability to approve with comments or reject with mandatory rejection reasons.
- Real-time status badges and timeline history.

### 4.  Finance & Payment Disbursement
- Filter and process approved vouchers for payment.
- Record payment transaction references (`TXN-...`), payment dates, and payment methods.
- Prevents double-processing or tampering.

### 5. Interactive Analytics & Visual Reports
- **KPI Summary Cards**: Total Spend, Pending Approvals, Total Approved, and Total Processed.
- **Visual Charts (Recharts)**:
  - Monthly expense trend area chart.
  - Voucher status distribution donut chart.
  - Category-wise expense breakdown horizontal bar chart.

### 6. User Management & Audit Logging (Admin)
- Admin can create, edit, deactivate, or delete user accounts and assign roles.
- Complete audit trail tracking user logins, voucher submissions, status transitions, user modifications, and IP addresses.

---

##  Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Tailwind/Vanilla CSS Design System, Lucide React, Recharts, React Hot Toast, Axios |
| **Backend** | Node.js, Express.js, Sequelize ORM, SQLite / Relational DB, Multer (file storage), JWT, BcryptJS |
| **Aesthetics** | Modern dark-mode palette, glassmorphism, responsive flex/grid layouts, micro-animations, accessible UI components |

---

## Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Clone & Setup Backend
```bash
cd "backend"
npm install
node server.js
```
*Backend runs on `http://localhost:5000` (SQLite database `database.sqlite` and seed data are initialized automatically).*

### 2. Setup Frontend
```bash
cd "../frontend"
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with automated API proxying to port 5000.*

---

##  Default Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@company.com` | `Admin@123` |
| **Finance** | `finance@company.com` | `Finance@123` |
| **Manager** | `manager@company.com` | `Manager@123` |
| **Employee** | `employee@company.com` | `Employee@123` |

>  **Tip**: On the login page, you can simply click any of the **Quick Demo Login** buttons to sign in immediately!

---

##  API Reference

### Auth Endpoints
- `POST /api/auth/register` — Register a new user account.
- `POST /api/auth/login` — Authenticate and obtain JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `PUT /api/auth/profile` — Update user name or department.
- `PUT /api/auth/password` — Change account password.

### Voucher Endpoints
- `GET /api/vouchers` — List vouchers (filtered by role, status, category, date, search).
- `POST /api/vouchers` — Create a new voucher (with optional multipart receipt upload).
- `GET /api/vouchers/:id` — Retrieve voucher details with approval timeline.
- `PUT /api/vouchers/:id` — Update draft voucher.
- `DELETE /api/vouchers/:id` — Delete draft voucher.
- `PUT /api/vouchers/:id/submit` — Submit voucher for manager review.
- `PUT /api/vouchers/:id/approve` — Approve voucher (*Manager / Admin*).
- `PUT /api/vouchers/:id/reject` — Reject voucher with reason (*Manager / Admin*).
- `PUT /api/vouchers/:id/pay` — Mark voucher as paid (*Finance / Admin*).
- `GET /api/vouchers/analytics` — Fetch aggregated metrics and breakdown data.

### Admin Endpoints
- `GET /api/users` — List all users in system.
- `POST /api/users` — Create user account.
- `PUT /api/users/:id` — Update user details or active status.
- `DELETE /api/users/:id` — Delete user account.
- `GET /api/users/audit-logs` — Paginated audit log history.
