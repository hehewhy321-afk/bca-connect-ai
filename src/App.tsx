import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AIAssistant from "./pages/AIAssistant";
import Events from "./pages/Events";
import Resources from "./pages/Resources";
import Achievements from "./pages/Achievements";
import Community from "./pages/Community";
import Settings from "./pages/Settings";
import Forum from "./pages/Forum";
import ForumPost from "./pages/ForumPost";
import NewForumPost from "./pages/NewForumPost";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminEvents from "./pages/admin/AdminEvents";
import EventForm from "./pages/admin/EventForm";
import AdminResources from "./pages/admin/AdminResources";
import ResourceForm from "./pages/admin/ResourceForm";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFoundingMembers from "./pages/admin/AdminFoundingMembers";
import AdminPublicRegistrations from "./pages/admin/AdminPublicRegistrations";
import AdminEventFeedback from "./pages/admin/AdminEventFeedback";
import AdminInternalRegistrations from "./pages/admin/AdminInternalRegistrations";
import AdminWebsiteSettings from "./pages/admin/AdminWebsiteSettings";
import AdminFAQs from "./pages/admin/AdminFAQs";
import AdminPaymentVerification from "./pages/admin/AdminPaymentVerification";
import Notice from "./pages/Notice";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import About from "./pages/About";
import PublicEvents from "./pages/PublicEvents";
import EventDetail from "./pages/EventDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Redirect authenticated users away from auth page
function AuthRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthRedirect />} />
            <Route path="/notice" element={<Notice />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<PublicEvents />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            <Route path="/dashboard/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/dashboard/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/dashboard/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
            <Route path="/dashboard/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/dashboard/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
            <Route path="/dashboard/forum/new" element={<ProtectedRoute><NewForumPost /></ProtectedRoute>} />
            <Route path="/dashboard/forum/:id" element={<ProtectedRoute><ForumPost /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
            <Route path="/admin/events/new" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
            <Route path="/admin/events/:id" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
            <Route path="/admin/resources" element={<ProtectedRoute><AdminResources /></ProtectedRoute>} />
            <Route path="/admin/resources/new" element={<ProtectedRoute><ResourceForm /></ProtectedRoute>} />
            <Route path="/admin/resources/:id" element={<ProtectedRoute><ResourceForm /></ProtectedRoute>} />
            <Route path="/admin/members" element={<ProtectedRoute><AdminMembers /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/notices" element={<ProtectedRoute><AdminNotices /></ProtectedRoute>} />
            <Route path="/admin/contacts" element={<ProtectedRoute><AdminContacts /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/founding-members" element={<ProtectedRoute><AdminFoundingMembers /></ProtectedRoute>} />
            <Route path="/admin/public-registrations" element={<ProtectedRoute><AdminPublicRegistrations /></ProtectedRoute>} />
            <Route path="/admin/event-feedback" element={<ProtectedRoute><AdminEventFeedback /></ProtectedRoute>} />
            <Route path="/admin/internal-registrations" element={<ProtectedRoute><AdminInternalRegistrations /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminWebsiteSettings /></ProtectedRoute>} />
            <Route path="/admin/faqs" element={<ProtectedRoute><AdminFAQs /></ProtectedRoute>} />
            <Route path="/admin/payment-verification" element={<ProtectedRoute><AdminPaymentVerification /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
