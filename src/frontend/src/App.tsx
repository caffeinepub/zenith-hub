import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import AIAssistantPage from "./pages/AIAssistantPage";
import DashboardPage from "./pages/DashboardPage";
import FinanceTrackerPage from "./pages/FinanceTrackerPage";
import FocusTimerPage from "./pages/FocusTimerPage";
import LoginPage from "./pages/LoginPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import TripDetailPage from "./pages/TripDetailPage";
import TripManagerPage from "./pages/TripManagerPage";

function AppRoot() {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing || (isAuthenticated && profileLoading && !isFetched)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground font-medium">
            Loading Zenith Hub...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (showProfileSetup) {
    return <ProfileSetupPage />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const rootRoute = createRootRoute({
  component: AppRoot,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const studyPlannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/study-planner",
  component: StudyPlannerPage,
});

const focusTimerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/focus-timer",
  component: FocusTimerPage,
});

const financeTrackerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/finance",
  component: FinanceTrackerPage,
});

const aiAssistantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ai-assistant",
  component: AIAssistantPage,
});

const tripManagerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trip-manager",
  component: TripManagerPage,
});

const tripDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trip-manager/$tripId",
  component: TripDetailPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  studyPlannerRoute,
  focusTimerRoute,
  financeTrackerRoute,
  aiAssistantRoute,
  tripManagerRoute,
  tripDetailRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
