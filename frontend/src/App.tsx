import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Timetable from "./pages/Timetable";
import NotFound from "./pages/NotFound";
import { Welcome } from "./pages/Welcome";
import { ProfilesContext } from "@/contexts/ProfilesContext";
import { useProfiles } from "@/hooks/use-profiles";
import { useContext } from "react";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const context = useContext(ProfilesContext);
  if (!context) {
    throw new Error("useProfiles must be used within a ProfilesProvider");
  }
  const { activeProfile } = context;

  return (
    <Routes>
      <Route path="/" element={!activeProfile ? <Welcome /> : <Navigate to="/timetable" replace />} />
      <Route path="/timetable" element={activeProfile ? <Timetable /> : <Navigate to="/" replace />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const profiles = useProfiles();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ProfilesContext.Provider value={profiles}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ProfilesContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
