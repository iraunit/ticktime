"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {HiStar} from "react-icons/hi2";
import {toast} from "@/lib/toast";

interface RatingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dealId: number;
    targetName: string; // Name of the brand or influencer being rated
    ratingType: "brand" | "influencer"; // Whether rating a brand or influencer
    onRatingSubmitted?: () => void;
}

export function RatingDialog({
                                 open,
                                 onOpenChange,
                                 dealId,
                                 targetName,
                                 ratingType,
                                 onRatingSubmitted,
                             }: RatingDialogProps) {
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleSubmit = async () => {
        if (!rating) {
            toast.error("Please select a rating");
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = ratingType === "brand"
                ? `/deals/${dealId}/rate-brand/`
                : `/deals/${dealId}/rate-influencer/`;

            const {api} = await import("@/lib/api");
            await api.post(endpoint, {
                rating,
                review: review.trim(),
            });

            toast.success(
                `${ratingType === "brand" ? "Brand" : "Influencer"} rated successfully!`
            );
            onOpenChange(false);
            onRatingSubmitted?.();

            // Reset form
            setRating(5);
            setReview("");
        } catch (error: any) {
            // Interceptor already toasts the exact backend error via data.error
            // Keep console for debugging and avoid overriding the precise message
            console.error("Failed to submit rating:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Rate {ratingType === "brand" ? "Brand" : "Influencer"}
                    </DialogTitle>
                    <DialogDescription>
                        Share your experience working with {targetName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Rating Stars */}
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <HiStar
                                        className={`w-10 h-10 transition-colors ${
                                            star <= (hoveredRating || rating)
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-gray-300"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500">
                            {rating === 1 && "Poor"}
                            {rating === 2 && "Fair"}
                            {rating === 3 && "Good"}
                            {rating === 4 && "Very Good"}
                            {rating === 5 && "Excellent"}
                        </p>
                    </div>

                    {/* Review Text */}
                    <div className="space-y-2">
                        <Label htmlFor="review">Review (Optional)</Label>
                        <Textarea
                            id="review"
                            placeholder={`Share your experience working with ${targetName}...`}
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            rows={4}
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500 text-right">
                            {review.length}/500 characters
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Rating"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

