
import { useState, useEffect } from "react";
import { SecureStorage } from "@/utils/secureStorage";
import { ErrorHandler } from "@/utils/errorHandling";

export function CompanyLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Load company logo from secure storage
      const savedLogo = SecureStorage.getItem('companyLogo');
      setLogoUrl(savedLogo);

      // Listen for storage changes to update logo when changed in another tab
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'companyLogo') {
          try {
            const newLogo = SecureStorage.getItem('companyLogo');
            setLogoUrl(newLogo);
          } catch (error) {
            ErrorHandler.logError(error, 'logo-storage-update');
            setLogoUrl(null);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    } catch (error) {
      ErrorHandler.logError(error, 'logo-load');
    }
  }, []);

  if (!logoUrl) return null;

  return (
    <div className="flex items-center">
      <div className="h-8 w-auto max-w-[120px] flex items-center">
        <img 
          src={logoUrl} 
          alt="Company Logo" 
          className="max-h-8 max-w-full object-contain"
          onError={(e) => {
            ErrorHandler.logError(new Error('Logo failed to load'), 'logo-display');
            setLogoUrl(null);
          }}
        />
      </div>
      <div className="h-6 w-px bg-border mx-3" />
    </div>
  );
}
