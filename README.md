# 4 Sales Agency

**AI-Powered B2B Lead Generation & Qualification Platform**

4 Sales Agency is a global, industry-agnostic SaaS platform that helps businesses find and qualify leads through AI-powered emails and phone calls. Each client uploads their product knowledge to create a "Virtual LLM" that can have convincing sales conversations.

## 🌐 Live URL

**Production:** [4.agency](https://4.agency) *(deployment pending)*

**Contact:** sales@4.agency

## 🎯 Core Concept

1. **Client** (any business, anywhere) signs up
2. **Campaign** created for a specific product/service
3. **Product Knowledge** uploaded (sales materials, call recordings, transcripts)
4. **Virtual LLM** trained on that knowledge
5. **AI finds leads** matching the Ideal Customer Profile (ICP)
6. **AI qualifies leads** through personalized emails and phone calls
7. **Client receives warm leads** ready to close

## ✨ Features Implemented

### Backend (100% Complete)

- ✅ **Database Schema** (16 tables)
  - Users & authentication
  - Clients (multi-tenant)
  - Campaigns with ICP definition
  - Leads with confidence scoring
  - Product knowledge storage
  - Knowledge documents (PDFs, transcripts, recordings)
  - Campaign LLM configuration
  - Activities & communication logs
  - Email templates
  - Voice call sessions & scripts
  - Scraped data & recruitment intelligence
  - Audit logs & error tracking

- ✅ **Complete tRPC API**
  - Client management (CRUD)
  - Campaign management (CRUD + status updates)
  - Lead management (CRUD + status tracking)
  - Product knowledge upload & management
  - Activities tracking
  - Communication logs
  - Voice call sessions
  - Analytics endpoints
  - Audit logging

### Frontend (Core Complete)

- ✅ **Home Page** with feature overview
- ✅ **Clients List** with create functionality
- ✅ **Authentication** via Manus OAuth
- ⏳ **Campaign Detail** (placeholder)
- ⏳ **Lead Management** (placeholder)
- ⏳ **Product Knowledge Upload** (pending)

### AI Integrations (Planned)

- ⏳ **OpenAI** - Email generation & Virtual LLM
- ⏳ **Twilio** - SMS and phone number management
- ⏳ **VAPI** - AI voice calling
- ⏳ **ElevenLabs** - Voice synthesis
- ⏳ **AssemblyAI** - Call transcription
- ⏳ **Web Scraper** - Lead enrichment

## 🏗️ Architecture

**Multi-Tenant Structure:**
```
Client → Campaign → Leads
         ↓
    Product Knowledge (Virtual LLM)
         ↓
    AI Email Generation
    AI Voice Calls
         ↓
    Qualified Leads
```

**Tech Stack:**
- **Frontend:** React 19, Tailwind 4, shadcn/ui
- **Backend:** Express 4, tRPC 11
- **Database:** TiDB (MySQL-compatible)
- **Auth:** Manus OAuth
- **Storage:** S3 for files
- **AI:** OpenAI, VAPI, ElevenLabs, AssemblyAI

## 📁 Project Structure

```
4SalesAgency/
├── client/                 # React frontend
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # Reusable UI components
│       └── lib/trpc.ts    # tRPC client
├── server/                # Express backend
│   ├── db.ts             # Database query helpers
│   ├── routers.ts        # tRPC API routes
│   └── _core/            # Framework plumbing
├── drizzle/              # Database schema & migrations
│   └── schema.ts         # All table definitions
└── todo.md               # Development tracker
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Database connection (provided by Manus platform)

### Installation

```bash
# Clone the repository
git clone https://github.com/jamescowan-design/4SalesAgency.git
cd 4SalesAgency

# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

All environment variables are automatically injected by the Manus platform:

- `DATABASE_URL` - TiDB connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_TITLE` - "4 Sales Agency"
- `VITE_APP_LOGO` - Logo URL
- OAuth credentials (auto-configured)

## 📊 Database Schema

### Core Tables

- **users** - User accounts with role-based access
- **clients** - Client companies (multi-tenant)
- **campaigns** - Lead generation campaigns with ICP
- **leads** - Potential customers with confidence scores

### Virtual LLM Tables

- **productKnowledge** - Structured product information
- **knowledgeDocuments** - Uploaded files (PDFs, recordings, transcripts)
- **campaignLlmConfig** - AI model configuration per campaign

### Communication Tables

- **activities** - All interactions (emails, calls, tasks)
- **communicationLogs** - Detailed communication history
- **emailTemplates** - AI-generated email templates
- **voiceCallSessions** - Call recordings & transcripts
- **callScripts** - AI-generated call scripts

### Intelligence Tables

- **scrapedData** - Web-scraped company information
- **recruitmentIntelligence** - Hiring signals detection

### System Tables

- **auditLogs** - All user actions
- **errorLogs** - Error tracking

## 🎨 Design System

- **Color Scheme:** Light theme with primary accent
- **Typography:** System font stack
- **Components:** shadcn/ui (Radix UI + Tailwind)
- **Icons:** Lucide React
- **Layout:** Responsive, mobile-first

## 🔐 Security

- OAuth 2.0 authentication via Manus
- Row-level security (planned)
- Audit logging for all actions
- Encrypted database connections
- Secure file storage in S3

## 📈 Roadmap

See [todo.md](./todo.md) for detailed development tracker.

### Phase 1: Foundation ✅
- Database schema
- Authentication
- Core multi-tenant features

### Phase 2: Virtual LLM System ⏳
- Product knowledge upload
- Document processing
- LLM configuration

### Phase 3: Lead Generation ⏳
- Web scraper
- Lead enrichment
- Confidence scoring

### Phase 4: AI Outreach ⏳
- Email generation
- Voice calling
- SMS campaigns

### Phase 5: CRM & Analytics ⏳
- Lead dashboard
- Activity tracking
- Performance metrics

## 🤝 Contributing

This is a private project. For questions or support, contact sales@4.agency

## 📝 License

Proprietary - All rights reserved

## 🙋 Support

For technical support or feature requests:
- Email: sales@4.agency
- Website: [4.agency](https://4.agency)

---

**Built with ❤️ by the 4 Sales Agency team**
