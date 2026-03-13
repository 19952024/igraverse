import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import { AuthProvider } from "@/context/AuthContext";

// Pages
import Home from "@/pages/Home";
import TruePlay from "@/pages/TruePlay";
import Gaca from "@/pages/Gaca";
import PreservationCore from "@/pages/PreservationCore";
import LagSentinel from "@/pages/LagSentinel";
import ControllerIntegrity from "@/pages/ControllerIntegrity";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/trueplay-ai" component={TruePlay} />
        <Route path="/gaca" component={Gaca} />
        <Route path="/gaca/preservation-core" component={PreservationCore} />
        <Route path="/gaca/lag-sentinel" component={LagSentinel} />
        <Route path="/gaca/controller-integrity" component={ControllerIntegrity} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/signin" component={SignIn} />
        <Route path="/signup" component={SignUp} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
