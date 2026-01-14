# 🎓 BCA Association MMAMC - Complete Platform

> A modern, AI-powered web platform for BCA Association of MMAMC College, Nepal. Built with React, TypeScript, Supabase, and cutting-edge technologies.

![BCA Association](https://github.com/user-attachments/assets/fe22f9bd-68fa-4205-8693-924e576d46ce)

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://mmamc-bca.vercel.app)
[![License](https://img.shields.io/badge/license-Proprietary-blue)]()
[![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red)]()

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Third-Party Integrations](#-third-party-integrations)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Admin Features](#-admin-features)
- [User Features](#-user-features)
- [Deployment](#-deployment)
- [Tools & Utilities](#-tools--utilities)

---

## 🌟 Overview

The BCA Association platform is a comprehensive solution for managing student activities, events, resources, and community engagement. It bridges the gap between students, alumni, and administration through a modern, responsive, and AI-powered interface.

### Key Highlights
- 🤖 **AI-Powered Study Assistant** with voice & image support
- 📜 **Digital Certificate System** with QR verification
- 🎯 **Event Management** with QR check-in & payment verification
- 👥 **Community Forum** with upvoting & achievements
- 📱 **PWA Support** - Install as mobile/desktop app
- 🔐 **Role-Based Access Control** (Admin, Moderator, Member)
- 🎨 **Modern UI/UX** with smooth animations
- 🌐 **Multi-Browser Compatible** with cache management

---

## ✨ Features

### 🎓 For Students & Members

#### **Academic Resources**
- 📚 **Resource Library**: Study materials, past papers, project documentation
- 🔍 **Smart Search**: Find resources by subject, semester, or topic
- 📥 **Easy Downloads**: Direct PDF downloads with preview
- 📊 **Resource Analytics**: Track most downloaded materials

#### **AI Study Assistant**
- 💬 **24/7 Chat Support**: Get instant help with curriculum questions
- 🎤 **Voice Interaction**: Ask questions using voice input
- 🖼️ **Image Generation**: Create visual aids for learning
- 🧠 **Context-Aware**: Understands BCA curriculum and coding concepts
- 🎯 **Multi-Model Support**: Access to GPT-4, Claude, Llama, and more
- 👤 **Guest Access**: Try AI assistant without registration (limited)

#### **Community & Networking**
- 💬 **Forum System**: StackOverflow-style Q&A platform
- ⬆️ **Upvoting System**: Best answers rise to the top
- 🏆 **Achievements**: Earn badges for participation
- 👥 **Alumni Network**: Connect with graduates for mentorship
- 📢 **Announcements**: Stay updated with college news
- 📝 **Notices**: Important academic notifications

#### **Events & Activities**
- 📅 **Event Calendar**: Browse upcoming events
- 🎟️ **Easy Registration**: Register for events with payment upload
- 📸 **Event Gallery**: View photos from past events
- 📧 **Email Reminders**: Get notified 24h before events
- ✅ **QR Tickets**: Digital tickets for event entry
- 💬 **Feedback System**: Share your event experience

#### **Personal Dashboard**
- 📊 **Activity Tracking**: Monitor your participation
- 🏅 **XP & Levels**: Gamified progression system
- 📜 **My Certificates**: Access all your certificates
- 🔔 **Notifications**: Real-time updates
- ⚙️ **Profile Settings**: Customize your profile
- 🎯 **Achievement Progress**: Track your badges

### 🛠️ For Administrators

#### **User Management**
- 👥 **Member Registry**: View and manage all users
- 🔐 **Role Assignment**: Assign Admin/Moderator roles
- 🎓 **Alumni Status**: Mark users as alumni
- 🚫 **Ban System**: Temporary or permanent user bans
- 📊 **User Analytics**: Track user growth and engagement
- ➕ **Create Users**: Add new members directly

#### **Event Management**
- ➕ **Create Events**: Rich event creation with images
- 📝 **Event Details**: Manage descriptions, dates, locations
- 💰 **Payment Verification**: Review and approve payments
- 📸 **Gallery Management**: Upload event photos
- 📊 **Attendance Tracking**: QR scanner for check-ins
- 📧 **Automated Reminders**: Email notifications to attendees

#### **Certificate System**
- 🎨 **Template Management**: Multiple certificate designs
- ✍️ **Signature Control**: Manage authorized signatories
- 🔄 **Bulk Generation**: Create certificates for all attendees
- 🔍 **QR Verification**: Each certificate has unique QR code
- 📥 **Download Options**: PDF export for certificates
- 📊 **Certificate Analytics**: Track issued certificates

#### **Content Management**
- 📚 **Resources**: Upload and manage study materials
- 📢 **Announcements**: Broadcast important messages
- 📝 **Notices**: Post academic notices
- ❓ **FAQs**: Manage frequently asked questions
- 🌐 **Website Settings**: Customize site name, logo, colors
- 📧 **Contact Management**: View and respond to inquiries

#### **AI Configuration**
- 🤖 **Provider Selection**: Choose between OpenRouter, Bytez, or Default
- 🔑 **API Key Management**: Securely store API keys
- 🎨 **Model Selection**: Pick from 100+ AI models
- 📝 **Custom Prompts**: Customize AI behavior
- 🎤 **Voice Settings**: Configure speech-to-text/text-to-speech
- 🖼️ **Image Generation**: Enable/disable image creation

#### **Analytics & Insights**
- 📊 **Dashboard Overview**: Real-time statistics
- 📈 **User Growth**: Track member registrations
- 🎯 **Event Engagement**: Monitor event participation
- 📚 **Resource Usage**: See most popular materials
- 💬 **Forum Activity**: Track Q&A engagement
- 🏆 **Achievement Stats**: Monitor gamification metrics

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | Core UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Fast build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Accessible component library |
| **Framer Motion** | Smooth animations |
| **React Router** | Client-side routing |
| **TanStack Query** | Server state management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Relational database |
| **Supabase Auth** | Authentication & authorization |
| **Supabase Storage** | File storage (images, PDFs) |
| **Supabase Realtime** | Live updates |
| **Row Level Security** | Database security |

### Edge Functions (Deno)
| Function | Purpose |
|----------|---------|
| `ai-chat` | Secure AI chat proxy for authenticated users |
| `ai-chat-guest` | AI chat for guest users (rate-limited) |
| `ai-voice` | Speech-to-text & text-to-speech processing |
| `send-event-reminder` | Automated email reminders (cron job) |
| `create-user` | Admin function to create new users |
| `setup-admin` | Utility to promote users to admin |
| `cleanup-notifications` | Auto-delete old notifications (cron job) |

### UI Components & Libraries
- **Radix UI**: Accessible primitives
- **Lucide Icons**: Beautiful icon set
- **React Icons**: Additional icon library
- **QRCode.react**: QR code generation
- **html5-qrcode**: QR code scanning
- **html2canvas**: Certificate image generation
- **React Markdown**: Markdown rendering
- **React Syntax Highlighter**: Code highlighting
- **Recharts**: Data visualization
- **date-fns**: Date manipulation
- **Sonner**: Toast notifications

### PWA & Performance
- **Vite PWA Plugin**: Progressive Web App support
- **Workbox**: Service worker caching strategies
- **Cache Management**: Smart caching for optimal performance

---

## 🔌 Third-Party Integrations

### AI & Machine Learning
| Service | Purpose | Configuration |
|---------|---------|---------------|
| **OpenRouter** | Access to 100+ AI models (GPT-4, Claude, Llama) | Admin Panel > AI Settings |
| **Bytez** | High-performance AI models & voice processing | Admin Panel > AI Settings |
| **Lovable AI** | Default fallback AI provider | Environment variable |

### Email Services
| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Resend** | Transactional emails (event reminders, notifications) | Supabase Secrets |

### Deployment & Hosting
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting & deployment |
| **Supabase** | Backend, database, auth, storage |

### Analytics & Monitoring
- Built-in analytics dashboard
- Real-time user activity tracking
- Event engagement metrics

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Supabase Account** ([Sign up](https://supabase.com))
- **Git** ([Download](https://git-scm.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bca-association.git
   cd bca-association
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

4. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Push database migrations
   supabase db push
   
   # Deploy edge functions
   supabase functions deploy
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080)

---

## ⚙️ Configuration

### Database Setup

The database schema is managed via Supabase Migrations located in `supabase/migrations/`.

**Key Tables:**
- `profiles` - User profiles with XP, levels, and roles
- `events` - Event management
- `event_registrations` - Event attendee tracking
- `certificates` - Digital certificates
- `resources` - Study materials
- `forum_posts` - Community forum
- `achievements` - Gamification system
- `notifications` - Real-time notifications
- `announcements` - Site-wide announcements
- `notices` - Academic notices
- `faqs` - Frequently asked questions
- `website_settings` - Site configuration
- `user_roles` - Role-based access control

**To apply migrations:**
```bash
supabase db push
```

### Storage Buckets

The following storage buckets are created automatically:
- `avatars` - User profile pictures
- `certificates` - Certificate PDFs and signature images
- `events` - Event banners and gallery photos
- `resources` - Study material PDFs
- `ai-generated-images` - AI-generated images

### Environment Variables

#### Frontend (.env.local)
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

#### Backend (Supabase Dashboard > Project Settings > Edge Functions Secrets)
```env
# Email Service
RESEND_API_KEY=your-resend-api-key

# AI Services (Optional - Configure in Admin Panel)
LOVABLE_API_KEY=your-lovable-api-key

# Database
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### AI Configuration

1. Navigate to **Admin Dashboard > AI Settings**
2. Choose your AI provider:
   - **Default (Lovable)**: No configuration needed
   - **OpenRouter**: Enter API key, select model
   - **Bytez**: Enter API key for voice features
3. Customize system prompt (optional)
4. Save settings

**Supported Models:**
- GPT-4, GPT-3.5 (OpenAI)
- Claude 3 (Anthropic)
- Llama 3, Llama 2 (Meta)
- Mistral, Mixtral (Mistral AI)
- Gemini (Google)
- And 100+ more via OpenRouter

---

## 👨‍💼 Admin Features

### Getting Admin Access

**First-time setup:**
```bash
# Deploy the setup-admin function
supabase functions deploy setup-admin

# Call the function with your email
curl -X POST https://your-project.supabase.co/functions/v1/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### Admin Panel Overview

Access: `/admin`

**Dashboard Sections:**
- 📊 **Analytics**: User stats, event metrics, resource usage
- 👥 **Members**: User management, roles, bans
- 📅 **Events**: Create, edit, manage events
- 📜 **Certificates**: Generate and manage certificates
- 📚 **Resources**: Upload study materials
- 📢 **Announcements**: Broadcast messages
- 📝 **Notices**: Post academic notices
- ❓ **FAQs**: Manage Q&A
- 🤖 **AI Settings**: Configure AI providers
- 🌐 **Website Settings**: Customize site appearance
- 📧 **Contacts**: View inquiries
- 🔍 **QR Scanner**: Check-in attendees

### User Ban System

**Features:**
- Temporary bans (1 day, 7 days, 30 days, custom)
- Permanent bans
- Ban reasons (admin notes)
- Auto-unban when time expires
- Visual indicators in member list

**How to ban a user:**
1. Go to Admin > Members
2. Click "Ban" button on user
3. Select duration and add reason
4. Confirm

**Error messages:**
- Banned user: "Your account has been banned. Please contact administration."
- Wrong password: "Invalid email or password. Please try again."

---

## 👤 User Features

### Registration & Authentication
- Email/password authentication
- Profile completion
- Avatar upload
- Batch and semester selection

### Dashboard
- Personal stats (XP, level, achievements)
- Recent activities
- Upcoming events
- Quick access to resources

### Gamification
- **XP System**: Earn points for activities
- **Levels**: Progress through levels
- **Achievements**: Unlock badges
- **Leaderboard**: Compete with peers

### Notifications
- Real-time notifications
- Email notifications
- Push notifications (PWA)
- Notification preferences

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

Output will be in `dist/` folder.

### Deploy to Vercel

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import your Git repository

2. **Configure Environment Variables**
   Add these in Vercel project settings:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY
   VITE_SUPABASE_PROJECT_ID
   ```

3. **Deploy**
   - Vercel will auto-deploy on push to main branch
   - Preview deployments for pull requests

### Deploy Edge Functions
```bash
supabase functions deploy --no-verify-jwt
```

### Post-Deployment Checklist
- ✅ Environment variables set
- ✅ Database migrations applied
- ✅ Storage buckets created
- ✅ Edge functions deployed
- ✅ Email service configured
- ✅ AI provider configured (optional)
- ✅ Admin user created
- ✅ Website settings configured

---

## 🛠️ Tools & Utilities

### Cache Fixer Tool
**Location**: Footer > Tools > Cache Fixer  
**URL**: `/clear-cache.html`

**Purpose**: Fix browser caching issues, especially in Firefox

**Features:**
- One-click cache clearing
- Clears service worker cache
- Clears browser cache
- Clears local storage
- Auto-redirects to home

**When to use:**
- Site not loading properly
- Old data showing
- After major updates
- Firefox compatibility issues

### QR Scanner
**Location**: Admin Panel > QR Scanner

**Purpose**: Check-in attendees at events

**Features:**
- Scan QR codes from certificates/tickets
- Instant verification
- Attendance tracking
- Works on mobile devices

---

## 📱 Progressive Web App (PWA)

### Features
- **Install on Device**: Add to home screen
- **Offline Support**: Basic functionality without internet
- **Push Notifications**: Real-time updates
- **Fast Loading**: Cached resources
- **App-like Experience**: Full-screen mode

### Installation
1. Visit the site on mobile/desktop
2. Look for "Install" prompt
3. Click "Install" or "Add to Home Screen"
4. App icon will appear on your device

### Cache Strategy
- **Auth requests**: Never cached (NetworkOnly)
- **API requests**: Network first, cache fallback (5 min cache)
- **Storage/Images**: Cache first (7-30 days)
- **Static assets**: Cache first (immutable)

---

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control**: Admin, Moderator, Member roles
- **JWT Authentication**: Secure token-based auth
- **HTTPS Only**: Encrypted connections
- **CORS Protection**: Controlled cross-origin requests
- **Input Validation**: Zod schema validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based protection

---

## 📊 Database Schema

### Core Tables
- `profiles` - User information
- `user_roles` - Role assignments
- `events` - Event details
- `event_registrations` - Event signups
- `certificates` - Digital certificates
- `certificate_signatures` - Authorized signatories
- `resources` - Study materials
- `forum_posts` - Community posts
- `forum_replies` - Post replies
- `forum_votes` - Upvote/downvote system
- `achievements` - Achievement definitions
- `user_achievements` - User progress
- `notifications` - User notifications
- `announcements` - Site announcements
- `notices` - Academic notices
- `faqs` - FAQ entries
- `contacts` - Contact form submissions
- `website_settings` - Site configuration
- `ai_settings` - AI provider configuration

---

## 🤝 Contributing

This is a proprietary project for BCA Association MMAMC. For contributions or suggestions, please contact the development team.

---

## 📄 License

Proprietary software of BCA Association MMAMC. All rights reserved.

---

## 👨‍💻 Developer

**Made with ❤️ by [Saif Ali](https://www.instagram.com/me_saifali/)**

- GitHub: [@mesaifali](https://github.com/mesaifali)
- Instagram: [@me_saifali](https://www.instagram.com/me_saifali/)

---

## 📞 Support

For issues, questions, or feature requests:
- Visit: [Contact Page](https://mmamc-bca.vercel.app/contact)
- Email: bca@mmamc.edu.np
- Use the Cache Fixer tool for loading issues

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Video conferencing integration
- [ ] Assignment submission system
- [ ] Grade management
- [ ] Attendance tracking
- [ ] Library management
- [ ] Hostel management

---

**⭐ Star this repository if you find it helpful!**
