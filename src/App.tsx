import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import ClientsPage from "./pages/Clients";
import WorkPage from "./pages/Work";
import WorkDetailPage from "./pages/WorkDetail";
import Agents from "./pages/Agents";
import AgentChat from "./pages/AgentChat";
import UploadPage from "./pages/Upload";
import QueryPage from "./pages/Query";
import ApprovalsPage from "./pages/Approvals";
import ReportsPage from "./pages/Reports";
import CompliancePage from "./pages/Compliance";
import NotificationsPage from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useState, useCallback } from "react";
import SplashScreen from "./components/SplashScreen";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem("splash_shown");
    return !seen;
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem("splash_shown", "1");
    setShowSplash(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
              <Route path="/work" element={<ProtectedRoute><WorkPage /></ProtectedRoute>} />
              <Route path="/work/:id" element={<ProtectedRoute><WorkDetailPage /></ProtectedRoute>} />
              <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
              <Route path="/agents/:agentType" element={<ProtectedRoute><AgentChat /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
              <Route path="/query" element={<ProtectedRoute><QueryPage /></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
              <Route path="/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
