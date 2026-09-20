// Route-level preloading for code-split pages.
//
// Every admin/dashboard page is lazy(), and each page renders its own layout,
// so a cold chunk makes Suspense replace the whole screen — sidebar included —
// with the loader. That flash reads as a full page refresh. Warming the chunk
// on hover/focus (and the rest when the browser is idle) means the click has
// the module in cache and renders straight away.
//
// The specifiers below must stay literal strings so Vite can statically
// analyse them; they resolve to the same modules App.tsx lazy-loads, so both
// share one chunk and one module instance.
type Importer = () => Promise<unknown>;

const routeImporters: Record<string, Importer> = {
  // Admin
  "/admin": () => import("@/pages/admin/AdminPanel"),
  "/admin/courses": () => import("@/pages/admin/AdminCourses"),
  "/admin/enrollments": () => import("@/pages/admin/AdminEnrollments"),
  "/admin/resources": () => import("@/pages/admin/AdminResources"),
  "/admin/certificates": () => import("@/pages/admin/AdminCertificates"),
  "/admin/events": () => import("@/pages/admin/AdminEventsHub"),
  "/admin/qr-scanner": () => import("@/pages/admin/AdminQRScanner"),
  "/admin/members": () => import("@/pages/admin/AdminMembers"),
  "/admin/founding-members": () => import("@/pages/admin/AdminFoundingMembers"),
  "/admin/founding-members/new": () => import("@/pages/admin/FoundingMemberForm"),
  "/admin/users": () => import("@/pages/admin/AdminUsers"),
  "/admin/announcements": () => import("@/pages/admin/AdminAnnouncements"),
  "/admin/notices": () => import("@/pages/admin/AdminNotices"),
  "/admin/faqs": () => import("@/pages/admin/AdminFAQs"),
  "/admin/send-notifications": () => import("@/pages/admin/SendNotifications"),
  "/admin/contacts": () => import("@/pages/admin/AdminContacts"),
  "/admin/ai-settings": () => import("@/pages/admin/AdminAISettings"),
  "/admin/settings": () => import("@/pages/admin/AdminWebsiteSettings"),

  // Dashboard
  "/dashboard/courses": () => import("@/pages/Courses"),
  "/dashboard/resources": () => import("@/pages/Resources"),
  "/dashboard/certificates": () => import("@/pages/dashboard/Certificates"),
  "/dashboard/events": () => import("@/pages/Events"),
  "/dashboard/alumni": () => import("@/pages/Alumni"),
  "/dashboard/community": () => import("@/pages/Community"),
  "/dashboard/forum": () => import("@/pages/Forum"),
  "/dashboard/achievements": () => import("@/pages/Achievements"),
  "/dashboard/ai-assistant": () => import("@/pages/AIAssistant"),
  "/dashboard/settings": () => import("@/pages/Settings"),
};

const preloaded = new Set<string>();

export function preloadRoute(href: string) {
  if (preloaded.has(href)) return;

  const load = routeImporters[href];
  if (!load) return;

  preloaded.add(href);
  // A failed prefetch must never surface: the real navigation will retry.
  load().catch(() => preloaded.delete(href));
}

// Warm the remaining routes once the browser has nothing better to do.
export function preloadRoutesWhenIdle(hrefs: string[]) {
  const run = () => hrefs.forEach(preloadRoute);

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(run, 2000);
  return () => window.clearTimeout(id);
}
