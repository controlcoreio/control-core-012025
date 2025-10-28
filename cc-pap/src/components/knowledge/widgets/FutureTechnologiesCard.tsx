import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FutureTechnologiesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Future Technologies
          <Badge className="ml-2 bg-yellow-400 text-black px-2">Coming Soon</Badge>
        </CardTitle>
        <CardDescription>
          Upcoming support for new authorization models and platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <img
            src="https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png"
            alt="AWS Logo"
            className="w-10 h-10 rounded bg-white border"
            loading="lazy"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">AWS Cedar Support</span>
              <Badge variant="outline" className="bg-yellow-200 text-yellow-900 ml-2">Coming Soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Native ReBAC policy engine from AWS. Enables fine-grained, scalable authorization using resource relationships.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
            alt="Google Logo"
            className="w-10 h-10 rounded bg-white border"
            loading="lazy"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">Google Zanzibar ReBAC</span>
              <Badge variant="outline" className="bg-yellow-200 text-yellow-900 ml-2">Coming Soon</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Globally consistent, relationship-based access control for large-scale systems inspired by Zanzibar.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
