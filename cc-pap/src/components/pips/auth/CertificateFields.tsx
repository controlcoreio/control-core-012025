import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, AlertCircle, Upload } from "lucide-react";

interface CertificateFieldsProps {
  certificate: string;
  privateKey: string;
  passphrase?: string;
  onCertificateChange: (value: string) => void;
  onPrivateKeyChange: (value: string) => void;
  onPassphraseChange?: (value: string) => void;
  showPassphrase?: boolean;
}

export function CertificateFields({ 
  certificate,
  privateKey,
  passphrase = "",
  onCertificateChange,
  onPrivateKeyChange,
  onPassphraseChange,
  showPassphrase = true
}: CertificateFieldsProps) {
  const handleCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onCertificateChange(content);
      };
      reader.readAsText(file);
    }
  };

  const handlePrivateKeyUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onPrivateKeyChange(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background border-purple-200 dark:border-purple-800">
      <h5 className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Client Certificate Configuration
      </h5>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cert-certificate" className="text-sm font-medium">Client Certificate</Label>
          <Textarea 
            id="cert-certificate"
            placeholder="-----BEGIN CERTIFICATE-----&#10;Your certificate content here&#10;-----END CERTIFICATE-----"
            value={certificate}
            onChange={(e) => onCertificateChange(e.target.value)}
            className="w-full font-mono text-xs"
            rows={6}
          />
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pem,.crt,.cer"
              className="hidden"
              id="cert-upload"
              onChange={handleCertificateUpload}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('cert-upload')?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload Certificate
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">or paste certificate content above</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cert-private-key" className="text-sm font-medium">Private Key</Label>
          <Textarea 
            id="cert-private-key"
            placeholder="-----BEGIN PRIVATE KEY-----&#10;Your private key content here&#10;-----END PRIVATE KEY-----"
            value={privateKey}
            onChange={(e) => onPrivateKeyChange(e.target.value)}
            className="w-full font-mono text-xs"
            rows={6}
          />
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pem,.key"
              className="hidden"
              id="key-upload"
              onChange={handlePrivateKeyUpload}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('key-upload')?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload Private Key
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">or paste private key content above</p>
          </div>
        </div>
        
        {showPassphrase && (
          <div className="space-y-2">
            <Label htmlFor="cert-passphrase" className="text-sm font-medium">Passphrase (Optional)</Label>
            <Input 
              id="cert-passphrase"
              type="password"
              placeholder="Enter passphrase if key is encrypted"
              value={passphrase}
              onChange={(e) => onPassphraseChange?.(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Required only if your private key is encrypted
            </p>
          </div>
        )}
        
        <Alert className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
          <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <AlertDescription className="text-purple-800 dark:text-purple-200">
            <div className="space-y-1">
              <p className="text-sm"><strong>Certificate Security:</strong></p>
              <ul className="text-xs list-disc list-inside space-y-1">
                <li>Certificates are encrypted before storage</li>
                <li>Private keys never leave the server</li>
                <li>Use certificate-based auth for highest security</li>
                <li>Ensure certificates are valid and not expired</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
