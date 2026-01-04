import { useState, useEffect } from "react";
import { Star, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EventFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  onSuccess?: () => void;
}

export function EventFeedbackDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  onSuccess,
}: EventFeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      checkExistingFeedback();
    }
  }, [open, user, eventId]);

  const checkExistingFeedback = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("event_feedback")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setExistingFeedback(data);
      setRating(data.rating);
      setFeedback(data.feedback || "");
      setIsAnonymous(data.is_anonymous);
    } else {
      setExistingFeedback(null);
      setRating(0);
      setFeedback("");
      setIsAnonymous(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (existingFeedback) {
        const { error } = await supabase
          .from("event_feedback")
          .update({
            rating,
            feedback: feedback.trim() || null,
            is_anonymous: isAnonymous,
          })
          .eq("id", existingFeedback.id);

        if (error) throw error;
        toast({ title: "Feedback updated successfully!" });
      } else {
        const { error } = await supabase
          .from("event_feedback")
          .insert({
            event_id: eventId,
            user_id: user.id,
            rating,
            feedback: feedback.trim() || null,
            is_anonymous: isAnonymous,
          });

        if (error) throw error;
        toast({ title: "Thank you for your feedback!" });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingFeedback ? "Update Your Feedback" : "Rate This Event"}
          </DialogTitle>
          <DialogDescription>{eventTitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">How would you rate this event?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Your Feedback (Optional)
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience, suggestions, or comments..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {feedback.length}/1000 characters
            </p>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Submit Anonymously</p>
              <p className="text-xs text-muted-foreground">
                Your name won't be shown to others
              </p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <Button type="submit" className="w-full" disabled={submitting || rating === 0}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {existingFeedback ? "Update Feedback" : "Submit Feedback"}
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}