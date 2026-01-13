# BCA Association MMAMC - Complete Platform Guide

A comprehensive web platform for BCA Association of MMAMC College, Nepal. Built with React, TypeScript, Supabase, and Tailwind CSS.

![BCA Association](https://github.com/user-attachments/assets/bd064cb4-bc3a-415e-8708-5a1af821dab5)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Certificate System](#certificate-system)
- [AI Assistant](#ai-assistant)
- [Edge Functions](#edge-functions)
- [Deployment](#deployment)

---

## Overview

The BCA Association platform is an all-in-one solution designed to manage student activities, events, and resources. It bridges the gap between students, alumni, and administration through a modern, responsive interface.

**Core Capabilities:**
- **Public Events & Registration**: Seamless browsing and booking for college events.
- **Digital Certificates**: robust system for generating, verifying, and distributing certificates.
- **AI Study Companion**: 24/7 intelligent assistant for curriculum queries and coding help.
- **Member Portal**: Personalized dashboard for tracking participation and resources.
- **Admin Dashboard**: Centralized control for all platform data.

---

## Key Features

### 🎓 Academic & Student Resources
- **Resource Library**: specific study materials, past papers, and project documentation.
- **Forum & Community**: StackOverflow-style Q&A with upvoting and specialized categories.
- **Alumni Network**: Directory of past graduates for networking and mentorship.

### 🏆 Digital Certificate System
- **Auto-Generation**: Create professional certificates for events automatically.
- **Verification**: Unique QR codes on every certificate for instant validity checks.
- **Signature Management**: Admin control over authorized signatories.
- **Multi-Template Support**: Specialized designs for Sports, Coding, and Academic achievements.

### 🤖 AI Study Assistant
- **Context-Aware Chat**: specialized knowledge of the BCA curriculum.
- **Multi-Model Support**: Integrated with OpenRouter/Bytez for access to GPT-4, Claude, and Llama models.
- **Voice & Image**: Supports voice queries and image generation for visual learning.
- **Guest vs. Member Access**: Tiered usage limits to encourage registration.

### 📅 Event Management
- **QR Check-in**: Admin scanner for rapid attendee verification.
- **Payment Processing**: Receipt upload and verification workflow.
- **Feedback Loop**: Automated post-event feedback collection.
- **Reminders**: Automated email notifications 24h before events.

### 🛠️ Administration
- **Role-Based Access**: Granular permissions for Admins, Moderators, and Members.
- **Analytics Dashboard**: Real-time insights on user growth and event engagement.
- **Content Management**: Easy editors for FAQs, Notices, and Announcements.

---

## Tech Stack

| Domain | Technology | Purpose |
|--------|------------|---------|
| **Frontend** | React 18, TypeScript | Core application framework |
| | Vite | Fast build tool and dev server |
| | Tailwind CSS | Utility-first styling |
| | shadcn/ui | Accessible component library |
| | Framer Motion | Smooth UI animations |
| **Backend** | Supabase | Database (PostgreSQL), Auth, Realtime |
| | Deno | Edge Functions runtime |
| | PostgreSQL | Primary relational database |
| **Integrations** | Resend | Transactional emails |
| | OpenRouter/Bytez | AI Model orchestration |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project

### Local Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_REPO_URL>
   cd bca-connect-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   
   # Note: Backend keys like RESEND_API_KEY go in Supabase Dashboard, not here.
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access at `http://localhost:5173`

---

## Configuration

### Database Setup
The database schema is managed via Supabase Migrations.
1. Link your project: `npx supabase link --project-ref <your-ref>`
2. Push migrations: `npx supabase db push`

This will create all necessary tables (`events`, `certificates`, `profiles`, etc.) and Security Policies (RLS).

### Storage Buckets
The system requires the following public buckets:
- `avatars`: User profile pictures.
- `certificates`: Generated certificate images and signatures.
- `events`: Event banners and gallery images.
- `resources`: PDF uploads for study materials.

*Note: These are created automatically by the `20260113000002_create_buckets.sql` migration.*

---

## AI Assistant Configuration

The AI capabilities are "Model Agnostic" allowing you to switch providers via the Admin Panel.

1. **Navigate to**: Admin Dashboard > AI Settings.
2. **Select Provider**:
   - **Default Provider**: A reliable, no-configuration baseline model (Gemini Flash).
   - **OpenRouter**: Use your own API key to access 100+ models (Llama 3, Mistral, etc.).
   - **Bytez**: Specialized provider for high-performance models.
3. **Custom Prompt**: You can edit the "System Prompt" to change how the AI behaves (e.g., "Act as a strict exam proctor" vs "Act as a helpful peer").

---

## Edge Functions

We use Supabase Edge Functions (Deno) for secure backend logic.

| Function | Description |
|----------|-------------|
| `send-event-reminder` | Cron job that emails attendees 24h before an event. |
| `ai-chat` | Secure proxy for AI requests (protected by RLS). |
| `create-user` | Allows admins to create new users directly. |
| `setup-admin` | Utility to promote a user to Super Admin. |

**To deploy functions:**
```bash
npx supabase functions deploy --no-verify-jwt
```

---

## Deployment

### Production Build
To create an optimized production build:
```bash
npm run build
```
The output will be in the `dist` folder, ready for deployment on Vercel, Netlify, or similar platforms.

### Environment Checklist
Ensure these are set in your production environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

And in Supabase Project Settings (Edge Function Secrets):
- `RESEND_API_KEY` (For emails)
- `SUPABASE_SERVICE_ROLE_KEY` (For admin functions)
- `LOVABLE_API_KEY` (If using default AI fallback)
- `BYTEZ_API_KEY` (If using Bytez)

---

## License

Proprietary software of BCA Association MMAMC. All rights reserved.
