# JobHunt CRM — Personal Job Application Tracking Dashboard

A modern, responsive, SaaS-style **Personal Job Search Management System & CRM** built specifically for **Adarsh Vinothan** (Full-Stack Web Developer, 3+ years experience, Dubai UAE, Visit Visa).

Built with **Next.js (App Router)**, **React**, **Tailwind CSS**, **Lucide Icons**, and **XLSX**.

---

## 🚀 Key Highlights & Architecture

### 1. Dual Data Sources
- **Google Sheets Daily Automation Sync**:
  - Connect via published Google Sheet CSV feed URL or Google Sheets API v4.
  - One-click `Sync Now` or automated scheduled synchronization (Hourly, Every 6h, Daily).
  - Comprehensive sync audit logs with duplicate tracking.
- **Excel Tracker Import & Export**:
  - Drag-and-drop `.xlsx` files with column auto-detection and dry-run preview.
  - Pre-seeded with the authoritative reference tracker: `Updated_Job_Tracker_2026-09-25.xlsx` (42 live job opportunities).
  - Export filtered or selected applications directly to formatted `.xlsx`.

### 2. Strict Data Integrity Rule
- **External Job Data** (Title, Company, Location, Salary, Match Score, Source, Job URL) updates from incoming syncs.
- **Personal Application Data** (Application Stage, Applied Date, Follow-up Dates, Recruiter Contacts, Personal Notes, Priority) is **100% PRESERVED** and never overwritten by incoming automation.

### 3. Application Pipeline & Views
- **Dashboard**: High-level metrics, 7-step conversion funnel, follow-up alerts, match score distribution, and quick sync widget.
- **All Jobs Table**: Search, multi-filtering (stage, priority, work mode, score), column visibility picker, density toggle (comfortable/compact), batch selection, and export.
- **Kanban Pipeline**: 12 customizable stages with drag-and-drop column transitions and instant stage history logging.
- **Follow-up Command Center**: Categorized into Overdue, Today, Upcoming, and Completed with 1-click status toggles.
- **Analytics & Funnel**: Conversion rates, profile match distribution (calibrated to Adarsh's full-stack stack), work mode breakdown, and discovery timeline.
- **Profile & Resume Reference**: Pre-populated with Adarsh's 3+ years experience, X-Space Real Estate & Crystal Code Labs history, MCA/BCA degrees, and Google Drive resume links.
- **Settings**: Stage color and label customizer, appearance switcher (Dark, Light, System), and database re-seeder.

---

## 🔐 Credentials & Environment Setup
### Environment Variables (`.env.local`)
```env
AUTH_EMAIL=
AUTH_PASSWORD=
SESSION_SECRET=
NEXT_PUBLIC_APP_NAME=""
NEXT_PUBLIC_USER_NAME=""
```

---

## 🏃 Running the Application

### 1. Start Server
The production server is currently running at:
```bash
http://localhost:3000
```

To run development mode:
```bash
npm run dev
```

To run production mode:
```bash
npm run build
npm start
```

### 2. Run Test Suite
An automated end-to-end test suite validates all 13 core APIs, stage transitions, personal field preservation, and Excel exports:
```bash
node scripts/test-crm.js
```
