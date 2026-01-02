import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Sidebar from "./components/layout/Sidebar";
import RightSidebar from "./components/layout/RightSidebar";

import HomePage from "./pages/HomePage";
import PrayerRequestsPage from "./pages/PrayerRequestsPage";
import SermonsPage from "./pages/SermonsPage";
import SingleSermonPage from "./pages/SingleSermonPage";
import MinistriesPage from "./pages/MinistriesPage";
import SingleMinistryPage from "./pages/SingleMinistryPage";
import EventsPage from "./pages/EventsPage";
import SingleEventPage from "./pages/SingleEventPage";
import DonatePage from "./pages/DonatePage";
import ContactPage from "./pages/ContactPage";
import BlogPage from "./pages/BlogPage";
import SingleBlogPostPage from "./pages/SingleBlogPostPage";
import NewsPage from "./pages/NewsPage";
import SingleNewsPage from "./pages/SingleNewsPage";
import ProfilePage from "./pages/ProfilePage";
import AboutPage from "./pages/AboutPage";
import BranchesPage from "./pages/BranchesPage";
import MediaPage from "./pages/MediaPage";
import EventCalendarPage from "./pages/EventCalendarPage";
import ChurchHistoryPage from "./pages/ChurchHistoryPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FellowshipProgramDetailPage from "./pages/FellowshipProgramDetailPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import CommunityPage from "./pages/CommunityPage";
import ChatPage from "./pages/ChatPage";

// Admin
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminDashboardOverview from "./pages/admin/AdminDashboardOverview";
import ManageUsersPage from "./pages/admin/ManageUsersPage";
import ManageSermonsPage from "./pages/admin/ManageSermonsPage";
import { ManageEventsPage } from "./pages/admin/ManageEventsPage";
import ManageMinistriesPage from "./pages/admin/ManageMinistriesPage";
import ManageBlogPostsPage from "./pages/admin/ManageBlogPostsPage";
import ManageNewsPage from "./pages/admin/ManageNewsPage";
import ManageHomeSlidesPage from "./pages/admin/ManageHomeSlidesPage";
import ManageDirectMediaPage from "./pages/admin/ManageDirectMediaPage";
import AdminActivityLogPage from "./pages/admin/AdminActivityLogPage";
import ManageAboutSectionsPage from "./pages/admin/ManageAboutSectionsPage";
import ManageKeyPersonsPage from "./pages/admin/ManageKeyPersonsPage";
import ManageHistoryPage from "./pages/admin/ManageHistoryPage";
import ManageChurchHistoryPage from "./pages/admin/ManageChurchHistoryPage";
import ManageDonationsPage from "./pages/admin/ManageDonationsPage";
import ManageDonatePage from "./pages/admin/ManageDonatePage";
import { ManageCollectionRecordsPage } from "./pages/admin/ManageCollectionRecordsPage";
import ManageContactMessagesPage from "./pages/admin/ManageContactMessagesPage";
import ManageBranchChurchesPage from "./pages/admin/ManageBranchChurchesPage";
import ManageMinistryJoinRequestsPage from "./pages/admin/ManageMinistryJoinRequestsPage";
import ManageMonthlyThemeImagesPage from "./pages/admin/ManageMonthlyThemeImagesPage";
import SeoToolsPage from "./pages/admin/SeoToolsPage";
import ManageAdvertisementsPage from "./pages/admin/ManageAdvertisementsPage";
import ManagePrayerRequestsPage from "./pages/admin/ManagePrayerRequestsPage";
import ManageTestimonialsPage from "./pages/admin/ManageTestimonialsPage";
import FinancialSummaryPage from "./pages/admin/FinancialSummaryPage";

// New Admin Pages for Church Management
import ManageChurchMembersPage from "./pages/admin/ManageChurchMembersPage";
import ManageMeetingsPage from "./pages/admin/ManageMeetingsPage";
import ManageDecisionsPage from "./pages/admin/ManageDecisionsPage";
import ManageExpensesPage from "./pages/admin/ManageExpensesPage";
import ManageFellowshipSchedulesPage from "./pages/admin/ManageFellowshipSchedulesPage";

// Chatbot components
import ChatbotFab from "./components/chatbot/ChatbotFab";
import ChatbotPanel from "./components/chatbot/ChatbotPanel";

const AppContent: React.FC = () => {
  const location = useLocation();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      console.log("beforeinstallprompt event fired");
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const handleAppInstalled = () => {
      console.log("PWA was installed");
      setInstallPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await (installPrompt as any).prompt();
    const { outcome } = await (installPrompt as any).userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
    setInstallPrompt(null);
  };

  const isAdminPage = location.pathname.startsWith("/admin");
  const isChatPage = location.pathname.startsWith("/chat");
  const showSidebar = !isAdminPage && !isChatPage;

  return (
    <div className="flex flex-col min-h-screen text-slate-800 font-sans">
      <Header installPrompt={installPrompt} onInstallClick={handleInstallClick} />
      <div className="flex-grow container mx-auto flex flex-row">
        {showSidebar && <Sidebar />}
        <main className="flex-grow min-w-0 p-0 sm:p-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/updates" element={<PrayerRequestsPage />} />

            <Route path="/sermons" element={<SermonsPage />} />
            <Route path="/sermons/:sermonId" element={<SingleSermonPage />} />

            <Route path="/ministries" element={<MinistriesPage />} />
            <Route path="/ministries/:ministryId" element={<SingleMinistryPage />} />

            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<SingleEventPage />} />
            <Route path="/event-calendar" element={<EventCalendarPage />} />

            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:blogPostId" element={<SingleBlogPostPage />} />

            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:newsItemId" element={<SingleNewsPage />} />

            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/media" element={<MediaPage />} />

            <Route path="/donate" element={<DonatePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/church-history" element={<ChurchHistoryPage />} />
            <Route
              path="/fellowship-program/:itemType/:itemId"
              element={<FellowshipProgramDetailPage />}
            />

            <Route
              path="/community"
              element={<ProtectedRoute element={<CommunityPage />} />}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute element={<ProfilePage />} />}
            />
            <Route path="/profile/:userId" element={<PublicProfilePage />} />
            <Route
              path="/chat/:userId"
              element={<ProtectedRoute element={<ChatPage />} />}
            />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true} element={<AdminDashboardPage />} />
              }
            >
              <Route index element={<AdminDashboardOverview />} />
              <Route path="manage-sermons" element={<ManageSermonsPage />} />
              <Route path="manage-events" element={<ManageEventsPage />} />
              <Route path="manage-ministries" element={<ManageMinistriesPage />} />
              <Route path="manage-blog" element={<ManageBlogPostsPage />} />
              <Route path="manage-news" element={<ManageNewsPage />} />
              <Route path="manage-home-slides" element={<ManageHomeSlidesPage />} />
              <Route path="manage-direct-media" element={<ManageDirectMediaPage />} />
              <Route
                path="manage-theme-images"
                element={<ManageMonthlyThemeImagesPage />}
              />
              <Route
                path="manage-about-sections"
                element={<ManageAboutSectionsPage />}
              />
              <Route path="manage-key-persons" element={<ManageKeyPersonsPage />} />
              <Route path="manage-history" element={<ManageHistoryPage />} />
              <Route
                path="manage-church-history"
                element={<ManageChurchHistoryPage />}
              />
              <Route path="manage-branches" element={<ManageBranchChurchesPage />} />

              <Route path="manage-members" element={<ManageChurchMembersPage />} />
              <Route path="manage-meetings" element={<ManageMeetingsPage />} />
              <Route path="manage-decisions" element={<ManageDecisionsPage />} />
              <Route path="manage-expenses" element={<ManageExpensesPage />} />
              <Route
                path="manage-collection-records"
                element={<ManageCollectionRecordsPage />}
              />
              <Route
                path="manage-fellowship-schedules"
                element={<ManageFellowshipSchedulesPage />}
              />
              <Route
                path="manage-advertisements"
                element={<ManageAdvertisementsPage />}
              />
              <Route
                path="manage-prayer-requests"
                element={<ManagePrayerRequestsPage />}
              />
              <Route
                path="manage-testimonials"
                element={<ManageTestimonialsPage />}
              />
              <Route
                path="manage-donate-page"
                element={<ManageDonatePage />}
              />
              <Route path="financial-summary" element={<FinancialSummaryPage />} />

              <Route path="donation-records" element={<ManageDonationsPage />} />
              <Route
                path="contact-messages"
                element={<ManageContactMessagesPage />}
              />
              <Route
                path="ministry-join-requests"
                element={<ManageMinistryJoinRequestsPage />}
              />
              <Route path="users" element={<ManageUsersPage />} />
              <Route path="seo-tools" element={<SeoToolsPage />} />
              <Route path="activity-log" element={<AdminActivityLogPage />} />
            </Route>
          </Routes>
        </main>
        {showSidebar && <RightSidebar />}
      </div>

      {!isChatPage && (
        <div className="w-full">
          <Footer />
        </div>
      )}

      <ChatbotFab
        onToggle={() => setIsChatbotOpen((prev) => !prev)}
        isOpen={isChatbotOpen}
      />
      {isChatbotOpen && (
        <ChatbotPanel onClose={() => setIsChatbotOpen(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  // ✅ No providers here, no Router here.
  // All providers + BrowserRouter are in src/index.tsx
  return <AppContent />;
};

export default App;


