# SAMPAT - Advanced AI Financial Platform Documentation

Welcome to the comprehensive, deeply detailed documentation for **SAMPAT**. This document is designed for developers, system architects, and stakeholders to gain a thorough understanding of the platform's features, underlying technology, data flow, and architecture.

---

## 🏗️ 1. Architectural Overview

SAMPAT is built as a **Serverless Full-Stack Next.js 15 Application**. It leverages the Next.js App Router paradigm, strictly separating Server Components from Client Components to optimize load times and SEO while maintaining rich interactivity.

### Key Architectural Decisions:
- **Server Actions over API Routes**: Instead of traditional REST endpoints (`/api/*`), SAMPAT heavily utilizes Next.js Server Actions (found in the `/actions` directory). This ensures type safety between client and server, eliminates network waterfalls, and heavily reduces boilerplate.
- **Edge-Ready Security**: Authentication (Clerk) and Rate Limiting (Arcjet) are executed at the edge middleware level before requests ever hit the Node.js server.
- **AI as a Core Utility, not an Add-on**: Google's Gemini AI isn't just a chatbot; it's deeply integrated into the data ingestion pipeline (auto-categorization) and analytics layer (behavior analysis).

---

## 🛠️ 2. Comprehensive Technology Stack

### Frontend Ecosystem
- **Framework**: **Next.js 15.0** (App Router)
- **UI & React**: **React 19 RC**, ensuring compatibility with concurrent rendering and action states.
- **Styling Engine**: **Tailwind CSS 3.4**, specifically utilizing `tailwind-merge` and `clsx` for dynamic class resolution.
- **Micro-Interactions**: **Framer Motion 12** powers the `layoutId` morphing, modal expansions, and the 3D animated milestone celebration badges.
- **Component Primitives**: **Radix UI** ensures that all interactive elements (dropdowns, dialogs, selects, tooltips) are accessible (WAI-ARIA compliant) and keyboard-navigable.
- **Data Visualization**: **Recharts 2.14** handles rendering complex financial data (Area charts for cash flow, Pie charts for spending categories).

### Backend & Data Processing
- **Event-Driven Jobs**: **Inngest 4.13** is used to handle asynchronous, long-running background tasks (e.g., background data syncing, batch transaction processing) without timing out Vercel Serverless functions.
- **Data Validation**: **Zod 3.23** ensures strict schema validation on all incoming Server Actions and API payloads.
- **Document Parsing**: 
  - `pdf-parse`: Extracts raw text from bank statements on the client side.
  - `papaparse`: Handles CSV conversions and parsing.
- **Cryptography**: Node.js native `crypto` (SHA-256) is used to generate unique hashes for transactions to prevent duplicate imports.

### Database & Security
- **Database**: **PostgreSQL** (optimally hosted on serverless platforms like Neon or Supabase).
- **ORM**: **Prisma 6.0** acts as the data access layer, featuring Prisma Client caching and connection pooling.
- **Authentication**: **Clerk** (`@clerk/nextjs`).
- **Bot/DDoS Protection**: **Arcjet** (`@arcjet/next`) limits API abuse and bot traffic.

### Third-Party Services
- **AI Intelligence**: **Google Generative AI** (Gemini 1.5 Pro/Flash).
- **Transactional Emails**: **Resend** combined with `@react-email/components` for rendering responsive, styled email templates (e.g., Welcome emails, Budget Alerts).

---

## ✨ 3. Detailed Feature Breakdown

### A. Intelligent Data Ingestion & Transaction Management
The core of any finance app is getting data in seamlessly.
1. **Smart PDF Statement Uploads**: Users can drag and drop bank PDFs. The platform uses `pdf.js` to extract text locally (ensuring raw sensitive bank PDFs are never sent over the wire), then sends the raw text to the server.
2. **AI Auto-Categorization**: The server feeds the raw transaction strings to Gemini AI, which intelligently normalizes the merchant name and assigns standardized tax categories (e.g., "UBER *EATS" -> "Uber Eats", Category: "Food & Dining").
3. **Cryptographic Deduplication**: Every imported transaction is hashed (using `date + amount + description`). If the user accidentally uploads the same statement twice, the database strictly ignores duplicates.

### B. Dynamic Dashboard & Gamification
1. **Morphing UI**: Dashboard cards display high-level metrics. Clicking a card smoothly expands it into a detailed full-screen view (e.g., clicking "Monthly Spend" expands into a detailed category breakdown pie chart).
2. **Milestone Celebrations**: When a user hits a savings goal or stays under budget, the UI triggers a `MilestoneCelebration` component—a visually rich, animated 3D badge with confetti particles, encouraging positive financial behavior.
3. **Privacy Mode**: A global toggle utilizing React Context (`PrivacyProvider`) that automatically applies CSS blurs to all monetary values (balances, net worth, chart axes) across the entire application for safe viewing in public spaces.
4. **Currency Selector**: Global state management to switch display currencies dynamically.

### C. Advanced Financial Analytics
1. **Behavior Analyzer**: The `/actions/behavior-analyzer.js` script fetches 3 months of historical data, passes it to Gemini AI with strict formatting instructions, and returns a JSON payload detailing:
   - "Spending Personalities" (e.g., "The Impulse Shopper")
   - High-risk categories.
   - Actionable, personalized advice on where to cut back.
2. **Cash Flow Forecasting**: By analyzing historical recurring transactions, the platform generates predictive line charts mapping out the user's expected bank balance 30, 60, and 90 days into the future.

### D. Subscriptions & Recurring Bills Auto-Detection
Instead of manual entry, the platform detects transactions that occur on a regular cadence (same amount, same merchant, ~30 days apart). 
- It aggregates these into the **Subscriptions Dashboard**, providing a visual calendar of upcoming bills and calculating total fixed monthly burn rates.

### E. Financial Goals & Budgeting
1. **Dynamic Budget Tracking**: Users set monthly budgets. The platform continuously monitors spend against this limit, showing beautiful progress bars that transition from green to yellow to red as the limit approaches.
2. **Savings Goals**: Users can define specific goals (e.g., "New Car"). The system allows users to allocate specific transactions towards this goal, tracking progress over time.

### F. Smart Alerts & Notifications
Through the integration of Resend and Inngest, the platform triggers automated emails:
1. **Budget Overruns**: If an imported transaction pushes the user over 80% of their monthly budget, an alert is dispatched.
2. **Anomaly Detection**: If a transaction is >300% of the user's average historical transaction size, it is flagged as a potential anomaly or fraud, triggering a UI alert and an email warning.

### G. Conversational AI Financial Advisor
A persistent, floating chatbot available on all pages. 
- It has strict access to the user's `transactions`, `budgets`, and `goals` data (via a secure context window). 
- Users can ask: *"How much did I spend on Uber this month vs last month?"* and get accurate, data-backed answers immediately.

### H. Security & System Administration
- **System Logs**: In the Settings panel, users can view an immutable audit trail of their account activity, explicitly tracking login and logout timestamps to ensure account security.
- **Data Export & Wipe**: Full GDPR/CCPA compliance tools allowing users to export their entire transaction history to JSON or trigger a "Danger Zone" permanent wipe of all their financial data.
- **AI Cache Control**: AI responses are aggressively cached for speed and to reduce API costs. Users can manually invalidate this cache via the Settings to force fresh AI calculations.

---

## 🗄️ 4. Database Schema Flow

The Prisma schema is designed for relational integrity and cascading deletes:
- **`User`**: Core entity (tied to Clerk `clerkUserId`).
  - **`Account`** (1-to-M): Checking, Savings, Credit Cards.
    - **`Transaction`** (1-to-M): Individual line items. Ties to an Account and User.
  - **`Budget`** (1-to-1): Monthly limit.
  - **`FinancialGoal`** (1-to-M): Target amounts and deadlines.
  - **`SystemLog`** (1-to-M): Audit trail for Login/Logout events.
  - **`MerchantCategoryCache`** (1-to-M): Learns from previous AI categorization to skip future API calls for known merchants.

---

## 🔐 5. Authorization & Data Flow
1. User requests a page `/dashboard`.
2. Next.js Middleware checks Clerk Session Token.
3. If valid, Arcjet validates the IP for rate limits.
4. Server Component calls `getUserSettings()` via `lib/checkUser.js`.
5. Prisma fetches data **strictly scoped** using `where: { userId: user.id }`.
6. Data is passed to Client Components for rendering via Recharts and Framer Motion.

---

# SAMPAT - AI Finance Platform Documentation

Welcome to the comprehensive documentation for **SAMPAT**, a professional, cutting-edge financial management platform powered by artificial intelligence.

This document serves as an in-depth guide for developers, contributors, and stakeholders to understand the architecture, technology stack, and features of the project.

---

## 🏗️ 1. Project Overview

SAMPAT is a modern web application designed to help users manage their personal finances intelligently. It goes beyond simple budgeting by integrating AI to categorize expenses, provide personalized financial insights, and offer a conversational assistant for financial queries.

The platform is designed with a premium, glassmorphism-inspired UI, ensuring a delightful user experience with smooth animations and dynamic data visualizations.

### Core Objectives:
1. **Intelligent Automation**: Auto-categorization of transactions and PDF statement parsing.
2. **Comprehensive Tracking**: Aggregate accounts, track budgets, and manage recurring subscriptions.
3. **Data Privacy & Security**: Secure authentication, rate limiting, and a UI privacy toggle.
4. **Actionable Insights**: AI-driven analysis of spending habits and cash flow forecasting.

---

## 🛠️ 2. Technology Stack

SAMPAT is built on a robust, modern JavaScript/TypeScript ecosystem, optimized for performance, SEO, and developer experience.

### Frontend
- **Framework**: [Next.js 15.0](https://nextjs.org/) (App Router)
- **UI Library**: [React 19 RC](https://react.dev/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) for utility-first styling.
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/) for fluid, layout-aware animations.
- **Components**: [Radix UI](https://www.radix-ui.com/) & Shadcn UI primitives for accessible, customizable components.
- **Data Visualization**: [Recharts 2.14](https://recharts.org/) for beautiful, responsive charts.
- **Icons**: [Lucide React](https://lucide.dev/).
- **Forms & Validation**: React Hook Form with Zod schema validation.

### Backend & API
- **API Architecture**: Next.js Server Actions (eliminating the need for separate API routes for most operations).
- **Background Jobs**: [Inngest 4.13](https://www.inngest.com/) for reliable, serverless background tasks and event-driven workflows.
- **AI Integration**: Google Generative AI (Gemini via `@google/generative-ai` & `@ai-sdk/google`) for natural language processing and data categorization.
- **Email Service**: [Resend](https://resend.com/) & React Email for transactional email delivery.

### Database & ORM
- **Database**: PostgreSQL (hosted via Supabase or Neon).
- **ORM**: [Prisma 6.0](https://www.prisma.io/) for type-safe database access and migrations.

### Security & Authentication
- **Authentication**: [Clerk](https://clerk.com/) (`@clerk/nextjs`) for secure, seamless user authentication and session management.
- **Security & Rate Limiting**: [Arcjet](https://arcjet.com/) (`@arcjet/next`) to protect routes and prevent abuse.
- **Data Processing**: `pdf-parse` and `papaparse` for secure, client-side/server-side document processing.

---

## ✨ 3. Detailed Features

### 💎 Premium User Experience
- **Dynamic Dashboards**: Interactive cards that smoothly expand into immersive, full-screen detailed views.
- **Gamification**: Interactive milestone badges awarded for positive financial habits (e.g., maintaining a budget, consistent saving).
- **Privacy Mode**: A global toggle that securely blurs sensitive net worth and account balances across the entire application.
- **Dark/Light Mode**: Full theme support with intelligent system-preference detection.

### 💰 Account & Transaction Management
- **Multi-Account Aggregation**: View combined net worth across checking, savings, and credit accounts in one unified dashboard.
- **Smart PDF Uploads**: Drag and drop bank statements to automatically extract, categorize, and sync transactions without manual entry.
- **Cryptographic Duplicate Detection**: Uses SHA-256 hashing to ensure identical transactions from multiple uploads are never logged twice.
- **System Logs**: Track and monitor user login and logout activities within the settings.

### 🤖 AI-Powered Intelligence (Gemini)
- **Smart Categorization**: Transactions are automatically mapped to standard tax categories using Gemini's natural language understanding.
- **Behavioral Analyzer**: Generates personalized feedback on spending habits and cash flow.
- **Conversational Chatbot**: An integrated AI assistant that can answer questions about the user's specific financial data and provide data-backed advice.

### 🔄 Subscriptions & Recurring Bills
- **Auto-Detection**: Identifies recurring charges and isolates them into a dedicated subscription dashboard.
- **Calendar View**: Visual calendar highlighting upcoming bills and expected outgoing cash flow.
- **Cost Breakdown**: Monthly and yearly projections to help identify and cancel unused subscriptions.

---

## 📁 4. Project Structure

Understanding the repository layout:

```text
ai-finance-platform/
├── actions/                  # Next.js Server Actions (Database queries, AI calls, Email logic)
├── app/                      # Next.js App Router root
│   ├── (auth)/               # Clerk authentication routes (sign-in, sign-up)
│   ├── (main)/               # Authenticated application routes
│   │   ├── dashboard/        # Main overview and charts
│   │   ├── account/          # Specific account details & transaction tables
│   │   ├── subscriptions/    # Recurring bills tracking
│   │   ├── transaction/      # Add/edit individual transactions
│   │   └── settings/         # User preferences, AI cache clearing, and system logs
│   ├── api/                  # API endpoints (e.g., Inngest endpoints, Webhooks)
│   ├── layout.js             # Global Root Layout (Providers, Header)
│   └── page.js               # Landing Page
├── components/               # Reusable React components
│   ├── ui/                   # Shadcn / Radix primitives (Buttons, Inputs, Dialogs)
│   ├── providers/            # React Context Providers (Theme, Currency, Privacy)
│   └── ...                   # Feature-specific components (ChatBot, Header, etc.)
├── emails/                   # React Email templates
├── lib/                      # Utilities, Prisma client initialization, API helpers
├── prisma/                   # Database schema models (schema.prisma)
└── public/                   # Static assets (images, icons)
```

---

## 🚀 5. Quick Start Guide

To get the project running locally:

1. **Install Dependencies**: `npm install`
2. **Environment Variables**: Copy `.env.example` to `.env` and fill in your keys (Database URL, Clerk Keys, Gemini API Key, Resend Key, Arcjet Key).
3. **Database Setup**: 
   - `npx prisma generate`
   - `npx prisma db push`
4. **Start Development Server**: `npm run dev`

---

## 🛡️ 6. Security & Compliance
- **Data Isolation**: All Prisma queries strictly filter by the authenticated user's Clerk ID, ensuring data isolation between users.
- **Middleware Protection**: Clerk Middleware protects all `/dashboard`, `/account`, and related routes from unauthorized access.

---

* End of this document *
