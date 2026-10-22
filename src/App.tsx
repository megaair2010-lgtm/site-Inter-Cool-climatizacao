import { useEffect } from "react";
import { Router, matchPath, useRouter } from "./lib/router";
import { Footer, Header } from "./components/layout/Layout";
import { ChatBot } from "./components/chat/ChatBot";
import { HomePage } from "./pages/HomePage";
import { ServicesPage } from "./pages/ServicesPage";
import { ServiceDetailPage } from "./pages/ServiceDetailPage";
import { SolutionsPage } from "./pages/SolutionsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { AboutPage } from "./pages/AboutPage";
import { FaqPage } from "./pages/FaqPage";
import { ContactPage } from "./pages/ContactPage";
import { QuotePage } from "./pages/QuotePage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LocalBusinessSchema } from "./components/seo/LocalBusinessSchema";
import { initAnalytics } from "./lib/analytics";

function Routes() {
  const { path } = useRouter();
  const p = path.replace(/\/+$/, "") || "/";
  const detail = matchPath("/servicos/:slug", p);
  if (detail) return <ServiceDetailPage key={detail.slug} slug={detail.slug} />;
  switch (p) {
    case "/": return <HomePage />;
    case "/servicos": return <ServicesPage />;
    case "/solucoes": return <SolutionsPage />;
    case "/projetos": return <ProjectsPage />;
    case "/sobre": return <AboutPage />;
    case "/faq": return <FaqPage />;
    case "/contato": return <ContactPage />;
    case "/orcamento": return <QuotePage />;
    case "/politica-de-privacidade": return <PrivacyPage />;
    default: return <NotFoundPage />;
  }
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export default function App() {
  useEffect(() => initAnalytics(), []);
  const mode = env.VITE_ROUTER_MODE === "memory" ? "memory" : "history";
  return (
    <Router mode={mode}>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Pular para o conteúdo</a>
      <Header />
      <main id="conteudo">
        <Routes />
      </main>
      <Footer />
      <ChatBot />
      <LocalBusinessSchema />
    </Router>
  );
}
