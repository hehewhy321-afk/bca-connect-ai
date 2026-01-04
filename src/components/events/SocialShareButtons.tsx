import { Facebook, Twitter, Linkedin, Send, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SocialShareButtonsProps {
  title: string;
  description?: string | null;
  url?: string;
}

export function SocialShareButtons({ title, description, url }: SocialShareButtonsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || "Check out this event!");

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Event link has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-sm font-semibold text-muted-foreground">Share this event</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare("facebook")}
          className="hover:bg-blue-600 hover:text-white hover:border-blue-600"
          title="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare("twitter")}
          className="hover:bg-sky-500 hover:text-white hover:border-sky-500"
          title="Share on Twitter/X"
        >
          <Twitter className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare("linkedin")}
          className="hover:bg-blue-700 hover:text-white hover:border-blue-700"
          title="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare("whatsapp")}
          className="hover:bg-green-500 hover:text-white hover:border-green-500"
          title="Share on WhatsApp"
        >
          <Send className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyLink}
          className={copied ? "bg-green-500 text-white border-green-500" : ""}
          title="Copy link"
        >
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}