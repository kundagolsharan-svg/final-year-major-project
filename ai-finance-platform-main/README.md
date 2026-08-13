# AI Finance Platform

A cutting-edge financial management platform powered by artificial intelligence, built with Next.js and modern web technologies. Manage accounts, track budgets, forecast spending, and get intelligent financial insights all in one place.

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

### 💰 Account Management
- Multi-account support with account aggregation
- Bank account connections via secure third-party integrations
- Real-time balance tracking
- Account type classification

### 📊 Financial Analytics
- Comprehensive transaction tracking and categorization
- AI-powered merchant categorization using Google Gemini
- Spending analytics and insights
- Customizable financial reports
- PDF report generation

### 🎯 Budget & Goals
- Create and manage budgets across categories
- Track budget performance with visual indicators
- Set and monitor financial goals
- Recurring transaction support
- Automated recurring transaction processing

### 🤖 AI-Powered Features
- **Chat Assistant**: Conversational AI for financial advice and queries
- **Behavior Analyzer**: AI analysis of spending patterns and financial behavior
- **Forecasting**: Intelligent spending predictions and trend analysis
- **Smart Categorization**: Automatic transaction categorization using machine learning

### 🔔 Alerts & Notifications
- Customizable financial alerts
- Budget overspending notifications
- Email notifications for important events
- Real-time alert dashboard

### 📱 User Experience
- Responsive design for desktop, tablet, and mobile
- Dark mode support with theme toggle
- Intuitive dashboard with key metrics
- Smooth animations and transitions with Framer Motion
- Real-time data updates

### 🔐 Security
- User authentication with Clerk
- Rate limiting and DDoS protection with Arcjet
- Secure API endpoints
- Data encryption and privacy controls
- Tax category tracking for financial compliance

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.0
- **UI Library**: React 19 RC
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **AI Integration**: Google Generative AI (Gemini)
- **Task Queue**: Inngest
- **Email**: React Email
- **PDF Generation**: jsPDF

### Security & Services
- **Rate Limiting**: Arcjet
- **API Security**: Jose (JWT handling)
- **CSV Parsing**: PapaParse
- **PDF Processing**: pdf-parse
- **Environment**: dotenv

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Google Generative AI API key
- Clerk authentication credentials

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
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following in `.env.local`:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/finance_platform
   DIRECT_URL=postgresql://user:password@localhost:5432/finance_platform
   
   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
   
   # AI Integration
   GEMINI_API_KEY=your_gemini_api_key
   
   # Email
   RESEND_API_KEY=your_resend_key
   
   # Security
   ARCJET_KEY=your_arcjet_key
   
   # Inngest
   INNGEST_EVENT_KEY=your_inngest_key
   INNGEST_SIGNING_KEY=your_inngest_signing_key
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
├── actions/              # Server actions and API handlers
├── app/                  # Next.js app directory
│   ├── (auth)/          # Authentication pages
│   ├── (main)/          # Main application routes
│   ├── api/             # API endpoints
│   └── lib/             # Shared libraries
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── premium-dashboard/  # Premium features
├── lib/                 # Utility functions
│   ├── ai-cache.js     # AI response caching
│   ├── gemini.js       # Google Gemini integration
│   ├── ollama.js       # Local AI model support
│   └── prisma.js       # Database utilities
├── prisma/             # Database schema and migrations
├── public/             # Static assets
├── hooks/              # Custom React hooks
├── emails/             # Email templates
└── scripts/            # Utility scripts
```

## 🎨 Key Components

### Dashboard
- Overview of financial metrics
- Recent transactions
- Budget status
- Financial goals progress
- Alert summary

### Accounts
- Account management and aggregation
- Bank account connections
- Balance tracking
- Account-specific transaction view

### Transactions
- Transaction upload and import
- AI-powered categorization
- Receipt storage
- Recurring transaction handling
- Transaction search and filtering

### Budget & Goals
- Budget creation and monitoring
- Goal progress tracking
- Visual indicators and charts
- Budget vs. actual analysis

### Chat
- AI-powered financial chatbot
- Real-time responses
- Conversation history
- Financial advice and insights

### Reports
- Custom report generation
- PDF export functionality
- Data visualization
- Tax category reporting

## 🔄 Background Jobs

The platform uses Inngest for handling background tasks:
- Recurring transaction processing
- Email notifications
- Data aggregation jobs
- Analytics updates

## 📊 Database Schema

Key models include:
- **User**: User accounts and profiles
- **Account**: Financial accounts (checking, savings, etc.)
- **Transaction**: Individual transactions with categorization
- **Budget**: User budgets with targets
- **FinancialGoal**: User financial goals and milestones
- **BankConnection**: Third-party bank integrations
- **MerchantCategoryCache**: AI-learned merchant categorizations

## 🔐 Security Features

- **Authentication**: Secure user authentication via Clerk
- **Rate Limiting**: DDoS protection with Arcjet
- **API Security**: JWT-based API authentication
- **Data Privacy**: User data isolation and encryption
- **Account Security**: Session management and timeouts

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚦 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and ML-based insights
- [ ] Multi-currency support
- [ ] Investment portfolio tracking
- [ ] Bill pay integration
- [ ] Social features and sharing
- [ ] API for third-party integrations
- [ ] Advanced tax reporting

## 💬 Support

For support, email support@example.com or open an issue on GitHub.

## 👥 Team

This project is maintained by the Finance Platform Team.

---

**Made with ❤️ using Next.js and AI**
