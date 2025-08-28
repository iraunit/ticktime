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
  HiCheck, 
  HiXMark, 
  HiChatBubbleLeftRight, 
  HiArrowUpTray, 
  HiEye,
  HiClock,
  HiExclamationTriangle,
  HiArrowTopRightOnSquare
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DealActionsProps {
  deal: Deal;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number, reason?: string) => void;
  onViewDetails?: (dealId: number) => void;
  onMessage?: (dealId: number) => void;
  onContentSubmission?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function DealActions({
  deal,
  onAccept,
  onReject,
  onViewDetails,
  onMessage,
  onContentSubmission,
  isLoading = false,
  className,
}: DealActionsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptDeal = async () => {
    if (!onAccept) return;
    
    setIsSubmitting(true);
    try {
      await onAccept(deal.id);
      setShowAcceptDialog(false);
    } catch (error) {
      // Error handling would be done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectDeal = async () => {
    if (!onReject) return;
    
    setIsSubmitting(true);
    try {
      await onReject(deal.id, rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason("");
    } catch (error) {
      // Error handling would be done by parent component
    } finally {
      setIsSubmitting(false);
    }
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

  const renderInvitedActions = () => (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() => setShowAcceptDialog(true)}
        disabled={isLoading}
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 min-w-[120px]"
      >
        <HiCheck className="h-4 w-4 mr-2" />
        Accept Deal
      </Button>
      
      <Button
        variant="outline"
        onClick={() => setShowRejectDialog(true)}
        disabled={isLoading}
        className="border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 shadow-md hover:shadow-lg transition-all duration-200 flex-1 min-w-[120px]"
      >
        <HiXMark className="h-4 w-4 mr-2" />
        Decline
      </Button>
      
      <Button
        variant="outline"
        onClick={() => onViewDetails?.(deal.id)}
        disabled={isLoading}
        className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200"
      >
        <HiEye className="h-4 w-4 mr-2" />
        View Details
      </Button>
      
      <Link href={`/messages?deal_id=${deal.id}`} target="_blank" rel="noopener noreferrer">
        <Button
          variant="ghost"
          disabled={isLoading}
          className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-md hover:shadow-lg transition-all duration-200 w-full"
        >
          <HiChatBubbleLeftRight className="h-4 w-4 mr-2" />
          <span>Message</span>
          <HiArrowTopRightOnSquare className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );

  const renderActiveActions = () => (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={onContentSubmission}
        disabled={isLoading}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 min-w-[150px]"
      >
        <HiArrowUpTray className="h-4 w-4 mr-2" />
        Submit Content
      </Button>
      
      <Button
        variant="outline"
        onClick={() => onViewDetails?.(deal.id)}
        disabled={isLoading}
        className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200"
      >
        <HiEye className="h-4 w-4 mr-2" />
        View Details
      </Button>
      
      <Link href={`/messages?deal_id=${deal.id}`} target="_blank" rel="noopener noreferrer">
        <Button
          variant="ghost"
          disabled={isLoading}
          className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-md hover:shadow-lg transition-all duration-200 w-full"
        >
          <HiChatBubbleLeftRight className="h-4 w-4 mr-2" />
          <span>Message</span>
          <HiArrowTopRightOnSquare className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );

  const renderDefaultActions = () => (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() => onViewDetails?.(deal.id)}
        disabled={isLoading}
        className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 flex-1 min-w-[120px]"
      >
        <HiEye className="h-4 w-4 mr-2" />
        View Details
      </Button>
      
      <Link href={`/messages?deal_id=${deal.id}`} target="_blank" rel="noopener noreferrer">
        <Button
          variant="ghost"
          disabled={isLoading}
          className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-md hover:shadow-lg transition-all duration-200 w-full"
        >
          <HiChatBubbleLeftRight className="h-4 w-4 mr-2" />
          <span>Message</span>
          <HiArrowTopRightOnSquare className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Status-specific actions */}
      {deal.status === "invited" && renderInvitedActions()}
      {deal.status === "active" && renderActiveActions()}
      {(deal.status === "accepted" || 
        deal.status === "content_submitted" || 
        deal.status === "under_review" ||
        deal.status === "revision_requested" ||
        deal.status === "approved" ||
        deal.status === "completed" ||
        deal.status === "rejected" ||
        deal.status === "cancelled") && renderDefaultActions()}

      {/* Accept Confirmation Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-700">
              <HiCheck className="h-5 w-5 mr-2" />
              Accept Deal Invitation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this deal? This action will start your collaboration 
              with <strong>{deal?.campaign?.brand?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
            <h4 className="font-semibold text-green-800 mb-2">What happens next:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• You'll receive detailed campaign briefing</li>
              <li>• Campaign timeline will be activated</li>
              <li>• You can start creating content</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptDeal}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <HiClock className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <HiCheck className="h-4 w-4 mr-2" />
                  Yes, Accept Deal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-700">
              <HiExclamationTriangle className="h-5 w-5 mr-2" />
              Decline Deal Invitation
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this deal. This helps brands understand 
              your preferences for future collaborations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for declining (optional)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px] border-2"
            />
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Declining deals professionally helps maintain good 
                relationships with brands for future opportunities.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectDeal}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <HiClock className="h-4 w-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <HiXMark className="h-4 w-4 mr-2" />
                  Decline Deal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}