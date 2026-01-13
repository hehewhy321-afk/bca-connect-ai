import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

// Eager load critical and frequently accessed pages for instant navigation
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";

// Lazy load less frequently accessed pages
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const ImageGallery = lazy(() => import("./pages/ImageGallery"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Community = lazy(() => import("./pages/Community"));
const Alumni = lazy(() => import("./pages/Alumni"));
const Forum = lazy(() => import("./pages/Forum"));
const ForumPost = lazy(() => import("./pages/ForumPost"));
const NewForumPost = lazy(() => import("./pages/NewForumPost"));

// Admin pages - lazy load as they're less frequently accessed
import AdminPanel from "./pages/admin/AdminPanel";
const AdminEventsHub = lazy(() => import("./pages/admin/AdminEventsHub"));
const EventForm = lazy(() => import("./pages/admin/EventForm"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources"));
const ResourceForm = lazy(() => import("./pages/admin/ResourceForm"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminNotices = lazy(() => import("./pages/admin/AdminNotices"));
const AdminContacts = lazy(() => import("./pages/admin/AdminContacts"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminFoundingMembers = lazy(() => import("./pages/admin/AdminFoundingMembers"));
const AdminWebsiteSettings = lazy(() => import("./pages/admin/AdminWebsiteSettings"));
const AdminFAQs = lazy(() => import("./pages/admin/AdminFAQs"));
const AdminQRScanner = lazy(() => import("./pages/admin/AdminQRScanner"));
const AdminAISettings = lazy(() => import("./pages/admin/AdminAISettings"));
const AdminPaymentVerification = lazy(() => import("./pages/admin/AdminPaymentVerification"));
const AdminCertificates = lazy(() => import("./pages/admin/AdminCertificates"));
const Certificates = lazy(() => import("./pages/dashboard/Certificates"));

// Public pages - lazy load
const Notice = lazy(() => import("./pages/Notice"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const About = lazy(() => import("./pages/About"));
const PublicEvents = lazy(() => import("./pages/PublicEvents"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Install = lazy(() => import("./pages/Install"));

// Configure QueryClient with production-ready defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal loading indicator - only shows for truly slow loads
function MinimalLoader() {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Redirect authenticated users away from auth page
function AuthRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <MinimalLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Auth />;
}

// Wrapper for lazy-loaded routes - minimal overhead
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MinimalLoader />}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Public routes - eager loaded */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthRedirect />} />

                {/* Public routes - lazy loaded */}
                <Route path="/notice" element={<LazyRoute><Notice /></LazyRoute>} />
                <Route path="/faq" element={<LazyRoute><FAQ /></LazyRoute>} />
                <Route path="/contact" element={<LazyRoute><Contact /></LazyRoute>} />
                <Route path="/privacy" element={<LazyRoute><PrivacyPolicy /></LazyRoute>} />
                <Route path="/terms" element={<LazyRoute><TermsOfService /></LazyRoute>} />
                <Route path="/about" element={<LazyRoute><About /></LazyRoute>} />
                <Route path="/events" element={<LazyRoute><PublicEvents /></LazyRoute>} />
                <Route path="/events/:id" element={<LazyRoute><EventDetail /></LazyRoute>} />
                <Route path="/install" element={<LazyRoute><Install /></LazyRoute>} />

                {/* Dashboard routes - eager loaded pages don't need LazyRoute */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/ai-assistant" element={<ProtectedRoute><LazyRoute><AIAssistant /></LazyRoute></ProtectedRoute>} />
                <Route path="/dashboard/image-gallery" element={<ProtectedRoute><LazyRoute><ImageGallery /></LazyRoute></ProtectedRoute>} />
                <Route path="/dashboard/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                <Route path="/dashboard/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
                <Route path="/dashboard/achievements" element={<ProtectedRoute><LazyRoute><Achievements /></LazyRoute></ProtectedRoute>} />
                <Route path="/dashboard/community" element={<ProtectedRoute><LazyRoute><Community /></LazyRoute></ProtectedRoute>} />
                <Route path="/dashboard/alumni" element={<ProtectedRoute><LazyRoute><Alumni /></LazyRoute></ProtectedRoute>} />
                <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/dashboard/forum" element={<ProtectedRoute><LazyRoute><Forum /></LazyRoute></ProtectedRoute>} />
                <Route path="/dashboard/forum/new" element={<ProtectedRoute><LazyRoute><NewForumPost /></LazyRoute></ProtectedRoute>} />
                <Route path="/dashboard/forum/:id" element={<ProtectedRoute><LazyRoute><ForumPost /></LazyRoute></ProtectedRoute>} />
                <Route path="/dashboard/certificates" element={<ProtectedRoute><LazyRoute><Certificates /></LazyRoute></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                <Route path="/admin/events" element={<ProtectedRoute><LazyRoute><AdminEventsHub /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/events/new" element={<ProtectedRoute><LazyRoute><EventForm /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/events/:id" element={<ProtectedRoute><LazyRoute><EventForm /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/qr-scanner" element={<ProtectedRoute><LazyRoute><AdminQRScanner /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/resources" element={<ProtectedRoute><LazyRoute><AdminResources /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/resources/new" element={<ProtectedRoute><LazyRoute><ResourceForm /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/resources/:id" element={<ProtectedRoute><LazyRoute><ResourceForm /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/members" element={<ProtectedRoute><LazyRoute><AdminMembers /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/announcements" element={<ProtectedRoute><LazyRoute><AdminAnnouncements /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/notices" element={<ProtectedRoute><LazyRoute><AdminNotices /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/contacts" element={<ProtectedRoute><LazyRoute><AdminContacts /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><LazyRoute><AdminUsers /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/founding-members" element={<ProtectedRoute><LazyRoute><AdminFoundingMembers /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute><LazyRoute><AdminWebsiteSettings /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/faqs" element={<ProtectedRoute><LazyRoute><AdminFAQs /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/ai-settings" element={<ProtectedRoute><LazyRoute><AdminAISettings /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/payment-verification" element={<ProtectedRoute><LazyRoute><AdminPaymentVerification /></LazyRoute></ProtectedRoute>} />
                <Route path="/admin/certificates" element={<ProtectedRoute><LazyRoute><AdminCertificates /></LazyRoute></ProtectedRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
