"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Eye, 
  Trash2, 
  Plus,
  Clock,
  RotateCcw,
  FileImage,
  FileVideo,
  Globe,
  Calendar,
  Settings
} from "@/lib/icons";
import { Deal } from "@/types";
import { useDeal } from "@/hooks/use-deals";
import { toast } from "sonner";
import { ContentSubmissionModal } from "./content-submission";
import { formatDistanceToNow } from "date-fns";

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
  updated_at: string;
  last_revision_update?: string;
  approved?: boolean | null;
  feedback?: string;
  revision_requested: boolean;
  revision_notes?: string;
  review_count: number;
  review_history?: ReviewHistory[];
}

interface ContentSubmissionsListProps {
  deal: Deal;
  submissions: ContentSubmission[];
  onRefresh: () => void;
}

function ContentSubmissionsList({ deal, submissions, onRefresh }: ContentSubmissionsListProps) {
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<ContentSubmission | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSubmission, setDeletingSubmission] = useState<ContentSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { submitContent, deleteContentSubmission } = useDeal(deal.id);

  const getStatusBadge = (submission: ContentSubmission) => {
    if (submission.approved === true) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (submission.approved === false) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    } else if (submission.revision_requested) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <RotateCcw className="h-3 w-3 mr-1" />
          Revision Requested
        </Badge>
      );
    } else if (submission.last_revision_update) {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          <Clock className="h-3 w-3 mr-1" />
          Resubmitted
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      );
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
      case 'reel':
        return <FileVideo className="h-4 w-4" />;
      case 'image':
      case 'post':
        return <FileImage className="h-4 w-4" />;
      case 'story':
        return <Globe className="h-4 w-4" />;
      default:
        return <FileImage className="h-4 w-4" />;
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

  const handleEdit = (submission: ContentSubmission) => {
    setEditingSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleDelete = (submission: ContentSubmission) => {
    setDeletingSubmission(submission);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingSubmission) return;

    setIsDeleting(true);
    try {
      await deleteContentSubmission.mutateAsync(deletingSubmission.id);
      toast.success('Content submission deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete content submission');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeletingSubmission(null);
    }
  };

  const canEditOrDelete = (submission: ContentSubmission) => {
    return submission.approved !== true; // Can't edit/delete approved submissions
  };

  const canSubmitMore = () => {
    // Allow multiple submissions
    return ['active', 'content_submitted', 'under_review', 'revision_requested'].includes(deal.status);
  };

  if (!canSubmitMore() && submissions.length === 0) {
    return null; // Don't show section if can't submit and no submissions
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
              <FileImage className="h-3 w-3 text-white" />
            </div>
            <span className="text-lg font-bold">Content Submissions</span>
            {submissions.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {submissions.length}
              </Badge>
            )}
          </CardTitle>
          {canSubmitMore() && (
            <Button
              onClick={() => {
                setEditingSubmission(null);
                setShowSubmissionModal(true);
              }}
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Content
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Submitted</h3>
            <p className="text-gray-600 mb-4">
              Submit your content to get started with this collaboration.
            </p>
            {canSubmitMore() && (
              <Button
                onClick={() => {
                  setEditingSubmission(null);
                  setShowSubmissionModal(true);
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit Content
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="border rounded-lg p-4 bg-white/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      {getContentIcon(submission.content_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {submission.title || `${submission.content_type_display} for ${submission.platform_display}`}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {submission.last_revision_update 
                              ? `Updated ${formatDate(submission.last_revision_update)}`
                              : `Submitted ${formatDate(submission.submitted_at)}`
                            }
                          </span>
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {submission.platform_display}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {submission.content_type_display}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(submission)}
                  </div>
                </div>

                {/* Description */}
                {submission.description && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">{submission.description}</p>
                  </div>
                )}

                {/* Caption */}
                {submission.caption && (
                  <div className="mb-3">
                    <h5 className="font-medium text-sm text-gray-900 mb-1">Caption</h5>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {submission.caption}
                    </p>
                  </div>
                )}

                {/* Hashtags */}
                {submission.hashtags && (
                  <div className="mb-3">
                    <h5 className="font-medium text-sm text-gray-900 mb-1">Hashtags</h5>
                    <p className="text-sm text-blue-600">{submission.hashtags}</p>
                  </div>
                )}

                {/* Links */}
                <div className="space-y-2 mb-3">
                  {submission.post_url && (
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
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
                      <Eye className="h-4 w-4 text-gray-400" />
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
                      <h5 className="font-medium text-sm text-gray-900 mb-1">Additional Links</h5>
                      <div className="space-y-1">
                        {submission.additional_links.map((link, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <ExternalLink className="h-3 w-3 text-gray-400" />
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

                {/* Feedback */}
                {submission.feedback && (
                  <div className="mb-3 border-t pt-3">
                    <h5 className="font-medium text-sm text-gray-900 mb-2">Latest Brand Feedback</h5>
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
                  <div className="mb-3 border-t pt-3">
                    <h5 className="font-medium text-sm text-gray-900 mb-2">Review History</h5>
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
                              {formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true })}
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

                {/* Actions */}
                {canEditOrDelete(submission) && (
                  <div className="border-t pt-3">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(submission)}
                        disabled={submission.approved === true}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(submission)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        disabled={submission.approved === true}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Content Submission Modal */}
      <ContentSubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => {
          setShowSubmissionModal(false);
          setEditingSubmission(null);
        }}
        deal={deal}
        editingSubmission={editingSubmission}
        onSuccess={() => {
          onRefresh();
          setShowSubmissionModal(false);
          setEditingSubmission(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this content submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export { ContentSubmissionsList };
export default ContentSubmissionsList;
