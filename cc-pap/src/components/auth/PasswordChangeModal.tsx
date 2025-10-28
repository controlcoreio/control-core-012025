import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { cn } from "@/lib/utils";
import { SecureStorage } from "@/utils/secureStorage";
import { APP_CONFIG } from "@/config/app";

interface PasswordChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: number;
  username?: string;
  currentPassword?: string;
  isAdminChange?: boolean;
  onSuccess?: () => void;
}

export function PasswordChangeModal({
  open,
  onOpenChange,
  userId,
  username,
  currentPassword,
  isAdminChange = false,
  onSuccess
}: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pwd: string) => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    return requirements;
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordRequirements = validatePassword(newPassword);
  const allRequirementsMet = Object.values(passwordRequirements).every(req => req);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError("");
    
    if (newPassword !== confirmPassword) {
      setPasswordChangeError("Passwords do not match");
      return;
    }
    
    if (!allRequirementsMet) {
      setPasswordChangeError("Please meet all password requirements");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = SecureStorage.getItem('access_token');
      
      // Different endpoints for admin change vs self change
      const endpoint = isAdminChange 
        ? `${APP_CONFIG.api.baseUrl}/auth/users/${userId}/change-password`
        : `${APP_CONFIG.api.baseUrl}/auth/change-password`;
      
      const body = isAdminChange
        ? { new_password: newPassword }
        : { current_password: currentPassword, new_password: newPassword };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to change password');
      }
      
      // Clear the force_password_change flag for self-change
      if (!isAdminChange) {
        SecureStorage.removeItem('force_password_change');
      }
      
      // Reset form
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChangeError("");
      
      // Call success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else if (!isAdminChange) {
        window.location.href = '/';
      }
    } catch (err: any) {
      setPasswordChangeError(err.message || "Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Only allow closing for admin changes, not for forced password changes
    if (isAdminChange) {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChangeError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isAdminChange ? onOpenChange : undefined}>
      <DialogContent 
        className="sm:max-w-lg" 
        onInteractOutside={(e) => !isAdminChange && e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">
            {isAdminChange ? `Change Password for ${username}` : "Change Your Password"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isAdminChange 
              ? `Set a new password for user ${username}. They will be able to use this password on their next login.`
              : 'For security reasons, you must change your password before continuing. The default password "SecurePass2025!" must be changed.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handlePasswordChange} className="space-y-6 pt-2">
          {/* New Password Field */}
          <div className="space-y-3">
            <Label htmlFor="new-password" className="text-sm font-semibold">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                <EnterpriseIcon 
                  name={showNewPassword ? "eye-slash" : "eye"} 
                  size={16}
                  className="text-muted-foreground"
                />
              </Button>
            </div>
            
            {/* Password Requirements */}
            <div className="space-y-2 bg-muted/50 rounded-md p-3">
              <p className="text-xs font-medium text-muted-foreground">Password Requirements:</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <div className={cn("flex items-center gap-2", passwordRequirements.length ? "text-green-600" : "text-muted-foreground")}>
                  <EnterpriseIcon name={passwordRequirements.length ? "check" : "circle"} size={12} />
                  <span>At least 8 characters</span>
                </div>
                <div className={cn("flex items-center gap-2", passwordRequirements.uppercase ? "text-green-600" : "text-muted-foreground")}>
                  <EnterpriseIcon name={passwordRequirements.uppercase ? "check" : "circle"} size={12} />
                  <span>One uppercase letter (A-Z)</span>
                </div>
                <div className={cn("flex items-center gap-2", passwordRequirements.lowercase ? "text-green-600" : "text-muted-foreground")}>
                  <EnterpriseIcon name={passwordRequirements.lowercase ? "check" : "circle"} size={12} />
                  <span>One lowercase letter (a-z)</span>
                </div>
                <div className={cn("flex items-center gap-2", passwordRequirements.number ? "text-green-600" : "text-muted-foreground")}>
                  <EnterpriseIcon name={passwordRequirements.number ? "check" : "circle"} size={12} />
                  <span>One number (0-9)</span>
                </div>
                <div className={cn("flex items-center gap-2", passwordRequirements.special ? "text-green-600" : "text-muted-foreground")}>
                  <EnterpriseIcon name={passwordRequirements.special ? "check" : "circle"} size={12} />
                  <span>One special character (!@#$%...)</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Confirm Password Field */}
          <div className="space-y-3">
            <Label htmlFor="confirm-password" className="text-sm font-semibold">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <EnterpriseIcon 
                  name={showConfirmPassword ? "eye-slash" : "eye"} 
                  size={16}
                  className="text-muted-foreground"
                />
              </Button>
            </div>
            
            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className={cn(
                "flex items-center gap-2 text-xs",
                passwordsMatch ? "text-green-600" : "text-destructive"
              )}>
                <EnterpriseIcon 
                  name={passwordsMatch ? "check-circle" : "exclamation-triangle"} 
                  size={14}
                />
                <span>
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </span>
              </div>
            )}
          </div>
          
          {/* Error Message */}
          {passwordChangeError && (
            <Alert variant="destructive">
              <EnterpriseIcon name="exclamation-triangle" size={16} />
              <AlertDescription>{passwordChangeError}</AlertDescription>
            </Alert>
          )}
          
          {/* Submit Button */}
          <div className="flex gap-3">
            {isAdminChange && (
              <Button 
                type="button" 
                variant="outline"
                className="flex-1" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              className={isAdminChange ? "flex-1" : "w-full"}
              disabled={isLoading || !passwordsMatch || !allRequirementsMet}
            >
              {isLoading ? "Changing Password..." : "Change Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

