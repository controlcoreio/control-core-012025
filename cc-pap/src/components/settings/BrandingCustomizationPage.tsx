
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Upload, X, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { InputValidator } from "@/utils/inputValidation";
import { SecureStorage } from "@/utils/secureStorage";
import { ErrorHandler } from "@/utils/errorHandling";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function BrandingCustomizationPage() {
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Enhanced file validation with MIME type checking
      const allowedTypes = ['image/png', 'image/svg+xml'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      const fileValidation = InputValidator.validateFile(file, allowedTypes, maxSize);
      if (!fileValidation.isValid) {
        const error = ErrorHandler.createSecureError(
          { name: 'ValidationError', message: fileValidation.error },
          'file-upload'
        );
        toast({
          title: "Invalid file",
          description: error.userMessage,
          variant: "destructive",
        });
        return;
      }

      // Additional security check for SVG files
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          // Basic check for potentially dangerous SVG content
          if (content.includes('<script') || content.includes('javascript:') || content.includes('onload=')) {
            const error = ErrorHandler.createSecureError(
              { name: 'SecurityError', message: 'SVG contains potentially unsafe content' },
              'file-upload'
            );
            toast({
              title: "Security check failed",
              description: "SVG file contains potentially unsafe content",
              variant: "destructive",
            });
            return;
          }
          
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        };
        reader.readAsText(file);
      } else {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    } catch (error) {
      const secureError = ErrorHandler.createSecureError(error, 'file-upload');
      toast({
        title: "File processing failed",
        description: secureError.userMessage,
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = () => {
    if (!selectedFile) return;

    try {
      // Create a secure URL for the logo
      const url = URL.createObjectURL(selectedFile);
      setCurrentLogo(url);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Store securely with encryption and TTL
      SecureStorage.setItem('companyLogo', url, 30 * 24 * 60 * 60 * 1000); // 30 days
      
      toast({
        title: "Logo updated",
        description: "Your company logo has been successfully updated.",
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const secureError = ErrorHandler.createSecureError(error, 'logo-save');
      toast({
        title: "Save failed",
        description: secureError.userMessage,
        variant: "destructive",
      });
    }
  };

  const handleRemoveLogo = () => {
    try {
      setCurrentLogo(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      SecureStorage.removeItem('companyLogo');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Logo removed",
        description: "Your company logo has been removed.",
      });
      
      setShowRemoveDialog(false);
    } catch (error) {
      const secureError = ErrorHandler.createSecureError(error, 'logo-remove');
      toast({
        title: "Remove failed",
        description: secureError.userMessage,
        variant: "destructive",
      });
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  // Load saved logo on component mount
  useState(() => {
    try {
      const savedLogo = SecureStorage.getItem('companyLogo');
      if (savedLogo) {
        setCurrentLogo(savedLogo);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'logo-load');
    }
  });

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Image className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Branding & Customization</h1>
          <p className="text-muted-foreground">
            Personalize your platform experience by uploading your company's logo and customizing visual elements
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>
            Upload your company's logo (PNG or SVG with transparent background recommended) to be displayed on the platform UI and reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Logo Display */}
          {currentLogo && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Logo:</Label>
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="w-16 h-16 border rounded bg-background flex items-center justify-center overflow-hidden">
                  <img 
                    src={currentLogo} 
                    alt="Company Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Currently active logo</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRemoveDialog(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Logo
                </Button>
              </div>
            </div>
          )}

          {/* Upload Control */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-upload" className="text-sm font-medium">
                Upload New Logo (PNG or SVG)
              </Label>
              <p className="text-sm text-muted-foreground">
                Supported formats: .png, .svg (transparent background recommended for best integration). Max file size: 5MB. SVG files are automatically scanned for security.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.svg,image/png,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
            />

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleChooseFile}>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {selectedFile && (
                <span className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                </span>
              )}
            </div>
          </div>

          {/* Live Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="w-20 h-20 border rounded bg-background flex items-center justify-center overflow-hidden mx-auto">
                  <img 
                    src={previewUrl} 
                    alt="Logo Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  This is how your logo will appear
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          {selectedFile && (
            <div className="flex justify-end">
              <Button onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Logo Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Company Logo?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your company logo? This will remove it from all platform locations including the header and reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveLogo} className="bg-red-600 hover:bg-red-700">
              Remove Logo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}