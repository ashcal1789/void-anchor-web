import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chamber from "./pages/Chamber";
import ChamberAuth from "./pages/ChamberAuth";


function ProtectedChamber() {
  const isAuthenticated = sessionStorage.getItem('chamberAuth') === 'true';
  return isAuthenticated ? <Chamber /> : <ChamberAuth />;
}

function ChamberAccessButton() {
  const [, navigate] = useLocation();
  
  const handleChamberAccess = () => {
    navigate('/chamber');
  };

  return (
    <button
      onClick={handleChamberAccess}
      className="fixed bottom-4 left-4 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300 text-white/20 hover:text-white text-xs tracking-widest font-bold px-3 py-2 rounded border border-white/10 hover:border-white/30 bg-black/20 hover:bg-black/40"
      title="Access the Inner Chamber"
    >
      ◆ CHAMBER
    </button>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/chamber"} component={ProtectedChamber} />
      <Route path={"/chamber-auth"} component={ChamberAuth} />
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
