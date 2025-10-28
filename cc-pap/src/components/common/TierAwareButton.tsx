
import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown } from "lucide-react";

interface TierAwareButtonProps extends ButtonProps {
  isAtLimit: boolean;
  limitMessage: string;
  onLimitClick?: () => void;
}

export function TierAwareButton({ 
  isAtLimit, 
  limitMessage, 
  onLimitClick, 
  children, 
  onClick,
  ...props 
}: TierAwareButtonProps) {
  if (isAtLimit) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            {...props}
            disabled
            onClick={onLimitClick}
            className="relative"
          >
            <Crown className="h-3 w-3 mr-2 text-yellow-600" />
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{limitMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button {...props} onClick={onClick}>
      {children}
    </Button>
  );
}
