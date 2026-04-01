import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShoppingBag, Truck, Star, Shield } from "lucide-react";
import ShopPage from "@/pages/shop";
import ShippingPage from "@/pages/shipping";
import MembershipPage from "@/pages/membership";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const navItems = [
  { path: "/", label: "Shop", icon: ShoppingBag },
  { path: "/shipping", label: "Van chuyen", icon: Truck },
  { path: "/membership", label: "Membership", icon: Star },
  { path: "/admin", label: "Admin", icon: Shield },
];

function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom" data-testid="bottom-nav">
      <div className="flex items-stretch max-w-lg mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path} className="flex-1">
              <div
                className={`flex flex-col items-center justify-center py-2 px-1 gap-1 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-primary" : ""}`}>{label}</span>
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-8 bg-primary rounded-t-full" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <div className="pb-16">
        <Switch>
          <Route path="/" component={ShopPage} />
          <Route path="/shipping" component={ShippingPage} />
          <Route path="/membership" component={MembershipPage} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
