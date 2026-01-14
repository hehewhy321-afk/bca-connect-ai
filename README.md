# 🎓 BCA Association MMAMC

> A modern, AI-powered web platform for BCA Association of MMAMC College, Nepal.

![BCA Association](https://github.com/user-attachments/assets/fe22f9bd-68fa-4205-8693-924e576d46ce)

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://mmamc-bca.vercel.app)
[![Documentation](https://img.shields.io/badge/docs-read-blue)](https://mmamc-bca.vercel.app/docs)
[![License](https://img.shields.io/badge/license-Proprietary-blue)]()

---

## 🌟 Overview

The BCA Association platform is a comprehensive solution for managing student activities, events, resources, and community engagement. Built with React, TypeScript, Supabase, and cutting-edge AI technologies.

### ✨ Key Features

- 🤖 **AI-Powered Study Assistant** with voice & image support
- 📜 **Digital Certificate System** with QR verification
- 🎯 **Event Management** with QR check-in & payment verification
- 👥 **Community Forum** with upvoting & achievements
- 📱 **PWA Support** - Install as mobile/desktop app
- 🔐 **Role-Based Access Control** (Admin, Moderator, Member)
- 🍅 **Productivity Tools** - Pomodoro Timer & Markdown Editor
- 🌐 **Multi-Browser Compatible** with cache management

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/bca-association.git
cd bca-association

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

Visit [http://localhost:8080](http://localhost:8080)

---

## 📚 Documentation

For complete documentation including:
- Detailed setup instructions
- Feature guides
- API reference
- Deployment guide
- Configuration options
- Security best practices

**👉 [Read Full Documentation](https://mmamc-bca.vercel.app/docs)**

Or visit `/docs` route when running locally.

---

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion

**Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)

**AI Services:** OpenRouter, Bytez, Lovable AI

**Deployment:** Vercel (Frontend), Supabase (Backend)

---

## 📦 Project Structure

```
bca-association/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   └── integrations/   # Third-party integrations
├── supabase/
│   ├── migrations/     # Database migrations
│   └── functions/      # Edge functions
└── public/             # Static assets
```

---

## 🎯 Features Highlights

### For Students
- 📚 Resource library with study materials
- 🤖 24/7 AI study assistant
- 💬 Community forum
- 📅 Event registration
- 🏆 Achievements & gamification

### For Admins
- 👥 User management
- 📊 Analytics dashboard
- 📜 Certificate generation
- 🎯 Event management
- 🤖 AI configuration

### Tools
- 🍅 Pomodoro Timer (`/tools/pomodoro`)
- 📝 Markdown Editor (`/tools/markdown`)
- 🔧 Cache Fixer (`/clear-cache.html`)

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables
3. Deploy automatically on push

### Deploy Edge Functions
```bash
supabase functions deploy
```

**📖 [Detailed Deployment Guide](https://mmamc-bca.vercel.app/docs)**

---

## 🔐 Security

- JWT Authentication
- Row Level Security (RLS)
- Role-Based Access Control
- HTTPS Only
- Input Validation
- XSS Protection

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

- 📖 [Documentation](https://mmamc-bca.vercel.app/docs)
- 📧 Email: bca@mmamc.edu.np
- 🌐 Website: [mmamc-bca.vercel.app](https://mmamc-bca.vercel.app)

---

**⭐ Star this repository if you find it helpful!**
