"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Deal} from "@/types";
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    ExternalLink,
    Eye,
    MessageSquare,
    RotateCcw,
    Star,
    ThumbsDown,
    ThumbsUp,
    XCircle
} from "@/lib/icons";
import {getPlatformConfig} from "@/lib/platform-config";
import {getContentTypeConfig} from "@/lib/icon-config";

// Extended interface for brand deal management
interface BrandDeal {
    id: number;
    campaign: Deal['campaign'];
    influencer?: {
        id: number;
        username: string;
        full_name?: string;
    };
    status: Deal['status'];
    invited_at: string;
    responded_at?: string;
    completed_at?: string;
    rejection_reason?: string;
    total_value: number;
    payment_status?: 'pending' | 'processing' | 'completed' | 'failed';
    shipping_address?: Deal['shipping_address'];
    tracking_number?: string;
    tracking_url?: string;
    shipped_at?: string;
    delivered_at?: string;
    address_requested_at?: string;
    address_provided_at?: string;
    shortlisted_at?: string;
    notes?: string;
}

interface ReviewHistory {
    id: number;
    action: string;
    action_display: string;
    feedback: string;
    revision_notes: string;
    reviewed_at: string;
    reviewed_by_username: string;
}

interface ContentSubmission {
    id: number;
    platform: string;
    platform_display: string;
    content_type: string;
    content_type_display: string;
    title?: string;
    description?: string;
    file_url?: string;
    post_url?: string;
    caption?: string;
    hashtags?: string;
    additional_links?: Array<{ url: string; description: string }>;
    submitted_at: string;
    approved?: boolean | null;
    feedback?: string;
    revision_requested: boolean;
    revision_notes?: string;
    review_count: number;
    status_display: string;
    review_history?: ReviewHistory[];
}

interface ContentReviewProps {
    deal: BrandDeal;
    submissions: ContentSubmission[];
    onReview: (submissionId: number, action: 'approve' | 'reject' | 'request_revision', feedback?: string, revisionNotes?: string) => Promise<void>;
    isLoading?: boolean;
}

const reviewSchema = z.object({
    action: z.enum(['approve', 'reject', 'request_revision']),
    feedback: z.string().optional(),
    revision_notes: z.string().optional(),
}).refine((data) => {
    if ((data.action === 'reject' || data.action === 'request_revision') && !data.feedback) {
        return false;
    }
    if (data.action === 'request_revision' && !data.revision_notes) {
        return false;
    }
    return true;
}, {
    message: "Feedback is required for reject/revision actions, and revision notes are required for revision requests"
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export function ContentReview({deal, submissions, onReview, isLoading}: ContentReviewProps) {
    const [selectedSubmission, setSelectedSubmission] = useState<ContentSubmission | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const form = useForm<ReviewFormData>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            action: 'approve',
            feedback: '',
            revision_notes: '',
        },
    });

    const handleReviewSubmission = (submission: ContentSubmission) => {
        setSelectedSubmission(submission);
        setShowReviewModal(true);
        form.reset({
            action: 'approve',
            feedback: '',
            revision_notes: '',
        });
    };

    const onSubmitReview = async (data: ReviewFormData) => {
        if (!selectedSubmission) return;

        try {
            await onReview(
                selectedSubmission.id,
                data.action,
                data.feedback,
                data.revision_notes
            );
            setShowReviewModal(false);
            setSelectedSubmission(null);
            form.reset();
        } catch (error) {
            console.error('Failed to submit review:', error);
        }
    };

    const getStatusBadge = (submission: ContentSubmission) => {
        if (submission.approved === true) {
            return (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1"/>
                    Approved
                </Badge>
            );
        } else if (submission.approved === false) {
            return (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                    <XCircle className="h-3 w-3 mr-1"/>
                    Rejected
                </Badge>
            );
        } else if (submission.revision_requested) {
            return (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    <RotateCcw className="h-3 w-3 mr-1"/>
                    Revision Requested
                </Badge>
            );
        } else {
            return (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <AlertCircle className="h-3 w-3 mr-1"/>
                    Under Review
                </Badge>
            );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (submissions.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Submissions</h3>
                        <p className="text-gray-600">
                            The influencer hasn't submitted any content for this campaign yet.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Deal Info Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                        <div
                            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Star className="h-5 w-5 text-white"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{deal.campaign?.title}</h2>
                            <p className="text-sm text-gray-600">
                                Content Review - {deal.influencer?.username}
                            </p>
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Content Submissions */}
            <div className="grid gap-6">
                {submissions.map((submission) => (
                    <Card key={submission.id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-8 h-8 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                                        {(() => {
                                            const config = getContentTypeConfig(submission.content_type);
                                            const Icon = config.icon;
                                            return <Icon className={`h-4 w-4 ${config.color}`}/>;
                                        })()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">
                                            {submission.title || `${submission.content_type_display} for ${submission.platform_display}`}
                                        </h3>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3"/>
                        <span>{formatDate(submission.submitted_at)}</span>
                      </span>
                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                {(() => {
                                                    const config = getPlatformConfig(submission.platform);
                                                    const Icon = config?.icon;
                                                    return (
                                                        <>
                                                            {Icon && <Icon className="w-3 h-3"/>}
                                                            <span>{submission.platform_display}</span>
                                                        </>
                                                    );
                                                })()}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                {(() => {
                                                    const config = getContentTypeConfig(submission.content_type);
                                                    const Icon = config.icon;
                                                    return (
                                                        <>
                                                            <Icon className="w-3 h-3"/>
                                                            <span>{submission.content_type_display}</span>
                                                        </>
                                                    );
                                                })()}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {getStatusBadge(submission)}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Description */}
                            {submission.description && (
                                <div>
                                    <h4 className="font-medium text-sm text-gray-900 mb-1">Description</h4>
                                    <p className="text-sm text-gray-700">{submission.description}</p>
                                </div>
                            )}

                            {/* Caption */}
                            {submission.caption && (
                                <div>
                                    <h4 className="font-medium text-sm text-gray-900 mb-1">Caption</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        {submission.caption}
                                    </p>
                                </div>
                            )}

                            {/* Hashtags */}
                            {submission.hashtags && (
                                <div>
                                    <h4 className="font-medium text-sm text-gray-900 mb-1">Hashtags</h4>
                                    <p className="text-sm text-blue-600">{submission.hashtags}</p>
                                </div>
                            )}

                            {/* Links */}
                            <div className="space-y-2">
                                {submission.post_url && (
                                    <div className="flex items-center space-x-2">
                                        <ExternalLink className="h-4 w-4 text-gray-400"/>
                                        <a
                                            href={submission.post_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            View Post
                                        </a>
                                    </div>
                                )}

                                {submission.file_url && (
                                    <div className="flex items-center space-x-2">
                                        <Eye className="h-4 w-4 text-gray-400"/>
                                        <a
                                            href={submission.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            View File
                                        </a>
                                    </div>
                                )}

                                {submission.additional_links && submission.additional_links.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900 mb-2">Additional Links</h4>
                                        <div className="space-y-1">
                                            {submission.additional_links.map((link, index) => (
                                                <div key={index}
                                                     className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                                    <ExternalLink className="h-3 w-3 text-gray-400"/>
                                                    <a
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        {link.description}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Previous Feedback */}
                            {submission.feedback && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-sm text-gray-900 mb-2">Previous Feedback</h4>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-sm text-yellow-800">{submission.feedback}</p>
                                        {submission.revision_notes && (
                                            <div className="mt-2 pt-2 border-t border-yellow-200">
                                                <p className="text-xs font-medium text-yellow-900">Revision Notes:</p>
                                                <p className="text-sm text-yellow-800">{submission.revision_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Review History */}
                            {submission.review_history && submission.review_history.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-sm text-gray-900 mb-2">Review History</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {submission.review_history.map((review, index) => (
                                            <div
                                                key={review.id}
                                                className={`p-3 rounded-lg border ${
                                                    review.action === 'approve'
                                                        ? 'bg-green-50 border-green-200'
                                                        : review.action === 'reject'
                                                            ? 'bg-red-50 border-red-200'
                                                            : 'bg-orange-50 border-orange-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            variant={
                                                                review.action === 'approve'
                                                                    ? 'secondary'
                                                                    : review.action === 'reject'
                                                                        ? 'destructive'
                                                                        : 'outline'
                                                            }
                                                            className={`text-xs ${
                                                                review.action === 'approve'
                                                                    ? 'bg-green-100 text-green-800 border-green-200'
                                                                    : review.action === 'reject'
                                                                        ? ''
                                                                        : 'bg-orange-100 text-orange-800 border-orange-200'
                                                            }`}
                                                        >
                                                            {review.action_display}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                             by {review.reviewed_by_username}
                                                         </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                         {new Date(review.reviewed_at).toLocaleDateString("en-US", {
                                                             month: "short",
                                                             day: "numeric",
                                                             hour: "2-digit",
                                                             minute: "2-digit",
                                                         })}
                                                     </span>
                                                </div>
                                                {review.feedback && (
                                                    <p className="text-xs text-gray-700 mt-1">{review.feedback}</p>
                                                )}
                                                {review.revision_notes && (
                                                    <p className="text-xs text-gray-600 mt-1 italic">
                                                        Revision: {review.revision_notes}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Review Actions */}
                            {submission.approved === null || submission.revision_requested ? (
                                <div className="border-t pt-4">
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReviewSubmission(submission)}
                                            disabled={isLoading}
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2"/>
                                            Review
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Review completed ({submission.review_count} review{submission.review_count !== 1 ? 's' : ''})
                    </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleReviewSubmission(submission)}
                                            disabled={isLoading}
                                        >
                                            Update Review
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Review Modal */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Review Content Submission</DialogTitle>
                        <DialogDescription>
                            Provide your review for this content submission
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitReview)} className="space-y-4">
                            {/* Action Selection */}
                            <FormField
                                control={form.control}
                                name="action"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Review Action</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select action"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="approve">
                                                    <div className="flex items-center space-x-2">
                                                        <ThumbsUp className="h-4 w-4 text-green-600"/>
                                                        <span>Approve</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="request_revision">
                                                    <div className="flex items-center space-x-2">
                                                        <RotateCcw className="h-4 w-4 text-orange-600"/>
                                                        <span>Request Revision</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="reject">
                                                    <div className="flex items-center space-x-2">
                                                        <ThumbsDown className="h-4 w-4 text-red-600"/>
                                                        <span>Reject</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {/* Feedback */}
                            <FormField
                                control={form.control}
                                name="feedback"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>
                                            Feedback
                                            {(form.watch("action") === "reject" || form.watch("action") === "request_revision") && (
                                                <span className="text-red-500 ml-1">*</span>
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Provide your feedback..."
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {/* Revision Notes */}
                            {form.watch("action") === "request_revision" && (
                                <FormField
                                    control={form.control}
                                    name="revision_notes"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>
                                                Revision Notes
                                                <span className="text-red-500 ml-1">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Specific instructions for revision..."
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            )}
                        </form>
                    </Form>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowReviewModal(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            onClick={form.handleSubmit(onSubmitReview)}
                            disabled={isLoading}
                        >
                            {isLoading ? "Submitting..." : "Submit Review"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
