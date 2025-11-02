import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyDeliveries from "./pages/deliveries/MyDeliveries";
import NewDelivery from "./pages/deliveries/NewDelivery";
import DeliveryDetail from "./pages/deliveries/DeliveryDetail";
import YourTurn from "./pages/deliveries/YourTurn";
import Confirmed from "./pages/deliveries/Confirmed";
import InTransit from "./pages/deliveries/InTransit";
import Completed from "./pages/deliveries/Completed";
import Partners from "./pages/Partners";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<MyDeliveries />} />
            <Route path="/entregas/nova" element={<NewDelivery />} />
            <Route path="/entregas/:id" element={<DeliveryDetail />} />
            <Route path="/entregas/sua-vez" element={<YourTurn />} />
            <Route path="/entregas/confirmadas" element={<Confirmed />} />
            <Route path="/entregas/em-transito" element={<InTransit />} />
            <Route path="/entregas/concluidas" element={<Completed />} />
            <Route path="/parceiros" element={<Partners />} />
            <Route path="/equipe" element={<Team />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
