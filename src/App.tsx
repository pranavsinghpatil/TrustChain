import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CustomCursor from "./components/ui/CustomCursor";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Tenders from "./pages/Tenders";
import TenderDetails from "./pages/TenderDetails";
import CreateTender from "./pages/CreateTender";
import SubmitBid from "./pages/SubmitBid";
import MyBids from "./pages/MyBids";
import ManageOfficers from "./pages/ManageOfficers";
import Reports from "./pages/Reports";
import Approvals from "./pages/Approvals";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

import "./App.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        {/* Background Glow */}
        <CustomCursor />
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <div className="glow-bg" />
          <div className="flex flex-col min-h-screen">
            {/* Premium god-rays background effect */}
            <div className="bg-god-rays" aria-hidden="true"></div>
            {/* Extra dark overlay for more contrast */}
            <div className="bg-darken-overlay" aria-hidden="true"></div>
            <NavBar />
            <div className="main-content">
              <main className="flex-grow mt-16">
                <Routes>
                  {/* Public route */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Protected routes for all authenticated users */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/tenders" element={
                    <ProtectedRoute>
                      <Tenders />
                    </ProtectedRoute>
                  } />
                  <Route path="/tenders/:id" element={
                    <ProtectedRoute>
                      <TenderDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  
                  {/* Bidder-specific routes */}
                  <Route path="/tenders/:id/bid" element={
                    <ProtectedRoute allowedRoles={["bidder"]}>
                      <SubmitBid />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-bids" element={
                    <ProtectedRoute allowedRoles={["bidder"]}>
                      <MyBids />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin and Officer routes */}
                  <Route path="/create-tender" element={
                    <ProtectedRoute allowedRoles={["officer"]}>
                      <CreateTender />
                    </ProtectedRoute>
                  } />
                  <Route path="/approvals" element={
                    <ProtectedRoute allowedRoles={["officer"]}>
                      <Approvals />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin-only routes */}
                  <Route path="/manage-officers" element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <ManageOfficers />
                    </ProtectedRoute>
                  } />
                  
                  {/* Not found route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
