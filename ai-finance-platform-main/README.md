# Sampat - AI Finance Platform

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-F05032?style=flat-square&logo=framer)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

A professional, cutting-edge financial management platform powered by artificial intelligence. Built with Next.js, Clerk Auth, and Gemini AI. Manage accounts, track budgets, forecast spending, handle subscriptions, and get intelligent financial insights all in one beautifully animated dashboard.

---

## 🗺️ From Planning to Deployment

This project evolved through a structured roadmap, transforming from a basic tracker into a premium, professional-grade Fintech product:

### Phase 1: Core Functionality & Planning
* **Architecture Setup**: Configured Next.js 15, Prisma with PostgreSQL, and Clerk for authentication.
* **Database Design**: Established schemas for Users, Accounts, Transactions, Budgets, and Bank Connections.
* **AI Integration**: Integrated Google Gemini AI to auto-categorize expenses and provide financial insights.

### Phase 2: Premium UI/UX & Aesthetics
* **Glassmorphism & Micro-animations**: Implemented premium UI using Tailwind CSS and Framer Motion. 
* **Dynamic Dashboards**: Built highly interactive, depth-aware cards that smoothly expand into immersive, full-screen detailed views using `layoutId` animations.
* **Visual Data**: Integrated `Recharts` for stunning, responsive area charts, pie charts, and bar charts with custom gradients and tooltips.
* **Milestone Gamification**: Added beautiful animated badges to celebrate user achievements (e.g., "Budget Master", "7-Day Streak").

### Phase 3: Advanced Features & Refinement
* **Subscription Management**: Developed a dedicated dashboard to automatically track recurring expenses, upcoming bills, and calculate total monthly subscriptions.
* **PDF Statement Parsing**: Built an intelligent PDF bank statement uploader that securely parses complex transactional data on the client-side using `pdf.js` and securely uploads them.
* **Data Integrity**: Implemented SHA-256 cryptographic hashing to perfectly detect and prevent duplicate transactions during bulk uploads.

### Phase 4: Security & Deployment
* **Privacy Controls**: Added "Privacy Mode" to globally obscure sensitive balances.
* **Secure Actions**: Ensured all Next.js Server Actions enforce Clerk authentication and database constraints.
* **Performance**: Utilized Next.js `force-dynamic` caching strategies and Inngest for background task queues.

---

## ✨ Key Features

### 💎 Premium Dashboard Experience
* **Immersive Modals**: Dashboard cards click to smoothly morph into rich, full-screen data visualizations using Framer Motion.
* **Gamification**: Earn interactive 3D milestone badges for healthy financial habits.
* **Privacy Toggle**: Blur sensitive net worth and account balances with a single click.

### 💰 Automated Account Management
* **PDF Uploader**: Drag and drop bank statements to automatically extract, categorize, and sync transactions.
* **Duplicate Detection**: Advanced cryptographic hashing prevents identical transactions from being logged twice.
* **Multi-account Aggregation**: View combined net worth across checking, savings, and credit accounts.

### 🤖 Gemini AI-Powered Insights
* **Smart Categorization**: Transactions are automatically mapped to standard tax categories using Gemini.
* **Behavior Analyzer**: Get personalized feedback on spending habits.
* **Conversational AI**: Ask questions about your finances and get data-backed advice.

### 🔄 Subscriptions & Recurring Bills
* Automatically detect and isolate recurring charges.
* Visual calendar of upcoming bills.
* Monthly cost breakdown to identify unused subscriptions.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 15.0 (App Router), React 19 RC, Tailwind CSS, Framer Motion, Radix UI, Recharts, Lucide Icons.
* **Backend**: Node.js, Next.js Server Actions, Inngest (Background Jobs).
* **Database**: PostgreSQL (via Supabase/Neon), Prisma ORM.
* **Auth & Security**: Clerk Auth, Arcjet (Rate Limiting).
* **AI**: Google Generative AI (Gemini).
* **PDF Processing**: pdf.js (Client-side secure parsing).

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ and npm
* PostgreSQL database URI
* Google Gemini API key
* Clerk Authentication credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-finance-platform.git
   cd ai-finance-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   
   *Required Keys in `.env.local`:*
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/finance
   DIRECT_URL=postgresql://user:password@localhost:5432/finance
   
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   
   GEMINI_API_KEY=your_gemini_key
   ```

4. **Initialize the Database**
   Push the Prisma schema to your PostgreSQL database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

---

## 📁 Project Structure

```text
├── actions/                  # Next.js Server Actions (Database & API logic)
├── app/                      # App Router (Pages, Layouts, API Routes)
│   ├── (auth)/               # Clerk sign-in / sign-up routes
│   ├── (main)/               # Authenticated application routes
│   │   ├── dashboard/        # Main overview and charts
│   │   ├── account/          # Specific account details & tables
│   │   ├── subscriptions/    # Recurring bills tracking
│   │   └── transaction/      # Add/edit individual transactions
├── components/               # Global React components
│   ├── ui/                   # Shadcn / Radix primitives
│   └── premium-dashboard/    # 3D Badges, Modals, etc.
├── lib/                      # Utilities (Prisma client, AI setup, formatting)
├── prisma/                   # Database schema models
└── public/                   # Static images and icons
```

---

## 🛡️ Security

* **Authentication**: All sensitive routes and server actions are protected by Clerk Middleware.
* **Data Isolation**: Database queries strictly filter by the authenticated user's Clerk ID.
* **Client-side Processing**: PDF bank statements are parsed entirely in the user's browser; only raw text data is sent to the server for AI categorization.

## 📝 License
This project is licensed under the MIT License.
