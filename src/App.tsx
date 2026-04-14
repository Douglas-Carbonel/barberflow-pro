import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import Agenda from "@/pages/Agenda";
import Clientes from "@/pages/Clientes";
import Servicos from "@/pages/Servicos";
import Profissionais from "@/pages/Profissionais";
import Metas from "@/pages/Metas";
import Relatorios from "@/pages/Relatorios";
import Financeiro from "@/pages/Financeiro";
import Assinaturas from "@/pages/Assinaturas";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="profissionais" element={<Profissionais />} />
            <Route path="metas" element={<Metas />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="assinaturas" element={<Assinaturas />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
