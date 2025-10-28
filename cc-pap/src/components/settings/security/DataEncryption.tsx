import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lock, Upload, Shield, Key } from "lucide-react";
import { SecureForm } from "@/components/ui/secure-form";
import { InputValidator } from "@/utils/inputValidation";
import { useState } from "react";

export function DataEncryption() {
  const [keyId, setKeyId] = useState("");
  const [keyIdError, setKeyIdError] = useState("");

  const handleKeyIdChange = (value: string) => {
    setKeyId(value);
    const validation = InputValidator.sanitizeText(value);
    setKeyId(validation);
    
    if (value && value.length > 0) {
      const urlValidation = InputValidator.validateURL(value);
      if (!urlValidation.isValid) {
        setKeyIdError(urlValidation.error || "Invalid key ID format");
      } else {
        setKeyIdError("");
      }
    } else {
      setKeyIdError("");
    }
  };

  const handleBYOKSubmit = async (data: any) => {
    console.log("BYOK configuration:", data);
    // Implementation would handle the actual configuration
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              Data at Rest Encryption
            </CardTitle>
            <CardDescription>Configure encryption for stored data including policies and audit logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="policy-store-encryption">Policy Store Encryption</Label>
              <div className="flex items-center gap-2">
                <Switch id="policy-store-encryption" defaultChecked />
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">AES-256</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="audit-log-encryption">Audit Log Encryption</Label>
              <div className="flex items-center gap-2">
                <Switch id="audit-log-encryption" defaultChecked />
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">AES-256</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="backup-encryption">Backup Encryption</Label>
              <div className="flex items-center gap-2">
                <Switch id="backup-encryption" defaultChecked />
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">AES-256</Badge>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Key Management
              </h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Current Key:</span>
                  <span className="font-mono">key-2024-06-02-***</span>
                </div>
                <div className="flex justify-between">
                  <span>Key Rotation:</span>
                  <span>Every 90 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Next Rotation:</span>
                  <span>Aug 30, 2024</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline">Rotate Now</Button>
                <Button size="sm" variant="outline">Configure BYOK</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Data in Transit Encryption
            </CardTitle>
            <CardDescription>Configure TLS/SSL encryption for all platform communications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="tls-mandatory">Mandatory TLS</Label>
              <div className="flex items-center gap-2">
                <Switch id="tls-mandatory" defaultChecked />
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">TLS 1.3</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="client-cert-auth">Client Certificate Authentication</Label>
              <Switch id="client-cert-auth" />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="perfect-forward-secrecy">Perfect Forward Secrecy</Label>
              <Switch id="perfect-forward-secrecy" defaultChecked />
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Certificate Status</h4>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Primary Certificate:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Valid</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Expires:</span>
                  <span>Dec 15, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span>Issuer:</span>
                  <span>Let's Encrypt</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Certificate
                </Button>
                <Button size="sm" variant="outline">Renew</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bring Your Own Key (BYOK) Configuration</CardTitle>
          <CardDescription>Use your own encryption keys from external Key Management Services</CardDescription>
        </CardHeader>
        <CardContent>
          <SecureForm onSubmit={handleBYOKSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kms-provider">KMS Provider</Label>
                  <select name="kms-provider" className="w-full p-2 border rounded-md">
                    <option value="">Select KMS Provider</option>
                    <option value="aws-kms">AWS KMS</option>
                    <option value="azure-keyvault">Azure Key Vault</option>
                    <option value="gcp-kms">Google Cloud KMS</option>
                    <option value="hashicorp-vault">HashiCorp Vault</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key-id">Key ID/ARN</Label>
                  <Input 
                    id="key-id" 
                    name="key-id"
                    value={keyId}
                    onChange={(e) => handleKeyIdChange(e.target.value)}
                    placeholder="arn:aws:kms:region:account:key/..." 
                    className={keyIdError ? "border-red-500" : ""}
                  />
                  {keyIdError && (
                    <p className="text-sm text-red-600">{keyIdError}</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">BYOK Status</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  External key management is not currently configured. Platform is using internally managed keys.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Security Considerations</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• BYOK requires proper IAM permissions in your cloud provider</li>
                  <li>• Key rotation policies should be aligned with your security requirements</li>
                  <li>• Backup and disaster recovery procedures must account for external key dependencies</li>
                  <li>• Monitor key access logs in your KMS provider for security auditing</li>
                </ul>
              </div>
            </div>
          </SecureForm>
        </CardContent>
      </Card>
    </div>
  );
}
