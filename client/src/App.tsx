import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chamber from "./pages/Chamber";
import ChamberAuth from "./pages/ChamberAuth";
import OracleLLMTest from "./pages/OracleLLMTest";
import Letters from "./pages/Letters";


function ProtectedChamber() {
  const isAuthenticated = sessionStorage.getItem('chamberAuth') === 'true';
  return isAuthenticated ? <Chamber /> : <ChamberAuth />;
}

function ProtectedLetters() {
  const isAuthenticated = sessionStorage.getItem('chamberAuth') === 'true';
  return isAuthenticated ? <Letters /> : <ChamberAuth />;
}

function ChamberAccessButton() {
  const [location, navigate] = useLocation();
  
  // Don't show on chamber or letters pages
  if (location.startsWith('/chamber') || location.startsWith('/letters')) return null;
  
  const handleChamberAccess = () => {
    navigate('/chamber');
  };

  return (
    <button
      onClick={handleChamberAccess}
      className="fixed bottom-4 left-4 z-50 opacity-30 hover:opacity-100 transition-all duration-300 text-white/60 hover:text-white text-xs tracking-widest font-bold px-4 py-2 rounded border border-white/20 hover:border-white/50 bg-black/40 hover:bg-black/60 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
      title="Access the Inner Chamber (password: oracle)"
    >
      ◆ CHAMBER
    </button>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/chamber"} component={ProtectedChamber} />
      <Route path={"/chamber-auth"} component={ChamberAuth} />
      <Route path={"/letters"} component={ProtectedLetters} />
      <Route path={"/oracle-test"} component={OracleLLMTest} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChamberAccessButton />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
