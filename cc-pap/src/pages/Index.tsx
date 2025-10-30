
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PoliciesPage } from "@/components/policies/PoliciesPage";
import { PolicyEnvironmentsPage } from "@/components/policies/PolicyEnvironmentsPage";
import { PolicyTemplatesPage } from "@/components/policies/PolicyTemplatesPage";
import PIPsPage from "@/components/pips/PIPsPage";
import { AuditLogPage } from "@/components/audit/AuditLogPage";
import { MinimalSettingsPage } from "@/components/settings/MinimalSettingsPage";
import { GeneralSettingsPage } from "@/components/settings/GeneralSettingsPage";
import { EnvironmentSettingsPage } from "@/components/settings/EnvironmentSettingsPage";
import { DataSourcesPage } from "@/components/settings/DataSourcesPage";
import { EnhancedResourcesPage } from "@/components/settings/EnhancedResourcesPage";
import { PEPManagementPage } from "@/components/settings/pep/PEPManagementPage";
import { PolicyRepositorySettings } from "@/components/settings/PolicyRepositorySettings";
import UserManagementPage from "@/components/settings/UserManagementPage";
import { NotificationsPage } from "@/components/settings/NotificationsPage";
import { SubscriptionPlanPage } from "@/components/settings/SubscriptionPlanPage";
import { TestConsole } from "@/components/testing/TestConsole";
import { KnowledgePage } from "@/components/knowledge/KnowledgePage";
import { GettingStartedOverview } from "@/components/onboarding/GettingStartedOverview";
import { GettingStartedWizard } from "@/components/onboarding/GettingStartedWizard";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Component to safely render components with error boundaries
const SafeComponent = ({ component: Component, ...props }: any) => (
  <ErrorBoundary>
    <Component {...props} />
  </ErrorBoundary>
);

export default function Index() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SafeComponent component={GettingStartedOverview} />} />
        <Route path="/getting-started/wizard" element={<SafeComponent component={GettingStartedWizard} />} />
        <Route path="/policies" element={<SafeComponent component={PoliciesPage} />} />
        <Route path="/policies/environments" element={<SafeComponent component={PolicyEnvironmentsPage} />} />
        <Route path="/policies/templates" element={<SafeComponent component={PolicyTemplatesPage} />} />
        <Route path="/audit" element={<SafeComponent component={AuditLogPage} />} />
        <Route path="/settings" element={<SafeComponent component={MinimalSettingsPage} />} />
        <Route path="/settings/environments" element={<SafeComponent component={EnvironmentSettingsPage} />} />
        <Route path="/settings/peps" element={<SafeComponent component={PEPManagementPage} />} />
        <Route path="/settings/resources" element={<SafeComponent component={EnhancedResourcesPage} />} />
        <Route path="/settings/controls-repository" element={<SafeComponent component={PolicyRepositorySettings} />} />
        <Route path="/settings/users" element={<SafeComponent component={UserManagementPage} />} />
        <Route path="/settings/notifications" element={<SafeComponent component={NotificationsPage} />} />
        <Route path="/settings/subscription" element={<SafeComponent component={SubscriptionPlanPage} />} />
        <Route path="/settings/general" element={<SafeComponent component={GeneralSettingsPage} />} />
        <Route path="/settings/data-sources" element={<SafeComponent component={DataSourcesPage} />} />
        <Route path="/test" element={<SafeComponent component={TestConsole} />} />
        <Route path="/knowledge" element={<SafeComponent component={KnowledgePage} />} />
      </Routes>
    </Layout>
  );
}
