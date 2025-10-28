import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fingerprint, Plus, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { APP_CONFIG } from "@/config/app";
import { SecureStorage } from "@/utils/secureStorage";

interface Passkey {
  id: number;
  name: string;
  credential_id: string;
  created_at: string;
  last_used: string | null;
  counter: number;
}

export default function PasskeyManagement() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();

  // Load existing passkeys
  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    try {
      setIsLoading(true);
      const token = SecureStorage.getItem('access_token');
      
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth0/passkeys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPasskeys(data);
      }
    } catch (error) {
      console.error('Failed to load passkeys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerPasskey = async () => {
    if (!newPasskeyName.trim()) {
      setError("Please enter a name for your passkey.");
      return;
    }

    try {
      setIsRegistering(true);
      setError("");
      setSuccess("");

      // Check if WebAuthn is supported
      if (!navigator.credentials || !navigator.credentials.create) {
        throw new Error('Passkey registration is not supported in this browser.');
      }

      // Get challenge from backend
      const token = SecureStorage.getItem('access_token');
      const challengeResponse = await fetch(`${APP_CONFIG.api.baseUrl}/auth0/passkeys/register/challenge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPasskeyName })
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get registration challenge');
      }

      const challengeData = await challengeResponse.json();

      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(challengeData.challenge),
          rp: {
            name: "Control Core",
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(challengeData.user.id),
            name: challengeData.user.name,
            displayName: challengeData.user.display_name,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
            requireResidentKey: true,
          },
          timeout: 60000,
          attestation: "direct"
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Passkey registration was cancelled');
      }

      // Register credential with backend
      const response = credential.response as AuthenticatorAttestationResponse;
      const registrationData = {
        credential_id: challengeData.credential_id,
        name: newPasskeyName,
        public_key: Array.from(new Uint8Array(response.getPublicKey()!)),
        attestation_object: Array.from(new Uint8Array(response.attestationObject)),
        client_data_json: Array.from(new Uint8Array(response.clientDataJSON)),
        counter: 0
      };

      const registerResponse = await fetch(`${APP_CONFIG.api.baseUrl}/auth0/passkeys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      if (!registerResponse.ok) {
        throw new Error('Failed to register passkey');
      }

      setSuccess("Passkey registered successfully!");
      setNewPasskeyName("");
      loadPasskeys(); // Reload the list
      
    } catch (error: any) {
      setError(error.message || "Failed to register passkey. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const deletePasskey = async (passkeyId: number) => {
    if (!confirm("Are you sure you want to delete this passkey? This action cannot be undone.")) {
      return;
    }

    try {
      const token = SecureStorage.getItem('access_token');
      
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth0/passkeys/${passkeyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete passkey');
      }

      setSuccess("Passkey deleted successfully!");
      loadPasskeys(); // Reload the list
      
    } catch (error: any) {
      setError(error.message || "Failed to delete passkey. Please try again.");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Passkey Management</h2>
        <p className="text-muted-foreground">
          Manage your WebAuthn passkeys for secure, passwordless authentication.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Register New Passkey */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Register New Passkey
          </CardTitle>
          <CardDescription>
            Create a new passkey for secure, passwordless authentication using your device's biometrics or security key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passkey-name">Passkey Name</Label>
            <Input
              id="passkey-name"
              placeholder="e.g., iPhone, MacBook Pro, Security Key"
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              disabled={isRegistering}
            />
          </div>
          
          <Button 
            onClick={registerPasskey} 
            disabled={isRegistering || !newPasskeyName.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isRegistering ? "Registering..." : "Register Passkey"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Passkeys */}
      <Card>
        <CardHeader>
          <CardTitle>Your Passkeys</CardTitle>
          <CardDescription>
            Manage your registered passkeys. You can delete passkeys you no longer use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading passkeys...</div>
          ) : passkeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No passkeys registered yet. Register your first passkey above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Usage Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passkeys.map((passkey) => (
                  <TableRow key={passkey.id}>
                    <TableCell className="font-medium">{passkey.name}</TableCell>
                    <TableCell>{formatDate(passkey.created_at)}</TableCell>
                    <TableCell>{formatDate(passkey.last_used)}</TableCell>
                    <TableCell>{passkey.counter}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePasskey(passkey.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Passkeys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">What are passkeys?</h4>
            <p className="text-sm text-muted-foreground">
              Passkeys are a modern, secure way to sign in without passwords. They use your device's built-in 
              security features like fingerprint readers, face recognition, or security keys.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Benefits</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• No passwords to remember or manage</li>
              <li>• Protection against phishing attacks</li>
              <li>• Works across your devices when synced</li>
              <li>• Faster and more convenient than passwords</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Browser Support</h4>
            <p className="text-sm text-muted-foreground">
              Passkeys work in Chrome, Safari, Firefox, and Edge on desktop and mobile devices. 
              Make sure you're using a supported browser and have biometric authentication enabled.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
