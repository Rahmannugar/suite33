# Suite33 – Business Management Application

Suite33 is a modern, all-in-one business management application designed to help small and medium-sized businesses streamline daily operations. It provides a unified dashboard for managing sales, inventory, payroll, expenditures, staff, and overall business performance.

---

## Features Overview

### Authentication & Authorization

- Supabase Auth for secure account management.
- Role-based access control:
  - **Admin** – Full access to all modules.
  - **Assistant Admin** – Limited admin rights.
  - **Staff** – Access to personal dashboard and read only access.
- Server-protected routes using a secure Supabase session pattern.

---

## Business Core Modules

### **1. Sales Management**

- Create, view, update, and delete sales records.
- Yearly and monthly sales summaries.
- Clean, paginated sales tables.
- CSV and Excel export for reporting.
- Recharts integration for visual insights.
- Gemini AI insights.

---

### **2. Inventory Management**

- Add and manage inventory items.
- Category support for better organization.
- Track stock levels and quantities.
- Quick summary metrics in the dashboard.
- CSV and Excel export.

---

### **3. Staff Management**

- Add staff to the business.
- Assign roles and departments.
- Manage user access and permissions.
- Staff see only what they are authorized to view.

---

### **4. KPI Management(Performance tracking)**

- A dedicated performance-tracking module that allows businesses to measure staff results each month.
- Admins assign KPIs while staff can only view their monthly expectations and performance.
- Provides a simple, structured way to manage goals, track progress, and review past KPI history.

---

### **5. Payroll System**

A complete payroll module with two perspectives:

#### **Admin View**

- Create monthly payroll batches.
- Automatically generate entries for all staff.
- Lock/unlock payroll batches.
- Edit payroll items (amount and payment status).
- Export payroll to CSV/Excel.
- View aggregated payroll analytics in the dashboard.

#### **Staff + Assistant Admin View**

- View personal payslip for the month.
- Cannot access or modify company-wide payroll data.

#### Additional Payroll Features

- Batch locking to prevent further editing.
- Latest payroll batch summary shown on dashboard.
- Secure API ensuring role-appropriate data retrieval.

---

### **5. Expenditure Tracking**

- Create and manage business expenses.
- Category support.
- Monthly and yearly expenditure summaries.
- Visual charts and CSV/Excel export.
- CSV and Excel export for reporting.
- Recharts integration for visual insights.
- Gemini AI insights.

---

### **6. Dashboard & Analytics**

A unified dashboard for smart business insights:

- Sales metrics, expenditure metrics, staff count, and inventory count.
- Bar charts showing monthly performance.
- Profit & Loss (P&L) summary table for the full year.
- Payroll summary card showing:
  - Latest batch status (locked/unlocked)
  - Total paid
  - Total pending
  - Personal payroll for staff/sub-admin

---

### **9. Business Settings**

- Update business name, industry, and location.
- Delete entire business (soft-deletion across all tables).
- Auto sign-out and redirect after deletion.

---

## Tech Stack

### **Frontend**

- Next.js 15
- React 18
- TypeScript
- TailwindCSS
- shadcn/ui
- Recharts
- Zustand v5
- TanStack Query

### **Backend**

- Prisma ORM
- Supabase (PostgreSQL + Auth)

### **Other Libraries**

- ExcelJS (xlsx export)
- PapaParse (CSV export)
- Axios
- uuid
- lucide-react
- EmailJS
- Vercel analytics & speed insights

---

## Project Structure

/app
/dashboard
/api
/components
/lib:
/auth
/hooks
/providers
/stores
/types
/utils

/prisma


---

## Environment Variables

Create `.env`:
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
DATABASE_URL=""
DIRECT_URL=""
NEXT_PUBLIC_SITE_URL=""
NEXT_PUBLIC_EMAILJS_SERVICE_ID=""
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=""
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=""
GEMINI_API_KEY=""
SLACK_SIGNUP_WEBHOOK_URL=""
SLACK_ONBOARDING_ADMIN_WEBHOOK_URL=""
SLACK_ONBOARDING_STAFF_WEBHOOK_URL=""
SLACK_BUSINESS_DELETION_WEBHOOK_URL=""

Ensure the Supabase project is connected to the same Postgres database used by Prisma.

---

## Setup & Installation

### 1. Clone the project

```bash
git clone https://github.com/Rahmannugar/suite33.git
cd suite33
```

### 2. Install dependencies

```bash
npm install
```

### 3. Generate and sync Prisma schema

```bash
   npx prisma generate
   npx prisma db push
```

### 4. Start development server

```bash
   npm run dev
```

App will be available at:

```bash
http://localhost:3000
```

Contributions
Pull requests are welcome. Suite33 can always be improved upon.

### License

MIT License © 2025 Suite33
