"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Deal } from "@/types";
import { 
  Check, 
  X, 
  MessageSquare, 
  Upload, 
  Eye,
  Clock,
  AlertTriangle
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface DealActionsProps {
  deal: Deal;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number, reason?: string) => void;
  onViewDetails?: (dealId: number) => void;
  onMessage?: (dealId: number) => void;
  onSubmitContent?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function DealActions({
  deal,
  onAccept,
  onReject,
  onViewDetails,
  onMessage,
  onSubmitContent,
  isLoading = false,
  className,
}: DealActionsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleAccept = () => {
    onAccept?.(deal.id);
    setShowAcceptDialog(false);
  };

  const handleReject = () => {
    onReject?.(deal.id, rejectionReason);
    setShowRejectDialog(false);
    setRejectionReason("");
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(deal?.campaign?.application_deadline || new Date().toISOString());
  const isUrgent = daysRemaining <= 2 && daysRemaining > 0;
  const isExpired = daysRemaining < 0;

  const getActionButtons = () => {
    switch (deal.status) {
      case "invited":
        if (isExpired) {
          return (
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails?.(deal.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </div>
          );
        }
        
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            {isUrgent && (
              <Badge variant="destructive" className="text-xs mb-2 sm:mb-0">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgent ({daysRemaining} days left)
              </Badge>
            )}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectDialog(true)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAcceptDialog(true)}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
            </div>
          </div>
        );

      case "accepted":
      case "active":
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMessage?.(deal.id)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button
              size="sm"
              onClick={() => onSubmitContent?.()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-1" />
              Submit Content
            </Button>
          </div>
        );

      case "content_submitted":
      case "under_review":
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {deal.status === "content_submitted" ? "Submitted" : "Under Review"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMessage?.(deal.id)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
          </div>
        );

      case "revision_requested":
        return (
          <div className="flex space-x-2">
            <Badge variant="destructive" className="text-xs">
              Revision Required
            </Badge>
            <Button
              size="sm"
              onClick={() => onSubmitContent?.()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Upload className="h-4 w-4 mr-1" />
              Resubmit
            </Button>
          </div>
        );

      case "approved":
      case "completed":
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" />
              {deal.status === "approved" ? "Approved" : "Completed"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(deal.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </div>
        );

      case "rejected":
      case "cancelled":
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="text-xs">
              {deal.status === "rejected" ? "Rejected" : "Cancelled"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(deal.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </div>
        );

      default:
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(deal.id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        );
    }
  };

  return (
    <>
      <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", className)}>
        {getActionButtons()}
      </div>

      {/* Accept Confirmation Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this collaboration deal with{" "}
              <span className="font-semibold">{deal?.campaign?.brand?.name || 'Brand'}</span>?
              <br />
              <br />
              <span className="text-sm text-gray-600">
                Deal Value: ₹{Number(deal?.total_value || 0).toLocaleString()}
                <br />
                Campaign: {deal?.campaign?.title || '—'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Accepting..." : "Accept Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this collaboration deal with{" "}
              <span className="font-semibold">{deal?.campaign?.brand?.name || 'Brand'}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Reason for declining (optional)
            </label>
            <Textarea
              placeholder="Let the brand know why you're declining this opportunity..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading}
            >
              {isLoading ? "Declining..." : "Decline Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}