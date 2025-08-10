"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAnalytics } from "@/hooks/use-analytics";
import { CollaborationHistory } from "@/types";
import { Star } from "@/lib/icons";
import { toast } from "sonner";

interface BrandRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration: CollaborationHistory;
  onRatingSubmitted: () => void;
}

export function BrandRatingDialog({
  open,
  onOpenChange,
  collaboration,
  onRatingSubmitted,
}: BrandRatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const { rateBrand } = useAnalytics();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      await rateBrand.mutateAsync({
        dealId: collaboration.id,
        rating,
        review: review.trim() || undefined,
      });
      
      toast.success("Rating submitted successfully!");
      onRatingSubmitted();
      
      // Reset form
      setRating(0);
      setReview("");
      setHoveredRating(0);
    } catch (error) {
      toast.error("Failed to submit rating. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <h3 className="font-semibold mb-1">{collaboration.brand.name}</h3>
            <p className="text-sm text-muted-foreground">
              {collaboration.campaign_title}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 0 && "Click to rate"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review">Review (Optional)</Label>
            <Textarea
              id="review"
              placeholder="Share your experience working with this brand..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || rateBrand.isPending}
              className="flex-1"
            >
              {rateBrand.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}