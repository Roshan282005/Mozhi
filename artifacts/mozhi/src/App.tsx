import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import NotFound from "@/pages/not-found";

import HomePage from "@/app/page";
import CompanionsPage from "@/app/(public)/companions/page";
import CompanionDetailPage from "@/app/(public)/companions/[id]/page";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import DashboardPage from "@/app/dashboard/page";
import CoursesPage from "@/app/courses/page";
import TeacherPage from "@/app/teacher/page";
import AdminPage from "@/app/admin/page";
import MessagesPage from "@/app/(explorer)/messages/page";
import SessionsPage from "@/app/(explorer)/sessions/page";
import SubscriptionsPage from "@/app/(explorer)/subscriptions/page";
import AvailabilityPage from "@/app/(companion)/availability/page";
import OfflinePage from "@/app/offline/page";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/companions" component={CompanionsPage} />
      <Route path="/companions/:id" component={CompanionDetailPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/teacher" component={TeacherPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/sessions" component={SessionsPage} />
      <Route path="/subscriptions" component={SubscriptionsPage} />
      <Route path="/availability" component={AvailabilityPage} />
      <Route path="/offline" component={OfflinePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
