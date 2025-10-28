
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Help() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <EnterpriseIcon name="question-mark" size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <EnterpriseIcon name="book" size={20} className="text-primary" />
                Knowledge Base
              </CardTitle>
              <CardDescription>
                Learn about Control Core features, policy creation, and best practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/knowledge" onClick={() => setIsOpen(false)}>
                <Button className="w-full">
                  Access Documentation
                  <EnterpriseIcon name="link" size={16} className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <EnterpriseIcon name="chat" size={20} className="text-primary" />
                Discord Community
              </CardTitle>
              <CardDescription>
                Join our Discord community for support and discussions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="https://discord.gg/kjd9SGEn" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
              >
                <Button variant="outline" className="w-full">
                  Join Discord
                  <EnterpriseIcon name="link" size={16} className="ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <EnterpriseIcon name="book" size={20} className="text-primary" />
                Control Core Documentation
              </CardTitle>
              <CardDescription>
                Complete admin and developer user guides for Control Core
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href="https://docs.controlcore.io" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
              >
                <Button variant="outline" className="w-full">
                  View Documentation
                  <EnterpriseIcon name="external-link" size={16} className="ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
