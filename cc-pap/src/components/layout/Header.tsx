
import { UserMenu } from "./UserMenu";
import { NotificationCenter } from "./NotificationCenter";
import { Help } from "./Help";
import { EnvironmentSelector } from "@/components/common/EnvironmentSelector";
import { CompanyLogo } from "./CompanyLogo";

export function Header() {
  return (
    <header className="h-14 border-b bg-card flex items-center px-6 justify-between">
      <div className="flex items-center gap-4">
        <CompanyLogo />
        <EnvironmentSelector />
      </div>
      <div className="flex items-center gap-2">
        <Help />
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
