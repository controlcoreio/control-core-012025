
import { useState, useRef, ChangeEvent } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Attachment {
  file: File;
  id: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    const newTotalSize = totalSize + newFiles.reduce((sum, file) => sum + file.size, 0);
    
    if (newTotalSize > MAX_FILE_SIZE) {
      toast({
        title: "File size limit exceeded",
        description: "Total attachment size cannot exceed 5MB.",
        variant: "destructive"
      });
      return;
    }
    
    const newAttachments = newFiles.map(file => ({
      file,
      id: crypto.randomUUID()
    }));
    
    setAttachments([...attachments, ...newAttachments]);
    setTotalSize(newTotalSize);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    const attachmentToRemove = attachments.find(att => att.id === id);
    if (attachmentToRemove) {
      setTotalSize(totalSize - attachmentToRemove.file.size);
      setAttachments(attachments.filter(att => att.id !== id));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // This is where you would actually submit the feedback to your backend
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      
      onOpenChange(false);
      // Reset the form
      setSubject("");
      setDetails("");
      setAttachments([]);
      setTotalSize(0);
    } catch (error) {
      toast({
        title: "Error submitting feedback",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = subject.trim() !== "" && details.trim() !== "";
  const formattedSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Share your thoughts, suggestions, or report an issue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject" className="flex">
              Subject <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="subject"
              placeholder="Enter a brief subject for your feedback"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="details" className="flex">
              Details <span className="text-red-500 ml-1">*</span>
            </Label>
            <textarea
              id="details"
              className="min-h-[120px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Please describe your feedback, suggestion, or issue. Include steps to reproduce if reporting a bug."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="attachments">
              Attachments (Optional)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Attach relevant files (e.g., screenshots). Max 5MB total size.
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept=".png,.jpg,.jpeg,.gif,.pdf,.txt"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                size="sm"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                <span>Add files</span>
              </Button>
              <span className="text-xs text-muted-foreground">
                {formattedSize(totalSize)} of 5MB used
              </span>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((att) => (
                  <div 
                    key={att.id} 
                    className="flex items-center justify-between bg-muted p-2 rounded-md"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Paperclip className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{att.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formattedSize(att.file.size)})
                      </span>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => removeAttachment(att.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your feedback, along with your user identifier (admin@example.com), will be sent to feedback@controlcore.biz.
          </p>
        </div>
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
