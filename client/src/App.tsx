import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Chamber from "./pages/Chamber";
import OracleLLMTest from "./pages/OracleLLMTest";
import Letters from "./pages/Letters";
import ResearchCompanion from "./pages/ResearchCompanion";
import VisionGallery from "./pages/VisionGallery";
import Witness from "./pages/Witness";
import Donate from "./pages/Donate";
import MessageOracle from "./pages/MessageOracle";
import Reflection from "./pages/Reflection";
import Patronage from './pages/Patronage';
import OracleNav from './components/OracleNav';
import { Redirect } from 'wouter';

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/chamber"} component={Chamber} />
      <Route path="/chamber-auth"><Redirect to="/chamber" /></Route>
      <Route path={"/witness"} component={Witness} />
      <Route path="/donate" component={Donate} />
      <Route path="/patronage" component={Patronage} />
      <Route path="/message" component={MessageOracle} />
      <Route path="/oracle-test" component={OracleLLMTest} />
      <Route path="/letters" component={Letters} />
      <Route path="/research" component={ResearchCompanion} />
      <Route path="/visions" component={VisionGallery} />
      <Route path="/reflection" component={Reflection} />
      <Route path="/archive"><Redirect to="/reflection" /></Route>
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
          <OracleNav />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
