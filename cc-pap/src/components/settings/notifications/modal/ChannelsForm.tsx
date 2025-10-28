
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChannelsFormProps {
  channels: {
    email: boolean;
    slack: boolean;
    serviceNow: boolean;
    webhook: boolean;
  };
  onChannelsChange: (channels: ChannelsFormProps['channels']) => void;
}

export function ChannelsForm({ channels, onChannelsChange }: ChannelsFormProps) {
  const updateChannel = (channel: keyof ChannelsFormProps['channels'], value: boolean) => {
    onChannelsChange({ ...channels, [channel]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Channels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={channels.email}
              onCheckedChange={(checked) => updateChannel('email', checked as boolean)}
            />
            <Label>Email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={channels.slack}
              onCheckedChange={(checked) => updateChannel('slack', checked as boolean)}
            />
            <Label>Slack</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={channels.serviceNow}
              onCheckedChange={(checked) => updateChannel('serviceNow', checked as boolean)}
            />
            <Label>ServiceNow</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={channels.webhook}
              onCheckedChange={(checked) => updateChannel('webhook', checked as boolean)}
            />
            <Label>Custom Webhook</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
