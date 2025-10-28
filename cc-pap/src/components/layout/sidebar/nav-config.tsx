
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { APP_CONFIG } from "@/config/app";

// Icon wrapper components for navigation
const HomeIcon = () => <EnterpriseIcon name="home" size={18} />;
const DatabaseIcon = () => <EnterpriseIcon name="database" size={18} />;
const ShieldIcon = () => <EnterpriseIcon name="shield" size={18} />;
const TestTubeIcon = () => <EnterpriseIcon name="test-tube" size={18} />;
const ClipboardIcon = () => <EnterpriseIcon name="clipboard" size={18} />;
const SettingsIcon = () => <EnterpriseIcon name="settings" size={18} />;
const CreditCardIcon = () => <EnterpriseIcon name="credit-card" size={18} />;
const BookIcon = () => <EnterpriseIcon name="book" size={18} />;
const ShieldCheckIcon = () => <EnterpriseIcon name="shield" size={18} />;

export const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Home",
        url: "/",
        icon: HomeIcon,
      },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      {
        title: "Bouncer Management",
        url: "/settings/peps",
        icon: ShieldIcon,
      },
      {
        title: "Protected Resources",
        url: "/settings/resources",
        icon: DatabaseIcon,
      },
    ],
  },
  {
    title: "Control Management",
    items: [
      {
        title: "Controls",
        url: "/policies",
        icon: ShieldIcon,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Test Console",
        url: "/test",
        icon: TestTubeIcon,
      },
      {
        title: "Audit Logs",
        url: "/audit",
        icon: ClipboardIcon,
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        title: "Settings",
        url: "/settings",
        icon: SettingsIcon,
      },
      ...(APP_CONFIG.deployment.type === 'hosted-saas' ? [{
        title: "Subscription & Plan",
        url: "/settings/subscription",
        icon: CreditCardIcon,
      }] : []),
      ...(APP_CONFIG.deployment.type === 'self-deployed' ? [{
        title: "License & Deployment",
        url: "/settings/license",
        icon: ShieldCheckIcon,
      }] : []),
      {
        title: "Knowledge Base",
        url: "/knowledge",
        icon: BookIcon,
      },
    ],
  },
];
