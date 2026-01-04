# BCA Association MMAMC - Complete Platform Guide

A comprehensive web platform for BCA Association of MMAMC College, Nepal. Built with React, TypeScript, Supabase, and Tailwind CSS.

![BCA Association](https://lovable.dev/opengraph-image-p98pqg.png)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Database Configuration](#database-configuration)
- [Edge Functions](#edge-functions)
- [Authentication Setup](#authentication-setup)
- [Admin Setup](#admin-setup)
- [Cron Jobs](#cron-jobs)
- [Storage Buckets](#storage-buckets)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

The BCA Association platform provides:
- **Public Events** - Browse and register for events
- **Member Portal** - Dashboard for registered members
- **Admin Panel** - Complete event and member management
- **AI Assistant** - Powered by Lovable AI for student queries
- **Forum** - Community discussions and Q&A
- **Resources** - Study materials, past papers, and more

---

## Features

### For Public Users
- View public events and register
- Browse FAQs and contact information
- Access founding members information

### For Members (Authenticated Users)
- Personal dashboard with achievements
- Event registration with QR code check-in
- Forum participation (posts, replies, voting)
- Resource access (study materials, past papers)
- AI-powered assistant for queries
- Notification system

### For Admins
- **Events Hub** - Unified management for:
  - Create/edit/delete events
  - Member registrations
  - Public registrations
  - Payment verification (receipt preview & approval)
  - Event feedback analysis
  - CSV export for all data
  - QR code check-in scanner
- **AI Settings** - Configure AI provider:
  - Switch between Lovable AI and OpenRouter
  - Select from 10+ free models (Llama, Gemma, Mistral, etc.)
  - Configure paid models (GPT-4o, Claude, Gemini Pro)
  - Custom system prompts
- **Member Management** - User roles and profiles
- **Content Management** - FAQs, announcements, resources
- **Website Settings** - Dynamic configuration

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI Components |
| **Supabase** | Backend (Auth, Database, Storage, Edge Functions) |
| **Framer Motion** | Animations |
| **TanStack Query** | Data Fetching |
| **React Router** | Navigation |
| **Recharts** | Charts & Analytics |
| **QRCode.react** | QR Code Generation |

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn
- Supabase account (for backend)

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

---

## Database Configuration

### Tables Overview

The database includes the following tables:

| Table | Description |
|-------|-------------|
| `profiles` | User profile information |
| `user_roles` | Role assignments (admin, moderator, member) |
| `events` | Event details with status, fees, team settings |
| `event_registrations` | Member event registrations |
| `public_event_registrations` | Public (non-member) registrations |
| `event_feedback` | Post-event ratings and feedback |
| `event_reminders` | Email reminder subscriptions |
| `forum_posts` | Forum discussion posts |
| `forum_replies` | Replies to forum posts |
| `forum_votes` | Upvote/downvote tracking |
| `resources` | Study materials and documents |
| `announcements` | Platform announcements |
| `notifications` | User notifications |
| `faqs` | Frequently asked questions |
| `founding_members` | Founding team information |
| `achievements` | Gamification achievements |
| `user_achievements` | User-earned achievements |
| `chat_messages` | AI chat history |
| `contact_submissions` | Contact form entries |
| `website_settings` | Dynamic site configuration |
| `ai_settings` | AI provider configuration |

### Key Database Features

#### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:
- Users can only access their own data
- Admins have elevated privileges
- Public data is accessible to everyone

#### Automatic Triggers
- `handle_new_user()` - Creates profile and assigns member role on signup
- `update_updated_at_column()` - Updates timestamps automatically

#### Database Functions
- `has_role(user_id, role)` - Check if user has specific role
- `promote_to_admin(email)` - Promote user to admin role

### Database Schema SQL

To recreate the database, run these migrations in order:

```sql
-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- 2. Create custom types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE public.event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
CREATE TYPE public.resource_type AS ENUM ('study_material', 'past_paper', 'project', 'interview_prep', 'article');

-- 3. Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  batch TEXT,
  semester INTEGER,
  skills TEXT[],
  linkedin_url TEXT,
  github_url TEXT,
  is_alumni BOOLEAN DEFAULT false,
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  max_attendees INTEGER,
  is_featured BOOLEAN DEFAULT false,
  status event_status DEFAULT 'upcoming',
  visibility TEXT DEFAULT 'public',
  team_type TEXT DEFAULT 'solo',
  team_size_min INTEGER DEFAULT 1,
  team_size_max INTEGER DEFAULT 1,
  registration_fee NUMERIC,
  gallery_images TEXT[] DEFAULT '{}',
  admin_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create event_registrations table (for members)
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team_name TEXT,
  team_members JSONB DEFAULT '[]',
  attended BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending',
  payment_receipt_url TEXT,
  check_in_code TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create public_event_registrations table (for non-members)
CREATE TABLE public.public_event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  team_name TEXT,
  team_members JSONB DEFAULT '[]',
  payment_status TEXT DEFAULT 'pending',
  payment_receipt_url TEXT,
  check_in_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create event_reminders table
CREATE TABLE public.event_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Create event_feedback table
CREATE TABLE public.event_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Continue with remaining tables (forum_posts, resources, etc.)
-- See full migration files in supabase/migrations/
```

---

## Edge Functions

### Available Functions

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `ai-chat` | AI-powered assistant (Lovable AI or OpenRouter) | Yes |
| `send-event-reminder` | Send email reminders 24h before events | No (cron) |
| `create-user` | Admin user creation | Yes (Admin) |
| `setup-admin` | Initial admin setup | No |

### ai-chat Function

Handles AI conversations with flexible provider support.

**Supported Providers:**
- **Lovable AI** (Default) - No API key required, uses Gemini 2.5 Flash
- **OpenRouter** - Access to 100+ models including free options

```typescript
// Usage in frontend
const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    messages: [{ role: 'user', content: 'Explain recursion in programming' }]
  }),
});
```

### send-event-reminder Function

Automated email reminders using Resend API.

**Required Secret:** `RESEND_API_KEY`

```typescript
// Triggered automatically by cron job
// Sends reminders 24 hours before event start
```

---

## AI Configuration

The platform includes an AI-powered study assistant that can be configured through the Admin Panel.

### Accessing AI Settings

1. Login as an admin
2. Go to **Admin Panel → AI Settings**
3. Configure your preferred provider

### Available Providers

#### Lovable AI (Default)
- **No API key required** - works out of the box
- Uses Google Gemini 2.5 Flash model
- Simple and reliable for most use cases

#### OpenRouter
- Access to **100+ AI models** including free options
- Get your API key from [openrouter.ai/keys](https://openrouter.ai/keys)
- Perfect for budget-conscious deployments

### Free Models Available (OpenRouter)

| Model | Provider | Best For |
|-------|----------|----------|
| Llama 3.2 3B | Meta | General use, balanced |
| Llama 3.1 8B | Meta | Longer responses |
| Gemma 2 9B | Google | Coding questions |
| Mistral 7B | Mistral AI | Creative writing |
| Phi-3 Mini | Microsoft | Fast, simple queries |
| Qwen 2 7B | Alibaba | Multilingual support |
| OpenChat 7B | OpenChat | Conversational |
| Zephyr 7B | HuggingFace | Technical explanations |

### Paid Models Available (OpenRouter)

| Model | Provider |
|-------|----------|
| GPT-4o / GPT-4o Mini | OpenAI |
| Claude 3.5 Sonnet / Claude 3 Haiku | Anthropic |
| Gemini Pro 1.5 / Gemini Flash 1.5 | Google |
| Llama 3.1 70B | Meta |
| Mixtral 8x7B | Mistral AI |

### Custom System Prompt

You can customize the AI assistant's personality and instructions:
1. Go to Admin → AI Settings
2. Scroll to "Custom System Prompt"
3. Enter your custom instructions
4. Save changes

### AI Settings Database Table

```sql
CREATE TABLE public.ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default settings
INSERT INTO ai_settings (setting_key, setting_value) VALUES
  ('ai_provider', 'lovable'),
  ('openrouter_api_key', ''),
  ('openrouter_model', 'meta-llama/llama-3.2-3b-instruct:free'),
  ('custom_system_prompt', '');
```

---

## Authentication Setup

### Enable Auto-Confirm (Development)

For faster testing, enable auto-confirm in Supabase Auth settings:

1. Go to Supabase Dashboard → Authentication → Settings
2. Enable "Confirm email" toggle OFF (for development)

### User Registration Flow

1. User signs up with email/password
2. `handle_new_user()` trigger creates profile
3. Default 'member' role is assigned
4. User redirected to dashboard

### Role-Based Access

```typescript
// Check user role
const { data: userRole } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single();

// Available roles: 'admin' | 'moderator' | 'member'
```

---

## Admin Setup

### Method 1: Database Function

```sql
SELECT promote_to_admin('admin@example.com');
```

### Method 2: Direct SQL

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin' FROM public.profiles 
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### Method 3: Edge Function

Call the `setup-admin` edge function with default credentials.

---

## Cron Jobs

### Event Reminder Cron

Sends automated email reminders 24 hours before events.

```sql
-- Enable extensions first
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the cron job (runs every hour)
SELECT cron.schedule(
  'send-event-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-event-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Note:** Replace `YOUR_PROJECT_REF` and `YOUR_ANON_KEY` with actual values.

---

## Storage Buckets

### Configured Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | User profile pictures |
| `events` | Yes | Event images and banners |
| `resources` | Yes | Study materials and files |
| `payment-receipts` | Yes | Payment proof uploads |
| `website-assets` | Yes | General website assets |

### Upload Example

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file);

const { data: urlData } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`);
```

---

## Environment Variables

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Edge Function Secrets (Supabase Dashboard)

| Secret | Required | Purpose |
|--------|----------|---------|
| `SUPABASE_URL` | Auto | Supabase project URL |
| `SUPABASE_ANON_KEY` | Auto | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto | Service role key |
| `RESEND_API_KEY` | Manual | Email sending (Resend) |
| `LOVABLE_API_KEY` | Auto | AI functionality |

---

## Deployment

### Via Lovable

1. Click **Publish** button in Lovable editor
2. Click **Update** to deploy changes
3. Access via `your-project.lovable.app`

### Custom Domain

1. Go to Project Settings → Domains
2. Click "Connect Domain"
3. Add DNS records as instructed
4. SSL certificate auto-provisioned

### Production Checklist

- [ ] Enable email confirmation for signups
- [ ] Set up proper email templates in Supabase
- [ ] Configure RESEND_API_KEY for email reminders
- [ ] Configure AI provider in Admin > AI Settings
- [ ] Add OpenRouter API key if using free models
- [ ] Verify all RLS policies are active
- [ ] Set up cron job for event reminders
- [ ] Configure custom domain
- [ ] Update OG images and metadata
- [ ] Test payment receipt upload flow
- [ ] Verify admin access
- [ ] Test QR code check-in flow

---

## Troubleshooting

### Common Issues

#### "Invalid API key" Error
- Verify environment variables are set correctly
- Check Supabase project status

#### Images Not Loading
- Ensure storage bucket is public
- Check file path and bucket name

#### Authentication Issues
- Clear browser localStorage
- Check email confirmation settings
- Verify redirect URLs

#### Edge Function Errors
- Check function logs in Supabase Dashboard
- Verify secrets are configured
- Test with curl or Postman

### Debug Mode

Enable console logging:
```typescript
// Check auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

### Support

- [Lovable Documentation](https://docs.lovable.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Troubleshooting Guide](https://docs.lovable.dev/tips-tricks/troubleshooting)

---

## License

This project is proprietary to BCA Association MMAMC.

---

## Contributors

Built with ❤️ by BCA Association MMAMC Team using [Lovable](https://lovable.dev)
