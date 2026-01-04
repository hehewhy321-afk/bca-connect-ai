import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PageLoader } from "@/components/ui/loading-spinner";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load other pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Events = lazy(() => import("./pages/Events"));
const Resources = lazy(() => import("./pages/Resources"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Community = lazy(() => import("./pages/Community"));
const Settings = lazy(() => import("./pages/Settings"));
const Forum = lazy(() => import("./pages/Forum"));
const ForumPost = lazy(() => import("./pages/ForumPost"));
const NewForumPost = lazy(() => import("./pages/NewForumPost"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
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
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Redirect authenticated users away from auth page
function AuthRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <PageLoader message="Checking authentication..." />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Auth />;
}

// Wrapper for lazy-loaded routes
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              
              {/* Dashboard routes */}
              <Route path="/dashboard" element={<ProtectedRoute><LazyRoute><Dashboard /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/ai-assistant" element={<ProtectedRoute><LazyRoute><AIAssistant /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/events" element={<ProtectedRoute><LazyRoute><Events /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/resources" element={<ProtectedRoute><LazyRoute><Resources /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/achievements" element={<ProtectedRoute><LazyRoute><Achievements /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/community" element={<ProtectedRoute><LazyRoute><Community /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><LazyRoute><Settings /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/forum" element={<ProtectedRoute><LazyRoute><Forum /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/forum/new" element={<ProtectedRoute><LazyRoute><NewForumPost /></LazyRoute></ProtectedRoute>} />
              <Route path="/dashboard/forum/:id" element={<ProtectedRoute><LazyRoute><ForumPost /></LazyRoute></ProtectedRoute>} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute><LazyRoute><AdminPanel /></LazyRoute></ProtectedRoute>} />
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
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
