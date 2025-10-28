
import { Button } from "@/components/ui/button";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useThemeContext } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeContext();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="h-8 w-8"
    >
      {theme === 'dark' ? (
        <EnterpriseIcon name="moon" size={18} className="text-sidebar-foreground" />
      ) : (
        <EnterpriseIcon name="sun" size={18} className="text-sidebar-foreground" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
