import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Book, Rocket, Code, Database, Shield, Zap,
  Users, Settings, Wrench, Cloud, Palette, FileText, ChevronRight,
  CheckCircle2, ExternalLink, Copy, Terminal, Package, Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const categories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    color: "from-blue-500 to-cyan-500",
    sections: [
      {
        title: "Quick Start",
        content: `Welcome to BCA Association MMAMC platform! This guide will help you get started quickly.

**Prerequisites:**
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Git installed

**Installation Steps:**

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/bca-association.git
cd bca-association
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
Create a \`.env.local\` file in the root directory:
\`\`\`env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
\`\`\`

4. Start development server:
\`\`\`bash
npm run dev
\`\`\`

Your app will be running at http://localhost:8080`
      },
      {
        title: "Project Structure",
        content: `Understanding the project structure:

\`\`\`
bca-association/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utility functions
│   └── integrations/   # Third-party integrations
├── supabase/
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge functions
├── public/             # Static assets
└── dist/               # Build output
\`\`\`

**Key Directories:**
- **components/**: Shared UI components (buttons, cards, dialogs)
- **pages/**: Route-based page components
- **contexts/**: Global state management (Auth, Theme)
- **supabase/**: Backend configuration and migrations`
      }
    ]
  },
  {
    id: "features",
    title: "Features",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    sections: [
      {
        title: "User Features",
        content: `**For Students & Members:**

**Academic Resources**
- 📚 Resource Library with study materials and past papers
- 🔍 Smart search by subject, semester, or topic
- 📥 Direct PDF downloads with preview
- 📊 Resource analytics and tracking

**AI Study Assistant**
- 💬 24/7 chat support for curriculum questions
- 🎤 Voice interaction for hands-free learning
- 🖼️ Image generation for visual aids
- 🧠 Context-aware responses
- 🎯 Access to 100+ AI models (GPT-4, Claude, Llama)
- 👤 Guest access available (limited features)

**Community & Networking**
- 💬 StackOverflow-style forum system
- ⬆️ Upvoting system for best answers
- 🏆 Achievement badges and gamification
- 👥 Alumni network for mentorship
- 📢 Real-time announcements
- 📝 Academic notices

**Events & Activities**
- 📅 Event calendar and registration
- 🎟️ QR-based digital tickets
- 📸 Event photo galleries
- 📧 Automated email reminders
- ✅ QR check-in system
- 💬 Event feedback system

**Personal Dashboard**
- 📊 Activity tracking and analytics
- 🏅 XP and level progression
- 📜 Certificate management
- 🔔 Real-time notifications
- ⚙️ Profile customization
- 🎯 Achievement progress tracking`
      },
      {
        title: "Admin Features",
        content: `**For Administrators:**

**User Management**
- 👥 Complete member registry
- 🔐 Role assignment (Admin/Moderator)
- 🎓 Alumni status management
- 📊 User analytics and growth tracking
- ➕ Direct user creation

**Event Management**
- ➕ Rich event creation with images
- 📝 Detailed event management
- 💰 Payment verification system
- 📸 Gallery management
- 📊 QR-based attendance tracking
- 📧 Automated email reminders

**Certificate System**
- 🎨 Multiple certificate templates
- ✍️ Signature management
- 🔄 Bulk certificate generation
- 🔍 QR verification for authenticity
- 📥 PDF export functionality
- 📊 Certificate analytics

**Content Management**
- 📚 Resource upload and management
- 📢 Announcement broadcasting
- 📝 Notice posting
- ❓ FAQ management
- 🌐 Website settings customization
- 📧 Contact inquiry management

**AI Configuration**
- 🤖 Provider selection (OpenRouter, Bytez, Default)
- 🔑 Secure API key management
- 🎨 Model selection from 100+ options
- 📝 Custom prompt configuration
- 🎤 Voice settings
- 🖼️ Image generation controls`
      },
      {
        title: "Tools & Utilities",
        content: `**Productivity Tools:**

**Pomodoro Timer** (\`/tools/pomodoro\`)
- ⏱️ Customizable work/break sessions
- 📊 Circular progress visualization
- 📈 Statistics tracking (sessions, time, streaks)
- 🔔 Browser and audio notifications
- ⚙️ Auto-start options
- 💾 LocalStorage persistence

**Markdown Editor** (\`/tools/markdown\`)
- ✍️ Live preview rendering
- 🎨 Formatting toolbar
- 📊 Word/character/line counter
- 📥 Export to MD/HTML
- 📋 Copy to clipboard
- 📝 Pre-built templates
- 👁️ Multiple view modes

**Cache Fixer** (\`/clear-cache.html\`)
- 🔄 One-click cache clearing
- 🧹 Service worker cleanup
- 💾 LocalStorage clearing
- 🔁 Auto-redirect to home

**QR Scanner** (Admin only)
- 📱 Mobile-friendly scanning
- ✅ Instant verification
- 📊 Attendance tracking
- 🎟️ Certificate validation`
      }
    ]
  },
  {
    id: "tech-stack",
    title: "Tech Stack",
    icon: Code,
    color: "from-purple-500 to-pink-500",
    sections: [
      {
        title: "Frontend Technologies",
        content: `**Core Framework:**
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **React Router**: Client-side routing

**Styling & UI:**
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible component library
- **Radix UI**: Unstyled accessible primitives
- **Framer Motion**: Smooth animations
- **Lucide Icons**: Beautiful icon set

**State Management:**
- **TanStack Query**: Server state management
- **React Context**: Global state (Auth, Theme)
- **React Hook Form**: Form handling
- **Zod**: Schema validation

**Additional Libraries:**
- **React Markdown**: Markdown rendering
- **Recharts**: Data visualization
- **date-fns**: Date manipulation
- **Sonner**: Toast notifications
- **QRCode.react**: QR code generation
- **html5-qrcode**: QR scanning`
      },
      {
        title: "Backend & Database",
        content: `**Backend as a Service:**
- **Supabase**: Complete backend solution
- **PostgreSQL**: Relational database
- **Supabase Auth**: Authentication & authorization
- **Supabase Storage**: File storage (images, PDFs)
- **Supabase Realtime**: Live updates
- **Row Level Security**: Database-level security

**Edge Functions (Deno):**
- \`ai-chat\`: Secure AI chat proxy
- \`ai-chat-guest\`: Guest AI chat (rate-limited)
- \`ai-voice\`: Speech processing
- \`send-event-reminder\`: Email reminders (cron)
- \`create-user\`: Admin user creation
- \`setup-admin\`: Admin promotion utility
- \`cleanup-notifications\`: Auto-cleanup (cron)

**Database Schema:**
- profiles, user_roles
- events, event_registrations
- certificates, certificate_signatures
- resources, forum_posts, forum_replies
- achievements, user_achievements
- notifications, announcements, notices
- website_settings, ai_settings`
      },
      {
        title: "Third-Party Integrations",
        content: `**AI & Machine Learning:**
- **OpenRouter**: Access to 100+ AI models
- **Bytez**: High-performance AI & voice
- **Lovable AI**: Default fallback provider

**Email Services:**
- **Resend**: Transactional emails

**Deployment & Hosting:**
- **Vercel**: Frontend hosting
- **Supabase**: Backend infrastructure

**PWA & Performance:**
- **Vite PWA Plugin**: Progressive Web App
- **Workbox**: Service worker caching
- **Cache Management**: Smart caching strategies`
      }
    ]
  },
  {
    id: "configuration",
    title: "Configuration",
    icon: Settings,
    color: "from-green-500 to-emerald-500",
    sections: [
      {
        title: "Environment Setup",
        content: `**Frontend Configuration (.env.local):**

\`\`\`env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
\`\`\`

**Backend Configuration (Supabase Secrets):**

Navigate to: Supabase Dashboard > Project Settings > Edge Functions > Secrets

\`\`\`env
# Email Service
RESEND_API_KEY=your-resend-api-key

# AI Services (Optional)
LOVABLE_API_KEY=your-lovable-api-key

# Database
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

**Getting API Keys:**
1. **Supabase**: Sign up at supabase.com
2. **Resend**: Get API key from resend.com
3. **OpenRouter**: Optional, get from openrouter.ai
4. **Bytez**: Optional, get from bytez.com`
      },
      {
        title: "Database Setup",
        content: `**Applying Migrations:**

\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
\`\`\`

**Storage Buckets:**

The following buckets are created automatically:
- \`avatars\`: User profile pictures
- \`certificates\`: Certificate PDFs and signatures
- \`events\`: Event banners and galleries
- \`resources\`: Study material PDFs
- \`ai-generated-images\`: AI-generated images

**Creating Admin User:**

\`\`\`bash
# Deploy setup-admin function
supabase functions deploy setup-admin

# Promote user to admin
curl -X POST https://your-project.supabase.co/functions/v1/setup-admin \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@example.com"}'
\`\`\``
      },
      {
        title: "AI Configuration",
        content: `**Setting Up AI Providers:**

1. Navigate to **Admin Dashboard > AI Settings**

2. Choose your AI provider:
   - **Default (Lovable)**: No configuration needed
   - **OpenRouter**: Enter API key, select model
   - **Bytez**: Enter API key for voice features

3. Customize system prompt (optional)

4. Save settings

**Supported AI Models:**
- GPT-4, GPT-3.5 (OpenAI)
- Claude 3 (Anthropic)
- Llama 3, Llama 2 (Meta)
- Mistral, Mixtral (Mistral AI)
- Gemini (Google)
- 100+ more via OpenRouter

**Voice Features:**
- Speech-to-text (STT)
- Text-to-speech (TTS)
- Multiple voice options
- Language support`
      }
    ]
  },
  {
    id: "deployment",
    title: "Deployment",
    icon: Cloud,
    color: "from-cyan-500 to-blue-500",
    sections: [
      {
        title: "Build & Deploy",
        content: `**Building for Production:**

\`\`\`bash
# Build the project
npm run build

# Output will be in dist/ folder
\`\`\`

**Deploy to Vercel:**

1. **Connect Repository**
   - Go to vercel.com
   - Import your Git repository
   - Select the project

2. **Configure Environment Variables**
   Add in Vercel project settings:
   - \`VITE_SUPABASE_URL\`
   - \`VITE_SUPABASE_PUBLISHABLE_KEY\`
   - \`VITE_SUPABASE_PROJECT_ID\`

3. **Deploy**
   - Vercel auto-deploys on push to main
   - Preview deployments for pull requests

**Deploy Edge Functions:**

\`\`\`bash
# Deploy all functions
supabase functions deploy --no-verify-jwt

# Deploy specific function
supabase functions deploy ai-chat
\`\`\``
      },
      {
        title: "Post-Deployment",
        content: `**Post-Deployment Checklist:**

✅ Environment variables set
✅ Database migrations applied
✅ Storage buckets created
✅ Edge functions deployed
✅ Email service configured
✅ AI provider configured (optional)
✅ Admin user created
✅ Website settings configured

**Testing Deployment:**

1. Visit your deployed URL
2. Test authentication (login/signup)
3. Check admin panel access
4. Verify AI assistant works
5. Test event registration
6. Check resource downloads
7. Verify email notifications
8. Test PWA installation

**Monitoring:**

- Check Vercel Analytics
- Monitor Supabase logs
- Review error reports
- Track user engagement`
      }
    ]
  },
  {
    id: "security",
    title: "Security",
    icon: Shield,
    color: "from-red-500 to-orange-500",
    sections: [
      {
        title: "Security Features",
        content: `**Authentication & Authorization:**

- **JWT Authentication**: Secure token-based auth
- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control**: Admin, Moderator, Member roles
- **Session Management**: Secure session handling

**Data Protection:**

- **HTTPS Only**: All connections encrypted
- **CORS Protection**: Controlled cross-origin requests
- **Input Validation**: Zod schema validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based protection

**API Security:**

- **Rate Limiting**: Prevent abuse
- **API Key Encryption**: Secure key storage
- **Service Role Keys**: Protected backend access
- **Edge Function Auth**: Secure function calls

**Best Practices:**

1. Never commit \`.env\` files
2. Rotate API keys regularly
3. Use strong passwords
4. Enable 2FA for admin accounts
5. Regular security audits
6. Keep dependencies updated`
      },
      {
        title: "Privacy & Compliance",
        content: `**Data Privacy:**

- User data encrypted at rest
- Secure file storage
- GDPR-compliant data handling
- User data export available
- Account deletion support

**User Permissions:**

- Granular permission system
- Role-based access control
- Resource-level permissions
- Action-based authorization

**Audit Logging:**

- User activity tracking
- Admin action logs
- Security event monitoring
- Compliance reporting`
      }
    ]
  },
  {
    id: "api-reference",
    title: "API Reference",
    icon: Terminal,
    color: "from-yellow-500 to-orange-500",
    sections: [
      {
        title: "Edge Functions",
        content: `**AI Chat Function:**

\`\`\`typescript
// Endpoint: /functions/v1/ai-chat
// Method: POST
// Auth: Required

{
  "message": "Your question here",
  "conversationHistory": [],
  "provider": "openrouter",
  "model": "gpt-4"
}
\`\`\`

**AI Voice Function:**

\`\`\`typescript
// Endpoint: /functions/v1/ai-voice
// Method: POST
// Auth: Required

{
  "action": "speech-to-text",
  "audio": "base64-encoded-audio"
}
\`\`\`

**Create User Function:**

\`\`\`typescript
// Endpoint: /functions/v1/create-user
// Method: POST
// Auth: Admin only

{
  "email": "user@example.com",
  "password": "secure-password",
  "fullName": "John Doe"
}
\`\`\``
      },
      {
        title: "Database Queries",
        content: `**Common Queries:**

**Get User Profile:**
\`\`\`typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
\`\`\`

**Get Events:**
\`\`\`typescript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .order('date', { ascending: true });
\`\`\`

**Get Resources:**
\`\`\`typescript
const { data, error } = await supabase
  .from('resources')
  .select('*')
  .eq('subject', 'Mathematics')
  .order('created_at', { ascending: false });
\`\`\`

**Upload File:**
\`\`\`typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(\`\${userId}/avatar.png\`, file);
\`\`\``
      }
    ]
  }
];

export default function Documentation() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [activeSection, setActiveSection] = useState(0);

  const currentCategory = categories.find(cat => cat.id === activeCategory);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black text-foreground">Documentation</h1>
                <p className="text-sm text-muted-foreground font-medium">Complete guide to BCA Association platform</p>
              </div>
            </div>
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-xl">
                <ExternalLink className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-2">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 px-3">
                Categories
              </h3>
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(category.id);
                      setActiveSection(0);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      activeCategory === category.id
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${
                      activeCategory === category.id
                        ? 'bg-white/20'
                        : 'bg-muted'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">{category.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Category Header */}
              {currentCategory && (
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentCategory.color}`}>
                      <currentCategory.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-foreground">{currentCategory.title}</h2>
                      <p className="text-muted-foreground">
                        {currentCategory.sections.length} sections
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections */}
              {currentCategory && (
                <div className="space-y-6">
                  {currentCategory.sections.map((section, idx) => (
                    <Card key={idx} className="glass-card rounded-3xl border border-border p-8">
                      <h3 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        {section.title}
                      </h3>
                      <div className="prose prose-invert max-w-none">
                        {section.content.split('\n\n').map((paragraph, pIdx) => {
                          // Check if it's a code block
                          if (paragraph.startsWith('```')) {
                            const code = paragraph.replace(/```\w*\n?/g, '').trim();
                            return (
                              <div key={pIdx} className="relative group my-4">
                                <pre className="bg-muted p-6 rounded-2xl overflow-x-auto border border-border">
                                  <code className="text-sm font-mono text-foreground">
                                    {code}
                                  </code>
                                </pre>
                                <button
                                  onClick={() => copyCode(code)}
                                  className="absolute top-4 right-4 p-2 rounded-lg bg-background/80 hover:bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          }
                          
                          // Check if it's a heading
                          if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                            return (
                              <h4 key={pIdx} className="text-xl font-bold text-foreground mt-8 mb-4">
                                {paragraph.replace(/\*\*/g, '')}
                              </h4>
                            );
                          }
                          
                          // Regular paragraph
                          return (
                            <p key={pIdx} className="text-muted-foreground leading-relaxed mb-4">
                              {paragraph.split('\n').map((line, lIdx) => {
                                // Handle list items
                                if (line.startsWith('- ')) {
                                  return (
                                    <div key={lIdx} className="flex items-start gap-2 mb-2">
                                      <ChevronRight className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                                      <span>{line.substring(2)}</span>
                                    </div>
                                  );
                                }
                                // Handle inline code
                                if (line.includes('`')) {
                                  const parts = line.split('`');
                                  return (
                                    <span key={lIdx}>
                                      {parts.map((part, partIdx) => 
                                        partIdx % 2 === 0 ? (
                                          part
                                        ) : (
                                          <code key={partIdx} className="bg-muted px-2 py-1 rounded text-sm font-mono text-primary">
                                            {part}
                                          </code>
                                        )
                                      )}
                                      <br />
                                    </span>
                                  );
                                }
                                return <span key={lIdx}>{line}<br /></span>;
                              })}
                            </p>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
