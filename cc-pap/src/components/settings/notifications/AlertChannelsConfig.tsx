
import { useState } from "react";
import { Mail, MessageSquare, Wrench, Webhook, Plus, Settings, Trash2, TestTube } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  status: "active" | "inactive" | "error";
}

export function AlertChannelsConfig() {
  const [slackConnected, setSlackConnected] = useState(false);
  const [serviceNowConnected, setServiceNowConnected] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: "webhook-1",
      name: "SIEM Integration",
      url: "https://my-siem.com/webhook/controlcore",
      status: "active"
    }
  ]);

  const connectSlack = () => {
    // Simulate OAuth flow
    setTimeout(() => {
      setSlackConnected(true);
      toast.success("Successfully connected to Slack workspace");
    }, 1000);
  };

  const disconnectSlack = () => {
    setSlackConnected(false);
    toast.success("Disconnected from Slack");
  };

  const connectServiceNow = () => {
    // Would open ServiceNow configuration modal
    toast.info("ServiceNow configuration modal would open here");
  };

  const testWebhook = (webhookId: string) => {
    toast.success("Test webhook sent successfully");
  };

  const deleteWebhook = (webhookId: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== webhookId));
    toast.success("Webhook deleted");
  };

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email
          </CardTitle>
          <CardDescription>
            Email notifications are always enabled and sent to your registered email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default">Configured</Badge>
              <span className="text-sm text-muted-foreground">admin@example.com</span>
            </div>
            <Button variant="outline" size="sm">
              Edit Recipients
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slack Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Slack
          </CardTitle>
          <CardDescription>
            Receive alerts in your Slack workspace channels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slackConnected ? (
                <>
                  <Badge variant="default">Connected</Badge>
                  <span className="text-sm text-muted-foreground">My Company Workspace</span>
                </>
              ) : (
                <Badge variant="secondary">Not Configured</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {slackConnected ? (
                <>
                  <Button variant="outline" size="sm">
                    Manage Channels
                  </Button>
                  <Button variant="outline" size="sm" onClick={disconnectSlack}>
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button onClick={connectSlack} size="sm">
                  + Connect to Slack
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ServiceNow Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            ServiceNow
          </CardTitle>
          <CardDescription>
            Automatically create incidents in ServiceNow for critical alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {serviceNowConnected ? (
                <>
                  <Badge variant="default">Connected</Badge>
                  <span className="text-sm text-muted-foreground">company.service-now.com</span>
                </>
              ) : (
                <Badge variant="secondary">Not Configured</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {serviceNowConnected ? (
                <>
                  <Button variant="outline" size="sm">
                    Edit Configuration
                  </Button>
                  <Button variant="outline" size="sm">
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button onClick={connectServiceNow} size="sm">
                  + Connect to ServiceNow
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Webhook Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Custom Webhook
              </CardTitle>
              <CardDescription>
                Send alerts to custom webhook endpoints for integration with other tools.
              </CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-4">
              <Badge variant="secondary">Not Configured</Badge>
              <p className="text-sm text-muted-foreground mt-2">No webhooks configured</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Endpoint URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {webhook.url}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            webhook.status === "active" ? "default" : 
                            webhook.status === "error" ? "destructive" : "secondary"
                          }
                        >
                          {webhook.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => testWebhook(webhook.id)}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWebhook(webhook.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
