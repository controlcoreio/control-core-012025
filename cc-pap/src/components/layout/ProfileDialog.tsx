
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const { theme } = useTheme();

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View your account information below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Name:</dt>
            <dd className="col-span-2 text-sm">{user.name}</dd>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Email:</dt>
            <dd className="col-span-2 text-sm">{user.email}</dd>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Role:</dt>
            <dd className="col-span-2 text-sm">{user.role}</dd>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Login Method:</dt>
            <dd className="col-span-2 text-sm">Password</dd>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Account Status:</dt>
            <dd className="col-span-2 text-sm">Active</dd>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Last Login:</dt>
            <dd className="col-span-2 text-sm">
              {format(user.lastLogin, "PPpp")}
            </dd>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <dt className="text-sm font-medium text-muted-foreground">Appearance:</dt>
            <dd className="col-span-2 text-sm">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</dd>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
