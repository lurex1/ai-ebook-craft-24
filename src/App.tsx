import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { CookiesBanner } from "@/components/CookiesBanner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NewProject from "./pages/NewProject";
import Editor from "./pages/Editor";
import Legal from "./pages/Legal";
import Pricing from "./pages/Pricing";
import Publish from "./pages/Publish";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/new" element={<NewProject />} />
            <Route path="/editor/:id" element={<Editor />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/terms" element={<Legal />} />
            <Route path="/privacy" element={<Legal />} />
            <Route path="/cookies" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookiesBanner />
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
